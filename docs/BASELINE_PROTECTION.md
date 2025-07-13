# 🔒 BASELINE PROTECTION: v1.0-auth-routing-stable

## 📋 OVERVIEW
**Tag:** `v1.0-auth-routing-stable`  
**Commit:** `e518ab7`  
**Date:** December 2024  
**Status:** 🟢 PROTECTED BASELINE

This baseline represents a **WORKING, STABLE** state of:
- ✅ Authentication & routing logic
- ✅ Paper trading account management
- ✅ Logout functionality
- ✅ Layout and sidebar implementation
- ✅ Query cache synchronization

## 🚨 CRITICAL RULE
**NO CHANGES** to the following files are allowed without explicit baseline verification:

```
client/src/context/auth-context.tsx
client/src/components/layout/page-layout.tsx
client/src/components/layout/sidebar.tsx
client/src/hooks/use-paper-trading.ts
```

## 🛡️ PROTECTED COMPONENTS

### 1. Auth Context (`auth-context.tsx`)
**Status:** 🔒 LOCKED
**Critical Features:**
- User authentication state management
- Onboarding status tracking
- Paper trading account integration
- Centralized logout functionality
- Query cache coordination

**Key State Interface:**
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasPaperTradingAccount: boolean;
  isUserReady: boolean;
}
```

### 2. Page Layout (`page-layout.tsx`)
**Status:** 🔒 LOCKED
**Critical Features:**
- Sidebar integration without spacing issues
- Authentication guards
- Responsive design preservation
- Clean layout without ghost containers

**Layout Structure:**
```jsx
<div className="flex h-screen bg-gray-50">
  <Sidebar collapsed={sidebarCollapsed} />
  <main className="flex-1 overflow-hidden">
    {/* Content with proper spacing */}
  </main>
</div>
```

### 3. Sidebar (`sidebar.tsx`)
**Status:** 🔒 LOCKED
**Critical Features:**
- Logout button in bottom-left (expanded + collapsed)
- Paper trading account balance display
- Navigation state management
- Responsive behavior

**Logout Implementation:**
```jsx
// Bottom of sidebar - MUST REMAIN
<button
  onClick={logout}
  className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50"
>
  <LogOut className="w-4 h-4" />
  {!collapsed && <span>Logout</span>}
</button>
```

### 4. Paper Trading Hook (`use-paper-trading.ts`)
**Status:** 🔒 LOCKED
**Critical Features:**
- Consistent query key: `['paper-trading-account']`
- Cache synchronization across components
- Error handling for 404 states
- Immediate cache invalidation

**Query Configuration:**
```typescript
const queryKey = ['paper-trading-account']; // MUST BE CONSISTENT
const queryConfig = {
  staleTime: 0,
  refetchOnMount: true
};
```

## 🧪 VERIFICATION CHECKLIST

Before making ANY changes to protected files, verify these scenarios work:

### ✅ Authentication Flow
- [ ] User logs in → redirects to `/paper-trading/dashboard`
- [ ] User without account → redirects to `/paper-trading/new`
- [ ] Unauthenticated user → redirects to `/login`
- [ ] No infinite redirect loops

### ✅ Logout Functionality  
- [ ] Logout button visible in sidebar (expanded + collapsed)
- [ ] Logout clears token and cache
- [ ] Logout redirects to `/login`
- [ ] User cannot access protected routes after logout

### ✅ Paper Trading Account Sync
- [ ] Account balance shows in sidebar
- [ ] Dashboard shows account details
- [ ] Components use same query key
- [ ] Cache updates propagate immediately

### ✅ Layout & Spacing
- [ ] No blank whitespace beside sidebar
- [ ] Responsive design works on mobile
- [ ] Content area uses full available space
- [ ] No ghost containers or margin issues

## 🚀 CHANGE WORKFLOW

### Step 1: Reference Baseline
```bash
git show v1.0-auth-routing-stable
git diff v1.0-auth-routing-stable..HEAD -- client/src/context/auth-context.tsx
```

### Step 2: Test Existing Functionality  
Run through the verification checklist above manually. Ensure:
- Multiple user accounts work
- Login/logout cycles function
- Account creation + onboarding flows
- Dashboard rendering is stable

### Step 3: Make Changes
- Keep changes minimal and focused
- Avoid refactoring multiple components simultaneously
- Maintain existing interfaces and exports

### Step 4: Verify No Regressions
- Test all scenarios from verification checklist
- Verify across different user states
- Check both desktop and mobile layouts

### Step 5: Document Breaking Changes
If you MUST make breaking changes:
- Document what changed and why
- Update this baseline document
- Create new baseline tag
- Notify team of breaking changes

## 📁 CRITICAL FILES MANIFEST

| File | Purpose | Protected Elements |
|------|---------|-------------------|
| `auth-context.tsx` | Auth state management | AuthState interface, logout function, query coordination |
| `page-layout.tsx` | Layout wrapper | Sidebar integration, spacing, responsive classes |
| `sidebar.tsx` | Navigation + logout | Logout button placement, account balance, navigation |
| `use-paper-trading.ts` | Account data hook | Query key consistency, cache settings |

## 🎯 SUCCESS CRITERIA

This baseline is considered **WORKING** when:
- ✅ Users can log in and access dashboard
- ✅ Paper trading accounts display correctly
- ✅ Logout functionality works reliably  
- ✅ No layout spacing issues
- ✅ Query cache stays synchronized
- ✅ No infinite redirect loops
- ✅ Mobile responsive design maintained

## ⚠️ COMMON FAILURE MODES

**Avoid these patterns that have caused issues:**

1. **Query Key Mismatches**
   ```typescript
   // BAD: Different keys cause cache desync
   ['paper-trading-account'] vs ['/api/user/paper-trading-account']
   
   // GOOD: Consistent key everywhere
   ['paper-trading-account']
   ```

2. **Layout Spacing Issues**
   ```jsx
   // BAD: Creates ghost space
   <main className="ml-64 p-6">
   
   // GOOD: Uses flex for clean layout
   <main className="flex-1 overflow-hidden">
   ```

3. **Auth State Race Conditions**
   ```typescript
   // BAD: Can cause redirect loops
   if (shouldRedirect()) navigate('/somewhere');
   
   // GOOD: Wait for loading to complete
   if (isUserReady && shouldRedirect()) navigate('/somewhere');
   ```

## 🔄 BASELINE UPDATES

To create a new baseline:
```bash
# 1. Ensure all tests pass
npm run test

# 2. Commit stable state
git add .
git commit -m "New baseline: [description]"

# 3. Tag new version
git tag -a v1.1-auth-routing-stable -m "Updated baseline with [changes]"

# 4. Update this document with new tag
```

---

**🔒 PROTECTION LEVEL: MAXIMUM**  
**📞 Contact required before changes to protected files**  
**⏰ Last verified:** December 2024  
**✅ Status:** All functionality confirmed working across multiple accounts 