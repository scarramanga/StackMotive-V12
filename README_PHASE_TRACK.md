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

## ✅ Phase 6 — Data-Source De-Mock (Harvest, not rebuild) (Complete)

Branches / PRs:
- PR #9 – Documentation (docs/deltas/data_adapters_inventory.md)
- PR #10 – IBKR Flex adapter
- PR #11 – CSV Import adapter
- PR #12 – KuCoin adapter

CI Status: ✅ All green
Tag: v12-data-sources

**Summary:**
- Integrated IBKR Flex, KuCoin, CSV import, and manual input routes.
- Unified async HTTP client with manual retry/backoff (no tenacity dependency).
- CI checks added to guarantee retry safety and adapter validation.
- All adapters produce consistent, normalized data structures ready for ingestion into analytics.
- Environment variables documented in server/.env.example.

**Key Improvements Applied:**
1. **Moved DDL to Alembic migrations** - No CREATE TABLE in routes; all schema changes in migrations/versions/
2. **HTTP client hygiene** - Timeouts (30s total, 10s connect), retry with exponential backoff + jitter, User-Agent headers
3. **Idempotency checks** - import_digests table with SHA256 digest tracking to prevent duplicate imports
4. **CSV file limits** - Enforced 10K rows / 20MB max via config (CSV_MAX_ROWS, CSV_MAX_SIZE_MB)
5. **Feature-flagged logging** - CSV_AGENT_LOG flag for field-level observability (PII-safe)
6. **Tier-based access** - IBKR/CSV at operator tier, KuCoin at premium tier
7. **Rate limiting** - 10 requests/minute per user for import endpoints
8. **Sanitized test fixtures** - All tests use mocked/sanitized data, zero network calls in CI
9. **Observability logging** - Structured import events: {source, userId, itemsImported, duration_ms, status}

**Deliverables:**
- server/services/ibkr_flex_service.py (async httpx + XML parsing + retry logic)
- server/services/csv_import_service.py (pandas + validation + field mapping)
- server/services/kucoin_service.py (multi-account auth + mocked tests)
- server/services/http_client.py (manual retry with exponential backoff, ±25% jitter)
- server/utils/observability.py (structured import event logging)
- server/routes/ibkr_import.py, portfolio_loader.py, kucoin.py
- server/migrations/versions/: import_digests, ibkr_import_history, portfolio sync tables
- server/tests/services/: test_ibkr_flex.py, test_csv_import.py, test_kucoin.py, test_http_retry.py
- .github/workflows/ci.yml: Added "Data Source Tests" job

**Acceptance:**
- ✅ All routes use Alembic migrations (no DDL in routes)
- ✅ HTTP client with timeout/retry/User-Agent
- ✅ Idempotency via import_digests table
- ✅ CSV limits enforced (10K rows, 20MB)
- ✅ Feature-flagged agent logging (CSV_AGENT_LOG)
- ✅ Tier enforcement (operator/premium)
- ✅ Rate limiting (10 req/min)
- ✅ Sanitized test fixtures
- ✅ Observability logging
- ✅ All CI jobs green (5 jobs: grep-gates, backend-db, auth-smoke, rate-limit-tests, Data Source Tests)

---

## ✅ Phase 7 — Portfolio & Analytics Integration (Complete)

Branch: feat/integration-portfolio-analytics → merged to main
CI: ✅ grep-gates, ✅ backend-db, ✅ auth-smoke, ✅ rate-limit-tests, ✅ Data Source Tests, ✅ Integration Tests
Tag: v12-integration-portfolio-analytics
PR: #14

**Summary:**
- Replaced all mock data with live, database-driven analytics.
- Integrated IBKR Flex, KuCoin, and CSV adapters into unified ingestion orchestrator.
- Implemented caching layer and full end-to-end integration tests.
- Added cash_events table, Redis support, and Alembic migration chain continuity.
- All six CI jobs passing (including new integration-tests).

**Key Deliverables:**
- server/services/ingest_orchestrator.py — unified import + idempotency digest
- server/services/cache.py — Redis cache + no-op fallback
- server/routes/portfolio.py & performance_analytics_panel.py — real-data analytics
- server/tests/integration/test_portfolio_pipeline.py — import → analytics pipeline tests
- server/migrations/versions/def789abc123_add_cash_events_table.py — cash movements tracking
- .github/workflows/ci.yml — added Postgres-based integration job
- server/requirements.txt — added redis>=5.0.0

**Acceptance:**
- ✅ Unified ingest orchestrator consolidates IBKR/KuCoin/CSV imports
- ✅ Portfolio endpoints return live data from portfolio_positions table
- ✅ Performance analytics calculates from actual trades table
- ✅ Redis caching with 60s TTL and graceful fallback when unavailable
- ✅ Integration tests cover full import → query → analytics pipeline
- ✅ Idempotency via SHA256 digest prevents duplicate imports
- ✅ All 6 CI jobs green (grep-gates, backend-db, auth-smoke, rate-limit-tests, Data Source Tests, Integration Tests)

---

## ✅ Phase 8 — Strategy & AI Overlay Activation (Complete)

PR: #16 → merged
Tag: v12-ai-overlay-integration
CI: ✅ grep-gates, ✅ backend-db, ✅ auth-smoke, ✅ rate-limit-tests, ✅ data-source-tests, ✅ integration-tests, ✅ ai-overlay-tests

- Strategy engine (pure, deterministic): momentum, volatility, concentration, drawdown.
- AI orchestrator (OpenAI/Anthropic) with template fallback + Redis cache.
- New routes: /api/strategy/overlays (operator+), /api/ai/summary (navigator+), /api/ai/explain (operator+).
- Rate-limited 10/min; no advice/execution language.

---

## ✅ Phase 9 Complete: Vault & Macro Modules

**Summary:**
Successfully implemented Phase 9 of the StackMotive project, adding portfolio snapshot export capabilities, vault storage integration, and macro-economic monitoring with deterministic fixture-based regime detection.

**Deliverables:**
- server/services/snapshot_exporter.py
- server/services/vault_client.py
- server/services/macro_engine.py
- server/routes/export_snapshot.py
- server/routes/vault_push.py
- server/routes/macro_summary.py
- server/migrations/versions/2b16a8ea0a5b_add_export_jobs_table.py
- .github/workflows/ci.yml
- server/.env.example

**CI Status:**
✅ All 8 jobs passing (includes `export-tests`)

**Git Status:**
- PR #18 merged ✅  
- Tag `v12-vault-macro-modules` pushed ✅  
- Branch `feat/vault-macro-modules` deleted  

**Code Changes:**
+1,141 lines added, 0 removed  

**Key Technical Achievements:**
- Background job processing via FastAPI BackgroundTasks  
- Unified multi-format export (JSON, CSV, PDF) with checksums  
- Vault storage abstraction (local + S3)  
- Deterministic macro regime detection with fixtures  
- Tier-based access enforcement  
- All tests and CI green  

**Acceptance Criteria:**
- ✅ Exports generate and checksum verified  
- ✅ Vault integration (local & S3)  
- ✅ Macro regime logic deterministic  
- ✅ Operator+/Navigator+ access controls  
- ✅ All CI jobs passing  

**What Changed for Users:**
Users can now export portfolio snapshots, store them in vault storage, and view macro regime insights based on fixture data.

**Tag Command:**
```bash
git tag -a v12-vault-macro-modules -m "Vault & Macro Modules implemented"
git push origin v12-vault-macro-modules
```

---

## ✅ Phase 10 Complete: User Preferences & Notification Hub

**Summary:**
Successfully implemented Phase 10 of the StackMotive project, adding user preferences management engine, real-time notification delivery via Socket.IO with Redis scaling support, and comprehensive audit logging infrastructure.

**Deliverables:**
- server/services/preferences_manager.py - CRUD interface with Redis caching (60s TTL)
- server/services/notification_dispatcher.py - Multi-channel notification routing with batching
- server/services/audit_logger.py - Immutable audit log with SHA256 hashing
- server/routes/user_preferences.py - Preferences API (navigator+)
- server/routes/notifications.py - Notifications API and WebSocket stream (navigator+)
- server/websocket_server.py - Socket.IO server with JWT auth, tier limits, circuit breaker, Redis manager
- server/migrations/versions/3f42bce0a98b_add_preferences_and_activity_log.py - Database schema
- server/tests/user/test_preferences_manager.py - Preferences CRUD tests
- server/tests/user/test_notifications.py - Notification dispatch and batching tests
- server/tests/user/test_audit_logger.py - Audit logging tests
- .github/workflows/ci.yml - Added notifications-tests job
- docs/deltas/realtime_inventory.md - Real-time transport audit (V11, V12, Final)

**CI Status:**
✅ All 9 jobs passing (includes `notifications-tests`)

**Git Status:**
- PR #19 open (ready for merge)
- Branch `feat/user-preferences-notifications` active
- Tag `v12-user-preferences-notifications` ready

**Code Changes:**
+1,925 lines added, 2 removed

**Key Technical Achievements:**
- Socket.IO real-time transport with AsyncRedisManager for multi-instance scaling
- Strict JWT authentication and tier-based subscription limits at connection time
- Circuit breaker protection and rate limiting (20/min) on WebSocket events
- Message deduplication with 120s window to prevent notification spam
- Preferences versioning with audit trail on every change
- Notification batching with 120s window to reduce duplicate alerts
- Redis caching for preferences (60s TTL) to reduce database load
- All tests deterministic and offline-safe (no external dependencies)

**Acceptance Criteria:**
- ✅ CRUD for user preferences works (get/update/reset)
- ✅ Audit log records every change with deterministic SHA256 hash
- ✅ Notification hub delivers and batches events via Socket.IO
- ✅ Tier-based access enforced (navigator+ for preferences, operator+ for test notifications)
- ✅ WebSocket integration at /socket.io/ with Redis manager for scaling
- ✅ All 9 CI jobs green including notifications-tests
- ✅ Environment variables documented in .env.example

**What Changed for Users:**
Users can now customize preferences (theme, language, risk profile, rotation settings, macro/trade alerts), receive real-time notifications via WebSocket for portfolio events (rebalance triggers, macro changes, overlay updates), and view complete audit history of all preference changes.

**Tag Command:**
```bash
git tag -a v12-user-preferences-notifications -m "User Preferences & Notification Hub implemented"
git push origin v12-user-preferences-notifications
```

---

## ✅ Phase 11 Complete: Data Source Federation Integration

**Summary:**
Successfully implemented Phase 11 of the StackMotive project, adding a complete data source federation layer with source registry, staging tables, reconciliation engine, and on-demand sync orchestration.

**Deliverables:**
- server/services/federation_registry.py - Source registration and configuration management
- server/services/ingest_pipeline.py - Idempotent data ingestion with content hashing
- server/services/reconciliation_engine.py - Priority-based conflict resolution
- server/services/scheduler.py - Sync orchestration helpers
- server/routes/data_federation.py - Federation API endpoints (operator+)
- server/migrations/versions/4e21f1a1fedc_phase11_federation_core.py - Federation schema
- server/tests/federation/test_registry.py - Source registration tests
- server/tests/federation/test_ingest_pipeline.py - Ingest and digest tests
- server/tests/federation/test_reconciliation_engine.py - Reconciliation logic tests
- server/tests/federation/test_federation_routes.py - API integration tests
- server/tests/federation/test_ts_normalize.py - Timestamp normalization tests
- .github/workflows/ci.yml - Added federation-tests job
- server/.env.example - Federation environment variables

**CI Status:**
✅ All 10 jobs passing (includes `federation-tests`)

**Git Status:**
- PR #22 closed (superseded by PR #23)
- PR #23 merged ✅  
- Tag `v12-data-federation` pushed ✅  
- Branch `fix/federation-ts-normalize` can be deleted

**Code Changes:**
+1,840 lines added, 0 removed  

**Key Technical Achievements:**
- Multi-source data registry with priority-based authority (IBKR > KuCoin > CSV > Manual)
- Idempotent staging layer with SHA256 content digests to prevent duplicate imports
- Reconciliation engine with freshness-based conflict resolution (newest `as_of` wins)
- PostgreSQL-only testing strategy with proper boolean handling
- Robust timestamp normalization (`_iso8601` helper) for cross-driver compatibility
- Tier-based access controls (operator+ for sync operations, navigator+ for viewing)
- On-demand sync API with status tracking and conflict reporting
- All tests use real PostgreSQL database via `get_db()` for production parity

**Reconciliation Rules:**
1. Priority wins (lower number = higher authority)
2. If equal priority: freshest `as_of` timestamp wins
3. If equal freshness: highest confidence source (IBKR > KuCoin > CSV > Manual)
4. All conflicts logged to sync_runs.stats.conflicts[] for audit trail

**Acceptance Criteria:**
- ✅ CRUD operations on data_sources work with default priority applied
- ✅ Idempotent ingest via federation_import_digests (same payload skipped)
- ✅ Reconciliation produces deterministic canonical table updates
- ✅ End-to-end: register sources → trigger sync → view status with counts & conflicts
- ✅ All 10 CI jobs passing including federation-tests
- ✅ PostgreSQL boolean handling (True/False, not 1/0)
- ✅ Timestamp normalization handles datetime objects and string formats

**What Changed for Users:**
Users can now register multiple data sources (IBKR, KuCoin, CSV, Manual), trigger on-demand synchronization, and rely on the federation layer to automatically reconcile conflicts based on source priority, data freshness, and confidence levels. All imports are idempotent and fully auditable.

**Tag Command:**
```bash
git tag -a v12-data-federation -m "Phase 11: Data Source Federation (registry, staging, reconciliation, sync API, CI)"
git push origin v12-data-federation
```

---

## 🛡️ Phase 12 Plan: Governance & Branch Protection

**Summary:**
Final governance phase to harden repository controls, enforce CI checks, and establish merge / tag governance for production.

**Deliverables:**
- Branch protection on `main`
  - Required checks: `grep-gates`, `backend-db`, `auth-smoke`, `rate-limit-tests`, `data-source-tests`, `integration-tests`, `ai-overlay-tests`, `export-tests`, `notifications-tests`
  - Require PR review & signed commits  
  - Disallow direct pushes  
- docs/governance.md
- server/scripts/verify_ci_matrix.py

**Acceptance Criteria:**
- ✅ All CI jobs registered and enforced in GitHub branch protection  
- ✅ `verify_ci_matrix.py` passes with exit code 0  
- ✅ Governance documentation approved and committed  
- ✅ Tag `v12-governance-lock` pushed  

**Tag Command:**
```bash
git tag -a v12-governance-lock -m "Governance & Branch Protection finalized"
git push origin v12-governance-lock
```

---

Notes:
- Every PR must include CI passes before merge.
- Phases 1-11 complete; Phase 12 planned for future implementation.
