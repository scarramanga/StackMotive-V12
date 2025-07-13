# StackMotive Application Sitemap

## 🏗️ Site Structure Overview

```
StackMotive App
├── 🔐 Authentication
│   ├── /login - Login Page
│   ├── /register - Registration Page
│   └── /logout - Logout Action
│
├── 🎯 Onboarding Flow (Required for new users)
│   └── /onboarding
│       ├── Step 1: Welcome
│       ├── Step 2: Portfolio Setup
│       ├── Step 3: Personal Info
│       ├── Step 4: Tax Info
│       └── Step 5: Summary
│
├── 📊 Main Application (Post-Onboarding)
│   ├── / - Dashboard (Default route)
│   ├── /dashboard - Main Dashboard
│   │
│   ├── 💹 Trading Section
│   │   ├── /trading - Trading Overview
│   │   ├── /trading/trade - Trade View (Execute Trades)
│   │   ├── /trading/strategies - Trading Strategies
│   │   └── /trading/ai-strategy-builder - AI Strategy Builder
│   │
│   ├── 📄 Paper Trading Section
│   │   ├── /paper-trading/new - Create New Paper Trading Account
│   │   ├── /paper-trading/dashboard - Paper Trading Dashboard
│   │   └── /paper-trading/strategy - Strategy Selector
│   │
│   ├── 📈 Analytics Section
│   │   ├── /analytics - Analytics Overview
│   │   ├── /advanced-analytics - Advanced Analytics
│   │   ├── /analysis/technical - Technical Analysis
│   │   ├── /analysis/sentiment - Market Sentiment Analysis
│   │   ├── /analysis/portfolio - Portfolio Analysis
│   │   └── /combined-portfolio - Combined Portfolio View
│   │
│   ├── 📋 Reports Section
│   │   ├── /reports - Reports Index
│   │   ├── /reports/custom - Custom Report Builder
│   │   └── /reports/tax - Tax Reports
│   │
│   ├── 🛠️ Tools & Utilities
│   │   ├── /news - News & Market Updates
│   │   ├── /whale-tracking - Whale Tracking
│   │   ├── /education - Educational Resources
│   │   ├── /tax-calculator - Tax Calculator
│   │   └── /scheduled-trades - Scheduled Trades
│   │
│   ├── ⚙️ Management & Settings
│   │   ├── /settings - Application Settings
│   │   ├── /account-management - Account Management
│   │   ├── /profile - User Profile
│   │   └── /admin-testers - Admin Testers (Admin Only)
│   │
│   └── /strategies - Legacy Strategies Page
│
└── 🚫 Error States
    └── /404 - Not Found Page
```

## 🎭 User States & Access Levels

### Guest User (Unauthenticated)
- **Accessible Pages**: /login, /register
- **Redirects**: All other routes → /login

### New User (Authenticated, No Onboarding)
- **Accessible Pages**: /onboarding, /settings, /logout
- **Redirects**: All other routes → /onboarding

### Active User (Authenticated + Onboarding Complete)
- **Accessible Pages**: All main application pages
- **Default Route**: /dashboard

### Admin User
- **Additional Access**: /admin-testers
- **Same Access**: All regular user pages

## 🔄 Key Routing Rules

1. **Authentication Guard**: Unauthenticated users → /login
2. **Onboarding Guard**: Users without onboarding → /onboarding
3. **Completion Redirect**: Onboarding complete → /dashboard
4. **Root Redirect**: / → /dashboard (for authenticated users)
5. **404 Fallback**: Invalid routes → Not Found page

## 📊 Page Categories

### **Core Functionality (High Traffic)**
- Dashboard, Trading, Analytics, Paper Trading

### **Utility Pages (Medium Traffic)**
- News, Reports, Settings, Account Management

### **Specialized Tools (Lower Traffic)**
- Whale Tracking, Tax Calculator, Education, Admin Tools 