-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "trialStartedAt" DATETIME,
    "trialEndsAt" DATETIME,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "taxResidency" TEXT,
    "secondaryTaxResidency" TEXT,
    "taxIdentificationNumber" TEXT,
    "taxFileNumber" TEXT,
    "taxRegisteredBusiness" BOOLEAN NOT NULL DEFAULT false,
    "taxYear" TEXT
);

-- CreateTable
CREATE TABLE "TradingAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "apiPassphrase" TEXT,
    "accountNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" DECIMAL,
    "currency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSynced" DATETIME,
    "connectionStatus" TEXT,
    CONSTRAINT "TradingAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "accountId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "indicators" TEXT NOT NULL,
    "entryConditions" TEXT NOT NULL,
    "exitConditions" TEXT NOT NULL,
    "riskPercentage" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "performance" DECIMAL,
    "winRate" DECIMAL,
    "profitFactor" DECIMAL,
    CONSTRAINT "Strategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Strategy_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TradingAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "strategyId" INTEGER,
    "accountId" INTEGER,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entryPrice" DECIMAL NOT NULL,
    "exitPrice" DECIMAL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "profitLoss" DECIMAL,
    "profitLossPercentage" DECIMAL,
    "exchange" TEXT,
    "entryTime" DATETIME NOT NULL,
    "exitTime" DATETIME,
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "taxImpact" TEXT,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TradingAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomationPreference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "strategyId" INTEGER,
    "symbol" TEXT,
    "automationLevel" TEXT NOT NULL DEFAULT 'notification',
    "notificationChannels" TEXT NOT NULL,
    "minSignalStrength" DECIMAL,
    "maxTradeAmount" DECIMAL,
    "cooldownPeriod" INTEGER,
    "activeHours" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AutomationPreference_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BacktestSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "strategyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "initialCapital" DECIMAL NOT NULL,
    "finalCapital" DECIMAL,
    "profitLoss" DECIMAL,
    "profitLossPercentage" DECIMAL,
    "maxDrawdown" DECIMAL,
    "winRate" DECIMAL,
    "totalTrades" INTEGER,
    "winningTrades" INTEGER,
    "losingTrades" INTEGER,
    "sharpeRatio" DECIMAL,
    "status" TEXT NOT NULL,
    "resultSummary" TEXT,
    "configuration" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "BacktestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BacktestSession_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BacktestTrade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entryPrice" DECIMAL NOT NULL,
    "exitPrice" DECIMAL,
    "quantity" DECIMAL NOT NULL,
    "entryTime" DATETIME NOT NULL,
    "exitTime" DATETIME,
    "profitLoss" DECIMAL,
    "profitLossPercentage" DECIMAL,
    "indicators" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    CONSTRAINT "BacktestTrade_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BacktestSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaxSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "taxYear" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "accountingMethod" TEXT NOT NULL DEFAULT 'FIFO',
    "includeFees" BOOLEAN NOT NULL DEFAULT true,
    "includeForeignTax" BOOLEAN NOT NULL DEFAULT true,
    "capitalGainsRules" TEXT,
    "ratesTable" TEXT,
    "exemptions" TEXT,
    "offsetLosses" BOOLEAN NOT NULL DEFAULT true,
    "carryForward" BOOLEAN NOT NULL DEFAULT true,
    "previousYearLosses" DECIMAL NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaxSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaxLot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tradeId" INTEGER,
    "taxYear" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "acquiredDate" DATETIME NOT NULL,
    "disposedDate" DATETIME,
    "quantity" DECIMAL NOT NULL,
    "costBasis" DECIMAL NOT NULL,
    "proceeds" DECIMAL,
    "adjustedCostBasis" DECIMAL,
    "feesPaid" DECIMAL NOT NULL DEFAULT 0,
    "foreignTaxPaid" DECIMAL NOT NULL DEFAULT 0,
    "exchangeRate" DECIMAL,
    "gainLoss" DECIMAL,
    "gainType" TEXT,
    "taxRate" DECIMAL,
    "taxOwed" DECIMAL,
    "washSale" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" DATETIME NOT NULL,
    CONSTRAINT "TaxLot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaxLot_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortfolioPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rebalanceFrequency" TEXT NOT NULL DEFAULT 'quarterly',
    "lastRebalanced" DATETIME,
    "nextScheduledRebalance" DATETIME,
    "deviationThreshold" DECIMAL NOT NULL DEFAULT 5,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PortfolioPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RebalanceRecommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "portfolioPlanId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalPortfolioValue" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" DATETIME,
    "recommendations" TEXT NOT NULL,
    "estimatedFees" DECIMAL,
    "estimatedTaxImpact" DECIMAL,
    "notes" TEXT,
    CONSTRAINT "RebalanceRecommendation_portfolioPlanId_fkey" FOREIGN KEY ("portfolioPlanId") REFERENCES "PortfolioPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RebalanceRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaperTradingAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "initialBalance" DECIMAL NOT NULL,
    "currentBalance" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PaperTradingAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaperTradingTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "strategyId" INTEGER,
    "symbol" TEXT,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "price" DECIMAL,
    "amount" DECIMAL NOT NULL,
    "fees" DECIMAL NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL,
    "notes" TEXT,
    CONSTRAINT "PaperTradingTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PaperTradingAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaperTradingTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaperTradingTransaction_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaxCalculation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "taxYear" TEXT NOT NULL,
    "totalGains" REAL NOT NULL,
    "totalLosses" REAL NOT NULL,
    "netIncome" REAL NOT NULL,
    "taxableIncome" REAL NOT NULL,
    "taxOwed" REAL NOT NULL,
    "carryForwardLosses" REAL NOT NULL,
    "foreignIncome" REAL NOT NULL,
    "feesPaid" REAL NOT NULL,
    "yearBreakdown" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaxCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TaxSetting_userId_key" ON "TaxSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCalculation_userId_taxYear_key" ON "TaxCalculation"("userId", "taxYear");
