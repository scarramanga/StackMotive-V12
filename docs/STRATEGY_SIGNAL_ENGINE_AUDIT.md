# Strategy & Signal Engine Safety Audit

---

## 1. Indicator Usage & Input Validation
- **RSI, MACD, MA, and custom indicators** are used in:
  - `server/strategies/engine/indicator-calculator.ts`
  - `server/strategies/engine/strategy-evaluator.ts`
  - `server/ai/technical-analysis-engine.ts`
  - `server/logic/signal_engine.py`

- **Input Validation:**
  - All indicator calculators check for minimum data length before calculation (e.g., RSI requires at least `period + 1` data points, MACD checks for `slowPeriod + signalPeriod`).
  - If insufficient data, functions throw errors or return neutral values (e.g., RSI returns 50.0, MACD returns 0.0).
  - Division by zero is guarded (e.g., `avgLoss === 0 ? 0.001 : avgLoss`).

---

## 2. Null/NaN/Empty Price Handling
- **Null/NaN Handling:**
  - Calculators use explicit checks to avoid division by zero and handle empty arrays.
  - If price arrays are too short, indicators return neutral or fallback values.
  - No evidence of unguarded NaN propagation in core indicator logic.

---

## 3. Symbol Validation
- **Symbol Validation:**
  - In `signal_engine.py`, `get_signal_data(symbol)` raises a `ValueError` if the symbol is not supported (not in `mock_price_history`).
  - All indicator calculators expect valid, non-empty symbol and price data.

---

## 4. Empty Portfolio Handling
- **Portfolio Checks:**
  - No direct evidence of strategy logic breaking on empty portfolios; indicator calculators require minimum data and will throw or return neutral if not met.
  - Strategy triggers (e.g., RSI rebound, momentum buy) are based on indicator values, not portfolio state, so empty portfolios do not cause crashes but may result in no actionable signals.

---

## 5. Decision Logging & Tracing
- **Logging/Tracing:**
  - `strategy-evaluator.ts` and `technical-analysis-engine.ts` both aggregate notes and details for each signal decision (e.g., 'RSI is oversold', 'MACD bullish crossover').
  - Errors in indicator calculation are caught and logged to console (see `catch (error)` blocks).
  - No evidence of persistent audit logging (e.g., to DB or file), but in-memory and console logs are present for debugging.

---

## 6. Recommendations
- Consider adding persistent logging for all strategy decisions and errors (not just console).
- Ensure all user-facing strategy endpoints validate symbol and portfolio state before execution.
- Add explicit NaN/null checks in any new custom indicator logic.
- Consider returning structured error objects (not just neutral values) for failed indicator calculations.

---

**This file is a static safety audit only. No code was changed.** 