#!/usr/bin/env python3
"""
Stripe Products Setup Script
Creates products and pricing plans in Stripe test environment
"""

import stripe
import os
import json
from datetime import datetime

# Load environment variables
stripe.api_key = "sk_test_51RQFeJRfTZm4mhTAUMPDT1aRk0BreePfNV9nGmt01a56L940DdHDFNUZaNPagUAw578fny7PFD0XFARmKBvFOasy0083VoR24n"

def create_stackmotive_products():
    """Create StackMotive subscription products in Stripe"""
    
    print("🚀 Setting up StackMotive products in Stripe test environment...")
    
    products_config = [
        {
            'name': 'StackMotive Free',
            'description': 'Basic trading analytics and portfolio management',
            'tier': 'free',
            'features': [
                '10 portfolio positions',
                'Basic strategies',
                'Standard support',
                'Basic analytics'
            ],
            'prices': [
                {'amount': 0, 'interval': 'month', 'nickname': 'Free Monthly'}
            ]
        },
        {
            'name': 'StackMotive Pro',
            'description': 'Advanced trading tools with AI-powered insights',
            'tier': 'pro', 
            'features': [
                '100 portfolio positions',
                'Advanced strategies & AI',
                'Priority support',
                'Advanced analytics',
                'Real-time signals',
                'Tax optimization'
            ],
            'prices': [
                {'amount': 2900, 'interval': 'month', 'nickname': 'Pro Monthly'},
                {'amount': 29000, 'interval': 'year', 'nickname': 'Pro Yearly (Save 17%)'}
            ]
        },
        {
            'name': 'StackMotive Enterprise',
            'description': 'Full-featured platform for professional traders',
            'tier': 'enterprise',
            'features': [
                'Unlimited portfolio positions',
                'All premium features',
                'White-label options',
                'Dedicated support',
                'Custom integrations',
                'Advanced API access',
                'Multi-user accounts'
            ],
            'prices': [
                {'amount': 9900, 'interval': 'month', 'nickname': 'Enterprise Monthly'},
                {'amount': 99000, 'interval': 'year', 'nickname': 'Enterprise Yearly (Save 17%)'}
            ]
        }
    ]
    
    created_products = []
    
    for product_config in products_config:
        try:
            # Create product
            print(f"\nCreating product: {product_config['name']}...")
            
            product = stripe.Product.create(
                name=product_config['name'],
                description=product_config['description'],
                metadata={
                    'tier': product_config['tier'],
                    'features': json.dumps(product_config['features']),
                    'created_by': 'stackmotive_setup',
                    'created_at': datetime.now().isoformat()
                }
            )
            
            print(f"✅ Product created: {product.id}")
            
            # Create prices for this product
            product_prices = []
            for price_config in product_config['prices']:
                price = stripe.Price.create(
                    product=product.id,
                    unit_amount=price_config['amount'],
                    currency='usd',
                    recurring={'interval': price_config['interval']},
                    nickname=price_config['nickname'],
                    metadata={
                        'tier': product_config['tier'],
                        'interval': price_config['interval']
                    }
                )
                
                product_prices.append({
                    'price_id': price.id,
                    'amount': price_config['amount'],
                    'interval': price_config['interval'],
                    'nickname': price_config['nickname']
                })
                
                print(f"  ✅ Price created: {price.id} (${price_config['amount']/100:.2f}/{price_config['interval']})")
            
            created_products.append({
                'product_id': product.id,
                'name': product_config['name'],
                'tier': product_config['tier'],
                'description': product_config['description'],
                'features': product_config['features'],
                'prices': product_prices
            })
            
        except stripe.error.StripeError as e:
            print(f"❌ Error creating product {product_config['name']}: {e}")
            continue
    
    return created_products

def create_trial_configuration():
    """Set up trial configurations"""
    print("\n🔄 Setting up trial configurations...")
    
    # Stripe handles trials at the subscription level, not product level
    # We'll configure this in the subscription creation logic
    trial_config = {
        'trial_period_days': 14,
        'trial_eligibility': ['pro', 'enterprise'],
        'trial_features': [
            'Full access to Pro/Enterprise features',
            'No credit card required',
            'Cancel anytime during trial'
        ]
    }
    
    print("✅ Trial configuration ready")
    return trial_config

def setup_webhook_endpoints():
    """Set up webhook endpoints for subscription events"""
    print("\n🔗 Setting up webhook endpoints...")
    
    # In a real setup, you'd create webhook endpoints
    # For now, we'll prepare the configuration
    webhook_events = [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'customer.created',
        'customer.updated'
    ]
    
    webhook_config = {
        'url': 'http://localhost:8000/api/stripe/webhook',
        'events': webhook_events,
        'description': 'StackMotive subscription events'
    }
    
    print("✅ Webhook configuration prepared")
    print(f"   Events to handle: {len(webhook_events)}")
    
    return webhook_config

def generate_environment_update(products, trial_config, webhook_config):
    """Generate environment variable updates"""
    print("\n📝 Generating environment configuration...")
    
    # Create environment variable suggestions
    env_updates = {}
    
    for product in products:
        tier = product['tier'].upper()
        env_updates[f'STRIPE_{tier}_PRODUCT_ID'] = product['product_id']
        
        for price in product['prices']:
            interval = price['interval'].upper()
            env_updates[f'STRIPE_{tier}_{interval}_PRICE_ID'] = price['price_id']
    
    env_updates['STRIPE_TRIAL_DAYS'] = str(trial_config['trial_period_days'])
    
    return env_updates

def save_stripe_configuration(products, trial_config, webhook_config, env_updates):
    """Save complete Stripe configuration"""
    
    config = {
        'setup_date': datetime.now().isoformat(),
        'stripe_environment': 'test',
        'products': products,
        'trial_configuration': trial_config,
        'webhook_configuration': webhook_config,
        'environment_variables': env_updates,
        'setup_status': 'complete'
    }
    
    with open('stripe_configuration.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ Configuration saved to stripe_configuration.json")
    
    return config

def main():
    """Main setup function"""
    print("🎯 StackMotive Stripe Setup")
    print("=" * 50)
    
    try:
        # Test Stripe connection
        print("Testing Stripe connection...")
        account = stripe.Account.retrieve()
        print(f"✅ Connected to Stripe account: {account.display_name or account.id}")
        
        # Create products and prices
        products = create_stackmotive_products()
        
        # Set up trial configuration
        trial_config = create_trial_configuration()
        
        # Set up webhook configuration
        webhook_config = setup_webhook_endpoints()
        
        # Generate environment updates
        env_updates = generate_environment_update(products, trial_config, webhook_config)
        
        # Save complete configuration
        config = save_stripe_configuration(products, trial_config, webhook_config, env_updates)
        
        # Summary
        print("\n" + "=" * 50)
        print("🎉 Stripe Setup Complete!")
        print(f"✅ Products created: {len(products)}")
        print(f"✅ Total prices: {sum(len(p['prices']) for p in products)}")
        print(f"✅ Trial period: {trial_config['trial_period_days']} days")
        print(f"✅ Webhook events: {len(webhook_config['events'])}")
        
        print("\n📋 Next Steps:")
        print("1. Update .env file with new product/price IDs")
        print("2. Implement subscription management API")
        print("3. Create billing UI components")
        print("4. Set up webhook handlers")
        print("5. Test subscription flows")
        
        print("\n💡 Environment Variables to Add:")
        for key, value in env_updates.items():
            print(f"   {key}={value}")
        
        return True
        
    except stripe.error.AuthenticationError:
        print("❌ Stripe authentication failed - check your API key")
        return False
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 