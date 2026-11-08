import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.database.database import get_db_connection
from app.utils.validators import validate_dataframe

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
SAMPLE_DIR = BASE_DIR / "data" / "sample"

class DataService:
    def __init__(self):
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
        self._ensure_sample_dataset()

    def _ensure_sample_dataset(self):
        """
        Creates a realistic smart-meter household dataset based on UCI patterns
        spanning 120 days of hourly and daily consumption, clearly documented.
        """
        sample_path = SAMPLE_DIR / "household_sample_demo.csv"
        template_path = SAMPLE_DIR / "smartgrid_template.csv"
        
        # 1. Create a downloadable template CSV
        if not template_path.exists():
            template_df = pd.DataFrame([
                {"datetime": "2024-01-01 00:00:00", "power_consumption": 0.45},
                {"datetime": "2024-01-01 01:00:00", "power_consumption": 0.38},
                {"datetime": "2024-01-01 02:00:00", "power_consumption": 0.32},
                {"datetime": "2024-01-01 03:00:00", "power_consumption": 0.29},
                {"datetime": "2024-01-01 04:00:00", "power_consumption": 0.31},
            ])
            template_df.to_csv(template_path, index=False)

        # 2. Create realistic demo dataset if not present
        if not sample_path.exists():
            np.random.seed(42)
            start_date = datetime(2024, 1, 1, 0, 0)
            records = []
            
            # Generate 120 days of hourly data (2880 records)
            for i in range(120 * 24):
                dt = start_date + timedelta(hours=i)
                hour = dt.hour
                weekday = dt.weekday()
                is_weekend = 1 if weekday >= 5 else 0
                
                # Base load (refrigerator, standby electronics): ~0.3 - 0.6 kW
                base_load = 0.4 + np.random.normal(0, 0.05)
                
                # Morning peak (06:00 - 09:00): breakfast, water heating, lighting
                morning_peak = 1.8 * np.exp(-((hour - 7.5) ** 2) / 3.0)
                
                # Evening peak (17:00 - 22:00): cooking, HVAC, TV, laundry
                evening_peak = 2.4 * np.exp(-((hour - 19.5) ** 2) / 4.0)
                
                # Weekend daytime activity
                weekend_boost = 0.5 * is_weekend if 10 <= hour <= 16 else 0
                
                # Random variation / appliance spike
                random_spike = np.random.exponential(0.15) if np.random.rand() > 0.85 else 0
                
                # Seasonality: slight variation over the months
                seasonal = 0.3 * np.sin(2 * np.pi * i / (120 * 24))
                
                hourly_kw = max(0.15, base_load + morning_peak + evening_peak + weekend_boost + random_spike + seasonal)
                
                # UCI style sub-metering approximations (Wh)
                sub1_kitchen = max(0.0, (morning_peak * 0.4 + (1.2 if hour in [18, 19, 20] else 0.0)) * 1000 / 60)
                sub2_laundry = max(0.0, (1.5 if (is_weekend and hour in [10, 11, 14, 15]) else 0.0) * 1000 / 60)
                sub3_climate = max(0.0, (base_load * 0.5 + evening_peak * 0.5) * 1000 / 60)
                
                records.append({
                    "Date": dt.strftime("%d/%m/%Y"),
                    "Time": dt.strftime("%H:%M:%S"),
                    "Global_active_power": round(hourly_kw, 3),
                    "Global_reactive_power": round(hourly_kw * 0.12 + np.random.uniform(0.01, 0.05), 3),
                    "Voltage": round(230.0 + np.random.normal(0, 2.5), 2),
                    "Global_intensity": round(hourly_kw * 1000 / 230.0, 2),
                    "Sub_metering_1": round(sub1_kitchen, 1),
                    "Sub_metering_2": round(sub2_laundry, 1),
                    "Sub_metering_3": round(sub3_climate, 1)
                })
                
            demo_df = pd.DataFrame(records)
            demo_df.to_csv(sample_path, sep=';', index=False)

    def get_template_path(self) -> Path:
        return SAMPLE_DIR / "smartgrid_template.csv"

    def get_demo_dataset_path(self) -> Path:
        return SAMPLE_DIR / "household_sample_demo.csv"

    def save_uploaded_file(self, filename: str, content: bytes) -> Dict[str, Any]:
        """Save uploaded CSV to data/uploads and analyze initial stats."""
        safe_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
        file_path = UPLOAD_DIR / safe_filename
        
        with open(file_path, "wb") as f:
            f.write(content)
            
        # Try reading with comma and semicolon separators
        df = None
        for sep in [',', ';', '\t']:
            try:
                temp_df = pd.read_csv(file_path, sep=sep, nrows=50)
                if len(temp_df.columns) > 1:
                    df = pd.read_csv(file_path, sep=sep, low_memory=False)
                    break
            except Exception:
                continue
                
        if df is None:
            raise ValueError("Unable to parse CSV file. Please ensure it is a valid comma or semicolon delimited CSV.")
            
        validation = validate_dataframe(df)
        
        # Save dataset entry to database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO datasets (
                filename, file_path, uploaded_at, original_rows, original_cols,
                columns_list, is_uci_format, status, summary_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            filename,
            str(file_path),
            datetime.now().isoformat(),
            validation["total_rows"],
            validation["total_cols"],
            json.dumps(validation["columns"]),
            1 if validation["format_type"] == "uci" else 0,
            "uploaded",
            json.dumps(validation)
        ))
        dataset_id = cursor.lastrowid
        
        # Set as active dataset in settings if none is active
        cursor.execute("SELECT value FROM settings WHERE key='active_dataset_id'")
        row = cursor.fetchone()
        if not row or not row["value"]:
            cursor.execute("UPDATE settings SET value=? WHERE key='active_dataset_id'", (str(dataset_id),))
            
        conn.commit()
        conn.close()
        
        validation["dataset_id"] = dataset_id
        validation["file_path"] = str(file_path)
        return validation

    def load_demo_dataset(self) -> Dict[str, Any]:
        """Loads the pre-generated realistic demo dataset."""
        demo_path = self.get_demo_dataset_path()
        with open(demo_path, "rb") as f:
            content = f.read()
        res = self.save_uploaded_file("DEMO_UCI_Household_Power_120Days.csv", content)
        res["is_demo"] = True
        return res

    def list_datasets(self) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM datasets ORDER BY id DESC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def get_dataset_info(self, dataset_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        if dataset_id:
            cursor.execute("SELECT * FROM datasets WHERE id=?", (dataset_id,))
        else:
            # Get active dataset from settings
            cursor.execute("SELECT value FROM settings WHERE key='active_dataset_id'")
            active_row = cursor.fetchone()
            if active_row and active_row["value"]:
                cursor.execute("SELECT * FROM datasets WHERE id=?", (int(active_row["value"]),))
            else:
                cursor.execute("SELECT * FROM datasets ORDER BY id DESC LIMIT 1")
                
        row = cursor.fetchone()
        conn.close()
        if row:
            data = dict(row)
            if data.get("summary_json"):
                data["summary"] = json.loads(data["summary_json"])
            return data
        return None

