# StackMotive V12 — Consolidation & Production Plan

**Owner:** Andrew Boss (scarramanga)
**Assistant:** ChatGPT (GPT-5)
**Executor:** Devin
**Repository:** StackMotive-V12
**Baseline Tag:** v12-pg-baseline

## Objective
Unify StackMotive into a single, production-grade, PostgreSQL-backed platform with enterprise auth, CI gates, and staged integrations. This file is the canonical mission log for all phases.

---

## ✅ Phase 1 — PostgreSQL Migration (Complete)
Branch: feat/pg-critical-routes → merged to main
CI: ✅ grep-gates, ✅ backend-db
Tag: v12-pg-baseline

- Migrated from SQLite → PostgreSQL, added Alembic.
- Converted 4 MVP routes: portfolio, performance_analytics_panel, user_preferences_panel, theme_preferences.
- Stubbed 44 non-critical routes (HTTP 501) to preserve API shape.
- CI enforces: no sqlite/dev.db; no hardcoded secrets; Alembic runs on Postgres service.

Deliverables:
- docs/deltas/pg_conversion_status.md
- docs/deltas/route_inventory.md
- scripts/stub_routes.py
- .github/workflows/ci.yml

---

## ✅ Phase 2 — Enterprise Auth Audit (Complete)
Branch: analysis/auth-audit-20251007T0120Z (PR #2)
CI: ✅ auth-smoke, ✅ grep-gates, ⚠ backend-db (legacy test infra)

Outcome:
- **Winner: V11** auth (production_auth pattern) — env secrets, rate limit, tier enforcement, hybrid JWT claims.
- V12 has hardcoded secrets and lacks rate-limit/tier enforcement.
- Final has mock/partial auth only.

Deliverables:
- docs/deltas/auth_inventory.md
- server/tests/auth/test_jwt_smoke.py
- ci.yml updated with auth-smoke job

Decision:
- Proceed to **Phase 3 — Enterprise Auth Merge (V11 → V12)** using production_auth pattern.

---

## ✅ Phase 3 — Enterprise Auth Merge (Complete)
Branch: feat/auth-enterprise (PR #3)
CI: ✅ auth-smoke, ✅ grep-gates, ✅ backend-db

Scope:
- Import from V11: server/config/production_auth.py, tier middleware, auth routes.
- Remove V12 hardcoded secret paths; secrets via env only.
- Add slowapi rate-limit + tier enforcement middleware.
- Extend CI: keep grep-gates, auth-smoke; backend-db runs Alembic only.

Deliverables:
- server/config/production_auth.py
- server/middleware/tier_enforcement.py
- server/auth.py (updated to use production secrets)
- server/routes/user.py (full auth lifecycle)
- server/.env.example
- server/tests/auth/test_auth_flow_smoke.py

Acceptance:
- ✅ No hardcoded secrets (grep clean).
- ✅ 200/401 auth semantics verified.
- ✅ Tier middleware blocks unauthorised tier.
- ✅ All CI jobs green.

---
## ✅ Phase 4 — Rate-Limit & Session-Control Hardening (Complete)
Branch: feat/rate-limit-session-control → merged to main
CI: ✅ grep-gates, ✅ backend-db, ✅ auth-smoke, ✅ rate-limit-tests
Tag: v12-session-hardened

Features:
- Tier-based limits (observer 30/min, navigator 60/min, operator 120/min, sovereign 240/min); default 60/min.
- Token revocation via PostgreSQL `revoked_tokens` with JTI, logout route, refresh rotation.
- Access token 30m, refresh 14d. 
- CI job `rate-limit-tests` spins up Postgres, runs Alembic, verifies 429 behavior.

Acceptance:
- No hardcoded limits in routes.
- 429 enforced when limits exceeded.
- Expired tokens rejected (401).
- Logout blacklists refresh tokens.
- All CI jobs green.

---

## ✅ Phase 5 — MVP Route Restoration (Complete)

### Batch 1 (Complete)
Branch: feat/routes-restore-batch-1 → merged to main (PR #7)
CI: ✅ grep-gates, ✅ backend-db, ✅ auth-smoke, ✅ rate-limit-tests
Tag: v12-routes-batch1

Features:
- Created server/config/env.py with AUTH_* environment variable compatibility shim.
- Restored 8 MVP routes to PostgreSQL using qmark pattern (40 total endpoints):
  * dca_stop_loss.py (5 endpoints)
  * portfolio_loader.py (4 endpoints)
  * rebalance_scheduler.py (5 endpoints)
  * market_data.py (6 endpoints)
  * asset_drilldown.py (7 endpoints)
  * watchlist.py (5 endpoints)
  * macro_monitor.py (4 endpoints)
  * holdings_review.py (4 endpoints)
- Added server/tests/routes/test_restored_batch1.py with smoke tests.
- Added psycopg==3.2.10 to requirements.txt for PostgreSQL driver support.

Acceptance:
- All routes use db=Depends(db_session), qmark pattern, .mappings().all()/.first(), db.commit().
- All 501 placeholders removed from restored routes.
- No sqlite3 or dev.db references in routes.
- All smoke tests pass locally.
- All CI jobs green.

### Batch 2 (Complete)
Branch: feat/routes-restore-batch-2 → merged to main (PR #8)
CI: ✅ grep-gates, ✅ backend-db, ✅ auth-smoke, ✅ rate-limit-tests
Tag: v12-routes-batch2

Features:
- Restored 12 MVP routes to PostgreSQL using qmark pattern (54 total endpoints):
  * asset_tagging_system.py (7 endpoints)
  * asset_exclusion_panel.py (4 endpoints)
  * asset_view_tools.py (6 endpoints)
  * strategy_editor.py (5 endpoints)
  * asset_sync_settings.py (5 endpoints)
  * vault_categories.py (5 endpoints)
  * rotation_control.py (4 endpoints)
  * strategy_assignment.py (6 endpoints)
  * ai_rebalance_suggestions.py (4 endpoints)
  * allocation_visualizer.py (4 endpoints)
  * whale_activities.py (2 endpoints)
  * rebalance_risk.py (2 endpoints)
- Added server/tests/routes/test_restored_batch2.py with comprehensive smoke tests.
- Registered vault_categories and rotation_control routers in main.py.
- All routes use CREATE TABLE IF NOT EXISTS for isolated testing and dynamic schema generation.

Acceptance:
- All routes use db=Depends(db_session), qmark pattern, .mappings().all()/.first(), db.commit().
- All 501 placeholders removed from restored routes.
- No sqlite3 or dev.db references in routes.
- All smoke tests pass locally (12/12).
- All CI jobs green.

**Phase 5 Summary:**
- Total routes restored: 20 (8 in Batch 1, 12 in Batch 2)
- Total endpoints restored: 94 (40 in Batch 1, 54 in Batch 2)
- All routes follow consistent PostgreSQL + qmark pattern
- Comprehensive test coverage with isolated testing support
- Zero SQLite dependencies remaining in restored routes

---

Notes:
- Every PR must include CI passes before merge.
- Future phases: Data-source de-mock, panel enablement, feature harvests (whale/institutional/darkpools/tax), and optional monorepo consolidation.
