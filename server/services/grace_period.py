"""Grace period logic for subscription management"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from server.models.subscription import UserSubscription

logger = logging.getLogger(__name__)


def check_grace_period(user_id: int, db: Session) -> dict:
    """
    Check if user is in grace period or locked out
    
    Args:
        user_id: User ID
        db: Database session
        
    Returns:
        dict with: in_grace_period (bool), days_remaining (int), status (str)
    """
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == user_id
    ).order_by(UserSubscription.updated_at.desc()).first()
    
    if not subscription:
        return {
            "in_grace_period": False,
            "days_remaining": 0,
            "status": "no_subscription",
            "tier": "observer"
        }
    
    if subscription.status == "active":
        return {
            "in_grace_period": False,
            "days_remaining": 0,
            "status": "active",
            "tier": subscription.tier
        }
    
    now = datetime.utcnow()
    if subscription.grace_until and now < subscription.grace_until:
        days_remaining = (subscription.grace_until - now).days
        return {
            "in_grace_period": True,
            "days_remaining": days_remaining,
            "status": subscription.status,
            "tier": subscription.tier
        }
    
    return {
        "in_grace_period": False,
        "days_remaining": 0,
        "status": "locked_out",
        "tier": "observer"
    }


def get_effective_tier_with_grace(user_id: int, db: Session) -> str:
    """Get user's effective tier considering grace period"""
    grace_status = check_grace_period(user_id, db)
    return grace_status["tier"]
