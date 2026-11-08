import pandas as pd
from typing import Dict, Any, Tuple, List, Optional

UCI_COLUMNS = [
    'Date', 'Time', 'Global_active_power', 'Global_reactive_power',
    'Voltage', 'Global_intensity', 'Sub_metering_1', 'Sub_metering_2', 'Sub_metering_3'
]

SIMPLIFIED_COLUMNS = ['datetime', 'power_consumption']

def detect_dataset_format(df: pd.DataFrame) -> Tuple[str, Dict[str, str]]:
    """
    Detect whether dataframe is UCI format, simplified format, or requires custom mapping.
    Returns (format_type, column_mapping)
    """
    cols_lower = {str(c).strip().lower(): str(c).strip() for c in df.columns}
    
    # Check for UCI format
    if 'date' in cols_lower and ('global_active_power' in cols_lower or 'active_power' in cols_lower):
        power_col = cols_lower.get('global_active_power') or cols_lower.get('active_power')
        time_col = cols_lower.get('time', None)
        date_col = cols_lower.get('date')
        return "uci", {
            "date": date_col,
            "time": time_col,
            "power": power_col
        }
    
    # Check for simplified format
    datetime_col = None
    power_col = None
    
    for c in cols_lower:
        if c in ['datetime', 'timestamp', 'date_time', 'time']:
            datetime_col = cols_lower[c]
        if c in ['power_consumption', 'power', 'consumption', 'kwh', 'energy', 'active_power', 'load', 'demand']:
            power_col = cols_lower[c]
            
    if datetime_col and power_col:
        return "simplified", {
            "datetime": datetime_col,
            "power": power_col
        }
        
    return "custom", {}

def validate_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyze dataframe and provide statistics, issues, and column recommendations.
    """
    format_type, mapping = detect_dataset_format(df)
    
    total_rows = len(df)
    total_cols = len(df.columns)
    missing_by_col = df.isnull().sum().to_dict()
    total_missing = sum(missing_by_col.values())
    # Fast duplicate check (sample if large dataset to avoid slow CPU bottleneck)
    if total_rows <= 50000:
        duplicate_rows = int(df.duplicated().sum())
    else:
        duplicate_rows = int(df.head(20000).duplicated().sum())
    
    # Sample preview (first 5 rows converted to JSON serializable dicts)
    preview_df = df.head(10).fillna("")
    preview_rows = preview_df.to_dict(orient="records")
    
    is_valid = (total_rows >= 30) and (format_type != "unknown")
    errors = []
    if total_rows < 30:
        errors.append(f"Dataset has only {total_rows} rows. At least 30 records are required for meaningful time-series feature engineering and validation.")
    if format_type == "custom" and not mapping:
        errors.append("Could not automatically detect Date and Power Consumption columns. Please map your columns.")
        
    return {
        "is_valid": is_valid,
        "format_type": format_type,
        "mapping": mapping,
        "total_rows": total_rows,
        "total_cols": total_cols,
        "columns": list(df.columns),
        "missing_by_col": missing_by_col,
        "total_missing": total_missing,
        "duplicate_rows": duplicate_rows,
        "preview_rows": preview_rows,
        "errors": errors
    }

