"""
Train model API. Each user/session gets its own model; multiple users can train concurrently.
"""

import asyncio
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from pydantic import BaseModel, Field
from data_preprocess_pipeline.pipeline import preprocess_pipeline
from data_preprocess_pipeline.data_config import DataConfig
from model_training_pipeline.model_config import TrainingConfig, EmbedModelConfig, ClassifierConfig, TotalConfig
from model_training_pipeline.embed_model import MODEL_NAMES
from model_training_pipeline.train import run_training
from database.redis_client import save_training_status, TrainingStatus, get_training_status

router = APIRouter(tags=["train"])


class TrainRequest(BaseModel):
    training_config: TrainingConfig = Field(..., description="Training configuration")
    data_config: DataConfig = Field(..., description="Data configuration")
    embed_model_config: EmbedModelConfig = Field(..., description="Embed model configuration")
    classifier_config: ClassifierConfig = Field(..., description="Classifier configuration")

def preprocess_data(training_config: TrainingConfig, data_config: DataConfig, embed_model_config: EmbedModelConfig):
    """Build data loaders using the embed model from config."""
    train_loader, val_loader, test_loader, num_classes, class_map = preprocess_pipeline(
        data_config=data_config, 
        training_config=training_config, 
        embed_model_config=embed_model_config)
    return train_loader, val_loader, test_loader, num_classes, class_map


def _run_training_job(
    training_config: TrainingConfig,
    data_config: DataConfig,
    embed_model_config: EmbedModelConfig,
    classifier_config: ClassifierConfig,
    user_id: str,
    training_session_id: str,
) -> None:
    """Background worker: preprocess data then run training."""
    total_config = TotalConfig(
        embed_model_config=embed_model_config,
        classifier_config=classifier_config,
        training_config=training_config,
        data_config=data_config,
    )

    try:
        train_loader, val_loader, test_loader, num_classes, class_map = preprocess_data(
            training_config, data_config, embed_model_config
        )
        classifier_config.num_classes = num_classes
        data_config.class_map = class_map
        total_config = TotalConfig(
            embed_model_config=embed_model_config,
            classifier_config=classifier_config,
            training_config=training_config,
            data_config=data_config,
        )
        
    except Exception as e:
        save_training_status(
            user_id,
            training_session_id,
            TrainingStatus(
                status="error",
                config=total_config,
                progress=0.0,
                result=None,
                error=f"preprocess failed: {e!s}",
            ),
        )
        return

    try:
        run_training(
            train_loader,
            val_loader,
            test_loader,
            user_id,
            training_session_id,
            total_config,
        )
    except Exception as e:
        save_training_status(
            user_id,
            training_session_id,
            TrainingStatus(
                status="error",
                config=total_config,
                progress=0.0,
                result=None,
                error=f"training failed: {e!s}",
            ),
        )

@router.post("/cancel_train")
async def cancel_train(
    user_id: str = Query(...),
    training_session_id: str = Query(...),
):
    status = get_training_status(user_id, training_session_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Training session not found. User hasn't started training yet")

    cancel_status = TrainingStatus(
        status="cancelled",
        config=status.config,
        progress=status.progress,
        result=None,
        error=None,
    )
    save_training_status(user_id, training_session_id, cancel_status)
    return {"status": "successfully cancelled training"}

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

    # Check status of the training session.
    initial_status = get_training_status(user_id, training_session_id)
    if initial_status is None: # User didn't train before
        pass
    elif initial_status.status == "running":
        raise HTTPException(status_code=400, detail="Training already in progress")

    asyncio.create_task(
        asyncio.to_thread(
            _run_training_job,
            training_config,
            data_config,
            embed_model_config,
            classifier_config,
            user_id,
            training_session_id,
        )
    )

    return {"status": "successfully started training"}

@router.get("/get_train_status", response_model=TrainingStatus|None)
async def get_train_status(
    user_id: str = Query(...),
    training_session_id: str = Query(...),
):
    return get_training_status(user_id, training_session_id)