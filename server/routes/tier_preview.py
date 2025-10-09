from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from server.database import get_db
from server.auth import get_current_user
from server.models.user import User
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

PREVIEW_DURATION_MINUTES = 5

class PreviewTierRequest(BaseModel):
    target_tier: str

@router.post("/tier-preview/start")
async def start_tier_preview(
    request: PreviewTierRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a 5-minute tier preview"""
    tier_hierarchy = {"observer": 0, "participant": 1, "builder": 2, "sovereign": 3}
    current_level = tier_hierarchy.get(current_user.subscription_tier.lower(), 0)
    target_level = tier_hierarchy.get(request.target_tier.lower(), 0)
    
    if target_level <= current_level:
        raise HTTPException(status_code=400, detail="Can only preview higher tiers")
    
    current_user.preview_tier = request.target_tier.lower()
    current_user.preview_expires_at = datetime.utcnow() + timedelta(minutes=PREVIEW_DURATION_MINUTES)
    db.commit()
    
    logger.info(f"User {current_user.id} started preview of {current_user.preview_tier} tier")
    
    return {
        "success": True,
        "preview_tier": current_user.preview_tier,
        "expires_at": current_user.preview_expires_at.isoformat(),
        "duration_seconds": PREVIEW_DURATION_MINUTES * 60
    }

@router.post("/tier-preview/end")
async def end_tier_preview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """End tier preview early"""
    current_user.preview_tier = None
    current_user.preview_expires_at = None
    db.commit()
    
    logger.info(f"User {current_user.id} ended tier preview")
    
    return {"success": True, "message": "Preview ended"}

@router.get("/tier-preview/status")
async def get_preview_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current preview status"""
    if not current_user.preview_tier or not current_user.preview_expires_at:
        return {"active": False, "current_tier": current_user.subscription_tier}
    
    if datetime.utcnow() > current_user.preview_expires_at:
        current_user.preview_tier = None
        current_user.preview_expires_at = None
        db.commit()
        return {"active": False, "current_tier": current_user.subscription_tier}
    
    remaining_seconds = int((current_user.preview_expires_at - datetime.utcnow()).total_seconds())
    
    return {
        "active": True,
        "current_tier": current_user.subscription_tier,
        "preview_tier": current_user.preview_tier,
        "expires_at": current_user.preview_expires_at.isoformat(),
        "remaining_seconds": remaining_seconds
    }
