# Price & Market Data Fetch Module Audit

**Scope:**
- Modules: `market_data.py`, `market-data.ts`, KuCoin/IBKR/Kraken connectors, and any Yahoo, CoinGecko, KuCoin, or IBKR data sources.
- Checks: Try/except error handling, retry/fallback logic, safe defaults, and logging on fetch failure.
- **Read-only audit. No code changes made.**

---

## 1. `server/routes/market_data.py`
- **Source of data:** Uses `MOCK_PRICES` (static, in-memory, not external API).
- **Error handling:**
  - For `/market/price/{symbol}`: Raises `HTTPException(404)` if symbol not found.
  - No try/except for external fetches (none present).
- **Retry/fallback:** N/A (no external API calls).
- **Logging:** N/A.
- **Safe defaults:** Returns 404 for missing symbol; otherwise, always returns mock data.
- **Gaps:** No real API fetch, so no error handling or retry needed in current state.

---

## 2. `server/services/market-data.ts` (from backup, not live server)
- **Yahoo Finance fetch:**
  - `getStockPrice(symbol)` and `getStockHistoricalData(symbol, ...)` use `axios.get` to Yahoo endpoints.
  - **Error handling:** All fetches are wrapped in `try/catch`. On error, logs to `console.error` and returns simulated/mock data.
  - **Retry/fallback:** No retry logic, but fallback to simulated data is present.
  - **Logging:** All errors are logged with symbol context.
  - **Safe defaults:** Simulated data is returned on failure.
- **CoinGecko fetch:**
  - `getCryptoPrice(symbol)` and `getCryptoHistoricalData(symbol, ...)` use `axios.get` to CoinGecko endpoints.
  - **Error handling:** All fetches are wrapped in `try/catch`. On error, logs to `console.error` and returns simulated/mock data.
  - **Retry/fallback:** No retry logic, but fallback to simulated data is present.
  - **Logging:** All errors are logged with symbol context.
  - **Safe defaults:** Simulated data is returned on failure.
- **Gaps:** No retry/backoff for transient errors. No structured error reporting (just logs and fallback).

---

## 3. `server/brokers/connectors/kucoin-connector.ts`
- **API fetches:**
  - Uses `axios` for all KuCoin REST API calls.
  - **Error handling:**
    - All major fetches (connect, getAccountInfo, getPositions, etc.) are wrapped in `try/catch`.
    - On error, logs to `console.error` and either throws or returns error status.
    - For price fetches inside `getPositions`, if price fetch fails, logs a warning and uses `0` as fallback.
  - **Retry/fallback:** No retry logic. Fallback to `0` for price if fetch fails.
  - **Logging:** All errors and warnings are logged with context.
  - **Safe defaults:** Uses `0` for price if fetch fails; returns empty arrays or error status for failed calls.
- **Gaps:** No retry/backoff for transient errors. No structured error reporting (just logs and fallback).

---

## 4. `server/brokers/connectors/ibkr-connector.ts`
- **API fetches:**
  - Uses `axios` for all IBKR REST API calls.
  - **Error handling:**
    - All major fetches (connect, getAccountInfo, getPositions, etc.) are wrapped in `try/catch`.
    - On error, logs to `console.error` and throws a new error with a generic message.
  - **Retry/fallback:** No retry logic. No fallback data (errors are thrown).
  - **Logging:** All errors are logged with context.
  - **Safe defaults:** None; errors propagate up.
- **Gaps:** No retry/backoff for transient errors. No fallback data (unlike CoinGecko/Yahoo logic).

---

## 5. `server/brokers/connectors/kraken-connector.ts`
- **API fetches:**
  - Uses `axios` for all Kraken REST API calls.
  - **Error handling:**
    - All major fetches (connect, getAccountInfo, getPositions, etc.) are wrapped in `try/catch`.
    - On error, logs to `console.error` and throws a new error with a generic message.
    - For price fetches inside `getPositions`, if price fetch fails, logs a warning and uses `0` as fallback.
  - **Retry/fallback:** No retry logic. Fallback to `0` for price if fetch fails.
  - **Logging:** All errors and warnings are logged with context.
  - **Safe defaults:** Uses `0` for price if fetch fails; errors propagate up for other failures.
- **Gaps:** No retry/backoff for transient errors. No structured error reporting (just logs and fallback).

---

## 6. Other modules
- **No `price_lookup.py` or `asset_registry.py` found in the current codebase.**
- **No direct Yahoo, CoinGecko, KuCoin, or IBKR fetch logic found in live Python modules.**

---

# Summary Table
| Module                                 | Try/Except | Retry | Fallback/Default | Logging         |
|-----------------------------------------|:----------:|:-----:|:----------------:|:---------------|
| `market_data.py` (FastAPI route)        |   N/A*     |  N/A  | 404/mock only    | N/A            |
| `market-data.ts` (Yahoo/CoinGecko)     |   Yes      |  No   | Simulated data   | Yes            |
| `kucoin-connector.ts`                  |   Yes      |  No   | 0/empty on fail  | Yes            |
| `ibkr-connector.ts`                    |   Yes      |  No   | None (throws)    | Yes            |
| `kraken-connector.ts`                  |   Yes      |  No   | 0/empty on fail  | Yes            |

\* No external fetches in current Python route; only mock data.

---

# Integrity & Gaps
- **All major TypeScript connectors and services use try/catch and log errors.**
- **Fallbacks are present for CoinGecko/Yahoo (simulated data) and for price fetches in KuCoin/Kraken (0 as fallback).**
- **No retry/backoff logic is present in any module.**
- **No structured error reporting (beyond logging) is present.**
- **Python FastAPI route uses only mock data, so no fetch error handling is needed.**

---

**End of audit. No code changes made.** 