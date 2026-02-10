from fastapi import APIRouter
from model_training_pipeline.pipeline import classify_model
from model_training_pipeline.pipeline import get_model_output
from model_training_pipeline.accuracy import get_accuracy
from data_preprocess_pipeline.pipeline import test_loader
import numpy as np

router = APIRouter(tags=["model_output"])


@router.get("/model_output")
async def model_output_endpoint():
    """Return model predictions; tensors are converted to list for JSON."""
    predicted = get_model_output()  # from pipeline (torch.Tensor)
    return {"output": predicted.cpu().tolist()}


@router.get("/model_accuracy")
async def get_model_accuracy():
    """
    Return the accuracy of the model.
    """
    accuracy = get_accuracy(test_loader, classify_model)
    return {"accuracy": float(accuracy)}
