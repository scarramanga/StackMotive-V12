"""
Tier Enforcement Middleware

Simplified version ported from V11 - removed Redis dependency for surgical V12 integration.
Enforces tier-based access control on protected routes.
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from typing import Dict, Set
import logging
import re

from server.database import get_db
from server.models.user import User

logger = logging.getLogger(__name__)


TIER_HIERARCHY = {
    "observer": 0,
    "participant": 1,
    "builder": 2,
    "sovereign": 3
}

TIER_LIMITS = {
    "observer": {"api_calls_per_day": 100, "features": ["basic_portfolio", "basic_analytics"]},
    "participant": {"api_calls_per_day": 1000, "features": ["advanced_portfolio", "signals", "rebalance"]},
    "builder": {"api_calls_per_day": 10000, "features": ["all_participant", "custom_strategies", "api_access"]},
    "sovereign": {"api_calls_per_day": -1, "features": ["all_features", "priority_support", "institutional_data"]}
}

ROUTE_TIER_REQUIREMENTS: Dict[str, str] = {
    "/api/congressional/recent-trades": "sovereign",
    "/api/congressional/top-traders": "sovereign",
    "/api/congressional/trading-activity": "sovereign",
    "/api/darkpool/flow": "sovereign",
    "/api/darkpool/sentiment": "sovereign",
    "/api/institutional/holdings": "sovereign",
    "/api/institutional/flows": "sovereign",
    "/api/whale/activities": "builder",
    "/api/whale/tracking": "builder",
    "/api/strategy/custom": "builder",
    "/api/strategy/backtest": "builder",
    "/api/strategy/overlays": "builder",
    "/api/ai/summary": "participant",
    "/api/ai/explain": "builder",
    "/api/ai-rebalance": "participant",
    "/api/signals": "participant",
    "/api/kucoin/accounts": "premium",
    "/api/kucoin/fills": "premium",
    "/api/portfolio/loader/csv": "builder",
    "/api/import/ibkr-flex": "builder",
    "/api/export/snapshot": "builder",
    "/api/vault/push": "builder",
    "/api/macro/summary": "participant",
}

PUBLIC_ROUTES: Set[str] = {
    "/api/login",
    "/api/register",
    "/api/refresh-token",
    "/api/health",
    "/api/docs",
    "/api/redoc",
    "/api/openapi.json",
    "/",
}


def route_matches_pattern(route: str, pattern: str) -> bool:
    """Check if a route matches a pattern (supports wildcards)"""
    regex_pattern = pattern.replace("*", ".*")
    return bool(re.match(f"^{regex_pattern}$", route))


def get_required_tier(route: str) -> str:
    """Get the required tier for a route"""
    for pattern, tier in ROUTE_TIER_REQUIREMENTS.items():
        if route_matches_pattern(route, pattern):
            return tier
    return "observer"


async def get_effective_tier(user_id: str, db: Session) -> str:
    """
    Get the effective tier for a user.
    Simplified version without Redis tourism sessions.
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.subscription_tier:
            return user.subscription_tier.lower()
        
        return "observer"
    
    except Exception as e:
        logger.error(f"Error getting effective tier for user {user_id}: {e}")
        return "observer"


def user_has_tier_access(user_tier: str, required_tier: str) -> bool:
    """Check if user's tier meets the required tier"""
    user_level = TIER_HIERARCHY.get(user_tier.lower(), 0)
    required_level = TIER_HIERARCHY.get(required_tier.lower(), 0)
    return user_level >= required_level


class TierEnforcementMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce tier-based access control"""
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        if path in PUBLIC_ROUTES or path.startswith("/api/docs") or path.startswith("/api/redoc"):
            return await call_next(request)
        
        if not path.startswith("/api/"):
            return await call_next(request)
        
        required_tier = get_required_tier(path)
        
        if required_tier == "observer":
            return await call_next(request)
        
        authorization = request.headers.get("Authorization")
        if not authorization:
            raise HTTPException(
                status_code=401,
                detail="Authentication required"
            )
        
        try:
            token = authorization.split(" ")[1] if " " in authorization else authorization
            
            db = next(get_db())
            try:
                user = await get_current_user_from_token(token, db)
                
                user_tier = await get_effective_tier(str(user.id), db)
                
                if not user_has_tier_access(user_tier, required_tier):
                    raise HTTPException(
                        status_code=403,
                        detail=f"Access denied. Required tier: {required_tier}, your tier: {user_tier}"
                    )
                
                request.state.user = user
                request.state.user_tier = user_tier
                
            finally:
                db.close()
            
            return await call_next(request)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in tier enforcement: {e}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error during tier check"
            )


async def get_current_user_from_token(token: str, db: Session) -> User:
    """Extract user from JWT token"""
    from jose import jwt, JWTError
    from server.config.env import AUTH_SECRET_KEY, AUTH_ALGO
    
    try:
        payload = jwt.decode(token, AUTH_SECRET_KEY, algorithms=[AUTH_ALGO])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
