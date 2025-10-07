from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/asset-tagging-system/tags")
async def get_asset_tags(user_id: int = 1, db=Depends(db_session)):
    """Get all asset tags for a user"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS asset_tags (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            tagName TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM asset_tags WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    tags = result.mappings().all()
    
    return {"tags": [dict(t) for t in tags]}

@router.delete("/asset-tagging-system/tags/{tag_id}")
async def delete_asset_tag(
    tag_id: str,
    user_id: int = 1,
    db=Depends(db_session)
):
    """Delete an asset tag"""
    stmt, params = qmark("DELETE FROM asset_tags WHERE id = ? AND userId = ?", (tag_id, user_id))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.get("/asset-tagging-system/assets/{asset_symbol}/tags")
async def get_asset_tags_for_symbol(
    asset_symbol: str,
    user_id: int = 1,
    db=Depends(db_session)
):
    """Get all tags for a specific asset"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS asset_tag_assignments (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            assetSymbol TEXT NOT NULL,
            tagId INTEGER NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        SELECT at.* FROM asset_tags at
        JOIN asset_tag_assignments ata ON at.id = ata.tagId
        WHERE ata.assetSymbol = ? AND ata.userId = ?
    """, (asset_symbol, user_id))
    result = db.execute(stmt, params)
    tags = result.mappings().all()
    
    return {"tags": [dict(t) for t in tags]}

@router.get("/asset-tagging-system/tags/{tag_id}/assets")
async def get_tagged_assets(
    tag_id: str,
    user_id: int = 1,
    db=Depends(db_session)
):
    """Get all assets with a specific tag"""
    stmt, params = qmark("""
        SELECT assetSymbol FROM asset_tag_assignments 
        WHERE tagId = ? AND userId = ?
    """, (tag_id, user_id))
    result = db.execute(stmt, params)
    assets = result.mappings().all()
    
    return {"assets": [dict(a) for a in assets]}

@router.get("/asset-tagging-system/filters")
async def get_tag_filters(user_id: int = 1, db=Depends(db_session)):
    """Get saved tag filters"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS tag_filters (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            filterName TEXT NOT NULL,
            filterConfig TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM tag_filters WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    filters = result.mappings().all()
    
    return {"filters": [dict(f) for f in filters]}

@router.get("/asset-tagging-system/stats")
async def get_tagging_statistics(user_id: int = 1, db=Depends(db_session)):
    """Get asset tagging statistics"""
    stmt, params = qmark("SELECT COUNT(*) as tagCount FROM asset_tags WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    tag_count = result.mappings().first()
    
    stmt, params = qmark("SELECT COUNT(*) as assignmentCount FROM asset_tag_assignments WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    assignment_count = result.mappings().first()
    
    return {
        "tagCount": tag_count["tagCount"] if tag_count else 0,
        "assignmentCount": assignment_count["assignmentCount"] if assignment_count else 0
    }

@router.get("/asset-tagging-system/export")
async def export_tagging_data(user_id: int = 1, db=Depends(db_session)):
    """Export all tagging data"""
    stmt, params = qmark("SELECT * FROM asset_tags WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    tags = result.mappings().all()
    
    stmt, params = qmark("SELECT * FROM asset_tag_assignments WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    assignments = result.mappings().all()
    
    return {
        "tags": [dict(t) for t in tags],
        "assignments": [dict(a) for a in assignments]
    }

