"""
Macro Summary Routes - Macro economic regime detection
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from server.services.rate_limiter import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/macro/summary")
@limiter.limit("10/minute")
async def get_macro_summary(request: Request):
    """
    Get macro economic summary and regime detection (navigator+ tier)
    Based on fixture data for deterministic testing
    """
    try:
        from server.services.macro_engine import get_macro_summary
        
        summary = get_macro_summary()
        
        return {
            "status": "success",
            "data": summary
        }
        
    except Exception as e:
        logger.error(f"Error getting macro summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
