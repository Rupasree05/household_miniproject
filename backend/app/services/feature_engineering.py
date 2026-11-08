import pandas as pd
import numpy as np
from typing import Tuple, List

FEATURE_COLUMNS = [
    'day',
    'month',
    'day_of_week',
    'is_weekend',
    'lag_1',
    'lag_2',
    'lag_3',
    'lag_7',
    'rolling_mean_7',
    'rolling_mean_30',
    'rolling_max_7',
    'rolling_min_7',
    'trend_lag1_lag2',
    'trend_lag1_avg7'
]

def generate_features(daily_df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes domain-specific time-series features with strict past-only information (zero data leakage).
    """
    df = daily_df.copy()
    if not np.issubdtype(df['date'].dtype, np.datetime64):
        df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date').reset_index(drop=True)

    # 1. Calendar features
    df['day'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    df['day_of_week'] = df['date'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

    # 2. Strict Past Lags (day t only sees t-1, t-2, etc.)
    past_series = df['power_consumption'].shift(1)
    df['lag_1'] = past_series
    df['lag_2'] = df['power_consumption'].shift(2)
    df['lag_3'] = df['power_consumption'].shift(3)
    df['lag_7'] = df['power_consumption'].shift(7)

    # 3. Rolling Statistics on past data only
    # Window of 7 days strictly ending at day t-1
    df['rolling_mean_7'] = past_series.rolling(window=7, min_periods=3).mean()
    # Window of 30 days strictly ending at day t-1
    df['rolling_mean_30'] = past_series.rolling(window=30, min_periods=7).mean()
    # If dataset has fewer than 30 days, fill remaining with rolling_mean_7
    df['rolling_mean_30'] = df['rolling_mean_30'].fillna(df['rolling_mean_7'])

    df['rolling_max_7'] = past_series.rolling(window=7, min_periods=3).max()
    df['rolling_min_7'] = past_series.rolling(window=7, min_periods=3).min()

    # 4. Consumption Trends
    df['trend_lag1_lag2'] = df['lag_1'] - df['lag_2']
    df['trend_lag1_avg7'] = df['lag_1'] - df['rolling_mean_7']

    # Target: power consumption for day t
    df['target'] = df['power_consumption']

    return df

def prepare_train_test_data(
    feature_df: pd.DataFrame,
    test_size: float = 0.2
) -> Tuple[pd.DataFrame, pd.DataFrame, List[str]]:
    """
    Splits features chronologically (time-based split) without shuffling,
    preventing future knowledge from leaking into training.
    """
    # Drop rows with NaNs resulting from lag calculations
    clean_features = feature_df.dropna(subset=FEATURE_COLUMNS + ['target']).copy()
    clean_features = clean_features.sort_values(by='date').reset_index(drop=True)

    n_samples = len(clean_features)
    if n_samples < 7:
        raise ValueError(f"Insufficient samples ({n_samples}) after feature generation for model training.")

    split_idx = int(n_samples * (1 - test_size))
    # Ensure at least 3 samples in test
    split_idx = min(split_idx, n_samples - 3)
    split_idx = max(split_idx, 4)

    train_df = clean_features.iloc[:split_idx].copy()
    test_df = clean_features.iloc[split_idx:].copy()

    return train_df, test_df, FEATURE_COLUMNS

