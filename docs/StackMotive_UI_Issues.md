# StackMotive UI/UX Audit Issues

## Phase 1: Foundation Refactors

---

### Refactor: Merge Strategy & Signals Component Variants
**Description:**  
Two versions of "Strategy & Signals": one in [`client/src/pages/dashboard.tsx`](client/src/pages/dashboard.tsx), one in [`client/src/pages/paper-trading/dashboard.tsx`](client/src/pages/paper-trading/dashboard.tsx). Leads to UX inconsistency.

**Acceptance Criteria:**
- Extract logic into [`client/src/components/StrategySignals.tsx`](client/src/components/StrategySignals.tsx)
- Use unified component in both dashboards
- Remove duplicates
- Ensure visual/functional parity

**Labels:** `Refactor`, `UI`, `Dashboard`  
**Milestone:** Phase 1: Foundation Refactors

---

### Refactor: Standardize Dashboard Layouts
**Description:**  
Portfolio dashboard and paper trading dashboard have diverged. Layout, navigation and logic should be unified.

**Acceptance Criteria:**
- Audit layout differences
- Create shared layout wrapper
- Align nav/spacing/sections

**Labels:** `Refactor`, `UI`, `Dashboard`  
**Milestone:** Phase 1: Foundation Refactors

---

### Refactor: Remove Dead or Duplicated Files
**Description:**  
Remove unused or obsolete files (e.g., `cleanup_test_users.py`) to reduce clutter and maintainability risk.

**Acceptance Criteria:**
- Audit for unused files
- Remove & clean up imports

**Labels:** `Refactor`, `Cleanup`  
**Milestone:** Phase 1: Foundation Refactors

---

## Phase 2: Personalization

---

### Feature: Enhance Dashboard Personalization
**Description:**  
Current dashboards are static. No ability for users to customize layout, visibility, or preferences.

**Acceptance Criteria:**
- Store last selected tab per user
- Add personalization settings
- Show signals linked to user portfolio

**Labels:** `Feature`, `Personalization`, `Dashboard`  
**Milestone:** Phase 2: Personalization

---

### Feature: Onboarding Progress Tracking
**Description:**  
No persistent onboarding context is surfaced after login.

**Acceptance Criteria:**
- Track onboarding steps in user state
- Add checklist or progress tracker
- Display reminders in dashboard if incomplete

**Labels:** `Feature`, `Onboarding`, `UI`  
**Milestone:** Phase 2: Personalization

---

## Phase 3: Mobile Polish

---

### Bug: Fix Mobile Layout Gaps on Dashboard
**Description:**  
Dashboards have layout issues on mobile (scroll issues, overflow, tap zones).

**Acceptance Criteria:**
- Audit dashboards for mobile responsiveness
- Fix all known issues (alignment, overflow)
- Apply responsive styles

**Labels:** `Bug`, `Mobile`, `UI`  
**Milestone:** Phase 3: Mobile Polish

---

### Feature: Mobile-Optimized Trading Form
**Description:**  
[`client/src/components/trading/order-entry-form.tsx`](client/src/components/trading/order-entry-form.tsx) is difficult to use on small screens.

**Acceptance Criteria:**
- Stack fields vertically
- Increase tap zones
- Mobile test across form UX

**Labels:** `Feature`, `Mobile`, `Trading`  
**Milestone:** Phase 3: Mobile Polish

---

### Bug: Inconsistent Tab Navigation on Mobile
**Description:**  
Tabbed content in dashboards breaks or renders poorly on mobile.

**Acceptance Criteria:**
- Audit and refactor tabbed views
- Use unified responsive tab component

**Labels:** `Bug`, `Mobile`, `UI`  
**Milestone:** Phase 3: Mobile Polish 