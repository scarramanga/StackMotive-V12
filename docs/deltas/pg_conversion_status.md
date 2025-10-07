# PostgreSQL Conversion Status

## Summary

Successfully completed PostgreSQL migration for MVP-critical routes while stubbing non-critical routes pending future conversion.

**Branch:** `feat/pg-critical-routes`  
**Base:** `main`  
**Date:** 2025-10-07  
**Session:** https://app.devin.ai/sessions/5f5bed3d0dea43d29648e668be1dd07b  
**User:** @scarramanga

---

## ✅ Converted Routes (MVP-Critical)

The following 4 MVP-critical routes have been fully converted to PostgreSQL with parameterized queries:

1. **portfolio.py** - Portfolio Dashboard
   - Commit: aa5fb2a2b
   - Database operations: 10 execute calls
   - Status: ✅ Fully converted using qmark shim
   - Functions: portfolio refresh, combined snapshots, performance metrics

2. **performance_analytics_panel.py** - Performance Analytics
   - Commit: aa5fb2a2b
   - Database operations: 15 execute calls
   - Status: ✅ Fully converted using qmark shim
   - Functions: portfolio performance, risk analytics, trading metrics

3. **user_preferences_panel.py** - User Preferences
   - Commit: aa5fb2a2b
   - Database operations: 13 execute calls
   - Status: ✅ Fully converted using qmark shim
   - Functions: user preferences, theme settings, backup/restore

4. **theme_preferences.py** - Theme Settings
   - Commit: 305cf96de
   - Database operations: 10 execute calls
   - Status: ✅ Fully converted using qmark shim
   - Functions: theme mode, sync preferences, history tracking

**Conversion Pattern:**
- Replaced `import sqlite3` with `from server.deps import db_session` and `from server.db.qmark import qmark`
- Added `db = Depends(db_session)` to all route signatures
- Converted `cursor.execute(sql, params)` to `db.execute(*qmark(sql, params))`
- Updated `cursor.fetchone()` to `db.execute(...).mappings().first()`
- Updated `cursor.fetchall()` to `db.execute(...).mappings().all()`
- Added `db` parameter to `log_to_agent_memory()` calls
- Removed `get_db_connection()` definitions

---

## 🟡 Stubbed Routes (Non-Critical)

The following 44 non-critical routes have been stubbed with `HTTPException(501)` pending future conversion:

### Support & Configuration (15 routes)
- billing.py
- export.py
- onboarding_flow.py
- stripe_webhook.py
- tier_enforcement_wrapper.py
- asset_sync_settings.py
- vault_categories.py
- rotation_control.py
- rotation.py
- rebalance_scheduler.py
- asset_snapshots.py
- signal_log.py
- tax.py
- user.py
- vault.py

### MVP-Adjacent Features (4 routes)
- watchlist.py - Watchlist Panel
- macro_monitor.py - Macro Monitor Panel
- holdings_review.py - Holdings Review Panel
- asset_drilldown.py - Asset Details Panel

### Advanced Features (6 routes)
- strategy_comparison_engine.py
- ai_rebalance_suggestions.py
- strategy_editor.py
- strategy_ranking_system.py
- strategy_assignment.py
- dca_stop_loss.py

### Trading & Analysis (10 routes)
- manual_trade_journal.py
- paper_trading.py
- trades.py
- trading_accounts.py
- rebalance_risk.py
- allocation_visualizer.py
- asset_exclusion_panel.py
- asset_tagging_system.py
- asset_view_tools.py
- live_signal_summary_panel.py

### Advisor & Market Data (9 routes)
- advisor.py
- advisor_custom.py
- advisor_macro.py
- advisor_rebalancing.py
- advisor_taxloss.py
- market_data.py
- market_events.py
- strategy.py
- whale_activities.py

**Stub Pattern:**
```python
from fastapi import APIRouter, HTTPException

router = APIRouter()

# TODO: convert to PostgreSQL (issue #PG_BACKLOG)

@router.get("/endpoint")
async def endpoint_name():
    """Original docstring preserved"""
    raise HTTPException(status_code=501, detail="Route pending PostgreSQL migration")
```

**Automation:**
- Created `scripts/stub_routes.py` to automatically stub all non-critical routes
- Preserves route decorators, signatures, and docstrings for future conversion
- Removes all SQLite imports and database code
- Commit: 59ffa686d

---

## Validation Gates

### ✅ Gate 1: No SQLite Remnants
**Command:** `rg -n 'sqlite3|dev\.db' server/routes`  
**Result:** ✅ PASS - 0 matches found in active route files  
**Details:** All SQLite imports and `dev.db` references removed from active routes

### Gate 2: No Unsafe F-String SQL
**Command:** `rg -n 'sql\(".*\{.*\}".*\)' backend/server server 2>/dev/null`  
**Status:** ⏳ Pending verification

### Gate 3: Database Migration
**Command:** `cd backend && alembic upgrade head`  
**Status:** ⏳ Pending verification  
**Note:** Requires PostgreSQL connection string in DATABASE_URL environment variable

### Gate 4: Route Smoke Tests
**Command:** `pytest -q backend/tests/routes --maxfail=1 -x`  
**Status:** ⏳ Pending verification

---

## Migration Statistics

- **Total route files:** 50
- **Converted (MVP-critical):** 4 (8%)
- **Stubbed (non-critical):** 44 (88%)
- **Unchanged:** 2 (__init__.py, special files) (4%)
- **Lines of SQLite code removed:** 20,063
- **Lines of stub code added:** 1,088
- **Net reduction:** 18,975 lines (-95%)

---

## Helper Files

The following PostgreSQL helper files enable the migration:

1. **server/db/session.py** - SQLAlchemy session management
2. **server/deps.py** - FastAPI dependency injection for database sessions
3. **server/db/qmark.py** - Qmark shim for converting SQLite `?` placeholders to PostgreSQL named parameters

---

## Next Steps

### Immediate (Current PR)
- [x] Convert 4 MVP-critical routes
- [x] Stub 44 non-critical routes
- [x] Pass Gate 1 (no SQLite remnants)
- [ ] Verify Gates 2-4
- [ ] Create PR with full documentation
- [ ] Monitor CI checks

### Future Work (Issue #PG_BACKLOG)
1. **MVP-Adjacent Routes** (Phase 2 - High Priority)
   - Convert watchlist.py, macro_monitor.py, holdings_review.py, asset_drilldown.py
   - These are visible panels but not critical for initial launch

2. **Support Routes** (Phase 3 - Medium Priority)
   - Convert billing, onboarding, configuration routes
   - Required for full production deployment

3. **Advanced Features** (Phase 4 - Low Priority)
   - Convert strategy comparison, AI suggestions, advanced trading features
   - Can remain stubbed until user demand justifies conversion

4. **Advisor & Market Data** (Phase 5 - As Needed)
   - Convert advisor endpoints and market data routes
   - Prioritize based on actual usage patterns

---

## Technical Notes

### Qmark Shim Pattern
The qmark shim automatically converts SQLite-style `?` placeholders to PostgreSQL named parameters:

```python
# Before (SQLite)
cursor.execute("INSERT INTO users (name, email) VALUES (?, ?)", (name, email))

# After (PostgreSQL with qmark shim)
db.execute(*qmark("INSERT INTO users (name, email) VALUES (?, ?)", (name, email)))
# Internally converts to: INSERT INTO users (name, email) VALUES (:p1, :p2)
```

### Database Dependency Injection
All converted routes use FastAPI dependency injection for database sessions:

```python
@router.get("/endpoint/{user_id}")
async def endpoint(user_id: int, db = Depends(db_session)):
    stmt, params = qmark("SELECT * FROM users WHERE id = ?", (user_id,))
    result = db.execute(stmt, params).mappings().first()
    return result
```

### Agent Memory Logging
Agent memory logging functions now require the `db` parameter:

```python
await log_to_agent_memory(
    user_id, "action_type", "summary", 
    input_data, output_data, metadata, db
)
```

---

## References

- **Route Inventory:** [docs/deltas/route_inventory.md](./route_inventory.md)
- **PostgreSQL Helpers:** server/db/session.py, server/deps.py, server/db/qmark.py
- **Stub Script:** scripts/stub_routes.py
- **Devin Session:** https://app.devin.ai/sessions/5f5bed3d0dea43d29648e668be1dd07b
