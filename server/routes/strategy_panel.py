"""
Strategy Panel Routes - Strategy overlays for operator+ tier
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any
from server.deps import db_session
from server.main import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/strategy/overlays")
@limiter.limit("10/minute")
async def get_strategy_overlays(
    request: Request,
    user_id: int = 1,
    db = Depends(db_session)
):
    """
    Get strategy overlays for portfolio (operator+ tier)
    Returns momentum, volatility, concentration, and drawdown metrics
    """
    try:
        from server.services.strategy_engine import get_strategy_overlays
        
        overlays = get_strategy_overlays(user_id, db)
        
        return {
            "status": "success",
            "data": overlays
        }
        
    except Exception as e:
        logger.error(f"Error getting strategy overlays: {e}")
        raise HTTPException(status_code=500, detail=str(e))
