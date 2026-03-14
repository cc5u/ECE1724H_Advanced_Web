# redis_client.py
from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator
import json
import os
import redis
from model_training_pipeline.model_config import TotalConfig

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")

# For model state: keep bytes (required for torch.save/load)
r_bytes = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=False)

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

class TrainingStatus(BaseModel):
    status: Literal["queued", "running", "completed", "error", "cancelled"]
    config: TotalConfig
    progress: float = 0.0
    result: Optional[dict] = None
    error: Optional[str] = None

    @model_validator(mode="after")
    def validate_status(self):
        if not (0.0 <= self.progress <= 1.0):
            raise ValueError("progress must be between 0.0 and 1.0")

        if self.status == "completed" and self.result is None:
            raise ValueError("result must be set when status is 'completed'")

        if self.status != "completed" and self.result is not None:
            raise ValueError("result should only be set when status is 'completed'")

        if self.status != "error" and self.error is not None:
            raise ValueError("error should only be set when status is 'error'")

        return self



def _training_status_key(user_id: str, training_session_id: str) -> str:
    return f"training_status:{user_id}:{training_session_id}"


def save_training_status(user_id: str, training_session_id: str, status: TrainingStatus) -> None:
    r_bytes.set(_training_status_key(user_id, training_session_id), json.dumps(status.model_dump()).encode("utf-8"))


def get_training_status(user_id: str, training_session_id: str) -> TrainingStatus | None:
    data = r_bytes.get(_training_status_key(user_id, training_session_id))
    if data is None:
        return None
    return TrainingStatus(**json.loads(data.decode("utf-8")))


def delete_training_status(user_id: str, training_session_id: str) -> None:
    """Remove stored training status for this user/session."""
    r_bytes.delete(_training_status_key(user_id, training_session_id))

if __name__ == "__main__":
    from model_training_pipeline.model_config import TotalConfig
    # Get and print all keys from Redis
    keys = r_bytes.keys('*')
    print("All Redis keys:", keys)
    # Delete all keys
    r_bytes.flushall()