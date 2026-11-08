import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from typing import Optional, Dict
from pydantic import BaseModel

from app.services.data_service import DataService

router = APIRouter(prefix="/api", tags=["Data Management"])
data_service = DataService()

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV or text-delimited files are supported.")
    
    try:
        content = await file.read()
        res = data_service.save_uploaded_file(file.filename, content)
        return {
            "status": "success",
            "message": f"Dataset '{file.filename}' uploaded successfully.",
            "data": res
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload/demo")
async def load_demo_dataset():
    try:
        res = data_service.load_demo_dataset()
        return {
            "status": "success",
            "message": "Demo UCI Household Power Consumption dataset loaded successfully.",
            "data": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/template")
async def download_template():
    template_path = data_service.get_template_path()
    if not template_path.exists():
        raise HTTPException(status_code=404, detail="Template file not found.")
    return FileResponse(
        path=template_path,
        filename="smartgrid_template.csv",
        media_type="text/csv"
    )

@router.get("/datasets")
async def list_datasets():
    datasets = data_service.list_datasets()
    return {"status": "success", "datasets": datasets}

@router.get("/dataset/preview")
async def get_dataset_preview(dataset_id: Optional[int] = None):
    info = data_service.get_dataset_info(dataset_id)
    if not info:
        return {"status": "empty", "message": "No dataset uploaded yet."}
    return {"status": "success", "dataset": info}

@router.get("/dataset/summary")
async def get_dataset_summary(dataset_id: Optional[int] = None):
    info = data_service.get_dataset_info(dataset_id)
    if not info:
        return {"status": "empty", "message": "No dataset uploaded yet."}
    return {
        "status": "success",
        "dataset_id": info["id"],
        "filename": info["filename"],
        "original_rows": info["original_rows"],
        "cleaned_rows": info["cleaned_rows"],
        "date_start": info.get("date_start"),
        "date_end": info.get("date_end"),
        "status": info["status"],
        "has_hourly": bool(info.get("has_hourly", 0))
    }

