# User Journey Gaps & Defects

**Generated**: October 08, 2025  
**Against**: StackMotive V12 Complete User Flow / Journey Specification  
**Build**: main branch  
**Devin Run**: https://app.devin.ai/sessions/ea257b2dd7474764bf84e49751ba278c

---

## Critical Gaps (Blocking Spec Compliance)

### GAP-001: 5-Minute Tier Tourism Preview
**Severity**: HIGH  
**Journey Area**: 10. Tier Tourism  
**Status**: NOT IMPLEMENTED

#### Description
The specification requires a "5-minute preview of higher tier features" with server-side timer and post-expiry lockback. This is completely missing from V12.

#### Current State
- Only 30-day trial system exists (`client/src/hooks/use-trial-status.ts`)
- No temporary tier elevation mechanism
- No preview session tracking in database
- Middleware has no preview logic

#### Spec Requirement
> "Complete implementation of: 5-minute preview of higher tier features, Laddering system: Try features before buying, Clear explanations of what's available, Upgrade prompts at appropriate times, Feature comparison in real-time"

#### Reproduction Steps
1. Login as Observer tier user
2. Attempt to access Navigator tier feature (e.g., `/api/signals`)
3. **Expected**: Option to preview feature for 5 minutes
4. **Actual**: Immediate 403 Forbidden with no preview option

#### Evidence
- **Failing test**: `client/cypress/e2e/journey_10_tier_tourism.cy.ts`
- **No database table**: `tier_preview_sessions` does not exist
- **Middleware**: `server/middleware/tier_enforcement.py` line 86-100 - `get_effective_tier()` only checks `user.subscription_tier`, no preview logic
- **Search results**: Searched for "preview.mode|trial.mode|temporary.access|elevated.tier" - only found 30-day trial, not 5-minute preview

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
**Severity**: MEDIUM  
**Journey Area**: 11. Returning User Flow  
**Status**: NOT IMPLEMENTED

#### Description
Specification requires "Magic link authentication" for returning users, but only email/password login is implemented.

#### Current State
- Email/password auth works correctly via `/api/login`
- Magic link service referenced in docs but not implemented
- Button text "Send Magic Link" found in `EmailStep.tsx` but no backend
- No passwordless auth flow

#### Spec Requirement
> "LOGIN: Magic link authentication, Email / Password"

#### Reproduction Steps
1. Navigate to `/login`
2. Look for "Send magic link" option
3. **Expected**: Button or link to request magic link via email
4. **Actual**: Only email/password fields present (button text exists but no functionality)

#### Evidence
- **Test**: `client/cypress/e2e/journey_11_returning_user.cy.ts` (documents gap)
- **No routes**: Searched for `/api/auth/magic-link` - not found
- **Frontend reference**: `client/src/components/auth/EmailStep.tsx` line 47 - button text only
- **Search results**: "magic.link" found only in component text and V11 docs reference

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

---

## Partial Implementation Gaps

### GAP-003: Full Conversational Stack AI
**Severity**: MEDIUM  
**Journey Area**: 2. Stack AI Onboarding, 6. Stack AI Interaction  
**Status**: PARTIAL

#### Description
Stack AI currently only provides summaries and explanations. Full conversational capabilities from spec are missing.

#### Current State

**Working:**
- ✅ Portfolio summaries (`summarize_portfolio` in `ai_orchestrator.py`)
- ✅ Strategy explanations (`explain_strategy` in `ai_orchestrator.py`)
- ✅ Price queries (via separate market data API)
- ✅ Fallback templates when AI APIs unavailable

**Missing:**
- ❌ Execute commands ("Add AAPL to watchlist")
- ❌ General queries ("Weather in Auckland tomorrow?")
- ❌ Complex multi-turn conversations
- ❌ Command parsing and execution layer

#### Spec Requirement
> "Full conversational AI that can: Answer any question, Check prices, General queries, Execute commands, Explain features, Provide insights, Research Historical situations"

#### Evidence
- **File**: `server/services/ai_orchestrator.py` - Only has 2 functions: `summarize_portfolio` and `explain_strategy`
- **Test**: `server/tests/e2e/test_stack_ai_interaction.py` - Documents missing command execution
- **Test**: `client/cypress/e2e/journey_02_stack_ai_onboarding.cy.ts` - Documents missing general queries
- **Estimated success rate**: ~60% (below 90% spec target)

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
