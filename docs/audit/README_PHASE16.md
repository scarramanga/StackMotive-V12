# Phase 16.2 — WebSocket Reconnection Diagnostics

## Executive Summary

**Issue**: Journey 9 WebSocket connections fail because of a **protocol mismatch** between client and server.

**Root Cause**: 
- Client uses native WebSocket protocol (`new WebSocket()`) in `client/src/hooks/use-websocket.ts`
- Server expects Socket.IO protocol in `server/websocket_server.py`
- Native WebSocket and Socket.IO are incompatible protocols

**Status**: ✅ Diagnostic phase complete. Backend connect handler works correctly with Socket.IO clients.

---

## Diagnostic Results

### Test 1: Socket.IO Client ✅ SUCCESS
When using a Socket.IO client (correct protocol), the backend connect handler executes successfully:

```
[WebSocket][DIAGNOSTIC] ===== CONNECT EVENT FIRED ===== sid=...
[WebSocket][DIAGNOSTIC] verify_jwt() called with token: ...
[WebSocket][DIAGNOSTIC] JWT decoded successfully: {'sub': '1', 'user_id': '1', ...}
[WebSocket][DIAGNOSTIC] Client CONNECTED SUCCESSFULLY
[WebSocket][DIAGNOSTIC] Emitted 'connected' event
```

**Conclusion**: The `@sio.event("connect")` handler IS properly registered and DOES execute when using Socket.IO protocol.

### Test 2: Native WebSocket Client ❌ FAILS (Expected)
When using native WebSocket (incorrect protocol), connection fails at transport layer before reaching connect handler:

```
WebSocket connection failed: 400 Bad Request
```

The `@sio.event("connect")` handler is **never invoked** because the Socket.IO handshake fails.

**Conclusion**: Native WebSocket clients cannot communicate with Socket.IO servers due to protocol incompatibility.

---

## Files Involved

### Backend (Works Correctly with Socket.IO)
- `server/websocket_server.py` - Socket.IO server with AsyncRedisManager
  - Lines 22-28: AsyncServer initialization
  - Lines 177-239: `@sio.event` connect handler (properly registered)
  - Lines 145-186: JWT verification logic (works correctly)
  
### Client (Uses Wrong Protocol)
- `client/src/hooks/use-websocket.ts` - Native WebSocket implementation
  - Line 25: `new WebSocket(wsUrl)` - native protocol (incompatible)
  - Missing: socket.io-client dependency in package.json

### Environment
- `docker-compose.e2e.yml` - E2E test environment
  - Line 39: Fixed JWT_SECRET → STACKMOTIVE_JWT_SECRET
  - Line 40: Added STACKMOTIVE_DEV_MODE=true for dev mode

---

## Secondary Issues Fixed

### 1. Environment Variable Mismatch
**Problem**: `docker-compose.e2e.yml` used `JWT_SECRET` but code expects `STACKMOTIVE_JWT_SECRET`  
**Fix**: Updated docker-compose.e2e.yml line 39

### 2. Missing Dev Mode Flag
**Problem**: `STACKMOTIVE_DEV_MODE` was not set in docker-compose.e2e.yml  
**Fix**: Added `STACKMOTIVE_DEV_MODE: "true"` to backend environment

### 3. Missing Socket.IO Client Dependency
**Problem**: `client/package.json` does not include `socket.io-client`  
**Status**: Documented for future implementation (out of scope for diagnostic phase)

---

## Architecture Documentation Reference

See `docs/deltas/realtime_inventory.md` for complete architectural analysis:
- Lines 48-56: Documents V12's "Minimal native WebSocket hook" with "No Socket.IO infrastructure"
- Lines 95-139: Recommends Socket.IO as the chosen transport
- Lines 142-255: Provides Socket.IO client integration examples

---

## Test Script

Created `server/tests/test_ws_connect_dev.py` to validate:
1. ✅ Backend works with Socket.IO clients
2. ❌ Backend rejects native WebSocket clients (protocol mismatch)

Run with:
```bash
python server/tests/test_ws_connect_dev.py
```

---

## Diagnostic Logs Added

Enhanced logging in `server/websocket_server.py`:
- `verify_jwt()`: Logs token receipt, decoding, claim extraction
- `connect()`: Logs event firing, auth extraction, JWT validation, success/failure
- Startup: Logs Socket.IO initialization and handler registration

All diagnostic logs prefixed with `[WebSocket][DIAGNOSTIC]` for easy filtering.

---

## Next Steps (Out of Scope for This Phase)

1. **Install socket.io-client**: Add to `client/package.json`
2. **Rewrite use-websocket.ts**: Replace native WebSocket with Socket.IO client
3. **Update Journey 9 tests**: Recapture evidence with working connection
4. **Consider**: Keep diagnostic logs or remove after Phase 16 completion

---

## References

- Original task: Phase 16.2 issue #86
- Related docs: `docs/deltas/realtime_inventory.md`
- Test evidence: `docs/qa/evidence/phase15/journeys/journey9_*`
- Git branch: `phase16.2/backend-ws-diagnostics`
- Link to Devin run: https://app.devin.ai/sessions/3fa19bf531154f7a904af47fb9817493
- Requested by: @scarramanga
