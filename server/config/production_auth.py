"""
StackMotive Production Auth Configuration

Production-safe JWT secret management with automatic dev mode fallback.
Imported from V11 for enterprise consolidation.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def is_dev_mode() -> bool:
    """Check if running in development mode"""
    return os.getenv("STACKMOTIVE_DEV_MODE", "").lower() in ("true", "1", "yes")


def get_jwt_secret() -> str:
    """
    Get JWT secret key from environment.
    Falls back to dev secret only in dev mode.
    
    Raises:
        ValueError: If in production and secret not set
    """
    secret = os.getenv("STACKMOTIVE_JWT_SECRET")
    
    if secret:
        return secret
    
    if is_dev_mode():
        logger.warning("Using dev JWT secret - DO NOT USE IN PRODUCTION")
        return "dev-secret-key-change-in-production"
    
    raise ValueError(
        "STACKMOTIVE_JWT_SECRET environment variable must be set in production. "
        "Generate with: openssl rand -hex 32"
    )


def get_jwt_refresh_secret() -> str:
    """
    Get JWT refresh token secret from environment.
    Falls back to dev secret only in dev mode.
    
    Raises:
        ValueError: If in production and secret not set
    """
    secret = os.getenv("STACKMOTIVE_JWT_REFRESH_SECRET")
    
    if secret:
        return secret
    
    if is_dev_mode():
        logger.warning("Using dev JWT refresh secret - DO NOT USE IN PRODUCTION")
        return "dev-refresh-secret-key-change-in-production"
    
    raise ValueError(
        "STACKMOTIVE_JWT_REFRESH_SECRET environment variable must be set in production. "
        "Generate with: openssl rand -hex 32"
    )


def get_jwt_algorithm() -> str:
    """Get JWT algorithm from environment, defaults to HS256"""
    return os.getenv("STACKMOTIVE_JWT_ALGORITHM", "HS256")


def get_access_token_expire_minutes() -> int:
    """Get access token expiration in minutes"""
    return int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


def get_refresh_token_expire_days() -> int:
    """Get refresh token expiration in days"""
    return int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))


def get_jwt_issuer() -> str:
    """Get JWT issuer claim"""
    return os.getenv("STACKMOTIVE_JWT_ISSUER", "stackmotive.com")


def get_jwt_audience() -> str:
    """Get JWT audience claim"""
    return os.getenv("STACKMOTIVE_JWT_AUDIENCE", "stackmotive-app")
