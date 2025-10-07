"""
Rate limit configuration with tier-based limits.
"""
from typing import Dict

TIER_LIMITS: Dict[str, str] = {
    "observer": "30/minute",
    "navigator": "60/minute", 
    "operator": "120/minute",
    "sovereign": "240/minute"
}

DEFAULT_LIMIT = "60/minute"

def get_tier_limit(tier: str) -> str:
    """Get rate limit string for a given tier."""
    return TIER_LIMITS.get(tier.lower(), DEFAULT_LIMIT)
