"""
Smoke tests for restored batch 1 routes
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from fastapi.testclient import TestClient
from server.main import app

client = TestClient(app)

def test_dca_stop_loss_routes():
    """Test DCA/Stop-Loss routes return 200"""
    response = client.get("/api/rules/user/1")
    assert response.status_code == 200
    assert "rules" in response.json()
    
def test_portfolio_loader_routes():
    """Test Portfolio Loader routes return 200"""
    response = client.get("/api/portfolio/loader/1")
    assert response.status_code == 200
    assert "positions" in response.json()
    
def test_rebalance_scheduler_routes():
    """Test Rebalance Scheduler routes return 200"""
    response = client.get("/api/rebalance/schedule/1")
    assert response.status_code == 200
    
def test_market_data_routes():
    """Test Market Data routes return 200"""
    response = client.get("/api/market/prices")
    assert response.status_code == 200
    assert "prices" in response.json()
    
def test_asset_drilldown_routes():
    """Test Asset Drilldown routes return 200"""
    response = client.get("/api/asset/details/BTC")
    assert response.status_code == 200
    
def test_watchlist_routes():
    """Test Watchlist routes return 200"""
    response = client.get("/api/watchlists/1")
    assert response.status_code == 200
    assert "watchlists" in response.json()
    
def test_macro_monitor_routes():
    """Test Macro Monitor routes return 200"""
    response = client.get("/api/macro/insights/1")
    assert response.status_code == 200
    assert "insights" in response.json()
    
def test_holdings_review_routes():
    """Test Holdings Review routes return 200"""
    response = client.get("/api/holdings/all/1")
    assert response.status_code == 200
    assert "holdings" in response.json()
