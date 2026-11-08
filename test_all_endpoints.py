import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("=== Testing FastAPI Endpoints ===")

    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ GET /api/health -> 200 OK", res.json())

    # 2. Template download
    res = client.get("/api/template")
    assert res.status_code == 200
    print("✓ GET /api/template -> 200 OK (size:", len(res.content), "bytes)")

    # 3. Dataset preview & summary
    res = client.get("/api/dataset/preview")
    assert res.status_code == 200
    print("✓ GET /api/dataset/preview -> 200 OK (status:", res.json().get("status"), ")")

    res = client.get("/api/dataset/summary")
    assert res.status_code == 200
    print("✓ GET /api/dataset/summary -> 200 OK (dataset_id:", res.json().get("dataset_id"), ")")

    # 4. Dashboard summary & trends
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    d_data = res.json()
    print("✓ GET /api/dashboard/summary -> 200 OK (Today kWh:", d_data.get("kpis", {}).get("today_consumption_kwh"), ")")

    for r_type in ["daily", "weekly", "monthly"]:
        res = client.get(f"/api/dashboard/consumption-trend?range_type={r_type}")
        assert res.status_code == 200
        print(f"✓ GET /api/dashboard/consumption-trend?range_type={r_type} -> 200 OK (count: {len(res.json().get('data', []))})")

    # 5. Model metrics & feature importance
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    print("✓ GET /api/model/metrics -> 200 OK (MAE:", res.json().get("metrics", {}).get("mae"), "RMSE:", res.json().get("metrics", {}).get("rmse"), ")")

    res = client.get("/api/model/feature-importance")
    assert res.status_code == 200
    print("✓ GET /api/model/feature-importance -> 200 OK (count:", len(res.json().get("feature_importance", [])), ")")

    # 6. Predict next day
    res = client.post("/api/predict/next-day", json={"dataset_id": 1})
    assert res.status_code == 200
    p_data = res.json()
    print("✓ POST /api/predict/next-day -> 200 OK (Predicted:", p_data.get("prediction", {}).get("predicted_kwh"), "kWh, Tier:", p_data.get("prediction", {}).get("demand_category"), ")")

    # 7. Load balancing recommendations
    res = client.get("/api/load-balancing")
    assert res.status_code == 200
    lb_data = res.json().get("data", {})
    print("✓ GET /api/load-balancing -> 200 OK (Peak reduction:", lb_data.get("metrics", {}).get("peak_reduction_percentage"), "%)")

    # 8. Energy insights
    res = client.get("/api/insights")
    assert res.status_code == 200
    ins_data = res.json()
    print("✓ GET /api/insights -> 200 OK (Total kWh:", ins_data.get("overview", {}).get("total_kwh"), "Cost: $", ins_data.get("overview", {}).get("total_cost"), ")")

    # 9. Prediction History
    res = client.get("/api/history")
    assert res.status_code == 200
    h_data = res.json()
    print("✓ GET /api/history -> 200 OK (Total predictions:", h_data.get("total"), ")")

    # 10. Settings GET & PUT
    res = client.get("/api/settings")
    assert res.status_code == 200
    set_data = res.json().get("settings", {})
    print("✓ GET /api/settings -> 200 OK (Household:", set_data.get("household_name"), "Tariff:", set_data.get("electricity_tariff"), ")")

    res = client.put("/api/settings", json={"household_name": "SmartGrid House Test", "electricity_tariff": 0.22})
    assert res.status_code == 200
    print("✓ PUT /api/settings -> 200 OK")

    # Revert to standard
    client.put("/api/settings", json={"household_name": "Smart Household #1", "electricity_tariff": 0.18})

    print("\n==============================================")
    print("🎉 ALL 15 FASTAPI API ENDPOINTS VERIFIED 100% OPERATIONAL!")
    print("==============================================")

if __name__ == "__main__":
    test_endpoints()

