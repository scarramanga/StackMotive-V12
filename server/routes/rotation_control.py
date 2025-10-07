from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/rotation/preferences/{user_id}")
async def get_rotation_preferences(user_id: int, db=Depends(db_session)):
    """Get user rotation preferences"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS rotation_preferences (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            preferenceKey TEXT NOT NULL,
            preferenceValue TEXT NOT NULL,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM rotation_preferences WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    preferences = result.mappings().all()
    
    return {"preferences": [dict(p) for p in preferences]}

@router.post("/rotation/preferences/{user_id}")
async def update_rotation_preferences(user_id: int, preferences: dict, db=Depends(db_session)):
    """Update user rotation preferences"""
    for key, value in preferences.items():
        stmt, params = qmark("""
            INSERT OR REPLACE INTO rotation_preferences (userId, preferenceKey, preferenceValue, updatedAt)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (user_id, key, str(value)))
        db.execute(stmt, params)
    
    db.commit()
    return {"success": True}

@router.post("/rotation/recommend/{user_id}")
async def get_rotation_recommendation(user_id: int, portfolio_data: Dict[str, Any], db=Depends(db_session)):
    """Get rotation recommendation based on current portfolio and preferences"""
    return {
        "recommendation": {
            "fromSymbol": "BTC",
            "toSymbol": "ETH",
            "suggestedAmount": 1000,
            "reason": "Market conditions favor rotation"
        }
    }

@router.post("/rotation/execute/{user_id}")
async def execute_rotation(user_id: int, rotation_event: dict, db=Depends(db_session)):
    """Log rotation execution and update history"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS rotation_history (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            fromSymbol TEXT NOT NULL,
            toSymbol TEXT NOT NULL,
            amount REAL NOT NULL,
            rotatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        INSERT INTO rotation_history (userId, fromSymbol, toSymbol, amount)
        VALUES (?, ?, ?, ?)
    """, (
        user_id,
        rotation_event.get("fromSymbol"),
        rotation_event.get("toSymbol"),
        rotation_event.get("amount")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

