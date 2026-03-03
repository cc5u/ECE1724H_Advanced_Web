"""
Training entry point: creates a new SentimentClassifier per run, tracks validation
loss per epoch, and saves the best model state to Redis for the given user_id and
training_session_id. Each user/session trains its own model, so multiple users can
train concurrently.
"""

import io
from typing import Any

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from model_training_pipeline.evaluation import evaluate


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
    config: dict[str, Any] = {},
) -> dict[str, Any]:
    """
    Create a new SentimentClassifier, train it, and save the best state (by
    validation loss) to Redis for this user_id and training_session_id.
    Multiple users can call this concurrently; each has its own model instance.
    """
    from model_training_pipeline.classify_model import SentimentClassifier
    from database.redis_client import save_model_state, save_training_config, save_learning_curves
    from model_prediction.model_accuracy import get_accuracy

    try:
        print("STARTING TRAINING")
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        lr = config.get("learning_rate", 0.001)
        n_epochs = int(config.get("n_epochs", 5))
        hidden_neurons = config.get("hidden_neurons", 512)
        dropout = config.get("dropout", 0.3)
        num_layers = config.get("num_layers", 1)

        # New instance per training run (no shared global model).
        model = SentimentClassifier(
            n_classes=2,
            hidden_neuron=hidden_neurons,
            dropout=dropout,
            num_layers=num_layers,
        ).to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=lr)
        criterion = nn.CrossEntropyLoss()

        best_val_loss = float("inf")
        best_state_dict = None
        best_epoch = -1

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
            for batch in train_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)
                optimizer.zero_grad()
                outputs = model(input_ids, attention_mask)
                loss = criterion(outputs, labels)
                loss.backward()
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
            val_acc_list.append(get_accuracy(val_loader, model))

            if val_loss < best_val_loss:
                best_state_dict = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        # Persist best state, config, and learning curves to Redis.
        if best_state_dict is not None:
            buffer = io.BytesIO()
            torch.save(best_state_dict, buffer)
            save_model_state(user_id, training_session_id, buffer.getvalue())
            save_training_config(user_id, training_session_id, config)
        
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
    from model_training_pipeline.evaluation import evaluate
    train_loader, val_loader, test_loader = preprocess_pipeline(data_path=None)
    user_id = "test_user"
    training_session_id = "test_session"
    config = {
        "learning_rate": 0.001,
        "n_epochs": 1,
        "hidden_neurons": 512,
        "dropout": 0.3,
    }
    import time
    start_time = time.time()
    metrics = run_training(train_loader, val_loader, test_loader, user_id, training_session_id, config)
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
    print(metrics)