from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/rebalance/schedule/{user_id}")
async def get_rebalance_schedule(user_id: int, db=Depends(db_session)):
    """Get rebalance schedule for a user"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS rebalance_schedules (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            frequency TEXT NOT NULL,
            threshold REAL,
            enabled INTEGER DEFAULT 1,
            lastRebalance TEXT,
            nextRebalance TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM rebalance_schedules WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    schedule = result.mappings().first()
    
    if schedule:
        return {"schedule": dict(schedule)}
    return {"schedule": None}

@router.post("/rebalance/schedule")
async def save_rebalance_schedule(schedule: dict, db=Depends(db_session)):
    """Save or update rebalance schedule"""
    user_id = schedule.get("userId")
    
    stmt, params = qmark("SELECT id FROM rebalance_schedules WHERE userId = ?", (user_id,))
    existing = db.execute(stmt, params).first()
    
    if existing:
        stmt, params = qmark("""
            UPDATE rebalance_schedules 
            SET frequency = ?, threshold = ?, enabled = ?
            WHERE userId = ?
        """, (
            schedule.get("frequency"),
            schedule.get("threshold"),
            schedule.get("enabled", 1),
            user_id
        ))
    else:
        stmt, params = qmark("""
            INSERT INTO rebalance_schedules (userId, frequency, threshold, enabled)
            VALUES (?, ?, ?, ?)
        """, (
            user_id,
            schedule.get("frequency"),
            schedule.get("threshold"),
            schedule.get("enabled", 1)
        ))
    
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.post("/rebalance/trigger/{user_id}")
async def trigger_rebalance(user_id: int, execution_type: str = "manual", db=Depends(db_session)):
    """Trigger a manual rebalance"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS rebalance_history (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            executionType TEXT NOT NULL,
            status TEXT NOT NULL,
            tradeCount INTEGER DEFAULT 0,
            totalValue REAL,
            executedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        INSERT INTO rebalance_history (userId, executionType, status, tradeCount, notes)
        VALUES (?, ?, 'completed', 0, 'Demo rebalance execution')
    """, (user_id, execution_type))
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        UPDATE rebalance_schedules 
        SET lastRebalance = CURRENT_TIMESTAMP
        WHERE userId = ?
    """, (user_id,))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "executionId": db.execute("SELECT last_insert_rowid()").scalar()}

@router.get("/rebalance/history/{user_id}")
async def get_rebalance_history(user_id: int, limit: int = 20, db=Depends(db_session)):
    """Get rebalance execution history"""
    stmt, params = qmark("""
        SELECT * FROM rebalance_history 
        WHERE userId = ? 
        ORDER BY executedAt DESC 
        LIMIT ?
    """, (user_id, limit))
    result = db.execute(stmt, params)
    history = result.mappings().all()
    
    return {"history": [dict(h) for h in history]}

@router.get("/rebalance/status/{user_id}")
async def get_rebalance_status(user_id: int, db=Depends(db_session)):
    """Get current rebalance status and drift analysis"""
    stmt, params = qmark("SELECT * FROM rebalance_schedules WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    schedule = result.mappings().first()
    
    stmt, params = qmark("""
        SELECT COUNT(*) as total FROM rebalance_history WHERE userId = ?
    """, (user_id,))
    total_rebalances = db.execute(stmt, params).scalar()
    
    return {
        "schedule": dict(schedule) if schedule else None,
        "totalRebalances": total_rebalances or 0,
        "driftAnalysis": {
            "currentDrift": 2.5,
            "threshold": schedule["threshold"] if schedule else 5.0,
            "needsRebalance": False
        }
    }

