from fastapi import APIRouter, HTTPException
from fastapi import Query
from typing import Optional
router = APIRouter(tags=["model_output"])


def _get_pipeline():
    """Lazy-load pipeline so the API can start without data.csv / BERT."""
    try:
        from model_prediction.model_output import get_model_output
        return get_model_output
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Model/data pipeline not available: {e!s}. Ensure data/data.csv exists and dependencies are installed.",
        ) from e


@router.get("/model_output")
async def model_output_endpoint(
    user_input: str = Query(description="User input"),
    user_id: str = Query(description="User ID (e.g. 'test')"),
    training_session_id: str = Query(description="Training session ID (e.g. 'test')"),
):
    """Return model predictions and top-5 (or all) class confidences."""
    get_model_output = _get_pipeline()
    predicted, top_confidences = get_model_output(user_input, user_id, training_session_id)
    return {
        "output": predicted.cpu().tolist(),
        "confidences": top_confidences,
    }


# @router.get("/model_accuracy")
# async def get_model_accuracy():
#     """Return the accuracy of the model."""
#     classify_model, _, get_accuracy, test_loader = _get_pipeline()
#     accuracy = get_accuracy(test_loader, classify_model)
#     return {"accuracy": float(accuracy)}
