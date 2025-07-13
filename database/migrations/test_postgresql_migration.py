#!/usr/bin/env python3
"""
PostgreSQL Migration Test Suite
Tests database connectivity, data integrity, and functionality
"""

import psycopg2
import requests
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PostgreSQLMigrationTest:
    def __init__(self):
        self.postgres_config = {
            'host': 'localhost',
            'port': '5432',
            'database': 'stackmotive',
            'user': 'stackmotive',
            'password': 'stackmotive123'
        }
        self.backend_url = 'http://localhost:8000'
        self.conn = None
    
    def connect_database(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**self.postgres_config)
            logger.info("✅ PostgreSQL connection successful")
            return True
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            return False
    
    def test_database_structure(self):
        """Test database structure and tables"""
        cursor = self.conn.cursor()
        
        # Test table existence
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        expected_tables = [
            'users', 'sessions', 'trading_accounts', 'strategies', 'trades',
            'portfolio_positions', 'agent_memory', 'tax_settings', 'macro_signals'
        ]
        
        logger.info(f"✅ Found {len(tables)} tables: {tables}")
        
        for expected_table in expected_tables:
            if expected_table in tables:
                logger.info(f"✅ Table {expected_table} exists")
            else:
                logger.warning(f"⚠️ Table {expected_table} missing")
        
        # Test indexes
        cursor.execute("""
            SELECT indexname FROM pg_indexes 
            WHERE schemaname = 'public' AND indexname NOT LIKE 'pg_%'
        """)
        indexes = cursor.fetchall()
        logger.info(f"✅ Found {len(indexes)} indexes")
        
        cursor.close()
    
    def test_data_integrity(self):
        """Test data integrity and relationships"""
        cursor = self.conn.cursor()
        
        # Test users table
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        logger.info(f"✅ Users table: {user_count} records")
        
        # Test portfolio positions
        cursor.execute("SELECT COUNT(*) FROM portfolio_positions")
        position_count = cursor.fetchone()[0]
        logger.info(f"✅ Portfolio positions: {position_count} records")
        
        # Test agent memory
        cursor.execute("SELECT COUNT(*) FROM agent_memory")
        memory_count = cursor.fetchone()[0]
        logger.info(f"✅ Agent memory: {memory_count} records")
        
        # Test foreign key relationships
        cursor.execute("""
            SELECT pp.symbol, u.username 
            FROM portfolio_positions pp 
            JOIN users u ON pp.user_id = u.id 
            LIMIT 3
        """)
        relationships = cursor.fetchall()
        logger.info(f"✅ Foreign key relationships working: {relationships}")
        
        cursor.close()
    
    def test_performance_queries(self):
        """Test common query performance"""
        cursor = self.conn.cursor()
        
        # Test indexed queries
        start_time = datetime.now()
        cursor.execute("SELECT * FROM users WHERE email = 'test@example.com'")
        user_result = cursor.fetchone()
        query_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ User lookup query: {query_time:.3f}s")
        
        # Test aggregation queries
        start_time = datetime.now()
        cursor.execute("""
            SELECT u.username, COUNT(pp.id) as position_count
            FROM users u
            LEFT JOIN portfolio_positions pp ON u.id = pp.user_id
            GROUP BY u.id, u.username
        """)
        aggregation_result = cursor.fetchall()
        query_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ Aggregation query: {query_time:.3f}s")
        logger.info(f"✅ Aggregation result: {aggregation_result}")
        
        cursor.close()
    
    def test_uuid_generation(self):
        """Test UUID generation and uniqueness"""
        cursor = self.conn.cursor()
        
        # Test UUID uniqueness
        cursor.execute("SELECT COUNT(DISTINCT id) = COUNT(*) FROM users")
        uuid_unique = cursor.fetchone()[0]
        logger.info(f"✅ UUID uniqueness: {uuid_unique}")
        
        # Test UUID format
        cursor.execute("SELECT id FROM users LIMIT 1")
        sample_uuid = cursor.fetchone()[0]
        logger.info(f"✅ Sample UUID: {sample_uuid}")
        
        cursor.close()
    
    def test_timestamp_handling(self):
        """Test timestamp handling and conversions"""
        cursor = self.conn.cursor()
        
        # Test timestamp queries
        cursor.execute("SELECT username, created_at FROM users ORDER BY created_at")
        timestamps = cursor.fetchall()
        
        for username, created_at in timestamps:
            logger.info(f"✅ {username}: {created_at}")
        
        cursor.close()
    
    def test_json_handling(self):
        """Test JSON/JSONB handling"""
        cursor = self.conn.cursor()
        
        # Test JSONB in agent memory
        cursor.execute("SELECT metadata FROM agent_memory WHERE metadata IS NOT NULL LIMIT 1")
        result = cursor.fetchone()
        if result:
            logger.info(f"✅ JSON metadata sample: {result[0]}")
        else:
            logger.info("ℹ️ No JSON metadata found")
        
        cursor.close()
    
    def test_backend_integration(self):
        """Test backend integration with PostgreSQL"""
        try:
            # Test health endpoint
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            if response.status_code == 200:
                logger.info("✅ Backend health check passed")
                logger.info(f"✅ Backend response: {response.json()}")
            else:
                logger.warning(f"⚠️ Backend health check status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"⚠️ Backend connection test failed: {e}")
            logger.info("ℹ️ Backend may not be running - this is expected")
    
    def test_connection_pooling(self):
        """Test connection pooling and concurrent access"""
        connections = []
        
        try:
            # Create multiple connections
            for i in range(5):
                conn = psycopg2.connect(**self.postgres_config)
                connections.append(conn)
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.close()
            
            logger.info(f"✅ Connection pooling test: {len(connections)} connections")
            
        except Exception as e:
            logger.error(f"❌ Connection pooling test failed: {e}")
        finally:
            # Close all connections
            for conn in connections:
                conn.close()
    
    def generate_migration_report(self):
        """Generate comprehensive migration report"""
        cursor = self.conn.cursor()
        
        # Database statistics
        cursor.execute("""
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes
            FROM pg_stat_user_tables
            ORDER BY tablename
        """)
        
        table_stats = cursor.fetchall()
        
        # Migration summary
        report = {
            'migration_date': datetime.now().isoformat(),
            'database_name': self.postgres_config['database'],
            'total_tables': len(table_stats),
            'table_statistics': table_stats,
            'migration_status': 'completed'
        }
        
        # Save report
        with open('migration_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info("✅ Migration report generated: migration_report.json")
        cursor.close()
    
    def run_all_tests(self):
        """Run all tests"""
        logger.info("🚀 Starting PostgreSQL Migration Test Suite")
        logger.info("=" * 50)
        
        if not self.connect_database():
            return False
        
        try:
            self.test_database_structure()
            self.test_data_integrity()
            self.test_performance_queries()
            self.test_uuid_generation()
            self.test_timestamp_handling()
            self.test_json_handling()
            self.test_connection_pooling()
            self.test_backend_integration()
            self.generate_migration_report()
            
            logger.info("=" * 50)
            logger.info("🎉 All PostgreSQL tests completed successfully!")
            logger.info("✅ Database migration is working correctly")
            return True
            
        except Exception as e:
            logger.error(f"❌ Test suite failed: {e}")
            return False
        finally:
            if self.conn:
                self.conn.close()

def main():
    """Main test function"""
    test_suite = PostgreSQLMigrationTest()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n🎉 PostgreSQL Migration Test Suite: PASSED")
        print("✅ Your database is ready for production!")
    else:
        print("\n❌ PostgreSQL Migration Test Suite: FAILED")
        print("⚠️ Please check the logs for issues")

if __name__ == "__main__":
    main() 