import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from app.database.database import get_db_connection
from app.services.model_service import ModelService
from app.services.feature_engineering import FEATURE_COLUMNS

class PredictionService:
    def __init__(self):
        self.model_service = ModelService()

    def predict_next_day(
        self,
        dataset_id: Optional[int] = None,
        target_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes next-day power demand prediction for a specific date or next logical date.
        Uses the trained Random Forest Regressor and strictly past feature lags.
        """
        model_package = self.model_service.load_active_model()
        if not model_package:
            raise ValueError("No active trained Random Forest model found. Please train a model first in Model Training.")

        rf_model = model_package["model"]
        features = model_package["features"]
        thresholds = model_package["thresholds"]
        metrics = model_package["metrics"]

        if not dataset_id:
            dataset_id = model_package["dataset_id"]

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM datasets WHERE id=?", (dataset_id,))
        dataset = cursor.fetchone()
        if not dataset:
            conn.close()
            raise ValueError(f"Dataset {dataset_id} not found.")

        clean_file_path = Path(dataset["file_path"]).parent / f"cleaned_{dataset_id}.csv"
        if not clean_file_path.exists():
            conn.close()
            raise FileNotFoundError(f"Cleaned dataset {clean_file_path} not found.")

        daily_df = pd.read_csv(clean_file_path)
        daily_df['date'] = pd.to_datetime(daily_df['date'])
        daily_df = daily_df.sort_values(by='date').reset_index(drop=True)

        latest_date = daily_df['date'].max()

        # If no target date provided, predict for day after latest date
        if not target_date:
            predict_dt = latest_date + timedelta(days=1)
        else:
            predict_dt = pd.to_datetime(target_date)

        # Check if actual consumption exists for this date (e.g. backtesting)
        actual_match = daily_df[daily_df['date'] == predict_dt]
        actual_kwh = float(actual_match['power_consumption'].iloc[0]) if not actual_match.empty else None

        # Build feature vector from records prior to predict_dt
        past_records = daily_df[daily_df['date'] < predict_dt].sort_values(by='date').reset_index(drop=True)
        if len(past_records) < 7:
            conn.close()
            raise ValueError(f"Need at least 7 days of historical consumption before {predict_dt.strftime('%Y-%m-%d')} to generate features.")

        # Lags
        lag_1 = float(past_records['power_consumption'].iloc[-1])
        lag_2 = float(past_records['power_consumption'].iloc[-2]) if len(past_records) >= 2 else lag_1
        lag_3 = float(past_records['power_consumption'].iloc[-3]) if len(past_records) >= 3 else lag_2
        lag_7 = float(past_records['power_consumption'].iloc[-7]) if len(past_records) >= 7 else lag_1

        # Rolling statistics strictly on past data
        window_7 = past_records['power_consumption'].tail(7)
        rolling_mean_7 = float(window_7.mean())
        rolling_max_7 = float(window_7.max())
        rolling_min_7 = float(window_7.min())

        window_30 = past_records['power_consumption'].tail(30)
        rolling_mean_30 = float(window_30.mean()) if len(window_30) >= 7 else rolling_mean_7

        # Trends
        trend_lag1_lag2 = lag_1 - lag_2
        trend_lag1_avg7 = lag_1 - rolling_mean_7

        day = predict_dt.day
        month = predict_dt.month
        day_of_week = predict_dt.dayofweek
        is_weekend = 1 if day_of_week >= 5 else 0

        feature_dict = {
            'day': day,
            'month': month,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'lag_1': lag_1,
            'lag_2': lag_2,
            'lag_3': lag_3,
            'lag_7': lag_7,
            'rolling_mean_7': rolling_mean_7,
            'rolling_mean_30': rolling_mean_30,
            'rolling_max_7': rolling_max_7,
            'rolling_min_7': rolling_min_7,
            'trend_lag1_lag2': trend_lag1_lag2,
            'trend_lag1_avg7': trend_lag1_avg7
        }

        # Vector in exact order expected by trained model
        feature_vector = np.array([[feature_dict[feat] for feat in features]])

        # Execute prediction
        predicted_kwh = float(rf_model.predict(feature_vector)[0])
        predicted_kwh = max(0.5, round(predicted_kwh, 2))

        # Categorize Demand based on training percentiles
        p25 = thresholds.get("p25", 15.0)
        p75 = thresholds.get("p75", 30.0)
        p90 = thresholds.get("p90", 40.0)

        if predicted_kwh <= p25:
            demand_category = "Low Demand"
            category_color = "emerald"
        elif predicted_kwh <= p75:
            demand_category = "Normal Demand"
            category_color = "electric"
        elif predicted_kwh <= p90:
            demand_category = "High Demand"
            category_color = "amber"
        else:
            demand_category = "Very High Demand"
            category_color = "rose"

        # Percentage change compared to previous day
        pct_change = round(((predicted_kwh - lag_1) / (lag_1 + 1e-5)) * 100, 1)
        if pct_change > 5.0:
            trend = "Increasing Demand"
        elif pct_change < -5.0:
            trend = "Decreasing Demand"
        else:
            trend = "Stable Demand"

        # Peak Period Estimation if hourly data exists in dataset
        expected_peak_period = "18:00 - 21:00"
        if bool(dataset["has_hourly"]):
            if "peak_hour" in past_records.columns:
                most_common_peak = int(past_records['peak_hour'].mode().iloc[0])
                expected_peak_period = f"{most_common_peak:02d}:00 - {(most_common_peak + 2) % 24:02d}:00"

        # Uncertainty bounds based on test MAE / RMSE
        mae_uncertainty = metrics.get("mae", 2.0)
        lower_bound = max(0.0, round(predicted_kwh - mae_uncertainty, 2))
        upper_bound = round(predicted_kwh + mae_uncertainty, 2)

        # Prediction error if actual consumption is known
        prediction_error = None
        if actual_kwh is not None:
            prediction_error = round(abs(actual_kwh - predicted_kwh), 2)

        # Store in predictions table
        predict_str = predict_dt.strftime('%Y-%m-%d')
        cursor.execute('''
            INSERT INTO predictions (
                dataset_id, prediction_date, predicted_at, predicted_kwh,
                demand_category, prev_day_kwh, prev_7d_avg, pct_change,
                trend, expected_peak_period, actual_kwh, prediction_error
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dataset_id,
            predict_str,
            datetime.now().isoformat(),
            predicted_kwh,
            demand_category,
            round(lag_1, 2),
            round(rolling_mean_7, 2),
            pct_change,
            trend,
            expected_peak_period,
            actual_kwh,
            prediction_error
        ))
        prediction_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Comparison chart items (past 7 days + predicted day)
        chart_history = []
        for _, row in past_records.tail(7).iterrows():
            chart_history.append({
                "date": row['date'].strftime('%b %d'),
                "consumption": round(float(row['power_consumption']), 2),
                "type": "Historical"
            })
        chart_history.append({
            "date": predict_dt.strftime('%b %d (Predicted)'),
            "consumption": predicted_kwh,
            "type": "Predicted"
        })

        return {
            "prediction_id": prediction_id,
            "prediction_date": predict_str,
            "predicted_kwh": predicted_kwh,
            "demand_category": demand_category,
            "category_color": category_color,
            "prev_day_kwh": round(lag_1, 2),
            "prev_7d_avg": round(rolling_mean_7, 2),
            "prev_30d_avg": round(rolling_mean_30, 2),
            "pct_change": pct_change,
            "trend": trend,
            "expected_peak_period": expected_peak_period,
            "uncertainty": {
                "metric": "MAE (Mean Absolute Error)",
                "mae": mae_uncertainty,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound
            },
            "actual_kwh": actual_kwh,
            "prediction_error": prediction_error,
            "comparison_chart": chart_history,
            "thresholds": thresholds
        }

