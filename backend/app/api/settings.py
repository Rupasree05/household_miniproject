from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.database.database import get_db_connection

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    household_name: Optional[str] = None
    electricity_tariff: Optional[float] = None
    daily_target_kwh: Optional[float] = None
    peak_threshold_kw: Optional[float] = None
    unit: Optional[str] = None
    active_dataset_id: Optional[str] = None

@router.get("")
async def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    settings_dict = {row["key"]: row["value"] for row in cursor.fetchall()}
    conn.close()

    return {
        "status": "success",
        "settings": {
            "household_name": settings_dict.get("household_name", "Smart Household #1"),
            "electricity_tariff": float(settings_dict.get("electricity_tariff", 0.18)),
            "daily_target_kwh": float(settings_dict.get("daily_target_kwh", 25.0)),
            "peak_threshold_kw": float(settings_dict.get("peak_threshold_kw", 4.5)),
            "unit": settings_dict.get("unit", "kWh"),
            "active_dataset_id": settings_dict.get("active_dataset_id", "")
        }
    }

@router.put("")
async def update_settings(update: SettingsUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    fields = update.dict(exclude_unset=True)
    for key, val in fields.items():
        cursor.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, str(val))
        )

    conn.commit()
    conn.close()

    return {"status": "success", "message": "Settings updated successfully."}

