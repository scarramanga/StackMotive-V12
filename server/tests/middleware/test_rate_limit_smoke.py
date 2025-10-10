"""
Rate limit smoke test - verifies slowapi integration

Root Cause:
- slowapi uses wall-clock time with sliding windows
- TestClient requests execute synchronously in sequence
- Time-based windows can cause flaky behavior in CI

Fix:
- Use test-specific storage backend with deterministic counter
- Override limiter only for this test (no production impact)
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import time
from fastapi import APIRouter, Request
from fastapi.testclient import TestClient
from server.main import app
from slowapi import Limiter
from slowapi.util import get_remote_address


class FakeRateLimitStorage:
    """
    Test-only in-memory storage that uses deterministic counters.
    Bypasses time-based sliding windows for reliable test assertions.
    """
    def __init__(self):
        self.hits = {}
        self.expires = {}
        self.fake_time = 0  # Monotonic counter instead of wall clock
    
    def incr(self, key: str, expiry: int, elastic_expiry: bool = False):
        """Increment counter for key"""
        # Clean expired keys
        self.hits[key] = self.hits.get(key, 0) + 1
        if key not in self.expires:
            self.expires[key] = self.fake_time + expiry
        return self.hits[key]
    
    def get(self, key: str):
        """Get current count for key"""
        # Check if expired
        if key in self.expires and self.fake_time >= self.expires[key]:
            self.hits.pop(key, None)
            self.expires.pop(key, None)
            return 0
        return self.hits.get(key, 0)
    
    def clear(self, key: str):
        """Clear key"""
        self.hits.pop(key, None)
        self.expires.pop(key, None)
    
    def reset(self):
        """Reset all state"""
        self.hits.clear()
        self.expires.clear()
        self.fake_time = 0


# Test-only: Create deterministic limiter
fake_storage = FakeRateLimitStorage()
test_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
    storage_uri="memory://",  # In-memory but we'll override the storage
)
test_limiter._storage = fake_storage


def _mount_test_ping(app):
    """Mount a test-only /api/ping endpoint limited by the test limiter."""
    router = APIRouter()

    @router.get("/api/ping")
    @app.state.limiter.limit("60/minute")
    async def _test_ping(request: Request):
        return {"ok": True}

    # include router and return a handle so we can clean up later
    app.include_router(router, prefix="")
    return router


def _unmount_router(app, router):
    """Remove routes added by router (best-effort cleanup)."""
    # Filter out routes introduced by this router
    added_paths = {r.path for r in router.routes}
    app.router.routes = [r for r in app.router.routes if getattr(r, "path", None) not in added_paths]
    # Clear any rate limit tracking for these routes
    if hasattr(app.state.limiter, '_route_limits'):
        for route_path in added_paths:
            app.state.limiter._route_limits.pop(route_path, None)
    if hasattr(app.state.limiter, '__marked_for_limiting'):
        # Clear marked functions for these routes
        keys_to_remove = [k for k in app.state.limiter.__marked_for_limiting.keys() if '/api/ping' in k]
        for key in keys_to_remove:
            app.state.limiter.__marked_for_limiting.pop(key, None)


def test_rate_limit_enforced():
    """
    Test that rate limiting returns 429 after exceeding limits.
    
    Uses test-only storage override to make assertions deterministic.
    Does NOT affect production rate limiting behavior.
    """
    # Override app's limiter for this test only
    original_limiter = app.state.limiter
    app.state.limiter = test_limiter
    fake_storage.reset()
    
    test_router = _mount_test_ping(app)
    
    try:
        client = TestClient(app)
        
        # Send 65 requests (limit is 60/minute)
        responses = []
        for i in range(65):
            # Increment fake time slightly to simulate sequential requests
            fake_storage.fake_time += 0.1
            resp = client.get("/api/ping")
            responses.append(resp)
        
        status_codes = [r.status_code for r in responses]
        
        # First 60 should succeed (200)
        # Requests 61-65 should be rate limited (429)
        successful = status_codes.count(200)
        rate_limited = status_codes.count(429)
        
        assert successful == 60, f"Expected 60 successful requests, got {successful}"
        assert rate_limited == 5, f"Expected 5 rate-limited requests, got {rate_limited}"
        assert 429 in status_codes, f"Expected 429 in responses, got {set(status_codes)}"
        
    finally:
        # Unmount test router
        _unmount_router(app, test_router)
        # Restore original limiter
        app.state.limiter = original_limiter
        fake_storage.reset()


def test_rate_limit_window_independence():
    """
    Test that rate limits don't leak across independent test runs.
    Ensures clean state between tests.
    """
    # Override app's limiter for this test only
    original_limiter = app.state.limiter
    app.state.limiter = test_limiter
    fake_storage.reset()
    
    test_router = _mount_test_ping(app)
    
    try:
        client = TestClient(app)
        
        # First batch - should all succeed
        fake_storage.fake_time = 0
        batch1 = [client.get("/api/ping") for _ in range(10)]
        assert all(r.status_code == 200 for r in batch1)
        
        # Reset and start new window
        fake_storage.reset()
        
        # Second batch - should also succeed (clean state)
        batch2 = [client.get("/api/ping") for _ in range(10)]
        assert all(r.status_code == 200 for r in batch2)
        
    finally:
        # Unmount test router
        _unmount_router(app, test_router)
        # Restore original limiter
        app.state.limiter = original_limiter
        fake_storage.reset()
