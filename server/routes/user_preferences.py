"""
User Preferences API Routes
Handles CRUD operations for user preferences with tier enforcement and rate limiting
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
import logging

from server.database import get_db
from server.auth import get_current_user
from server.middleware.tier_enforcement import enforce_tier
from slowapi import Limiter
from slowapi.util import get_remote_address

from server.services.preferences_manager import (
    get_preferences,
    update_preferences,
    reset_to_default
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["user_preferences"])
limiter = Limiter(key_func=get_remote_address)


class PreferencesUpdate(BaseModel):
    theme: str | None = None
    language: str | None = None
    risk_profile: str | None = None
    rotation_aggressiveness: int | None = None
    auto_trim_enabled: bool | None = None
    excluded_assets: list[str] | None = None
    macro_alerts: bool | None = None
    trade_alerts: bool | None = None
    email_notifications: bool | None = None
    push_notifications: bool | None = None
    sms_notifications: bool | None = None


@router.get("/preferences")
@limiter.limit("10/minute")
async def get_user_preferences(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("navigator"))
):
    """
    Get user preferences (navigator+)
    
    Returns user preferences with Redis caching (60s TTL).
    If no preferences exist, returns defaults.
    """
    try:
        user_id = current_user["user_id"]
        preferences = get_preferences(db, user_id)
        
        return {
            "success": True,
            "preferences": preferences
        }
    
    except Exception as e:
        logger.error(f"Error fetching preferences for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch preferences")


@router.post("/preferences")
@limiter.limit("10/minute")
async def update_user_preferences(
    request: Request,
    payload: PreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("navigator"))
):
    """
    Update user preferences (navigator+)
    
    Updates specified preference fields and writes audit log.
    Invalid fields are silently ignored.
    """
    try:
        user_id = current_user["user_id"]
        
        update_dict = payload.dict(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No preferences provided")
        
        updated_prefs = update_preferences(db, user_id, update_dict)
        
        return {
            "success": True,
            "preferences": updated_prefs,
            "message": "Preferences updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preferences for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")


@router.post("/preferences/reset")
@limiter.limit("10/minute")
async def reset_user_preferences(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("navigator"))
):
    """
    Reset user preferences to defaults (navigator+)
    
    Resets all preferences to system defaults and writes audit log.
    """
    try:
        user_id = current_user["user_id"]
        default_prefs = reset_to_default(db, user_id)
        
        return {
            "success": True,
            "preferences": default_prefs,
            "message": "Preferences reset to defaults"
        }
    
    except Exception as e:
        logger.error(f"Error resetting preferences for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset preferences")
