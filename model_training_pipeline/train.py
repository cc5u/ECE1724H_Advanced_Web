"""
Training entry point: creates a new SentimentClassifier per run, tracks validation
loss per epoch, and saves the best model state to Redis for the given user_id and
training_session_id. Each user/session trains its own model, so multiple users can
train concurrently.
"""

import io
from typing import Any
from tqdm import tqdm

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from model_training_pipeline.evaluation import evaluate

from model_training_pipeline.classify_model import Classifier
from database.redis_client import *
from model_training_pipeline.model_config import TrainingConfig, ClassifierConfig, EmbedModelConfig, ModelConfig
from transformers import get_linear_schedule_with_warmup


def _validation_metrics(
    model: nn.Module,
    val_loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> tuple[float, float]:
    """Compute average validation loss and accuracy."""
    
    model.eval()
    total_loss = 0.0
    total_correct = 0
    total_samples = 0

    with torch.no_grad():
        for batch in val_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(input_ids, attention_mask)  # logits

            loss = criterion(outputs, labels)

            # accumulate loss
            total_loss += loss.item() * labels.size(0)

            # predictions
            preds = torch.argmax(outputs, dim=1)

            # count correct predictions
            total_correct += (preds == labels).sum().item()

            total_samples += labels.size(0)

    avg_loss = total_loss / total_samples if total_samples else float("inf")
    accuracy = total_correct / total_samples if total_samples else 0.0

    return avg_loss, accuracy


def run_training(
    train_loader: DataLoader,
    val_loader: DataLoader,
    test_loader: DataLoader,
    user_id: str,
    training_session_id: str,
    training_config: TrainingConfig = TrainingConfig(),
    classifier_config: ClassifierConfig = ClassifierConfig(),
    embed_model_config: EmbedModelConfig = EmbedModelConfig(),
) -> dict[str, Any]:
    """
    Create a new SentimentClassifier, train it, and save the best state (by
    validation loss) to Redis for this user_id and training_session_id.
    Multiple users can call this concurrently; each has its own model instance.
    """

    if get_training_status(user_id, training_session_id) is True:
        return {"status": "error", "error": "Training already in progress"}
    
    save_training_status(user_id, training_session_id, True)    
    save_training_config(user_id, training_session_id, ModelConfig(classifier_config=classifier_config, embed_model_config=embed_model_config))

    try:
        print("STARTING TRAINING")
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        embed_model = load_embed_model(embed_model_config)

        # New instance per training run (no shared global model).
        model = Classifier(embed_model, classifier_config).to(device)

        # Optimizer and scheduler
        optimizer = torch.optim.AdamW(model.parameters(), lr=training_config.learning_rate, weight_decay=0.01)
        scheduler = get_linear_schedule_with_warmup(
            optimizer, 
            num_warmup_steps=int(0.1 * training_config.n_epochs * len(train_loader)),
            num_training_steps=training_config.n_epochs * len(train_loader)
        )

        # Loss function
        criterion = nn.CrossEntropyLoss()

        # Tracking the best model state and accuracy
        best_val_acc = float("-inf")
        best_state_dict = None

        # --- EARLY STOPPING SETUP ---
        patience = 8               # How many evaluation steps to wait before stopping
        steps_no_improve = 0       # Counter for steps without improvement
        early_stop_triggered = False # Flag to break the outer epoch loop
        # ----------------------------

        # Per-epoch curves for plotting (train/val error = loss, train/val acc)
        train_err: list[float] = []
        val_err: list[float] = []
        train_acc_list: list[float] = []
        val_acc_list: list[float] = []
        
        # Evaluate every 1/4 of the epoch
        global_step = 0
        eval_step = max(1, int(len(train_loader) / training_config.eval_step))

        for epoch in range(training_config.n_epochs):
            print(f"Epoch {epoch+1}/{training_config.n_epochs}")
            model.train()
            # Set bert model to eval mode if fine_tune_mode is "freeze_all"
            if embed_model_config.fine_tune_mode == "freeze_all":
                model.bert_model.eval()

            total_train_loss = 0.0
            n_train = 0
            train_acc = 0.0
            for batch in tqdm(train_loader, total=len(train_loader)):
                global_step += 1
                if get_training_status(user_id, training_session_id) is False:
                    return {"status": "error", "error": "Training interrupted"}
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)
                optimizer.zero_grad()
                outputs = model(input_ids, attention_mask)
                loss = criterion(outputs, labels)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.5)
                optimizer.step()
                scheduler.step()
                total_train_loss += loss.item() * labels.size(0)
                n_train += labels.size(0)
                train_acc += (outputs.argmax(dim=1) == labels).sum().item()
            
                if global_step % eval_step == 0:
                    current_train_loss = total_train_loss / n_train if n_train else 0.0
                    current_train_acc = train_acc / n_train if n_train else 0.0
                    current_val_loss, current_val_acc = _validation_metrics(model, val_loader, criterion, device)
                    model.train()
                    if embed_model_config.fine_tune_mode == "freeze_all":
                        model.bert_model.eval()
                    train_err.append(current_train_loss)
                    val_err.append(current_val_loss)
                    train_acc_list.append(current_train_acc)
                    val_acc_list.append(current_val_acc)
                    print(f"Train Loss: {current_train_loss:.4f}, Val Loss: {current_val_loss:.4f}, Train Acc: {current_train_acc:.4f}, Val Acc: {current_val_acc:.4f}")

                    if current_val_acc > best_val_acc:
                        best_state_dict = {k: v.cpu().clone() for k, v in model.state_dict().items()}
                        best_val_acc = current_val_acc
                        steps_no_improve = 0
                    else:
                        steps_no_improve += 1
                        if steps_no_improve >= patience:
                            early_stop_triggered = True
                            break

        # Persist best state, config, and learning curves to Redis.
        if best_state_dict is not None:
            buffer = io.BytesIO()
            torch.save(best_state_dict, buffer)
            save_model_state(user_id, training_session_id, buffer.getvalue())
        
        save_training_status(user_id, training_session_id, False)
        save_learning_curves(user_id, training_session_id, {
            "train_err": train_err,
            "val_err": val_err,
            "train_acc": train_acc_list,
            "val_acc": val_acc_list,
        })

        evaluate_metrics = evaluate(user_id, training_session_id, test_loader)
        return {
            "status": "success",
            "metrics": evaluate_metrics,
        }

    except Exception as e:
        save_training_status(user_id, training_session_id, False)
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    
    from data_preprocess_pipeline.pipeline import preprocess_pipeline
    from data_preprocess_pipeline.data_config import DataConfig

    # These should be loaded from the frontend
    training_config = TrainingConfig(
        learning_rate=3e-5,
        n_epochs=20,
        batch_size=8,
        eval_step=1
    )
    classifier_config = ClassifierConfig(
        hidden_neurons=128,
        dropout=0.2,
        num_classes=None,
        classifier_type="LINEAR"
    )
    embed_model_config = EmbedModelConfig(
        embed_model="bert_model",
        fine_tune_mode="unfreeze_last_n_layers",
        unfreeze_last_n_layers=1
    )
    data_config = DataConfig(
        data_path="data/News.csv",
        lowercase=False,
        remove_punctuation=False,
        remove_stopwords=False,
        lemmatization=False,
        handle_urls="replace",
        handle_emails="replace",
        train_ratio=0.80,
        test_ratio=0.20,
        stratify=True,
    )

    # Preprocess the data
    train_loader, val_loader, test_loader, num_classes = preprocess_pipeline(
        data_config=data_config, 
        training_config=training_config, 
        embed_model_config=embed_model_config)
    classifier_config.num_classes = num_classes

    user_id = "test_user"
    training_session_id = "test_session"

    import time
    start_time = time.time()
 
    metrics = run_training(
        train_loader = train_loader, 
        val_loader = val_loader, 
        test_loader = test_loader, 
        user_id = user_id, 
        training_session_id = training_session_id, 
        training_config = training_config, 
        classifier_config = classifier_config, 
        embed_model_config = embed_model_config)

    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
    print(metrics)