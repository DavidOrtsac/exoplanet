import pandas as pd
import numpy as np


RAW_FEATURES = [
    'koi_period',
    'koi_duration',
    'koi_depth',
    'koi_prad',
    'koi_impact',
    'koi_teq',
]


ENGINEERED_FEATURES = [
    'depth_per_duration',     # koi_depth / koi_duration
    'radius_squared',         # koi_prad ** 2
    'period_per_radius',      # koi_period / koi_prad
    'impact_times_temp',      # koi_impact * koi_teq
    'temp_per_period',        # koi_teq / koi_period
]


def _safe_divide(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    denom = denominator.replace(0, np.nan)
    result = numerator / denom
    return result.replace([np.inf, -np.inf], np.nan).fillna(0.0)


def add_engineered_features(df: pd.DataFrame, include_raw: bool = True) -> pd.DataFrame:
    """
    Given a DataFrame containing the RAW_FEATURES columns, return a new DataFrame
    with engineered physics-inspired features appended, in a deterministic order.

    The engineered features are strictly derived from the raw inputs and do not use
    any human-set vetting flags.
    """
    required = set(RAW_FEATURES)
    if not required.issubset(df.columns):
        missing = list(required.difference(df.columns))
        raise ValueError(f"Missing required raw feature columns: {missing}")

    working = df[RAW_FEATURES].copy() if include_raw else pd.DataFrame(index=df.index)

    # Compute engineered features
    working['depth_per_duration'] = _safe_divide(df['koi_depth'], df['koi_duration'])
    working['radius_squared'] = df['koi_prad'] ** 2
    working['period_per_radius'] = _safe_divide(df['koi_period'], df['koi_prad'])
    working['impact_times_temp'] = df['koi_impact'] * df['koi_teq']
    working['temp_per_period'] = _safe_divide(df['koi_teq'], df['koi_period'])

    return working


def get_feature_order(include_engineered: bool = True) -> list:
    if include_engineered:
        return RAW_FEATURES + ENGINEERED_FEATURES
    return RAW_FEATURES


