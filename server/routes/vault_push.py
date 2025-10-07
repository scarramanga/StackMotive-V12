"""
Vault Push Routes - Push snapshots to vault storage
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Body
from typing import Dict, Any
from server.deps import db_session
from server.services.rate_limiter import limiter
from pydantic import BaseModel
import logging
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter()


class VaultPushRequest(BaseModel):
    export_id: int


@router.post("/vault/push")
@limiter.limit("10/minute")
async def push_to_vault(
    request: Request,
    data: VaultPushRequest = Body(...),
    db = Depends(db_session)
):
    """
    Push snapshot artifacts to vault storage (operator+ tier)
    """
    try:
        from server.services.vault_client import push_artifacts
        
        query = text("""
            SELECT id, userId, status, artifact_path, checksum
            FROM export_jobs
            WHERE id = :export_id
        """)
        result = db.execute(query, {"export_id": data.export_id}).mappings().first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Export job not found")
        
        job = dict(result)
        
        if job['status'] != 'completed':
            raise HTTPException(
                status_code=400,
                detail=f"Export job not completed (status: {job['status']})"
            )
        
        artifacts = eval(job['artifact_path']) if job['artifact_path'] else {}
        checksums = eval(job['checksum']) if job['checksum'] else {}
        
        artifacts_with_checksums = {
            fmt: {"path": path, "checksum": checksums.get(fmt)}
            for fmt, path in artifacts.items()
        }
        
        vault_locations = push_artifacts(artifacts_with_checksums, job['userId'])
        
        return {
            "status": "success",
            "message": "Artifacts pushed to vault",
            "locations": vault_locations
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pushing to vault: {e}")
        raise HTTPException(status_code=500, detail=str(e))
