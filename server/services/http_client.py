"""
Shared HTTP client with retry logic and timeouts
Used by data import adapters (IBKR, KuCoin)
"""
import asyncio
import math
import random
from typing import Callable, Awaitable, Dict, Any, Optional
import httpx

DEFAULT_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
RETRYABLE_STATUS = {429, 500, 502, 503, 504}

async def _sleep_backoff(attempt: int, base: float = 0.25, cap: float = 4.0) -> None:
    delay = min(cap, base * (2 ** attempt))
    jitter = delay * (0.5 * (random.random() - 0.5))
    await asyncio.sleep(max(0.0, delay + jitter))

async def request_with_retry(
    method: str,
    url: str,
    *,
    client: Optional[httpx.AsyncClient] = None,
    max_attempts: int = 4,
    timeout: httpx.Timeout = DEFAULT_TIMEOUT,
    retry_on: Optional[set] = None,
    **kwargs: Dict[str, Any],
) -> httpx.Response:
    """
    Minimal async retry wrapper for httpx.
    Retries on network errors and retryable HTTP status codes.
    """
    retry_on = retry_on or RETRYABLE_STATUS
    owns_client = client is None
    if owns_client:
        client = httpx.AsyncClient(timeout=timeout, headers={"User-Agent": "StackMotive/Phase6"})
    try:
        last_exc = None
        for attempt in range(max_attempts):
            try:
                resp = await client.request(method, url, **kwargs)
                if resp.status_code in retry_on:
                    _ = resp.text
                    raise httpx.HTTPStatusError(
                        f"Retryable status {resp.status_code}",
                        request=resp.request,
                        response=resp,
                    )
                return resp
            except (httpx.TransportError, httpx.TimeoutException, httpx.HTTPStatusError) as e:
                last_exc = e
                if attempt == max_attempts - 1:
                    raise
                await _sleep_backoff(attempt)
        raise last_exc if last_exc else RuntimeError("request_with_retry fell through")
    finally:
        if owns_client:
            await client.aclose()
