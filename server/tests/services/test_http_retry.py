import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from server.services.http_client import request_with_retry

@pytest.mark.asyncio
async def test_request_with_retry_eventual_success():
    r1 = MagicMock()
    r1.status_code = 503
    r1.text = ""
    r2 = MagicMock()
    r2.status_code = 200
    r2.json.return_value = {"ok": True}
    
    mock_client = AsyncMock()
    mock_client.request = AsyncMock(side_effect=[r1, r2])
    mock_client.aclose = AsyncMock()
    
    with patch("httpx.AsyncClient", return_value=mock_client):
        resp = await request_with_retry("GET", "https://api.example.com/x")
        assert resp.status_code == 200
        assert mock_client.request.call_count == 2
