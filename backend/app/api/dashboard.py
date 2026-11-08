import json
from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from pathlib import Path
import pandas as pd
import numpy as np

from app.database.database import get_db_connection
from app.services.model_service import ModelService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
model_service = ModelService()

@router.get("/summary")
async def get_dashboard_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get active dataset
    cursor.execute("SELECT value FROM settings WHERE key='active_dataset_id'")
    act_row = cursor.fetchone()
    active_dataset_id = int(act_row["value"]) if act_row and act_row["value"] else None

    if active_dataset_id:
        cursor.execute("SELECT * FROM datasets WHERE id=?", (active_dataset_id,))
    else:
        cursor.execute("SELECT * FROM datasets WHERE status='preprocessed' ORDER BY id DESC LIMIT 1")
    
    dataset = cursor.fetchone()

    # If no preprocessed dataset
    if not dataset or dataset["status"] != "preprocessed":
        conn.close()
        return {
            "has_data": False,
            "message": "No preprocessed dataset available. Please upload a smart-meter dataset to view dashboard analytics."
        }

    dataset_id = dataset["id"]
    clean_file_path = Path(dataset["file_path"]).parent / f"cleaned_{dataset_id}.csv"

    if not clean_file_path.exists():
        conn.close()
        return {"has_data": False, "message": "Cleaned dataset file not found."}

    daily_df = pd.read_csv(clean_file_path)
    daily_df['date'] = pd.to_datetime(daily_df['date'])
    daily_df = daily_df.sort_values(by='date').reset_index(drop=True)

    # 1. Today's (latest recorded day) consumption
    latest_row = daily_df.iloc[-1]
    today_consumption = round(float(latest_row['power_consumption']), 2)
    today_date = latest_row['date'].strftime('%Y-%m-%d')

    # 2. Average Daily Consumption
    avg_daily_consumption = round(float(daily_df['power_consumption'].mean()), 2)

    # 3. Peak Demand kW
    peak_demand_kw = round(float(daily_df['peak_demand_kw'].max()), 2) if 'peak_demand_kw' in daily_df.columns else round(avg_daily_consumption / 8.0, 2)

    # 4. Model R2 Score from active model
    cursor.execute("SELECT * FROM model_records WHERE is_active=1 ORDER BY id DESC LIMIT 1")
    model_row = cursor.fetchone()
    r2_score = round(float(model_row["r2_score"]), 4) if model_row else None
    model_mae = round(float(model_row["mae"]), 2) if model_row else None

    # 5. Predicted Tomorrow's Demand
    cursor.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT 1")
    pred_row = cursor.fetchone()
    predicted_demand = round(float(pred_row["predicted_kwh"]), 2) if pred_row else None
    prediction_date = pred_row["prediction_date"] if pred_row else None
    demand_category = pred_row["demand_category"] if pred_row else None

    # Recent prediction history
    cursor.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT 5")
    recent_preds = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "has_data": True,
        "dataset_name": dataset["filename"],
        "dataset_id": dataset_id,
        "kpis": {
            "today_consumption_kwh": today_consumption,
            "today_date": today_date,
            "predicted_tomorrow_kwh": predicted_demand,
            "prediction_date": prediction_date,
            "demand_category": demand_category,
            "avg_daily_kwh": avg_daily_consumption,
            "peak_demand_kw": peak_demand_kw,
            "has_hourly": bool(dataset["has_hourly"]),
            "model_r2_score": r2_score,
            "model_mae": model_mae,
            "total_records_days": len(daily_df)
        },
        "recent_predictions": recent_preds
    }

@router.get("/consumption-trend")
async def get_consumption_trend(range_type: str = "daily"):
    """
    Returns consumption trends for daily (last 30-60 days), weekly, or monthly.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key='active_dataset_id'")
    act_row = cursor.fetchone()
    active_dataset_id = int(act_row["value"]) if act_row and act_row["value"] else None

    if active_dataset_id:
        cursor.execute("SELECT * FROM datasets WHERE id=?", (active_dataset_id,))
    else:
        cursor.execute("SELECT * FROM datasets WHERE status='preprocessed' ORDER BY id DESC LIMIT 1")

    dataset = cursor.fetchone()
    conn.close()

    if not dataset or dataset["status"] != "preprocessed":
        return {"has_data": False, "data": []}

    clean_file_path = Path(dataset["file_path"]).parent / f"cleaned_{dataset['id']}.csv"
    if not clean_file_path.exists():
        return {"has_data": False, "data": []}

    daily_df = pd.read_csv(clean_file_path)
    daily_df['date'] = pd.to_datetime(daily_df['date'])
    daily_df = daily_df.sort_values(by='date').reset_index(drop=True)

    if range_type == "weekly":
        daily_df['week'] = daily_df['date'].dt.to_period('W').apply(lambda r: r.start_time)
        weekly = daily_df.groupby('week')['power_consumption'].agg(['mean', 'sum', 'max']).reset_index()
        data = [
            {
                "label": row['week'].strftime('%b %d'),
                "avg_kwh": round(float(row['mean']), 2),
                "total_kwh": round(float(row['sum']), 2),
                "peak_kwh": round(float(row['max']), 2)
            }
            for _, row in weekly.iterrows()
        ]
    elif range_type == "monthly":
        daily_df['month_period'] = daily_df['date'].dt.to_period('M').apply(lambda r: r.start_time)
        monthly = daily_df.groupby('month_period')['power_consumption'].agg(['mean', 'sum', 'max']).reset_index()
        data = [
            {
                "label": row['month_period'].strftime('%b %Y'),
                "avg_kwh": round(float(row['mean']), 2),
                "total_kwh": round(float(row['sum']), 2),
                "peak_kwh": round(float(row['max']), 2)
            }
            for _, row in monthly.iterrows()
        ]
    else: # daily
        # Last 45 days for clear display
        sub_df = daily_df.tail(45).copy()
        # Calculate 7-day rolling average for trendline
        sub_df['rolling_7'] = sub_df['power_consumption'].rolling(7, min_periods=1).mean()
        data = [
            {
                "date": row['date'].strftime('%b %d'),
                "full_date": row['date'].strftime('%Y-%m-%d'),
                "kwh": round(float(row['power_consumption']), 2),
                "trend_7d": round(float(row['rolling_7']), 2),
                "peak_kw": round(float(row.get('peak_demand_kw', row['power_consumption'] / 8.0)), 2)
            }
            for _, row in sub_df.iterrows()
        ]

    return {"has_data": True, "range_type": range_type, "data": data}
