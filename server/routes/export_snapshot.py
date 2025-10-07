"""
Export Snapshot Routes - Portfolio snapshot generation
"""
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks, Body
from typing import Dict, Any, Optional
from server.deps import db_session
from server.services.rate_limiter import limiter
from pydantic import BaseModel
import logging
import os
from datetime import datetime
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter()


class ExportRequest(BaseModel):
    user_id: int
    formats: list[str] = ["json", "csv", "pdf"]


async def generate_snapshot_background(export_id: int, user_id: int, formats: list[str], db):
    """Background task to generate snapshot artifacts"""
    try:
        from server.services.snapshot_exporter import create_snapshot
        from server.services.strategy_engine import get_strategy_overlays
        
        positions_query = text("""
            SELECT symbol, quantity, avg_price, current_price, 
                   market_value, unrealized_pnl, weight_pct
            FROM portfolio_positions
            WHERE userId = :user_id
            ORDER BY market_value DESC
        """)
        positions = db.execute(positions_query, {"user_id": user_id}).mappings().all()
        positions_list = [dict(row) for row in positions]
        
        overlays = get_strategy_overlays(user_id, db)
        
        total_value = sum(p.get('market_value', 0) for p in positions_list)
        unrealized_pnl = sum(p.get('unrealized_pnl', 0) for p in positions_list)
        
        db_data = {
            "positions": positions_list,
            "overlays": overlays,
            "summary": {
                "total_positions": len(positions_list),
                "total_value": total_value,
                "unrealized_pnl": unrealized_pnl
            }
        }
        
        export_dir = os.getenv('EXPORT_DIR', '/tmp/exports')
        artifacts = create_snapshot(user_id, db_data, export_dir)
        
        artifact_paths = {k: v['path'] for k, v in artifacts.items()}
        checksums = {k: v['checksum'] for k, v in artifacts.items()}
        
        update_query = text("""
            UPDATE export_jobs
            SET status = 'completed',
                finished_at = :finished_at,
                artifact_path = :artifact_path,
                checksum = :checksum
            WHERE id = :export_id
        """)
        db.execute(update_query, {
            "export_id": export_id,
            "finished_at": datetime.utcnow(),
            "artifact_path": str(artifact_paths),
            "checksum": str(checksums)
        })
        db.commit()
        
    except Exception as e:
        logger.error(f"Error generating snapshot for export {export_id}: {e}")
        update_query = text("""
            UPDATE export_jobs
            SET status = 'failed', finished_at = :finished_at
            WHERE id = :export_id
        """)
        db.execute(update_query, {
            "export_id": export_id,
            "finished_at": datetime.utcnow()
        })
        db.commit()


@router.post("/export/snapshot")
@limiter.limit("10/minute")
async def create_export_snapshot(
    request: Request,
    background_tasks: BackgroundTasks,
    data: ExportRequest = Body(...),
    db = Depends(db_session)
):
    """
    Create portfolio snapshot export job (operator+ tier)
    Generates JSON, CSV, and PDF artifacts in background
    """
    try:
        insert_query = text("""
            INSERT INTO export_jobs (userId, status, format)
            VALUES (:user_id, 'queued', :format)
            RETURNING id
        """)
        result = db.execute(insert_query, {
            "user_id": data.user_id,
            "format": ",".join(data.formats)
        })
        db.commit()
        
        export_id = result.fetchone()[0]
        
        background_tasks.add_task(
            generate_snapshot_background,
            export_id,
            data.user_id,
            data.formats,
            db
        )
        
        return {
            "status": "success",
            "exportId": export_id,
            "message": "Export job queued"
        }
        
    except Exception as e:
        logger.error(f"Error creating export job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/snapshot/{export_id}")
@limiter.limit("10/minute")
async def get_export_snapshot(
    request: Request,
    export_id: int,
    db = Depends(db_session)
):
    """
    Get export snapshot status and download links (operator+ tier)
    """
    try:
        query = text("""
            SELECT id, userId, status, format, created_at, 
                   finished_at, artifact_path, checksum
            FROM export_jobs
            WHERE id = :export_id
        """)
        result = db.execute(query, {"export_id": export_id}).mappings().first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Export job not found")
        
        job = dict(result)
        
        return {
            "status": "success",
            "data": {
                "exportId": job['id'],
                "userId": job['userId'],
                "status": job['status'],
                "formats": job['format'].split(','),
                "createdAt": job['created_at'].isoformat() if job['created_at'] else None,
                "finishedAt": job['finished_at'].isoformat() if job['finished_at'] else None,
                "artifacts": eval(job['artifact_path']) if job['artifact_path'] else None,
                "checksums": eval(job['checksum']) if job['checksum'] else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting export job {export_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
