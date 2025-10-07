from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.post("/strategy/assign/{user_id}")
async def auto_assign_strategies(user_id: int, db=Depends(db_session)):
    """Auto-assign strategies to all user's portfolio positions"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS strategy_configs (
            id INTEGER PRIMARY KEY,
            strategyId TEXT NOT NULL UNIQUE,
            strategyName TEXT NOT NULL,
            description TEXT,
            defaultParams TEXT NOT NULL
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT COUNT(*) as count FROM portfolio_positions WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    count = result.mappings().first()
    
    return {"success": True, "positionsAssigned": count["count"] if count else 0}

@router.get("/strategy/assignments/{user_id}")
async def get_strategy_assignments(user_id: int, db=Depends(db_session)):
    """Get all strategy assignments for a user"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS strategy_assignments (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            strategyId TEXT NOT NULL,
            parameters TEXT NOT NULL,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM strategy_assignments WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    assignments = result.mappings().all()
    
    return {"assignments": [dict(a) for a in assignments]}

@router.get("/strategy/configs")
async def get_strategy_configs(db=Depends(db_session)):
    """Get all available strategy configurations"""
    stmt, params = qmark("SELECT * FROM strategy_configs", ())
    result = db.execute(stmt, params)
    configs = result.mappings().all()
    
    if not configs:
        return {
            "configs": [
                {
                    "strategyId": "dca",
                    "strategyName": "Dollar Cost Average",
                    "description": "Regular periodic purchases",
                    "defaultParams": "{}"
                },
                {
                    "strategyId": "hodl",
                    "strategyName": "Hold Long Term",
                    "description": "Buy and hold strategy",
                    "defaultParams": "{}"
                }
            ]
        }
    
    return {"configs": [dict(c) for c in configs]}

@router.put("/strategy/assign/{assignment_id}")
async def update_strategy_assignment(assignment_id: int, strategy_id: str, user_id: int, db=Depends(db_session)):
    """Manually update a strategy assignment"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS strategy_assignments (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            strategyId TEXT NOT NULL,
            parameters TEXT NOT NULL,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        UPDATE strategy_assignments 
        SET strategyId = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
    """, (strategy_id, assignment_id, user_id))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.delete("/strategy/assign/{assignment_id}")
async def delete_strategy_assignment(assignment_id: int, user_id: int, db=Depends(db_session)):
    """Delete a strategy assignment"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS strategy_assignments (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            strategyId TEXT NOT NULL,
            parameters TEXT NOT NULL,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        DELETE FROM strategy_assignments WHERE id = ? AND userId = ?
    """, (assignment_id, user_id))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.get("/strategy/rules")
async def get_assignment_rules(db=Depends(db_session)):
    """Get current strategy assignment rules"""
    return {
        "rules": [
            {"ruleType": "assetType", "condition": "crypto", "strategyId": "dca"},
            {"ruleType": "assetType", "condition": "stock", "strategyId": "hodl"}
        ]
    }

