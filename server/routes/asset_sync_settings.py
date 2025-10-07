from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/sync/config/{user_id}")
async def get_sync_configurations(user_id: int, db=Depends(db_session)):
    """Get all sync configurations for a user"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS sync_configurations (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            syncSource TEXT NOT NULL,
            config TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM sync_configurations WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    configs = result.mappings().all()
    
    return {"configurations": [dict(c) for c in configs]}

@router.post("/sync/config")
async def save_sync_configuration(config: dict, db=Depends(db_session)):
    """Save or update sync configuration"""
    stmt, params = qmark("""
        INSERT OR REPLACE INTO sync_configurations (userId, syncSource, config, enabled)
        VALUES (?, ?, ?, ?)
    """, (
        config.get("userId"),
        config.get("syncSource"),
        str(config.get("config", "{}")),
        config.get("enabled", 1)
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.post("/sync/trigger")
async def trigger_sync(trigger: dict, db=Depends(db_session)):
    """Trigger a manual sync for a specific source"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS sync_history (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            syncSource TEXT NOT NULL,
            status TEXT NOT NULL,
            itemsSynced INTEGER DEFAULT 0,
            syncedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        INSERT INTO sync_history (userId, syncSource, status, itemsSynced)
        VALUES (?, ?, ?, ?)
    """, (
        trigger.get("userId"),
        trigger.get("syncSource"),
        "completed",
        0
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "status": "completed"}

@router.get("/sync/history/{user_id}")
async def get_sync_history(user_id: int, limit: int = 20, db=Depends(db_session)):
    """Get sync history for a user"""
    stmt, params = qmark("""
        SELECT * FROM sync_history WHERE userId = ?
        ORDER BY syncedAt DESC LIMIT ?
    """, (user_id, limit))
    result = db.execute(stmt, params)
    history = result.mappings().all()
    
    return {"history": [dict(h) for h in history]}

@router.delete("/sync/config/{user_id}/{sync_source}")
async def delete_sync_configuration(user_id: int, sync_source: str, db=Depends(db_session)):
    """Delete a sync configuration"""
    stmt, params = qmark("""
        DELETE FROM sync_configurations WHERE userId = ? AND syncSource = ?
    """, (user_id, sync_source))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

