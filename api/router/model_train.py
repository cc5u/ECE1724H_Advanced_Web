"""
Train model API. Each user/session gets its own model; multiple users can train concurrently.
"""

import asyncio
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from pydantic import BaseModel, Field
from data_preprocess_pipeline.pipeline import preprocess_pipeline
from data_preprocess_pipeline.data_config import DataConfig
from model_training_pipeline.model_config import TrainingConfig, EmbedModelConfig, ClassifierConfig
from model_training_pipeline.embed_model import MODEL_NAMES
from model_training_pipeline.train import run_training
from database.redis_client import save_training_status

router = APIRouter(tags=["train"])


class TrainRequest(BaseModel):
    training_config: TrainingConfig = Field(..., description="Training configuration")
    data_config: DataConfig = Field(..., description="Data configuration")
    embed_model_config: EmbedModelConfig = Field(..., description="Embed model configuration")
    classifier_config: ClassifierConfig = Field(..., description="Classifier configuration")

def preprocess_data(training_config: TrainingConfig, data_config: DataConfig, embed_model_config: EmbedModelConfig):
    """Build data loaders using the embed model from config."""
    train_loader, val_loader, test_loader, num_classes = preprocess_pipeline(
        data_config=data_config, 
        training_config=training_config, 
        embed_model_config=embed_model_config)
    return train_loader, val_loader, test_loader, num_classes

@router.post("/cancel_train")
async def cancel_train(
    user_id: str = Query(..., description="User ID for storing the model state"),
    training_session_id: str = Query(..., description="Training session ID for storing the model state"),
):
    """
    Cancel training for a given user_id and training_session_id.
    """
    save_training_status(user_id, training_session_id, False)
    return {"status": "success"}

@router.post("/train")
async def train_model(
    request: TrainRequest = Body(..., description="Training request"),
    user_id: str = Query(..., description="User ID for storing the model state"),
    training_session_id: str = Query(..., description="Training session ID for storing the model state"),
):
    """
    Create a new model, train it, and save the best checkpoint (by validation loss)
    to Redis for this user_id and training_session_id. Multiple users can train at once.
    Request body: TrainingConfig (learning_rate, n_epochs, hidden_neurons, dropout, num_layers, num_classes, embed_model).
    """
    training_config = request.training_config
    data_config = request.data_config
    embed_model_config = request.embed_model_config
    classifier_config = request.classifier_config
    try:
        train_loader, val_loader, test_loader, num_classes = preprocess_data(training_config, data_config, embed_model_config)
        classifier_config.num_classes = num_classes
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Data pipeline not available: {e!s}",
        ) from e

    result = await asyncio.to_thread(
        run_training,
        train_loader = train_loader, 
        val_loader = val_loader, 
        test_loader = test_loader, 
        user_id = user_id, 
        training_session_id = training_session_id, 
        training_config = training_config, 
        classifier_config = classifier_config, 
        embed_model_config = embed_model_config)
    return result
