"""
Dev-only notification test endpoint
Only mounted when STACKMOTIVE_DEV_MODE=true for E2E testing
"""

from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
import logging
from jose import jwt, JWTError

from server.database import get_db
from server.config.settings import settings
from server.models.user import User
from server.services.rate_limiter import limiter
from server.services.notification_dispatcher import dispatch_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notify", tags=["dev-notifications"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


class DevTestNotification(BaseModel):
    title: str = "Test Alert"
    body: str = "Phase16 evidence"
    data: Dict[str, Any] | None = None


def get_user_from_token(token: str, db: Session) -> User:
    """
    Simple JWT validation for dev endpoint.
    Compatible with tokens created by /api/login which store user.id in 'sub'.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str = payload.get("sub")
        
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Invalid token: no subject")
        
        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
        
    except (JWTError, ValueError) as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/test")
@limiter.limit("20/minute")
async def dev_test_notification(
    request: Request,
    payload: DevTestNotification | None = None,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Send test notification for E2E evidence capture (dev/E2E only)
    
    This endpoint bypasses tier enforcement for E2E testing.
    Only available when STACKMOTIVE_DEV_MODE=true.
    """
    try:
        user = get_user_from_token(token, db)
        
        if payload is None:
            payload = DevTestNotification()
        
        dispatch_notification(
            user_id=user.id,
            event_type="test",
            message=payload.title,
            data={
                "title": payload.title,
                "body": payload.body,
                **(payload.data or {})
            },
            db=db
        )
        
        db.commit()
        
        return {
            "success": True,
            "message": "Dev test notification dispatched",
            "notification": {
                "title": payload.title,
                "body": payload.body
            }
        }
    
    except Exception as e:
        logger.error(f"Error sending dev test notification: {e}")
        return {
            "success": False,
            "error": str(e)
        }
