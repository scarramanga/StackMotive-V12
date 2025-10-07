"""
Macro Engine - Fixture-based macro regime detection
"""
import os
import pandas as pd
from typing import Dict, Any
from datetime import datetime

FIXTURES_PATH = os.path.join(os.path.dirname(__file__), '..', 'tests', 'fixtures', 'macro')


def load_macro_fixture(filename: str) -> pd.DataFrame:
    """Load a macro fixture CSV file"""
    filepath = os.path.join(FIXTURES_PATH, filename)
    if not os.path.exists(filepath):
        return pd.DataFrame()
    
    df = pd.read_csv(filepath)
    df['date'] = pd.to_datetime(df['date'])
    return df


def detect_regime(cpi_df: pd.DataFrame, pmi_df: pd.DataFrame, yield_df: pd.DataFrame) -> str:
    """
    Detect macro regime from indicators
    
    Regimes:
    - expansion: strong growth, low inflation, PMI > 52
    - slowdown: weakening growth, rising inflation, PMI 50-52
    - contraction: negative growth, high inflation, PMI < 50
    - recovery: improving growth, moderating inflation, PMI rising
    """
    if cpi_df.empty or pmi_df.empty:
        return "unknown"
    
    latest_cpi = cpi_df.iloc[-1]
    latest_pmi = pmi_df.iloc[-1]
    
    inflation = latest_cpi['yoy_change']
    manufacturing_pmi = latest_pmi['manufacturing']
    services_pmi = latest_pmi['services']
    
    avg_pmi = (manufacturing_pmi + services_pmi) / 2
    
    if len(pmi_df) >= 2:
        prev_pmi = (pmi_df.iloc[-2]['manufacturing'] + pmi_df.iloc[-2]['services']) / 2
        pmi_trend = avg_pmi - prev_pmi
    else:
        pmi_trend = 0
    
    if avg_pmi > 52 and inflation < 3.0:
        return "expansion"
    elif avg_pmi >= 50 and avg_pmi <= 52:
        return "slowdown"
    elif avg_pmi < 50:
        if pmi_trend > 0:
            return "recovery"
        else:
            return "contraction"
    else:
        return "expansion"


def get_yield_curve_indicator(yield_df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate yield curve indicators"""
    if yield_df.empty:
        return {"inverted": False, "spread_10y_2y": 0}
    
    latest = yield_df.iloc[-1]
    spread_10y_2y = latest['10y'] - latest['2y']
    
    return {
        "inverted": spread_10y_2y < 0,
        "spread_10y_2y": round(spread_10y_2y, 2),
        "spread_10y_3m": round(latest['10y'] - latest['3m'], 2)
    }


def get_macro_summary() -> Dict[str, Any]:
    """
    Generate macro summary from fixtures
    
    Returns deterministic summary based on fixture data
    """
    cpi_df = load_macro_fixture('cpi.csv')
    pmi_df = load_macro_fixture('pmi.csv')
    yield_df = load_macro_fixture('yield_curve.csv')
    
    regime = detect_regime(cpi_df, pmi_df, yield_df)
    yield_curve = get_yield_curve_indicator(yield_df)
    
    indicators = {}
    if not cpi_df.empty:
        latest_cpi = cpi_df.iloc[-1]
        indicators['inflation'] = {
            "value": latest_cpi['yoy_change'],
            "trend": "rising" if len(cpi_df) >= 2 and latest_cpi['yoy_change'] > cpi_df.iloc[-2]['yoy_change'] else "falling"
        }
    
    if not pmi_df.empty:
        latest_pmi = pmi_df.iloc[-1]
        indicators['pmi'] = {
            "manufacturing": latest_pmi['manufacturing'],
            "services": latest_pmi['services'],
            "average": round((latest_pmi['manufacturing'] + latest_pmi['services']) / 2, 1)
        }
    
    indicators['yield_curve'] = yield_curve
    
    return {
        "regime": regime,
        "indicators": indicators,
        "asOf": datetime.utcnow().isoformat() + "Z"
    }
