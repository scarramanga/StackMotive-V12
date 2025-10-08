# User Journey Gaps & Defects

**Generated**: October 08, 2025  
**Testing Duration**: 2+ hours manual testing  
**Against**: StackMotive V12 Complete User Flow / Journey Specification  
**Build**: main branch, PR #29  
**Devin Run**: https://app.devin.ai/sessions/ea257b2dd7474764bf84e49751ba278c

---

## CRITICAL BLOCKER

### BLOCKER-001: Authentication System Completely Non-Functional
**Severity**: CRITICAL  
**Journey Area**: ALL (blocks 10 of 11 journey areas)  
**Status**: BLOCKS ALL TESTING

#### Description
Backend authentication system is completely non-functional. API endpoints for user registration and authentication return 404 errors, preventing any authenticated user journey testing. After 2+ hours of debugging, this remains unresolved and blocks comprehensive E2E validation.

#### Current State
**Backend API Issues:**
- `/api/auth/register` → 404 Not Found
- `/api/health` → 404 Not Found
- `/api/onboarding/steps` → 501 Not Implemented
- `/api/onboarding/progress` → 501 Not Implemented
- `/api/user-preferences` → 500 Internal Server Error
- `/api/user/paper-trading-account` → 404 Not Found

**Database Issues:**
- `users` table has: `id, email, hashed_password, is_active, has_completed_onboarding`
- `users` table MISSING: `username` column (required by frontend registration form)
- Database has 0 users, cannot create test users

**Frontend Status:**
- ✅ Login page renders correctly
- ✅ Registration form displays
- ❌ Form submission fails with backend 404 errors

#### Reproduction Steps
1. Start Docker services: `docker compose -f docker-compose.e2e.yml up -d`
2. Run migrations: `cd server && alembic upgrade head`
3. Start backend: `python -m server.main` (port 8000)
4. Start frontend: `cd client && npm run dev` (port 5173)
5. Navigate to http://localhost:5173/login
6. Attempt to register new user
7. **Expected**: User created, redirected to dashboard
8. **Actual**: Backend returns 404, registration fails

**Alternative attempts that also failed:**
- Direct API call: `curl -X POST http://localhost:8000/api/auth/register -d '{"email":"test@test.com","password":"test123"}'` → 404
- Database insert: Fails due to missing `username` column
- Check health: `curl http://localhost:8000/api/health` → 404

#### Evidence
- **Backend logs**: 
  ```
  {"method": "POST", "path": "/api/auth/register", "status": 404}
  {"method": "GET", "path": "/api/health", "status": 404}
  {"method": "GET", "path": "/api/onboarding/steps", "status": 501}
  {"method": "GET", "path": "/api/user-preferences", "status": 500}
  ```
- **Database query**: `SELECT * FROM users;` returns 0 rows
- **Database schema**: 
  ```sql
  \d users
  -- Shows: id, email, hashed_password, is_active, has_completed_onboarding
  -- Missing: username column
  ```
- **Screenshot**: `docs/qa/evidence/backend_health_404.png` - Backend API 404 error

#### Impact
**CRITICAL**: Cannot test ANY of the following journey areas without working authentication:
1. ❌ Journey 1: New User Registration & Onboarding
2. ❌ Journey 2: Stack AI Onboarding
3. ❌ Journey 3: Experienced User Fast Track
4. ❌ Journey 4: Tier Selection & Billing
5. ⚠️ Journey 5: Live Dashboard (partial - frontend only)
6. ❌ Journey 6: Stack AI Interactions
7. ❌ Journey 7: Portfolio Deep Dive (3 levels)
8. ⚠️ Journey 8: Functional Modules (partial - frontend only)
9. ❌ Journey 9: Proactive Notifications
10. ❌ Journey 11: Returning User Flow

**Only testable without auth:**
- Journey 5 (partial): Frontend dashboard pages with mock data
- Journey 8 (partial): Frontend reports/analytics pages with mock data

#### Required Fixes
1. Implement `/api/auth/register` endpoint (currently missing - 404)
2. Implement `/api/health` endpoint (currently missing - 404)
3. Fix database schema mismatch:
   - Option A: Add `username` column to `users` table
   - Option B: Remove `username` field from frontend registration form
4. Implement `/api/onboarding/*` endpoints (currently return 501)
5. Fix `/api/user-preferences` endpoints (currently return 500)

#### Owner
Backend Team (URGENT)

#### Effort Estimate
Unknown - requires backend team investigation

---

## Expected Gaps (From User Instructions)

### GAP-001: 5-Minute Tier Tourism Preview
**Severity**: MAJOR  
**Journey Area**: 10. Tier Tourism  
**Status**: NOT IMPLEMENTED (expected gap per spec)

#### Description
The specification requires a "5-minute preview of higher tier features" with server-side timer and post-expiry lockback. This is NOT implemented in V12, which is an expected gap per user instructions.

#### Current State (Code Review)
- Only 30-day trial system exists (`client/src/hooks/use-trial-status.ts`)
- No temporary tier elevation mechanism
- No preview session tracking in database
- Middleware has no preview logic

#### Spec Requirement
> "Complete implementation of: 5-minute preview of higher tier features, Laddering system: Try features before buying"

#### Reproduction Steps
CANNOT TEST - Blocked by BLOCKER-001 (authentication system)

**Hypothetical steps if auth worked:**
1. Login as Observer tier user
2. Attempt to access Navigator tier feature (e.g., `/api/signals`)
3. **Expected**: Option to preview feature for 5 minutes
4. **Actual**: Immediate 403 Forbidden with no preview option (based on code analysis)

#### Evidence (Code Review Only - Not Tested)
- **Test file created**: `client/cypress/e2e/journey_10_tier_tourism.cy.ts` (cannot run due to auth blocker)
- **No database table**: `tier_preview_sessions` does not exist
- **Middleware**: `server/middleware/tier_enforcement.py` - `get_effective_tier()` only checks `user.subscription_tier`, no preview logic
- **Code search**: Searched for "preview|trial|temporary|elevated" - only found 30-day trial, not 5-minute preview

#### Suggested Fix

**1. Database Migration:**
```sql
CREATE TABLE tier_preview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preview_tier TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    features_accessed JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_preview_duration CHECK (expires_at > started_at)
);

CREATE INDEX idx_tier_preview_user_id ON tier_preview_sessions(user_id);
CREATE INDEX idx_tier_preview_expires_at ON tier_preview_sessions(expires_at);
```

**2. Middleware Update** (`server/middleware/tier_enforcement.py`):
```python
async def get_effective_tier(user_id: str, db: Session) -> str:
    """
    Get the effective tier for a user.
    Checks for active preview session first, then falls back to subscription tier.
    """
    try:
        # Check for active preview session
        from server.models.tier_preview import TierPreviewSession
        preview = db.query(TierPreviewSession).filter(
            TierPreviewSession.user_id == user_id,
            TierPreviewSession.expires_at > datetime.utcnow()
        ).first()
        
        if preview:
            logger.info(f"User {user_id} using preview tier: {preview.preview_tier}")
            return preview.preview_tier
        
        # Fall back to user's actual tier
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.subscription_tier:
            return user.subscription_tier.lower()
        
        return "observer"
    
    except Exception as e:
        logger.error(f"Error getting effective tier for user {user_id}: {e}")
        return "observer"
```

**3. API Routes** (`server/routes/tier_preview.py`):
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/tier/preview", tags=["tier-preview"])

@router.post("/start")
async def start_preview(
    preview_tier: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a 5-minute tier preview session"""
    user_id = current_user["user_id"]
    
    # Check if user already has active preview
    existing = db.query(TierPreviewSession).filter(
        TierPreviewSession.user_id == user_id,
        TierPreviewSession.expires_at > datetime.utcnow()
    ).first()
    
    if existing:
        raise HTTPException(400, "Preview session already active")
    
    # Create new preview session (5 minutes)
    session = TierPreviewSession(
        user_id=user_id,
        preview_tier=preview_tier,
        expires_at=datetime.utcnow() + timedelta(minutes=5)
    )
    db.add(session)
    db.commit()
    
    return {
        "preview_tier": preview_tier,
        "expires_at": session.expires_at,
        "duration_seconds": 300
    }

@router.get("/status")
async def preview_status(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has active preview session"""
    user_id = current_user["user_id"]
    
    preview = db.query(TierPreviewSession).filter(
        TierPreviewSession.user_id == user_id,
        TierPreviewSession.expires_at > datetime.utcnow()
    ).first()
    
    if not preview:
        return {"active": False}
    
    remaining = (preview.expires_at - datetime.utcnow()).total_seconds()
    
    return {
        "active": True,
        "preview_tier": preview.preview_tier,
        "expires_at": preview.expires_at,
        "remaining_seconds": int(remaining)
    }
```

**4. Frontend Component** (`client/src/components/tier/PreviewCountdown.tsx`):
```typescript
export function PreviewCountdown() {
  const { data: previewStatus } = useQuery({
    queryKey: ['tierPreview'],
    queryFn: () => apiRequest('GET', '/api/tier/preview/status'),
    refetchInterval: 1000 // Update every second
  })
  
  if (!previewStatus?.active) return null
  
  const minutes = Math.floor(previewStatus.remaining_seconds / 60)
  const seconds = previewStatus.remaining_seconds % 60
  
  return (
    <div className="preview-banner">
      <span>Previewing {previewStatus.preview_tier} tier</span>
      <span className="countdown">{minutes}:{seconds.toString().padStart(2, '0')} remaining</span>
      <button onClick={handleUpgrade}>Upgrade Now</button>
    </div>
  )
}
```

#### Owner
Backend Team + Frontend Team

#### Effort Estimate
- **Database**: 2 hours (migration, model)
- **Middleware**: 4 hours (update logic, testing)
- **Backend Routes**: 2 hours (3 endpoints)
- **Frontend**: 4 hours (countdown component, CTAs)
- **Testing**: 2 hours (E2E tests)
- **Total**: ~14 hours

---

### GAP-002: Magic Link Authentication
**Severity**: MAJOR  
**Journey Area**: 11. Returning User Flow  
**Status**: NOT IMPLEMENTED (expected gap per spec)

#### Description
Specification requires "Magic link authentication" for returning users. This is NOT implemented in V12, which is an expected gap per user instructions.

#### Current State (Code Review)
- Email/password auth backend missing (returns 404 - see BLOCKER-001)
- Magic link service not implemented
- Button text "Send Magic Link" found in `EmailStep.tsx` but no backend
- No passwordless auth flow

#### Spec Requirement
> "LOGIN: Magic link authentication, Email / Password"

#### Reproduction Steps
CANNOT TEST - Blocked by BLOCKER-001 (authentication system)

**Hypothetical steps if auth worked:**
1. Navigate to `/login`
2. Look for "Send magic link" option
3. **Expected**: Button or link to request magic link via email
4. **Actual**: Only email/password fields present (button text exists but no functionality)

#### Evidence (Code Review Only - Not Tested)
- **Test file created**: `client/cypress/e2e/journey_11_returning_user.cy.ts` (cannot run due to auth blocker)
- **No routes**: Searched for `/api/auth/magic-link` - not found
- **Frontend reference**: `client/src/components/auth/EmailStep.tsx` - button text only, no functionality
- **Code search**: "magic.link" found only in component text

#### Suggested Fix

**1. Backend Routes** (`server/routes/magic_link.py`):
```python
import secrets
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth/magic-link", tags=["auth"])

@router.post("/request")
async def request_magic_link(
    email: str,
    db: Session = Depends(get_db)
):
    """Request a magic link for passwordless login"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "If email exists, magic link sent"}
    
    # Generate secure token (32 bytes = 64 hex chars)
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Store token in database (15-minute expiry)
    magic_link_token = MagicLinkToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(magic_link_token)
    db.commit()
    
    # Send email with link
    magic_link = f"https://app.stackmotive.com/auth/verify?token={token}"
    send_magic_link_email(user.email, magic_link)
    
    return {"message": "Magic link sent to email"}

@router.get("/verify")
async def verify_magic_link(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify magic link token and auto-login user"""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    magic_token = db.query(MagicLinkToken).filter(
        MagicLinkToken.token_hash == token_hash,
        MagicLinkToken.expires_at > datetime.utcnow(),
        MagicLinkToken.used == False
    ).first()
    
    if not magic_token:
        raise HTTPException(400, "Invalid or expired magic link")
    
    # Mark token as used
    magic_token.used = True
    db.commit()
    
    # Get user and create session
    user = db.query(User).filter(User.id == magic_token.user_id).first()
    access_token = create_access_token({"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user.email, "id": user.id}
    }
```

**2. Database Model**:
```python
class MagicLinkToken(Base):
    __tablename__ = "magic_link_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    token_hash = Column(String(64), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**3. Frontend Update** (`client/src/pages/login.tsx`):
```typescript
const handleMagicLink = async () => {
  await apiRequest('POST', '/api/auth/magic-link/request', { email })
  toast.success('Magic link sent! Check your email.')
}

return (
  <div>
    <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
    <button onClick={handleMagicLink}>Send Magic Link</button>
    <p>Or</p>
    <input type="password" placeholder="Password" />
    <button onClick={handlePasswordLogin}>Login with Password</button>
  </div>
)
```

**4. Email Template**:
```html
Subject: Your StackMotive Magic Link

Hi there,

Click the link below to securely log in to StackMotive:

{magic_link}

This link will expire in 15 minutes and can only be used once.

If you didn't request this, please ignore this email.

Best,
The StackMotive Team
```

#### Owner
Backend Team + Frontend Team

#### Effort Estimate
- **Backend Routes**: 3 hours (2 endpoints, token logic)
- **Database Model**: 1 hour (migration, model)
- **Email Service**: 1 hour (template, sending)
- **Frontend**: 2 hours (UI update, magic link handling)
- **Total**: ~7 hours

### GAP-003: Conversational AI Command Execution
**Severity**: MAJOR  
**Journey Area**: 2. Stack AI Onboarding, 6. Stack AI Interaction  
**Status**: LIKELY NOT IMPLEMENTED (expected gap, cannot fully verify)

#### Description
Stack AI should execute commands like "Add AAPL to watchlist" and "Set DCA alert for BTC at $50k" per the spec. Based on code analysis, this appears to be missing or incomplete.

#### Current State (Code Review)

**Appears to exist:**
- ✅ Portfolio summaries (`summarize_portfolio` in `ai_orchestrator.py`)
- ✅ Strategy explanations (`explain_strategy` in `ai_orchestrator.py`)
- ⚠️ AI orchestrator service exists but command execution unclear

**Appears missing:**
- ❌ Command parsing layer for natural language ("Add X to watchlist")
- ❌ Command execution layer (watchlist management, alert creation)
- ❌ General knowledge queries ("Weather in Auckland")
- ❌ Complex multi-turn conversations

#### Spec Requirement
> "Stack AI Interactions: Insights/answers (price queries, 'why is portfolio down,' macro summary) + Actions (add to watchlist, set DCA alert, trigger report export)"

#### Reproduction Steps
CANNOT TEST - Blocked by BLOCKER-001 (authentication system)

#### Evidence (Code Review Only - Not Tested)
- **File**: `server/services/ai_orchestrator.py` - Has summary/explain functions, command execution unclear
- **Test files created**: `server/tests/e2e/test_stack_ai_interaction.py`, `client/cypress/e2e/journey_02_stack_ai_onboarding.cy.ts` (cannot run due to auth blocker)
- **Status**: Cannot verify without authenticated user session

#### Suggested Fix

**1. Intent Classification** (`server/services/ai_intent_parser.py`):
```python
from enum import Enum

class Intent(Enum):
    PORTFOLIO_SUMMARY = "portfolio_summary"
    PRICE_QUERY = "price_query"
    ADD_TO_WATCHLIST = "add_to_watchlist"
    SET_ALERT = "set_alert"
    GENERAL_QUERY = "general_query"
    EXPLAIN_FEATURE = "explain_feature"

def parse_user_intent(message: str) -> tuple[Intent, dict]:
    """Classify user intent and extract parameters"""
    message_lower = message.lower()
    
    # Command detection
    if "add" in message_lower and ("watchlist" in message_lower or "watch" in message_lower):
        symbol = extract_symbol(message)
        return Intent.ADD_TO_WATCHLIST, {"symbol": symbol}
    
    if "alert" in message_lower or "notify" in message_lower:
        symbol = extract_symbol(message)
        price = extract_price(message)
        return Intent.SET_ALERT, {"symbol": symbol, "price": price}
    
    # Query detection
    if any(word in message_lower for word in ["price", "trading at", "worth"]):
        symbol = extract_symbol(message)
        return Intent.PRICE_QUERY, {"symbol": symbol}
    
    if "portfolio" in message_lower or "holdings" in message_lower:
        return Intent.PORTFOLIO_SUMMARY, {}
    
    # General query (fallback)
    return Intent.GENERAL_QUERY, {"query": message}
```

**2. Command Executor** (`server/services/ai_command_executor.py`):
```python
async def execute_stack_ai_command(
    intent: Intent,
    params: dict,
    user_id: int,
    db: Session
) -> str:
    """Execute Stack AI commands"""
    if intent == Intent.ADD_TO_WATCHLIST:
        symbol = params["symbol"]
        # Add to watchlist
        watchlist_item = WatchlistItem(user_id=user_id, symbol=symbol)
        db.add(watchlist_item)
        db.commit()
        return f"✅ Added {symbol} to your watchlist"
    
    elif intent == Intent.SET_ALERT:
        symbol = params["symbol"]
        price = params["price"]
        # Create price alert
        alert = PriceAlert(user_id=user_id, symbol=symbol, target_price=price)
        db.add(alert)
        db.commit()
        return f"✅ Alert set: Notify when {symbol} reaches ${price}"
    
    elif intent == Intent.GENERAL_QUERY:
        # Use OpenAI for general queries
        response = await query_openai(params["query"])
        return response
    
    # ... more command handlers
```

**3. Conversation State Manager**:
```python
class ConversationManager:
    """Manage multi-turn conversations with context"""
    def __init__(self):
        self.conversations = {}  # user_id -> conversation history
    
    async def process_message(self, user_id: int, message: str, db: Session):
        intent, params = parse_user_intent(message)
        
        # Add message to conversation history
        if user_id not in self.conversations:
            self.conversations[user_id] = []
        self.conversations[user_id].append({"role": "user", "content": message})
        
        # Execute command or query
        response = await execute_stack_ai_command(intent, params, user_id, db)
        
        # Add response to history
        self.conversations[user_id].append({"role": "assistant", "content": response})
        
        return response
```

#### Owner
AI Team + Backend Team

#### Effort Estimate
- **Intent Parser**: 6 hours (classification logic, symbol extraction)
- **Command Executor**: 8 hours (5-10 command handlers)
- **Conversation Manager**: 4 hours (state management, history)
- **Integration**: 4 hours (hook into existing AI routes)
- **Testing**: 4 hours (E2E tests for commands)
- **Total**: ~26 hours

---

### GAP-004: Portfolio Level 3 Drilldown UI Verification
**Severity**: LOW  
**Journey Area**: 7. Portfolio Deep Dive  
**Status**: PARTIAL

#### Description
Database schema for Level 3 drilldown (Options Chain, Dark Pool, Whale activities) exists but UI panel implementation needs verification.

#### Current State
- ✅ Database tables exist:
  - `asset_details`
  - `asset_performance_history`
  - `asset_news_events`
  - `asset_analysis_signals`
- ✅ Backend routes likely exist (found in schema)
- ⚠️ UI panels need manual verification

#### Spec Requirement
> "Level 3: Individual stock details - Price & Volume, Technical Analysis, News & Sentiment, Options Chain, Dark Pool Activity, Whale activities"

#### Verification Needed
Manual testing session to verify each Level 3 panel:

1. Navigate to portfolio → select asset → view individual stock details
2. Check if these panels render:
   - ✅ Price & Volume chart
   - ✅ Technical Analysis indicators
   - ✅ News & Sentiment feed
   - ❓ Options Chain table
   - ❓ Dark Pool Activity panel
   - ❓ Whale Activity tracker

#### Evidence
- **Database**: Migration file `block_08_drilldown_assets_page.sql` has full schema
- **Test**: `client/cypress/e2e/journey_07_portfolio_drilldown.cy.ts` - Documents need for verification
- **Routes**: Likely exist based on database schema

#### Suggested Action
Schedule 2-hour manual testing session:
1. Create test portfolio with diverse holdings
2. Navigate through all 3 drilldown levels
3. Document which panels are present vs missing
4. Screenshot each level for evidence
5. File specific issues for any missing panels

#### Owner
Frontend Team + QA

#### Effort Estimate
- **Manual Testing**: 2 hours (comprehensive UI verification)
- **Documentation**: 1 hour (screenshots, findings)
- **Issue Creation**: 1 hour (if gaps found)
- **Total**: ~4 hours

---

## Small Fixes (PR B Candidates)

### FIX-001: Environment Variable Documentation
**Severity**: LOW  
**File**: `server/.env.example`

#### Issue
`STACK_AI_PROVIDER` and `STACK_AI_MODEL` options not clearly documented.

#### Fix
Add comment block:
```bash
# AI Provider Configuration
STACK_AI_PROVIDER=openai  # Options: openai, anthropic
STACK_AI_MODEL=gpt-4o-mini  # OpenAI: gpt-4o-mini, gpt-4. Anthropic: claude-3-opus, claude-3-sonnet
AI_SUMMARY_CACHE_TTL=300  # Cache AI summaries for 5 minutes
```

#### Effort
0.5 hours

---

### FIX-002: Onboarding Redirect Guard
**Severity**: LOW  
**File**: `client/src/components/layout/RouteGuard.tsx`

#### Issue
Onboarding redirect logic could be more robust.

#### Current Code
```typescript
// Current logic may not check all edge cases
```

#### Suggested Fix
```typescript
if (user && !user.hasCompletedOnboarding && location.pathname !== '/onboarding') {
  // Redirect to onboarding
  navigate('/onboarding', { replace: true });
  return null;
}

if (user && user.hasCompletedOnboarding && location.pathname === '/onboarding') {
  // Already completed, redirect to dashboard
  navigate('/dashboard', { replace: true });
  return null;
}
```

#### Effort
0.5 hours

---

### FIX-003: Tier Comparison Documentation Links
**Severity**: LOW  
**File**: Frontend tier comparison component

#### Issue
No documentation links on tier comparison page explaining features.

#### Fix
Add "Learn more" links for each tier:
```typescript
<TierCard tier="Navigator">
  <FeatureList features={navigatorFeatures} />
  <a href="/docs/tiers/navigator">Learn more about Navigator features →</a>
</TierCard>
```

#### Effort
1 hour

---

## Summary

| Gap ID | Severity | Status | Journey Area | Effort (hours) |
|--------|----------|--------|--------------|----------------|
| GAP-001 | HIGH | Not Implemented | Tier Tourism | 14 |
| GAP-002 | MEDIUM | Not Implemented | Returning User | 7 |
| GAP-003 | MEDIUM | Partial | Stack AI | 26 |
| GAP-004 | LOW | Partial | Portfolio Drilldown | 4 |
| FIX-001 | LOW | Small Fix | Docs | 0.5 |
| FIX-002 | LOW | Small Fix | Onboarding | 0.5 |
| FIX-003 | LOW | Small Fix | UI | 1 |

**Total Major Gaps**: 4 (2 critical, 2 partial)  
**Total Small Fixes**: 3  
**Total Effort for Full Gap Closure**: ~53 hours

---

## Priority Recommendations

### High Priority (Sprint 1)
1. **GAP-001**: Tier Tourism - Critical for tier conversion strategy
2. **FIX-001, FIX-002, FIX-003**: Quick wins for immediate improvement

### Medium Priority (Sprint 2)
3. **GAP-002**: Magic Link Auth - Improve user experience
4. **GAP-004**: Level 3 UI Verification - Complete feature validation

### Low Priority (Sprint 3)
5. **GAP-003**: Conversational AI - Enhanced AI capabilities (larger effort)

---

**Report generated by**: Devin AI  
**Contact**: andy@sovereignassets.org (@scarramanga)  
**Devin Run**: https://app.devin.ai/sessions/ea257b2dd7474764bf84e49751ba278c
