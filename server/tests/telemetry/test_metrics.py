"""Test metrics collection and exposition"""
import pytest
from fastapi.testclient import TestClient
from server.main import app
from server.services.metrics import metrics_collector


client = TestClient(app)


def test_metrics_endpoint_accessible():
    """Test that /metrics endpoint is accessible"""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "error_count" in data
    assert "avg_response_time_ms" in data


def test_metrics_increment_on_request():
    """Test that metrics increment with requests"""
    initial_metrics = metrics_collector.get_metrics()
    initial_count = initial_metrics["total_requests"]
    
    response = client.get("/api/health/live")
    assert response.status_code == 200
    
    updated_metrics = metrics_collector.get_metrics()
    assert updated_metrics["total_requests"] > initial_count


def test_metrics_are_numeric():
    """Test that all metrics are numeric values"""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data["total_requests"], int)
    assert isinstance(data["error_count"], int)
    assert isinstance(data["avg_response_time_ms"], int)
