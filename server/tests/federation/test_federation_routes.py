"""
Integration tests for federation routes
"""

import os
import sys

os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")
os.environ.setdefault("STACKMOTIVE_DEV_MODE", "true")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from unittest.mock import patch

from server.main import app
from server.database import get_db


@pytest.fixture
def mock_auth():
    """Mock JWT authentication to bypass auth in tests"""
    async def mock_get_user(token: str, db):
        class MockUser:
            id = 1
            email = "test@example.com"
            subscription_tier = "operator"
        
        return MockUser()
    
    async def mock_get_tier(user_id: int, db):
        return "operator"
    
    with patch("server.middleware.tier_enforcement.get_current_user_from_token", new=mock_get_user), \
         patch("server.middleware.tier_enforcement.get_effective_tier", new=mock_get_tier):
        yield


@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Clean up test data before and after each test"""
    db = next(get_db())
    
    try:
        db.execute(text("DELETE FROM data_sources WHERE user_id = 1"))
        db.commit()
    except:
        db.rollback()
    
    yield
    
    try:
        db.execute(text("DELETE FROM data_sources WHERE user_id = 1"))
        db.commit()
    except:
        db.rollback()
    finally:
        db.close()


def test_list_sources_empty(mock_auth):
    """Test listing sources when none exist"""
    client = TestClient(app)
    
    response = client.get(
        "/api/federation/sources",
        headers={"Authorization": "Bearer fake-test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["sources"]) == 0


def test_register_source(mock_auth):
    """Test registering a new source"""
    client = TestClient(app)
    
    response = client.post(
        "/api/federation/sources",
        json={
            "source_type": "manual",
            "display_name": "Manual Entry",
            "priority": 150
        },
        headers={"Authorization": "Bearer fake-test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["source"]["source_type"] == "manual"
