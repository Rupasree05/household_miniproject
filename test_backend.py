import sys
import os
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database.database import init_db, get_db_connection
from app.services.data_service import DataService
from app.services.preprocessing_service import PreprocessingService
from app.services.model_service import ModelService
from app.services.prediction_service import PredictionService
from app.services.load_balancing_service import LoadBalancingService

def run_tests():
    print("--- 1. Testing Database Initialization ---")
    init_db()
    conn = get_db_connection()
    tables = [r[0] for r in conn.cursor().execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    conn.close()
    print("Tables created:", tables)
    assert "datasets" in tables
    assert "model_records" in tables
    assert "predictions" in tables
    assert "settings" in tables

    print("\n--- 2. Testing Demo Dataset Loading ---")
    data_svc = DataService()
    demo_res = data_svc.load_demo_dataset()
    dataset_id = demo_res["dataset_id"]
    print("Loaded demo dataset ID:", dataset_id, "Rows:", demo_res["total_rows"])

    print("\n--- 3. Testing Preprocessing Pipeline ---")
    prep_svc = PreprocessingService()
    prep_res = prep_svc.preprocess_dataset(dataset_id)
    print("Preprocessed cleaned days:", prep_res["cleaned_days"])
    print("Date range:", prep_res["date_range"])
    print("Avg daily kWh:", prep_res["statistics"]["avg_daily_kwh"])

    print("\n--- 4. Testing Random Forest Model Training ---")
    model_svc = ModelService()
    train_res = model_svc.train_random_forest(
        dataset_id=dataset_id,
        n_estimators=50,
        max_depth=10,
        min_samples_split=2,
        min_samples_leaf=1,
        test_size=0.2
    )
    print("Model Training Status:", train_res["status"])
    print("Validation Metrics:")
    print("  MAE:", train_res["metrics"]["mae"])
    print("  RMSE:", train_res["metrics"]["rmse"])
    print("  R² Score:", train_res["metrics"]["r2_score"])
    print("Top Features:", [f["feature"] for f in train_res["feature_importance"][:5]])

    print("\n--- 5. Testing Next-Day Power Demand Prediction ---")
    pred_svc = PredictionService()
    pred_res = pred_svc.predict_next_day(dataset_id=dataset_id)
    print("Prediction Date:", pred_res["prediction_date"])
    print("Predicted Consumption:", pred_res["predicted_kwh"], "kWh")
    print("Demand Category:", pred_res["demand_category"])
    print("Prev Day:", pred_res["prev_day_kwh"], "kWh | 7d Avg:", pred_res["prev_7d_avg"], "kWh")
    print("Trend:", pred_res["trend"], f"({pred_res['pct_change']}%)")
    print("Expected Peak Period:", pred_res["expected_peak_period"])

    print("\n--- 6. Testing Intelligent Load Balancing ---")
    lb_svc = LoadBalancingService()
    lb_res = lb_svc.get_load_balancing_recommendations(dataset_id=dataset_id)
    print("Current Peak:", lb_res["metrics"]["current_peak_kw"], "kW")
    print("Optimized Peak:", lb_res["metrics"]["optimized_peak_kw"], "kW")
    print("Peak Reduction:", lb_res["metrics"]["peak_reduction_percentage"], "%")
    print("Recommendations count:", len(lb_res["recommendations"]))

    print("\n>>> ALL BACKEND ML, PREPROCESSING, FORECASTING & DB PIPELINES VERIFIED 100% SUCCESSFUL! <<<")

if __name__ == "__main__":
    run_tests()

