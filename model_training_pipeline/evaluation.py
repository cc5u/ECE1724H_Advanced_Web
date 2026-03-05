"""
Evaluate a trained model loaded from Redis by user_id and training_session_id.
Returns accuracy, precision, recall, and F1-score.
"""

import io
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from model_training_pipeline.classify_model import SentimentClassifier


def load_model_from_redis(user_id: str, training_session_id: str) -> SentimentClassifier:
    """
    Load the model state and config from Redis, build SentimentClassifier, and return it.
    Raises FileNotFoundError if no model state exists for this user/session.
    """
    from database.redis_client import get_model_state, get_training_config

    model_state = get_model_state(user_id, training_session_id)
    if model_state is None:
        raise FileNotFoundError(
            f"No model state found for user_id={user_id!r}, training_session_id={training_session_id!r}. Train first."
        )

    state_dict = torch.load(io.BytesIO(model_state), map_location="cpu", weights_only=True)
    config = get_training_config(user_id, training_session_id) or {}
    model = SentimentClassifier(
        n_classes=config.get("num_classes", 2),
        hidden_neuron=config.get("hidden_neurons", 512),
        dropout=config.get("dropout", 0.3),
        num_layers=config.get("num_layers", 1)
    )
    model.load_state_dict(state_dict)
    model.eval()
    return model


def evaluate(
    user_id: str,
    training_session_id: str,
    data_loader: DataLoader | None = None,
    data_path: str | None = None,
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
    model = load_model_from_redis(user_id, training_session_id)
    model.to(device)

    if data_loader is None:
        if data_path is not None:
            from data_preprocess_pipeline.dataloader import datapreprocess_dataloader
            _, _, data_loader = datapreprocess_dataloader(data_path=data_path).split_data()
        else:
            from data_preprocess_pipeline.pipeline import test_loader
            data_loader = test_loader

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

    # Binary: 0 = negative, 1 = positive; use zero_division=0 to avoid undefined when no positive preds
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average="micro", zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average="micro", zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, average="micro", zero_division=0)),
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python -m model_training_pipeline.evaluation <user_id> <training_session_id>")
        sys.exit(1)
    user_id = sys.argv[1]
    training_session_id = sys.argv[2]
    metrics = evaluate(user_id, training_session_id)
    print("Evaluation metrics:", metrics)
