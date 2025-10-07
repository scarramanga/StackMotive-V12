"""
Rate limit smoke test - verifies slowapi integration
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

from fastapi.testclient import TestClient
from server.main import app

client = TestClient(app)


def test_rate_limit_enforced():
    """Test that rate limiting returns 429 after exceeding limits"""
    responses = [client.get("/auth/ping") for _ in range(65)]
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes, f"Expected 429 in responses, got {set(status_codes)}"
