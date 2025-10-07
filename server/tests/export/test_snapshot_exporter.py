"""
Tests for snapshot_exporter.py
"""
import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
import tempfile
import shutil
from server.services.snapshot_exporter import (
    generate_json_snapshot,
    generate_csv_snapshot,
    generate_pdf_snapshot,
    create_snapshot
)


@pytest.fixture
def sample_data():
    return {
        "positions": [
            {
                "symbol": "AAPL",
                "quantity": 100,
                "avg_price": 150.0,
                "current_price": 175.0,
                "market_value": 17500.0,
                "unrealized_pnl": 2500.0,
                "weight_pct": 45.0
            },
            {
                "symbol": "MSFT",
                "quantity": 50,
                "avg_price": 300.0,
                "current_price": 350.0,
                "market_value": 17500.0,
                "unrealized_pnl": 2500.0,
                "weight_pct": 45.0
            }
        ],
        "overlays": {
            "concentration": {
                "concentration": "High",
                "hhi": 4050,
                "top_holdings": [{"symbol": "AAPL", "weight_pct": 45.0}]
            },
            "drawdown": {
                "max_drawdown_pct": 15.5,
                "current_drawdown_pct": 5.2
            }
        },
        "summary": {
            "total_positions": 2,
            "total_value": 35000.0,
            "unrealized_pnl": 5000.0
        }
    }


def test_generate_json_snapshot(sample_data):
    """Test JSON snapshot generation"""
    content, checksum = generate_json_snapshot(sample_data)
    
    assert len(content) > 0
    assert len(checksum) == 64
    assert '"AAPL"' in content
    assert '"MSFT"' in content


def test_generate_csv_snapshot(sample_data):
    """Test CSV snapshot generation"""
    positions = sample_data['positions']
    content, checksum = generate_csv_snapshot(positions)
    
    assert len(content) > 0
    assert len(checksum) == 64
    assert 'symbol,quantity' in content
    assert 'AAPL' in content
    assert 'MSFT' in content


def test_generate_pdf_snapshot(sample_data):
    """Test PDF snapshot generation"""
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "test.pdf")
        checksum = generate_pdf_snapshot(sample_data, pdf_path)
        
        assert os.path.exists(pdf_path)
        assert os.path.getsize(pdf_path) > 0
        assert len(checksum) == 64


def test_create_snapshot_full(sample_data):
    """Test complete snapshot creation"""
    with tempfile.TemporaryDirectory() as tmpdir:
        artifacts = create_snapshot(1, sample_data, tmpdir)
        
        assert 'json' in artifacts
        assert 'csv' in artifacts
        assert 'pdf' in artifacts
        
        for format_type, info in artifacts.items():
            assert os.path.exists(info['path'])
            assert len(info['checksum']) == 64
            assert os.path.getsize(info['path']) > 0


def test_checksum_stability(sample_data):
    """Test that checksums are deterministic"""
    content1, checksum1 = generate_json_snapshot(sample_data)
    content2, checksum2 = generate_json_snapshot(sample_data)
    
    assert checksum1 == checksum2
