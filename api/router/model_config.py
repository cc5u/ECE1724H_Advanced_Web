from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(tags=["model_config"])


# Request body: client sends this JSON so the backend knows what the user picked
class SentimentConfigBody(BaseModel):
    learning_rate: float = Field(0.001, description="Learning rate")
    n_epochs: int = Field(5, ge=1, le=100, description="Number of epochs")
    model_type: str = Field("pooled", description="e.g. pooled, last_hidden")
    hidden_neurons: int = Field(512, ge=1, le=2048, description="Hidden layer size")
    dropout: float = Field(0.3, ge=0.0, le=1.0, description="Dropout rate")
    num_layers: int = Field(1, ge=1, le=4, description="Number of RNN/GRU layers")


# In-memory store so the training pipeline can read the last config (optional)
_current_config: dict | None = None


@router.post("/model_config")
async def set_model_config(body: SentimentConfigBody):
    """
    Client POSTs the chosen config (e.g. from a form or UI).
    Backend stores it and returns it so the client can confirm.
    """
    global _current_config
    _current_config = body.model_dump()
    return {"status": "ok", "config": _current_config}


@router.get("/model_config")
async def get_model_config():
    """
    Return the last config the user sent via POST. Returns null if none yet.
    """
    return {"config": _current_config}
