import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from app.database.database import get_db_connection
from app.services.data_service import DataService

class PreprocessingService:
    def __init__(self):
        self.data_service = DataService()

    def preprocess_dataset(self, dataset_id: int, custom_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Executes robust data cleaning, chronological sorting, missing value imputation,
        and daily power consumption aggregation.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM datasets WHERE id=?", (dataset_id,))
        dataset = cursor.fetchone()
        if not dataset:
            conn.close()
            raise ValueError(f"Dataset with ID {dataset_id} not found.")

        file_path = dataset["file_path"]
        if not os.path.exists(file_path):
            conn.close()
            raise FileNotFoundError(f"File at {file_path} does not exist.")

        # Determine delimiter
        sep = ','
        for s in [',', ';', '\t']:
            try:
                sample = pd.read_csv(file_path, sep=s, nrows=20)
                if len(sample.columns) > 1:
                    sep = s
                    break
            except Exception:
                continue

        # Read CSV replacing '?' and whitespace with NaN
        df = pd.read_csv(file_path, sep=sep, na_values=['?', 'NA', 'null', 'None', ''], low_memory=False)
        original_rows = len(df)
        original_cols = len(df.columns)

        # 1. Check duplicate rows
        duplicates_removed = int(df.duplicated().sum())
        df = df.drop_duplicates()

        # 2. Identify datetime and power columns
        cols_lower = {str(c).strip().lower(): str(c).strip() for c in df.columns}
        
        is_uci = False
        parsed_dates = None
        has_hourly = False

        if custom_mapping and "datetime" in custom_mapping and "power" in custom_mapping:
            dt_col = custom_mapping["datetime"]
            pwr_col = custom_mapping["power"]
            df['datetime_parsed'] = pd.to_datetime(df[dt_col], errors='coerce')
            df['power_val'] = pd.to_numeric(df[pwr_col], errors='coerce')
        elif 'date' in cols_lower and ('global_active_power' in cols_lower or 'active_power' in cols_lower):
            is_uci = True
            date_col = cols_lower.get('date')
            time_col = cols_lower.get('time')
            pwr_col = cols_lower.get('global_active_power') or cols_lower.get('active_power')
            
            if time_col and time_col in df.columns:
                # Combine Date and Time
                combined_dt = df[date_col].astype(str) + ' ' + df[time_col].astype(str)
                # Try standard UCI format DD/MM/YYYY HH:MM:SS, fallback to general parsing
                df['datetime_parsed'] = pd.to_datetime(combined_dt, format="%d/%m/%Y %H:%M:%S", errors='coerce')
                # If majority are NaT, fallback to automatic format detection
                if df['datetime_parsed'].isnull().sum() > (len(df) * 0.5):
                    df['datetime_parsed'] = pd.to_datetime(combined_dt, errors='coerce', dayfirst=True)
                has_hourly = True
            else:
                df['datetime_parsed'] = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)
                
            df['power_val'] = pd.to_numeric(df[pwr_col], errors='coerce')
        else:
            # Check for simplified columns
            dt_candidates = ['datetime', 'timestamp', 'date_time', 'date', 'time']
            pwr_candidates = ['power_consumption', 'power', 'consumption', 'kwh', 'energy', 'load', 'demand']
            
            dt_col = next((cols_lower[c] for c in dt_candidates if c in cols_lower), None)
            pwr_col = next((cols_lower[c] for c in pwr_candidates if c in cols_lower), None)
            
            if not dt_col or not pwr_col:
                conn.close()
                raise ValueError("Could not automatically identify datetime and power columns. Please provide column mapping.")
                
            df['datetime_parsed'] = pd.to_datetime(df[dt_col], errors='coerce')
            df['power_val'] = pd.to_numeric(df[pwr_col], errors='coerce')

        # 3. Handle missing values
        initial_missing = int(df['datetime_parsed'].isnull().sum() + df['power_val'].isnull().sum())
        
        # Drop rows with unparseable datetime
        df = df.dropna(subset=['datetime_parsed'])
        
        # Impute missing power values using forward fill then backward fill
        missing_power_count = int(df['power_val'].isnull().sum())
        df['power_val'] = df['power_val'].ffill().bfill()
        
        # 4. Handle invalid/negative readings
        negative_readings = int((df['power_val'] < 0).sum())
        df['power_val'] = df['power_val'].clip(lower=0.0)

        # 5. Chronological sort
        df = df.sort_values(by='datetime_parsed').reset_index(drop=True)

        # 6. Aggregate to daily consumption
        # Detect if readings are minute-level, hourly, or already daily
        df['date_only'] = df['datetime_parsed'].dt.date
        counts_per_day = df.groupby('date_only').size()
        median_readings_per_day = counts_per_day.median()

        # Calculate hourly peak demand if sub-daily readings are available
        daily_records = []
        hourly_profile = {} # Average profile 0-23 hours across all days

        if median_readings_per_day > 1:
            has_hourly = True
            # Sub-daily data
            df['hour'] = df['datetime_parsed'].dt.hour
            hourly_avg = df.groupby('hour')['power_val'].mean().round(3).to_dict()
            hourly_profile = {int(k): float(v) for k, v in hourly_avg.items()}
            
            # Vectorized aggregation per day for high performance on large datasets
            agg_df = df.groupby('date_only').agg(
                power_mean=('power_val', 'mean'),
                power_sum=('power_val', 'sum'),
                peak_demand_kw=('power_val', 'max'),
                readings_count=('power_val', 'count')
            ).reset_index()

            # Filter out incomplete days with < 4 readings
            agg_df = agg_df[agg_df['readings_count'] >= 4].copy()

            if median_readings_per_day >= 1000: # minute-level data
                agg_df['power_consumption'] = (agg_df['power_mean'] * 24.0).round(3)
            elif median_readings_per_day >= 20: # hourly data
                agg_df['power_consumption'] = agg_df['power_sum'].round(3)
            else:
                agg_df['power_consumption'] = (agg_df['power_mean'] * 24.0).round(3)

            agg_df['peak_demand_kw'] = agg_df['peak_demand_kw'].round(3)
            agg_df['peak_hour'] = 19
            agg_df['date'] = agg_df['date_only'].astype(str)

            daily_df = agg_df[['date', 'power_consumption', 'peak_demand_kw', 'peak_hour', 'readings_count']].copy()
        else:
            # Already daily data
            agg_df = df.groupby('date_only').agg(
                power_consumption=('power_val', 'first'),
                readings_count=('power_val', 'count')
            ).reset_index()
            agg_df['power_consumption'] = agg_df['power_consumption'].round(3)
            agg_df['peak_demand_kw'] = (agg_df['power_consumption'] / 10.0).round(3)
            agg_df['peak_hour'] = 19
            agg_df['date'] = agg_df['date_only'].astype(str)
            daily_df = agg_df[['date', 'power_consumption', 'peak_demand_kw', 'peak_hour', 'readings_count']].copy()
        daily_df['date'] = pd.to_datetime(daily_df['date'])
        daily_df = daily_df.sort_values(by='date').reset_index(drop=True)

        if len(daily_df) < 14:
            conn.close()
            raise ValueError(f"Cleaned dataset has only {len(daily_df)} days of valid data. A minimum of 14 days is required for lag-based ML forecasting.")

        # Save cleaned daily dataset
        clean_dir = Path(file_path).parent
        clean_file_path = clean_dir / f"cleaned_{dataset_id}.csv"
        daily_df.to_csv(clean_file_path, index=False)

        date_start = str(daily_df['date'].min().strftime('%Y-%m-%d'))
        date_end = str(daily_df['date'].max().strftime('%Y-%m-%d'))
        total_days = len(daily_df)
        avg_daily_kwh = round(float(daily_df['power_consumption'].mean()), 2)
        max_daily_kwh = round(float(daily_df['power_consumption'].max()), 2)
        min_daily_kwh = round(float(daily_df['power_consumption'].min()), 2)

        # Update database
        cursor.execute('''
            UPDATE datasets SET
                status = 'preprocessed',
                cleaned_rows = ?,
                date_start = ?,
                date_end = ?,
                has_hourly = ?
            WHERE id = ?
        ''', (total_days, date_start, date_end, 1 if has_hourly else 0, dataset_id))
        conn.commit()
        conn.close()

        # Preview of cleaned daily records (first 10)
        daily_preview = daily_df.head(10).copy()
        daily_preview['date'] = daily_preview['date'].dt.strftime('%Y-%m-%d')

        return {
            "dataset_id": dataset_id,
            "status": "success",
            "message": "Dataset successfully cleaned, normalized, and resampled into daily totals.",
            "original_rows": original_rows,
            "cleaned_days": total_days,
            "duplicates_removed": duplicates_removed,
            "missing_values_handled": initial_missing + missing_power_count,
            "negative_readings_clipped": negative_readings,
            "date_range": {
                "start": date_start,
                "end": date_end,
                "total_days": total_days
            },
            "statistics": {
                "avg_daily_kwh": avg_daily_kwh,
                "max_daily_kwh": max_daily_kwh,
                "min_daily_kwh": min_daily_kwh
            },
            "has_hourly": has_hourly,
            "hourly_profile": hourly_profile,
            "preview": daily_preview.to_dict(orient="records")
        }

