from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/asset-view-tools/preferences")
async def get_asset_view_preferences(user_id: int = 1, db=Depends(db_session)):
    """Get user's asset view preferences"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS asset_view_preferences (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            preferenceKey TEXT NOT NULL,
            preferenceValue TEXT NOT NULL,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM asset_view_preferences WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    preferences = result.mappings().all()
    
    return {"preferences": [dict(p) for p in preferences]}

@router.put("/asset-view-tools/preferences")
async def update_asset_view_preferences(
    preferences: dict,
    user_id: int = 1,
    db=Depends(db_session)
):
    """Update user's asset view preferences"""
    for key, value in preferences.items():
        stmt, params = qmark("""
            INSERT OR REPLACE INTO asset_view_preferences (userId, preferenceKey, preferenceValue, updatedAt)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (user_id, key, str(value)))
        db.execute(stmt, params)
    
    db.commit()
    return {"success": True}

@router.get("/asset-view-tools/tags")
async def get_asset_tags(user_id: int = 1, db=Depends(db_session)):
    """Get user's asset tags"""
    stmt, params = qmark("SELECT * FROM asset_tags WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    tags = result.mappings().all()
    
    return {"tags": [dict(t) for t in tags]}

@router.get("/asset-view-tools/tags/asset/{asset_symbol}")
async def get_asset_tags_for_symbol(
    asset_symbol: str,
    user_id: int = 1,
    db=Depends(db_session)
):
    """Get tags for a specific asset"""
    stmt, params = qmark("""
        SELECT at.* FROM asset_tags at
        JOIN asset_tag_assignments ata ON at.id = ata.tagId
        WHERE ata.assetSymbol = ? AND ata.userId = ?
    """, (asset_symbol, user_id))
    result = db.execute(stmt, params)
    tags = result.mappings().all()
    
    return {"tags": [dict(t) for t in tags]}

@router.get("/asset-view-tools/allocation-rings")
async def get_allocation_rings(user_id: int = 1, db=Depends(db_session)):
    """Get user's asset allocation rings"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS allocation_rings (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            ringName TEXT NOT NULL,
            ringConfig TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM allocation_rings WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    rings = result.mappings().all()
    
    return {"rings": [dict(r) for r in rings]}

@router.get("/asset-view-tools/allocation-rings/{ring_id}/allocations")
async def get_ring_allocations(
    ring_id: int,
    user_id: int = 1,
    db=Depends(db_session)
):
    """Get asset class allocations for a specific ring"""
    return {
        "ringId": ring_id,
        "allocations": [
            {"assetClass": "Stocks", "percentage": 60},
            {"assetClass": "Bonds", "percentage": 30},
            {"assetClass": "Cash", "percentage": 10}
        ]
    }

