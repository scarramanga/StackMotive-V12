"""
Health monitoring endpoints for liveness and readiness probes.
Based on StackMotive-V11 health endpoints with simplified implementation for V12.
"""
import os
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import redis
from sqlalchemy import create_engine, text
from server.services.metrics import metrics_collector


logger = logging.getLogger(__name__)
router = APIRouter(tags=["Health"])

limiter = Limiter(key_func=get_remote_address)


@router.get("/health/live")
@limiter.limit("10/minute")
async def health_live(request: Request):
    """Liveness probe - returns 200 if service is running"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.get("/health/ready")
@limiter.limit("10/minute")
async def health_ready(request: Request):
    """
    Readiness probe - checks DB and Redis connectivity.
    Returns 200 if ready, 503 if not ready.
    """
    db_timeout_ms = int(os.getenv("HEALTH_DB_TIMEOUT_MS", "800"))
    redis_timeout_ms = int(os.getenv("HEALTH_REDIS_TIMEOUT_MS", "500"))
    
    db_ok = False
    redis_ok = False
    errors = []
    
    try:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            engine = create_engine(
                database_url, 
                pool_pre_ping=True, 
                connect_args={"connect_timeout": db_timeout_ms / 1000}
            )
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1")).fetchone()
                if result and result[0] == 1:
                    db_ok = True
        else:
            errors.append("DATABASE_URL not configured")
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        errors.append(f"database: {str(e)}")
    
    try:
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            r = redis.Redis.from_url(redis_url, socket_connect_timeout=redis_timeout_ms / 1000)
            r.ping()
            redis_ok = True
        else:
            redis_ok = True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        errors.append(f"redis: {str(e)}")
    
    ready = db_ok and redis_ok
    
    if not ready:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "db": "ok" if db_ok else "fail",
                "redis": "ok" if redis_ok else "fail",
                "errors": errors
            }
        )
    
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "db": "ok",
        "redis": "ok"
    }


@router.get("/metrics")
@limiter.limit("10/minute")
async def get_metrics(request: Request):
    """Expose application metrics for monitoring"""
    metrics = metrics_collector.get_metrics()
    return metrics
