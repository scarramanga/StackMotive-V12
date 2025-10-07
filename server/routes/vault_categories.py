from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.post("/vault/categories/{user_id}")
async def create_vault_category(user_id: int, category: dict, db=Depends(db_session)):
    """Create a new vault category"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS vault_categories (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            categoryName TEXT NOT NULL,
            targetAllocation REAL DEFAULT 0,
            color TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        INSERT INTO vault_categories (userId, categoryName, targetAllocation, color)
        VALUES (?, ?, ?, ?)
    """, (
        user_id,
        category.get("categoryName"),
        category.get("targetAllocation", 0),
        category.get("color")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.put("/vault/categories/{user_id}/{category_id}")
async def update_vault_category(user_id: int, category_id: int, category: dict, db=Depends(db_session)):
    """Update a vault category"""
    stmt, params = qmark("""
        UPDATE vault_categories 
        SET categoryName = ?, targetAllocation = ?, color = ?
        WHERE id = ? AND userId = ?
    """, (
        category.get("categoryName"),
        category.get("targetAllocation", 0),
        category.get("color"),
        category_id,
        user_id
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.post("/vault/assignments/{user_id}")
async def assign_asset_to_category(user_id: int, assignment: dict, db=Depends(db_session)):
    """Assign an asset to a category"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS vault_assignments (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            categoryId INTEGER NOT NULL,
            assetSymbol TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        INSERT INTO vault_assignments (userId, categoryId, assetSymbol)
        VALUES (?, ?, ?)
    """, (
        user_id,
        assignment.get("categoryId"),
        assignment.get("assetSymbol")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.post("/vault/auto-assign/{user_id}")
async def auto_assign_assets(user_id: int, assets: List[Dict[str, Any]], db=Depends(db_session)):
    """Auto-assign assets to categories based on rules"""
    assigned_count = 0
    
    for asset in assets:
        stmt, params = qmark("""
            INSERT INTO vault_assignments (userId, categoryId, assetSymbol)
            VALUES (?, ?, ?)
        """, (
            user_id,
            asset.get("categoryId", 1),
            asset.get("symbol")
        ))
        db.execute(stmt, params)
        assigned_count += 1
    
    db.commit()
    return {"success": True, "assignedCount": assigned_count}

@router.get("/vault/allocation-summary/{user_id}")
async def get_allocation_summary(user_id: int, db=Depends(db_session)):
    """Get allocation summary across all categories"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS vault_categories (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            categoryName TEXT NOT NULL,
            targetAllocation REAL DEFAULT 0,
            color TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS vault_assignments (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            categoryId INTEGER NOT NULL,
            assetSymbol TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        SELECT vc.categoryName, vc.targetAllocation, COUNT(va.id) as assetCount
        FROM vault_categories vc
        LEFT JOIN vault_assignments va ON vc.id = va.categoryId AND va.userId = ?
        WHERE vc.userId = ?
        GROUP BY vc.id
    """, (user_id, user_id))
    result = db.execute(stmt, params)
    summary = result.mappings().all()
    
    return {"summary": [dict(s) for s in summary]}

