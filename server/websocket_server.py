"""
WebSocket Server for StackMotive V12
Provides real-time notification delivery with JWT authentication and tier-based access control
Ported from V11 with Redis manager for multi-instance scaling
"""

import socketio
import logging
import os
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Set, Any, Optional
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

connected_clients: Dict[str, Dict[str, Any]] = {}

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
mgr = socketio.AsyncRedisManager(redis_url)

sio = socketio.AsyncServer(
    async_mode="asgi",
    client_manager=mgr,
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

socket_app = socketio.ASGIApp(socketio_server=sio, socketio_path="/socket.io/")


class CircuitBreaker:
    """Simple circuit breaker for fault tolerance"""
    def __init__(self, failure_threshold=5, recovery_timeout=30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = "closed"
    
    def allow_request(self) -> bool:
        if self.state == "closed":
            return True
        
        if self.state == "open":
            if self.last_failure_time and (datetime.now() - self.last_failure_time).seconds >= self.recovery_timeout:
                self.state = "half-open"
                return True
            return False
        
        return True
    
    def record_success(self):
        self.failures = 0
        self.state = "closed"
    
    def record_failure(self):
        self.failures += 1
        self.last_failure_time = datetime.now()
        if self.failures >= self.failure_threshold:
            self.state = "open"
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            "state": self.state,
            "failures": self.failures,
            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time else None
        }


class WebSocketRateLimiter:
    """Rate limiter for WebSocket events"""
    def __init__(self):
        self.events = {}
        self.cleanup_interval = 60
    
    async def allow_request(self, key: str, limit: int = 10, window: int = 60) -> bool:
        now = datetime.now()
        cutoff = now - timedelta(seconds=window)
        
        if key not in self.events:
            self.events[key] = []
        
        self.events[key] = [ts for ts in self.events[key] if ts > cutoff]
        
        if len(self.events[key]) >= limit:
            return False
        
        self.events[key].append(now)
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            "tracked_keys": len(self.events),
            "total_events": sum(len(v) for v in self.events.values())
        }


class MessageDeduplicator:
    """Deduplicates messages within a time window"""
    def __init__(self, window_seconds: int = 120):
        self.window_seconds = window_seconds
        self.messages = {}
    
    def generate_message_hash(self, event_type: str, data: dict) -> str:
        content = f"{event_type}:{str(sorted(data.items()))}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    async def is_duplicate(self, message_hash: str) -> bool:
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_seconds)
        
        self.messages = {k: v for k, v in self.messages.items() if v > cutoff}
        
        if message_hash in self.messages:
            return True
        
        return False
    
    async def add_message(self, message_hash: str):
        self.messages[message_hash] = datetime.now()
    
    async def start(self):
        logger.info("Message deduplicator started")
    
    async def stop(self):
        logger.info("Message deduplicator stopped")
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            "tracked_messages": len(self.messages),
            "window_seconds": self.window_seconds
        }


websocket_circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30)
websocket_rate_limiter = WebSocketRateLimiter()
message_deduplicator = MessageDeduplicator(window_seconds=120)


def verify_jwt(token: str, db) -> tuple[Optional[dict], Optional[str]]:
    """Verify JWT token and return user_id and tier (V12-compatible)"""
    if not token:
        return None, None
    
    try:
        from server.config.settings import settings
        from server.models.user import User
        
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        email = payload.get("sub")
        if not email:
            logger.warning("JWT token missing 'sub' field")
            return None, None
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"User not found for email: {email}")
            return None, None
        
        user_tier = payload.get("tier") or getattr(user, "tier", "navigator")
        
        return {"user_id": user.id}, user_tier
    
    except JWTError as e:
        logger.warning(f"JWT validation failed: {e}")
        return None, None
    except Exception as e:
        logger.error(f"Error verifying JWT: {e}")
        return None, None


@sio.event
async def connect(sid, environ, auth):
    """Handle client connection with strict JWT authentication"""
    from server.database import SessionLocal
    
    db = SessionLocal()
    try:
        token = None
        
        if auth and isinstance(auth, dict):
            token = auth.get("token")
        
        if not token:
            query_string = environ.get("QUERY_STRING", "")
            for param in query_string.split("&"):
                if param.startswith("token="):
                    token = param.split("=", 1)[1]
                    break
        
        if not token:
            logger.warning(f"[WebSocket] Connection rejected - no token provided: {sid}")
            return False
        
        user, tier = verify_jwt(token, db)
        if not user or not tier:
            logger.warning(f"[WebSocket] Connection rejected - invalid token: {sid}")
            return False
        
        user_id = user["user_id"]
        
        connected_clients[sid] = {
            "user_id": user_id,
            "tier": tier,
            "subscriptions": set(),
            "connected_at": datetime.now().isoformat(),
        }
        
        logger.info(f"[WebSocket] Client connected: {sid} (user: {user_id}, tier: {tier})")
        
        await sio.emit(
            "connected",
            {
                "message": "Connected to StackMotive WebSocket",
                "tier": tier,
                "timestamp": datetime.now().isoformat(),
            },
            to=sid,
        )
        
        return True
    
    except Exception as e:
        logger.error(f"[WebSocket] Connection error for {sid}: {e}")
        return False
    finally:
        db.close()


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    if sid in connected_clients:
        client_data = connected_clients[sid]
        logger.info(f"[WebSocket] Client disconnected: {sid} (user: {client_data.get('user_id')})")
        del connected_clients[sid]
    else:
        logger.info(f"[WebSocket] Unknown client disconnected: {sid}")


@sio.event
async def subscribe_notifications(sid, data):
    """Subscribe to user-specific notifications"""
    if sid not in connected_clients:
        await sio.emit("error", {"message": "Not authenticated"}, to=sid)
        return
    
    client_data = connected_clients[sid]
    client_data["subscriptions"].add("notifications")
    
    logger.info(f"[WebSocket] Client {sid} subscribed to notifications")
    await sio.emit(
        "notifications_subscribed",
        {"message": "Subscribed to notifications"},
        to=sid
    )


@sio.event
async def unsubscribe_notifications(sid, data):
    """Unsubscribe from notifications"""
    if sid not in connected_clients:
        return
    
    client_data = connected_clients[sid]
    client_data["subscriptions"].discard("notifications")
    
    logger.info(f"[WebSocket] Client {sid} unsubscribed from notifications")
    await sio.emit("notifications_unsubscribed", {"message": "Unsubscribed from notifications"}, to=sid)


async def broadcast_notification(user_id: int, notification_type: str, message: str, data: Optional[dict] = None):
    """Broadcast notification to specific user with circuit breaker protection"""
    if not websocket_circuit_breaker.allow_request():
        logger.warning(f"[WebSocket] Circuit breaker open, skipping notification for user {user_id}")
        return
    
    try:
        rate_limit_key = f"notification:{user_id}"
        if not await websocket_rate_limiter.allow_request(rate_limit_key, limit=20, window=60):
            logger.warning(f"[WebSocket] Rate limit exceeded for user {user_id}")
            return
        
        notification_data = {
            "type": notification_type,
            "message": message,
            "data": data or {},
            "timestamp": datetime.now().isoformat()
        }
        
        message_hash = message_deduplicator.generate_message_hash(notification_type, notification_data)
        if await message_deduplicator.is_duplicate(message_hash):
            logger.debug(f"[WebSocket] Duplicate notification skipped for user {user_id}")
            return
        
        target_clients = [
            sid for sid, client_data in connected_clients.items()
            if client_data.get("user_id") == user_id
            and "notifications" in client_data.get("subscriptions", set())
        ]
        
        if target_clients:
            await sio.emit("notification", notification_data, to=target_clients)
            await message_deduplicator.add_message(message_hash)
            websocket_circuit_breaker.record_success()
            
            logger.info(f"[WebSocket] Broadcasted notification to user {user_id} ({len(target_clients)} clients)")
    
    except Exception as e:
        websocket_circuit_breaker.record_failure()
        logger.error(f"[WebSocket] Error broadcasting notification for user {user_id}: {e}")
        raise


def get_connection_metrics():
    """Get WebSocket connection metrics"""
    connections_by_tier = {}
    total_subscriptions = {}
    
    for client_data in connected_clients.values():
        tier = client_data.get("tier", "unknown")
        connections_by_tier[tier] = connections_by_tier.get(tier, 0) + 1
        
        for subscription in client_data.get("subscriptions", set()):
            total_subscriptions[subscription] = total_subscriptions.get(subscription, 0) + 1
    
    return {
        "total_connections": len(connected_clients),
        "connections_by_tier": connections_by_tier,
        "subscriptions": total_subscriptions,
        "circuit_breaker_stats": websocket_circuit_breaker.get_stats(),
        "rate_limiter_stats": websocket_rate_limiter.get_stats(),
        "deduplicator_stats": message_deduplicator.get_stats(),
        "timestamp": datetime.now().isoformat(),
    }


async def initialize_websocket_services():
    """Initialize WebSocket supporting services"""
    await message_deduplicator.start()
    logger.info("WebSocket services initialized")


async def cleanup_websocket_services():
    """Cleanup WebSocket supporting services"""
    await message_deduplicator.stop()
    logger.info("WebSocket services cleaned up")
