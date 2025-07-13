"""
Billing API Routes
Handles Stripe subscriptions, payments, and tier management
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import stripe
import psycopg2
import json
import logging
from datetime import datetime, timedelta
import os

# Configure Stripe
stripe.api_key = "sk_test_51RQFeJRfTZm4mhTAUMPDT1aRk0BreePfNV9nGmt01a56L940DdHDFNUZaNPagUAw578fny7PFD0XFARmKBvFOasy0083VoR24n"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])

# Database connection
def get_db_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(
        host='localhost',
        port='5432',
        database='stackmotive',
        user='stackmotive',
        password='stackmotive123'
    )

# Load Stripe configuration
with open('stripe_config.json', 'r') as f:
    STRIPE_CONFIG = json.load(f)

# Pydantic models
class CreateSubscriptionRequest(BaseModel):
    user_id: str
    price_id: str
    trial_days: Optional[int] = 14

class UpdateSubscriptionRequest(BaseModel):
    subscription_id: str
    new_price_id: str

class CancelSubscriptionRequest(BaseModel):
    subscription_id: str
    cancel_at_period_end: bool = True

class BillingPortalRequest(BaseModel):
    customer_id: str
    return_url: str = "http://localhost:3000/dashboard"

# Helper functions
def get_user_by_id(user_id: str):
    """Get user from database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, email, username, subscription_tier, stripe_customer_id FROM users WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        
        if result:
            return {
                'id': result[0],
                'email': result[1],
                'username': result[2],
                'subscription_tier': result[3],
                'stripe_customer_id': result[4]
            }
        return None
    finally:
        cursor.close()
        conn.close()

def update_user_tier(user_id: str, tier: str, stripe_customer_id: str = None, stripe_subscription_id: str = None):
    """Update user's subscription tier in database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if stripe_customer_id and stripe_subscription_id:
            cursor.execute("""
                UPDATE users 
                SET subscription_tier = %s, stripe_customer_id = %s, stripe_subscription_id = %s, updated_at = NOW()
                WHERE id = %s
            """, (tier, stripe_customer_id, stripe_subscription_id, user_id))
        else:
            cursor.execute("""
                UPDATE users 
                SET subscription_tier = %s, updated_at = NOW()
                WHERE id = %s
            """, (tier, user_id))
        
        conn.commit()
        logger.info(f"Updated user {user_id} to tier {tier}")
        return True
    except Exception as e:
        logger.error(f"Failed to update user tier: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def get_or_create_stripe_customer(user):
    """Get existing or create new Stripe customer"""
    if user['stripe_customer_id']:
        try:
            customer = stripe.Customer.retrieve(user['stripe_customer_id'])
            return customer
        except stripe.error.StripeError:
            # Customer doesn't exist, create new one
            pass
    
    # Create new customer
    customer = stripe.Customer.create(
        email=user['email'],
        name=user['username'],
        metadata={'user_id': user['id']}
    )
    
    # Update user with customer ID
    update_user_tier(user['id'], user['subscription_tier'], customer.id)
    
    return customer

def get_price_tier(price_id: str) -> str:
    """Get tier from price ID"""
    for product in STRIPE_CONFIG['products']:
        if product['monthly_price_id'] == price_id:
            return product['tier']
        if 'yearly_price_id' in product and product['yearly_price_id'] == price_id:
            return product['tier']
    return 'free'

# API Routes

@router.get("/config")
async def get_billing_config():
    """Get billing configuration and available plans"""
    try:
        plans = []
        for product in STRIPE_CONFIG['products']:
            plan = {
                'tier': product['tier'],
                'name': product['name'],
                'monthly_price_id': product['monthly_price_id'],
                'monthly_amount': product['amount'],
                'features': []
            }
            
            if 'yearly_price_id' in product:
                plan['yearly_price_id'] = product['yearly_price_id']
                plan['yearly_amount'] = product['yearly_amount']
                plan['yearly_savings'] = product['amount'] * 12 - product['yearly_amount']
            
            # Add features based on tier
            if product['tier'] == 'free':
                plan['features'] = ['10 portfolio positions', 'Basic strategies', 'Standard support']
            elif product['tier'] == 'pro':
                plan['features'] = ['100 portfolio positions', 'Advanced AI strategies', 'Priority support', 'Real-time signals']
            elif product['tier'] == 'enterprise':
                plan['features'] = ['Unlimited positions', 'All premium features', 'Dedicated support', 'Custom integrations']
            
            plans.append(plan)
        
        return {
            'plans': plans,
            'trial_days': 14,
            'currency': 'usd',
            'environment': 'test'
        }
    except Exception as e:
        logger.error(f"Failed to get billing config: {e}")
        raise HTTPException(status_code=500, detail="Failed to get billing configuration")

@router.get("/user/{user_id}")
async def get_user_billing_info(user_id: str):
    """Get user's current billing information"""
    try:
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        billing_info = {
            'user_id': user['id'],
            'current_tier': user['subscription_tier'],
            'stripe_customer_id': user['stripe_customer_id'],
            'subscription': None,
            'invoices': []
        }
        
        # Get Stripe subscription if customer exists
        if user['stripe_customer_id']:
            try:
                subscriptions = stripe.Subscription.list(
                    customer=user['stripe_customer_id'],
                    limit=1
                )
                
                if subscriptions.data:
                    sub = subscriptions.data[0]
                    billing_info['subscription'] = {
                        'id': sub.id,
                        'status': sub.status,
                        'current_period_start': sub.current_period_start,
                        'current_period_end': sub.current_period_end,
                        'trial_end': sub.trial_end,
                        'cancel_at_period_end': sub.cancel_at_period_end,
                        'price_id': sub.items.data[0].price.id if sub.items.data else None
                    }
                
                # Get recent invoices
                invoices = stripe.Invoice.list(
                    customer=user['stripe_customer_id'],
                    limit=5
                )
                
                billing_info['invoices'] = [
                    {
                        'id': inv.id,
                        'amount_paid': inv.amount_paid,
                        'amount_due': inv.amount_due,
                        'status': inv.status,
                        'created': inv.created,
                        'invoice_pdf': inv.invoice_pdf
                    }
                    for inv in invoices.data
                ]
                
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error getting billing info: {e}")
        
        return billing_info
        
    except Exception as e:
        logger.error(f"Failed to get user billing info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get billing information")

@router.post("/subscribe")
async def create_subscription(request: CreateSubscriptionRequest):
    """Create a new subscription"""
    try:
        user = get_user_by_id(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get or create Stripe customer
        customer = get_or_create_stripe_customer(user)
        
        # Get tier from price ID
        tier = get_price_tier(request.price_id)
        
        # Create subscription
        subscription_params = {
            'customer': customer.id,
            'items': [{'price': request.price_id}],
            'metadata': {
                'user_id': request.user_id,
                'tier': tier
            }
        }
        
        # Add trial for paid tiers
        if tier != 'free' and request.trial_days:
            subscription_params['trial_period_days'] = request.trial_days
        
        subscription = stripe.Subscription.create(**subscription_params)
        
        # Update user tier in database
        update_user_tier(request.user_id, tier, customer.id, subscription.id)
        
        return {
            'subscription_id': subscription.id,
            'status': subscription.status,
            'client_secret': subscription.latest_invoice.payment_intent.client_secret if subscription.latest_invoice else None,
            'tier': tier,
            'trial_end': subscription.trial_end
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating subscription: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription")

@router.post("/update-subscription")
async def update_subscription(request: UpdateSubscriptionRequest):
    """Update existing subscription"""
    try:
        # Get current subscription
        subscription = stripe.Subscription.retrieve(request.subscription_id)
        
        # Get new tier
        new_tier = get_price_tier(request.new_price_id)
        
        # Update subscription
        updated_subscription = stripe.Subscription.modify(
            request.subscription_id,
            items=[{
                'id': subscription['items']['data'][0].id,
                'price': request.new_price_id,
            }],
            metadata={
                **subscription.metadata,
                'tier': new_tier
            }
        )
        
        # Update user tier in database
        user_id = subscription.metadata.get('user_id')
        if user_id:
            update_user_tier(user_id, new_tier)
        
        return {
            'subscription_id': updated_subscription.id,
            'status': updated_subscription.status,
            'new_tier': new_tier
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error updating subscription: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to update subscription")

@router.post("/cancel-subscription")
async def cancel_subscription(request: CancelSubscriptionRequest):
    """Cancel subscription"""
    try:
        if request.cancel_at_period_end:
            # Cancel at period end
            subscription = stripe.Subscription.modify(
                request.subscription_id,
                cancel_at_period_end=True
            )
        else:
            # Cancel immediately
            subscription = stripe.Subscription.cancel(request.subscription_id)
            
            # Downgrade user to free tier immediately
            user_id = subscription.metadata.get('user_id')
            if user_id:
                update_user_tier(user_id, 'free')
        
        return {
            'subscription_id': subscription.id,
            'status': subscription.status,
            'canceled_at': subscription.canceled_at,
            'cancel_at_period_end': subscription.cancel_at_period_end
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error canceling subscription: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")

@router.post("/billing-portal")
async def create_billing_portal_session(request: BillingPortalRequest):
    """Create Stripe billing portal session"""
    try:
        session = stripe.billing_portal.Session.create(
            customer=request.customer_id,
            return_url=request.return_url
        )
        
        return {'url': session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating billing portal: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create billing portal: {e}")
        raise HTTPException(status_code=500, detail="Failed to create billing portal")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # In production, verify webhook signature
        # event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        
        # For testing, just parse the JSON
        event = json.loads(payload)
        
        logger.info(f"Received Stripe webhook: {event['type']}")
        
        # Handle different event types
        if event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            user_id = subscription['metadata'].get('user_id')
            tier = subscription['metadata'].get('tier', 'free')
            
            if user_id:
                update_user_tier(user_id, tier)
                logger.info(f"Subscription created for user {user_id}: {tier}")
        
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            user_id = subscription['metadata'].get('user_id')
            tier = subscription['metadata'].get('tier', 'free')
            
            if user_id:
                update_user_tier(user_id, tier)
                logger.info(f"Subscription updated for user {user_id}: {tier}")
        
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            user_id = subscription['metadata'].get('user_id')
            
            if user_id:
                update_user_tier(user_id, 'free')
                logger.info(f"Subscription deleted for user {user_id}, downgraded to free")
        
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            customer_id = invoice['customer']
            
            # Handle failed payment (could send notification, etc.)
            logger.warning(f"Payment failed for customer {customer_id}")
        
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            customer_id = invoice['customer']
            
            logger.info(f"Payment succeeded for customer {customer_id}")
        
        return {'status': 'success'}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

@router.get("/health")
async def billing_health():
    """Health check for billing service"""
    try:
        # Test Stripe connection
        stripe.Product.list(limit=1)
        
        # Test database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        return {
            'status': 'healthy',
            'stripe': 'connected',
            'database': 'connected',
            'environment': 'test'
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        } 