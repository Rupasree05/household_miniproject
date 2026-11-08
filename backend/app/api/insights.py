import pandas as pd
import numpy as np
from pathlib import Path
from fastapi import APIRouter, HTTPException
from typing import Optional

from app.database.database import get_db_connection

router = APIRouter(prefix="/api", tags=["Energy Insights"])

@router.get("/insights")
async def get_energy_insights(dataset_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get tariff
    cursor.execute("SELECT value FROM settings WHERE key='electricity_tariff'")
    t_row = cursor.fetchone()
    tariff = float(t_row["value"]) if t_row else 0.18

    # Get dataset
    if dataset_id:
        cursor.execute("SELECT * FROM datasets WHERE id=?", (dataset_id,))
    else:
        cursor.execute("SELECT value FROM settings WHERE key='active_dataset_id'")
        act = cursor.fetchone()
        if act and act["value"]:
            cursor.execute("SELECT * FROM datasets WHERE id=?", (int(act["value"]),))
        else:
            cursor.execute("SELECT * FROM datasets WHERE status='preprocessed' ORDER BY id DESC LIMIT 1")

    dataset = cursor.fetchone()
    conn.close()

    if not dataset or dataset["status"] != "preprocessed":
        return {
            "has_data": False,
            "message": "No preprocessed dataset found. Please upload a dataset first."
        }

    clean_file_path = Path(dataset["file_path"]).parent / f"cleaned_{dataset['id']}.csv"
    if not clean_file_path.exists():
        return {"has_data": False, "message": "Cleaned dataset file not found."}

    df = pd.read_csv(clean_file_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date').reset_index(drop=True)

    # 1. Highest & Lowest consumption day
    highest_row = df.loc[df['power_consumption'].idxmax()]
    lowest_row = df.loc[df['power_consumption'].idxmin()]

    highest_day = {
        "date": highest_row['date'].strftime('%Y-%m-%d'),
        "kwh": round(float(highest_row['power_consumption']), 2),
        "cost": round(float(highest_row['power_consumption']) * tariff, 2)
    }

    lowest_day = {
        "date": lowest_row['date'].strftime('%Y-%m-%d'),
        "kwh": round(float(lowest_row['power_consumption']), 2),
        "cost": round(float(lowest_row['power_consumption']) * tariff, 2)
    }

    # 2. Weekend vs Weekday comparison
    df['day_of_week'] = df['date'].dt.day_name()
    df['is_weekend'] = df['date'].dt.dayofweek >= 5

    weekday_avg = float(df[~df['is_weekend']]['power_consumption'].mean())
    weekend_avg = float(df[df['is_weekend']]['power_consumption'].mean())
    diff_pct = round(((weekend_avg - weekday_avg) / (weekday_avg + 1e-5)) * 100, 1)

    # Day of week breakdown
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    dow_stats = df.groupby('day_of_week')['power_consumption'].agg(['mean', 'max', 'min']).reindex(day_order).reset_index()
    day_of_week_breakdown = [
        {
            "day": row['day_of_week'],
            "avg_kwh": round(float(row['mean']), 2),
            "max_kwh": round(float(row['max']), 2),
            "min_kwh": round(float(row['min']), 2),
            "est_cost": round(float(row['mean']) * tariff, 2)
        }
        for _, row in dow_stats.iterrows()
    ]

    # 3. Unusual consumption detection (Outliers: > Mean + 2 * Std)
    mean_val = float(df['power_consumption'].mean())
    std_val = float(df['power_consumption'].std())
    upper_threshold = mean_val + 2.0 * std_val

    outliers_df = df[df['power_consumption'] > upper_threshold].sort_values(by='power_consumption', ascending=False)
    anomalies = [
        {
            "date": row['date'].strftime('%Y-%m-%d'),
            "kwh": round(float(row['power_consumption']), 2),
            "deviation_kwh": round(float(row['power_consumption'] - mean_val), 2),
            "deviation_pct": round(((float(row['power_consumption']) - mean_val) / mean_val) * 100, 1),
            "cost": round(float(row['power_consumption']) * tariff, 2)
        }
        for _, row in outliers_df.head(6).iterrows()
    ]

    # 4. Total and Cost summary
    total_kwh = float(df['power_consumption'].sum())
    total_cost = round(total_kwh * tariff, 2)
    avg_daily_kwh = round(mean_val, 2)
    est_monthly_cost = round(avg_daily_kwh * 30 * tariff, 2)

    # 5. Targeted Energy-Saving suggestions based on patterns
    suggestions = []
    if diff_pct > 15:
        suggestions.append({
            "type": "Weekend Optimization",
            "text": f"Weekend consumption is {abs(diff_pct)}% higher than weekdays. Consider consolidating laundry, entertainment, and HVAC usage on weekends.",
            "impact": "Medium"
        })
    elif diff_pct < -15:
        suggestions.append({
            "type": "Weekday Baseload",
            "text": f"Weekday consumption exceeds weekends by {abs(diff_pct)}%. Check for unmonitored daytime appliances left on standby during work hours.",
            "impact": "Medium"
        })

    if len(anomalies) > 0:
        suggestions.append({
            "type": "Anomalous Spike Alert",
            "text": f"Detected {len(anomalies)} days with power usage exceeding 2 standard deviations above the mean. Investigate potential HVAC malfunctions or simultaneous appliance spikes.",
            "impact": "High"
        })

    suggestions.append({
        "type": "Tariff Optimization",
        "text": f"At ${tariff}/kWh, reducing daily average consumption by just 10% ({round(avg_daily_kwh * 0.1, 1)} kWh/day) yields approximately ${round(avg_daily_kwh * 0.1 * 30 * tariff, 2)} in monthly savings.",
        "impact": "Financial"
    })

    return {
        "has_data": True,
        "dataset_name": dataset["filename"],
        "tariff": tariff,
        "overview": {
            "total_kwh": round(total_kwh, 2),
            "total_cost": total_cost,
            "avg_daily_kwh": avg_daily_kwh,
            "est_monthly_cost": est_monthly_cost,
            "total_days": len(df)
        },
        "extremes": {
            "highest_day": highest_day,
            "lowest_day": lowest_day
        },
        "weekend_vs_weekday": {
            "weekday_avg_kwh": round(weekday_avg, 2),
            "weekend_avg_kwh": round(weekend_avg, 2),
            "diff_percentage": diff_pct,
            "higher_period": "Weekends" if diff_pct > 0 else "Weekdays"
        },
        "day_of_week_breakdown": day_of_week_breakdown,
        "anomalies": anomalies,
        "suggestions": suggestions
    }

