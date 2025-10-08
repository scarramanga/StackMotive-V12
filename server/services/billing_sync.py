"""Billing sync service - synchronizes Stripe subscriptions to database"""
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from server.models.user import User
from server.models.subscription import UserSubscription

logger = logging.getLogger(__name__)


def sync_subscription_to_db(
    subscription_data: dict,
    db: Session,
    event_id: str = None
) -> UserSubscription:
    """
    Sync Stripe subscription to database
    
    Args:
        subscription_data: Stripe subscription object
        db: Database session
        event_id: Stripe event ID for deduplication
        
    Returns:
        UserSubscription object
    """
    try:
        user_id = subscription_data.get("metadata", {}).get("user_id")
        if not user_id:
            logger.error("No user_id in subscription metadata")
            raise ValueError("user_id required in subscription metadata")
        
        user_id = int(user_id)
        stripe_subscription_id = subscription_data["id"]
        
        price_id = subscription_data.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")
        tier = map_price_to_tier(price_id)
        
        current_period_end = subscription_data.get("current_period_end")
        grace_until = None
        if current_period_end:
            period_end_dt = datetime.fromtimestamp(current_period_end)
            grace_until = period_end_dt + timedelta(days=7)
        
        subscription = db.query(UserSubscription).filter(
            UserSubscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            subscription.tier = tier
            subscription.status = subscription_data["status"]
            subscription.current_period_end = current_period_end
            subscription.grace_until = grace_until
            if event_id:
                subscription.last_event_id = event_id
            subscription.updated_at = datetime.utcnow()
        else:
            subscription = UserSubscription(
                user_id=user_id,
                tier=tier,
                status=subscription_data["status"],
                stripe_customer_id=subscription_data.get("customer"),
                stripe_subscription_id=stripe_subscription_id,
                current_period_end=current_period_end,
                grace_until=grace_until,
                last_event_id=event_id
            )
            db.add(subscription)
        
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.subscription_tier = tier
            user.stripe_customer_id = subscription_data.get("customer")
            user.stripe_subscription_id = stripe_subscription_id
        
        db.commit()
        db.refresh(subscription)
        
        logger.info(f"Synced subscription for user {user_id}: {tier} ({subscription_data['status']})")
        return subscription
        
    except Exception as e:
        logger.error(f"Error syncing subscription: {e}")
        db.rollback()
        raise


def map_price_to_tier(price_id: str) -> str:
    """Map Stripe price ID to tier name using environment variables"""
    import os
    
    price_tier_mapping = {
        os.getenv("STRIPE_OBSERVER_PRICE_ID"): "observer",
        os.getenv("STRIPE_NAVIGATOR_PRICE_ID"): "navigator",
        os.getenv("STRIPE_OPERATOR_PRICE_ID"): "operator",
        os.getenv("STRIPE_SOVEREIGN_PRICE_ID"): "sovereign",
    }
    
    return price_tier_mapping.get(price_id, "observer")
