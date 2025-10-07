from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from server.deps import db_session
from server.db.qmark import qmark, qmark_many

router = APIRouter()


@router.get("/rules/user/{user_id}")
async def get_user_trade_rules(user_id: int, db=Depends(db_session)):
    """Get all trade rules for a user"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS trade_rules (
            id INTEGER PRIMARY KEY,
            userId INTEGER NOT NULL,
            ruleType TEXT NOT NULL,
            symbol TEXT,
            amount REAL,
            frequency TEXT,
            triggerPrice REAL,
            status TEXT DEFAULT 'active',
            executionMethod TEXT DEFAULT 'market',
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM trade_rules WHERE userId = ? ORDER BY createdAt DESC", (user_id,))
    result = db.execute(stmt, params)
    rules = result.mappings().all()
    
    return {"rules": [dict(r) for r in rules]}

@router.post("/rules/save")
async def save_trade_rule(rule: dict, db=Depends(db_session)):
    """Save or update a trade rule"""
    stmt, params = qmark("""
        INSERT INTO trade_rules (userId, ruleType, symbol, amount, frequency, triggerPrice, status, executionMethod)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        rule.get("userId"),
        rule.get("ruleType"),
        rule.get("symbol"),
        rule.get("amount"),
        rule.get("frequency"),
        rule.get("triggerPrice"),
        rule.get("status", "active"),
        rule.get("executionMethod", "market")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "ruleId": db.execute("SELECT last_insert_rowid()").scalar()}

@router.put("/rules/{rule_id}")
async def update_trade_rule(rule_id: int, rule: dict, db=Depends(db_session)):
    """Update an existing trade rule"""
    stmt, params = qmark("""
        UPDATE trade_rules 
        SET symbol = ?, amount = ?, frequency = ?, triggerPrice = ?, status = ?, executionMethod = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        rule.get("symbol"),
        rule.get("amount"),
        rule.get("frequency"),
        rule.get("triggerPrice"),
        rule.get("status"),
        rule.get("executionMethod"),
        rule_id
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.delete("/rules/{rule_id}/{user_id}")
async def delete_trade_rule(rule_id: int, user_id: int, db=Depends(db_session)):
    """Delete a trade rule"""
    stmt, params = qmark("DELETE FROM trade_rules WHERE id = ? AND userId = ?", (rule_id, user_id))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True}

@router.post("/rules/execute/{rule_id}")
async def execute_trade_rule(rule_id: int, execution: dict, db=Depends(db_session)):
    """Execute a trade rule (simulate execution)"""
    stmt, params = qmark("""
        CREATE TABLE IF NOT EXISTS rule_execution_history (
            id INTEGER PRIMARY KEY,
            ruleId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            executedAt TEXT DEFAULT CURRENT_TIMESTAMP,
            executionType TEXT,
            symbol TEXT,
            quantity REAL,
            price REAL,
            status TEXT,
            notes TEXT
        )
    """, ())
    db.execute(stmt, params)
    db.commit()
    
    stmt, params = qmark("SELECT * FROM trade_rules WHERE id = ?", (rule_id,))
    result = db.execute(stmt, params)
    rule = result.mappings().first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    stmt, params = qmark("""
        INSERT INTO rule_execution_history (ruleId, userId, executionType, symbol, quantity, price, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        rule_id,
        rule["userId"],
        execution.get("executionType", "manual"),
        rule["symbol"],
        execution.get("quantity", rule["amount"]),
        execution.get("price"),
        "completed",
        execution.get("notes", "")
    ))
    db.execute(stmt, params)
    db.commit()
    
    return {"success": True, "executionId": db.execute("SELECT last_insert_rowid()").scalar()}

@router.get("/rules/history/{user_id}")
async def get_rule_execution_history(user_id: int, limit: int = 20, db=Depends(db_session)):
    """Get execution history for user's rules"""
    stmt, params = qmark("""
        SELECT * FROM rule_execution_history 
        WHERE userId = ? 
        ORDER BY executedAt DESC 
        LIMIT ?
    """, (user_id, limit))
    result = db.execute(stmt, params)
    history = result.mappings().all()
    
    return {"history": [dict(h) for h in history]}

@router.post("/rules/check-triggers/{user_id}")
async def check_rule_triggers(user_id: int, db=Depends(db_session)):
    """Check if any rules should be triggered based on current market conditions"""
    stmt, params = qmark("""
        SELECT * FROM trade_rules 
        WHERE userId = ? AND status = 'active'
    """, (user_id,))
    result = db.execute(stmt, params)
    rules = result.mappings().all()
    
    triggered = []
    for rule in rules:
        if rule["ruleType"] == "dca" and rule["frequency"]:
            triggered.append({"ruleId": rule["id"], "reason": "DCA schedule triggered", "symbol": rule["symbol"]})
    
    return {"triggeredRules": triggered, "count": len(triggered)}

@router.get("/rules/analytics/{user_id}")
async def get_rule_analytics(user_id: int, db=Depends(db_session)):
    """Get analytics for user's trade rules"""
    stmt, params = qmark("SELECT COUNT(*) as total FROM trade_rules WHERE userId = ?", (user_id,))
    total = db.execute(stmt, params).scalar()
    
    stmt, params = qmark("SELECT COUNT(*) as active FROM trade_rules WHERE userId = ? AND status = 'active'", (user_id,))
    active = db.execute(stmt, params).scalar()
    
    stmt, params = qmark("SELECT COUNT(*) as executed FROM rule_execution_history WHERE userId = ?", (user_id,))
    executed = db.execute(stmt, params).scalar()
    
    return {
        "totalRules": total or 0,
        "activeRules": active or 0,
        "totalExecutions": executed or 0
    }

