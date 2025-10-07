from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/asset-exclusion-panel/filters")
async def get_exclusion_filters(user_id: int = 1, db=Depends(db_session)):
    """Get all exclusion filters for a user"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS exclusion_filters (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            filterType TEXT NOT NULL,
            criteria TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM exclusion_filters WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    filters = result.mappings().all()
    
    return {"filters": [dict(f) for f in filters]}

@router.get("/asset-exclusion-panel/impact-analysis")
async def get_exclusion_impact_analysis(user_id: int = 1, db=Depends(db_session)):
    """Get analysis of exclusion impact on portfolio"""
    stmt, params = qmark("SELECT COUNT(*) as filterCount FROM exclusion_filters WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    filter_count = result.mappings().first()
    
    return {
        "activeFilters": filter_count["filterCount"] if filter_count else 0,
        "estimatedImpact": "Low",
        "assetsExcluded": 0
    }

@router.get("/asset-exclusion-panel/settings")
async def get_exclusion_settings(user_id: int = 1, db=Depends(db_session)):
    """Get user exclusion settings"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS exclusion_settings (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            settingKey TEXT NOT NULL,
            settingValue TEXT NOT NULL,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM exclusion_settings WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    settings = result.mappings().all()
    
    return {"settings": [dict(s) for s in settings]}

@router.get("/asset-exclusion-panel/export")
async def export_exclusions(user_id: int = 1, db=Depends(db_session)):
    """Export all exclusion data"""
    stmt, params = qmark("SELECT * FROM exclusion_filters WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    filters = result.mappings().all()
    
    stmt, params = qmark("SELECT * FROM exclusion_settings WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    settings = result.mappings().all()
    
    return {
        "filters": [dict(f) for f in filters],
        "settings": [dict(s) for s in settings]
    }

