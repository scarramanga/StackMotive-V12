"""
AI Summaries Routes - AI-powered portfolio insights
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Body
from typing import Dict, Any
from server.deps import db_session
from server.main import limiter
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class SummaryRequest(BaseModel):
    user_id: int
    include_overlays: bool = True


@router.post("/ai/summary")
@limiter.limit("10/minute")
async def get_ai_summary(
    request: Request,
    data: SummaryRequest = Body(...),
    db = Depends(db_session)
):
    """
    Get AI-powered portfolio summary (navigator+ tier)
    """
    try:
        from server.services.strategy_engine import get_strategy_overlays
        from server.services.ai_orchestrator import summarize_portfolio
        
        overlays = get_strategy_overlays(data.user_id, db)
        
        summary = await summarize_portfolio(overlays)
        
        return {
            "status": "success",
            "summary": summary,
            "overlays": overlays if data.include_overlays else None
        }
        
    except Exception as e:
        logger.error(f"Error generating AI summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/explain")
@limiter.limit("10/minute")
async def get_ai_explanation(
    request: Request,
    data: SummaryRequest = Body(...),
    db = Depends(db_session)
):
    """
    Get detailed AI strategy explanation (operator+ tier)
    """
    try:
        from server.services.strategy_engine import get_strategy_overlays
        from server.services.ai_orchestrator import explain_strategy
        
        overlays = get_strategy_overlays(data.user_id, db)
        
        explanation = await explain_strategy(overlays)
        
        return {
            "status": "success",
            "explanation": explanation,
            "overlays": overlays
        }
        
    except Exception as e:
        logger.error(f"Error generating AI explanation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
