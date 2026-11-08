from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.database.database import get_db_connection

router = APIRouter(prefix="/api/history", tags=["Prediction History"])

@router.get("")
async def get_prediction_history(
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = "prediction_date",
    order: str = "desc"
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM predictions WHERE 1=1"
    params = []

    if search:
        query += " AND (prediction_date LIKE ? OR trend LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    if category and category != "all":
        query += " AND demand_category = ?"
        params.append(category)

    # Validate sort field
    allowed_sorts = ["prediction_date", "predicted_at", "predicted_kwh", "prediction_error"]
    col = sort_by if sort_by in allowed_sorts else "prediction_date"
    direction = "ASC" if order.lower() == "asc" else "DESC"

    query += f" ORDER BY {col} {direction}"

    cursor.execute(query, tuple(params))
    records = [dict(r) for r in cursor.fetchall()]

    # Summary statistics
    cursor.execute("SELECT COUNT(*) as total, AVG(predicted_kwh) as avg_pred, AVG(prediction_error) as avg_err FROM predictions")
    stat_row = cursor.fetchone()
    summary = {
        "total_predictions": stat_row["total"] if stat_row else 0,
        "avg_predicted_kwh": round(float(stat_row["avg_pred"]), 2) if stat_row and stat_row["avg_pred"] else 0.0,
        "avg_error_kwh": round(float(stat_row["avg_err"]), 2) if stat_row and stat_row["avg_err"] else 0.0
    }

    conn.close()
    return {
        "status": "success",
        "total": len(records),
        "summary": summary,
        "predictions": records
    }

@router.delete("/{prediction_id}")
async def delete_prediction(prediction_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM predictions WHERE id=?", (prediction_id,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()

    if deleted == 0:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    return {"status": "success", "message": f"Prediction {prediction_id} deleted successfully."}

