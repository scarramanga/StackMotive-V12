from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many
from server.services.csv_import_service import (
    parse_csv_with_mapping,
    parse_standard_csv,
    validate_csv_file
)
from server.utils.observability import log_import_operation
import uuid
import json

router = APIRouter()


@router.get("/portfolio/loader/{user_id}")
async def get_user_portfolio(user_id: int, db=Depends(db_session)):
    """Get user's portfolio positions"""
    stmt, params = qmark("SELECT * FROM portfolio_positions WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    positions = result.mappings().all()
    
    return {"positions": [dict(p) for p in positions]}

@router.post("/portfolio/loader/csv")
async def import_csv_portfolio(
    file: UploadFile = File(...),
    field_mapping: Optional[str] = None,
    user_id: int = 1,
    db=Depends(db_session)
):
    """
    Handle CSV portfolio import with pandas parsing and field mapping
    
    Args:
        file: CSV file upload (max 20MB)
        field_mapping: Optional JSON string mapping our fields to CSV columns
        user_id: User ID
    
    Returns:
        {imported, rejected, sampleErrors, importId}
    
    Rate limit: 10 requests/minute per user
    """
    with log_import_operation("csv", user_id) as log_ctx:
        try:
            csv_data = await validate_csv_file(file)
            
            mapping = json.loads(field_mapping) if field_mapping else {}
            
            if mapping:
                positions, errors = parse_csv_with_mapping(csv_data, mapping, user_id)
            else:
                positions, errors = parse_standard_csv(csv_data, user_id)
            
            if not positions:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "No valid positions found in CSV",
                        "sampleErrors": errors[:5]  # First 5 errors only
                    }
                )
            
            import_id = str(uuid.uuid4())
            import_timestamp = datetime.now().isoformat()
            
            imported = 0
            rejected = 0
            
            for position in positions:
                try:
                    stmt, params = qmark("""
                        INSERT INTO portfolio_positions 
                        (userId, symbol, quantity, avgCost, currentPrice, source, asOf)
                        VALUES (?, ?, ?, ?, ?, 'csv', ?::timestamp)
                        ON CONFLICT (userId, symbol, asOf) 
                        DO UPDATE SET 
                            quantity = EXCLUDED.quantity,
                            avgCost = EXCLUDED.avgCost,
                            currentPrice = EXCLUDED.currentPrice,
                            lastUpdated = CURRENT_TIMESTAMP
                    """, (
                        user_id,
                        position.symbol,
                        position.quantity,
                        position.avgPrice,
                        position.currentPrice,
                        import_timestamp
                    ))
                    db.execute(stmt, params)
                    imported += 1
                except Exception as e:
                    errors.append(f"DB error for {position.symbol}: {str(e)}")
                    rejected += 1
            
            status = "success" if rejected == 0 else ("partial" if imported > 0 else "error")
            error_message = f"{rejected} positions failed" if rejected > 0 else None
            
            stmt, params = qmark("""
                INSERT INTO portfolio_sync_history 
                (importId, userId, syncType, status, itemsImported, errorMessage)
                VALUES (?, ?, 'csv', ?, ?, ?)
            """, (import_id, user_id, status, imported, error_message))
            db.execute(stmt, params)
            
            db.commit()
            
            log_ctx["itemsImported"] = imported
            log_ctx["importId"] = import_id
            log_ctx["status"] = status
            
            return {
                "success": True,
                "imported": imported,
                "rejected": rejected,
                "sampleErrors": errors[:10] if errors else None,  # First 10 errors
                "importId": import_id
            }
            
        except HTTPException:
            raise
        except Exception as e:
            log_ctx["status"] = "error"
            raise HTTPException(status_code=400, detail=str(e))

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

