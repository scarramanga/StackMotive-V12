"""
Audit Logger
Generic audit logging helper with SHA256 hashing for immutable records
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base

logger = logging.getLogger(__name__)

Base = declarative_base()


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    payload: Dict[str, Any],
    commit: bool = True
) -> None:
    """
    Write immutable audit log record with SHA256 hash
    
    Args:
        db: Database session
        user_id: User ID performing the action
        action: Action type (e.g., 'preferences_update', 'notification_sent')
        payload: Action metadata as dictionary
        commit: Whether to commit immediately (default True)
    """
    try:
        payload_str = json.dumps(payload, sort_keys=True)
        payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
        
        log_entry = UserActivityLog(
            user_id=user_id,
            action=action,
            payload_hash=payload_hash,
            created_at=datetime.utcnow()
        )
        
        db.add(log_entry)
        
        if commit:
            db.commit()
        
        logger.info(f"Audit log: user={user_id}, action={action}, hash={payload_hash[:8]}...")
    
    except Exception as e:
        logger.error(f"Failed to write audit log for user {user_id}, action {action}: {e}")
        if commit:
            db.rollback()


def get_activity(
    db: Session,
    user_id: int,
    action_filter: Optional[str] = None,
    since: Optional[datetime] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Retrieve audit log entries for a user
    
    Args:
        db: Database session
        user_id: User ID to filter by
        action_filter: Optional action type filter
        since: Optional timestamp filter (return records after this time)
        limit: Maximum number of records to return (default 100)
    
    Returns:
        List of audit log entries as dictionaries
    """
    query = db.query(UserActivityLog).filter(UserActivityLog.user_id == user_id)
    
    if action_filter:
        query = query.filter(UserActivityLog.action == action_filter)
    
    if since:
        query = query.filter(UserActivityLog.created_at >= since)
    
    query = query.order_by(UserActivityLog.created_at.desc()).limit(limit)
    
    entries = query.all()
    
    return [
        {
            "id": entry.id,
            "user_id": entry.user_id,
            "action": entry.action,
            "payload_hash": entry.payload_hash,
            "created_at": entry.created_at.isoformat()
        }
        for entry in entries
    ]


class UserActivityLog(Base):
    __tablename__ = "user_activity_log"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    action = Column(String(100), nullable=False)
    payload_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
