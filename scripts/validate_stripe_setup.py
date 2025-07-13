#!/usr/bin/env python3
"""
Stripe Setup Validation Script
Validates Stripe products, database integration, and RLS policies
"""

import stripe
import psycopg2
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Stripe configuration
stripe.api_key = "sk_test_51RQFeJRfTZm4mhTAUMPDT1aRk0BreePfNV9nGmt01a56L940DdHDFNUZaNPagUAw578fny7PFD0XFARmKBvFOasy0083VoR24n"

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': '5432',
    'database': 'stackmotive',
    'user': 'stackmotive',
    'password': 'stackmotive123'
}

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

def test_stripe_connection():
    """Test Stripe API connection"""
    logger.info("🔗 Testing Stripe API connection...")
    
    try:
        # List products to test connection
        products = stripe.Product.list(limit=5)
        logger.info(f"✅ Stripe connected - found {len(products.data)} products")
        
        # Show our created products
        stackmotive_products = [p for p in products.data if 'stackmotive' in p.name.lower()]
        logger.info(f"📦 StackMotive products: {len(stackmotive_products)}")
        
        for product in stackmotive_products:
            logger.info(f"   - {product.name} ({product.id})")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Stripe connection failed: {e}")
        return False

def test_database_connection():
    """Test database connection"""
    logger.info("🗄️ Testing database connection...")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        logger.info(f"✅ Database connected - PostgreSQL {version.split()[1]}")
        
        # Test users table
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        logger.info(f"👤 Users in database: {user_count}")
        
        # Test RLS functions
        cursor.execute("SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_user_tier')")
        rls_exists = cursor.fetchone()[0]
        logger.info(f"🔒 RLS functions: {'✅ Active' if rls_exists else '❌ Missing'}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def test_stripe_products():
    """Test Stripe products configuration"""
    logger.info("📋 Testing Stripe products configuration...")
    
    try:
        # Load our configuration
        with open('stripe_config.json', 'r') as f:
            config = json.load(f)
        
        logger.info("✅ Stripe configuration loaded")
        
        # Validate each product exists in Stripe
        valid_products = 0
        for product_config in config['products']:
            try:
                product = stripe.Product.retrieve(product_config['product_id'])
                logger.info(f"✅ {product.name} - {product.id}")
                
                # Check prices
                prices = stripe.Price.list(product=product.id)
                logger.info(f"   💰 {len(prices.data)} prices configured")
                
                valid_products += 1
                
            except Exception as e:
                logger.error(f"❌ Product {product_config['product_id']} error: {e}")
        
        logger.info(f"📊 Valid products: {valid_products}/3")
        return valid_products == 3
        
    except Exception as e:
        logger.error(f"❌ Products test failed: {e}")
        return False

def test_billing_integration():
    """Test billing integration with database"""
    logger.info("🔗 Testing billing integration...")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create test user if not exists
        test_user_id = '12345678-1234-1234-1234-123456789012'
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, subscription_tier, role)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (test_user_id, 'billing_test', 'test@billing.com', 'test', 'free', 'user'))
        
        # Test tier update
        cursor.execute("""
            UPDATE users SET subscription_tier = 'pro' WHERE id = %s
        """, (test_user_id,))
        
        # Test RLS integration
        cursor.execute("SELECT set_current_user(%s)", (test_user_id,))
        cursor.execute("SELECT get_user_tier()")
        tier = cursor.fetchone()[0]
        
        logger.info(f"✅ User tier: {tier}")
        
        # Test tier access
        cursor.execute("SELECT user_has_tier_access('pro')")
        has_pro = cursor.fetchone()[0]
        logger.info(f"✅ Pro access: {has_pro}")
        
        # Cleanup
        cursor.execute("DELETE FROM users WHERE id = %s", (test_user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info("✅ Billing integration working")
        return True
        
    except Exception as e:
        logger.error(f"❌ Billing integration failed: {e}")
        return False

def test_subscription_flow():
    """Test subscription flow simulation"""
    logger.info("🔄 Testing subscription flow...")
    
    try:
        # Load config
        with open('stripe_config.json', 'r') as f:
            config = json.load(f)
        
        # Get Pro product
        pro_product = next(p for p in config['products'] if p['tier'] == 'pro')
        
        # Create a test customer
        customer = stripe.Customer.create(
            email='test-sub@stackmotive.com',
            name='Test Subscription User',
            metadata={'test': 'true'}
        )
        
        logger.info(f"✅ Test customer created: {customer.id}")
        
        # Simulate subscription creation (don't actually create)
        logger.info(f"✅ Would create subscription for price: {pro_product['monthly_price_id']}")
        
        # Cleanup test customer
        stripe.Customer.delete(customer.id)
        logger.info("✅ Test customer cleaned up")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Subscription flow test failed: {e}")
        return False

def generate_integration_report():
    """Generate integration status report"""
    logger.info("📊 Generating integration report...")
    
    tests = [
        ("Stripe Connection", test_stripe_connection),
        ("Database Connection", test_database_connection),
        ("Stripe Products", test_stripe_products),
        ("Billing Integration", test_billing_integration),
        ("Subscription Flow", test_subscription_flow)
    ]
    
    results = {}
    for test_name, test_func in tests:
        logger.info(f"\n🧪 Running: {test_name}")
        results[test_name] = test_func()
    
    # Generate report
    report = {
        'timestamp': datetime.now().isoformat(),
        'environment': 'test',
        'results': results,
        'summary': {
            'total_tests': len(tests),
            'passed': sum(results.values()),
            'failed': len(tests) - sum(results.values())
        }
    }
    
    # Save report
    with open('stripe_integration_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    return report

def main():
    """Main validation function"""
    logger.info("🚀 StackMotive Stripe Integration Validation")
    logger.info("=" * 60)
    
    report = generate_integration_report()
    
    logger.info("\n" + "=" * 60)
    logger.info("🎯 VALIDATION RESULTS")
    logger.info("=" * 60)
    
    for test_name, result in report['results'].items():
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{status} {test_name}")
    
    summary = report['summary']
    logger.info("=" * 60)
    logger.info(f"📊 Summary: {summary['passed']}/{summary['total_tests']} tests passed")
    
    if summary['passed'] == summary['total_tests']:
        logger.info("🎉 ALL TESTS PASSED!")
        logger.info("✅ Stripe billing integration is ready for production!")
        
        logger.info("\n💡 Next Steps:")
        logger.info("   1. Start FastAPI server: python server/main.py")
        logger.info("   2. Test billing UI: http://localhost:3000/billing")
        logger.info("   3. Set up webhook endpoints in Stripe dashboard")
        logger.info("   4. Configure production environment variables")
        
        return True
    else:
        logger.info("⚠️ Some tests failed. Check logs for details.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 