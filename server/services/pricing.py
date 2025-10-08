"""Pricing and tier configuration for StackMotive V12"""

TIER_HIERARCHY = {
    "observer": 0,
    "navigator": 1,
    "operator": 2,
    "sovereign": 3
}

TIER_PRICING = {
    "observer": 0,
    "navigator": 29,
    "operator": 99,
    "sovereign": 299
}

TIER_PRICING_ANNUAL = {
    "observer": 0,
    "navigator": 278,
    "operator": 950,
    "sovereign": 2870
}


def get_plan_price(tier: str, cycle: str = "monthly") -> int:
    """Get price for a tier and billing cycle in cents"""
    tier_lower = tier.lower()
    
    if cycle == "annual":
        return TIER_PRICING_ANNUAL.get(tier_lower, 0) * 100
    else:
        return TIER_PRICING.get(tier_lower, 0) * 100


def get_tier_level(tier: str) -> int:
    """Get numeric level for tier comparison"""
    return TIER_HIERARCHY.get(tier.lower(), 0)
