from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/holdings/all/{user_id}")
async def get_all_holdings(user_id: int, filter_params: Optional[dict] = None, db=Depends(db_session)):
    """Get all holdings for a user with sorting and filtering"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS holdings_tags (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            positionId INTEGER NOT NULL,
            tag TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        SELECT * FROM portfolio_positions 
        WHERE userId = ?
        ORDER BY currentPrice * quantity DESC
    """, (user_id,))
    result = db.execute(stmt, params)
    holdings = result.mappings().all()
    
    stmt, params = qmark("""
        SELECT positionId, tag FROM holdings_tags WHERE userId = ?
    """, (user_id,))
    result = db.execute(stmt, params)
    tags = result.mappings().all()
    
    tags_by_position = {}
    for tag_row in tags:
        pos_id = tag_row["positionId"]
        if pos_id not in tags_by_position:
            tags_by_position[pos_id] = []
        tags_by_position[pos_id].append(tag_row["tag"])
    
    holdings_with_tags = []
    for holding in holdings:
        holding_dict = dict(holding)
        holding_dict["tags"] = tags_by_position.get(holding["id"], [])
        holdings_with_tags.append(holding_dict)
    
    return {"holdings": holdings_with_tags}

@router.post("/holdings/tag")
async def add_holding_tag(tag_data: dict, db=Depends(db_session)):
    """Add a tag to a holding"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS holdings_tags (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            positionId INTEGER NOT NULL,
            tag TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        INSERT INTO holdings_tags (userId, positionId, tag)
        VALUES (?, ?, ?)
    """, (
        tag_data.get("userId"),
        tag_data.get("positionId"),
        tag_data.get("tag")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.delete("/holdings/tag/{user_id}/{position_id}/{tag}")
async def remove_holding_tag(user_id: int, position_id: int, tag: str, db=Depends(db_session)):
    """Remove a tag from a holding"""
    stmt, params = qmark("""
        DELETE FROM holdings_tags 
        WHERE userId = ? AND positionId = ? AND tag = ?
    """, (user_id, position_id, tag))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.get("/holdings/tags/{user_id}")
async def get_available_tags(user_id: int, db=Depends(db_session)):
    """Get all unique tags used by a user"""
    stmt, params = qmark("""
        SELECT DISTINCT tag FROM holdings_tags WHERE userId = ?
    """, (user_id,))
    result = db.execute(stmt, params)
    tags = result.mappings().all()
    
    return {"tags": [t["tag"] for t in tags]}

@router.get("/holdings/analytics/{user_id}")
async def get_holdings_analytics(user_id: int, db=Depends(db_session)):
    """Get analytics for holdings"""
    stmt, params = qmark("""
        SELECT 
            COUNT(*) as totalHoldings,
            SUM(quantity * currentPrice) as totalValue,
            AVG(currentPrice / NULLIF(avgCost, 0) - 1) * 100 as avgGainPercent
        FROM portfolio_positions 
        WHERE userId = ?
    """, (user_id,))
    result = db.execute(stmt, params)
    analytics = result.mappings().first()
    
    return {"analytics": dict(analytics) if analytics else {}}

