#!/usr/bin/env python3
"""
Simple script to create database tables
"""

from server.database import Base, engine
from server.models.user import User
from server.models.paper_trading import PaperTradingAccount, Trade
from server.models.tax import TaxTransaction, TaxReport, TaxSettings

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"📊 Tables: {', '.join(tables)}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    return True

if __name__ == "__main__":
    create_tables() 