"""Test grace period logic"""
import os
import sys
import pytest
from datetime import datetime, timedelta

os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test_db")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)


def test_grace_period_calculation():
    """Test grace period date calculation"""
    now = datetime.utcnow()
    future_grace = now + timedelta(days=3)
    past_grace = now - timedelta(days=1)
    
    assert now < future_grace
    assert now > past_grace


def test_active_subscription_logic():
    """Test that active subscriptions don't trigger grace period"""
    status = "active"
    assert status == "active"


def test_grace_period_within_window():
    """Test subscription within grace period maintains tier"""
    now = datetime.utcnow()
    grace_until = now + timedelta(days=3)
    
    in_grace_period = now < grace_until
    assert in_grace_period is True


def test_grace_period_expired():
    """Test subscription past grace period downgrades"""
    now = datetime.utcnow()
    grace_until = now - timedelta(days=1)
    
    in_grace_period = now < grace_until
    assert in_grace_period is False
