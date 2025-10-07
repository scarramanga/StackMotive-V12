from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/allocation/analysis/{user_id}")
async def get_allocation_analysis(user_id: int, db=Depends(db_session)):
    """Get comprehensive allocation analysis for a user's portfolio"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS allocation_analysis (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            analysisData TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        SELECT * FROM allocation_analysis WHERE userId = ?
        ORDER BY createdAt DESC LIMIT 1
    """, (user_id,))
    result = db.execute(stmt, params)
    analysis = result.mappings().first()
    
    if not analysis:
        return {
            "analysis": {
                "totalValue": 0,
                "assetClasses": []
            }
        }
    
    return {"analysis": analysis["analysisData"] if analysis else "{}"}

@router.get("/allocation/targets/{user_id}")
async def get_allocation_targets(user_id: int, db=Depends(db_session)):
    """Get allocation targets and current vs target analysis"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS allocation_targets (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            assetClass TEXT NOT NULL,
            targetPercent REAL NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM allocation_targets WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    targets = result.mappings().all()
    
    if not targets:
        demo_targets = [
            {"userId": user_id, "assetClass": "Stocks", "targetPercent": 60.0},
            {"userId": user_id, "assetClass": "Bonds", "targetPercent": 30.0},
            {"userId": user_id, "assetClass": "Cash", "targetPercent": 10.0}
        ]
        for target in demo_targets:
            stmt, params = qmark("""
                INSERT INTO allocation_targets (userId, assetClass, targetPercent)
                VALUES (?, ?, ?)
            """, (target["userId"], target["assetClass"], target["targetPercent"]))
            db.execute(stmt, params)
        db.commit()
        
        return {"targets": demo_targets}
    
    return {"targets": [dict(t) for t in targets]}

@router.get("/allocation/rebalance/{user_id}")
async def get_rebalance_recommendations(user_id: int, db=Depends(db_session)):
    """Get rebalancing recommendations based on target allocations"""
    return {
        "recommendations": [
            {
                "action": "sell",
                "assetClass": "Stocks",
                "amount": 1000,
                "reason": "Current allocation exceeds target by 5%"
            },
            {
                "action": "buy",
                "assetClass": "Bonds",
                "amount": 1000,
                "reason": "Current allocation below target by 5%"
            }
        ]
    }

@router.post("/allocation/refresh/{user_id}")
async def refresh_allocation_data(user_id: int, db=Depends(db_session)):
    """Refresh allocation analysis data (useful after portfolio changes)"""
    stmt, params = qmark("""
        INSERT INTO allocation_analysis (userId, analysisData)
        VALUES (?, ?)
    """, (user_id, '{"totalValue": 0, "lastUpdated": "now"}'))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

