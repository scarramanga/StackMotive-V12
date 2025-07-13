#!/usr/bin/env python3
"""
Stripe Integration Test Suite
Tests the complete billing system integration
"""

import requests
import json
import psycopg2
import uuid
from datetime import datetime
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StripeBillingTest:
    def __init__(self):
        self.base_url = 'http://localhost:8000'
        self.test_user_id = None
        self.test_email = f'test-{int(time.time())}@stripetest.com'
        
        # Database connection
        self.db_config = {
            'host': 'localhost',
            'port': '5432',
            'database': 'stackmotive',
            'user': 'stackmotive',
            'password': 'stackmotive123'
        }
    
    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)
    
    def create_test_user(self):
        """Create a test user for billing tests"""
        logger.info("Creating test user...")
        
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        try:
            user_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (
                    id, username, email, password_hash, subscription_tier, role
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_id, 'stripe_test_user', self.test_email,
                'test_hash', 'free', 'user'
            ))
            
            conn.commit()
            self.test_user_id = user_id
            logger.info(f"✅ Test user created: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create test user: {e}")
            return False
        finally:
            cursor.close()
            conn.close()
    
    def test_billing_config(self):
        """Test billing configuration endpoint"""
        logger.info("Testing billing configuration...")
        
        try:
            response = requests.get(f'{self.base_url}/billing/config')
            
            if response.status_code != 200:
                logger.error(f"❌ Config endpoint failed: {response.status_code}")
                return False
            
            config = response.json()
            
            # Validate config structure
            required_fields = ['plans', 'trial_days', 'currency']
            for field in required_fields:
                if field not in config:
                    logger.error(f"❌ Missing config field: {field}")
                    return False
            
            # Validate plans
            plans = config['plans']
            if len(plans) != 3:
                logger.error(f"❌ Expected 3 plans, got {len(plans)}")
                return False
            
            tiers = [plan['tier'] for plan in plans]
            expected_tiers = ['free', 'pro', 'enterprise']
            
            for tier in expected_tiers:
                if tier not in tiers:
                    logger.error(f"❌ Missing tier: {tier}")
                    return False
            
            logger.info("✅ Billing configuration test passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Config test failed: {e}")
            return False
    
    def test_user_billing_info(self):
        """Test user billing info endpoint"""
        logger.info("Testing user billing info...")
        
        try:
            response = requests.get(f'{self.base_url}/billing/user/{self.test_user_id}')
            
            if response.status_code != 200:
                logger.error(f"❌ User billing endpoint failed: {response.status_code}")
                return False
            
            billing_info = response.json()
            
            # Validate billing info structure
            required_fields = ['user_id', 'current_tier', 'subscription', 'invoices']
            for field in required_fields:
                if field not in billing_info:
                    logger.error(f"❌ Missing billing info field: {field}")
                    return False
            
            # Should start with free tier and no subscription
            if billing_info['current_tier'] != 'free':
                logger.error(f"❌ Expected free tier, got {billing_info['current_tier']}")
                return False
            
            if billing_info['subscription'] is not None:
                logger.error("❌ New user should not have subscription")
                return False
            
            logger.info("✅ User billing info test passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ User billing info test failed: {e}")
            return False
    
    def test_subscription_creation(self):
        """Test subscription creation"""
        logger.info("Testing subscription creation...")
        
        try:
            # Get Pro monthly price ID from config
            config_response = requests.get(f'{self.base_url}/billing/config')
            config = config_response.json()
            
            pro_plan = next(plan for plan in config['plans'] if plan['tier'] == 'pro')
            price_id = pro_plan['monthly_price_id']
            
            # Create subscription
            response = requests.post(f'{self.base_url}/billing/subscribe', json={
                'user_id': self.test_user_id,
                'price_id': price_id,
                'trial_days': 14
            })
            
            if response.status_code != 200:
                logger.error(f"❌ Subscription creation failed: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
            
            subscription = response.json()
            
            # Validate subscription response
            required_fields = ['subscription_id', 'status', 'tier']
            for field in required_fields:
                if field not in subscription:
                    logger.error(f"❌ Missing subscription field: {field}")
                    return False
            
            if subscription['tier'] != 'pro':
                logger.error(f"❌ Expected pro tier, got {subscription['tier']}")
                return False
            
            # Check database was updated
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT subscription_tier FROM users WHERE id = %s", (self.test_user_id,))
            result = cursor.fetchone()
            
            if not result or result[0] != 'pro':
                logger.error("❌ Database not updated with subscription tier")
                return False
            
            cursor.close()
            conn.close()
            
            logger.info("✅ Subscription creation test passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Subscription creation test failed: {e}")
            return False
    
    def test_webhook_handling(self):
        """Test webhook event handling"""
        logger.info("Testing webhook handling...")
        
        try:
            # Test webhook endpoint health
            response = requests.get(f'{self.base_url}/stripe/webhook/test')
            
            if response.status_code != 200:
                logger.error(f"❌ Webhook test endpoint failed: {response.status_code}")
                return False
            
            # Test sample webhook event
            response = requests.post(f'{self.base_url}/stripe/webhook/test-event')
            
            if response.status_code != 200:
                logger.error(f"❌ Webhook test event failed: {response.status_code}")
                return False
            
            logger.info("✅ Webhook handling test passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Webhook handling test failed: {e}")
            return False
    
    def test_rls_tier_integration(self):
        """Test RLS tier integration"""
        logger.info("Testing RLS tier integration...")
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Set user context for pro user
            cursor.execute("SELECT set_current_user(%s)", (self.test_user_id,))
            
            # Check current tier function
            cursor.execute("SELECT get_user_tier()")
            tier = cursor.fetchone()[0]
            
            if tier != 'pro':
                logger.error(f"❌ RLS tier function returned {tier}, expected pro")
                return False
            
            # Test tier-based access
            cursor.execute("SELECT user_has_tier_access('pro')")
            has_pro_access = cursor.fetchone()[0]
            
            if not has_pro_access:
                logger.error("❌ User should have pro tier access")
                return False
            
            cursor.execute("SELECT user_has_tier_access('enterprise')")
            has_enterprise_access = cursor.fetchone()[0]
            
            if has_enterprise_access:
                logger.error("❌ Pro user should not have enterprise access")
                return False
            
            cursor.close()
            conn.close()
            
            logger.info("✅ RLS tier integration test passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ RLS tier integration test failed: {e}")
            return False
    
    def test_billing_health(self):
        """Test billing service health"""
        logger.info("Testing billing service health...")
        
        try:
            response = requests.get(f'{self.base_url}/billing/health')
            
            if response.status_code != 200:
                logger.error(f"❌ Billing health check failed: {response.status_code}")
                return False
            
            health = response.json()
            
            if health['status'] != 'healthy':
                logger.error(f"❌ Billing service unhealthy: {health}")
                return False
            
            required_services = ['stripe', 'database']
            for service in required_services:
                if health.get(service) != 'connected':
                    logger.error(f"❌ Service {service} not connected")
                    return False
            
            logger.info("✅ Billing health test passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Billing health test failed: {e}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data"""
        logger.info("Cleaning up test data...")
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Delete test user
            cursor.execute("DELETE FROM users WHERE id = %s", (self.test_user_id,))
            
            # Clean webhook logs
            cursor.execute("DELETE FROM webhook_logs WHERE event_id LIKE 'evt_test_%'")
            
            conn.commit()
            cursor.close()
            conn.close()
            
            logger.info("✅ Test data cleaned up")
            
        except Exception as e:
            logger.error(f"⚠️ Cleanup warning: {e}")
    
    def run_all_tests(self):
        """Run complete test suite"""
        logger.info("🚀 Starting Stripe Billing Integration Tests")
        logger.info("=" * 60)
        
        tests = [
            ('Billing Health Check', self.test_billing_health),
            ('Create Test User', self.create_test_user),
            ('Billing Configuration', self.test_billing_config),
            ('User Billing Info', self.test_user_billing_info),
            ('Subscription Creation', self.test_subscription_creation),
            ('Webhook Handling', self.test_webhook_handling),
            ('RLS Tier Integration', self.test_rls_tier_integration)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            logger.info(f"\n📋 Running: {test_name}")
            try:
                results[test_name] = test_func()
            except Exception as e:
                logger.error(f"❌ {test_name} failed with exception: {e}")
                results[test_name] = False
        
        # Cleanup
        self.cleanup_test_data()
        
        # Results summary
        logger.info("\n" + "=" * 60)
        logger.info("🎯 TEST RESULTS SUMMARY")
        logger.info("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            logger.info(f"{status} {test_name}")
            if result:
                passed += 1
        
        logger.info("=" * 60)
        logger.info(f"📊 Results: {passed}/{total} tests passed")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Stripe billing integration is working correctly.")
            return True
        else:
            logger.info("⚠️ Some tests failed. Check logs for details.")
            return False

def main():
    """Main test function"""
    test_suite = StripeBillingTest()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n🎉 Stripe Integration Test Suite: PASSED")
        print("✅ Billing system is production ready!")
    else:
        print("\n❌ Stripe Integration Test Suite: FAILED")
        print("⚠️ Check logs for billing issues")
    
    return success

if __name__ == "__main__":
    main() 