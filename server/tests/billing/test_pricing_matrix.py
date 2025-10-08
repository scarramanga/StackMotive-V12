"""Test pricing matrix"""
import os
import sys
import pytest

os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

from server.services.pricing import get_plan_price, get_tier_level, TIER_PRICING


def test_tier_pricing_consistency():
    """Test that tier prices are consistent"""
    assert TIER_PRICING["observer"] == 0
    assert TIER_PRICING["navigator"] == 29
    assert TIER_PRICING["operator"] == 99
    assert TIER_PRICING["sovereign"] == 299


def test_get_plan_price_monthly():
    """Test monthly price retrieval in cents"""
    price = get_plan_price("navigator", "monthly")
    assert price == 2900


def test_get_plan_price_annual():
    """Test annual price with discount"""
    price = get_plan_price("navigator", "annual")
    assert price == 27800


def test_tier_hierarchy():
    """Test tier level comparison"""
    assert get_tier_level("observer") < get_tier_level("navigator")
    assert get_tier_level("navigator") < get_tier_level("operator")
    assert get_tier_level("operator") < get_tier_level("sovereign")


def test_unknown_tier_defaults_to_zero():
    """Test unknown tiers default to level 0"""
    level = get_tier_level("unknown")
    assert level == 0
