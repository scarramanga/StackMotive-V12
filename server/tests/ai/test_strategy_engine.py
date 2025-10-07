"""
Tests for strategy_engine.py
Pure calculation tests with minimal fixtures
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from server.services.strategy_engine import (
    calculate_momentum_buckets,
    calculate_volatility_class,
    calculate_concentration,
    calculate_drawdown_lite
)


def test_momentum_buckets_empty():
    """Test momentum with no positions"""
    result = calculate_momentum_buckets([])
    assert result["buckets"] == {}
    assert "summary" in result


def test_momentum_buckets_classification():
    """Test momentum bucket classification"""
    positions = [
        {"symbol": "AAPL", "quantity": 10, "avgCost": 100, "currentPrice": 130},
        {"symbol": "MSFT", "quantity": 5, "avgCost": 200, "currentPrice": 210},
        {"symbol": "TSLA", "quantity": 2, "avgCost": 300, "currentPrice": 290},
        {"symbol": "NVDA", "quantity": 3, "avgCost": 500, "currentPrice": 450},
        {"symbol": "META", "quantity": 4, "avgCost": 400, "currentPrice": 280},
    ]
    
    result = calculate_momentum_buckets(positions)
    
    assert "AAPL" in result["buckets"]["strong_up"]
    assert "MSFT" in result["buckets"]["moderate_up"]
    assert "TSLA" in result["buckets"]["neutral"]
    assert "NVDA" in result["buckets"]["moderate_down"]
    assert "META" in result["buckets"]["strong_down"]


def test_volatility_class_minimal_trades():
    """Test volatility with insufficient trades"""
    trades = [{"symbol": "AAPL", "entry_price": 100, "exit_price": 110}]
    result = calculate_volatility_class(trades, [])
    assert result["volatility_by_symbol"]["AAPL"]["class"] == "unknown"


def test_volatility_class_calculation():
    """Test volatility calculation with multiple trades"""
    trades = [
        {"symbol": "AAPL", "entry_price": 100, "exit_price": 105},
        {"symbol": "AAPL", "entry_price": 105, "exit_price": 103},
        {"symbol": "AAPL", "entry_price": 103, "exit_price": 110},
        {"symbol": "AAPL", "entry_price": 110, "exit_price": 108},
    ]
    
    result = calculate_volatility_class(trades, [])
    
    assert "AAPL" in result["volatility_by_symbol"]
    assert result["volatility_by_symbol"]["AAPL"]["class"] in ["low", "medium", "high"]
    assert result["volatility_by_symbol"]["AAPL"]["value"] >= 0


def test_concentration_empty():
    """Test concentration with no positions"""
    result = calculate_concentration([])
    assert result["hhi"] == 0
    assert result["top_holdings"] == []


def test_concentration_calculation():
    """Test concentration metrics"""
    positions = [
        {"symbol": "AAPL", "quantity": 100, "avgCost": 150, "currentPrice": 160},
        {"symbol": "MSFT", "quantity": 50, "avgCost": 300, "currentPrice": 320},
        {"symbol": "TSLA", "quantity": 10, "avgCost": 200, "currentPrice": 180},
    ]
    
    result = calculate_concentration(positions)
    
    assert result["hhi"] > 2500
    assert result["concentration"] == "Very High"
    assert len(result["top_holdings"]) == 3
    assert result["top_holdings"][0]["symbol"] in ["AAPL", "MSFT"]


def test_drawdown_lite_calculation():
    """Test drawdown calculation"""
    trades = [
        {"symbol": "AAPL", "profit_loss": 1000, "exit_time": "2024-01-01"},
        {"symbol": "MSFT", "profit_loss": -500, "exit_time": "2024-01-02"},
        {"symbol": "TSLA", "profit_loss": 2000, "exit_time": "2024-01-03"},
        {"symbol": "NVDA", "profit_loss": -1500, "exit_time": "2024-01-04"},
    ]
    
    positions = [
        {"symbol": "META", "quantity": 10, "avgCost": 300, "currentPrice": 280}
    ]
    
    result = calculate_drawdown_lite(trades, positions)
    
    assert result["max_drawdown_pct"] > 0
    assert result["current_drawdown_pct"] >= 0
    assert result["peak_value"] > result["current_value"]
