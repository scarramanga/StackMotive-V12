# Phase 16 — Backend Repairs & E2E Evidence

## Overview
Phase 16 resolves three critical backend defects discovered during Phase 15 E2E testing and captures validated evidence for Journeys 7-9.

## Issues Resolved

### Issue #84: Portfolio API Schema Mismatch ✅
**Problem**: SQL query referenced non-existent columns (`name`, `assetClass`, `account`)  
**Root Cause**: Migration `abc123def456` created `portfolio_positions` table without these columns  
**Solution**: Created migration `f1e2d3c4b5a6` to add missing columns with defaults:
- `name` TEXT DEFAULT '' - Asset name (populated via CSV imports or manual entry)
- `assetclass` TEXT DEFAULT 'equity' - Asset classification (most common type)
- `account` TEXT DEFAULT 'default' - Broker account identifier

**Verification**:
```bash
curl http://localhost:8001/api/portfolio/holdings
# Returns: 200 OK with portfolio positions array
```

**Migration File**: `server/migrations/versions/f1e2d3c4b5a6_add_portfolio_position_columns.py`

### Issue #85: Reports Export Endpoint Missing ✅
**Problem**: `/api/reports/export` endpoint returned 404 Not Found  
**Root Cause**: Endpoint was stubbed but never implemented in `server/routes/tax.py`  
**Solution**: Implemented full reports export endpoint supporting:
- CSV format export with checksums
- JSON format export with summary statistics
- Reuses `snapshot_exporter` utilities for consistency
- Rate-limited to 10 requests/minute

**Verification**:
```bash
curl -X POST http://localhost:8001/api/reports/export \
  -H "Content-Type: application/json" \
  -d '{"format":"csv","report_type":"tax"}'
# Returns: 200 OK with CSV content and checksum
```

**Endpoint**: `POST /api/reports/export` in `server/routes/tax.py`

### Issue #86: WebSocket Connection Failure ⚠️
**Problem**: WebSocket notifications channel not connecting during E2E tests  
**Investigation**: 
- Socket.IO server properly initialized at `/socket.io/` (verified via curl)
- Redis Pub/Sub configured and running
- Backend startup logs show successful WebSocket service initialization
- Evidence capture script only passively listens for WebSocket events

**Finding**: Backend Socket.IO infrastructure is working correctly. The issue is that the **frontend does not initialize a Socket.IO client connection**. The E2E evidence script (lines 156-164 in `client/scripts/evidence-screens.js`) only listens for WebSocket events but doesn't actively establish a Socket.IO connection.

**Status**: Backend working as expected. This is a **frontend integration requirement** rather than a backend defect. The frontend needs to:
1. Install `socket.io-client` package
2. Initialize Socket.IO client in the application
3. Connect to `http://backend:8000/socket.io/`
4. Subscribe to notification events

**Verification**:
```bash
# Socket.IO server responds (version mismatch expected from curl)
curl http://localhost:8001/socket.io/?transport=polling
# Returns: "The client is using an unsupported version..."

# Test notification endpoint exists and works
curl -X POST http://localhost:8001/api/notifications/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test"}'
# Returns: 200 OK (with valid auth)
```

**Recommendation**: Create a new issue for frontend Socket.IO client integration.

## Evidence Validation

All evidence re-captured with fixes applied and saved to `docs/qa/evidence/phase16/journeys/`:

### Journey 7: Portfolio Deep-Dive
- **Screenshot**: `journey7_portfolio.png` (1440×900)
- **API Response**: `journey7_portfolio_api.json`
- **Status**: ✅ Portfolio holdings load successfully with 3 test positions
- **Verification**: API returns array of positions with calculated market values and P&L

### Journey 8: Reports/Tax/Exports  
- **Screenshot**: `journey8_reports.png` (1440×900)
- **API Response**: `journey8_reports_api.log`
- **Status**: ✅ Reports export endpoint returns CSV data with checksum
- **Verification**: HTTP 200 response with valid CSV content

### Journey 9: Proactive Notifications
- **Screenshot**: `journey9_notifications.png` (1440×900)
- **WebSocket Trace**: `journey9_notifications_ws.txt`
- **Status**: ⚠️ Backend Socket.IO working, frontend integration needed
- **Verification**: Socket.IO server running and responding to connections

## Test Data
Added test portfolio positions for E2E validation:
- AAPL: 100 shares @ $150 avg cost, $175.50 current ($2,550 unrealized gain)
- GOOGL: 50 shares @ $120 avg cost, $140.25 current ($1,012.50 unrealized gain)
- MSFT: 75 shares @ $300 avg cost, $380.75 current ($6,056.25 unrealized gain)

Total portfolio value: $53,118.75

## Technical Details

### PostgreSQL Column Case Sensitivity
All SQL queries updated to use lowercase unquoted column names:
- `userId` → `userid`
- `avgCost` → `avgcost`
- `currentPrice` → `currentprice`
- `lastUpdated` → `lastupdated`

PostgreSQL identifiers are case-insensitive when unquoted and stored lowercase by default.

### Migration Strategy
- Migration revision: `f1e2d3c4b5a6`
- Down revision: `81c5da509200`
- Uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for idempotency
- Default values chosen to match `csv_import_service.py` patterns

### Export Endpoint Implementation
Follows existing patterns from:
- `server/routes/export_snapshot.py` - Snapshot export structure
- `server/services/snapshot_exporter.py` - CSV/JSON generation utilities
- Rate limiting and authentication consistent with other endpoints

## Related Issues
- Phase 15 Meta Issue: #81 (Closed)
- Portfolio API Schema: #84 (Fixed)
- Reports Export Missing: #85 (Fixed)
- WebSocket Connection: #86 (Backend working, frontend integration needed)
- Previous E2E Infrastructure PR: #83 (Merged)

## Files Changed
- `server/migrations/versions/f1e2d3c4b5a6_add_portfolio_position_columns.py` - New migration
- `server/routes/portfolio.py` - Updated SQL column names to lowercase
- `server/routes/tax.py` - Implemented `/api/reports/export` endpoint
- `docs/qa/evidence/phase16/journeys/*` - Re-captured E2E evidence (6 files)
- `docs/audit/README_PHASE16.md` - This file
- `docs/qa/phase16_user_journey_e2e_report.md` - E2E test report

## CI Status
Expected: 12/12 tests passing (including rate-limit-tests)

## Next Steps
1. ✅ Backend fixes complete and verified
2. ✅ E2E evidence captured with real UI
3. ✅ Documentation complete
4. 🔄 PR submitted for review
5. ⏳ CI validation pending
6. 📋 Consider creating frontend Socket.IO integration issue
