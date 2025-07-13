#!/usr/bin/env python3
"""
Simple Data Migration from SQLite to PostgreSQL
Direct migration with proper type handling
"""

import sqlite3
import psycopg2
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleMigrator:
    def __init__(self):
        self.sqlite_conn = sqlite3.connect('prisma/dev.db')
        self.sqlite_conn.row_factory = sqlite3.Row
        
        self.postgres_conn = psycopg2.connect(
            host='localhost',
            port='5432',
            database='stackmotive',
            user='stackmotive',
            password='stackmotive123'
        )
        self.postgres_conn.autocommit = False
        
        self.id_mapping = {}
    
    def generate_uuid(self, table: str, old_id: int) -> str:
        """Generate consistent UUID for old integer ID"""
        key = f"{table}:{old_id}"
        if key not in self.id_mapping:
            self.id_mapping[key] = str(uuid.uuid4())
        return self.id_mapping[key]
    
    def safe_timestamp(self, ts_val):
        """Convert SQLite timestamp to PostgreSQL timestamp"""
        if not ts_val:
            return None
        
        try:
            # SQLite stores as Unix timestamp in milliseconds
            if isinstance(ts_val, (int, float)):
                return datetime.fromtimestamp(ts_val / 1000.0).isoformat()
            
            # If it's already a string, try to parse it
            if isinstance(ts_val, str):
                if ts_val.isdigit():
                    return datetime.fromtimestamp(int(ts_val) / 1000.0).isoformat()
                return ts_val
            
            return None
        except (ValueError, OSError):
            return None
    
    def safe_bool(self, bool_val):
        """Convert SQLite boolean to PostgreSQL boolean"""
        if bool_val is None:
            return False
        return bool(bool_val)
    
    def migrate_users(self):
        """Migrate users table"""
        logger.info("Migrating users...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        # Clear existing data
        postgres_cursor.execute("DELETE FROM users;")
        
        # Get all users
        sqlite_cursor.execute("SELECT * FROM User")
        users = sqlite_cursor.fetchall()
        
        for user in users:
            user_uuid = self.generate_uuid('User', user['id'])
            
            postgres_cursor.execute("""
                INSERT INTO users (
                    id, username, email, password_hash, full_name, created_at, last_login,
                    stripe_customer_id, stripe_subscription_id, subscription_tier,
                    two_factor_enabled, two_factor_secret, role, trial_started_at, trial_ends_at,
                    onboarding_complete, onboarding_step, tax_residency, secondary_tax_residency,
                    tax_identification_number, tax_file_number, tax_registered_business, tax_year
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                user_uuid,
                user['username'],
                user['email'],
                user['password'],
                user['fullName'],
                self.safe_timestamp(user['createdAt']),
                self.safe_timestamp(user['lastLogin']),
                user['stripeCustomerId'],
                user['stripeSubscriptionId'],
                user['subscriptionTier'],
                self.safe_bool(user['twoFactorEnabled']),
                user['twoFactorSecret'],
                user['role'],
                self.safe_timestamp(user['trialStartedAt']),
                self.safe_timestamp(user['trialEndsAt']),
                self.safe_bool(user['onboardingComplete']),
                user['onboardingStep'],
                user['taxResidency'],
                user['secondaryTaxResidency'],
                user['taxIdentificationNumber'],
                user['taxFileNumber'],
                self.safe_bool(user['taxRegisteredBusiness']),
                user['taxYear']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(users)} users")
    
    def migrate_portfolio_positions(self):
        """Migrate portfolio positions"""
        logger.info("Migrating portfolio positions...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        # Clear existing data
        postgres_cursor.execute("DELETE FROM portfolio_positions;")
        
        # Get all positions
        sqlite_cursor.execute("SELECT * FROM PortfolioPosition")
        positions = sqlite_cursor.fetchall()
        
        for position in positions:
            position_uuid = self.generate_uuid('PortfolioPosition', position['id'])
            user_uuid = self.generate_uuid('User', position['userId'])
            
            postgres_cursor.execute("""
                INSERT INTO portfolio_positions (
                    id, user_id, symbol, name, quantity, avg_price, current_price,
                    asset_class, account, currency, last_updated, sync_source, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                position_uuid,
                user_uuid,
                position['symbol'],
                position['name'],
                position['quantity'],
                position['avgPrice'],
                position['currentPrice'],
                position['assetClass'],
                position['account'],
                position['currency'],
                self.safe_timestamp(position['lastUpdated']),
                position['syncSource'],
                self.safe_timestamp(position['createdAt'])
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(positions)} portfolio positions")
    
    def migrate_agent_memory(self):
        """Migrate agent memory"""
        logger.info("Migrating agent memory...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        # Clear existing data
        postgres_cursor.execute("DELETE FROM agent_memory;")
        
        # Get all memory records
        sqlite_cursor.execute("SELECT * FROM AgentMemory")
        memories = sqlite_cursor.fetchall()
        
        for memory in memories:
            memory_uuid = self.generate_uuid('AgentMemory', memory['id'])
            user_uuid = self.generate_uuid('User', memory['userId'])
            
            # Parse metadata
            metadata = None
            if memory['metadata']:
                try:
                    metadata = json.loads(memory['metadata'])
                except json.JSONDecodeError:
                    metadata = {"raw": memory['metadata']}
            
            postgres_cursor.execute("""
                INSERT INTO agent_memory (
                    id, user_id, block_id, action, context, user_input,
                    agent_response, metadata, timestamp, session_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                memory_uuid,
                user_uuid,
                memory['blockId'],
                memory['action'],
                memory['context'],
                memory['userInput'],
                memory['agentResponse'],
                json.dumps(metadata) if metadata else None,
                self.safe_timestamp(memory['timestamp']),
                memory['sessionId']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(memories)} agent memory records")
    
    def verify_migration(self):
        """Verify the migration"""
        logger.info("Verifying migration...")
        
        postgres_cursor = self.postgres_conn.cursor()
        
        # Check table counts
        tables = ['users', 'portfolio_positions', 'agent_memory']
        for table in tables:
            postgres_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = postgres_cursor.fetchone()[0]
            logger.info(f"✓ {table}: {count} records")
        
        # Check a sample user
        postgres_cursor.execute("SELECT username, email FROM users LIMIT 3")
        users = postgres_cursor.fetchall()
        logger.info(f"Sample users: {users}")
    
    def run_migration(self):
        """Run the migration"""
        logger.info("Starting simple data migration...")
        
        try:
            self.migrate_users()
            self.migrate_portfolio_positions()
            self.migrate_agent_memory()
            self.verify_migration()
            
            logger.info("Migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            self.postgres_conn.rollback()
            raise
        finally:
            self.sqlite_conn.close()
            self.postgres_conn.close()

def main():
    migrator = SimpleMigrator()
    migrator.run_migration()

if __name__ == "__main__":
    main() 