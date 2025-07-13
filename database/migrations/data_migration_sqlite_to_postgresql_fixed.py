#!/usr/bin/env python3
"""
Phase 5: Fixed Data Migration from SQLite to PostgreSQL
Migrates all data from the current SQLite database to PostgreSQL with proper timestamp handling
"""

import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import os
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self, sqlite_path: str, postgres_config: Dict[str, str]):
        self.sqlite_path = sqlite_path
        self.postgres_config = postgres_config
        self.sqlite_conn = None
        self.postgres_conn = None
        self.id_mapping = {}  # Maps SQLite integer IDs to PostgreSQL UUIDs
        
    def connect_databases(self):
        """Connect to both SQLite and PostgreSQL databases"""
        try:
            # Connect to SQLite
            self.sqlite_conn = sqlite3.connect(self.sqlite_path)
            self.sqlite_conn.row_factory = sqlite3.Row
            logger.info(f"Connected to SQLite database: {self.sqlite_path}")
            
            # Connect to PostgreSQL
            self.postgres_conn = psycopg2.connect(**self.postgres_config)
            self.postgres_conn.autocommit = False
            logger.info("Connected to PostgreSQL database")
            
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def close_connections(self):
        """Close database connections"""
        if self.sqlite_conn:
            self.sqlite_conn.close()
        if self.postgres_conn:
            self.postgres_conn.close()
    
    def generate_uuid_for_id(self, table_name: str, old_id: int) -> str:
        """Generate consistent UUID for SQLite integer ID"""
        key = f"{table_name}:{old_id}"
        if key not in self.id_mapping:
            self.id_mapping[key] = str(uuid.uuid4())
        return self.id_mapping[key]
    
    def convert_sqlite_timestamp(self, timestamp_value):
        """Convert SQLite timestamp to PostgreSQL timestamp"""
        if timestamp_value is None:
            return None
        
        # If it's already a proper timestamp string, return as-is
        if isinstance(timestamp_value, str) and '-' in timestamp_value:
            return timestamp_value
        
        # If it's a Unix timestamp (integer), convert it
        try:
            if isinstance(timestamp_value, (int, float)):
                return datetime.fromtimestamp(timestamp_value).isoformat()
            
            # Try to parse as integer from string
            timestamp_int = int(timestamp_value)
            if timestamp_int > 0:
                return datetime.fromtimestamp(timestamp_int).isoformat()
            return None
        except (ValueError, TypeError, OSError):
            return None
    
    def migrate_users(self):
        """Migrate users table"""
        logger.info("Migrating users table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        # Fetch all users from SQLite
        sqlite_cursor.execute("SELECT * FROM User")
        users = sqlite_cursor.fetchall()
        
        for user in users:
            user_uuid = self.generate_uuid_for_id('User', user['id'])
            
            # Convert timestamps
            created_at = self.convert_sqlite_timestamp(user['createdAt'])
            last_login = self.convert_sqlite_timestamp(user['lastLogin'])
            trial_started_at = self.convert_sqlite_timestamp(user['trialStartedAt'])
            trial_ends_at = self.convert_sqlite_timestamp(user['trialEndsAt'])
            
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
                user_uuid, user['username'], user['email'], user['password'], user['fullName'],
                created_at, last_login, user['stripeCustomerId'], user['stripeSubscriptionId'],
                user['subscriptionTier'], user['twoFactorEnabled'], user['twoFactorSecret'],
                user['role'], trial_started_at, trial_ends_at, user['onboardingComplete'],
                user['onboardingStep'], user['taxResidency'], user['secondaryTaxResidency'],
                user['taxIdentificationNumber'], user['taxFileNumber'], user['taxRegisteredBusiness'],
                user['taxYear']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(users)} users")
    
    def migrate_sessions(self):
        """Migrate sessions table"""
        logger.info("Migrating sessions table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        sqlite_cursor.execute("SELECT * FROM Session")
        sessions = sqlite_cursor.fetchall()
        
        for session in sessions:
            session_uuid = self.generate_uuid_for_id('Session', session['id'])
            user_uuid = self.generate_uuid_for_id('User', session['userId'])
            
            # Convert timestamps
            created_at = self.convert_sqlite_timestamp(session['createdAt'])
            expires_at = self.convert_sqlite_timestamp(session['expiresAt'])
            last_used_at = self.convert_sqlite_timestamp(session['lastUsedAt'])
            
            postgres_cursor.execute("""
                INSERT INTO sessions (
                    id, token, user_id, created_at, expires_at, last_used_at
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                session_uuid, session['token'], user_uuid, created_at, expires_at, last_used_at
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(sessions)} sessions")
    
    def migrate_trading_accounts(self):
        """Migrate trading accounts table"""
        logger.info("Migrating trading accounts table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        sqlite_cursor.execute("SELECT * FROM TradingAccount")
        accounts = sqlite_cursor.fetchall()
        
        for account in accounts:
            account_uuid = self.generate_uuid_for_id('TradingAccount', account['id'])
            user_uuid = self.generate_uuid_for_id('User', account['userId'])
            
            # Convert timestamps
            created_at = self.convert_sqlite_timestamp(account['createdAt'])
            last_synced = self.convert_sqlite_timestamp(account['lastSynced'])
            
            postgres_cursor.execute("""
                INSERT INTO trading_accounts (
                    id, user_id, name, broker, api_key, api_secret, api_passphrase,
                    account_number, is_active, balance, currency, created_at,
                    last_synced, connection_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                account_uuid, user_uuid, account['name'], account['broker'],
                account['apiKey'], account['apiSecret'], account['apiPassphrase'],
                account['accountNumber'], account['isActive'], account['balance'],
                account['currency'], created_at, last_synced, account['connectionStatus']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(accounts)} trading accounts")
    
    def migrate_strategies(self):
        """Migrate strategies table"""
        logger.info("Migrating strategies table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        sqlite_cursor.execute("SELECT * FROM Strategy")
        strategies = sqlite_cursor.fetchall()
        
        for strategy in strategies:
            strategy_uuid = self.generate_uuid_for_id('Strategy', strategy['id'])
            user_uuid = self.generate_uuid_for_id('User', strategy['userId'])
            account_uuid = self.generate_uuid_for_id('TradingAccount', strategy['accountId']) if strategy['accountId'] else None
            
            # Convert timestamps
            created_at = self.convert_sqlite_timestamp(strategy['createdAt'])
            updated_at = self.convert_sqlite_timestamp(strategy['updatedAt'])
            
            postgres_cursor.execute("""
                INSERT INTO strategies (
                    id, user_id, account_id, name, description, symbol, exchange,
                    indicators, entry_conditions, exit_conditions, risk_percentage,
                    status, created_at, updated_at, performance, win_rate, profit_factor
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                strategy_uuid, user_uuid, account_uuid, strategy['name'], strategy['description'],
                strategy['symbol'], strategy['exchange'], strategy['indicators'],
                strategy['entryConditions'], strategy['exitConditions'], strategy['riskPercentage'],
                strategy['status'], created_at, updated_at, strategy['performance'],
                strategy['winRate'], strategy['profitFactor']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(strategies)} strategies")
    
    def migrate_trades(self):
        """Migrate trades table"""
        logger.info("Migrating trades table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        sqlite_cursor.execute("SELECT * FROM Trade")
        trades = sqlite_cursor.fetchall()
        
        for trade in trades:
            trade_uuid = self.generate_uuid_for_id('Trade', trade['id'])
            user_uuid = self.generate_uuid_for_id('User', trade['userId'])
            strategy_uuid = self.generate_uuid_for_id('Strategy', trade['strategyId']) if trade['strategyId'] else None
            account_uuid = self.generate_uuid_for_id('TradingAccount', trade['accountId']) if trade['accountId'] else None
            
            # Convert timestamps
            entry_time = self.convert_sqlite_timestamp(trade['entryTime'])
            exit_time = self.convert_sqlite_timestamp(trade['exitTime'])
            
            postgres_cursor.execute("""
                INSERT INTO trades (
                    id, user_id, strategy_id, account_id, symbol, trade_type,
                    entry_price, exit_price, quantity, status, profit_loss,
                    profit_loss_percentage, exchange, entry_time, exit_time,
                    is_automated, tax_impact
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                trade_uuid, user_uuid, strategy_uuid, account_uuid, trade['symbol'],
                trade['type'], trade['entryPrice'], trade['exitPrice'], trade['amount'],
                trade['status'], trade['profitLoss'], trade['profitLossPercentage'],
                trade['exchange'], entry_time, exit_time, trade['isAutomated'], trade['taxImpact']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(trades)} trades")
    
    def migrate_portfolio_positions(self):
        """Migrate portfolio positions table"""
        logger.info("Migrating portfolio positions table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        sqlite_cursor.execute("SELECT * FROM PortfolioPosition")
        positions = sqlite_cursor.fetchall()
        
        for position in positions:
            position_uuid = self.generate_uuid_for_id('PortfolioPosition', position['id'])
            user_uuid = self.generate_uuid_for_id('User', position['userId'])
            
            # Convert timestamps
            last_updated = self.convert_sqlite_timestamp(position['lastUpdated'])
            created_at = self.convert_sqlite_timestamp(position['createdAt'])
            
            postgres_cursor.execute("""
                INSERT INTO portfolio_positions (
                    id, user_id, symbol, name, quantity, avg_price, current_price,
                    asset_class, account, currency, last_updated, sync_source, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                position_uuid, user_uuid, position['symbol'], position['name'],
                position['quantity'], position['avgPrice'], position['currentPrice'],
                position['assetClass'], position['account'], position['currency'],
                last_updated, position['syncSource'], created_at
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(positions)} portfolio positions")
    
    def migrate_agent_memory(self):
        """Migrate agent memory table"""
        logger.info("Migrating agent memory table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        sqlite_cursor.execute("SELECT * FROM AgentMemory")
        memories = sqlite_cursor.fetchall()
        
        for memory in memories:
            memory_uuid = self.generate_uuid_for_id('AgentMemory', memory['id'])
            user_uuid = self.generate_uuid_for_id('User', memory['userId'])
            
            # Convert timestamp
            timestamp = self.convert_sqlite_timestamp(memory['timestamp'])
            
            # Parse metadata JSON if it exists
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
                memory_uuid, user_uuid, memory['blockId'], memory['action'],
                memory['context'], memory['userInput'], memory['agentResponse'],
                json.dumps(metadata) if metadata else None, timestamp, memory['sessionId']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(memories)} agent memory records")
    
    def verify_migration(self):
        """Verify migration was successful"""
        logger.info("Verifying migration...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        # Check key tables
        tables_to_check = [
            ('User', 'users'),
            ('Session', 'sessions'),
            ('TradingAccount', 'trading_accounts'),
            ('Strategy', 'strategies'),
            ('Trade', 'trades'),
            ('PortfolioPosition', 'portfolio_positions'),
            ('AgentMemory', 'agent_memory')
        ]
        
        for sqlite_table, postgres_table in tables_to_check:
            try:
                sqlite_cursor.execute(f"SELECT COUNT(*) FROM {sqlite_table}")
                sqlite_count = sqlite_cursor.fetchone()[0]
                
                postgres_cursor.execute(f"SELECT COUNT(*) FROM {postgres_table}")
                postgres_count = postgres_cursor.fetchone()[0]
                
                if sqlite_count == postgres_count:
                    logger.info(f"✓ {postgres_table}: {postgres_count} records migrated successfully")
                else:
                    logger.error(f"✗ {postgres_table}: SQLite has {sqlite_count}, PostgreSQL has {postgres_count}")
            except Exception as e:
                logger.warning(f"Could not verify {sqlite_table}: {e}")
        
        logger.info("Migration verification complete")
    
    def run_migration(self):
        """Run the complete migration process"""
        logger.info("Starting database migration from SQLite to PostgreSQL...")
        
        try:
            self.connect_databases()
            
            # Migrate tables in dependency order
            self.migrate_users()
            self.migrate_sessions()
            self.migrate_trading_accounts()
            self.migrate_strategies()
            self.migrate_trades()
            self.migrate_portfolio_positions()
            self.migrate_agent_memory()
            
            # Verify migration
            self.verify_migration()
            
            logger.info("Migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            if self.postgres_conn:
                self.postgres_conn.rollback()
            raise
        finally:
            self.close_connections()

def main():
    """Main migration function"""
    # Configuration
    sqlite_path = "prisma/dev.db"
    postgres_config = {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": os.getenv("POSTGRES_PORT", "5432"),
        "database": os.getenv("POSTGRES_DB", "stackmotive"),
        "user": os.getenv("POSTGRES_USER", "stackmotive"),
        "password": os.getenv("POSTGRES_PASSWORD", "stackmotive123")
    }
    
    # Run migration
    migrator = DatabaseMigrator(sqlite_path, postgres_config)
    migrator.run_migration()

if __name__ == "__main__":
    main() 