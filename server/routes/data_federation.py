"""
Data Federation API Routes
Manages data sources and sync operations
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from server.database import get_db
from server.middleware.tier_enforcement import enforce_tier
from slowapi import Limiter
from slowapi.util import get_remote_address

from server.services.federation_registry import (
    list_sources,
    register_source,
    enable_source,
    disable_source,
    update_source_config
)
from server.services.ingest_pipeline import run_full_sync
from server.services.reconciliation_engine import run_reconciliation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/federation", tags=["data_federation"])
limiter = Limiter(key_func=get_remote_address)


class RegisterSourceRequest(BaseModel):
    source_type: str
    display_name: Optional[str] = None
    config: Dict[str, Any] = {}
    priority: int = 100


class UpdateSourceConfigRequest(BaseModel):
    config: Dict[str, Any]


@router.get("/sources")
@limiter.limit("10/minute")
async def get_sources(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("navigator"))
):
    """
    List all data sources for user (navigator+)
    
    Returns list of configured sources with enabled status and priority
    """
    try:
        user_id = current_user["user_id"]
        sources = list_sources(db, user_id)
        
        return {
            "success": True,
            "sources": sources,
            "count": len(sources)
        }
    
    except Exception as e:
        logger.error(f"Error listing sources for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to list sources")


@router.post("/sources")
@limiter.limit("10/minute")
async def register_data_source(
    request: Request,
    payload: RegisterSourceRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("operator"))
):
    """
    Register new data source (operator+)
    
    Validates config and creates source entry
    """
    try:
        user_id = current_user["user_id"]
        
        source = register_source(
            db,
            user_id,
            payload.source_type,
            payload.display_name,
            payload.config,
            payload.priority
        )
        
        return {
            "success": True,
            "source": source,
            "message": f"Source {payload.source_type} registered successfully"
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error registering source for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to register source")


@router.put("/sources/{source_id}/config")
@limiter.limit("10/minute")
async def update_source_configuration(
    request: Request,
    source_id: int,
    payload: UpdateSourceConfigRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("operator"))
):
    """
    Update source configuration (operator+)
    """
    try:
        user_id = current_user["user_id"]
        
        updated = update_source_config(db, source_id, user_id, payload.config)
        
        if not updated:
            raise HTTPException(status_code=404, detail="Source not found")
        
        return {
            "success": True,
            "source": updated,
            "message": "Configuration updated"
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating source config: {e}")
        raise HTTPException(status_code=500, detail="Failed to update config")


@router.post("/sources/{source_id}/enable")
@limiter.limit("10/minute")
async def enable_data_source(
    request: Request,
    source_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("operator"))
):
    """Enable a data source (operator+)"""
    try:
        user_id = current_user["user_id"]
        success = enable_source(db, source_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Source not found")
        
        return {"success": True, "message": "Source enabled"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enabling source: {e}")
        raise HTTPException(status_code=500, detail="Failed to enable source")


@router.post("/sources/{source_id}/disable")
@limiter.limit("10/minute")
async def disable_data_source(
    request: Request,
    source_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("operator"))
):
    """Disable a data source (operator+)"""
    try:
        user_id = current_user["user_id"]
        success = disable_source(db, source_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Source not found")
        
        return {"success": True, "message": "Source disabled"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disabling source: {e}")
        raise HTTPException(status_code=500, detail="Failed to disable source")


@router.post("/sync")
@limiter.limit("10/minute")
async def trigger_sync(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("operator"))
):
    """
    Trigger on-demand sync (operator+)
    
    Runs ingest for all enabled sources, then reconciliation
    """
    try:
        user_id = current_user["user_id"]
        
        sync_result = await run_full_sync(db, user_id, trigger="api")
        sync_run_id = sync_result["sync_run_id"]
        
        recon_result = run_reconciliation(db, sync_run_id, user_id)
        
        return {
            "success": True,
            "sync_run_id": sync_run_id,
            "status": sync_result["status"],
            "sync_stats": sync_result["stats"],
            "reconciliation": recon_result
        }
    
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.error(f"Error triggering sync for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger sync")


@router.get("/sync/{sync_run_id}")
@limiter.limit("20/minute")
async def get_sync_status(
    request: Request,
    sync_run_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("navigator"))
):
    """
    Get sync run status (navigator+)
    
    Returns status, stats, and reconciliation report
    """
    try:
        from sqlalchemy import text
        
        user_id = current_user["user_id"]
        
        result = db.execute(
            text("""
                SELECT id, user_id, trigger, status, started_at, finished_at, stats
                FROM sync_runs
                WHERE id = :sync_run_id AND user_id = :user_id
            """),
            {"sync_run_id": sync_run_id, "user_id": user_id}
        ).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Sync run not found")
        
        return {
            "success": True,
            "sync_run": {
                "id": result.id,
                "user_id": result.user_id,
                "trigger": result.trigger,
                "status": result.status,
                "started_at": result.started_at.isoformat() if result.started_at else None,
                "finished_at": result.finished_at.isoformat() if result.finished_at else None,
                "stats": result.stats
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sync status: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sync status")
