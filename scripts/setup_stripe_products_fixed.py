#!/usr/bin/env python3
"""
Stripe Products Setup Script (Fixed)
Creates products and pricing plans in Stripe test environment
"""

import stripe
import json
from datetime import datetime

# Load Stripe API key
stripe.api_key = "sk_test_51RQFeJRfTZm4mhTAUMPDT1aRk0BreePfNV9nGmt01a56L940DdHDFNUZaNPagUAw578fny7PFD0XFARmKBvFOasy0083VoR24n"

def test_stripe_connection():
    """Test Stripe API connection"""
    try:
        # Simple API test - list existing products
        products = stripe.Product.list(limit=1)
        print("✅ Stripe API connection successful")
        return True
    except stripe.error.AuthenticationError:
        print("❌ Stripe authentication failed - check API key")
        return False
    except Exception as e:
        print(f"⚠️ Stripe connection warning: {e}")
        return True  # Continue anyway

def create_stackmotive_products():
    """Create StackMotive products in Stripe"""
    print("\n🏗️ Creating StackMotive products...")
    
    products_to_create = [
        {
            'name': 'StackMotive Free',
            'description': 'Basic trading analytics - 10 positions, basic strategies',
            'tier': 'free',
            'price': 0
        },
        {
            'name': 'StackMotive Pro', 
            'description': 'Advanced trading tools - 100 positions, AI insights, priority support',
            'tier': 'pro',
            'price': 2900  # $29.00
        },
        {
            'name': 'StackMotive Enterprise',
            'description': 'Full platform - unlimited positions, all features, dedicated support',
            'tier': 'enterprise', 
            'price': 9900  # $99.00
        }
    ]
    
    created_products = []
    
    for product_config in products_to_create:
        try:
            print(f"\nCreating: {product_config['name']}...")
            
            # Create the product
            product = stripe.Product.create(
                name=product_config['name'],
                description=product_config['description'],
                metadata={'tier': product_config['tier']}
            )
            
            # Create monthly price
            monthly_price = stripe.Price.create(
                product=product.id,
                unit_amount=product_config['price'],
                currency='usd',
                recurring={'interval': 'month'} if product_config['price'] > 0 else None,
                nickname=f"{product_config['tier'].title()} Monthly"
            )
            
            result = {
                'product_id': product.id,
                'name': product_config['name'],
                'tier': product_config['tier'],
                'monthly_price_id': monthly_price.id,
                'amount': product_config['price']
            }
            
            # Create yearly price for paid tiers (with discount)
            if product_config['price'] > 0:
                yearly_amount = int(product_config['price'] * 10)  # 10 months price for yearly
                yearly_price = stripe.Price.create(
                    product=product.id,
                    unit_amount=yearly_amount,
                    currency='usd',
                    recurring={'interval': 'year'},
                    nickname=f"{product_config['tier'].title()} Yearly (Save 17%)"
                )
                result['yearly_price_id'] = yearly_price.id
                result['yearly_amount'] = yearly_amount
            
            created_products.append(result)
            print(f"✅ {product_config['name']}: {product.id}")
            print(f"   Monthly: {monthly_price.id} (${product_config['price']/100:.2f})")
            if product_config['price'] > 0:
                print(f"   Yearly: {yearly_price.id} (${yearly_amount/100:.2f})")
            
        except stripe.error.StripeError as e:
            print(f"❌ Failed to create {product_config['name']}: {e}")
            continue
    
    return created_products

def generate_config_file(products):
    """Generate configuration file"""
    config = {
        'setup_date': datetime.now().isoformat(),
        'environment': 'test',
        'products': products,
        'pricing_summary': {
            'free': '$0/month - 10 positions',
            'pro': '$29/month - 100 positions + AI',
            'enterprise': '$99/month - unlimited + all features'
        }
    }
    
    # Save configuration
    with open('stripe_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\n✅ Configuration saved to stripe_config.json")
    return config

def display_summary(products):
    """Display setup summary"""
    print("\n" + "=" * 60)
    print("🎉 STRIPE SETUP COMPLETE!")
    print("=" * 60)
    
    for product in products:
        print(f"\n📦 {product['name']} ({product['tier'].upper()})")
        print(f"   Product ID: {product['product_id']}")
        print(f"   Monthly Price ID: {product['monthly_price_id']}")
        if 'yearly_price_id' in product:
            print(f"   Yearly Price ID: {product['yearly_price_id']}")
        print(f"   Price: ${product['amount']/100:.2f}/month")
    
    print(f"\n📊 Summary:")
    print(f"   Products created: {len(products)}")
    print(f"   Total prices: {sum(2 if p['amount'] > 0 else 1 for p in products)}")
    print(f"   Environment: Test mode")
    
    print(f"\n🔧 Next Steps:")
    print(f"   1. ✅ Products created in Stripe")
    print(f"   2. 🔄 Build subscription management API") 
    print(f"   3. 🔄 Create billing UI components")
    print(f"   4. 🔄 Set up webhook handlers")
    print(f"   5. 🔄 Test complete billing flow")

def main():
    """Main setup function"""
    print("🚀 StackMotive Stripe Products Setup")
    print("=" * 50)
    
    # Test connection
    if not test_stripe_connection():
        return False
    
    try:
        # Create products
        products = create_stackmotive_products()
        
        if not products:
            print("❌ No products were created")
            return False
        
        # Generate config
        config = generate_config_file(products)
        
        # Display summary
        display_summary(products)
        
        return True
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 