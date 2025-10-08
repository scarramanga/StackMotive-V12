"""
Reconciliation Engine
Merges staging data to canonical tables using priority/freshness/confidence rules
"""

import logging
from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

SOURCE_CONFIDENCE = {
    "ibkr_flex": 4,
    "kucoin": 3,
    "csv": 2,
    "manual": 1
}


def reconcile_positions(db: Session, sync_run_id: str, user_id: int) -> Dict[str, Any]:
    """
    Reconcile positions from staging to canonical table
    
    Rules (in order):
    1. Priority (lower number = higher priority)
    2. Freshness (newer as_of timestamp)
    3. Confidence (IBKR > KuCoin > CSV > Manual)
    
    Returns summary with counts
    """
    summary = {
        "inserted": 0,
        "updated": 0,
        "skipped": 0,
        "conflicts": []
    }
    
    staging_result = db.execute(
        text("""
            SELECT ps.*, ds.source_type, ds.priority
            FROM positions_staging ps
            JOIN data_sources ds ON ps.source_id = ds.id
            WHERE ps.sync_run_id = :sync_run_id
              AND ps.user_id = :user_id
            ORDER BY ps.symbol, ds.priority ASC, ps.as_of DESC
        """),
        {"sync_run_id": sync_run_id, "user_id": user_id}
    )
    
    staging_positions = list(staging_result)
    
    by_symbol = {}
    for pos in staging_positions:
        symbol = pos.symbol
        if symbol not in by_symbol:
            by_symbol[symbol] = []
        by_symbol[symbol].append(pos)
    
    for symbol, positions in by_symbol.items():
        if len(positions) == 1:
            pos = positions[0]
            _upsert_position(db, user_id, pos)
            summary["inserted"] += 1
            continue
        
        selected = positions[0]
        
        conflict_group = [p for p in positions if p.priority == selected.priority]
        if len(conflict_group) > 1:
            freshest_time = max(p.as_of for p in conflict_group if p.as_of)
            conflict_group = [p for p in conflict_group if p.as_of == freshest_time]
            
            if len(conflict_group) > 1:
                selected = max(
                    conflict_group,
                    key=lambda p: SOURCE_CONFIDENCE.get(p.source_type, 0)
                )
                
                summary["conflicts"].append({
                    "symbol": symbol,
                    "reason": "priority_tie_broken_by_confidence",
                    "selected_source": selected.source_type,
                    "alternatives": [p.source_type for p in conflict_group if p.id != selected.id]
                })
        
        _upsert_position(db, user_id, selected)
        summary["updated"] += 1
    
    db.commit()
    return summary


def _upsert_position(db: Session, user_id: int, pos: Any):
    """Upsert position to canonical table"""
    existing = db.execute(
        text("""
            SELECT id FROM portfolio_positions
            WHERE userId = :user_id AND symbol = :symbol
        """),
        {"user_id": user_id, "symbol": pos.symbol}
    ).fetchone()
    
    if existing:
        db.execute(
            text("""
                UPDATE portfolio_positions
                SET quantity = :quantity,
                    avgCost = :avg_cost,
                    lastUpdated = CURRENT_TIMESTAMP,
                    source = :source
                WHERE userId = :user_id AND symbol = :symbol
            """),
            {
                "user_id": user_id,
                "symbol": pos.symbol,
                "quantity": pos.quantity,
                "avg_cost": pos.avg_cost,
                "source": pos.source_type
            }
        )
    else:
        db.execute(
            text("""
                INSERT INTO portfolio_positions
                (userId, symbol, quantity, avgCost, currentPrice, lastUpdated, source)
                VALUES (:user_id, :symbol, :quantity, :avg_cost, 0, CURRENT_TIMESTAMP, :source)
            """),
            {
                "user_id": user_id,
                "symbol": pos.symbol,
                "quantity": pos.quantity,
                "avg_cost": pos.avg_cost,
                "source": pos.source_type
            }
        )


def reconcile_cash_events(db: Session, sync_run_id: str, user_id: int) -> Dict[str, Any]:
    """
    Reconcile cash events from staging to canonical table
    
    Cash events are append-only; only insert new events
    """
    summary = {
        "inserted": 0,
        "skipped": 0
    }
    
    staging_result = db.execute(
        text("""
            SELECT ces.*, ds.source_type
            FROM cash_events_staging ces
            JOIN data_sources ds ON ces.source_id = ds.id
            WHERE ces.sync_run_id = :sync_run_id
              AND ces.user_id = :user_id
        """),
        {"sync_run_id": sync_run_id, "user_id": user_id}
    )
    
    for event in staging_result:
        existing = db.execute(
            text("""
                SELECT id FROM cash_events
                WHERE userId = :user_id
                  AND eventType = :event_type
                  AND amount = :amount
                  AND eventDate = :event_date
                  AND source = :source
            """),
            {
                "user_id": user_id,
                "event_type": event.event_type,
                "amount": event.amount,
                "event_date": event.event_date,
                "source": event.source_type
            }
        ).fetchone()
        
        if existing:
            summary["skipped"] += 1
            continue
        
        db.execute(
            text("""
                INSERT INTO cash_events
                (userId, eventType, amount, currency, eventDate, source, accountId, description)
                VALUES (:user_id, :event_type, :amount, :currency, :event_date, :source, :account_id, :description)
            """),
            {
                "user_id": user_id,
                "event_type": event.event_type,
                "amount": event.amount,
                "currency": event.currency,
                "event_date": event.event_date,
                "source": event.source_type,
                "account_id": event.account_id,
                "description": event.description
            }
        )
        summary["inserted"] += 1
    
    db.commit()
    return summary


def run_reconciliation(db: Session, sync_run_id: str, user_id: int) -> Dict[str, Any]:
    """
    Run full reconciliation for sync run
    
    Returns combined summary
    """
    positions_summary = reconcile_positions(db, sync_run_id, user_id)
    cash_summary = reconcile_cash_events(db, sync_run_id, user_id)
    
    return {
        "positions": positions_summary,
        "cash": cash_summary,
        "timestamp": datetime.utcnow().isoformat()
    }
