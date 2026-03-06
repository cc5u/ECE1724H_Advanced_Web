# redis_client.py
import io
import json
import os
import redis
from model_training_pipeline.model_config import TrainingConfig

# REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_HOST = "localhost"

# For model state: keep bytes (required for torch.save/load)
r_bytes = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=False)


# --- Model state (keyed by user_id and training_session_id) ---

def _model_key(user_id: str, training_session_id: str) -> str:
    return f"model:{user_id}:{training_session_id}"


def save_model_state(user_id: str, training_session_id: str, state_bytes: bytes) -> None:
    """Store model state_dict bytes. Overwrites any existing value."""
    r_bytes.set(_model_key(user_id, training_session_id), state_bytes)


def get_model_state(user_id: str, training_session_id: str) -> bytes | None:
    """Return stored model state bytes, or None if not found."""
    data = r_bytes.get(_model_key(user_id, training_session_id))
    return data


def delete_model_state(user_id: str, training_session_id: str) -> None:
    """Remove stored model state for this user/session."""
    r_bytes.delete(_model_key(user_id, training_session_id))


# --- Training config (keyed by user_id and training_session_id) ---

def _config_key(user_id: str, training_session_id: str) -> str:
    return f"config:{user_id}:{training_session_id}"


def save_training_config(user_id: str, training_session_id: str, config: TrainingConfig) -> None:
    """Store training session config as JSON (e.g. learning_rate, n_epochs, hidden_neurons, dropout, num_layers)."""
    r_bytes.set(_config_key(user_id, training_session_id), json.dumps(config.model_dump()).encode("utf-8"))


def get_training_config(user_id: str, training_session_id: str) -> TrainingConfig | None:
    """Return stored training config dict, or None if not found."""
    data = r_bytes.get(_config_key(user_id, training_session_id))
    if data is None:
        return None
    return TrainingConfig(**json.loads(data.decode("utf-8")))


def delete_training_config(user_id: str, training_session_id: str) -> None:
    """Remove stored training config for this user/session."""
    r_bytes.delete(_config_key(user_id, training_session_id))


# --- Learning curves (keyed by user_id and training_session_id) ---

def _curves_key(user_id: str, training_session_id: str) -> str:
    return f"curves:{user_id}:{training_session_id}"


def save_learning_curves(
    user_id: str,
    training_session_id: str,
    curves: dict,
) -> None:
    """
    Store learning curves as JSON for plotting.
    curves should have keys like: train_err, val_err, train_acc, val_acc (lists of floats per epoch).
    """
    r_bytes.set(_curves_key(user_id, training_session_id), json.dumps(curves).encode("utf-8"))


def get_learning_curves(user_id: str, training_session_id: str) -> dict | None:
    """Return stored learning curves dict (train_err, val_err, train_acc, val_acc), or None if not found."""
    data = r_bytes.get(_curves_key(user_id, training_session_id))
    if data is None:
        return None
    return json.loads(data.decode("utf-8"))


def delete_learning_curves(user_id: str, training_session_id: str) -> None:
    """Remove stored learning curves for this user/session."""
    r_bytes.delete(_curves_key(user_id, training_session_id))


if __name__ == "__main__":

    # # Test model retrieval and saving
    # user_id = "test_user"
    # training_session_id = "test_session"

    # # Check whether the model state exists
    # model_state = get_model_state(user_id, training_session_id)
    # if model_state is None:
    #     raise SystemExit("No model state found for this user/session. Train first.")

    # from model_prediction.model_accuracy import get_accuracy
    # from model_training_pipeline.classify_model import SentimentClassifier
    # import torch
    # from data_preprocess_pipeline.dataloader import datapreprocess_dataloader

    # # torch.load needs a seekable buffer, not raw bytes
    # state_dict = torch.load(io.BytesIO(model_state), map_location="cpu", weights_only=True)
    # # Use saved config so architecture matches; fallback to defaults if missing
    # config = get_training_config(user_id, training_session_id) or {
    #     "hidden_neurons": 512,
    #     "dropout": 0.3,
    #     "num_layers": 1,
    # }
    # model = SentimentClassifier(
    #     n_classes=2,
    #     hidden_neuron=config.get("hidden_neurons", 512),
    #     dropout=config.get("dropout", 0.3),
    #     num_layers=config.get("num_layers", 1),
    # ).to("cpu")
    # model.load_state_dict(state_dict)
    # model.eval()
    # test_loader = datapreprocess_dataloader(data_path=None).split_data()[2]
    # test_acc = get_accuracy(test_loader, model)
    # print(f"Test accuracy: {test_acc}")
    print(get_learning_curves("test_user", "test_session"))