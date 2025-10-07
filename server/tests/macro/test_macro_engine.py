"""
Tests for macro_engine.py
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
import pandas as pd
from server.services.macro_engine import (
    load_macro_fixture,
    detect_regime,
    get_yield_curve_indicator,
    get_macro_summary
)


def test_load_macro_fixture():
    """Test loading macro fixtures"""
    cpi_df = load_macro_fixture('cpi.csv')
    
    assert not cpi_df.empty
    assert 'date' in cpi_df.columns
    assert 'value' in cpi_df.columns
    assert 'yoy_change' in cpi_df.columns


def test_detect_regime_expansion():
    """Test regime detection - expansion"""
    cpi_data = {
        'date': ['2024-01-01'],
        'value': [310.5],
        'yoy_change': [2.5]
    }
    pmi_data = {
        'date': ['2024-01-01'],
        'manufacturing': [53.0],
        'services': [54.0]
    }
    
    cpi_df = pd.DataFrame(cpi_data)
    pmi_df = pd.DataFrame(pmi_data)
    pmi_df['date'] = pd.to_datetime(pmi_df['date'])
    
    regime = detect_regime(cpi_df, pmi_df, pd.DataFrame())
    
    assert regime == "expansion"


def test_detect_regime_contraction():
    """Test regime detection - contraction"""
    cpi_data = {
        'date': ['2024-01-01'],
        'value': [310.5],
        'yoy_change': [4.5]
    }
    pmi_data = {
        'date': ['2024-01-01'],
        'manufacturing': [48.0],
        'services': [47.0]
    }
    
    cpi_df = pd.DataFrame(cpi_data)
    pmi_df = pd.DataFrame(pmi_data)
    pmi_df['date'] = pd.to_datetime(pmi_df['date'])
    
    regime = detect_regime(cpi_df, pmi_df, pd.DataFrame())
    
    assert regime == "contraction"


def test_get_yield_curve_indicator():
    """Test yield curve indicators"""
    yield_data = {
        'date': ['2024-01-01'],
        '1m': [5.40],
        '3m': [5.42],
        '2y': [4.85],
        '10y': [4.25]
    }
    yield_df = pd.DataFrame(yield_data)
    
    indicator = get_yield_curve_indicator(yield_df)
    
    assert 'inverted' in indicator
    assert 'spread_10y_2y' in indicator
    assert indicator['inverted'] == True
    assert indicator['spread_10y_2y'] < 0


def test_get_macro_summary():
    """Test full macro summary"""
    summary = get_macro_summary()
    
    assert 'regime' in summary
    assert 'indicators' in summary
    assert 'asOf' in summary
    
    assert summary['regime'] in ['expansion', 'slowdown', 'contraction', 'recovery', 'unknown']
    
    if 'inflation' in summary['indicators']:
        assert 'value' in summary['indicators']['inflation']
        assert 'trend' in summary['indicators']['inflation']
    
    if 'yield_curve' in summary['indicators']:
        assert 'inverted' in summary['indicators']['yield_curve']


def test_get_macro_summary_deterministic():
    """Test that macro summary is deterministic"""
    summary1 = get_macro_summary()
    summary2 = get_macro_summary()
    
    assert summary1['regime'] == summary2['regime']
