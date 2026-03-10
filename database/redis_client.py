# redis_client.py
import torch
import io
import json
import os
import redis
from model_training_pipeline.model_config import ModelConfig
from model_training_pipeline.classify_model import Classifier
from model_training_pipeline.embed_model import load_embed_model, EMBED_MODEL_TYPES

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")

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


# --- Save Classifier and Embed Model Config to Load the model (keyed by user_id and training_session_id) ---

def _config_key(user_id: str, training_session_id: str) -> str:
    return f"config:{user_id}:{training_session_id}"


def save_training_config(user_id: str, training_session_id: str, config: ModelConfig) -> None:
    """Store training session config as JSON (e.g. learning_rate, n_epochs, hidden_neurons, dropout, num_layers)."""
    r_bytes.set(_config_key(user_id, training_session_id), json.dumps(config.model_dump()).encode("utf-8"))


def get_training_config(user_id: str, training_session_id: str) -> ModelConfig | None:
    """Return stored training config dict, or None if not found."""
    data = r_bytes.get(_config_key(user_id, training_session_id))
    if data is None:
        return None
    return ModelConfig(**json.loads(data.decode("utf-8")))


def delete_training_config(user_id: str, training_session_id: str) -> None:
    """Remove stored training config for this user/session."""
    r_bytes.delete(_config_key(user_id, training_session_id))

def load_model_from_redis(user_id: str, training_session_id: str) -> tuple[Classifier, EMBED_MODEL_TYPES]:
    """Load the model from Redis."""
    model_state = get_model_state(user_id, training_session_id)
    if model_state is None:
        raise FileNotFoundError(
            f"No model state found for user_id={user_id!r}, training_session_id={training_session_id!r}. Train first."
        )
    state_dict = torch.load(io.BytesIO(model_state), map_location="cpu", weights_only=True)
    model_config = get_training_config(user_id, training_session_id)
    if model_config is None:
        raise ValueError("No model config found for this user/session.")
    embed_model = load_embed_model(model_config.embed_model_config)
    model = Classifier(embed_model, model_config.classifier_config)
    model.load_state_dict(state_dict)
    model.eval()
    return model, embed_model


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


# --- Training status (keyed by user_id and training_session_id) ---

def _training_status_key(user_id: str, training_session_id: str) -> str:
    return f"training_status:{user_id}:{training_session_id}"


def save_training_status(user_id: str, training_session_id: str, status: bool) -> None:
    """Store training status as a boolean (True = training, False = idle/done)."""
    r_bytes.set(_training_status_key(user_id, training_session_id), json.dumps(status).encode("utf-8"))


def get_training_status(user_id: str, training_session_id: str) -> bool | None:
    """Return stored training status (True/False), or None if not set."""
    data = r_bytes.get(_training_status_key(user_id, training_session_id))
    if data is None:
        return None
    return json.loads(data.decode("utf-8"))


def delete_training_status(user_id: str, training_session_id: str) -> None:
    """Remove stored training status for this user/session."""
    r_bytes.delete(_training_status_key(user_id, training_session_id))


if __name__ == "__main__":
    print(save_training_status("test_user", "test_session", False))