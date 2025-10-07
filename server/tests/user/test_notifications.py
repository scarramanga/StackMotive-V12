"""
Tests for notification dispatcher and routes
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.services.notification_dispatcher import (
    dispatch_notification,
    get_notification_stats,
    notification_queue,
    Notification
)
from server.services.audit_logger import Base as AuditBase


@pytest.fixture
def test_db():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    AuditBase.metadata.create_all(engine)
    
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    
    yield db
    
    db.close()


@pytest.fixture(autouse=True)
def clear_queue():
    """Clear notification queue before each test"""
    global notification_queue
    notification_queue.clear()
    yield
    notification_queue.clear()


def test_dispatch_notification(test_db):
    """Test dispatching a notification"""
    dispatch_notification(
        user_id=1,
        event_type="test",
        message="Test notification",
        data={"key": "value"},
        db=test_db
    )
    
    assert len(notification_queue) == 1
    notification = notification_queue[0]
    assert notification.user_id == 1
    assert notification.event_type == "test"
    assert notification.message == "Test notification"


def test_duplicate_suppression(test_db):
    """Test that duplicate notifications are suppressed"""
    dispatch_notification(
        user_id=1,
        event_type="test",
        message="Same message",
        db=test_db
    )
    
    dispatch_notification(
        user_id=1,
        event_type="test",
        message="Same message",
        db=test_db
    )
    
    assert len(notification_queue) == 1


def test_different_notifications_not_suppressed(test_db):
    """Test that different notifications are not suppressed"""
    dispatch_notification(
        user_id=1,
        event_type="test",
        message="Message 1",
        db=test_db
    )
    
    dispatch_notification(
        user_id=1,
        event_type="test",
        message="Message 2",
        db=test_db
    )
    
    assert len(notification_queue) == 2


def test_different_users_not_suppressed(test_db):
    """Test that notifications to different users are not suppressed"""
    dispatch_notification(
        user_id=1,
        event_type="test",
        message="Same message",
        db=test_db
    )
    
    dispatch_notification(
        user_id=2,
        event_type="test",
        message="Same message",
        db=test_db
    )
    
    assert len(notification_queue) == 2


def test_notification_stats():
    """Test notification statistics"""
    notification_queue.append(Notification(1, "test", "msg1"))
    notification_queue.append(Notification(2, "test", "msg2"))
    
    stats = get_notification_stats()
    
    assert stats["queue_size"] == 2
    assert stats["batch_window_seconds"] == 120
    assert stats["oldest_notification"] is not None
