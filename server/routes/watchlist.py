from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/watchlists/{user_id}")
async def get_watchlists(user_id: int, db=Depends(db_session)):
    """Get all watchlists for a user"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS watchlists (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS watchlist_items (
            id INTEGER PRIMARY KEY,
            watchlistId INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            addedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM watchlists WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    watchlists = result.mappings().all()
    
    return {"watchlists": [dict(w) for w in watchlists]}

@router.post("/watchlist")
async def create_watchlist(watchlist: dict, db=Depends(db_session)):
    """Create a new watchlist"""
    stmt, params = qmark("""
        INSERT INTO watchlists (userId, name, description)
        VALUES (?, ?, ?)
    """, (
        watchlist.get("userId"),
        watchlist.get("name"),
        watchlist.get("description", "")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "watchlistId": db.execute("SELECT last_insert_rowid()").scalar()}

@router.put("/watchlist/{watchlist_id}")
async def update_watchlist(watchlist_id: int, updates: dict, db=Depends(db_session)):
    """Update a watchlist"""
    stmt, params = qmark("""
        UPDATE watchlists 
        SET name = ?, description = ?
        WHERE id = ?
    """, (
        updates.get("name"),
        updates.get("description"),
        watchlist_id
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.delete("/watchlist/{watchlist_id}")
async def delete_watchlist(watchlist_id: int, db=Depends(db_session)):
    """Delete a watchlist"""
    stmt, params = qmark("DELETE FROM watchlist_items WHERE watchlistId = ?", (watchlist_id,))
    db.execute(stmt, params)
    
    stmt, params = qmark("DELETE FROM watchlists WHERE id = ?", (watchlist_id,))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.get("/watchlist/{watchlist_id}/items")
async def get_watchlist_items(watchlist_id: int, db=Depends(db_session)):
    """Get all items in a watchlist"""
    stmt, params = qmark("SELECT * FROM watchlist_items WHERE watchlistId = ?", (watchlist_id,))
    result = db.execute(stmt, params)
    items = result.mappings().all()
    
    return {"items": [dict(i) for i in items]}

@router.post("/watchlist/{watchlist_id}/item")
async def add_watchlist_item(watchlist_id: int, item: dict, db=Depends(db_session)):
    """Add an item to a watchlist"""
    stmt, params = qmark("""
        INSERT INTO watchlist_items (watchlistId, symbol, notes)
        VALUES (?, ?, ?)
    """, (
        watchlist_id,
        item.get("symbol"),
        item.get("notes", "")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "itemId": db.execute("SELECT last_insert_rowid()").scalar()}

@router.delete("/watchlist/{watchlist_id}/item/{item_id}")
async def remove_watchlist_item(watchlist_id: int, item_id: int, db=Depends(db_session)):
    """Remove an item from a watchlist"""
    stmt, params = qmark("""
        DELETE FROM watchlist_items 
        WHERE id = ? AND watchlistId = ?
    """, (item_id, watchlist_id))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}
