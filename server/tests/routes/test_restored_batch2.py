"""
Smoke tests for restored batch 2 routes
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from fastapi.testclient import TestClient
from server.main import app

client = TestClient(app)

def test_asset_tagging_system_routes():
    """Test Asset Tagging System routes return 200"""
    response = client.get("/api/asset-tagging-system/tags?user_id=1")
    assert response.status_code == 200
    assert "tags" in response.json()
    
def test_asset_exclusion_panel_routes():
    """Test Asset Exclusion Panel routes return 200"""
    response = client.get("/api/asset-exclusion-panel/filters?user_id=1")
    assert response.status_code == 200
    assert "filters" in response.json()
    
def test_asset_view_tools_routes():
    """Test Asset View Tools routes return 200"""
    response = client.get("/api/asset-view-tools/preferences?user_id=1")
    assert response.status_code == 200
    assert "preferences" in response.json()
    
def test_strategy_editor_routes():
    """Test Strategy Editor routes return 200"""
    response = client.get("/api/strategy/assignments/1")
    assert response.status_code == 200
    assert "assignments" in response.json()
    
def test_asset_sync_settings_routes():
    """Test Asset Sync Settings routes return 200"""
    response = client.get("/api/sync/config/1")
    assert response.status_code == 200
    assert "configurations" in response.json()
    
def test_vault_categories_routes():
    """Test Vault Categories routes return 200"""
    response = client.get("/api/vault/allocation-summary/1")
    assert response.status_code == 200
    assert "summary" in response.json()
    
def test_rotation_control_routes():
    """Test Rotation Control routes return 200"""
    response = client.get("/api/rotation/preferences/1")
    assert response.status_code == 200
    assert "preferences" in response.json()
    
def test_strategy_assignment_routes():
    """Test Strategy Assignment routes return 200"""
    response = client.get("/api/strategy/assignments/1")
    assert response.status_code == 200
    assert "assignments" in response.json()
    
def test_ai_rebalance_suggestions_routes():
    """Test AI Rebalance Suggestions routes return 200"""
    response = client.get("/api/ai-rebalance/suggestions/1")
    assert response.status_code == 200
    assert "suggestions" in response.json()
    
def test_allocation_visualizer_routes():
    """Test Allocation Visualizer routes return 200"""
    response = client.get("/api/allocation/targets/1")
    assert response.status_code == 200
    assert "targets" in response.json()
    
def test_whale_activities_routes():
    """Test Whale Activities routes return 200"""
    response = client.get("/api/whale-activities")
    assert response.status_code == 200
    assert "activities" in response.json()
    
def test_rebalance_risk_routes():
    """Test Rebalance Risk routes return 200"""
    response = client.get("/api/portfolio/rebalance-risks/1")
    assert response.status_code == 200
    assert "risks" in response.json()
