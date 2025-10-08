"""Test Stripe webhook handler"""
import os
import sys
import pytest
from unittest.mock import patch, MagicMock

os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test_db")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

from fastapi.testclient import TestClient
from server.main import app

client = TestClient(app)


def test_webhook_requires_signature():
    """Test that webhook rejects requests without signature"""
    response = client.post("/api/billing/webhook", json={"type": "test"})
    assert response.status_code in [400, 500]


def test_webhook_rejects_invalid_signature():
    """Test that webhook rejects invalid signatures"""
    with patch("stripe.Webhook.construct_event") as mock_construct:
        mock_construct.side_effect = Exception("Invalid signature")
        
        response = client.post(
            "/api/billing/webhook",
            json={"type": "test"},
            headers={"stripe-signature": "invalid"}
        )
        assert response.status_code in [400, 500]


def test_webhook_processes_subscription_created():
    """Test subscription.created event processing"""
    mock_event = {
        "id": "evt_test_123",
        "type": "customer.subscription.created",
        "data": {
            "object": {
                "id": "sub_test_123",
                "customer": "cus_test_123",
                "status": "active",
                "current_period_end": 1700000000,
                "items": {
                    "data": [{
                        "price": {"id": "price_test_nav"}
                    }]
                },
                "metadata": {"user_id": "1"}
            }
        }
    }
    
    with patch("stripe.Webhook.construct_event", return_value=mock_event):
        with patch("server.routes.stripe_webhook.sync_subscription_to_db") as mock_sync:
            response = client.post(
                "/api/billing/webhook",
                json=mock_event,
                headers={"stripe-signature": "valid_sig"}
            )
            
            assert response.status_code == 200
            mock_sync.assert_called_once()


def test_webhook_deduplication():
    """Test that duplicate events are rejected"""
    mock_event = {
        "id": "evt_duplicate_test",
        "type": "customer.subscription.updated",
        "data": {"object": {"id": "sub_123", "metadata": {"user_id": "1"}}}
    }
    
    with patch("stripe.Webhook.construct_event", return_value=mock_event):
        response1 = client.post(
            "/api/billing/webhook",
            json=mock_event,
            headers={"stripe-signature": "valid"}
        )
        
        response2 = client.post(
            "/api/billing/webhook",
            json=mock_event,
            headers={"stripe-signature": "valid"}
        )
        
        assert response2.json().get("status") == "duplicate"
