# StackMotive Visual User Journey Map

## 🎯 Complete User Journey: Signup → Onboarding → Dashboard → Trading

```
📱 ENTRY POINT
     ↓
┌─────────────────┐
│   Landing Page  │
│                 │
│ [Login] [Signup]│
└─────────────────┘
     ↓ (New User)
```

---

## 🔐 **AUTHENTICATION FLOW**

### **Page 1: Registration** `/register`
```
┌─────────────────────────────────────────┐
│            📝 CREATE ACCOUNT            │
├─────────────────────────────────────────┤
│                                         │
│  Email Address           [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ your.email@example.com              │ │
│  └─────────────────────────────────────┘ │
│  ✓ Valid email format required          │
│                                         │
│  Password                [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ ••••••••••••••••••••••••••••••••    │ │
│  └─────────────────────────────────────┘ │
│  ✓ Minimum 6 characters                 │
│                                         │
│  Confirm Password        [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ ••••••••••••••••••••••••••••••••    │ │
│  └─────────────────────────────────────┘ │
│  ✓ Must match password above            │
│                                         │
│         ┌─────────────────┐             │
│         │   [SIGN UP]     │             │
│         └─────────────────┘             │
│                                         │
│  Already have account? [Sign In]        │
└─────────────────────────────────────────┘
     ↓ (Success: Auto-login + redirect)
```

**VALIDATION RULES:**
- ✅ Email: Valid format, unique in system
- ✅ Password: Min 6 chars, secure
- ✅ Confirm: Must match password
- 🚫 NO personal info (moved to onboarding)

**BACKEND ACTION:** `POST /api/register` → `POST /api/login` → redirect to `/onboarding`

---

## 🎯 **ONBOARDING FLOW** (5 Steps)

### **Step 1: Welcome** `/onboarding` (Step 1/5)
```
┌─────────────────────────────────────────┐
│        🎉 WELCOME TO STACKMOTIVE        │
├─────────────────────────────────────────┤
│                                         │
│  Let's get you set up with your         │
│  trading account.                       │
│                                         │
│  In the next few steps, we'll help you: │
│  • Set up your portfolio preferences    │
│  • Configure your personal information  │
│  • Set up tax reporting details         │
│  • Get ready to start trading           │
│                                         │
│  Why this matters:                      │
│  ✓ Personalized trading experience      │
│  ✓ Accurate tax reporting               │
│  ✓ Better portfolio tracking            │
│  ✓ Tailored market insights             │
│                                         │
│         ┌─────────────────┐             │
│         │ LET'S GET STARTED│             │
│         └─────────────────┘             │
│                                         │
│ Progress: ● ○ ○ ○ ○                     │
└─────────────────────────────────────────┘
     ↓ (Continue)
```

**FIELDS:** None (informational only)
**ACTION:** Continue to Step 2

---

### **Step 2: Portfolio Preferences** `/onboarding` (Step 2/5)
```
┌─────────────────────────────────────────┐
│        📊 PORTFOLIO PREFERENCES         │
├─────────────────────────────────────────┤
│                                         │
│  Trading Experience      [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ Beginner              ▼             │ │
│  └─────────────────────────────────────┘ │
│  Options: Beginner, Intermediate,       │
│          Advanced, Expert               │
│                                         │
│  Risk Tolerance          [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ Moderate              ▼             │ │
│  └─────────────────────────────────────┘ │
│  Options: Conservative, Moderate,       │
│          Aggressive                     │
│                                         │
│  Investment Horizon      [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ Medium Term (1-3 years) ▼           │ │
│  └─────────────────────────────────────┘ │
│  Options: Short (<1yr), Medium (1-3yr), │
│          Long Term (3+ years)           │
│                                         │
│  Initial Investment      [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ ████████░░░░ $25,000                │ │
│  └─────────────────────────────────────┘ │
│  Range: $1,000 - $1,000,000            │
│                                         │
│         ┌─────────────────┐             │
│         │   [CONTINUE]    │             │
│         └─────────────────┘             │
│                                         │
│ Progress: ● ● ○ ○ ○                     │
└─────────────────────────────────────────┘
     ↓ (Continue)
```

**VALIDATION RULES:**
- ✅ Trading Experience: Required enum selection
- ✅ Risk Tolerance: Required enum selection  
- ✅ Investment Horizon: Required enum selection
- ✅ Initial Investment: Required, $1K-$1M range

**BACKEND ACTION:** `POST /api/user/onboarding/progress` (step: 2)

---

### **Step 3: Personal Information** `/onboarding` (Step 3/5)
```
┌─────────────────────────────────────────┐
│        👤 PERSONAL INFORMATION          │
├─────────────────────────────────────────┤
│                                         │
│  First Name              [MANDATORY]    │
│  ┌──────────────────┐┌──────────────────┐│
│  │ John             ││ Doe              ││
│  └──────────────────┘└──────────────────┘│
│  Last Name               [MANDATORY]    │
│                                         │
│  Full Name (Display)     [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ John Doe                            │ │
│  └─────────────────────────────────────┘ │
│  ✓ Auto-populated from first/last      │
│                                         │
│  Phone Number            [OPTIONAL]     │
│  ┌─────────────────────────────────────┐ │
│  │ +64 123 456 789                     │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  Preferred Currency      [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ USD                   ▼             │ │
│  └─────────────────────────────────────┘ │
│  Options: NZD, AUD, USD                 │
│                                         │
│         ┌─────────────────┐             │
│         │   [CONTINUE]    │             │
│         └─────────────────┘             │
│                                         │
│ Progress: ● ● ● ○ ○                     │
└─────────────────────────────────────────┘
     ↓ (Continue)
```

**VALIDATION RULES:**
- ✅ First Name: Required, min 1 char
- ✅ Last Name: Required, min 1 char
- ✅ Full Name: Required, min 2 chars (auto-populated)
- ✅ Phone: Optional, any format accepted
- ✅ Currency: Required enum (NZD/AUD/USD)

**BACKEND ACTION:** `POST /api/user/onboarding/progress` (step: 3)

---

### **Step 4: Tax Information** `/onboarding` (Step 4/5)
```
┌─────────────────────────────────────────┐
│         📋 TAX INFORMATION              │
├─────────────────────────────────────────┤
│                                         │
│  Tax Residency           [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ New Zealand                         │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  Tax Number              [OPTIONAL]     │
│  ┌─────────────────────────────────────┐ │
│  │ 123-456-789                         │ │
│  └─────────────────────────────────────┘ │
│  (IRD number, SSN, etc.)                │
│                                         │
│  Employment Status       [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ Employed              ▼             │ │
│  └─────────────────────────────────────┘ │
│  Options: Employed, Self-employed,      │
│          Student, Retired, Other        │
│                                         │
│         ┌─────────────────┐             │
│         │   [CONTINUE]    │             │
│         └─────────────────┘             │
│                                         │
│ Progress: ● ● ● ● ○                     │
└─────────────────────────────────────────┘
     ↓ (Continue)
```

**VALIDATION RULES:**
- ✅ Tax Residency: Required string
- ✅ Tax Number: Optional string
- ✅ Employment Status: Required enum selection

**BACKEND ACTION:** `POST /api/user/onboarding/progress` (step: 4)

---

### **Step 5: Summary & Completion** `/onboarding` (Step 5/5)
```
┌─────────────────────────────────────────┐
│           ✅ SETUP COMPLETE             │
├─────────────────────────────────────────┤
│                                         │
│  Review your information:               │
│                                         │
│  👤 Personal Details                    │
│     Name: John Doe                      │
│     Email: john@example.com             │
│     Phone: +64 123 456 789              │
│     Currency: USD                       │
│                                         │
│  📊 Portfolio Preferences               │
│     Experience: Intermediate            │
│     Risk Tolerance: Moderate            │
│     Horizon: Medium Term                │
│     Initial Investment: $25,000         │
│                                         │
│  📋 Tax Information                     │
│     Residency: New Zealand              │
│     Status: Employed                    │
│                                         │
│  ┌─────────────────┐┌─────────────────┐ │
│  │     [BACK]      ││ [COMPLETE SETUP]│ │
│  └─────────────────┘└─────────────────┘ │
│                                         │
│ Progress: ● ● ● ● ●                     │
└─────────────────────────────────────────┘
     ↓ (Complete Setup)
```

**ACTIONS:**
- Review all collected data
- `POST /api/user/preferences` (save currency)
- `POST /api/user/onboarding-complete` (mark complete)
- Redirect to `/dashboard`

---

## 🏠 **MAIN APPLICATION FLOW**

### **Dashboard Landing** `/dashboard`
```
┌─────────────────────────────────────────────────────────┐
│  STACKMOTIVE    [Portfolio] [Trading] [Analytics] [⚙️]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Welcome back, John! 👋                                │
│                                                         │
│  📊 PORTFOLIO OVERVIEW                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐│
│  │ Total Value     │ │ Today's Change  │ │ Holdings    ││
│  │ $25,000.00     │ │ +$125.50 (0.5%) │ │     5       ││
│  └─────────────────┘ └─────────────────┘ └─────────────┘│
│                                                         │
│  🔄 QUICK ACTIONS                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ [BUY STOCK] │ │ [SELL STOCK]│ │ [VIEW TRADES]│       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  📈 RECENT ACTIVITY                                     │
│  • Bought 10 shares of AAPL @ $150.00                  │
│  • Sold 5 shares of MSFT @ $280.50                     │
│  • Dividend received: $12.50 from VOO                  │
│                                                         │
│  📊 PERFORMANCE CHART                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │     ╭─╮   ╭─╮                                       ││
│  │   ╭─╯ ╰─╮╱   ╰─╮                                    ││
│  │ ╭─╯      ╰     ╰─╮                                  ││
│  │╱                 ╰─╮                                ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
     ↓ (Navigate to sections)
```

---

## 📈 **TRADING SECTION** `/trading`

### **Trading Overview** `/trading`
```
┌─────────────────────────────────────────────────────────┐
│  🔄 TRADING OVERVIEW                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💰 ACCOUNT BALANCE: $25,000.00                        │
│  📊 BUYING POWER: $22,350.00                           │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │[PLACE TRADE]│ │[PAPER TRADE]│ │[ORDER BOOK] │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  🎯 AI STRATEGY BUILDER                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Create automated trading strategies with AI         ││
│  │ [BUILD STRATEGY]                                    ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📋 ACTIVE ORDERS                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Symbol │ Type  │ Quantity │ Price  │ Status         ││
│  │ AAPL   │ BUY   │ 10       │ $149.50│ Pending        ││
│  │ MSFT   │ SELL  │ 5        │ $285.00│ Filled         ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### **Place Trade** `/trading/trade`
```
┌─────────────────────────────────────────┐
│           📈 PLACE TRADE                │
├─────────────────────────────────────────┤
│                                         │
│  Stock Symbol            [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ AAPL                  [🔍 Search]   │ │
│  └─────────────────────────────────────┘ │
│  Current: $150.25 (+1.2%)               │
│                                         │
│  Order Type              [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ Market Order          ▼             │ │
│  └─────────────────────────────────────┘ │
│  Options: Market, Limit, Stop, Stop-Limit│
│                                         │
│  Action                  [MANDATORY]    │
│  ┌─────────┐ ┌─────────┐               │
│  │ [BUY]   │ │  SELL   │               │
│  └─────────┘ └─────────┘               │
│                                         │
│  Quantity                [MANDATORY]    │
│  ┌─────────────────────────────────────┐ │
│  │ 10                                  │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  Total Cost: $1,502.50                 │
│                                         │
│  ┌─────────────────┐┌─────────────────┐ │
│  │   [PREVIEW]     ││  [PLACE ORDER]  │ │
│  └─────────────────┘└─────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📊 **ANALYTICS SECTION** `/analytics`

### **Analytics Dashboard** `/analytics`
```
┌─────────────────────────────────────────────────────────┐
│  📊 ANALYTICS & REPORTING                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📅 DATE RANGE          [FILTER CONTROLS]              │
│  ┌─────────────┐ to ┌─────────────┐ ┌─────────────┐    │
│  │ 2024-01-01  │    │ 2024-12-31  │ │   [APPLY]   │    │
│  └─────────────┘    └─────────────┘ └─────────────┘    │
│                                                         │
│  📈 PORTFOLIO PERFORMANCE                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │                Performance Chart                    ││
│  │     ╭─╮       ╭─╮                                   ││
│  │   ╭─╯ ╰─╮   ╭─╯ ╰─╮                                 ││
│  │ ╭─╯     ╰─╮╱     ╰─╮                               ││
│  │╱           ╰       ╰─╮                             ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  💰 KEY METRICS                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐│
│  │ Total Return    │ │ Annual Return   │ │ Sharpe Ratio││
│  │ +$2,150 (8.6%) │ │ 12.3%          │ │ 1.45        ││
│  └─────────────────┘ └─────────────────┘ └─────────────┘│
│                                                         │
│  📋 TRANSACTION HISTORY                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Date      │Symbol│Type │Qty│Price │Total │P&L      ││
│  │ 2024-01-15│AAPL  │BUY  │10 │150.00│1500.0│+125.50  ││
│  │ 2024-01-20│MSFT  │SELL │5  │280.50│1402.5│+85.25   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────┐ ┌─────────────────┐               │
│  │ [EXPORT CSV]    │ │ [GENERATE PDF]  │               │
│  └─────────────────┘ └─────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ **ACCOUNT MANAGEMENT** `/account`

### **Account Settings** `/account/settings`
```
┌─────────────────────────────────────────┐
│           ⚙️ ACCOUNT SETTINGS           │
├─────────────────────────────────────────┤
│                                         │
│  👤 PROFILE INFORMATION                 │
│  ┌─────────────────────────────────────┐ │
│  │ Name: John Doe                      │ │
│  │ Email: john@example.com             │ │
│  │ Phone: +64 123 456 789              │ │
│  │ Currency: USD                       │ │
│  │                    [EDIT PROFILE]   │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  🔒 SECURITY                            │
│  ┌─────────────────────────────────────┐ │
│  │ Password: ••••••••••••••            │ │
│  │                [CHANGE PASSWORD]    │ │
│  │                                     │ │
│  │ Two-Factor Auth: ❌ Disabled        │ │
│  │                [ENABLE 2FA]         │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  📊 TRADING PREFERENCES                 │
│  ┌─────────────────────────────────────┐ │
│  │ Experience: Intermediate            │ │
│  │ Risk Tolerance: Moderate            │ │
│  │ Investment Horizon: Medium Term     │ │
│  │                [UPDATE PREFERENCES] │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  🔔 NOTIFICATIONS                       │
│  ┌─────────────────────────────────────┐ │
│  │ ✅ Email alerts for trades          │ │
│  │ ✅ Portfolio performance updates    │ │
│  │ ❌ Market news notifications        │ │
│  │                [SAVE SETTINGS]      │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔍 **FIELD REQUIREMENTS SUMMARY**

| Page/Step | Mandatory Fields | Optional Fields | Validation Rules |
|-----------|------------------|-----------------|------------------|
| **Registration** | email, password, confirmPassword | none | Email format, password min 6 chars, passwords match |
| **Onboarding Step 1** | none | none | Informational only |
| **Onboarding Step 2** | tradingExperience, riskTolerance, investmentHorizon, initialInvestment | none | Enum selections, investment $1K-$1M |
| **Onboarding Step 3** | firstName, lastName, fullName, preferredCurrency | phone | Name min lengths, currency enum |
| **Onboarding Step 4** | taxResidency, employmentStatus | taxNumber | String inputs, enum selection |
| **Onboarding Step 5** | none | none | Review and confirmation |
| **Trading Forms** | symbol, orderType, action, quantity | stopLoss, takeProfit, timeInForce | Valid symbols, positive quantities |
| **Analytics** | none | dateRange, filters | Valid date ranges |
| **Account Settings** | varies by section | varies by section | Context-specific validation |

---

## 🔄 **NAVIGATION DECISION POINTS**

```
Registration Success
     ↓
Has Completed Onboarding?
     ├─ NO  → Redirect to /onboarding
     └─ YES → Redirect to /dashboard

Dashboard Access
     ↓
Portfolio Created?
     ├─ NO  → Show setup wizard
     └─ YES → Show full dashboard

Trading Access
     ↓
Account Verified?
     ├─ NO  → Show verification required
     └─ YES → Allow trading

Paper Trading
     ↓
Always Available (no restrictions)

Analytics Access
     ├─ Has Trades? → Show full analytics
     └─ No Trades? → Show welcome message
```

This visual journey map shows **exactly** what users see at each step, what fields they need to fill out, and how the flow progresses. Does this give you the clear visual understanding you were looking for? 