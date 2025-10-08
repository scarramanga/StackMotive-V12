"""Stripe webhook handler with HMAC verification and audit logging"""
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import stripe
import os
import logging
import hashlib
from datetime import datetime

from server.database import get_db
from server.models.subscription import UserSubscription, BillingEvent
from server.services.billing_sync import sync_subscription_to_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Billing"], prefix="/api/billing")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")


def log_billing_event(event_id: str, event_type: str, payload: bytes, status: str, db: Session, error: str = None):
    """Log billing event for audit trail with payload hash"""
    try:
        payload_hash = hashlib.sha256(payload).hexdigest()
        
        existing = db.query(BillingEvent).filter(BillingEvent.event_id == event_id).first()
        if existing:
            logger.warning(f"Duplicate event {event_id} - skipping")
            return False
        
        event = BillingEvent(
            event_id=event_id,
            event_type=event_type,
            payload_hash=payload_hash,
            status=status,
            error_message=error
        )
        db.add(event)
        db.commit()
        return True
        
    except Exception as e:
        logger.error(f"Failed to log billing event: {e}")
        return False


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook handler with HMAC signature verification
    Processes subscription lifecycle events
    """
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        if not webhook_secret:
            raise HTTPException(status_code=500, detail="Webhook secret not configured")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")

        event_id = event["id"]
        event_type = event["type"]
        event_data = event["data"]["object"]
        
        if not log_billing_event(event_id, event_type, payload, "processing", db):
            return {"status": "duplicate", "event_id": event_id}

        try:
            if event_type == "customer.subscription.created":
                await handle_subscription_created(event_data, db, event_id)
            
            elif event_type == "customer.subscription.updated":
                await handle_subscription_updated(event_data, db, event_id)
            
            elif event_type == "customer.subscription.deleted":
                await handle_subscription_deleted(event_data, db, event_id)
            
            elif event_type == "invoice.payment_succeeded":
                await handle_payment_succeeded(event_data, db, event_id)
            
            elif event_type == "invoice.payment_failed":
                await handle_payment_failed(event_data, db, event_id)
            
            elif event_type == "checkout.session.completed":
                await handle_checkout_completed(event_data, db, event_id)
            
            else:
                logger.info(f"Unhandled event type: {event_type}")
            
            billing_event = db.query(BillingEvent).filter(BillingEvent.event_id == event_id).first()
            if billing_event:
                billing_event.status = "processed"
                db.commit()
            
            return {"status": "success", "event_id": event_id}
            
        except Exception as e:
            logger.error(f"Error processing event {event_id}: {e}")
            
            billing_event = db.query(BillingEvent).filter(BillingEvent.event_id == event_id).first()
            if billing_event:
                billing_event.status = "failed"
                billing_event.error_message = str(e)
                db.commit()
            
            raise

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


async def handle_subscription_created(subscription_data: dict, db: Session, event_id: str):
    """Handle new subscription creation"""
    sync_subscription_to_db(subscription_data, db, event_id)
    logger.info(f"Subscription created: {subscription_data['id']}")


async def handle_subscription_updated(subscription_data: dict, db: Session, event_id: str):
    """Handle subscription updates (tier changes, renewals)"""
    sync_subscription_to_db(subscription_data, db, event_id)
    logger.info(f"Subscription updated: {subscription_data['id']}")


async def handle_subscription_deleted(subscription_data: dict, db: Session, event_id: str):
    """Handle subscription cancellation"""
    subscription = db.query(UserSubscription).filter(
        UserSubscription.stripe_subscription_id == subscription_data["id"]
    ).first()
    
    if subscription:
        subscription.status = "canceled"
        subscription.last_event_id = event_id
        subscription.updated_at = datetime.utcnow()
        
        db.commit()
        logger.info(f"Subscription canceled: {subscription.id} (grace until {subscription.grace_until})")


async def handle_payment_succeeded(invoice_data: dict, db: Session, event_id: str):
    """Handle successful payment - reactivate if needed"""
    subscription_id = invoice_data.get("subscription")
    if subscription_id:
        subscription = db.query(UserSubscription).filter(
            UserSubscription.stripe_subscription_id == subscription_id
        ).first()
        
        if subscription and subscription.status != "active":
            subscription.status = "active"
            subscription.last_event_id = event_id
            db.commit()
            logger.info(f"Payment succeeded for subscription {subscription.id}")


async def handle_payment_failed(invoice_data: dict, db: Session, event_id: str):
    """Handle failed payment - mark as past_due"""
    subscription_id = invoice_data.get("subscription")
    if subscription_id:
        subscription = db.query(UserSubscription).filter(
            UserSubscription.stripe_subscription_id == subscription_id
        ).first()
        
        if subscription:
            subscription.status = "past_due"
            subscription.last_event_id = event_id
            db.commit()
            logger.info(f"Payment failed for subscription {subscription.id}")


async def handle_checkout_completed(session_data: dict, db: Session, event_id: str):
    """Handle checkout session completion"""
    subscription_id = session_data.get("subscription")
    if subscription_id:
        subscription = stripe.Subscription.retrieve(subscription_id)
        sync_subscription_to_db(subscription, db, event_id)
        logger.info(f"Checkout completed for subscription {subscription_id}")

