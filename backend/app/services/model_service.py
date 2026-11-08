import os
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from sklearn.ensemble import RandomForestRegressor

from app.database.database import get_db_connection
from app.services.feature_engineering import generate_features, prepare_train_test_data, FEATURE_COLUMNS
from app.utils.metrics import calculate_metrics

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_DIR = BASE_DIR / "app" / "saved_models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

class ModelService:
    def __init__(self):
        pass

    def train_random_forest(
        self,
        dataset_id: int,
        n_estimators: int = 100,
        max_depth: Optional[int] = 12,
        min_samples_split: int = 2,
        min_samples_leaf: int = 1,
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """
        Trains RandomForestRegressor with strict chronological train/test split,
        evaluates performance metrics, and calculates feature importances.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM datasets WHERE id=?", (dataset_id,))
        dataset = cursor.fetchone()
        if not dataset:
            conn.close()
            raise ValueError(f"Dataset {dataset_id} not found.")

        # Locate cleaned daily CSV
        clean_file_path = Path(dataset["file_path"]).parent / f"cleaned_{dataset_id}.csv"
        if not clean_file_path.exists():
            conn.close()
            raise FileNotFoundError(f"Cleaned dataset file {clean_file_path} not found. Please run preprocessing first.")

        daily_df = pd.read_csv(clean_file_path)
        daily_df['date'] = pd.to_datetime(daily_df['date'])

        # Generate lag and rolling features
        feature_df = generate_features(daily_df)

        # Time-based train-test split
        train_df, test_df, features = prepare_train_test_data(feature_df, test_size=test_size)

        X_train = train_df[features].values
        y_train = train_df['target'].values

        X_test = test_df[features].values
        y_test = test_df['target'].values

        # Train Random Forest Regressor
        rf = RandomForestRegressor(
            n_estimators=int(n_estimators),
            max_depth=int(max_depth) if max_depth else None,
            min_samples_split=int(min_samples_split),
            min_samples_leaf=int(min_samples_leaf),
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)

        # Evaluate on test set
        y_pred = rf.predict(X_test)
        metrics = calculate_metrics(y_test, y_pred)

        # Calculate feature importances
        importances = rf.feature_importances_
        feature_importance_list = [
            {"feature": feat, "importance": round(float(imp), 4), "percentage": round(float(imp) * 100, 2)}
            for feat, imp in sorted(zip(features, importances), key=lambda x: x[1], reverse=True)
        ]

        # Actual vs Predicted comparison series for charting
        comparison = []
        for dt, actual, pred in zip(test_df['date'], y_test, y_pred):
            comparison.append({
                "date": dt.strftime('%Y-%m-%d'),
                "actual": round(float(actual), 2),
                "predicted": round(float(pred), 2),
                "residual": round(float(actual - pred), 2)
            })

        # Save model package (model, features list, metrics, percentiles for classification)
        # Calculate historical percentiles on target for demand categorizing
        p25 = float(np.percentile(y_train, 25))
        p75 = float(np.percentile(y_train, 75))
        p90 = float(np.percentile(y_train, 90))

        model_package = {
            "model": rf,
            "features": features,
            "dataset_id": dataset_id,
            "trained_at": datetime.now().isoformat(),
            "hyperparameters": {
                "n_estimators": n_estimators,
                "max_depth": max_depth,
                "min_samples_split": min_samples_split,
                "min_samples_leaf": min_samples_leaf
            },
            "metrics": metrics,
            "thresholds": {
                "p25": round(p25, 2),
                "p75": round(p75, 2),
                "p90": round(p90, 2)
            }
        }

        # Save model file
        active_model_path = MODEL_DIR / "random_forest_model.pkl"
        dataset_model_path = MODEL_DIR / f"rf_model_dataset_{dataset_id}.pkl"
        joblib.dump(model_package, active_model_path)
        joblib.dump(model_package, dataset_model_path)

        # Save to database
        # Deactivate previous active models
        cursor.execute("UPDATE model_records SET is_active=0")
        cursor.execute('''
            INSERT INTO model_records (
                dataset_id, model_name, trained_at, n_estimators, max_depth,
                min_samples_split, min_samples_leaf, train_rows, test_rows,
                mae, rmse, r2_score, feature_importance_json, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ''', (
            dataset_id,
            "RandomForestRegressor",
            datetime.now().isoformat(),
            n_estimators,
            max_depth,
            min_samples_split,
            min_samples_leaf,
            len(train_df),
            len(test_df),
            metrics["mae"],
            metrics["rmse"],
            metrics["r2_score"],
            json.dumps(feature_importance_list)
        ))
        model_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            "model_id": model_id,
            "dataset_id": dataset_id,
            "status": "success",
            "message": "Random Forest model successfully trained and validated.",
            "hyperparameters": {
                "n_estimators": n_estimators,
                "max_depth": max_depth,
                "min_samples_split": min_samples_split,
                "min_samples_leaf": min_samples_leaf
            },
            "data_split": {
                "total_samples": len(feature_df.dropna()),
                "train_samples": len(train_df),
                "test_samples": len(test_df),
                "test_ratio": test_size
            },
            "metrics": metrics,
            "feature_importance": feature_importance_list,
            "actual_vs_predicted": comparison,
            "thresholds": model_package["thresholds"]
        }

    def get_active_model_metrics(self) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM model_records WHERE is_active=1 ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None

        data = dict(row)
        if data.get("feature_importance_json"):
            data["feature_importance"] = json.loads(data["feature_importance_json"])
        return data

    def load_active_model(self) -> Optional[Dict[str, Any]]:
        active_model_path = MODEL_DIR / "random_forest_model.pkl"
        if not active_model_path.exists():
            return None
        return joblib.load(active_model_path)

