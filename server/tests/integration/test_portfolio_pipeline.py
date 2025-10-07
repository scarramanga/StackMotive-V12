"""
Integration tests for portfolio data pipeline
Tests full flow: IBKR/CSV/KuCoin import → portfolio query → analytics calculation
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from server.services import ingest_orchestrator
from server.db.qmark import qmark


@pytest.fixture
def mock_ibkr_payload():
    """Sample IBKR Flex payload"""
    return {
        "broker": "ibkr",
        "accountId": "U1234567",
        "asOf": "2025-10-07T12:00:00",
        "cashByCcy": {"USD": 5000.0, "NZD": 2000.0},
        "portfolio": {
            "positions": [
                {
                    "symbol": "AAPL",
                    "description": "Apple Inc",
                    "quantity": 10.0,
                    "markPrice": 180.0,
                    "currency": "USD",
                    "valueCcy": 1800.0,
                    "valueBase": 1800.0
                }
            ],
            "totalValue": 1800.0
        },
        "positionsImported": 1
    }


@pytest.fixture
def mock_kucoin_payload():
    """Sample KuCoin accounts payload"""
    return {
        "holdings": [
            {
                "symbol": "BTC",
                "quantity": 0.5,
                "available": 0.5,
                "accountType": "trade",
                "source": "kucoin"
            }
        ],
        "cashBalances": {"USDT": 1000.0},
        "totalCash": 1000.0,
        "source": "kucoin",
        "asOf": "2025-10-07T12:00:00Z"
    }


@pytest.fixture
def test_db():
    """Mock database session for testing"""
    class MockResult:
        def __init__(self, data):
            self.data = data
        
        def mappings(self):
            return self
        
        def first(self):
            return self.data[0] if self.data else None
        
        def all(self):
            return self.data
    
    class MockDB:
        def __init__(self):
            self.committed = False
            self.executed_statements = []
        
        def execute(self, stmt, params):
            self.executed_statements.append((stmt, params))
            return MockResult([])
        
        def commit(self):
            self.committed = True
    
    return MockDB()


@pytest.mark.asyncio
async def test_ibkr_ingest_to_positions(mock_ibkr_payload, test_db):
    """Test IBKR data flows to portfolio_positions table"""
    with patch('server.services.ibkr_flex_service.get_ibkr_portfolio_payload', new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_ibkr_payload
        
        result = await ingest_orchestrator.ingest_ibkr(user_id=1, db=test_db)
        
        assert result["positions"] == 1
        assert result["cashEvents"] == 2
        assert test_db.committed is True
        
        executed_inserts = [stmt for stmt, _ in test_db.executed_statements if "INSERT INTO portfolio_positions" in stmt]
        assert len(executed_inserts) >= 1


@pytest.mark.asyncio
async def test_kucoin_ingest_to_positions(mock_kucoin_payload, test_db):
    """Test KuCoin data flows to portfolio_positions table"""
    with patch('server.services.kucoin_service.KuCoinService') as MockService:
        mock_service = MockService.return_value
        mock_service.get_accounts = AsyncMock(return_value=mock_kucoin_payload)
        
        result = await ingest_orchestrator.ingest_kucoin(user_id=1, db=test_db)
        
        assert result["positions"] == 1
        assert result["cashEvents"] == 1
        assert test_db.committed is True


@pytest.mark.asyncio
async def test_idempotency_check():
    """Test that duplicate imports are detected via digest"""
    payload = {
        "broker": "ibkr",
        "accountId": "U1234567",
        "asOf": "2025-10-07T12:00:00",
        "cashByCcy": {},
        "portfolio": {"positions": [], "totalValue": 0},
        "positionsImported": 0
    }
    
    class MockDBWithDigest:
        def __init__(self):
            self.has_digest = True
        
        def execute(self, stmt, params):
            class Result:
                def mappings(self):
                    return self
                def first(self):
                    return {"importId": "existing_import"} if "import_digests" in stmt else None
            return Result()
        
        def commit(self):
            pass
    
    with patch('server.services.ibkr_flex_service.get_ibkr_portfolio_payload', new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = payload
        
        result = await ingest_orchestrator.ingest_ibkr(user_id=1, db=MockDBWithDigest())
        
        assert result["duplicate"] is True
        assert result["imported"] == 0


def test_compute_batch_digest():
    """Test digest computation for idempotency"""
    digest1 = ingest_orchestrator.compute_batch_digest(
        user_id=1, 
        source="ibkr", 
        positions=[{"symbol": "AAPL"}], 
        timestamp="2025-10-07T12:00:00"
    )
    
    digest2 = ingest_orchestrator.compute_batch_digest(
        user_id=1, 
        source="ibkr", 
        positions=[{"symbol": "AAPL"}], 
        timestamp="2025-10-07T12:00:00"
    )
    
    digest3 = ingest_orchestrator.compute_batch_digest(
        user_id=1, 
        source="ibkr", 
        positions=[{"symbol": "AAPL"}], 
        timestamp="2025-10-07T13:00:00"
    )
    
    assert digest1 == digest2
    assert digest1 != digest3


def test_cache_functions():
    """Test cache functions with no Redis"""
    from server.services.cache import get_cache, set_cache, delete_cache
    
    result = get_cache("test_key")
    assert result is None
    
    success = set_cache("test_key", {"data": "value"}, ttl=60)
    assert success is False
    
    success = delete_cache("test_key")
    assert success is False
