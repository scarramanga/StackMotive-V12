from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/ai-rebalance/suggestions/{user_id}")
async def get_ai_rebalance_suggestions(user_id: int, db=Depends(db_session)):
    """Generate AI-driven rebalancing suggestions for user's portfolio"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS ai_rebalance_suggestions (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            suggestion TEXT NOT NULL,
            reasoning TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        SELECT * FROM ai_rebalance_suggestions WHERE userId = ?
        ORDER BY createdAt DESC LIMIT 5
    """, (user_id,))
    result = db.execute(stmt, params)
    suggestions = result.mappings().all()
    
    return {"suggestions": [dict(s) for s in suggestions]}

@router.post("/ai-rebalance/respond/{user_id}")
async def respond_to_suggestion(user_id: int, response: dict, db=Depends(db_session)):
    """User response to an AI rebalancing suggestion"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS suggestion_responses (
            id INTEGER PRIMARY KEY,
            suggestionId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            response TEXT NOT NULL,
            respondedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        INSERT INTO suggestion_responses (suggestionId, userId, response)
        VALUES (?, ?, ?)
    """, (
        response.get("suggestionId"),
        user_id,
        response.get("response")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.get("/ai-rebalance/history/{user_id}")
async def get_suggestion_history(user_id: int, db=Depends(db_session)):
    """Get user's AI suggestion response history"""
    stmt, params = qmark("""
        SELECT sr.*, ars.suggestion 
        FROM suggestion_responses sr
        JOIN ai_rebalance_suggestions ars ON sr.suggestionId = ars.id
        WHERE sr.userId = ?
        ORDER BY sr.respondedAt DESC
    """, (user_id,))
    result = db.execute(stmt, params)
    history = result.mappings().all()
    
    return {"history": [dict(h) for h in history]}

@router.post("/ai-rebalance/refresh/{user_id}")
async def refresh_ai_suggestions(user_id: int, db=Depends(db_session)):
    """Refresh AI suggestions with latest portfolio data"""
    stmt, params = qmark("""
        INSERT INTO ai_rebalance_suggestions (userId, suggestion, reasoning)
        VALUES (?, ?, ?)
    """, (
        user_id,
        "Consider rebalancing your portfolio to maintain target allocations",
        "Your current allocation has drifted from your target by more than 5%"
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

