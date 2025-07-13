"""
Stripe Webhook Handler
Processes Stripe events and synchronizes with database
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import stripe
import psycopg2
import json
import logging
from datetime import datetime
import hmac
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stripe", tags=["stripe"])

# Stripe configuration
stripe.api_key = "sk_test_51RQFeJRfTZm4mhTAUMPDT1aRk0BreePfNV9nGmt01a56L940DdHDFNUZaNPagUAw578fny7PFD0XFARmKBvFOasy0083VoR24n"
WEBHOOK_SECRET = "whsec_test_placeholder"  # Will be updated when webhook is created

def get_db_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(
        host='localhost',
        port='5432',
        database='stackmotive',
        user='stackmotive',
        password='stackmotive123'
    )

def update_user_subscription(user_id: str, tier: str, subscription_data: dict = None):
    """Update user subscription in database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Update user tier and subscription info
        if subscription_data:
            cursor.execute("""
                UPDATE users 
                SET 
                    subscription_tier = %s,
                    stripe_customer_id = %s,
                    stripe_subscription_id = %s,
                    updated_at = NOW()
                WHERE id = %s
            """, (
                tier,
                subscription_data.get('customer'),
                subscription_data.get('id'),
                user_id
            ))
        else:
            cursor.execute("""
                UPDATE users 
                SET subscription_tier = %s, updated_at = NOW()
                WHERE id = %s
            """, (tier, user_id))
        
        conn.commit()
        
        # Log the tier change in agent memory for audit
        cursor.execute("""
            INSERT INTO agent_memory (
                user_id, block_id, action, context, metadata, timestamp
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            'billing',
            'tier_updated',
            f'Subscription tier updated to {tier}',
            json.dumps({
                'previous_tier': 'unknown',
                'new_tier': tier,
                'source': 'stripe_webhook',
                'subscription_id': subscription_data.get('id') if subscription_data else None
            }),
            datetime.now()
        ))
        
        conn.commit()
        logger.info(f"Updated user {user_id} to tier {tier}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to update user subscription: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def log_webhook_event(event_type: str, event_id: str, data: dict, status: str = 'processed'):
    """Log webhook event for debugging"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create webhook logs table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS webhook_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_type VARCHAR(100) NOT NULL,
                event_id VARCHAR(100) NOT NULL,
                event_data JSONB,
                status VARCHAR(50) NOT NULL,
                processed_at TIMESTAMPTZ DEFAULT NOW(),
                error_message TEXT
            )
        """)
        
        cursor.execute("""
            INSERT INTO webhook_logs (event_type, event_id, event_data, status)
            VALUES (%s, %s, %s, %s)
        """, (event_type, event_id, json.dumps(data), status))
        
        conn.commit()
        
    except Exception as e:
        logger.error(f"Failed to log webhook event: {e}")
    finally:
        cursor.close()
        conn.close()

def get_tier_from_price(price_id: str) -> str:
    """Get tier from price ID"""
    # Load stripe config to map price IDs to tiers
    try:
        with open('stripe_config.json', 'r') as f:
            config = json.load(f)
        
        for product in config['products']:
            if product['monthly_price_id'] == price_id:
                return product['tier']
            if 'yearly_price_id' in product and product['yearly_price_id'] == price_id:
                return product['tier']
    except Exception as e:
        logger.error(f"Failed to load stripe config: {e}")
    
    return 'free'

@router.post("/webhook")
async def handle_stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature', '')
        
        # Verify webhook signature (disabled for testing)
        # try:
        #     event = stripe.Webhook.construct_event(
        #         payload, sig_header, WEBHOOK_SECRET
        #     )
        # except ValueError:
        #     logger.error("Invalid payload")
        #     raise HTTPException(status_code=400, detail="Invalid payload")
        # except stripe.error.SignatureVerificationError:
        #     logger.error("Invalid signature")
        #     raise HTTPException(status_code=400, detail="Invalid signature")
        
        # For testing, parse JSON directly
        event = json.loads(payload)
        
        event_type = event['type']
        event_id = event['id']
        event_data = event['data']['object']
        
        logger.info(f"Processing webhook: {event_type} ({event_id})")
        
        # Log the event
        log_webhook_event(event_type, event_id, event_data)
        
        # Handle different event types
        if event_type == 'customer.subscription.created':
            await handle_subscription_created(event_data)
            
        elif event_type == 'customer.subscription.updated':
            await handle_subscription_updated(event_data)
            
        elif event_type == 'customer.subscription.deleted':
            await handle_subscription_deleted(event_data)
            
        elif event_type == 'invoice.payment_succeeded':
            await handle_payment_succeeded(event_data)
            
        elif event_type == 'invoice.payment_failed':
            await handle_payment_failed(event_data)
            
        elif event_type == 'customer.created':
            await handle_customer_created(event_data)
            
        elif event_type == 'customer.subscription.trial_will_end':
            await handle_trial_will_end(event_data)
            
        else:
            logger.info(f"Unhandled event type: {event_type}")
        
        return JSONResponse(content={'status': 'success'}, status_code=200)
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")

async def handle_subscription_created(subscription_data: dict):
    """Handle subscription created event"""
    user_id = subscription_data.get('metadata', {}).get('user_id')
    if not user_id:
        logger.warning("No user_id in subscription metadata")
        return
    
    # Get tier from price
    price_id = subscription_data['items']['data'][0]['price']['id']
    tier = get_tier_from_price(price_id)
    
    # Update user subscription
    update_user_subscription(user_id, tier, subscription_data)
    
    logger.info(f"Subscription created: user {user_id} -> {tier}")

async def handle_subscription_updated(subscription_data: dict):
    """Handle subscription updated event"""
    user_id = subscription_data.get('metadata', {}).get('user_id')
    if not user_id:
        logger.warning("No user_id in subscription metadata")
        return
    
    # Get tier from price
    price_id = subscription_data['items']['data'][0]['price']['id']
    tier = get_tier_from_price(price_id)
    
    # Check if subscription is canceled but still active
    if subscription_data.get('cancel_at_period_end'):
        logger.info(f"Subscription will cancel at period end: user {user_id}")
        # Don't change tier yet, wait for deletion event
        return
    
    # Update user subscription
    update_user_subscription(user_id, tier, subscription_data)
    
    logger.info(f"Subscription updated: user {user_id} -> {tier}")

async def handle_subscription_deleted(subscription_data: dict):
    """Handle subscription deleted event"""
    user_id = subscription_data.get('metadata', {}).get('user_id')
    if not user_id:
        logger.warning("No user_id in subscription metadata")
        return
    
    # Downgrade to free tier
    update_user_subscription(user_id, 'free')
    
    logger.info(f"Subscription deleted: user {user_id} -> free")

async def handle_payment_succeeded(invoice_data: dict):
    """Handle successful payment"""
    customer_id = invoice_data.get('customer')
    amount = invoice_data.get('amount_paid', 0)
    
    logger.info(f"Payment succeeded: customer {customer_id}, amount ${amount/100:.2f}")
    
    # Could send confirmation email, update payment status, etc.

async def handle_payment_failed(invoice_data: dict):
    """Handle failed payment"""
    customer_id = invoice_data.get('customer')
    amount = invoice_data.get('amount_due', 0)
    
    logger.warning(f"Payment failed: customer {customer_id}, amount ${amount/100:.2f}")
    
    # Could send notification email, retry payment, etc.

async def handle_customer_created(customer_data: dict):
    """Handle customer created event"""
    customer_id = customer_data.get('id')
    email = customer_data.get('email')
    
    logger.info(f"Customer created: {customer_id} ({email})")

async def handle_trial_will_end(subscription_data: dict):
    """Handle trial ending soon"""
    user_id = subscription_data.get('metadata', {}).get('user_id')
    trial_end = subscription_data.get('trial_end')
    
    if user_id and trial_end:
        trial_end_date = datetime.fromtimestamp(trial_end)
        logger.info(f"Trial will end for user {user_id} on {trial_end_date}")
        
        # Could send trial ending notification email

@router.get("/webhook/test")
async def test_webhook():
    """Test webhook endpoint"""
    return {
        'status': 'webhook endpoint active',
        'timestamp': datetime.now().isoformat(),
        'stripe_key_configured': bool(stripe.api_key)
    }

@router.post("/webhook/test-event")
async def test_webhook_event():
    """Test webhook with sample event"""
    sample_event = {
        'id': 'evt_test_webhook',
        'type': 'customer.subscription.created',
        'data': {
            'object': {
                'id': 'sub_test_123',
                'customer': 'cus_test_123',
                'status': 'active',
                'items': {
                    'data': [{
                        'price': {
                            'id': 'price_test_123'
                        }
                    }]
                },
                'metadata': {
                    'user_id': 'test-user-id',
                    'tier': 'pro'
                }
            }
        }
    }
    
    # Process the test event
    event_data = sample_event['data']['object']
    await handle_subscription_created(event_data)
    
    return {
        'status': 'test event processed',
        'event': sample_event
    } 