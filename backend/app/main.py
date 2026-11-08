from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os

from app.database.database import init_db, get_db_connection
from app.api import (
    upload,
    preprocessing,
    training,
    prediction,
    dashboard,
    load_balancing,
    insights,
    history,
    settings
)
from app.services.data_service import DataService

app = FastAPI(
    title="SmartGrid AI API",
    description="Intelligent Household Power Demand Prediction & Load Balancing System using Random Forest Regression",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to ensure database tables and sample files exist
@app.on_event("startup")
async def startup_event():
    init_db()
    data_svc = DataService() # ensures template & demo dataset are created

# Include all API modules
app.include_router(upload.router)
app.include_router(preprocessing.router)
app.include_router(training.router)
app.include_router(prediction.router)
app.include_router(dashboard.router)
app.include_router(load_balancing.router)
app.include_router(insights.router)
app.include_router(history.router)
app.include_router(settings.router)

@app.get("/api/health")
async def health_check():
    active_model = False
    model_path = Path(__file__).resolve().parent / "saved_models" / "random_forest_model.pkl"
    if model_path.exists():
        active_model = True

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM datasets")
    ds_count = cursor.fetchone()["count"]
    conn.close()

    return {
        "status": "healthy",
        "service": "SmartGrid AI Backend",
        "database": "connected",
        "datasets_count": ds_count,
        "model_trained": active_model
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to SmartGrid AI – Intelligent Household Power Demand Prediction & Load Balancing System API",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
