from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/whale-activities")
async def get_whale_activities(db=Depends(db_session)):
    """Get whale trading activities - mock data for development"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS whale_activities (
            id INTEGER PRIMARY KEY,
            institution TEXT NOT NULL,
            symbol TEXT NOT NULL,
            tradeType TEXT NOT NULL,
            volume REAL NOT NULL,
            price REAL NOT NULL,
            tradedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM whale_activities ORDER BY tradedAt DESC LIMIT 20", ())
    result = db.execute(stmt, params)
    activities = result.mappings().all()
    
    if not activities:
        demo_activities = [
            {"institution": "Berkshire Hathaway", "symbol": "AAPL", "tradeType": "buy", "volume": 100000, "price": 175.50},
            {"institution": "BlackRock", "symbol": "SPY", "tradeType": "buy", "volume": 500000, "price": 450.25},
            {"institution": "Vanguard", "symbol": "MSFT", "tradeType": "buy", "volume": 75000, "price": 380.75}
        ]
        for activity in demo_activities:
            stmt, params = qmark("""
                INSERT INTO whale_activities (institution, symbol, tradeType, volume, price)
                VALUES (?, ?, ?, ?, ?)
            """, (activity["institution"], activity["symbol"], activity["tradeType"], activity["volume"], activity["price"]))
            db.execute(stmt, params)
        db.commit()
        
        return {"activities": demo_activities}
    
    return {"activities": [dict(a) for a in activities]}

@router.get("/whale-activities/institutions")
async def get_institutions(db=Depends(db_session)):
    """Get list of institutions for filtering"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS institutions (
            id INTEGER PRIMARY KEY,
            institutionName TEXT NOT NULL UNIQUE
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT DISTINCT institution as institutionName FROM whale_activities", ())
    result = db.execute(stmt, params)
    institutions = result.mappings().all()
    
    if not institutions:
        demo_institutions = [
            {"institutionName": "Berkshire Hathaway"},
            {"institutionName": "BlackRock"},
            {"institutionName": "Vanguard"}
        ]
        return {"institutions": demo_institutions}
    
    return {"institutions": [dict(i) for i in institutions]}

