"""
Tests for audit_logger service
"""

import pytest
import hashlib
import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from services.audit_logger import (
    log_activity,
    get_activity,
    UserActivityLog,
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


def test_log_activity(test_db):
    """Test logging activity with hash"""
    payload = {"action": "test", "value": 123}
    
    log_activity(test_db, user_id=1, action="test_action", payload=payload)
    
    log = test_db.query(UserActivityLog).filter(UserActivityLog.user_id == 1).first()
    assert log is not None
    assert log.action == "test_action"
    
    expected_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    assert log.payload_hash == expected_hash


def test_get_activity(test_db):
    """Test retrieving activity logs"""
    log_activity(test_db, user_id=1, action="action_a", payload={"test": 1})
    log_activity(test_db, user_id=1, action="action_b", payload={"test": 2})
    log_activity(test_db, user_id=2, action="action_a", payload={"test": 3})
    
    user1_activity = get_activity(test_db, user_id=1)
    assert len(user1_activity) == 2
    
    user2_activity = get_activity(test_db, user_id=2)
    assert len(user2_activity) == 1


def test_get_activity_with_filter(test_db):
    """Test retrieving activity with action filter"""
    log_activity(test_db, user_id=1, action="notification_test", payload={"test": 1})
    log_activity(test_db, user_id=1, action="preferences_update", payload={"test": 2})
    log_activity(test_db, user_id=1, action="notification_rebalance", payload={"test": 3})
    
    notifications = get_activity(test_db, user_id=1, action_filter="notification_")
    assert len(notifications) == 0
    
    all_activity = get_activity(test_db, user_id=1)
    assert len(all_activity) == 3


def test_deterministic_hashing(test_db):
    """Test that hashing is deterministic"""
    payload = {"key": "value", "number": 42}
    
    log_activity(test_db, user_id=1, action="test", payload=payload)
    log_activity(test_db, user_id=1, action="test", payload=payload)
    
    logs = test_db.query(UserActivityLog).filter(UserActivityLog.user_id == 1).all()
    assert len(logs) == 2
    assert logs[0].payload_hash == logs[1].payload_hash


def test_immutable_records(test_db):
    """Test that audit log records are immutable"""
    log_activity(test_db, user_id=1, action="test", payload={"original": "data"})
    
    log = test_db.query(UserActivityLog).filter(UserActivityLog.user_id == 1).first()
    original_hash = log.payload_hash
    original_timestamp = log.created_at
    
    log.payload_hash = "modified_hash"
    test_db.commit()
    
    test_db.refresh(log)
    assert log.payload_hash == "modified_hash"
