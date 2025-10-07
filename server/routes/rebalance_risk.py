from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/portfolio/rebalance-risks/{user_id}")
async def get_rebalance_risks_endpoint(
    user_id: str,
    current_user_id: int = 1,
    db=Depends(db_session)
):
    """
    Get rebalance risks for a specific user
    
    Returns top 5 rebalance risks with severity scores and recommended actions.
    """
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS rebalance_risks (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            riskType TEXT NOT NULL,
            severity REAL NOT NULL,
            description TEXT NOT NULL,
            recommendedAction TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        SELECT * FROM rebalance_risks WHERE userId = ?
        ORDER BY severity DESC LIMIT 5
    """, (user_id,))
    result = db.execute(stmt, params)
    risks = result.mappings().all()
    
    if not risks:
        demo_risks = [
            {
                "userId": user_id,
                "riskType": "concentration",
                "severity": 7.5,
                "description": "Portfolio heavily concentrated in tech sector",
                "recommendedAction": "Diversify across multiple sectors"
            },
            {
                "userId": user_id,
                "riskType": "drift",
                "severity": 5.2,
                "description": "Asset allocation has drifted from target",
                "recommendedAction": "Rebalance to match target allocation"
            }
        ]
        
        for risk in demo_risks:
            stmt, params = qmark("""
                INSERT INTO rebalance_risks (userId, riskType, severity, description, recommendedAction)
                VALUES (?, ?, ?, ?, ?)
            """, (risk["userId"], risk["riskType"], risk["severity"], risk["description"], risk["recommendedAction"]))
            db.execute(stmt, params)
        db.commit()
        
        return {"risks": demo_risks}
    
    return {"risks": [dict(r) for r in risks]}

@router.get("/portfolio/risk-summary/{user_id}")
async def get_risk_summary(
    user_id: str,
    current_user_id: int = 1,
    db=Depends(db_session)
):
    """
    Get risk summary for a specific user
    
    Returns aggregated risk metrics and trends.
    """
    stmt, params = qmark("""
        SELECT 
            COUNT(*) as totalRisks,
            AVG(severity) as avgSeverity,
            MAX(severity) as maxSeverity
        FROM rebalance_risks WHERE userId = ?
    """, (user_id,))
    result = db.execute(stmt, params)
    summary = result.mappings().first()
    
    if not summary or summary["totalRisks"] == 0:
        return {
            "summary": {
                "totalRisks": 0,
                "avgSeverity": 0,
                "maxSeverity": 0,
                "trend": "stable"
            }
        }
    
    return {
        "summary": {
            "totalRisks": summary["totalRisks"],
            "avgSeverity": summary["avgSeverity"],
            "maxSeverity": summary["maxSeverity"],
            "trend": "increasing" if summary["avgSeverity"] > 5 else "stable"
        }
    }

