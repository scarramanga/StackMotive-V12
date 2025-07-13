#!/usr/bin/env python3

import sqlite3
import json
from datetime import datetime
from server.models.paper_trading import PaperTradingAccount, Trade
from server.routes.paper_trading import _calculate_portfolio_valuation
from server.database import SessionLocal

def test_database_data():
    """Test the database data directly"""
    conn = sqlite3.connect('trading_platform.db')
    cursor = conn.cursor()
    
    print("=== DATABASE TEST ===")
    
    # Check user
    cursor.execute("SELECT * FROM users WHERE id = 14")
    user = cursor.fetchone()
    print(f"User: {user}")
    
    # Check account
    cursor.execute("SELECT * FROM paper_trading_accounts WHERE user_id = 14")
    account = cursor.fetchone()
    print(f"Account: {account}")
    
    # Check trades
    cursor.execute("SELECT * FROM paper_trades WHERE account_id = 2")
    trades = cursor.fetchall()
    print(f"Trades count: {len(trades)}")
    for trade in trades:
        print(f"  Trade: {trade}")
    
    conn.close()

def test_portfolio_calculation():
    """Test the portfolio calculation logic directly"""
    print("\n=== PORTFOLIO CALCULATION TEST ===")
    
    db = SessionLocal()
    try:
        # Get account
        account = db.query(PaperTradingAccount).filter(PaperTradingAccount.id == 2).first()
        if not account:
            print("❌ No account found")
            return
        
        print(f"Account found: ID {account.id}, Initial: ${account.initial_balance}, Current: ${account.current_balance}")
        print(f"Strategy: {getattr(account, 'strategy_name', 'None')}")
        
        # Test raw SQL for trades to debug ORM issue
        print("\n🔍 Raw SQL trades query:")
        result = db.execute("SELECT * FROM paper_trades WHERE account_id = 2")
        raw_trades = result.fetchall()
        print(f"Raw SQL found {len(raw_trades)} trades")
        
        # Get trades via ORM
        trades = db.query(Trade).filter(Trade.account_id == 2).all()
        print(f"ORM found {len(trades)} trades")
        for trade in trades:
            print(f"  Trade {trade.id}: {trade.side} {trade.quantity} {trade.symbol} @ ${trade.price}")
        
        # If ORM isn't working, let's test the query differently
        if len(trades) == 0 and len(raw_trades) > 0:
            print("🔍 ORM not finding trades, testing different approaches...")
            trades = db.query(Trade).all()
            print(f"All trades in DB: {len(trades)}")
            
            trades = db.query(Trade).filter(Trade.account_id.in_([2])).all()
            print(f"Using .in_([2]): {len(trades)}")
        
        # Calculate portfolio
        portfolio_data = _calculate_portfolio_valuation(account, db)
        print(f"Portfolio calculation result:")
        print(json.dumps(portfolio_data, indent=2))
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def test_api_response_structure():
    """Test what the API response should look like"""
    print("\n=== API RESPONSE STRUCTURE TEST ===")
    
    db = SessionLocal()
    try:
        account = db.query(PaperTradingAccount).filter(PaperTradingAccount.id == 2).first()
        if not account:
            print("❌ No account found")
            return
        
        portfolio_data = _calculate_portfolio_valuation(account, db)
        
        # Simulate the API response
        api_response = {
            "id": account.id,
            "userId": str(account.user_id),
            "name": account.name,
            "initialBalance": float(account.initial_balance),
            "currentBalance": float(account.current_balance),
            "currency": account.currency,
            "isActive": account.is_active,
            "strategyName": getattr(account, 'strategy_name', None),
            "lastStrategyRunAt": getattr(account, 'last_strategy_run_at', None),
            "createdAt": account.created_at.isoformat() if account.created_at else None,
            "updatedAt": (account.updated_at or account.created_at).isoformat() if account.created_at else None,
            **portfolio_data
        }
        
        print("Expected API Response:")
        print(json.dumps(api_response, indent=2, default=str))
        
        # Test trades endpoint response
        trades = db.query(Trade).filter(Trade.account_id == 2).all()
        trades_response = []
        for trade in trades:
            # Handle date conversion for database strings
            created_at = trade.created_at
            executed_at = trade.executed_at
            
            # If they're strings, convert to datetime
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace('T', ' '))
                except:
                    created_at = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
            
            if isinstance(executed_at, str):
                try:
                    executed_at = datetime.fromisoformat(executed_at.replace('T', ' '))
                except:
                    executed_at = datetime.strptime(executed_at, '%Y-%m-%d %H:%M:%S')
            
            trades_response.append({
                "id": trade.id,
                "paperTradingAccountId": trade.account_id,
                "symbol": trade.symbol,
                "tradeType": trade.side,
                "quantity": trade.quantity,
                "price": trade.price,
                "totalValue": trade.quantity * trade.price,
                "status": trade.status,
                "strategy": getattr(account, 'strategy_name', None),
                "createdAt": created_at.isoformat() if created_at else None,
                "executedAt": executed_at.isoformat() if executed_at else None
            })
        
        print(f"\nExpected Trades Response ({len(trades_response)} trades):")
        print(json.dumps(trades_response, indent=2, default=str))
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_database_data()
    test_portfolio_calculation()
    test_api_response_structure() 