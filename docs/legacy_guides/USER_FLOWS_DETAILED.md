# StackMotive Detailed User Flows

## 🚀 Complete User Journey Flows

### 1. 📝 New User Registration & Onboarding Flow

```
GUEST USER JOURNEY:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Landing Page  │────▶│   Login Page    │────▶│  Register Page  │
│      (/)        │     │    (/login)     │     │   (/register)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         │ (redirect)              │ (has account)          │ (form submit)
         ▼                        │                        ▼
┌─────────────────┐               │               ┌─────────────────┐
│   Login Page    │◀──────────────┘               │  Registration   │
│    (/login)     │                               │   Processing    │
└─────────────────┘                               └─────────────────┘
         │                                                 │
         │ (successful login)                             │ (success)
         ▼                                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ONBOARDING FLOW                                  │
│                        (/onboarding)                                 │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┤
│   Step 1:       │   Step 2:       │   Step 3:       │   Step 4:       │
│   Welcome       │   Portfolio     │   Personal      │   Tax Info      │
│   - Intro       │   - Currency    │   - Full Name   │   - Residency   │
│   - Motivation  │   - Risk Level  │   - Phone       │   - Tax Number  │
│                 │   - Timeline    │   - Employment  │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┤
                                                       │   Step 5:       │
                                                       │   Summary       │
                                                       │   - Review      │
                                                       │   - Confirm     │
                                                       └─────────────────┘
                                                                │
                                                                ▼
                                                       ┌─────────────────┐
                                                       │   Dashboard     │
                                                       │  (/dashboard)   │
                                                       └─────────────────┘
```

### 2. 💹 Trading User Flow

```
ACTIVE USER - TRADING JOURNEY:
┌─────────────────┐
│   Dashboard     │
│  (/dashboard)   │
└─────────────────┘
         │
         │ (select trading)
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Trading Page   │────▶│ Trade Execution │────▶│   Strategies    │
│   (/trading)    │     │(/trading/trade) │     │(/trading/strat..)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         │                        │                        │ (build new)
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Paper Trading   │     │ Order Placed    │     │ AI Strategy     │
│    Setup        │     │   Confirmed     │     │    Builder      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         │ (create account)       │ (view results)         │ (save strategy)
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Paper Trading   │     │   Portfolio     │     │  Saved to       │
│   Dashboard     │     │   Analytics     │     │  Strategies     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 3. 📊 Analytics & Reporting Flow

```
ANALYTICS USER JOURNEY:
┌─────────────────┐
│   Dashboard     │
│  (/dashboard)   │
└─────────────────┘
         │
         │ (analytics section)
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Analytics      │────▶│  Technical      │────▶│ Market Sentiment│
│  Overview       │     │  Analysis       │     │   Analysis      │
│ (/analytics)    │     │(/analysis/tech..)│     │(/analysis/sent..)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Advanced        │     │ Combined        │     │ Custom Reports  │
│ Analytics       │     │ Portfolio       │     │   Builder       │
│(/advanced-anal..)│     │(/combined-port..)│     │(/reports/custom)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Export Data    │     │  Tax Reports    │     │ Generated       │
│   & Reports     │     │ (/reports/tax)  │     │  Report         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 4. ⚙️ Account Management Flow

```
ACCOUNT MANAGEMENT JOURNEY:
┌─────────────────┐
│   Dashboard     │
│  (/dashboard)   │
└─────────────────┘
         │
         │ (user menu)
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Profile   │────▶│   Settings      │────▶│ Account Mgmt    │
│   (/profile)    │     │  (/settings)    │     │(/account-mgmt)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         │ (basic info)           │ (preferences)          │ (advanced)
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Update Profile  │     │ App Preferences │     │ Security        │
│  Information    │     │ Notifications   │     │ Data Export     │
└─────────────────┘     │ API Keys        │     │ Account Delete  │
                        └─────────────────┘     └─────────────────┘
```

### 5. 🔄 Daily Active User Flow

```
TYPICAL DAILY USER SESSION:
┌─────────────────┐
│   Login         │
│  (/login)       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Dashboard     │ ◀──────────────┐
│  (/dashboard)   │                │ (navigation hub)
└─────────────────┘                │
         │                         │
         │ (choose activity)       │
         ▼                         │
┌─────────────────┐                │
│ Primary Tasks:  │                │
│ • Check News    │────────────────┘
│ • View Portfolio│
│ • Execute Trades│
│ • Run Analysis  │
│ • Review Reports│
└─────────────────┘
         │
         │ (session end)
         ▼
┌─────────────────┐
│    Logout       │
│   (automatic    │
│  or manual)     │
└─────────────────┘
```

## 🚨 Error & Edge Case Flows

### Authentication Failures
```
Login Failed → Error Message → Retry or Register
Token Expired → Auto Refresh → Continue or Re-login
```

### Navigation Guards
```
Direct URL Access → Check Auth → Check Onboarding → Redirect Appropriately
Incomplete Onboarding → Force to /onboarding → Block other routes
```

### Data Loading States
```
Page Load → Loading Spinner → Data Fetch → Render Content or Error State
```

## 🎯 Key User Decision Points

1. **Registration**: "Do I have an account?" → Login vs Register
2. **Onboarding**: "Complete setup now?" → Continue vs Skip (blocked)
3. **Trading**: "Real vs Paper?" → Live trading vs Safe practice
4. **Analysis**: "Quick view vs Deep dive?" → Dashboard vs Analytics pages
5. **Reports**: "Standard vs Custom?" → Pre-built vs Builder tool

## 📱 Mobile Considerations
- All flows responsive
- Touch-friendly navigation
- Simplified mobile menus
- Gesture support for trading interfaces 