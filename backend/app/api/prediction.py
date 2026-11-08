from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/api", tags=["Next-Day Prediction"])
prediction_service = PredictionService()

class PredictRequest(BaseModel):
    dataset_id: Optional[int] = None
    target_date: Optional[str] = None

@router.post("/predict/next-day")
async def predict_next_day(req: PredictRequest):
    try:
        res = prediction_service.predict_next_day(
            dataset_id=req.dataset_id,
            target_date=req.target_date
        )
        return {"status": "success", "prediction": res}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

