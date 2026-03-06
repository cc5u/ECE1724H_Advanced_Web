from fastapi import APIRouter, HTTPException
from fastapi import Query
from typing import Optional
router = APIRouter(tags=["model_output"])


def _get_pipeline():
    """Lazy-load pipeline so the API can start without data.csv / BERT."""
    try:
        from model_prediction.model_output import get_model_output
        from model_prediction.model_accuracy import get_accuracy
        from data_preprocess_pipeline.pipeline import test_loader
        return get_model_output, get_accuracy, test_loader
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Model/data pipeline not available: {e!s}. Ensure data/data.csv exists and dependencies are installed.",
        ) from e


@router.get("/model_output")
async def model_output_endpoint(
    user_input: str = Query(description="User input"),
    user_id: Optional[int] = Query(description="User ID"),
    training_session_id: Optional[int] = Query(description="Training Session ID"),
):
    """Return model predictions; tensors are converted to list for JSON."""
    get_model_output, _, _, _ = _get_pipeline()
    predicted, confidence = get_model_output(user_input, user_id, training_session_id)
    return {"output": predicted.cpu().tolist(), "confidence": confidence}


@router.get("/model_accuracy")
async def get_model_accuracy():
    """Return the accuracy of the model."""
    classify_model, _, get_accuracy, test_loader = _get_pipeline()
    accuracy = get_accuracy(test_loader, classify_model)
    return {"accuracy": float(accuracy)}
