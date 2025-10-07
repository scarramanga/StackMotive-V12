"""
Redis caching layer with graceful fallback when REDIS_URL not configured
"""
import os
import json
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL")
redis_client = None

if REDIS_URL:
    try:
        import redis
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        redis_client.ping()
        logger.info(f"Redis connected: {REDIS_URL}")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Caching disabled.")
        redis_client = None


def get_cache(key: str) -> Optional[Any]:
    """Get value from cache, returns None if not found or Redis unavailable"""
    if not redis_client:
        return None
    
    try:
        value = redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.warning(f"Cache get failed for {key}: {e}")
        return None


def set_cache(key: str, value: Any, ttl: int = 60) -> bool:
    """
    Set value in cache with TTL in seconds
    Returns True if successful, False if Redis unavailable
    """
    if not redis_client:
        return False
    
    try:
        redis_client.setex(key, ttl, json.dumps(value))
        return True
    except Exception as e:
        logger.warning(f"Cache set failed for {key}: {e}")
        return False


def delete_cache(key: str) -> bool:
    """Delete key from cache"""
    if not redis_client:
        return False
    
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Cache delete failed for {key}: {e}")
        return False


def get_redis_client():
    """Get the Redis client instance, returns None if unavailable"""
    return redis_client
