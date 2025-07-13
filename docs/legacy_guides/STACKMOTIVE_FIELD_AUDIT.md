# StackMotive Field & Interaction Audit

## 🚨 **CRITICAL FINDINGS**

### **❌ Registration Page Issues**
**Current Registration Fields (register.tsx):**
- ✅ Email (required)
- ✅ Password (required, min 6 chars)
- ✅ Confirm Password (required, must match)
- ❌ **First Name** (required) - **SHOULD BE MOVED**
- ❌ **Last Name** (required) - **SHOULD BE MOVED**  
- ❌ **Currency** (defaults to USD) - **DUPLICATE/CONFLICT**
- ❌ **Trading Experience** (defaults to beginner) - **WRONG PAGE**

**Backend Reality:** Only email & password are actually sent to `/api/register` - other fields are collected but ignored!

### **✅ Proper Field Distribution Should Be:**
- **Registration:** Email, Password, Confirm Password ONLY
- **Onboarding Step 3:** First Name, Last Name, Full Name (consolidate)
- **Onboarding Step 3:** Preferred Currency (already exists)
- **Onboarding Step 2:** Trading Experience (combine with portfolio preferences)

---

## 📋 **COMPLETE FIELD AUDIT BY PAGE**

### 🔐 **Authentication Pages**

#### **Login Page** (`/login`)
**Fields:**
- ✅ Email (text, required)
- ✅ Password (password, required)
- ✅ Remember Me (checkbox, optional)

**Actions:**
- Submit → Login attempt
- "Forgot Password" link
- "Sign Up" link → Register page

#### **Register Page** (`/register`) ⚠️ **NEEDS FIXING**
**Current Fields:**
- ✅ Email (email, required, validation)
- ✅ Password (password, required, min 6 chars)
- ✅ Confirm Password (password, required, must match)
- ❌ First Name (text, required) - **MOVE TO ONBOARDING**
- ❌ Last Name (text, required) - **MOVE TO ONBOARDING**
- ❌ Currency (text, defaults USD) - **CONFLICTS WITH ONBOARDING**
- ❌ Trading Experience (text, defaults beginner) - **WRONG PAGE**

**Actions:**
- Submit → Create account + auto-login + redirect to onboarding
- "Sign In" link → Login page

**🔧 Recommended Fix:**
```
KEEP: Email, Password, Confirm Password
REMOVE: First Name, Last Name, Currency, Trading Experience
```

---

### 🎯 **Onboarding Flow** (`/onboarding`)

#### **Step 1: Welcome** (`StepWelcome`)
**Content:**
- Welcome message
- Platform introduction
- No form fields

**Actions:**
- "Get Started" button → Step 2

#### **Step 2: Portfolio** (`StepPortfolio`) ⚠️ **NEEDS TRADING EXPERIENCE**
**Current Fields:**
- ✅ Risk Tolerance (select: Conservative, Moderate, Aggressive)
- ✅ Investment Horizon (select: Short <1yr, Medium 1-3yr, Long 3+yr)
- ✅ Initial Investment (slider: $1,000 - $1,000,000)

**Missing Fields:**
- ❌ Trading Experience (should be moved here from Registration)

**Actions:**
- "Continue" button → Step 3

#### **Step 3: Personal Info** (`StepPersonalInfo`) ⚠️ **NEEDS NAME FIELDS**
**Current Fields:**
- ✅ Full Name (text, required, min 2 chars)
- ✅ Phone Number (text, optional)
- ✅ Preferred Currency (select: NZD, AUD, USD)

**Missing Fields:**
- ❌ Should consolidate with First Name + Last Name from Registration

**Actions:**
- "Continue" button → Step 4

#### **Step 4: Tax Info** (`StepTaxInfo`)
**Fields:**
- ✅ Tax Residency (text, required, min 2 chars, placeholder: "e.g., New Zealand")
- ✅ Tax Number (text, optional, placeholder: "e.g., IRD number")
- ✅ Employment Status (select: Employed, Self-employed, Student, Retired, Other)

**Actions:**
- "Continue" button → Step 5

#### **Step 5: Summary** (`StepSummary`)
**Content:**
- Review all entered information
- Confirmation before completion

**Actions:**
- "Complete Setup" → Dashboard

---

### 📊 **Main Application Pages**

#### **Dashboard** (`/dashboard`)
**Interactive Elements:**
- Portfolio overview cards (clickable)
- Quick action buttons (Buy/Sell shortcuts)
- Navigation menu
- Performance charts (interactive)
- Account balance display
- Recent transactions list

#### **Trading Pages**

##### **Trading Overview** (`/trading`)
**Elements:**
- Market overview widgets
- Quick trade buttons
- Portfolio summary cards
- Watchlist
- Market news feed

##### **Trade View** (`/trading/trade`) & Trading Components
**Two Trading Form Implementations Found:**

**🔧 OrderEntryForm Component** (order-entry-form.tsx):
**Fields:**
- ✅ Symbol (text, auto-filled from props)
- ✅ Order Side (toggle: BUY/SELL)
- ✅ Order Type (select: MARKET, LIMIT, STOP, STOP_LIMIT, TRAILING_STOP)
- ✅ Quantity (number, required, step 0.01)
- ✅ Price (number, conditional on order type, step 0.01)
- ✅ Stop Price (number, conditional on stop orders, step 0.01)
- ✅ Time In Force (select: GTC, IOC, FOK, DAY)
- ✅ Strategy ID (number, optional)
- ✅ Is Automated (boolean, default false)

**Convenience Features:**
- Bid/Ask/Last price buttons
- Estimated cost/proceeds calculator
- Color-coded Buy (green) / Sell (red) buttons

**🔧 TradingForm Component** (trading-form.tsx):
**Fields:**
- ✅ Symbol (text, passed as prop)
- ✅ Order Type (tabs: Market, Limit, Stop)
- ✅ Order Side (buttons: Buy/Sell with visual feedback)
- ✅ Quantity (number, validation for positive values)
- ✅ Price (number, conditional on non-market orders)
- ✅ Stop Price (number, for stop orders)
- ✅ Take Profit Price (number, optional with toggle)
- ✅ Stop Loss Price (number, optional with toggle)
- ✅ Trailing Stop (toggle + percentage slider: 0.5-10%)
- ✅ Order Expiry (radio: GTC, Day, 1 Hour)

**Advanced Features:**
- Real-time total calculation
- Price relationship validation
- Market price simulation

##### **Paper Trading Dashboard** (`/paper-trading/dashboard`)
**Trade Execution Fields:**
- ✅ Symbol Search (dropdown with popular symbols)
- ✅ Order Type (toggle: Buy/Sell)
- ✅ Quantity (number, step 0.00001)
- ✅ Current Price Display (auto-updated)
- ✅ Estimated Total Calculator

**Account Management:**
- ✅ Account selector (if multiple accounts)
- ✅ Holdings table (interactive)
- ✅ Transaction history
- ✅ Performance metrics

##### **AI Strategy Builder** (`/trading/ai-strategy-builder`)
**Configuration Fields:**
- ✅ Symbol (text, required)
- ✅ Exchange (text, required)
- ✅ Timeframe (select, required)
- ✅ Risk Level (select, required)
- ✅ Strategy Type (select, required)
- ✅ Investment Amount (number, min 1)
- ✅ Include Options (boolean, default false)
- ✅ Max Positions (number, optional)
- ✅ Trading Hours (multi-select array, optional)

#### **Analytics Pages**

##### **Analytics Overview** (`/analytics`)
**Interactive Elements:**
- Date range picker (from/to dates)
- Chart type selector (line, bar, candlestick)
- Performance filters (asset type, time period)
- Export options (PDF, CSV, Excel)

##### **Technical Analysis** (`/analysis/technical`)
**Tool Elements:**
- Chart drawing tools
- Technical indicator selectors (RSI, MACD, Bollinger Bands, etc.)
- Timeframe options (1m, 5m, 1h, 1d, 1w, 1m)
- Overlay options (volume, moving averages)

##### **Market Sentiment** (`/analysis/sentiment`)
**Analysis Tools:**
- Sentiment score filters
- News source selectors
- Date range controls
- Market sector filters

#### **Reports**

##### **Custom Reports** (`/reports/custom`)
**Report Builder Fields:**
- ✅ Report Name (text, required)
- ✅ Date Range (date picker, from/to)
- ✅ Data Fields Selector (checkboxes for columns)
- ✅ Format Options (select: PDF, CSV, Excel)
- ✅ Grouping Options (select: by asset, by date, by strategy)
- ✅ Filter Criteria (multiple field filters)

#### **Account Management**

##### **Settings** (`/settings`)
**Configuration Fields:**
- ✅ Notification Preferences (toggles for email, SMS, push)
- ✅ Display Settings (theme, language, currency format)
- ✅ API Key Management (create, revoke, permissions)
- ✅ Security Settings (2FA, password change)
- ✅ Data Export Options (account data, trade history)

##### **User Profile** (`/profile`)
**Profile Fields:**
- ✅ Profile Photo Upload (file input + crop tool)
- ✅ Display Name (text, different from full legal name)
- ✅ Email (read-only, shown for reference)
- ✅ Bio/Description (textarea, optional)
- ✅ Social Links (optional URLs)
- ✅ Privacy Settings (profile visibility options)

---

## 🔧 **RECOMMENDED FIXES**

### **Priority 1: Registration Page**
```diff
REMOVE from Registration:
- ❌ firstName
- ❌ lastName  
- ❌ currency
- ❌ tradingExperience

KEEP in Registration:
+ ✅ email
+ ✅ password
+ ✅ confirmPassword
```

### **Priority 2: Onboarding Consolidation**
```diff
Step 2 - Portfolio (ADD):
+ ✅ tradingExperience (select: Beginner, Intermediate, Advanced, Expert)

Step 3 - Personal Info (MODIFY):
+ ✅ firstName (moved from registration)
+ ✅ lastName (moved from registration)
~ ✅ fullName (consolidate with above OR replace)
+ ✅ preferredCurrency (keep existing)
+ ✅ phone (keep existing)
```

### **Priority 3: Trading Form Standardization**
**Issue:** Multiple trading form implementations with different fields
**Recommendation:** Standardize on OrderEntryForm component with these core fields:
- Symbol, Side, Type, Quantity, Price, Time In Force
- Optional: Strategy ID, Stop Price, Advanced options

---

## 📊 **FIELD DISTRIBUTION MATRIX**

| Field | Current Page | Recommended Page | Status |
|-------|-------------|------------------|---------|
| Email | Registration | Registration | ✅ Correct |
| Password | Registration | Registration | ✅ Correct |
| Confirm Password | Registration | Registration | ✅ Correct |
| First Name | Registration | Onboarding Step 3 | ❌ Move |
| Last Name | Registration | Onboarding Step 3 | ❌ Move |
| Currency | Registration | Onboarding Step 3 | ❌ Duplicate |
| Trading Experience | Registration | Onboarding Step 2 | ❌ Move |
| Risk Tolerance | Onboarding Step 2 | Onboarding Step 2 | ✅ Correct |
| Investment Horizon | Onboarding Step 2 | Onboarding Step 2 | ✅ Correct |
| Initial Investment | Onboarding Step 2 | Onboarding Step 2 | ✅ Correct |
| Full Name | Onboarding Step 3 | Onboarding Step 3 | ⚠️ Consolidate |
| Phone | Onboarding Step 3 | Onboarding Step 3 | ✅ Correct |
| Preferred Currency | Onboarding Step 3 | Onboarding Step 3 | ✅ Correct |
| Tax Residency | Onboarding Step 4 | Onboarding Step 4 | ✅ Correct |
| Tax Number | Onboarding Step 4 | Onboarding Step 4 | ✅ Correct |
| Employment Status | Onboarding Step 4 | Onboarding Step 4 | ✅ Correct |

---

## 🎯 **KEY USER INTERACTION PATTERNS**

### **Form Validation Patterns**
- **Real-time validation** on critical fields (email format, password strength)
- **Cross-field validation** (password confirmation, price relationships)
- **Business logic validation** (sufficient balance, market hours, etc.)

### **Trading Workflow Patterns**
1. **Symbol Selection** → **Order Configuration** → **Review** → **Execute**
2. **Quick Trade** buttons for common actions
3. **Advanced Order** forms for complex strategies
4. **Simulation Mode** in paper trading

### **Data Entry Assistance**
- **Auto-complete** for symbols and exchanges
- **Price helpers** (bid/ask/last buttons)
- **Calculation aids** (total cost, profit/loss estimates)
- **Validation feedback** (immediate error highlighting)

---

## 🎯 **NEXT STEPS**

1. **Fix Registration** - Remove inappropriate fields, simplify to core authentication
2. **Update Onboarding Step 2** - Add trading experience field
3. **Update Onboarding Step 3** - Add name fields, consolidate with existing
4. **Standardize Trading Forms** - Choose one implementation, ensure consistency
5. **Test Data Flow** - Ensure all fields save properly to backend
6. **UX Review** - Validate logical field grouping and progressive disclosure
7. **Accessibility Audit** - Ensure all forms are properly labeled and navigable
8. **Mobile Optimization** - Verify field layouts work on smaller screens 