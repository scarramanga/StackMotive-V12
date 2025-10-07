from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/portfolio/loader/{user_id}")
async def get_user_portfolio(user_id: int, db=Depends(db_session)):
    """Get user's portfolio positions"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS portfolio_positions (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            quantity REAL NOT NULL,
            avgCost REAL,
            currentPrice REAL,
            lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP,
            source TEXT DEFAULT 'manual'
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM portfolio_positions WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    positions = result.mappings().all()
    
    return {"positions": [dict(p) for p in positions]}

@router.post("/portfolio/loader/csv")
async def import_csv_portfolio(request: dict, db=Depends(db_session)):
    """Handle CSV portfolio import"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS portfolio_sync_history (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            syncType TEXT NOT NULL,
            status TEXT NOT NULL,
            itemsImported INTEGER DEFAULT 0,
            syncedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            errorMessage TEXT
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    user_id = request.get("userId")
    csv_data = request.get("csvData", [])
    
    imported = 0
    for row in csv_data:
        stmt, params = qmark("""
            INSERT INTO portfolio_positions (userId, symbol, quantity, avgCost, source)
            VALUES (?, ?, ?, ?, 'csv')
        """, (user_id, row.get("symbol"), row.get("quantity"), row.get("avgCost")))
        db.execute(stmt, params)
        imported += 1
    
    stmt, params = qmark("""
        INSERT INTO portfolio_sync_history (userId, syncType, status, itemsImported)
        VALUES (?, 'csv', 'success', ?)
    """, (user_id, imported))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "itemsImported": imported}

@router.post("/portfolio/loader/manual")
async def add_manual_position(request: dict, db=Depends(db_session)):
    """Add a manual portfolio position"""
    stmt, params = qmark("""
        INSERT INTO portfolio_positions (userId, symbol, quantity, avgCost, source)
        VALUES (?, ?, ?, ?, 'manual')
    """, (
        request.get("userId"),
        request.get("symbol"),
        request.get("quantity"),
        request.get("avgCost")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "positionId": db.execute("SELECT last_insert_rowid()").scalar()}

@router.put("/portfolio/loader/{position_id}")
async def update_position(position_id: int, updates: Dict[str, Any], db=Depends(db_session)):
    """Update an existing portfolio position"""
    stmt, params = qmark("""
        UPDATE portfolio_positions 
        SET quantity = ?, avgCost = ?, currentPrice = ?, lastUpdated = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        updates.get("quantity"),
        updates.get("avgCost"),
        updates.get("currentPrice"),
        position_id
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.delete("/portfolio/loader/{position_id}")
async def delete_position(position_id: int, db=Depends(db_session)):
    """Delete a portfolio position"""
    stmt, params = qmark("DELETE FROM portfolio_positions WHERE id = ?", (position_id,))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.get("/portfolio/loader/sync-status/{user_id}")
async def get_sync_status(user_id: int, db=Depends(db_session)):
    """Get the last sync status for a user"""
    stmt, params = qmark("""
        SELECT * FROM portfolio_sync_history 
        WHERE userId = ? 
        ORDER BY syncedAt DESC 
        LIMIT 1
    """, (user_id,))
    result = db.execute(stmt, params)
    sync = result.mappings().first()
    
    if sync:
        return {"lastSync": dict(sync)}
    return {"lastSync": None}

