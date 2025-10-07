from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/strategy/assignments/{user_id}")
async def get_user_strategy_assignments(user_id: int, db=Depends(db_session)):
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

@router.post("/strategy/edit/{strategy_id}")
async def edit_strategy(strategy_id: int, edit_data: dict, db=Depends(db_session)):
    """Edit a strategy assignment with new parameters"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS strategy_edit_history (
            id INTEGER PRIMARY KEY,
            assignmentId INTEGER NOT NULL,
            changes TEXT NOT NULL,
            editedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        UPDATE strategy_assignments 
        SET parameters = ?, updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ?
    """, (str(edit_data.get("parameters", "{}")), strategy_id))
    db.execute(stmt, params)
    
    stmt, params = qmark("""
        INSERT INTO strategy_edit_history (assignmentId, changes)
        VALUES (?, ?)
    """, (strategy_id, str(edit_data)))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.get("/strategy/edit/history/{strategy_id}")
async def get_strategy_edit_history(strategy_id: int, db=Depends(db_session)):
    """Get edit history for a strategy"""
    stmt, params = qmark("""
        SELECT * FROM strategy_edit_history WHERE assignmentId = ?
        ORDER BY editedAt DESC
    """, (strategy_id,))
    result = db.execute(stmt, params)
    history = result.mappings().all()
    
    return {"history": [dict(h) for h in history]}

@router.post("/strategy/validate")
async def validate_strategy_parameters(edit_data: dict, db=Depends(db_session)):
    """Validate strategy parameters before saving"""
    is_valid = True
    errors = []
    
    if not edit_data.get("strategyId"):
        is_valid = False
        errors.append("Strategy ID is required")
    
    if not edit_data.get("parameters"):
        is_valid = False
        errors.append("Parameters are required")
    
    return {"valid": is_valid, "errors": errors}

@router.get("/strategy/debug/{user_id}")
async def debug_strategy_assignments(user_id: int, db=Depends(db_session)):
    """Debug endpoint to test database connection and table access"""
    stmt, params = qmark("SELECT COUNT(*) as count FROM strategy_assignments WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    count = result.mappings().first()
    
    return {
        "userId": user_id,
        "assignmentCount": count["count"] if count else 0,
        "databaseConnected": True
    }

