from fastapi import APIRouter, HTTPException
from fastapi import Query, Body
from pydantic import BaseModel, Field
from typing import Optional
from model_training_pipeline.model_config import TotalConfig
router = APIRouter(tags=["model_output"])


class ModelOutputRequest(BaseModel):
    user_input: str = Field(description="User input")
    config: TotalConfig = Field(description="Total configuration")

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


@router.post("/model_output")
async def model_output_endpoint(
    request: ModelOutputRequest = Body(..., description="Model output request"),
    user_id: str = Query(..., description="User ID (e.g. 'test')"),
    training_session_id: str = Query(..., description="Training session ID (e.g. 'test')"),
):
    """Return model predictions and top-5 (or all) class confidences."""
    get_model_output = _get_pipeline()
    predicted, top_confidences = get_model_output(request.user_input, user_id, training_session_id, request.config)
    return {
        "output": predicted,
        "confidences": top_confidences,
    }


# @router.get("/model_accuracy")
# async def get_model_accuracy():
#     """Return the accuracy of the model."""
#     classify_model, _, get_accuracy, test_loader = _get_pipeline()
#     accuracy = get_accuracy(test_loader, classify_model)
#     return {"accuracy": float(accuracy)}
