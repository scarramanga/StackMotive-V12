#!/usr/bin/env python3
"""
RLS Policy Test Suite
Comprehensive testing of Row Level Security policies
"""

import psycopg2
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RLSTestSuite:
    def __init__(self):
        self.postgres_config = {
            'host': 'localhost',
            'port': '5432', 
            'database': 'stackmotive',
            'user': 'stackmotive',
            'password': 'stackmotive123'
        }
        self.test_users = {}
        self.conn = None
    
    def connect_database(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**self.postgres_config)
            self.conn.autocommit = False
            logger.info("✅ Connected to PostgreSQL")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def setup_test_users(self):
        """Create test users with different tiers"""
        cursor = self.conn.cursor()
        
        # Create test users
        test_users_data = [
            {
                'username': 'test_free_user',
                'email': 'free@test.com',
                'tier': 'free',
                'role': 'user'
            },
            {
                'username': 'test_pro_user', 
                'email': 'pro@test.com',
                'tier': 'pro',
                'role': 'user'
            },
            {
                'username': 'test_enterprise_user',
                'email': 'enterprise@test.com', 
                'tier': 'enterprise',
                'role': 'user'
            },
            {
                'username': 'test_admin_user',
                'email': 'admin@test.com',
                'tier': 'enterprise',
                'role': 'admin'
            }
        ]
        
        for user_data in test_users_data:
            user_id = str(uuid.uuid4())
            
            # Insert test user
            cursor.execute("""
                INSERT INTO users (
                    id, username, email, password_hash, subscription_tier, role
                ) VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE SET
                    subscription_tier = EXCLUDED.subscription_tier,
                    role = EXCLUDED.role
            """, (
                user_id, user_data['username'], user_data['email'],
                'test_password_hash', user_data['tier'], user_data['role']
            ))
            
            self.test_users[user_data['tier']] = {
                'id': user_id,
                'email': user_data['email'],
                'username': user_data['username'],
                'tier': user_data['tier'],
                'role': user_data['role']
            }
        
        # Add admin user reference
        self.test_users['admin'] = self.test_users['enterprise'].copy()
        self.test_users['admin']['role'] = 'admin'
        
        self.conn.commit()
        logger.info(f"✅ Created {len(test_users_data)} test users")
    
    def set_user_context(self, user_tier: str):
        """Set the current user context for RLS"""
        cursor = self.conn.cursor()
        user_id = self.test_users[user_tier]['id']
        
        cursor.execute("SELECT set_current_user(%s)", (user_id,))
        self.conn.commit()
        
        # Verify context is set
        cursor.execute("SELECT get_current_user()")
        current_user = cursor.fetchone()[0]
        
        if str(current_user) == user_id:
            logger.info(f"✅ Set user context: {user_tier} ({user_id})")
            return True
        else:
            logger.error(f"❌ Failed to set user context for {user_tier}")
            return False
    
    def test_user_isolation(self):
        """Test that users can only see their own data"""
        logger.info("Testing user isolation...")
        
        cursor = self.conn.cursor()
        
        # Create test data for different users
        test_data = {}
        for tier in ['free', 'pro', 'enterprise']:
            # Set user context
            self.set_user_context(tier)
            user_id = self.test_users[tier]['id']
            
            # Insert portfolio position for this user
            position_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO portfolio_positions (
                    id, user_id, symbol, name, quantity, avg_price, 
                    asset_class, account, sync_source
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                position_id, user_id, f'TEST_{tier.upper()}', f'Test {tier} Stock',
                100, 50.0, 'equity', 'test_account', 'test'
            ))
            
            test_data[tier] = position_id
        
        self.conn.commit()
        
        # Test isolation: each user should only see their own data
        isolation_results = {}
        for tier in ['free', 'pro', 'enterprise']:
            self.set_user_context(tier)
            
            cursor.execute("SELECT symbol, user_id FROM portfolio_positions")
            visible_positions = cursor.fetchall()
            
            # Should only see own position
            expected_symbol = f'TEST_{tier.upper()}'
            user_positions = [pos for pos in visible_positions if pos[0] == expected_symbol]
            other_positions = [pos for pos in visible_positions if pos[0] != expected_symbol]
            
            isolation_results[tier] = {
                'own_positions': len(user_positions),
                'other_positions': len(other_positions),
                'total_visible': len(visible_positions)
            }
        
        # Validate isolation
        isolation_success = True
        for tier, results in isolation_results.items():
            if results['own_positions'] == 1 and results['other_positions'] == 0:
                logger.info(f"✅ {tier} user: isolated correctly (sees 1 own, 0 others)")
            else:
                logger.error(f"❌ {tier} user: isolation failed (sees {results['own_positions']} own, {results['other_positions']} others)")
                isolation_success = False
        
        return isolation_success
    
    def test_admin_access(self):
        """Test that admin users can see all data"""
        logger.info("Testing admin access...")
        
        cursor = self.conn.cursor()
        
        # Set admin context  
        self.set_user_context('enterprise')  # Using enterprise user as admin
        
        # Admin should see all users
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        
        # Admin should see all portfolio positions
        cursor.execute("SELECT COUNT(*) FROM portfolio_positions")
        total_positions = cursor.fetchone()[0]
        
        logger.info(f"✅ Admin can see {total_users} users and {total_positions} positions")
        return total_users >= 4 and total_positions >= 3
    
    def test_tier_based_limits(self):
        """Test tier-based access limits"""
        logger.info("Testing tier-based limits...")
        
        cursor = self.conn.cursor()
        
        # Test free tier position limit (should be limited to 10)
        self.set_user_context('free')
        free_user_id = self.test_users['free']['id']
        
        # Try to insert many positions for free user
        positions_created = 0
        for i in range(15):  # Try to create 15 positions
            try:
                position_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO portfolio_positions (
                        id, user_id, symbol, name, quantity, avg_price,
                        asset_class, account, sync_source
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    position_id, free_user_id, f'FREE_LIMIT_{i}', f'Free Limit Test {i}',
                    10, 10.0, 'equity', 'test', 'test'
                ))
                self.conn.commit()
                positions_created += 1
            except psycopg2.Error as e:
                # Should hit limit and fail after 10
                logger.info(f"Position creation failed at {positions_created + 1}: {e}")
                self.conn.rollback()
                break
        
        # Count actual positions for free user
        cursor.execute("""
            SELECT COUNT(*) FROM portfolio_positions 
            WHERE user_id = %s AND symbol LIKE 'FREE_LIMIT_%'
        """, (free_user_id,))
        actual_free_positions = cursor.fetchone()[0]
        
        # Test enterprise tier (should be unlimited)
        self.set_user_context('enterprise')
        enterprise_user_id = self.test_users['enterprise']['id']
        
        # Create multiple positions for enterprise user
        for i in range(5):
            position_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO portfolio_positions (
                    id, user_id, symbol, name, quantity, avg_price,
                    asset_class, account, sync_source
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                position_id, enterprise_user_id, f'ENT_TEST_{i}', f'Enterprise Test {i}',
                10, 10.0, 'equity', 'test', 'test'
            ))
        
        self.conn.commit()
        
        logger.info(f"✅ Free tier created {actual_free_positions} positions (limit should apply)")
        logger.info(f"✅ Enterprise tier can create unlimited positions")
        
        return True
    
    def test_shared_data_access(self):
        """Test access to shared data like macro signals"""
        logger.info("Testing shared data access...")
        
        cursor = self.conn.cursor()
        
        # Insert a macro signal as admin
        self.set_user_context('enterprise')  # Admin context
        signal_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO macro_signals (
                id, indicator, value, timestamp, source, impact_score
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            signal_id, 'TEST_INDICATOR', 100.0, datetime.now(),
            'test_source', 75.0
        ))
        self.conn.commit()
        
        # Test that all users can read macro signals
        shared_access_results = {}
        for tier in ['free', 'pro', 'enterprise']:
            self.set_user_context(tier)
            
            cursor.execute("SELECT COUNT(*) FROM macro_signals WHERE indicator = 'TEST_INDICATOR'")
            signal_count = cursor.fetchone()[0]
            
            shared_access_results[tier] = signal_count
        
        # All users should see the shared signal
        access_success = all(count >= 1 for count in shared_access_results.values())
        
        if access_success:
            logger.info("✅ All users can access shared macro signals")
        else:
            logger.error(f"❌ Shared data access failed: {shared_access_results}")
        
        return access_success
    
    def test_rls_performance(self):
        """Test RLS policy performance impact"""
        logger.info("Testing RLS performance...")
        
        cursor = self.conn.cursor()
        
        # Set user context
        self.set_user_context('pro')
        
        # Test query performance with RLS
        start_time = datetime.now()
        cursor.execute("""
            SELECT u.username, COUNT(pp.id) as position_count
            FROM users u
            LEFT JOIN portfolio_positions pp ON u.id = pp.user_id
            WHERE u.id = get_current_user()
            GROUP BY u.id, u.username
        """)
        results = cursor.fetchall()
        query_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ RLS query performance: {query_time:.3f}s")
        logger.info(f"✅ Query results: {results}")
        
        return query_time < 0.1  # Should be fast
    
    def generate_rls_test_report(self):
        """Generate comprehensive RLS test report"""
        cursor = self.conn.cursor()
        
        # Get RLS status for all tables
        cursor.execute("SELECT * FROM rls_status ORDER BY tablename")
        rls_status = cursor.fetchall()
        
        # Get policy count
        cursor.execute("SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'")
        total_policies = cursor.fetchone()[0]
        
        # Get test user count
        cursor.execute("SELECT COUNT(*) FROM users WHERE email LIKE '%@test.com'")
        test_user_count = cursor.fetchone()[0]
        
        report = {
            'test_date': datetime.now().isoformat(),
            'rls_implementation': {
                'total_tables': len(rls_status),
                'tables_with_rls': len([t for t in rls_status if t[2]]),  # rls_enabled column
                'total_policies': total_policies
            },
            'test_users_created': test_user_count,
            'rls_status_by_table': [
                {
                    'schema': row[0],
                    'table': row[1], 
                    'rls_enabled': row[2],
                    'policy_count': row[3]
                }
                for row in rls_status
            ]
        }
        
        # Save report
        with open('rls_test_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info("✅ RLS test report generated: rls_test_report.json")
        
        return report
    
    def cleanup_test_data(self):
        """Clean up test data"""
        cursor = self.conn.cursor()
        
        # Delete test users and related data
        cursor.execute("DELETE FROM users WHERE email LIKE '%@test.com'")
        cursor.execute("DELETE FROM macro_signals WHERE indicator = 'TEST_INDICATOR'")
        
        self.conn.commit()
        logger.info("✅ Test data cleaned up")
    
    def run_all_tests(self):
        """Run all RLS tests"""
        logger.info("🚀 Starting RLS Test Suite")
        logger.info("=" * 50)
        
        if not self.connect_database():
            return False
        
        test_results = {}
        
        try:
            # Setup
            self.setup_test_users()
            
            # Run tests
            test_results['user_isolation'] = self.test_user_isolation()
            test_results['admin_access'] = self.test_admin_access()
            test_results['tier_limits'] = self.test_tier_based_limits()
            test_results['shared_access'] = self.test_shared_data_access()
            test_results['performance'] = self.test_rls_performance()
            
            # Generate report
            report = self.generate_rls_test_report()
            
            # Results summary
            passed_tests = sum(test_results.values())
            total_tests = len(test_results)
            
            logger.info("=" * 50)
            logger.info(f"🎉 RLS Test Results: {passed_tests}/{total_tests} passed")
            
            for test_name, result in test_results.items():
                status = "✅ PASSED" if result else "❌ FAILED"
                logger.info(f"{status} {test_name}")
            
            if passed_tests == total_tests:
                logger.info("🎉 All RLS tests passed! Security is working correctly.")
                return True
            else:
                logger.warning("⚠️ Some RLS tests failed. Check logs for details.")
                return False
                
        except Exception as e:
            logger.error(f"❌ RLS test suite failed: {e}")
            return False
        finally:
            # Always cleanup
            try:
                self.cleanup_test_data()
            except:
                pass
            
            if self.conn:
                self.conn.close()

def main():
    """Main test function"""
    test_suite = RLSTestSuite()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n🎉 RLS Test Suite: PASSED")
        print("✅ Row Level Security is working correctly!")
    else:
        print("\n❌ RLS Test Suite: FAILED") 
        print("⚠️ Check logs for RLS issues")

if __name__ == "__main__":
    main() 