from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/market/prices")
async def get_crypto_prices(db=Depends(db_session)):
    """Get current cryptocurrency prices"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS market_prices (
            id INTEGER PRIMARY KEY,
            symbol TEXT NOT NULL,
            price REAL NOT NULL,
            change24h REAL,
            volume24h REAL,
            marketCap REAL,
            lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    demo_prices = [
        ("BTC", 45000.00, 2.5, 25000000000, 850000000000),
        ("ETH", 3000.00, 1.8, 15000000000, 350000000000),
        ("SOL", 100.00, 5.2, 2000000000, 40000000000)
    ]
    
    for symbol, price, change, volume, cap in demo_prices:
        stmt, params = qmark("SELECT id FROM market_prices WHERE symbol = ?", (symbol,))
        exists = db.execute(stmt, params).first()
        
        if not exists:
            stmt, params = qmark("""
                INSERT INTO market_prices (symbol, price, change24h, volume24h, marketCap)
                VALUES (?, ?, ?, ?, ?)
            """, (symbol, price, change, volume, cap))
            db.execute(stmt, params)
    
    db.commit()
    
    stmt, params = qmark("SELECT * FROM market_prices ORDER BY marketCap DESC", ())
    result = db.execute(stmt, params)
    prices = result.mappings().all()
    
    return {"prices": [dict(p) for p in prices]}

@router.get("/market/price/{symbol}")
async def get_crypto_price(symbol: str, db=Depends(db_session)):
    """Get current price for a specific cryptocurrency"""
    stmt, params = qmark("SELECT * FROM market_prices WHERE symbol = ?", (symbol,))
    result = db.execute(stmt, params)
    price = result.mappings().first()
    
    if price:
        return {"price": dict(price)}
    
    return {"price": {"symbol": symbol, "price": 0, "error": "Symbol not found"}}

@router.get("/market/trending")
async def get_trending_cryptos(db=Depends(db_session)):
    """Get trending cryptocurrencies"""
    stmt, params = qmark("""
        SELECT * FROM market_prices 
        ORDER BY ABS(change24h) DESC 
        LIMIT 10
    """, ())
    result = db.execute(stmt, params)
    trending = result.mappings().all()
    
    return {"trending": [dict(t) for t in trending]}

@router.get("/broker/historical/{portfolio_id}/{symbol}")
async def get_historical_data(portfolio_id: int, symbol: str, db=Depends(db_session)):
    """Get historical OHLC data for a symbol in a portfolio"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS historical_data (
            id INTEGER PRIMARY KEY,
            symbol TEXT NOT NULL,
            date TEXT NOT NULL,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume REAL
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        SELECT * FROM historical_data 
        WHERE symbol = ? 
        ORDER BY date DESC 
        LIMIT 30
    """, (symbol,))
    result = db.execute(stmt, params)
    history = result.mappings().all()
    
    return {"historical": [dict(h) for h in history], "symbol": symbol}

@router.get("/market/marketdata/symbol/{symbol}/{interval}")
async def get_market_data(symbol: str, interval: str, db=Depends(db_session)):
    """Get market data for a specific symbol and interval"""
    stmt, params = qmark("SELECT * FROM market_prices WHERE symbol = ?", (symbol,))
    result = db.execute(stmt, params)
    price_data = result.mappings().first()
    
    return {
        "symbol": symbol,
        "interval": interval,
        "data": dict(price_data) if price_data else None,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/market/validate-symbol/{symbol}")
async def validate_symbol(symbol: str, db=Depends(db_session)):
    """Validate if a symbol is available for trading"""
    stmt, params = qmark("SELECT id FROM market_prices WHERE symbol = ?", (symbol,))
    exists = db.execute(stmt, params).first()
    
    return {
        "symbol": symbol,
        "valid": exists is not None,
        "tradeable": exists is not None
    }

