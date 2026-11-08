from fastapi import APIRouter, HTTPException
from typing import Optional

from app.services.load_balancing_service import LoadBalancingService

router = APIRouter(prefix="/api", tags=["Intelligent Load Balancing"])
load_balancing_service = LoadBalancingService()

@router.get("/load-balancing")
async def get_load_balancing_insights(dataset_id: Optional[int] = None):
    try:
        res = load_balancing_service.get_load_balancing_recommendations(dataset_id=dataset_id)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

