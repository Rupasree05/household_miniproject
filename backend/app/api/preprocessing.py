from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict

from app.services.preprocessing_service import PreprocessingService

router = APIRouter(prefix="/api", tags=["Preprocessing"])
preprocessing_service = PreprocessingService()

class PreprocessRequest(BaseModel):
    dataset_id: int
    mapping: Optional[Dict[str, str]] = None

@router.post("/preprocess")
async def preprocess_dataset(request: PreprocessRequest):
    try:
        res = preprocessing_service.preprocess_dataset(
            dataset_id=request.dataset_id,
            custom_mapping=request.mapping
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {str(e)}")

