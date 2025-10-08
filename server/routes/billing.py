from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import stripe
import os
import logging

from server.database import get_db
from server.auth import get_current_user
from server.models.user import User
from server.models.subscription import UserSubscription
from server.services.grace_period import check_grace_period

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/billing", tags=["Billing"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


@router.get("/subscriptions")
async def get_user_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription info with grace period status"""
    subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id
    ).order_by(UserSubscription.updated_at.desc()).first()
    
    grace_status = check_grace_period(current_user.id, db)
    
    return {
        "subscription": subscription,
        "grace_period": grace_status
    }


@router.post("/portal")
async def create_billing_portal_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Stripe customer portal session for subscription management"""
    try:
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                metadata={"user_id": str(current_user.id)}
            )
            current_user.stripe_customer_id = customer.id
            db.commit()
        
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/billing"
        )
        
        return {"url": session.url}
        
    except Exception as e:
        logger.error(f"Error creating portal session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")


@router.get("/config")
async def get_billing_config():
    """Get billing configuration and available plans"""
    from server.services.pricing import TIER_PRICING, TIER_PRICING_ANNUAL
    
    return {
        "plans": {
            "monthly": TIER_PRICING,
            "annual": TIER_PRICING_ANNUAL
        },
        "currency": "USD"
    }

