import sqlite3
import os
from pathlib import Path

# Database path in backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_DIR = BASE_DIR / "data"
DB_PATH = DB_DIR / "smartgrid.db"

def get_db_connection():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Dataset information table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS datasets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        original_rows INTEGER DEFAULT 0,
        original_cols INTEGER DEFAULT 0,
        cleaned_rows INTEGER DEFAULT 0,
        columns_list TEXT,
        date_start TEXT,
        date_end TEXT,
        is_uci_format BOOLEAN DEFAULT 0,
        has_hourly BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'uploaded',
        summary_json TEXT
    )
    ''')

    # 2. Model training records table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS model_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id INTEGER,
        model_name TEXT NOT NULL,
        trained_at TEXT NOT NULL,
        n_estimators INTEGER,
        max_depth INTEGER,
        min_samples_split INTEGER,
        min_samples_leaf INTEGER,
        train_rows INTEGER,
        test_rows INTEGER,
        mae REAL,
        rmse REAL,
        r2_score REAL,
        feature_importance_json TEXT,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY(dataset_id) REFERENCES datasets(id)
    )
    ''')

    # 3. Prediction history table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id INTEGER,
        prediction_date TEXT NOT NULL,
        predicted_at TEXT NOT NULL,
        predicted_kwh REAL NOT NULL,
        demand_category TEXT NOT NULL,
        prev_day_kwh REAL,
        prev_7d_avg REAL,
        pct_change REAL,
        trend TEXT,
        expected_peak_period TEXT,
        actual_kwh REAL,
        prediction_error REAL,
        notes TEXT,
        FOREIGN KEY(dataset_id) REFERENCES datasets(id)
    )
    ''')

    # 4. Household settings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    ''')

    # Insert default settings if not already present
    default_settings = {
        "household_name": "My Smart Household",
        "electricity_tariff": "0.18", # $ or currency per kWh
        "daily_target_kwh": "25.0",
        "peak_threshold_kw": "4.5",
        "unit": "kWh",
        "active_dataset_id": ""
    }

    for key, val in default_settings.items():
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, val))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
