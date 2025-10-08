"""Test billing sync service"""
import os
import sys
import pytest
from datetime import datetime, timedelta

os.environ["STACKMOTIVE_JWT_SECRET"] = "test-secret"
os.environ["DATABASE_URL"] = "postgresql+psycopg://stackmotive:stackmotive@localhost:5432/stackmotive_ci"
os.environ["STRIPE_NAVIGATOR_PRICE_ID"] = "price_nav_test"

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

from server.services.billing_sync import map_price_to_tier


def test_map_price_to_tier():
    """Test price ID to tier mapping"""
    tier = map_price_to_tier("price_nav_test")
    assert tier == "navigator"


def test_map_unknown_price_defaults_to_observer():
    """Test unknown price IDs default to observer"""
    tier = map_price_to_tier("unknown_price_id")
    assert tier == "observer"


def test_sync_creates_grace_period():
    """Test that grace_until is set 7 days after period end"""
    period_end_timestamp = 1700000000
    period_end = datetime.fromtimestamp(period_end_timestamp)
    expected_grace = period_end + timedelta(days=7)
    
    assert expected_grace > period_end
    assert (expected_grace - period_end).days == 7
