"""
Tests for timestamp normalization helper
"""

import os
import sys

os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")
os.environ.setdefault("STACKMOTIVE_DEV_MODE", "true")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

from datetime import datetime, timezone
from server.services.federation_registry import _iso8601


def test_iso8601_handles_datetime_naive():
    dt = datetime(2025, 1, 2, 3, 4, 5)  # naive
    s = _iso8601(dt)
    assert "2025-01-02T03:04:05" in s


def test_iso8601_handles_datetime_aware():
    dt = datetime(2025, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    s = _iso8601(dt)
    assert s.endswith("+00:00")


def test_iso8601_handles_string_space_offset():
    s = _iso8601("2025-01-02 03:04:05+00")
    assert s.endswith("+00:00")


def test_iso8601_handles_string_z():
    s = _iso8601("2025-01-02T03:04:05Z")
    assert s.endswith("+00:00")


def test_iso8601_none_is_none():
    assert _iso8601(None) is None
