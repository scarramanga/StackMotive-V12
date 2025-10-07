"""
Integration tests for federation routes
"""

import os
import sys

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")
os.environ.setdefault("STACKMOTIVE_DEV_MODE", "true")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch

from server.main import app
from server.database import get_db


@pytest.fixture
def test_db():
    """Create test database"""
    engine = create_engine("sqlite:///:memory:")
    
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE data_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                source_type TEXT NOT NULL,
                display_name TEXT,
                priority INTEGER DEFAULT 100,
                enabled INTEGER DEFAULT 1,
                config TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
    
    TestingSessionLocal = sessionmaker(bind=engine)
    
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield TestingSessionLocal()
    
    app.dependency_overrides.clear()


@pytest.fixture
def mock_auth():
    """Mock tier enforcement to bypass auth"""
    def mock_tier_checker(required_tier: str):
        async def checker(request, db):
            return {"user_id": 1, "email": "test@example.com", "tier": "operator"}
        return checker
    
    with patch("server.routes.data_federation.enforce_tier", side_effect=mock_tier_checker):
        yield


def test_list_sources_empty(test_db, mock_auth):
    """Test listing sources when none exist"""
    client = TestClient(app)
    
    response = client.get("/api/federation/sources")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["sources"]) == 0


def test_register_source(test_db, mock_auth):
    """Test registering a new source"""
    client = TestClient(app)
    
    response = client.post(
        "/api/federation/sources",
        json={
            "source_type": "manual",
            "display_name": "Manual Entry",
            "priority": 150
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["source"]["source_type"] == "manual"
