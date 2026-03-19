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
from model_training_pipeline.embed_model import load_embed_model
from database.redis_client import TrainingStatus, save_training_status, get_training_status
from model_training_pipeline.model_config import TrainingConfig, ClassifierConfig, EmbedModelConfig, TotalConfig
from transformers import get_linear_schedule_with_warmup
from cloud_storage.storage_manager import cloud_storage_manager


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
    total_config: TotalConfig,
) -> TrainingStatus:
    """
    Create a new SentimentClassifier, train it, and save the best state (by
    validation loss) to Redis for this user_id and training_session_id.
    Multiple users can call this concurrently; each has its own model instance.
    """  

    training_config = total_config.training_config
    embed_model_config = total_config.embed_model_config
    classifier_config = total_config.classifier_config
    data_config = total_config.data_config

    save_training_status(
        user_id,
        training_session_id,
        TrainingStatus(
            status="running",
            config=total_config,
            progress=0.0,
            result=None,
        )
    )   
    
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
        
        # Track progress
        total_step = training_config.n_epochs * len(train_loader)
        progress = 0.0

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
                current_status = get_training_status(user_id, training_session_id)
                if current_status.status == "cancelled":
                    return current_status
                global_step += 1
                progress = global_step / total_step
                save_training_status(
                    user_id, 
                    training_session_id, 
                    TrainingStatus(status="running", config=total_config, progress=progress, result=None))
                
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
            
            if early_stop_triggered:
                break

        # Persist best state, config, and learning curves to Redis.
        if best_state_dict is not None:
            # First load the best state
            model.load_state_dict(best_state_dict)
            buffer = io.BytesIO()
            torch.save(best_state_dict, buffer)
            
            # Upload to Cloud Storage
            cloud_storage_manager.upload_bytes(buffer.getvalue(), user_id, training_session_id, f"{classifier_config.model_name}.pth")
            # save_model_state(user_id, training_session_id, buffer.getvalue())

        save_training_status(user_id, training_session_id, TrainingStatus(status="evaluating", config=total_config, progress=1.0, result=None))
        
        print("Evaluating model...")
        evaluate_metrics = evaluate(model, test_loader, data_config.class_map)
        curve_x = list(range(1, len(train_err) + 1))
        evaluate_metrics["learning_curves"] = {
            "x": curve_x,
            "train_loss": train_err,
            "val_loss": val_err,
            "train_acc": train_acc_list,
            "val_acc": val_acc_list,
        }
        print("COMPLETED TRAINING")
        completed_status = TrainingStatus(
            status="completed",
            config=total_config,
            progress=1.0,
            result=evaluate_metrics,
        )
        save_training_status(user_id, training_session_id, completed_status)
        return completed_status

    except Exception as e:
        print(f"ERROR: {e}")
        error_status = TrainingStatus(
            status="error",
            config=total_config,
            progress=0.0,
            result=None,
            error=str(e),
        )
        save_training_status(user_id, training_session_id, error_status)
        return error_status

if __name__ == "__main__":
    from data_preprocess_pipeline.pipeline import preprocess_pipeline
    from data_preprocess_pipeline.data_config import DataConfig
    from model_training_pipeline.model_config import TrainingConfig, ClassifierConfig, EmbedModelConfig, TotalConfig
    user_id = "test"
    training_session_id = "test"
    training_config = TrainingConfig(
        learning_rate=2e-5,
        n_epochs=5,
        batch_size=8,
        eval_step=1
    )
    data_config = DataConfig(
        data_path="https://deep-learning-project.tor1.cdn.digitaloceanspaces.com/public/News.csv",
        lowercase=False,
        remove_punctuation=False,
        remove_stopwords=False,
        lemmatization=False,
        handle_urls="replace",
        handle_emails="replace",
        train_ratio=0.8,
        test_ratio=0.2,
        stratify=True,
        class_map={}
    )
    embed_model_config = EmbedModelConfig(
        embed_model="roberta_model",
        fine_tune_mode="unfreeze_all"
    )
    classifier_config = ClassifierConfig(
        model_name="default",
        hidden_neurons=128,
        dropout=0.3,
        classifier_type="LINEAR"
    )
    train_loader, val_loader, test_loader, num_classes, class_map = preprocess_pipeline(
        data_config=data_config, 
        training_config=training_config, 
        embed_model_config=embed_model_config
    )
    classifier_config.num_classes = num_classes
    data_config.class_map = class_map
    
    total_config = TotalConfig(
        embed_model_config=embed_model_config, 
        classifier_config=classifier_config, 
        training_config=training_config, 
        data_config=data_config)
    
    result = run_training(
        train_loader,
        val_loader,
        test_loader,
        user_id,
        training_session_id,
        total_config,
    )
    print(result)