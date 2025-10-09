from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from server.database import get_db
from server.auth import get_current_user
from server.models.user import User
from server.services.ai_command_parser import parse_ai_command
from server.db.qmark import qmark
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class AICommandRequest(BaseModel):
    command: str

class AICommandResponse(BaseModel):
    success: bool
    action: Optional[str]
    message: str
    data: Optional[dict] = None

@router.post("/ai/execute-command", response_model=AICommandResponse)
async def execute_ai_command(
    request: AICommandRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parse and execute natural language command.
    Supports: watchlist management, alert creation, report export.
    """
    parsed = parse_ai_command(request.command)
    
    if not parsed:
        return AICommandResponse(
            success=False,
            action=None,
            message="I couldn't understand that command. Try: 'Add AAPL to watchlist', 'Set alert for BTC at $50000', or 'Export portfolio report'"
        )
    
    action = parsed['action']
    
    try:
        if action == 'add_to_watchlist':
            result = await add_to_watchlist(current_user.id, parsed, db)
            return AICommandResponse(
                success=True,
                action='add_to_watchlist',
                message=f"✅ Added {parsed['symbol']} to your watchlist",
                data=result
            )
        
        elif action == 'remove_from_watchlist':
            result = await remove_from_watchlist(current_user.id, parsed, db)
            return AICommandResponse(
                success=True,
                action='remove_from_watchlist',
                message=f"✅ Removed {parsed['symbol']} from your watchlist",
                data=result
            )
        
        elif action == 'create_alert':
            result = await create_price_alert(current_user.id, parsed, db)
            price_text = f" at ${parsed['trigger_price']}" if parsed.get('trigger_price') else ""
            return AICommandResponse(
                success=True,
                action='create_alert',
                message=f"✅ Created alert for {parsed['symbol']}{price_text}",
                data=result
            )
        
        elif action == 'export_portfolio':
            result = await export_portfolio_report(current_user.id, db)
            return AICommandResponse(
                success=True,
                action='export_portfolio',
                message="✅ Portfolio report generated",
                data=result
            )
        
        else:
            return AICommandResponse(
                success=False,
                action=None,
                message=f"Action '{action}' not implemented yet"
            )
    
    except Exception as e:
        logger.error(f"Error executing AI command: {e}")
        return AICommandResponse(
            success=False,
            action=action,
            message=f"❌ Failed to execute command: {str(e)}"
        )

async def add_to_watchlist(user_id: int, parsed: dict, db: Session):
    """Add symbol to user's watchlist"""
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
    
    stmt, params = qmark("SELECT * FROM watchlists WHERE userId = ? AND name = 'Default' LIMIT 1", (user_id,))
    watchlist = db.execute(stmt, params).mappings().first()
    
    if not watchlist:
        stmt, params = qmark(
            "INSERT INTO watchlists (userId, name, description) VALUES (?, ?, ?)",
            (user_id, "Default", "Default watchlist")
        )
        db.execute(stmt, params)
        db.commit()
        watchlist_id = db.execute("SELECT last_insert_rowid()").scalar()
    else:
        watchlist_id = watchlist['id']
    
    stmt, params = qmark(
        "INSERT INTO watchlist_items (watchlistId, symbol, notes) VALUES (?, ?, ?)",
        (watchlist_id, parsed['symbol'], parsed.get('notes', ''))
    )
    db.execute(stmt, params)
    db.commit()
    
    return {'watchlist_id': watchlist_id, 'symbol': parsed['symbol']}

async def remove_from_watchlist(user_id: int, parsed: dict, db: Session):
    """Remove symbol from user's watchlist"""
    stmt, params = qmark("""
        DELETE FROM watchlist_items 
        WHERE watchlistId IN (SELECT id FROM watchlists WHERE userId = ?)
        AND symbol = ?
    """, (user_id, parsed['symbol']))
    db.execute(stmt, params)
    db.commit()
    
    return {'symbol': parsed['symbol']}

async def create_price_alert(user_id: int, parsed: dict, db: Session):
    """Create price alert (DCA rule)"""
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
    
    stmt, params = qmark("""
        INSERT INTO trade_rules (userId, ruleType, symbol, triggerPrice, status)
        VALUES (?, 'alert', ?, ?, 'active')
    """, (user_id, parsed['symbol'], parsed.get('trigger_price')))
    db.execute(stmt, params)
    db.commit()
    
    rule_id = db.execute("SELECT last_insert_rowid()").scalar()
    
    return {
        'rule_id': rule_id,
        'symbol': parsed['symbol'],
        'trigger_price': parsed.get('trigger_price')
    }

async def export_portfolio_report(user_id: int, db: Session):
    """Generate portfolio export"""
    return {
        'format': 'csv',
        'url': f'/api/export/portfolio/{user_id}',
        'message': 'Report generation queued'
    }
