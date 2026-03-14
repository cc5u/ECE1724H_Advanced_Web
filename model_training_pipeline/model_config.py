from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator
from data_preprocess_pipeline.data_config import DataConfig

# Keep model keys local to avoid circular imports with embed_model.py
EMBED_MODEL_KEYS = Literal["bert_model", "distilbert_model", "longformer_model"]



class TrainingConfig(BaseModel):
    """Canonical training config. Use .model_dump() for dict when needed."""
    learning_rate: float = Field(0.001, description="Learning rate")
    n_epochs: int = Field(5, ge=1, le=100)
    batch_size: int = Field(default=16, description="Batch size")
    eval_step: int = Field(default=1, ge=1, le=5, description="Evaluate how many times per epoch")

class ClassifierConfig(BaseModel):
    model_name: str = Field("default", description="Model name")
    hidden_neurons: int = Field(512, ge=1, le=1024)
    dropout: float = Field(0.3, ge=0.0, le=1.0)
    num_classes: Optional[int] = Field(2, ge=1)
    classifier_type: Literal["GRU", "LINEAR"] = Field("GRU", description="Type of classifier")

class EmbedModelConfig(BaseModel):
    embed_model: EMBED_MODEL_KEYS = Field("bert_model", description="Key in MODEL_NAMES")
    fine_tune_mode: Literal["freeze_all", "unfreeze_last_n_layers", "unfreeze_all"] = Field("freeze_all", description="Fine tune mode")
    unfreeze_last_n_layers: Optional[int] = Field(None, ge=1, le=3, description="Unfreeze the last n layers")
    @model_validator(mode="after")
    def validate_config(self):
        if self.fine_tune_mode == "unfreeze_last_n_layers":
            if self.unfreeze_last_n_layers is None:
                raise ValueError("unfreeze_last_n_layers must be set when fine_tune_mode='unfreeze_last_n_layers'")
        else:
            if self.unfreeze_last_n_layers is not None:
                raise ValueError("unfreeze_last_n_layers should only be set when fine_tune_mode='unfreeze_last_n_layers'")
        return self

# This is only used to save the model configuration in Redis
class TotalConfig(BaseModel):
    classifier_config: ClassifierConfig = Field(..., description="Classifier configuration")
    embed_model_config: EmbedModelConfig = Field(..., description="Embed model configuration")
    training_config: TrainingConfig = Field(..., description="Training configuration")
    data_config: DataConfig = Field(..., description="Data configuration")