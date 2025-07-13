#!/usr/bin/env python3

from server.models.paper_trading import Trade
from server.database import SessionLocal

def test_trade_orm():
    db = SessionLocal()
    try:
        print("=== TRADE ORM DEBUG ===")
        
        # Test 1: Get all trades
        all_trades = db.query(Trade).all()
        print(f"All trades: {len(all_trades)}")
        
        # Test 2: Test the actual query
        trades_for_account = db.query(Trade).filter(Trade.account_id == 2).all()
        print(f"Trades for account 2: {len(trades_for_account)}")
        
        # Test 3: Test different filters
        trades_by_int = db.query(Trade).filter(Trade.account_id == int(2)).all()
        print(f"Trades by int(2): {len(trades_by_int)}")
        
        # Test 4: Print any trades found
        for i, trade in enumerate(all_trades):
            print(f"Trade {i}: id={trade.id}, account_id={trade.account_id} (type: {type(trade.account_id)}), symbol={trade.symbol}")
            if i >= 5:  # Only show first 5
                break
        
        # Test 5: Check if there's a type mismatch
        print(f"Looking for account_id == 2 (int)")
        for trade in all_trades:
            if trade.account_id == 2:
                print(f"Found matching trade: {trade.id}")
                break
        else:
            print("No trades found with account_id == 2")
            
        # Test 6: Check account_id values
        account_ids = [trade.account_id for trade in all_trades]
        print(f"All account_ids in database: {set(account_ids)}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_trade_orm() 