"""
Scheduler Service
Provides helpers for ops cron jobs with concurrency guards
"""

import logging
from typing import Dict, Any
from sqlalchemy.orm import Session

from server.services.ingest_pipeline import run_full_sync
from server.services.reconciliation_engine import run_reconciliation

logger = logging.getLogger(__name__)


async def run_full_sync_with_reconciliation(
    db: Session,
    user_id: int,
    trigger: str = "scheduled"
) -> Dict[str, Any]:
    """
    Run full sync followed by reconciliation
    
    This is the main entry point for scheduled jobs
    
    Returns combined summary
    """
    try:
        sync_result = await run_full_sync(db, user_id, trigger)
        sync_run_id = sync_result["sync_run_id"]
        
        reconciliation_result = run_reconciliation(db, sync_run_id, user_id)
        
        return {
            "sync": sync_result,
            "reconciliation": reconciliation_result
        }
        
    except Exception as e:
        logger.error(f"Scheduled sync failed for user {user_id}: {e}")
        raise
