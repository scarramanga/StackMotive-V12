# StackMotive Frontend API Usage Audit

---

## 1. API Usage Patterns
- All HTTP requests are made via `fetch()` or the `apiRequest` utility (which wraps fetch and handles tokens, errors, etc.).
- React Query (`useQuery`, `useMutation`) is used for most data fetching and mutation logic.

---

## 2. Endpoint Mapping & Status

### Confirmed Endpoints (exist in FastAPI backend):
- `/api/user/paper-trading-account` (used in hooks, context, and query functions)
- `/api/user/me` (user context)
- `/api/trades` and `/api/trades/{id}/close` (trades hook)
- `/api/strategy` (strategy builder, not shown in all snippets but referenced)
- `/api/tax/events`, `/api/tax/summary`, `/api/tax/country-info` (tax reporting page)
- `/api/user/trial-status` (trial status hook)
- `/api/broker/historical/{accountId}/{symbol}` (candlestick chart)
- `/api/market/price/crypto/{symbol}`, `/api/market/price/stock/{symbol}` (strategy builder)
- `/api/market/sentiment/{symbol}` (strategy builder)
- `/api/auth/login`, `/api/auth/register` (auth page)
- `/api/login` (login page)
- `/api/test-login/expert_user`, `/api/test-login/scarramanga` (test logins)
- `/api/test-users` (account creation)
- `/api/backtest-sessions` (backtest sessions hook)

### Potential Issues / Outdated or Broken Paths:
- `/api/auth/login` and `/api/login` are both used for login in different places. Only one should be canonical; confirm both exist in FastAPI.
- `/api/test-login/expert_user`, `/api/test-login/scarramanga`, `/api/test-users` are for test/demo/dev flows. Confirm these exist in backend or are stubbed for dev only.
- `/api/market/price/crypto/{symbol}` and `/api/market/price/stock/{symbol}`: Confirm these are implemented in backend (market data routes).
- `/api/market/sentiment/{symbol}`: Confirm this exists in backend.

---

## 3. Error Handling

### Good Practices:
- Most `apiRequest` calls have robust error handling (try/catch, error parsing, toast notifications, etc.).
- React Query hooks handle errors via `onError` or by throwing, which is caught by error boundaries or UI.
- Login and registration forms show toast or set error state on failure.

### Issues Found:
- Some direct `fetch()` calls (e.g., in `strategy-builder.tsx`, `login.tsx`, `create-account-page.tsx`) do not always check `response.ok` before parsing JSON or proceeding.
- Some test/demo login buttons do not handle errors beyond a simple `.catch()` with `console.error`.
- In a few places, error messages are generic (e.g., "Network error"), which may not help users debug issues.

---

## 4. Summary Table

| File/Component                        | Endpoint(s) Used                                 | Error Handling         | Endpoint Exists? |
|---------------------------------------|--------------------------------------------------|-----------------------|------------------|
| `use-paper-trading.ts`                | `/api/user/paper-trading-account`                | try/catch, 404 logic  | Yes              |
| `use-trades.ts`                       | `/api/trades`, `/api/trades/{id}/close`          | Throws, onError toast | Yes              |
| `auth-context.tsx`                    | `/api/user/me`, `/api/user/paper-trading-account`| try/catch, 404 logic  | Yes              |
| `candlestick-chart.tsx`               | `/api/broker/historical/{accountId}/{symbol}`    | try/catch, fallback   | Yes              |
| `strategy-builder.tsx`                | `/api/market/price/crypto/{symbol}` etc.         | try/catch, toast      | Confirm          |
| `login-page.tsx`                      | `/api/auth/login`                                | Checks ok, toast      | Confirm          |
| `login.tsx`                           | `/api/login`, `/api/test-login/*`                | .catch, toast         | Confirm          |
| `create-account-page.tsx`             | `/api/test-users`                                | Checks ok, toast      | Confirm          |
| `use-trial-status.ts`                 | `/api/user/trial-status`                         | try/catch, fallback   | Yes              |
| `use-backtest-sessions.ts`            | `/api/backtest-sessions`                         | Throws on !ok         | Yes              |
| `tax-reporting.tsx`                   | `/api/tax/events`, `/api/tax/summary`, etc.      | React Query           | Yes              |

---

## 5. Recommendations
- **Unify login endpoint**: Use either `/api/login` or `/api/auth/login` everywhere, not both.
- **Confirm all test/dev endpoints** exist in backend or are stubbed for dev only.
- **Always check `response.ok`** before parsing JSON or using response data in direct fetch calls.
- **Standardize error messages** for better user feedback.
- **Consider wrapping all fetch calls** in a utility (like `apiRequest`) for consistent error handling and token logic.

---

**This file is a static audit only. No code was changed.** 