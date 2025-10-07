"""
Tests for preferences_manager service
"""

import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
import json
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.services.preferences_manager import (
    get_preferences,
    update_preferences,
    reset_to_default,
    DEFAULT_PREFERENCES,
    UserPreference,
    Base
)


@pytest.fixture
def test_db():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    
    yield db
    
    db.close()


def test_get_preferences_default(test_db):
    """Test getting default preferences for new user"""
    prefs = get_preferences(test_db, user_id=1)
    
    assert prefs == DEFAULT_PREFERENCES
    assert prefs["theme"] == "dark"
    assert prefs["language"] == "en"
    assert prefs["risk_profile"] == "moderate"


def test_update_preferences(test_db):
    """Test updating user preferences"""
    updated = update_preferences(test_db, user_id=1, payload={"theme": "light", "language": "es"})
    
    assert updated["theme"] == "light"
    assert updated["language"] == "es"
    assert updated["risk_profile"] == "moderate"
    
    prefs_row = test_db.query(UserPreference).filter(UserPreference.user_id == 1).first()
    assert prefs_row is not None
    assert prefs_row.version == 1


def test_update_preferences_validation(test_db):
    """Test preference validation"""
    updated = update_preferences(
        test_db,
        user_id=1,
        payload={
            "theme": "invalid_theme",
            "rotation_aggressiveness": 150,
            "risk_profile": "aggressive"
        }
    )
    
    assert updated["theme"] == "dark"
    assert updated["rotation_aggressiveness"] == 50
    assert updated["risk_profile"] == "aggressive"


def test_reset_to_default(test_db):
    """Test resetting preferences to defaults"""
    update_preferences(test_db, user_id=1, payload={"theme": "light"})
    
    reset = reset_to_default(test_db, user_id=1)
    
    assert reset == DEFAULT_PREFERENCES
    assert reset["theme"] == "dark"
    
    prefs_row = test_db.query(UserPreference).filter(UserPreference.user_id == 1).first()
    assert prefs_row.version == 2


def test_preferences_versioning(test_db):
    """Test preference version increments"""
    update_preferences(test_db, user_id=1, payload={"theme": "light"})
    prefs_row = test_db.query(UserPreference).filter(UserPreference.user_id == 1).first()
    assert prefs_row.version == 1
    
    update_preferences(test_db, user_id=1, payload={"language": "fr"})
    test_db.refresh(prefs_row)
    assert prefs_row.version == 2
    
    reset_to_default(test_db, user_id=1)
    test_db.refresh(prefs_row)
    assert prefs_row.version == 3
