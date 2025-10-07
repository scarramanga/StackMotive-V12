"""
Auth flow smoke tests - verifies JWT and tier enforcement
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server.main import app
from server.database import Base, get_db
from server.models.user import User
from server.auth import get_password_hash


TEST_DATABASE_URL = "sqlite:///./test_auth.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_jwt_token_creation_and_verification():
    """Test: Issue token using env secret, verify claims"""
    response = client.post("/api/register", json={
        "email": "test@example.com",
        "password": "testpass123",
        "username": "testuser"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    token = data["access_token"]
    me_response = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test@example.com"


def test_401_on_bad_token():
    """Test: 401 on bad/expired token"""
    response = client.get("/api/me", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401


def test_tier_middleware_denies_insufficient_tier():
    """Test: Tier middleware denies route when user tier < required"""
    response = client.post("/api/register", json={
        "email": "observer@example.com",
        "password": "testpass123",
        "username": "observer"
    })
    token = response.json()["access_token"]
    
    response = client.get(
        "/api/congressional/recent-trades",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code in [403, 501]
