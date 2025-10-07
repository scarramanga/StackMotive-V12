import pytest
from unittest.mock import Mock, patch, AsyncMock
import httpx
from server.services.kucoin_service import KuCoinService


@pytest.fixture
def kucoin_service():
    return KuCoinService(
        api_key="test_api_key",
        api_secret="test_api_secret",
        api_passphrase="test_passphrase",
    )


@pytest.fixture
def mock_accounts_response():
    return {
        "code": "200000",
        "data": [
            {
                "type": "trade",
                "currency": "BTC",
                "balance": "0.5",
                "available": "0.5",
            },
            {
                "type": "trade",
                "currency": "ETH",
                "balance": "2.0",
                "available": "2.0",
            },
            {
                "type": "trade",
                "currency": "USDT",
                "balance": "5000.0",
                "available": "5000.0",
            },
        ],
    }


@pytest.fixture
def mock_fills_response():
    return {
        "code": "200000",
        "data": {
            "items": [
                {
                    "tradeId": "trade123",
                    "orderId": "order123",
                    "symbol": "BTC-USDT",
                    "side": "buy",
                    "price": "45000.00",
                    "size": "0.1",
                    "funds": "4500.00",
                    "fee": "4.5",
                    "feeRate": "0.001",
                    "feeCurrency": "USDT",
                    "liquidity": "taker",
                    "createdAt": 1633024800000,
                }
            ]
        },
    }


def test_generate_signature(kucoin_service):
    timestamp = "1633024800000"
    method = "GET"
    endpoint = "/api/v1/accounts"
    
    signature = kucoin_service._generate_signature(timestamp, method, endpoint)
    
    assert isinstance(signature, str)
    assert len(signature) > 0


def test_get_headers(kucoin_service):
    headers = kucoin_service._get_headers("GET", "/api/v1/accounts")
    
    assert "KC-API-SIGN" in headers
    assert "KC-API-TIMESTAMP" in headers
    assert "KC-API-KEY" in headers
    assert headers["KC-API-KEY"] == "test_api_key"
    assert "KC-API-PASSPHRASE" in headers
    assert headers["KC-API-KEY-VERSION"] == "2"
    assert headers["Content-Type"] == "application/json"


@pytest.mark.asyncio
async def test_get_accounts_success(kucoin_service, mock_accounts_response):
    mock_response = Mock()
    mock_response.json.return_value = mock_accounts_response
    mock_response.raise_for_status = Mock()
    
    with patch("server.services.kucoin_service.request_with_retry") as mock_retry:
        mock_retry.return_value = mock_response
        
        result = await kucoin_service.get_accounts(user_id=1)
    
    assert "error" not in result
    assert result["source"] == "kucoin"
    assert len(result["holdings"]) == 2
    assert result["holdings"][0]["symbol"] == "BTC"
    assert result["holdings"][1]["symbol"] == "ETH"
    assert "USDT" in result["cashBalances"]
    assert result["cashBalances"]["USDT"] == 5000.0
    assert result["totalCash"] == 5000.0


@pytest.mark.asyncio
async def test_get_accounts_api_error(kucoin_service):
    mock_response = Mock()
    mock_response.json.return_value = {
        "code": "400100",
        "msg": "Invalid API key",
    }
    mock_response.raise_for_status = Mock()
    
    with patch("server.services.kucoin_service.request_with_retry") as mock_retry:
        mock_retry.return_value = mock_response
        
        result = await kucoin_service.get_accounts(user_id=1)
    
    assert "error" in result
    assert "Invalid API key" in result["error"]


@pytest.mark.asyncio
async def test_get_accounts_http_error(kucoin_service):
    mock_response = Mock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"
    
    with patch("server.services.kucoin_service.request_with_retry") as mock_retry:
        mock_retry.side_effect = httpx.HTTPStatusError(
            "401", request=Mock(), response=mock_response
        )
        
        result = await kucoin_service.get_accounts(user_id=1)
    
    assert "error" in result
    assert "401" in result["error"]


@pytest.mark.asyncio
async def test_get_fills_success(kucoin_service, mock_fills_response):
    mock_response = Mock()
    mock_response.json.return_value = mock_fills_response
    mock_response.raise_for_status = Mock()
    
    with patch("server.services.kucoin_service.request_with_retry") as mock_retry:
        mock_retry.return_value = mock_response
        
        result = await kucoin_service.get_fills(user_id=1)
    
    assert "error" not in result
    assert result["source"] == "kucoin"
    assert len(result["fills"]) == 1
    assert result["fills"][0]["symbol"] == "BTC-USDT"
    assert result["fills"][0]["side"] == "buy"
    assert result["fills"][0]["price"] == 45000.0


@pytest.mark.asyncio
async def test_get_fills_with_symbol_filter(kucoin_service, mock_fills_response):
    mock_response = Mock()
    mock_response.json.return_value = mock_fills_response
    mock_response.raise_for_status = Mock()
    
    with patch("server.services.kucoin_service.request_with_retry") as mock_retry:
        mock_retry.return_value = mock_response
        
        result = await kucoin_service.get_fills(user_id=1, symbol="BTC-USDT")
        
        mock_retry.assert_called_once()
        call_args = mock_retry.call_args[0][1]
        assert "symbol=BTC-USDT" in call_args
    
    assert "error" not in result


@pytest.mark.asyncio
async def test_get_fills_api_error(kucoin_service):
    mock_response = Mock()
    mock_response.json.return_value = {
        "code": "400100",
        "msg": "Invalid symbol",
    }
    mock_response.raise_for_status = Mock()
    
    with patch("server.services.kucoin_service.request_with_retry") as mock_retry:
        mock_retry.return_value = mock_response
        
        result = await kucoin_service.get_fills(user_id=1)
    
    assert "error" in result
    assert "Invalid symbol" in result["error"]


def test_missing_credentials():
    service = KuCoinService(api_key=None, api_secret=None, api_passphrase=None)
    
    with pytest.raises(ValueError, match="not fully configured"):
        service._get_headers("GET", "/api/v1/accounts")
