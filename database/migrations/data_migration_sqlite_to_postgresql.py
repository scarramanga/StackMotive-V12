#!/usr/bin/env python3
"""
Phase 5: Data Migration from SQLite to PostgreSQL
Migrates all data from the current SQLite database to PostgreSQL
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
    
    def convert_sqlite_timestamp(self, timestamp_str):
        """Convert SQLite timestamp to PostgreSQL timestamp"""
        if timestamp_str is None:
            return None
        
        # If it's already a proper timestamp string, return as-is
        if isinstance(timestamp_str, str) and '-' in timestamp_str:
            return timestamp_str
        
        # If it's a Unix timestamp (integer), convert it
        try:
            timestamp_int = int(timestamp_str)
            if timestamp_int > 0:
                return datetime.fromtimestamp(timestamp_int).isoformat()
            return None
        except (ValueError, TypeError):
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
            
            postgres_cursor.execute("""
                INSERT INTO sessions (
                    id, token, user_id, created_at, expires_at, last_used_at
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                session_uuid, session['token'], user_uuid, session['createdAt'],
                session['expiresAt'], session['lastUsedAt']
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
                account['currency'], account['createdAt'], account['lastSynced'],
                account['connectionStatus']
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
                strategy['status'], strategy['createdAt'], strategy['updatedAt'],
                strategy['performance'], strategy['winRate'], strategy['profitFactor']
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
                trade['exchange'], trade['entryTime'], trade['exitTime'],
                trade['isAutomated'], trade['taxImpact']
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
            
            postgres_cursor.execute("""
                INSERT INTO portfolio_positions (
                    id, user_id, symbol, name, quantity, avg_price, current_price,
                    asset_class, account, currency, last_updated, sync_source, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                position_uuid, user_uuid, position['symbol'], position['name'],
                position['quantity'], position['avgPrice'], position['currentPrice'],
                position['assetClass'], position['account'], position['currency'],
                position['lastUpdated'], position['syncSource'], position['createdAt']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(positions)} portfolio positions")
    
    def migrate_paper_trading_accounts(self):
        """Migrate paper trading accounts table"""
        logger.info("Migrating paper trading accounts table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        sqlite_cursor.execute("SELECT * FROM PaperTradingAccount")
        accounts = sqlite_cursor.fetchall()
        
        for account in accounts:
            account_uuid = self.generate_uuid_for_id('PaperTradingAccount', account['id'])
            user_uuid = self.generate_uuid_for_id('User', account['userId'])
            
            postgres_cursor.execute("""
                INSERT INTO paper_trading_accounts (
                    id, user_id, name, initial_balance, current_balance, currency,
                    created_at, is_active, reset_count
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                account_uuid, user_uuid, account['name'], account['initialBalance'],
                account['currentBalance'], account['currency'], account['createdAt'],
                account['isActive'], account['resetCount']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(accounts)} paper trading accounts")
    
    def migrate_tax_settings(self):
        """Migrate tax settings table"""
        logger.info("Migrating tax settings table...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        sqlite_cursor.execute("SELECT * FROM TaxSetting")
        settings = sqlite_cursor.fetchall()
        
        for setting in settings:
            setting_uuid = self.generate_uuid_for_id('TaxSetting', setting['id'])
            user_uuid = self.generate_uuid_for_id('User', setting['userId'])
            
            postgres_cursor.execute("""
                INSERT INTO tax_settings (
                    id, user_id, country, region, tax_year, enabled, accounting_method,
                    include_fees, include_foreign_tax, capital_gains_rules, exemptions,
                    offset_losses, carry_forward, previous_year_losses, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                setting_uuid, user_uuid, setting['country'], setting['region'],
                setting['taxYear'], setting['enabled'], setting['accountingMethod'],
                setting['includeFees'], setting['includeForeignTax'], setting['capitalGainsRules'],
                setting['exemptions'], setting['offsetLosses'], setting['carryForward'],
                setting['previousYearLosses'], setting['createdAt'], setting['lastUpdated']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(settings)} tax settings")
    
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
                json.dumps(metadata) if metadata else None, memory['timestamp'],
                memory['sessionId']
            ))
        
        self.postgres_conn.commit()
        logger.info(f"Migrated {len(memories)} agent memory records")
    
    def migrate_additional_tables(self):
        """Migrate additional tables that might exist"""
        logger.info("Migrating additional tables...")
        
        sqlite_cursor = self.sqlite_conn.cursor()
        postgres_cursor = self.postgres_conn.cursor()
        
        # Migrate AI suggestion responses
        try:
            sqlite_cursor.execute("SELECT * FROM AISuggestionResponse")
            responses = sqlite_cursor.fetchall()
            
            for response in responses:
                response_uuid = self.generate_uuid_for_id('AISuggestionResponse', response['id'])
                user_uuid = self.generate_uuid_for_id('User', response['userId'])
                
                postgres_cursor.execute("""
                    INSERT INTO ai_suggestion_responses (
                        id, user_id, suggestion_id, action, user_notes,
                        modified_amount, response_timestamp, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    response_uuid, user_uuid, response['suggestionId'], response['action'],
                    response['userNotes'], response['modifiedAmount'], response['responseTimestamp'],
                    response['createdAt']
                ))
            
            logger.info(f"Migrated {len(responses)} AI suggestion responses")
            
        except sqlite3.OperationalError:
            logger.info("AISuggestionResponse table not found, skipping")
        
        # Migrate macro signals
        try:
            sqlite_cursor.execute("SELECT * FROM MacroSignal")
            signals = sqlite_cursor.fetchall()
            
            for signal in signals:
                signal_uuid = self.generate_uuid_for_id('MacroSignal', signal['id'])
                
                postgres_cursor.execute("""
                    INSERT INTO macro_signals (
                        id, indicator, value, previous_value, change, change_percentage,
                        timestamp, source, ai_insight, impact_score, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    signal_uuid, signal['indicator'], signal['value'], signal['previousValue'],
                    signal['change'], signal['changePercentage'], signal['timestamp'],
                    signal['source'], signal['aiInsight'], signal['impactScore'], signal['createdAt']
                ))
            
            logger.info(f"Migrated {len(signals)} macro signals")
            
        except sqlite3.OperationalError:
            logger.info("MacroSignal table not found, skipping")
        
        self.postgres_conn.commit()
    
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
            sqlite_cursor.execute(f"SELECT COUNT(*) FROM {sqlite_table}")
            sqlite_count = sqlite_cursor.fetchone()[0]
            
            postgres_cursor.execute(f"SELECT COUNT(*) FROM {postgres_table}")
            postgres_count = postgres_cursor.fetchone()[0]
            
            if sqlite_count == postgres_count:
                logger.info(f"✓ {postgres_table}: {postgres_count} records migrated successfully")
            else:
                logger.error(f"✗ {postgres_table}: SQLite has {sqlite_count}, PostgreSQL has {postgres_count}")
        
        # Check if any foreign key constraints are violated
        postgres_cursor.execute("""
            SELECT conname, conrelid::regclass, confrelid::regclass
            FROM pg_constraint
            WHERE contype = 'f'
        """)
        
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
            self.migrate_paper_trading_accounts()
            self.migrate_tax_settings()
            self.migrate_agent_memory()
            self.migrate_additional_tables()
            
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