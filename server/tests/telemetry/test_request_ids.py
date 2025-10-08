"""Test request ID generation and propagation"""
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


def test_request_id_generated():
    """Test that X-Request-ID is generated if not provided"""
    response = client.get("/api/health/live")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) == 36


def test_request_id_propagated():
    """Test that provided X-Request-ID is propagated"""
    custom_id = "test-request-12345"
    response = client.get("/api/health/live", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == custom_id


def test_request_id_stable_across_requests():
    """Test that each request gets a unique request ID"""
    response1 = client.get("/api/health/live")
    response2 = client.get("/api/health/live")
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    
    id1 = response1.headers.get("X-Request-ID")
    id2 = response2.headers.get("X-Request-ID")
    
    assert id1 != id2
