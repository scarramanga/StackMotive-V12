"""
Test JWT issuance and verification alignment

Ensures tokens issued by auth.py contain the correct claims
and are accepted by websocket_server.py verify_jwt()
"""
import pytest
from datetime import timedelta
from jose import jwt

from server.auth import create_access_token
from server.websocket_server import verify_jwt
from server.config.production_auth import (
    get_jwt_secret,
    get_jwt_issuer,
    get_jwt_audience,
    get_jwt_algorithm
)


def test_issued_token_contains_required_claims():
    """Test that create_access_token includes iss and aud claims"""
    token = create_access_token(
        data={"sub": "test@example.com", "tier": "participant"},
        expires_delta=timedelta(minutes=30)
    )
    
    # Decode without verification to inspect claims
    unverified = jwt.get_unverified_claims(token)
    
    assert "iss" in unverified, "Token missing issuer (iss) claim"
    assert "aud" in unverified, "Token missing audience (aud) claim"
    assert "sub" in unverified, "Token missing subject (sub) claim"
    assert "exp" in unverified, "Token missing expiration (exp) claim"
    assert "jti" in unverified, "Token missing JWT ID (jti) claim"
    assert "type" in unverified, "Token missing type claim"
    
    assert unverified["iss"] == get_jwt_issuer(), f"Issuer mismatch: {unverified['iss']} != {get_jwt_issuer()}"
    assert unverified["aud"] == get_jwt_audience(), f"Audience mismatch: {unverified['aud']} != {get_jwt_audience()}"
    assert unverified["type"] == "access", "Token type should be 'access'"


def test_websocket_verify_accepts_issued_token():
    """Test that WebSocket verify_jwt() accepts tokens from create_access_token()"""
    user_id = "42"
    tier = "operator"
    
    # Create token the way auth routes do
    token = create_access_token(
        data={"sub": user_id, "tier": tier},
        expires_delta=timedelta(minutes=30)
    )
    
    # Verify using WebSocket verifier
    user, verified_tier = verify_jwt(token)
    
    assert user is not None, "WebSocket verify_jwt() should accept issued token"
    assert "user_id" in user, "Verified user should contain user_id"
    assert user["user_id"] == user_id, f"User ID mismatch: {user['user_id']} != {user_id}"
    assert verified_tier == tier, f"Tier mismatch: {verified_tier} != {tier}"


def test_websocket_rejects_token_without_claims():
    """Test that WebSocket verify_jwt() rejects tokens missing iss/aud"""
    # Create token WITHOUT iss/aud (simulating old behavior)
    secret = get_jwt_secret()
    algorithm = get_jwt_algorithm()
    
    payload = {
        "sub": "test@example.com",
        "tier": "navigator",
        "type": "access"
    }
    
    # Encode WITHOUT iss/aud
    bad_token = jwt.encode(payload, secret, algorithm=algorithm)
    
    # Should be rejected by WebSocket verifier
    user, tier = verify_jwt(bad_token)
    
    assert user is None, "WebSocket should reject token without iss/aud claims"
    assert tier is None, "WebSocket should reject token without iss/aud claims"


def test_config_consistency():
    """Test that all config functions return expected values"""
    issuer = get_jwt_issuer()
    audience = get_jwt_audience()
    algorithm = get_jwt_algorithm()
    secret = get_jwt_secret()
    
    assert issuer == "stackmotive.com", f"Default issuer should be 'stackmotive.com', got {issuer}"
    assert audience == "stackmotive-app", f"Default audience should be 'stackmotive-app', got {audience}"
    assert algorithm == "HS256", f"Default algorithm should be 'HS256', got {algorithm}"
    assert secret is not None and len(secret) > 0, "JWT secret must not be empty"

