#!/usr/bin/env python3
"""
Migration script to add strategy fields to paper trading tables
"""
import sqlite3
import os

def migrate_database():
    db_path = 'trading_app.db'
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found, creating new database...")
        from server.database import engine, Base
        from server.models.paper_trading import PaperTradingAccount, Trade
        from server.models.user import User
        Base.metadata.create_all(bind=engine)
        print("New database created with strategy fields")
        return
    
    print("Migrating existing database...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add strategy_name column to paper_trading_accounts
        cursor.execute('ALTER TABLE paper_trading_accounts ADD COLUMN strategy_name TEXT')
        print('✅ Added strategy_name column to paper_trading_accounts')
    except Exception as e:
        print(f'⚠️  strategy_name column exists or error: {e}')
    
    try:
        # Add last_strategy_run_at column to paper_trading_accounts
        cursor.execute('ALTER TABLE paper_trading_accounts ADD COLUMN last_strategy_run_at TIMESTAMP')
        print('✅ Added last_strategy_run_at column to paper_trading_accounts')
    except Exception as e:
        print(f'⚠️  last_strategy_run_at column exists or error: {e}')
    
    try:
        # Add strategy column to trades
        cursor.execute('ALTER TABLE trades ADD COLUMN strategy TEXT')
        print('✅ Added strategy column to trades')
    except Exception as e:
        print(f'⚠️  strategy column exists or error: {e}')
    
    conn.commit()
    conn.close()
    print('🎉 Database migration completed!')

if __name__ == "__main__":
    migrate_database() 