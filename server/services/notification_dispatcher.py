"""
Notification Dispatcher
Routes system events to delivery channels with batching and audit logging
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from sqlalchemy.orm import Session

from server.websocket_server import broadcast_notification
from server.services.audit_logger import log_activity

logger = logging.getLogger(__name__)

BATCH_WINDOW = int(os.getenv("NOTIFICATION_BATCH_WINDOW", "120"))

notification_queue: List['Notification'] = []


@dataclass
class Notification:
    user_id: int
    event_type: str
    message: str
    data: Optional[Dict[str, Any]]
    timestamp: datetime
    
    def __init__(self, user_id: int, event_type: str, message: str, data: Optional[Dict[str, Any]] = None):
        self.user_id = user_id
        self.event_type = event_type
        self.message = message
        self.data = data or {}
        self.timestamp = datetime.utcnow()


def dispatch_notification(
    user_id: int,
    event_type: str,
    message: str,
    data: Optional[Dict[str, Any]] = None,
    db: Optional[Session] = None
) -> None:
    """
    Dispatch notification via Socket.IO with batching
    
    Supported event types:
    - rebalance_trigger: Portfolio rebalancing required
    - macro_change: Macro-economic regime shift
    - overlay_update: Strategy overlay recommendation updated
    - test: Test notification (operator+ only)
    
    Args:
        user_id: Target user ID
        event_type: Type of notification
        message: Human-readable message
        data: Optional event-specific data
        db: Database session for audit logging
    """
    cutoff_time = datetime.utcnow() - timedelta(seconds=BATCH_WINDOW)
    
    duplicate = any(
        n.user_id == user_id and
        n.event_type == event_type and
        n.message == message and
        n.timestamp >= cutoff_time
        for n in notification_queue
    )
    
    if duplicate:
        logger.debug(f"Skipping duplicate notification for user {user_id}: {event_type}")
        return
    
    notification = Notification(user_id, event_type, message, data)
    notification_queue.append(notification)
    
    _cleanup_old_notifications()
    
    try:
        asyncio.create_task(broadcast_notification(user_id, event_type, message, data))
        logger.info(f"Dispatched notification to user {user_id}: {event_type}")
    except Exception as e:
        logger.error(f"Failed to dispatch notification via Socket.IO: {e}")
    
    if db:
        try:
            log_activity(
                db,
                user_id,
                f"notification_{event_type}",
                {
                    "message": message,
                    "data": data,
                    "timestamp": notification.timestamp.isoformat()
                },
                commit=False
            )
        except Exception as e:
            logger.error(f"Failed to audit log notification: {e}")


def _cleanup_old_notifications():
    """Remove notifications older than batch window from queue"""
    global notification_queue
    cutoff_time = datetime.utcnow() - timedelta(seconds=BATCH_WINDOW * 2)
    notification_queue = [n for n in notification_queue if n.timestamp >= cutoff_time]


def get_notification_stats() -> Dict[str, Any]:
    """Get notification dispatcher statistics"""
    _cleanup_old_notifications()
    
    return {
        "queue_size": len(notification_queue),
        "batch_window_seconds": BATCH_WINDOW,
        "oldest_notification": notification_queue[0].timestamp.isoformat() if notification_queue else None,
        "timestamp": datetime.utcnow().isoformat()
    }
