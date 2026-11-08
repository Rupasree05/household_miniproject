from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.services.model_service import ModelService

router = APIRouter(prefix="/api", tags=["Model Training"])
model_service = ModelService()

class TrainRequest(BaseModel):
    dataset_id: int
    n_estimators: int = Field(default=100, ge=10, le=500)
    max_depth: Optional[int] = Field(default=12, ge=2, le=50)
    min_samples_split: int = Field(default=2, ge=2, le=20)
    min_samples_leaf: int = Field(default=1, ge=1, le=20)
    test_size: float = Field(default=0.2, ge=0.1, le=0.4)

@router.post("/train")
async def train_model(req: TrainRequest):
    try:
        res = model_service.train_random_forest(
            dataset_id=req.dataset_id,
            n_estimators=req.n_estimators,
            max_depth=req.max_depth,
            min_samples_split=req.min_samples_split,
            min_samples_leaf=req.min_samples_leaf,
            test_size=req.test_size
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.get("/model/metrics")
async def get_metrics():
    metrics = model_service.get_active_model_metrics()
    if not metrics:
        return {"status": "empty", "message": "No model trained yet."}
    return {"status": "success", "metrics": metrics}

@router.get("/model/feature-importance")
async def get_feature_importance():
    metrics = model_service.get_active_model_metrics()
    if not metrics or "feature_importance" not in metrics:
        return {"status": "empty", "feature_importance": []}
    return {
        "status": "success",
        "feature_importance": metrics["feature_importance"]
    }

