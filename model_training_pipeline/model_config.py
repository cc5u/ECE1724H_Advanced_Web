from typing import Literal
from pydantic import BaseModel, Field
from model_training_pipeline.embed_model import MODEL_NAMES



class TrainingConfig(BaseModel):
    """Canonical training config. Use .model_dump() for dict when needed."""
    learning_rate: float = Field(0.001, description="Learning rate")
    n_epochs: int = Field(5, ge=1, le=100)
    hidden_neurons: int = Field(512, ge=1, le=2048)
    dropout: float = Field(0.3, ge=0.0, le=1.0)
    num_layers: int = Field(1, ge=1, le=4)
    num_classes: int | None = Field(default=None, ge=1)
    embed_model: Literal[*MODEL_NAMES.keys()] = Field("bert_model", description="Key in MODEL_NAMES")