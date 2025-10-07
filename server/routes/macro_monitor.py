from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/macro/insights/{user_id}")
async def get_macro_insights(user_id: int, limit: int = 10, db=Depends(db_session)):
    """Get latest macro signals and AI insights"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS macro_insights (
            id INTEGER PRIMARY KEY,
            userId INTEGER,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            sentiment TEXT,
            impact TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    demo_insights = [
        (None, "Fed Policy", "Interest Rate Decision Pending", "Fed expected to hold rates steady", "neutral", "high"),
        (None, "Economic Data", "Jobs Report Strong", "Unemployment remains low at 3.8%", "positive", "medium"),
        (None, "Global Markets", "China GDP Growth Slows", "Q3 growth misses expectations", "negative", "high")
    ]
    
    stmt, params = qmark("SELECT COUNT(*) FROM macro_insights", ())
    count = db.execute(stmt, params).scalar()
    
    if count == 0:
        for user, cat, title, content, sent, impact in demo_insights:
            stmt, params = qmark("""
                INSERT INTO macro_insights (userId, category, title, content, sentiment, impact)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user, cat, title, content, sent, impact))
            db.execute(stmt, params)
        db.commit()
    
    stmt, params = qmark("""
        SELECT * FROM macro_insights 
        WHERE userId IS NULL OR userId = ?
        ORDER BY createdAt DESC 
        LIMIT ?
    """, (user_id, limit))
    result = db.execute(stmt, params)
    insights = result.mappings().all()
    
    return {"insights": [dict(i) for i in insights]}

@router.post("/macro/alert")
async def create_macro_alert(alert: dict, db=Depends(db_session)):
    """Create a macro alert for a user"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS macro_alerts (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            alertType TEXT NOT NULL,
            condition TEXT NOT NULL,
            threshold REAL,
            enabled INTEGER DEFAULT 1,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("""
        INSERT INTO macro_alerts (userId, alertType, condition, threshold, enabled)
        VALUES (?, ?, ?, ?, ?)
    """, (
        alert.get("userId"),
        alert.get("alertType"),
        alert.get("condition"),
        alert.get("threshold"),
        alert.get("enabled", 1)
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "alertId": db.execute("SELECT last_insert_rowid()").scalar()}

@router.get("/macro/alerts/{user_id}")
async def get_macro_alerts(user_id: int, db=Depends(db_session)):
    """Get all macro alerts for a user"""
    stmt, params = qmark("SELECT * FROM macro_alerts WHERE userId = ?", (user_id,))
    result = db.execute(stmt, params)
    alerts = result.mappings().all()
    
    return {"alerts": [dict(a) for a in alerts]}

@router.post("/macro/refresh")
async def refresh_macro_data(db=Depends(db_session)):
    """Refresh macro data (simulate fetching from external sources)"""
    stmt, params = qmark("""
        UPDATE macro_insights 
        SET createdAt = CURRENT_TIMESTAMP 
        WHERE userId IS NULL
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "refreshedAt": datetime.utcnow().isoformat()}

@router.get("/macro/dashboard/{user_id}")
async def get_macro_dashboard(user_id: int, db=Depends(db_session)):
    """Get comprehensive macro dashboard data"""
    stmt, params = qmark("""
        SELECT * FROM macro_insights 
        WHERE userId IS NULL OR userId = ?
        ORDER BY createdAt DESC 
        LIMIT 20
    """, (user_id,))
    result = db.execute(stmt, params)
    insights = result.mappings().all()
    
    stmt, params = qmark("SELECT * FROM macro_alerts WHERE userId = ? AND enabled = 1", (user_id,))
    result = db.execute(stmt, params)
    alerts = result.mappings().all()
    
    return {
        "insights": [dict(i) for i in insights],
        "alerts": [dict(a) for a in alerts],
        "summary": {
            "totalInsights": len(insights),
            "activeAlerts": len(alerts)
        }
    }

