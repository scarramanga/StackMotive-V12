"""
User Preferences Manager
Handles CRUD operations for user preferences with Redis caching and audit logging
"""

import os
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base

from server.services.cache import get_redis_client
from server.services.audit_logger import log_activity

logger = logging.getLogger(__name__)

Base = declarative_base()

PREFERENCES_CACHE_TTL = int(os.getenv("PREFERENCES_CACHE_TTL", "60"))

DEFAULT_PREFERENCES = {
    "theme": "dark",
    "language": "en",
    "risk_profile": "moderate",
    "rotation_aggressiveness": 50,
    "auto_trim_enabled": False,
    "excluded_assets": [],
    "macro_alerts": True,
    "trade_alerts": True,
    "email_notifications": True,
    "push_notifications": True,
    "sms_notifications": False
}


def get_preferences(db: Session, user_id: int) -> Dict[str, Any]:
    """Get user preferences with Redis caching"""
    cache_key = f"user_preferences:{user_id}"
    
    cache = get_redis_client()
    if cache:
        try:
            cached = cache.get(cache_key)
            if cached:
                logger.debug(f"Cache hit for user {user_id} preferences")
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Cache read error for user {user_id}: {e}")
    
    prefs_row = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    if not prefs_row:
        preferences = DEFAULT_PREFERENCES.copy()
        logger.info(f"Returning default preferences for user {user_id}")
    else:
        try:
            preferences = json.loads(prefs_row.data)
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in preferences for user {user_id}, returning defaults")
            preferences = DEFAULT_PREFERENCES.copy()
    
    if cache:
        try:
            cache.setex(cache_key, PREFERENCES_CACHE_TTL, json.dumps(preferences))
            logger.debug(f"Cached preferences for user {user_id} (TTL: {PREFERENCES_CACHE_TTL}s)")
        except Exception as e:
            logger.warning(f"Cache write error for user {user_id}: {e}")
    
    return preferences


def update_preferences(db: Session, user_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Update user preferences with validation and audit logging"""
    current_prefs = get_preferences(db, user_id)
    
    validated_payload = _validate_preferences(payload)
    
    updated_prefs = {**current_prefs, **validated_payload}
    
    prefs_row = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    if prefs_row:
        prefs_row.data = json.dumps(updated_prefs)
        prefs_row.version += 1
        prefs_row.updated_at = datetime.utcnow()
    else:
        prefs_row = UserPreference(
            user_id=user_id,
            data=json.dumps(updated_prefs),
            version=1,
            updated_at=datetime.utcnow()
        )
        db.add(prefs_row)
    
    db.commit()
    db.refresh(prefs_row)
    
    _invalidate_cache(user_id)
    
    log_activity(
        db,
        user_id,
        "preferences_update",
        {
            "updated_fields": list(validated_payload.keys()),
            "version": prefs_row.version
        }
    )
    
    logger.info(f"Updated preferences for user {user_id} (version {prefs_row.version})")
    
    return updated_prefs


def reset_to_default(db: Session, user_id: int) -> Dict[str, Any]:
    """Reset user preferences to defaults"""
    prefs_row = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    if prefs_row:
        prefs_row.data = json.dumps(DEFAULT_PREFERENCES)
        prefs_row.version += 1
        prefs_row.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(prefs_row)
        version = prefs_row.version
    else:
        prefs_row = UserPreference(
            user_id=user_id,
            data=json.dumps(DEFAULT_PREFERENCES),
            version=1,
            updated_at=datetime.utcnow()
        )
        db.add(prefs_row)
        db.commit()
        db.refresh(prefs_row)
        version = prefs_row.version
    
    _invalidate_cache(user_id)
    
    log_activity(
        db,
        user_id,
        "preferences_reset",
        {"version": version}
    )
    
    logger.info(f"Reset preferences to defaults for user {user_id} (version {version})")
    
    return DEFAULT_PREFERENCES.copy()


def _validate_preferences(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate preference updates against schema"""
    validated = {}
    
    if "theme" in payload and payload["theme"] in ["light", "dark", "auto"]:
        validated["theme"] = payload["theme"]
    
    if "language" in payload and isinstance(payload["language"], str):
        validated["language"] = payload["language"]
    
    if "risk_profile" in payload and payload["risk_profile"] in ["conservative", "moderate", "aggressive"]:
        validated["risk_profile"] = payload["risk_profile"]
    
    if "rotation_aggressiveness" in payload:
        val = payload["rotation_aggressiveness"]
        if isinstance(val, (int, float)) and 0 <= val <= 100:
            validated["rotation_aggressiveness"] = int(val)
    
    if "auto_trim_enabled" in payload and isinstance(payload["auto_trim_enabled"], bool):
        validated["auto_trim_enabled"] = payload["auto_trim_enabled"]
    
    if "excluded_assets" in payload and isinstance(payload["excluded_assets"], list):
        validated["excluded_assets"] = [str(a) for a in payload["excluded_assets"]]
    
    for alert_key in ["macro_alerts", "trade_alerts", "email_notifications", "push_notifications", "sms_notifications"]:
        if alert_key in payload and isinstance(payload[alert_key], bool):
            validated[alert_key] = payload[alert_key]
    
    return validated


def _invalidate_cache(user_id: int):
    """Invalidate Redis cache for user preferences"""
    cache_key = f"user_preferences:{user_id}"
    cache = get_redis_client()
    if cache:
        try:
            cache.delete(cache_key)
            logger.debug(f"Invalidated cache for user {user_id}")
        except Exception as e:
            logger.warning(f"Cache invalidation error for user {user_id}: {e}")


class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True, index=True)
    data = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow)
