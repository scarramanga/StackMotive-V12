from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/asset/details/{symbol}")
async def get_asset_details(symbol: str, db=Depends(db_session)):
    """Get detailed information about an asset"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS asset_details (
            id INTEGER PRIMARY KEY,
            symbol TEXT NOT NULL UNIQUE,
            name TEXT,
            sector TEXT,
            industry TEXT,
            description TEXT,
            marketCap REAL,
            pe_ratio REAL,
            dividend_yield REAL,
            lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM asset_details WHERE symbol = ?", (symbol,))
    result = db.execute(stmt, params)
    details = result.mappings().first()
    
    if not details:
        demo_data = {
            "BTC": ("Bitcoin", "Cryptocurrency", "Digital Currency", "Leading cryptocurrency", 850000000000, None, None),
            "ETH": ("Ethereum", "Cryptocurrency", "Smart Contracts", "Decentralized platform", 350000000000, None, None),
            "AAPL": ("Apple Inc", "Technology", "Consumer Electronics", "Technology company", 2800000000000, 28.5, 0.5)
        }
        
        if symbol in demo_data:
            name, sector, industry, desc, cap, pe, div = demo_data[symbol]
            stmt, params = qmark("""
                INSERT INTO asset_details (symbol, name, sector, industry, description, marketCap, pe_ratio, dividend_yield)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (symbol, name, sector, industry, desc, cap, pe, div))
            db.execute(stmt, params)
            db.commit()
            
            stmt, params = qmark("SELECT * FROM asset_details WHERE symbol = ?", (symbol,))
            result = db.execute(stmt, params)
            details = result.mappings().first()
    
    if details:
        return {"asset": dict(details)}
    
    return {"asset": None, "error": "Asset not found"}

@router.get("/asset/analytics/{symbol}")
async def get_asset_analytics(symbol: str, db=Depends(db_session)):
    """Get analytics and metrics for an asset"""
    stmt, params = qmark("SELECT * FROM market_prices WHERE symbol = ?", (symbol,))
    result = db.execute(stmt, params)
    price_data = result.mappings().first()
    
    stmt, params = qmark("SELECT * FROM asset_details WHERE symbol = ?", (symbol,))
    result = db.execute(stmt, params)
    details = result.mappings().first()
    
    return {
        "symbol": symbol,
        "priceData": dict(price_data) if price_data else None,
        "fundamentals": dict(details) if details else None,
        "analytics": {
            "volatility": 15.5,
            "beta": 1.2,
            "momentum": "bullish"
        }
    }

@router.get("/asset/news/{symbol}")
async def get_asset_news(symbol: str, limit: int = 10, db=Depends(db_session)):
    """Get recent news for an asset"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS asset_news (
            id INTEGER PRIMARY KEY,
            symbol TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            source TEXT,
            sentiment TEXT,
            publishedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        SELECT * FROM asset_news 
        WHERE symbol = ? 
        ORDER BY publishedAt DESC 
        LIMIT ?
    """, (symbol, limit))
    result = db.execute(stmt, params)
    news = result.mappings().all()
    
    return {"news": [dict(n) for n in news], "symbol": symbol}

@router.get("/asset/performance/{symbol}")
async def get_asset_performance(symbol: str, period: str = "1M", db=Depends(db_session)):
    """Get performance metrics for an asset over a time period"""
    stmt, params = qmark("SELECT * FROM market_prices WHERE symbol = ?", (symbol,))
    result = db.execute(stmt, params)
    price_data = result.mappings().first()
    
    return {
        "symbol": symbol,
        "period": period,
        "performance": {
            "return": 5.2 if price_data else 0,
            "volatility": 18.3,
            "sharpeRatio": 1.5,
            "maxDrawdown": -8.5
        }
    }
