import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.database.database import get_db_connection

class LoadBalancingService:
    def __init__(self):
        pass

    def get_load_balancing_recommendations(self, dataset_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Analyzes load curve patterns and produces peak-shifting recommendations,
        pre/post load curves, and savings opportunities.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

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
        
        # Get electricity tariff from settings
        cursor.execute("SELECT value FROM settings WHERE key='electricity_tariff'")
        tariff_row = cursor.fetchone()
        tariff = float(tariff_row["value"]) if tariff_row else 0.18

        cursor.execute("SELECT value FROM settings WHERE key='peak_threshold_kw'")
        peak_row = cursor.fetchone()
        peak_threshold_kw = float(peak_row["value"]) if peak_row else 4.5

        conn.close()

        if not dataset:
            return {
                "has_data": False,
                "message": "No preprocessed dataset available. Please upload and preprocess a smart-meter dataset."
            }

        dataset_id = dataset["id"]
        has_hourly = bool(dataset["has_hourly"])
        clean_file_path = Path(dataset["file_path"]).parent / f"cleaned_{dataset_id}.csv"

        if not clean_file_path.exists():
            return {
                "has_data": False,
                "message": "Cleaned dataset not found."
            }

        daily_df = pd.read_csv(clean_file_path)
        daily_df['date'] = pd.to_datetime(daily_df['date'])

        # Daily stats
        avg_daily_kwh = float(daily_df['power_consumption'].mean())
        peak_daily_kwh = float(daily_df['power_consumption'].max())

        # If dataset has hourly data, extract typical 24-hour profile
        hourly_profile = []
        is_subdaily = False

        # Attempt to inspect original dataset to get hourly breakdown if available
        orig_file = Path(dataset["file_path"])
        if has_hourly and orig_file.exists():
            try:
                # Read sample or full file for hourly averages
                sep = ';' if ';' in open(orig_file, 'r').readline() else ','
                raw_df = pd.read_csv(orig_file, sep=sep, na_values=['?'], nrows=20000, low_memory=False)
                
                cols_lower = {str(c).strip().lower(): str(c).strip() for c in raw_df.columns}
                if 'time' in cols_lower and ('global_active_power' in cols_lower or 'power' in cols_lower):
                    time_col = cols_lower['time']
                    pwr_col = cols_lower.get('global_active_power') or cols_lower.get('power')
                    raw_df['hour'] = pd.to_datetime(raw_df[time_col], format="%H:%M:%S", errors='coerce').dt.hour
                    raw_df['power_val'] = pd.to_numeric(raw_df[pwr_col], errors='coerce')
                    raw_df = raw_df.dropna(subset=['hour', 'power_val'])
                    
                    if not raw_df.empty:
                        hourly_means = raw_df.groupby('hour')['power_val'].mean()
                        is_subdaily = True
                        for h in range(24):
                            kw = float(hourly_means.get(h, 1.2))
                            hourly_profile.append({"hour": f"{h:02d}:00", "hour_int": h, "original_kw": round(kw, 2)})
            except Exception:
                pass

        # Fallback profile based on standard household distribution if subdaily not directly parsed
        if not hourly_profile:
            # Typical household profile: Morning bump (07-09), Evening peak (18-22), Night valley (00-05)
            profile_distribution = [
                0.025, 0.022, 0.020, 0.020, 0.022, 0.030, # 00 - 05
                0.045, 0.065, 0.060, 0.045, 0.040, 0.038, # 06 - 11
                0.040, 0.038, 0.038, 0.042, 0.050, 0.065, # 12 - 17
                0.085, 0.095, 0.090, 0.075, 0.045, 0.035  # 18 - 23
            ]
            for h, fraction in enumerate(profile_distribution):
                hourly_profile.append({
                    "hour": f"{h:02d}:00",
                    "hour_int": h,
                    "original_kw": round(avg_daily_kwh * fraction, 2)
                })

        # Calculate peak hours and off-peak hours
        hourly_sorted = sorted(hourly_profile, key=lambda x: x["original_kw"], reverse=True)
        peak_hours = [x["hour"] for x in hourly_sorted[:4]]
        offpeak_hours = [x["hour"] for x in hourly_sorted[-6:]]
        peak_kw = max(x["original_kw"] for x in hourly_profile)
        min_kw = min(x["original_kw"] for x in hourly_profile)

        # Simulation of load shifting (shift ~22% of high peak energy to lowest off-peak hours)
        shift_fraction = 0.22
        simulated_profile = []
        total_shifted_kwh = 0.0

        for item in hourly_profile:
            h = item["hour_int"]
            orig = item["original_kw"]
            # If in peak window (17 - 21)
            if 17 <= h <= 21:
                curtailed = orig * shift_fraction
                total_shifted_kwh += curtailed
                opt = round(orig - curtailed, 2)
            else:
                opt = orig
            simulated_profile.append({
                "hour": item["hour"],
                "original_kw": orig,
                "optimized_kw": opt,
                "is_peak": 17 <= h <= 21,
                "is_offpeak": h in [1, 2, 3, 4, 13, 14]
            })

        # Distribute shifted energy to offpeak hours (01:00 to 05:00 and 13:00 to 14:00)
        offpeak_slots = [p for p in simulated_profile if p["is_offpeak"]]
        kwh_per_slot = total_shifted_kwh / max(1, len(offpeak_slots))

        for p in simulated_profile:
            if p["is_offpeak"]:
                p["optimized_kw"] = round(p["optimized_kw"] + kwh_per_slot, 2)

        opt_peak_kw = max(p["optimized_kw"] for p in simulated_profile)
        peak_reduction_kw = round(peak_kw - opt_peak_kw, 2)
        peak_reduction_pct = round((peak_reduction_kw / (peak_kw + 1e-5)) * 100, 1)

        # Potential financial savings under Time-Of-Use (TOU) tariff
        # Assuming peak tariff is 1.5x standard and off-peak is 0.7x standard
        peak_rate = tariff * 1.5
        offpeak_rate = tariff * 0.7
        monthly_cost_orig = (avg_daily_kwh * tariff) * 30.0
        daily_shift_saving = total_shifted_kwh * (peak_rate - offpeak_rate)
        monthly_saving = round(daily_shift_saving * 30.0, 2)

        # Realistic, professional recommendations
        recommendations = [
            {
                "id": "rec_laundry",
                "category": "Appliances",
                "title": "Shift Heavy Laundry & Dishwashing Cycles",
                "impact": "High Impact",
                "current_time": "18:00 - 21:00 (Peak Period)",
                "recommended_time": "22:30 - 06:00 or 12:00 - 15:00 (Off-Peak)",
                "estimated_reduction": f"~{round(0.8 * peak_reduction_kw, 2)} kW peak reduction",
                "description": "Running washing machines, dryers, and dishwashers during off-peak times significantly flattens the household evening demand peak."
            },
            {
                "id": "rec_water_heater",
                "category": "Water Heating",
                "title": "Smart Water Heater Pre-heating",
                "impact": "High Impact",
                "current_time": "07:00 - 08:30 & 19:00 - 20:30",
                "recommended_time": "04:00 - 06:00 & 14:00 - 16:00",
                "estimated_reduction": f"~{round(0.5 * peak_reduction_kw, 2)} kW peak reduction",
                "description": "Pre-heating water tanks just prior to active household hours leverages insulated thermal storage without straining the grid during peak intervals."
            },
            {
                "id": "rec_ev",
                "category": "E-Mobility",
                "title": "EV Charging Night Schedule",
                "impact": "Very High Impact",
                "current_time": "18:30 (Upon arriving home)",
                "recommended_time": "00:30 - 05:30 (Deep Off-Peak)",
                "estimated_reduction": "Prevents instantaneous 3.3 kW - 7.2 kW grid surge",
                "description": "Configure vehicle onboard charge timers or smart EVSE to delay charging until past midnight when baseload demand is at minimum."
            },
            {
                "id": "rec_concurrency",
                "category": "Behavioral",
                "title": "Stagger High-Wattage Simultaneous Loads",
                "impact": "Medium Impact",
                "current_time": "Simultaneous oven + microwave + HVAC + laundry",
                "recommended_time": "Sequential usage with 20-30 min intervals",
                "estimated_reduction": "Reduces peak spike by up to 35%",
                "description": "Avoid powering multiple high-wattage resistive appliances at the same instant to keep instantaneous demand below household breaker threshold."
            }
        ]

        return {
            "has_data": True,
            "dataset_id": dataset_id,
            "is_subdaily": is_subdaily,
            "peak_window": "17:00 - 21:00",
            "offpeak_window": "23:00 - 06:00 & 13:00 - 15:00",
            "metrics": {
                "current_peak_kw": peak_kw,
                "optimized_peak_kw": opt_peak_kw,
                "peak_reduction_kw": peak_reduction_kw,
                "peak_reduction_percentage": peak_reduction_pct,
                "monthly_cost_estimate": round(monthly_cost_orig, 2),
                "estimated_monthly_savings": monthly_saving,
                "tariff_rate": tariff
            },
            "load_curves": simulated_profile,
            "recommendations": recommendations,
            "disclaimer": "This system provides intelligent advisory load-balancing recommendations based on statistical consumption patterns and does not directly control physical electrical appliances or utility grid switches."
        }

