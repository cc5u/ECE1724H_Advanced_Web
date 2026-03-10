"""
Evaluate a trained model loaded from Redis by user_id and training_session_id.
Returns accuracy, precision, recall, and F1-score.
"""

import io
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score


from database.redis_client import load_model_from_redis


def evaluate(
    user_id: str,
    training_session_id: str,
    data_loader: DataLoader,
) -> dict[str, float]:
    """
    Load the model for the given user_id and training_session_id from Redis,
    run it on the evaluation data, and return accuracy, precision, recall, and F1-score.

    Args:
        user_id: User identifier (Redis key).
        training_session_id: Training session identifier (Redis key).
        data_loader: DataLoader to evaluate on. If None, uses test_loader from pipeline
                    (or builds from datapreprocess_dataloader(data_path) if data_path is set).
        data_path: Optional path to CSV for data; used only if data_loader is None.

    Returns:
        {"accuracy": float, "precision": float, "recall": float, "f1_score": float}

    Raises:
        FileNotFoundError: If no model state in Redis for this user/session.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, _ = load_model_from_redis(user_id, training_session_id)
    model.to(device)

    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in data_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"]
            outputs = model(input_ids, attention_mask)
            _, predicted = torch.max(outputs, 1)
            all_preds.extend(predicted.cpu().tolist())
            all_labels.extend(labels.tolist())

    y_true = all_labels
    y_pred = all_preds

    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
    }
