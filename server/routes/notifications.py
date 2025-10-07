"""
Notifications API Routes
Handles notification listing and test notifications
Real-time delivery via Socket.IO at /socket.io/
"""

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
import logging

from server.database import get_db
from server.auth import get_current_user
from server.middleware.tier_enforcement import enforce_tier
from slowapi import Limiter
from slowapi.util import get_remote_address

from server.services.notification_dispatcher import dispatch_notification, get_notification_stats

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
limiter = Limiter(key_func=get_remote_address)


class TestNotification(BaseModel):
    message: str
    data: Dict[str, Any] | None = None


@router.get("")
@limiter.limit("20/minute")
async def list_notifications(
    request: Request,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("participant"))
):
    """
    List recent notifications (participant+)
    
    Returns recent notifications from audit log.
    Real-time notifications are delivered via Socket.IO.
    """
    try:
        from server.services.audit_logger import get_activity
        
        user_id = current_user["user_id"]
        
        activity = get_activity(
            db,
            user_id,
            action_filter="notification_",
            limit=min(limit, 100)
        )
        
        notifications = [
            {
                "id": entry["id"],
                "action": entry["action"].replace("notification_", ""),
                "created_at": entry["created_at"]
            }
            for entry in activity
            if entry["action"].startswith("notification_")
        ]
        
        return {
            "success": True,
            "notifications": notifications,
            "count": len(notifications)
        }
    
    except Exception as e:
        logger.error(f"Error listing notifications for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to list notifications")


@router.post("/test")
@limiter.limit("20/minute")
async def send_test_notification(
    request: Request,
    payload: TestNotification,
    db: Session = Depends(get_db),
    current_user: dict = Depends(enforce_tier("operator"))
):
    """
    Send test notification (operator+)
    
    Dispatches a test notification via Socket.IO to verify delivery.
    """
    try:
        user_id = current_user["user_id"]
        
        dispatch_notification(
            user_id=user_id,
            event_type="test",
            message=payload.message or "This is a test notification",
            data=payload.data,
            db=db
        )
        
        db.commit()
        
        return {
            "success": True,
            "message": "Test notification dispatched",
            "event_type": "test"
        }
    
    except Exception as e:
        logger.error(f"Error sending test notification for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send test notification")


@router.get("/stats")
@limiter.limit("20/minute")
async def get_stats(
    request: Request,
    current_user: dict = Depends(enforce_tier("operator"))
):
    """
    Get notification dispatcher statistics (operator+)
    
    Returns queue size, batch window, and other metrics.
    """
    try:
        stats = get_notification_stats()
        
        return {
            "success": True,
            "stats": stats
        }
    
    except Exception as e:
        logger.error(f"Error fetching notification stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


@router.websocket("/ws")
async def websocket_notifications_deprecated(websocket: WebSocket):
    """
    Deprecated WebSocket endpoint
    
    This endpoint is deprecated. Use Socket.IO at /socket.io/ instead.
    Kept for backward compatibility during migration period.
    """
    await websocket.accept()
    
    await websocket.send_json({
        "type": "deprecation_warning",
        "message": "This WebSocket endpoint is deprecated. Please use Socket.IO at /socket.io/ for real-time notifications.",
        "socket_io_path": "/socket.io/",
        "migration_guide": "https://socket.io/docs/v4/client-api/"
    })
    
    logger.warning("Client connected to deprecated /ws endpoint")
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("Client disconnected from deprecated /ws endpoint")
