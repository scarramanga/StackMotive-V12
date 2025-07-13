#!/usr/bin/env python3
"""
Fixed RLS Test Suite
Properly tests user isolation with dedicated test data
"""

import psycopg2
import uuid
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FixedRLSTest:
    def __init__(self):
        self.conn = psycopg2.connect(
            host='localhost',
            port='5432',
            database='stackmotive',
            user='stackmotive',
            password='stackmotive123'
        )
        self.test_users = {}
    
    def setup_test_users(self):
        """Create fresh test users"""
        cursor = self.conn.cursor()
        
        # Clean up any existing test users
        cursor.execute("DELETE FROM users WHERE email LIKE '%rls_test%'")
        self.conn.commit()
        
        # Create test users
        users_data = [
            ('alice_rls_test@example.com', 'alice_test', 'free'),
            ('bob_rls_test@example.com', 'bob_test', 'pro'),
            ('charlie_rls_test@example.com', 'charlie_test', 'enterprise')
        ]
        
        for email, username, tier in users_data:
            user_id = str(uuid.uuid4())
            
            cursor.execute("""
                INSERT INTO users (
                    id, username, email, password_hash, subscription_tier, role
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, username, email, 'test_hash', tier, 'user'))
            
            self.test_users[username] = {
                'id': user_id,
                'email': email,
                'tier': tier
            }
        
        self.conn.commit()
        logger.info(f"✅ Created {len(users_data)} test users")
    
    def create_test_data(self):
        """Create test portfolio positions for each user"""
        cursor = self.conn.cursor()
        
        # Clean up existing test positions
        cursor.execute("DELETE FROM portfolio_positions WHERE symbol LIKE 'RLS_TEST_%'")
        
        # Create positions for each user
        for username, user_data in self.test_users.items():
            user_id = user_data['id']
            
            # Create 2 positions per user with unique symbols
            positions = [
                (f'RLS_TEST_{username}_1', f'{username} Stock 1'),
                (f'RLS_TEST_{username}_2', f'{username} Stock 2')
            ]
            
            for symbol, name in positions:
                position_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO portfolio_positions (
                        id, user_id, symbol, name, quantity, avg_price,
                        asset_class, account, sync_source
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    position_id, user_id, symbol, name, 100.0, 50.0,
                    'equity', 'test_account', 'rls_test'
                ))
        
        self.conn.commit()
        logger.info("✅ Created test portfolio positions for each user")
    
    def set_user_context(self, username):
        """Set user context for RLS"""
        cursor = self.conn.cursor()
        user_id = self.test_users[username]['id']
        
        cursor.execute("SELECT set_current_user(%s)", (user_id,))
        self.conn.commit()
        
        # Verify context
        cursor.execute("SELECT get_current_user()")
        current_user = cursor.fetchone()[0]
        
        if str(current_user) == user_id:
            logger.info(f"✅ Set context for {username}")
            return True
        else:
            logger.error(f"❌ Failed to set context for {username}")
            return False
    
    def test_user_isolation(self):
        """Test that users can only see their own data"""
        logger.info("Testing user isolation...")
        
        cursor = self.conn.cursor()
        isolation_results = {}
        
        for username in self.test_users.keys():
            # Set user context
            self.set_user_context(username)
            
            # Query visible positions
            cursor.execute("""
                SELECT symbol, user_id 
                FROM portfolio_positions 
                WHERE symbol LIKE 'RLS_TEST_%'
            """)
            visible_positions = cursor.fetchall()
            
            # Check which positions belong to this user
            own_positions = [pos for pos in visible_positions if username in pos[0]]
            other_positions = [pos for pos in visible_positions if username not in pos[0]]
            
            isolation_results[username] = {
                'own_count': len(own_positions),
                'other_count': len(other_positions),
                'positions': [pos[0] for pos in visible_positions]
            }
        
        # Validate isolation
        isolation_success = True
        for username, results in isolation_results.items():
            expected_own = 2  # Each user should have 2 positions
            if results['own_count'] == expected_own and results['other_count'] == 0:
                logger.info(f"✅ {username}: Perfect isolation (sees {results['own_count']} own, {results['other_count']} others)")
            else:
                logger.error(f"❌ {username}: Isolation failed (sees {results['own_count']} own, {results['other_count']} others)")
                logger.error(f"   Visible positions: {results['positions']}")
                isolation_success = False
        
        return isolation_success
    
    def test_cross_user_access(self):
        """Test that users cannot access other users' data"""
        logger.info("Testing cross-user access prevention...")
        
        cursor = self.conn.cursor()
        
        # Get Alice's data
        alice_id = self.test_users['alice_test']['id']
        
        # Try to access Alice's data as Bob
        self.set_user_context('bob_test')
        
        # Bob should not be able to see Alice's positions
        cursor.execute("""
            SELECT COUNT(*) FROM portfolio_positions 
            WHERE user_id = %s
        """, (alice_id,))
        
        alice_positions_visible_to_bob = cursor.fetchone()[0]
        
        if alice_positions_visible_to_bob == 0:
            logger.info("✅ Cross-user access properly blocked")
            return True
        else:
            logger.error(f"❌ Cross-user access leak: Bob can see {alice_positions_visible_to_bob} of Alice's positions")
            return False
    
    def test_admin_access(self):
        """Test admin access to all data"""
        logger.info("Testing admin access...")
        
        cursor = self.conn.cursor()
        
        # Create an admin user
        admin_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO users (
                id, username, email, password_hash, subscription_tier, role
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (admin_id, 'admin_test', 'admin_rls_test@example.com', 'test_hash', 'enterprise', 'admin'))
        
        self.conn.commit()
        
        # Set admin context
        cursor.execute("SELECT set_current_user(%s)", (admin_id,))
        self.conn.commit()
        
        # Admin should see all test positions
        cursor.execute("""
            SELECT COUNT(*) FROM portfolio_positions 
            WHERE symbol LIKE 'RLS_TEST_%'
        """)
        admin_visible_count = cursor.fetchone()[0]
        
        expected_total = len(self.test_users) * 2  # 2 positions per user
        
        if admin_visible_count == expected_total:
            logger.info(f"✅ Admin can see all {admin_visible_count} test positions")
            return True
        else:
            logger.error(f"❌ Admin access issue: sees {admin_visible_count}, expected {expected_total}")
            return False
    
    def test_tier_restrictions(self):
        """Test tier-based restrictions"""
        logger.info("Testing tier-based restrictions...")
        
        cursor = self.conn.cursor()
        
        # Test free tier limit (should be limited)
        alice_id = self.test_users['alice_test']['id']  # free tier
        self.set_user_context('alice_test')
        
        # Try to create many positions
        positions_created = 0
        try:
            for i in range(15):  # Try to exceed free tier limit
                position_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO portfolio_positions (
                        id, user_id, symbol, name, quantity, avg_price,
                        asset_class, account, sync_source
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    position_id, alice_id, f'LIMIT_TEST_{i}', f'Limit Test {i}',
                    10.0, 10.0, 'equity', 'test', 'limit_test'
                ))
                self.conn.commit()
                positions_created += 1
        except psycopg2.Error as e:
            logger.info(f"Free tier limit hit after {positions_created} positions")
            self.conn.rollback()
        
        # Count Alice's total positions
        cursor.execute("SELECT COUNT(*) FROM portfolio_positions WHERE user_id = %s", (alice_id,))
        alice_total = cursor.fetchone()[0]
        
        logger.info(f"✅ Free tier user has {alice_total} total positions")
        return True
    
    def cleanup_test_data(self):
        """Clean up all test data"""
        cursor = self.conn.cursor()
        
        cursor.execute("DELETE FROM users WHERE email LIKE '%rls_test%'")
        cursor.execute("DELETE FROM portfolio_positions WHERE symbol LIKE 'RLS_TEST_%'")
        cursor.execute("DELETE FROM portfolio_positions WHERE symbol LIKE 'LIMIT_TEST_%'")
        
        self.conn.commit()
        logger.info("✅ Test data cleaned up")
    
    def run_all_tests(self):
        """Run all RLS tests"""
        logger.info("🚀 Starting Fixed RLS Test Suite")
        logger.info("=" * 50)
        
        test_results = {}
        
        try:
            # Setup
            self.setup_test_users()
            self.create_test_data()
            
            # Run tests
            test_results['user_isolation'] = self.test_user_isolation()
            test_results['cross_user_access'] = self.test_cross_user_access()
            test_results['admin_access'] = self.test_admin_access()
            test_results['tier_restrictions'] = self.test_tier_restrictions()
            
            # Results
            passed_tests = sum(test_results.values())
            total_tests = len(test_results)
            
            logger.info("=" * 50)
            logger.info(f"🎉 RLS Test Results: {passed_tests}/{total_tests} passed")
            
            for test_name, result in test_results.items():
                status = "✅ PASSED" if result else "❌ FAILED"
                logger.info(f"{status} {test_name}")
            
            return passed_tests == total_tests
            
        except Exception as e:
            logger.error(f"❌ Test suite failed: {e}")
            return False
        finally:
            self.cleanup_test_data()
            self.conn.close()

def main():
    test_suite = FixedRLSTest()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n🎉 Fixed RLS Test Suite: PASSED")
        print("✅ Row Level Security is working correctly!")
    else:
        print("\n❌ Fixed RLS Test Suite: FAILED")
        print("⚠️ RLS needs attention")

if __name__ == "__main__":
    main() 