# StackMotive Backend Startup & Init Lifecycle Audit

**Scope:**  
- `main.py`  
- Any `startup.py`, `__init__.py`, or similar bootstrapping files  
- `.env` handling and config imports  
- App startup and shutdown event hooks  
- DB/table creation and migration scripts

**Checks:**  
- No broken await calls or async issues  
- No leftover or uncalled init code  
- No duplicate startup triggers  
- No broken env variable usage

---

## 1. `main.py` (FastAPI Entrypoint)

- **App Creation:**  
  - Instantiates `FastAPI` with custom docs, OpenAPI, and CORS.
  - Registers all routers for API endpoints.
  - Configures logging at startup.
  - Calls `Base.metadata.create_all(bind=engine)` to create DB tables at import time.
  - No explicit `@app.on_event("startup")` or `@app.on_event("shutdown")` hooks.
  - Health check endpoint (`/api/health`) is async and correct.
  - If run as `__main__`, starts Uvicorn with reload.

- **Async/Await:**  
  - All endpoints and health check are async.
  - No broken await calls or async issues detected.

- **Startup/Shutdown:**  
  - No explicit FastAPI/Starlette startup/shutdown event hooks.
  - No duplicate startup triggers.

---

## 2. Bootstrapping Files

- **No `startup.py` found.**
- **`__init__.py` files:**
  - `server/config/__init__.py`, `server/logic/__init__.py`, `server/models/__init__.py` are present.
  - All are either empty or only import model classes for registration (no side effects or startup logic).

---

## 3. Environment Variable & Config Handling

- **Python:**  
  - `server/config/settings.py` uses `os.getenv` for all critical config (mode, DB URL, JWT, etc.).
  - Provides production safeguards (raises if insecure JWT in prod).
  - No broken env variable usage detected.
  - No `.env` file found in the repo, but code expects env vars to be set in the environment.

- **TypeScript:**  
  - `server/config/environment.ts` (for Node/TS side) uses `process.env` for all config, with fallbacks.
  - No broken env variable usage detected.

---

## 4. App Startup/Shutdown Event Hooks

- **No `@app.on_event("startup")` or `@app.on_event("shutdown")` hooks in `main.py`.**
- **No FastAPI `lifespan` context function.**
- **No custom startup/shutdown logic.**
- **No duplicate startup triggers.**

---

## 5. DB/Table Creation & Migration

- **`Base.metadata.create_all(bind=engine)` is called at import time in `main.py`.**
- **`server/create_tables.py`:**  
  - Standalone script to create tables, prints status, and lists tables.
  - Not called by main app, only for manual/CLI use.
- **`server/init_db.py`:**  
  - Deprecated, raises `RuntimeError` if run.
- **`server/migrate_strategy_fields.py`:**  
  - Standalone migration script, not called by main app.

- **No duplicate DB/table creation at runtime.**
- **No leftover or uncalled init code in main app.**

---

## 6. Other Startup/Init Observations

- **Routers:**  
  - All routers are included in `main.py` with correct prefixes and tags.
- **Models:**  
  - All models are imported before table creation.
- **No evidence of broken async/await usage.**
- **No evidence of duplicate or conflicting startup logic.**
- **No evidence of broken or missing environment variable usage.**
- **No evidence of uncalled or leftover init code.**

---

# Summary Table

| Area                | Status / Notes                                                                 |
|---------------------|-------------------------------------------------------------------------------|
| App creation        | FastAPI, correct config, no duplicate startup                                 |
| Startup hooks       | None (no custom logic, no issues)                                             |
| Shutdown hooks      | None (no custom logic, no issues)                                             |
| DB/table creation   | Called once at import, no duplicates                                          |
| Migration scripts   | Standalone, not called by app                                                 |
| Env/config usage    | All via `os.getenv`/`process.env`, no broken usage                            |
| Await/async         | All async endpoints correct, no broken awaits                                 |
| Leftover init code  | None found                                                                    |
| Duplicate triggers  | None found                                                                    |

---

# Integrity & Gaps

- **No broken await calls or async issues detected.**
- **No leftover or uncalled init code in main app.**
- **No duplicate startup triggers.**
- **No broken env variable usage.**
- **No explicit startup/shutdown hooks, but none required for current logic.**
- **All DB/table creation is handled at import or via explicit scripts.**
- **Migration and init scripts are not called by the app, only for manual use.**

---

**End of audit. No code changes made.** 