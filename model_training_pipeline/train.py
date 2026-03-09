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

from model_training_pipeline.embed_model import MODEL_NAMES
from model_training_pipeline.classify_model import SentimentClassifier
from database.redis_client import save_model_state, save_training_config, save_learning_curves
from model_prediction.model_accuracy import get_accuracy
from model_training_pipeline.model_config import TrainingConfig


def _validation_loss(
    model: nn.Module,
    val_loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> float:
    """Compute average cross-entropy loss over the validation set."""
    model.eval()
    total_loss = 0.0
    n = 0
    with torch.no_grad():
        for batch in val_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)
            outputs = model(input_ids, attention_mask)
            loss = criterion(outputs, labels)
            total_loss += loss.item() * labels.size(0)
            n += labels.size(0)
    return total_loss / n if n else float("inf")


def run_training(
    train_loader: DataLoader,
    val_loader: DataLoader,
    test_loader: DataLoader,
    user_id: str,
    training_session_id: str,
    config: TrainingConfig = TrainingConfig(),
) -> dict[str, Any]:
    """
    Create a new SentimentClassifier, train it, and save the best state (by
    validation loss) to Redis for this user_id and training_session_id.
    Multiple users can call this concurrently; each has its own model instance.
    """

    try:
        print("STARTING TRAINING")
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        config = config.model_dump()
        lr = config["learning_rate"]
        n_epochs = config["n_epochs"]
        hidden_neurons = config["hidden_neurons"]
        dropout = config["dropout"]
        num_layers = config["num_layers"]
        num_classes = config["num_classes"]
        embd_model = MODEL_NAMES[config["embed_model"]]

        # New instance per training run (no shared global model).
        model = SentimentClassifier(
            n_classes=num_classes,
            hidden_neuron=hidden_neurons,
            dropout=dropout,
            num_layers=num_layers,
            bert_model=embd_model,
        ).to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)
        criterion = nn.CrossEntropyLoss()

        best_val_acc = float("-inf")
        best_state_dict = None

        # Per-epoch curves for plotting (train/val error = loss, train/val acc)
        train_err: list[float] = []
        val_err: list[float] = []
        train_acc_list: list[float] = []
        val_acc_list: list[float] = []

        for epoch in range(n_epochs):
            print(f"Epoch {epoch+1}/{n_epochs}")
            model.train()
            total_train_loss = 0.0
            n_train = 0
            train_acc = 0.0
            for batch in tqdm(train_loader, total=len(train_loader)):
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)
                optimizer.zero_grad()
                outputs = model(input_ids, attention_mask)
                loss = criterion(outputs, labels)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.5)
                optimizer.step()
                total_train_loss += loss.item() * labels.size(0)
                n_train += labels.size(0)
                train_acc += (outputs.argmax(dim=1) == labels).sum().item()
            
            train_loss = total_train_loss / n_train if n_train else 0.0
            val_loss = _validation_loss(model, val_loader, criterion, device)
            train_err.append(train_loss)
            val_err.append(val_loss)

            model.eval()
            train_acc_list.append(train_acc / n_train)
            val_acc = get_accuracy(val_loader, model)
            val_acc_list.append(val_acc)
            print(f"Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}, Train Acc: {train_acc_list[-1]:.4f}, Val Acc: {val_acc_list[-1]:.4f}")

            if val_acc > best_val_acc:
                best_state_dict = {k: v.cpu().clone() for k, v in model.state_dict().items()}
                best_val_acc = val_acc

        # Persist best state, config, and learning curves to Redis.
        if best_state_dict is not None:
            buffer = io.BytesIO()
            torch.save(best_state_dict, buffer)
            save_model_state(user_id, training_session_id, buffer.getvalue())
        
        save_learning_curves(user_id, training_session_id, {
            "train_err": train_err,
            "val_err": val_err,
            "train_acc": train_acc_list,
            "val_acc": val_acc_list,
        })

        return evaluate(user_id, training_session_id, test_loader)

    except Exception as e:
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    
    from data_preprocess_pipeline.pipeline import preprocess_pipeline
    from data_preprocess_pipeline.data_config import DataConfig

    
    model_config = TrainingConfig(
        learning_rate=0.001,
        n_epochs=5,
        hidden_neurons=128,
        dropout=0.1,
        num_layers=1,
        embed_model="distilbert_model"
    )
    
    data_path = "data/News.csv"
    data_config = DataConfig(
        data_path=data_path,
        lowercase=True,
        remove_punctuation=True,
        remove_stopwords=True,
        lemmatization=True,
        handle_urls="replace",
        handle_emails="replace",
        train_ratio=0.80,
        test_ratio=0.20,
        stratify=True,
    )

    embd_model = MODEL_NAMES[model_config.embed_model]
    train_loader, val_loader, test_loader, num_classes = preprocess_pipeline(bert_model=embd_model, data_config=data_config)
    model_config.num_classes = num_classes

    user_id = "test_user"
    training_session_id = "test_session"

    import time
    start_time = time.time()
    save_training_config(user_id, training_session_id, model_config)
    metrics = run_training(train_loader, val_loader, test_loader, user_id, training_session_id, model_config)
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
    print(metrics)