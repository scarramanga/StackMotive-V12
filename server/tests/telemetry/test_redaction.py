"""Test PII redaction in logs"""
import os
import sys

os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")
os.environ.setdefault("STACKMOTIVE_DEV_MODE", "true")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from server.services.logging import redact_pii


def test_redact_email():
    """Test email redaction"""
    message = "User email is test@example.com"
    redacted = redact_pii(message)
    assert "[EMAIL_REDACTED]" in redacted
    assert "test@example.com" not in redacted


def test_redact_phone():
    """Test phone number redaction"""
    message = "Call me at +61412345678"
    redacted = redact_pii(message)
    assert "[PHONE_REDACTED]" in redacted


def test_redact_credit_card():
    """Test credit card redaction"""
    message = "Card: 4532-1234-5678-9010"
    redacted = redact_pii(message)
    assert "[CARD_REDACTED]" in redacted
    assert "4532" not in redacted


def test_redact_jwt():
    """Test JWT token redaction"""
    message = "Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
    redacted = redact_pii(message)
    assert "[JWT_REDACTED]" in redacted
    assert "eyJhbGciOiJ" not in redacted


def test_redact_api_key():
    """Test API key redaction"""
    message = "Key: sk_test_4242424242424242"
    redacted = redact_pii(message)
    assert "[API_KEY_REDACTED]" in redacted
    assert "sk_test" not in redacted


def test_redact_password():
    """Test password field redaction"""
    message = '{"password": "secret123", "user": "test"}'
    redacted = redact_pii(message)
    assert "[REDACTED]" in redacted
    assert "secret123" not in redacted


def test_redact_tfn():
    """Test Australian TFN redaction"""
    message = "TFN: 123-456-789"
    redacted = redact_pii(message)
    assert "[TFN_REDACTED]" in redacted


def test_redact_multiple_patterns():
    """Test multiple PII patterns in one message"""
    message = "Contact user@example.com or call +1234567890 with card 4532-1234-5678-9010"
    redacted = redact_pii(message)
    assert "[EMAIL_REDACTED]" in redacted
    assert "[PHONE_REDACTED]" in redacted
    assert "[CARD_REDACTED]" in redacted
    assert "user@example.com" not in redacted
    assert "4532" not in redacted
