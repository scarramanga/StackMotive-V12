-- CreateTable
CREATE TABLE "PortfolioPosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "quantity" DECIMAL NOT NULL,
    "avgPrice" DECIMAL NOT NULL,
    "currentPrice" DECIMAL,
    "assetClass" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncSource" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortfolioSyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "syncSource" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsImported" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "filename" TEXT,
    "syncStarted" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncCompleted" DATETIME,
    "metadata" TEXT,
    CONSTRAINT "PortfolioSyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentMemory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "blockId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "context" TEXT,
    "userInput" TEXT,
    "agentResponse" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    CONSTRAINT "AgentMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
