"""Test health check endpoints"""
import os
import sys

os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")
os.environ.setdefault("STACKMOTIVE_DEV_MODE", "true")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test_db")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from fastapi.testclient import TestClient
from server.main import app


client = TestClient(app)


def test_health_live_returns_ok():
    """Test liveness endpoint returns healthy status"""
    response = client.get("/api/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_health_ready_responds():
    """Test readiness endpoint responds"""
    response = client.get("/api/health/ready")
    assert response.status_code in [200, 503]
    
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "ready"
        assert "db" in data
        assert "redis" in data
    else:
        data = response.json()
        assert "detail" in data
        assert data["detail"]["status"] == "not_ready"


def test_health_live_has_timestamp():
    """Test that live endpoint includes ISO timestamp"""
    response = client.get("/api/health/live")
    assert response.status_code == 200
    data = response.json()
    assert "timestamp" in data
    assert "Z" in data["timestamp"]
