"""
Shared HTTP client with retry logic and timeouts
Used by data import adapters (IBKR, KuCoin)
"""
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from typing import Optional, Dict, Any


USER_AGENT = "StackMotive/1.0"


class RetryableHTTPError(Exception):
    """HTTP error that should be retried"""
    pass


def _should_retry(exc: Exception) -> bool:
    """Determine if an exception should trigger a retry"""
    if isinstance(exc, httpx.TimeoutException):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return 500 <= exc.response.status_code < 600
    return False


@retry(
    retry=retry_if_exception_type(RetryableHTTPError),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
)
async def _make_request_with_retry(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    **kwargs
) -> httpx.Response:
    """
    Make HTTP request with automatic retry on 5xx and timeouts
    
    Args:
        client: httpx AsyncClient
        method: HTTP method (GET, POST, etc.)
        url: Full URL or path
        **kwargs: Additional arguments for httpx request
    
    Returns:
        httpx.Response
        
    Raises:
        RetryableHTTPError: If request fails after retries
    """
    try:
        response = await client.request(method, url, **kwargs)
        response.raise_for_status()
        return response
    except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
        if _should_retry(e):
            raise RetryableHTTPError(f"Request failed: {e}") from e
        raise


def create_client(
    base_url: str,
    timeout: Optional[float] = 15.0,
    headers: Optional[Dict[str, str]] = None
) -> httpx.AsyncClient:
    """
    Create configured httpx client with timeouts and User-Agent
    
    Args:
        base_url: Base URL for API
        timeout: Request timeout in seconds (default 15)
        headers: Additional headers to include
    
    Returns:
        Configured httpx.AsyncClient
    """
    default_headers = {"User-Agent": USER_AGENT}
    if headers:
        default_headers.update(headers)
    
    return httpx.AsyncClient(
        base_url=base_url,
        timeout=httpx.Timeout(timeout, connect=5.0),
        headers=default_headers,
    )
