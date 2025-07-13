import { pgTable, text, serial, numeric, timestamp, boolean, json, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier").default("free"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  lastLogin: timestamp("last_login"),
  taxResidency: text("tax_residency"),
  secondaryTaxResidency: text("secondary_tax_residency"), // For dual tax residency
  taxIdentificationNumber: text("tax_identification_number"), // TIN/SSN/Tax ID
  taxFileNumber: text("tax_file_number"), // For Australian TFN, etc.
  taxRegisteredBusiness: boolean("tax_registered_business").default(false), // If trading as business entity
  taxYear: text("tax_year"), // User's preferred tax year format (calendar, fiscal, etc)
});

// Trading accounts (connections to brokerages/exchanges)
export const tradingAccounts = pgTable("trading_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  broker: text("broker").notNull(), // Tiger, IBKR, KuCoin, Kraken
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  apiPassphrase: text("api_passphrase"), // Required for KuCoin authentication
  accountNumber: text("account_number"),
  isActive: boolean("is_active").default(true),
  balance: numeric("balance"),
  currency: text("currency"),
  createdAt: timestamp("created_at").defaultNow(),
  lastSynced: timestamp("last_synced"),
  connectionStatus: text("connection_status"),
});

// Trading strategies
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  symbol: text("symbol").notNull(), // Trading pair or stock symbol
  exchange: text("exchange").notNull(), // Which exchange/broker to use
  accountId: integer("account_id").references(() => tradingAccounts.id),
  indicators: json("indicators").notNull(), // Technical indicators configuration
  entryConditions: json("entry_conditions").notNull(),
  exitConditions: json("exit_conditions").notNull(),
  riskPercentage: numeric("risk_percentage"),
  status: text("status").default("inactive"), // active, inactive, pending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  performance: numeric("performance"),
  winRate: numeric("win_rate"),
  profitFactor: numeric("profit_factor"),
});

// Trading history
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  strategyId: integer("strategy_id").references(() => strategies.id),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // buy or sell
  entryPrice: numeric("entry_price").notNull(),
  exitPrice: numeric("exit_price"),
  amount: numeric("amount").notNull(),
  status: text("status").notNull(), // open, closed, canceled
  profitLoss: numeric("profit_loss"),
  profitLossPercentage: numeric("profit_loss_percentage"),
  exchange: text("exchange"),
  entryTime: timestamp("entry_time").notNull(),
  exitTime: timestamp("exit_time"),
  isAutomated: boolean("is_automated").default(false),
  taxImpact: json("tax_impact"),
});

// Watchlist
export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  notes: text("notes"),
  alerts: json("alerts"),
});

// Market data (can be cached from external APIs)
export const marketEvents = pgTable("market_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // earnings, economic, news
  date: timestamp("date").notNull(),
  symbol: text("symbol"),
  importance: text("importance").default("medium"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow(),
});

// News articles
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  url: text("url").notNull().unique(),
  source: text("source").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  symbols: text("symbols").array(), // Related symbols/assets
  categories: text("categories").array(), // News categories (e.g., earnings, economy, technology)
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

// Sentiment analysis results
export const sentimentAnalysis = pgTable("sentiment_analysis", {
  id: serial("id").primaryKey(),
  newsId: integer("news_id").references(() => newsArticles.id).notNull(),
  symbol: text("symbol").notNull(),
  sentiment: text("sentiment").notNull(), // positive, negative, neutral
  sentimentScore: numeric("sentiment_score").notNull(), // -1.0 to 1.0
  confidence: numeric("confidence").notNull(), // 0.0 to 1.0
  keywords: text("keywords").array(),
  analysisMethod: text("analysis_method").notNull(), // The algorithm or API used
  createdAt: timestamp("created_at").defaultNow(),
});

// Trading signals generated from news and technical indicators
export const tradingSignals = pgTable("trading_signals", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").references(() => strategies.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  action: text("action").notNull(), // BUY, SELL, DCA, STOP_LOSS
  signalStrength: numeric("signal_strength"), // 0.0 to 1.0
  technicalIndicators: jsonb("technical_indicators"), // Specific indicators that triggered
  newsIds: integer("news_ids").array(), // Associated news articles
  sentimentIds: integer("sentiment_ids").array(), // Associated sentiment analyses
  status: text("status").default("pending"), // pending, executed, ignored, snoozed, overridden
  snoozeUntil: timestamp("snooze_until"), // nullable, when snooze expires
  overrideJustification: text("override_justification"), // nullable, user-provided note
  overrideBy: integer("override_by"), // nullable, user id
  overrideAt: timestamp("override_at"), // nullable, when override was set
  generatedAt: timestamp("generated_at").defaultNow(),
  executedAt: timestamp("executed_at"),
  notes: text("notes"),
});

// Whale activity tracking (large institutional investor movements)
export const whaleActivity = pgTable("whale_activity", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  institution: text("institution").notNull(), // Name of the institution or whale
  action: text("action").notNull(), // BUY, SELL, ACCUMULATE, DISTRIBUTE
  amount: numeric("amount").notNull(), // Number of shares/tokens
  valueUsd: numeric("value_usd").notNull(), // Estimated USD value
  filingType: text("filing_type"), // 13F, Form 4, etc. for stocks
  transactionType: text("transaction_type"), // Market buy, OTC, etc.
  confidence: numeric("confidence"), // 0.0 to 1.0, certainty of the data
  source: text("source").notNull(), // Where the data came from
  transactionDate: timestamp("transaction_date").notNull(),
  detectedAt: timestamp("detected_at").defaultNow(),
  networkDetails: jsonb("network_details"), // Additional blockchain details for crypto
  notes: text("notes"),
});

// Tax Settings table
export const taxSettings = pgTable("tax_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  country: text("country").notNull(), // Country code
  region: text("region"), // State/Province/Region
  taxYear: text("tax_year").notNull(), // YYYY format
  enabled: boolean("enabled").default(true),
  accountingMethod: text("accounting_method").default("FIFO"), // FIFO, LIFO, HIFO, ACB, etc.
  includeFees: boolean("include_fees").default(true),
  includeForeignTax: boolean("include_foreign_tax").default(true),
  capitalGainsRules: jsonb("capital_gains_rules"), // Different holding periods and rates
  ratesTable: jsonb("rates_table"), // Progressive tax rates for this jurisdiction
  exemptions: jsonb("exemptions"), // Any exemptions that apply
  offsetLosses: boolean("offset_losses").default(true), // Allow losses to offset gains
  carryForward: boolean("carry_forward").default(true), // Carry forward losses to future years
  previousYearLosses: numeric("previous_year_losses").default("0"), // Losses carried forward from previous years
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Tax Lots for detailed tracking of cost basis
export const taxLots = pgTable("tax_lots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tradeId: integer("trade_id").references(() => trades.id),
  taxYear: text("tax_year").notNull(),
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(), // crypto, stock, forex, etc.
  acquiredDate: timestamp("acquired_date").notNull(),
  disposedDate: timestamp("disposed_date"),
  quantity: numeric("quantity").notNull(),
  costBasis: numeric("cost_basis").notNull(), // Total cost in user's base currency
  proceeds: numeric("proceeds"), // Amount received in user's base currency when sold
  adjustedCostBasis: numeric("adjusted_cost_basis"), // ACB for Canadian tax calculations
  feesPaid: numeric("fees_paid").default("0"),
  foreignTaxPaid: numeric("foreign_tax_paid").default("0"),
  exchangeRate: numeric("exchange_rate"), // Exchange rate at time of transaction
  gainLoss: numeric("gain_loss"), // Realized gain/loss 
  gainType: text("gain_type"), // short_term, long_term, etc.
  taxRate: numeric("tax_rate"), // Applied tax rate
  taxOwed: numeric("tax_owed"), // Calculated tax owed
  washSale: boolean("wash_sale").default(false), // Flag for wash sale consideration
  status: text("status").default("open"), // open, closed, partially_closed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Tax Reports
export const taxReports = pgTable("tax_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  taxYear: text("tax_year").notNull(),
  country: text("country").notNull(),
  region: text("region"),
  reportType: text("report_type").notNull(), // annual, quarterly, estimated
  generatedAt: timestamp("generated_at").defaultNow(),
  totalProceeds: numeric("total_proceeds").notNull(),
  totalCostBasis: numeric("total_cost_basis").notNull(),
  totalGainLoss: numeric("total_gain_loss").notNull(),
  shortTermGains: numeric("short_term_gains").default("0"),
  longTermGains: numeric("long_term_gains").default("0"),
  estimatedTaxOwed: numeric("estimated_tax_owed").notNull(),
  reportData: jsonb("report_data"), // Detailed report data
  reportFormat: text("report_format").default("json"), // json, csv, pdf
  status: text("status").default("draft"), // draft, final, amended
  notes: text("notes"),
});

// Portfolio Allocation Plans - Target allocations for portfolio
export const portfolioPlans = pgTable("portfolio_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  rebalanceFrequency: text("rebalance_frequency").default("quarterly"), // daily, weekly, monthly, quarterly, annually, manual
  lastRebalanced: timestamp("last_rebalanced"),
  nextScheduledRebalance: timestamp("next_scheduled_rebalance"),
  deviationThreshold: numeric("deviation_threshold").default("5"), // Percentage threshold before suggesting rebalance
  notes: text("notes"),
});

// Asset class allocation targets per portfolio plan
export const assetClassAllocations = pgTable("asset_class_allocations", {
  id: serial("id").primaryKey(),
  portfolioPlanId: integer("portfolio_plan_id").references(() => portfolioPlans.id).notNull(),
  assetClass: text("asset_class").notNull(), // equities, crypto, bonds, pie_funds, cash, real_estate, etc.
  targetPercentage: numeric("target_percentage").notNull(), // e.g. 60.00 for 60%
  currentPercentage: numeric("current_percentage"), // Actual current allocation
  deviationAmount: numeric("deviation_amount"), // How far off target (in percentage points)
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
});

// Specific allocations within an asset class (e.g., individual stocks/cryptos)
export const specificAllocations = pgTable("specific_allocations", {
  id: serial("id").primaryKey(),
  assetClassAllocationId: integer("asset_class_allocation_id").references(() => assetClassAllocations.id).notNull(),
  symbol: text("symbol").notNull(), // Stock/crypto/fund ticker
  name: text("name").notNull(),
  targetPercentage: numeric("target_percentage").notNull(), // Percentage within this asset class
  currentPercentage: numeric("current_percentage"), // Actual current allocation
  deviationAmount: numeric("deviation_amount"), // How far off target (in percentage points)
  currentValue: numeric("current_value"), // Current market value
  lastUpdated: timestamp("last_updated").defaultNow(),
  isCore: boolean("is_core").default(false), // Core holding vs satellite/tactical
  notes: text("notes"),
});

// Rebalance recommendations generated by the system
export const rebalanceRecommendations = pgTable("rebalance_recommendations", {
  id: serial("id").primaryKey(),
  portfolioPlanId: integer("portfolio_plan_id").references(() => portfolioPlans.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  totalPortfolioValue: numeric("total_portfolio_value").notNull(),
  status: text("status").default("pending"), // pending, applied, ignored, partial
  appliedAt: timestamp("applied_at"),
  recommendations: jsonb("recommendations").notNull(), // Detailed buy/sell recommendations
  estimatedFees: numeric("estimated_fees"),
  estimatedTaxImpact: numeric("estimated_tax_impact"),
  notes: text("notes"),
});

// Rebalance actions history
export const rebalanceActions = pgTable("rebalance_actions", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id").references(() => rebalanceRecommendations.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  actionType: text("action_type").notNull(), // buy, sell
  amount: numeric("amount").notNull(), // Number of shares/units
  price: numeric("price").notNull(),
  valueChange: numeric("value_change").notNull(), // Total value of the transaction
  oldAllocation: numeric("old_allocation").notNull(), // Percentage before
  newAllocation: numeric("new_allocation").notNull(), // Percentage after  
  tradeId: integer("trade_id").references(() => trades.id), // If this generated an actual trade
  executedAt: timestamp("executed_at").defaultNow(),
  executionMethod: text("execution_method").default("manual"), // manual, semi-automated, automated
  status: text("status").default("completed"), // completed, failed, partial
  notes: text("notes"),
});

// User automation preferences
export const automationPreferences = pgTable("automation_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  strategyId: integer("strategy_id").references(() => strategies.id),
  symbol: text("symbol"),
  automationLevel: text("automation_level").default("notification"), // notification, semi, full
  notificationChannels: text("notification_channels").array(), // email, sms, push, in-app
  minSignalStrength: numeric("min_signal_strength"), // Minimum strength to automate
  maxTradeAmount: numeric("max_trade_amount"), // Max amount per trade
  cooldownPeriod: integer("cooldown_period"), // Time between trades in minutes
  activeHours: jsonb("active_hours"), // Which hours to trade
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Technical indicators (cached calculation results)
export const technicalIndicators = pgTable("technical_indicators", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  interval: text("interval").notNull(), // 1m, 5m, 15m, 1h, 4h, 1d
  open: numeric("open"),
  high: numeric("high"),
  low: numeric("low"),
  close: numeric("close"),
  volume: numeric("volume"),
  rsi14: numeric("rsi_14"),
  macd: numeric("macd"),
  macdSignal: numeric("macd_signal"),
  macdHistogram: numeric("macd_histogram"),
  ma20: numeric("ma_20"),
  ma50: numeric("ma_50"),
  ma200: numeric("ma_200"),
  bbUpper: numeric("bb_upper"),
  bbMiddle: numeric("bb_middle"),
  bbLower: numeric("bb_lower"),
  volumeAvg20: numeric("volume_avg_20"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Backtesting sessions
export const backtestSessions = pgTable("backtest_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  strategyId: integer("strategy_id").references(() => strategies.id).notNull(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  symbol: text("symbol").notNull(),
  interval: text("interval").notNull(), // 1m, 5m, 15m, 1h, 4h, 1d
  initialCapital: numeric("initial_capital").notNull(),
  finalCapital: numeric("final_capital"),
  profitLoss: numeric("profit_loss"),
  profitLossPercentage: numeric("profit_loss_percentage"),
  maxDrawdown: numeric("max_drawdown"),
  winRate: numeric("win_rate"),
  totalTrades: integer("total_trades"),
  winningTrades: integer("winning_trades"),
  losingTrades: integer("losing_trades"),
  sharpeRatio: numeric("sharpe_ratio"),
  status: text("status").notNull(), // running, completed, failed
  resultSummary: jsonb("result_summary"),
  configuration: jsonb("configuration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Backtest trades
export const backtestTrades = pgTable("backtest_trades", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => backtestSessions.id).notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // buy, sell
  entryPrice: numeric("entry_price").notNull(),
  exitPrice: numeric("exit_price"),
  quantity: numeric("quantity").notNull(),
  entryTime: timestamp("entry_time").notNull(),
  exitTime: timestamp("exit_time"),
  profitLoss: numeric("profit_loss"),
  profitLossPercentage: numeric("profit_loss_percentage"),
  indicators: jsonb("indicators"), // Indicators at entry point
  notes: text("notes"),
  status: text("status").notNull(), // open, closed
});

// Paper trading accounts
export const paperTradingAccounts = pgTable("paper_trading_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  initialBalance: numeric("initial_balance").notNull(),
  currentBalance: numeric("current_balance").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  resetCount: integer("reset_count").default(0),
});

// Paper trading positions
export const paperTradingPositions = pgTable("paper_trading_positions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => paperTradingAccounts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  quantity: numeric("quantity").notNull(),
  averageEntryPrice: numeric("average_entry_price").notNull(),
  currentPrice: numeric("current_price"),
  openedAt: timestamp("opened_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  unrealizedProfitLoss: numeric("unrealized_profit_loss"),
  unrealizedProfitLossPercentage: numeric("unrealized_profit_loss_percentage"),
  realizedProfitLoss: numeric("realized_profit_loss").default("0"),
  notes: text("notes"),
});

// Paper trading transactions
export const paperTradingTransactions = pgTable("paper_trading_transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => paperTradingAccounts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  strategyId: integer("strategy_id").references(() => strategies.id),
  symbol: text("symbol"),
  type: text("type").notNull(), // buy, sell, deposit, withdrawal
  quantity: numeric("quantity").notNull(),
  price: numeric("price"),
  amount: numeric("amount").notNull(),
  fees: numeric("fees").default("0"),
  timestamp: timestamp("timestamp").notNull(),
  notes: text("notes"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tradingAccounts: many(tradingAccounts),
  strategies: many(strategies),
  trades: many(trades),
  watchlist: many(watchlistItems),
  signals: many(tradingSignals),
  backtestSessions: many(backtestSessions),
  paperAccounts: many(paperTradingAccounts),
}));

export const tradingAccountsRelations = relations(tradingAccounts, ({ one, many }) => ({
  user: one(users, { fields: [tradingAccounts.userId], references: [users.id] }),
  strategies: many(strategies),
  trades: many(trades),
}));

export const strategiesRelations = relations(strategies, ({ one, many }) => ({
  user: one(users, { fields: [strategies.userId], references: [users.id] }),
  account: one(tradingAccounts, { fields: [strategies.accountId], references: [tradingAccounts.id] }),
  trades: many(trades),
  signals: many(tradingSignals),
  backtestSessions: many(backtestSessions),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, { fields: [trades.userId], references: [users.id] }),
  strategy: one(strategies, { fields: [trades.strategyId], references: [strategies.id] }),
  account: one(tradingAccounts, { fields: [trades.exchange], references: [tradingAccounts.broker] }), // Note: this is a weak relation
}));

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  user: one(users, { fields: [watchlistItems.userId], references: [users.id] }),
}));

export const tradingSignalsRelations = relations(tradingSignals, ({ one }) => ({
  user: one(users, { fields: [tradingSignals.userId], references: [users.id] }),
  strategy: one(strategies, { fields: [tradingSignals.strategyId], references: [strategies.id] }),
}));

export const backtestSessionsRelations = relations(backtestSessions, ({ one, many }) => ({
  user: one(users, { fields: [backtestSessions.userId], references: [users.id] }),
  strategy: one(strategies, { fields: [backtestSessions.strategyId], references: [strategies.id] }),
  trades: many(backtestTrades),
}));

export const backtestTradesRelations = relations(backtestTrades, ({ one }) => ({
  session: one(backtestSessions, { fields: [backtestTrades.sessionId], references: [backtestSessions.id] }),
}));

export const paperTradingAccountsRelations = relations(paperTradingAccounts, ({ one, many }) => ({
  user: one(users, { fields: [paperTradingAccounts.userId], references: [users.id] }),
  positions: many(paperTradingPositions),
  transactions: many(paperTradingTransactions),
}));

export const paperTradingPositionsRelations = relations(paperTradingPositions, ({ one }) => ({
  account: one(paperTradingAccounts, { fields: [paperTradingPositions.accountId], references: [paperTradingAccounts.id] }),
  user: one(users, { fields: [paperTradingPositions.userId], references: [users.id] }),
}));

export const paperTradingTransactionsRelations = relations(paperTradingTransactions, ({ one }) => ({
  account: one(paperTradingAccounts, { fields: [paperTradingTransactions.accountId], references: [paperTradingAccounts.id] }),
  user: one(users, { fields: [paperTradingTransactions.userId], references: [users.id] }),
  strategy: one(strategies, { fields: [paperTradingTransactions.strategyId], references: [strategies.id] }),
}));

// Insert schemas (Add the ones missing to existing ones)
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTradingAccountSchema = createInsertSchema(tradingAccounts).omit({ id: true, createdAt: true });
export const insertStrategySchema = createInsertSchema(strategies).omit({ id: true, createdAt: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true });
export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).omit({ id: true, addedAt: true });
export const insertMarketEventSchema = createInsertSchema(marketEvents).omit({ id: true, createdAt: true });
export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({ id: true, createdAt: true });
export const insertSentimentAnalysisSchema = createInsertSchema(sentimentAnalysis).omit({ id: true, createdAt: true });
export const insertTradingSignalSchema = createInsertSchema(tradingSignals).omit({ id: true, generatedAt: true });
export const insertAutomationPreferenceSchema = createInsertSchema(automationPreferences).omit({ id: true, createdAt: true });
export const insertWhaleActivitySchema = createInsertSchema(whaleActivity).omit({ id: true, detectedAt: true });
export const insertTechnicalIndicatorSchema = createInsertSchema(technicalIndicators).omit({ id: true, createdAt: true });
export const insertBacktestSessionSchema = createInsertSchema(backtestSessions).omit({ id: true, createdAt: true });
export const insertBacktestTradeSchema = createInsertSchema(backtestTrades).omit({ id: true });
export const insertPaperTradingAccountSchema = createInsertSchema(paperTradingAccounts).omit({ id: true, createdAt: true });
export const insertPaperTradingPositionSchema = createInsertSchema(paperTradingPositions).omit({ id: true, updatedAt: true });
export const insertPaperTradingTransactionSchema = createInsertSchema(paperTradingTransactions).omit({ id: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTradingAccount = z.infer<typeof insertTradingAccountSchema>;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type InsertMarketEvent = z.infer<typeof insertMarketEventSchema>;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type InsertSentimentAnalysis = z.infer<typeof insertSentimentAnalysisSchema>;
export type InsertTradingSignal = z.infer<typeof insertTradingSignalSchema>;
export type InsertAutomationPreference = z.infer<typeof insertAutomationPreferenceSchema>;
export type InsertWhaleActivity = z.infer<typeof insertWhaleActivitySchema>;
export type InsertTechnicalIndicator = z.infer<typeof insertTechnicalIndicatorSchema>;
export type InsertBacktestSession = z.infer<typeof insertBacktestSessionSchema>;
export type InsertBacktestTrade = z.infer<typeof insertBacktestTradeSchema>;
export type InsertPaperTradingAccount = z.infer<typeof insertPaperTradingAccountSchema>;
export type InsertPaperTradingPosition = z.infer<typeof insertPaperTradingPositionSchema>;
export type InsertPaperTradingTransaction = z.infer<typeof insertPaperTradingTransactionSchema>;

// Types (Add new types to existing ones)
export type User = typeof users.$inferSelect;
export type TradingAccount = typeof tradingAccounts.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type MarketEvent = typeof marketEvents.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type SentimentAnalysis = typeof sentimentAnalysis.$inferSelect;
export type TradingSignal = typeof tradingSignals.$inferSelect;
export type AutomationPreference = typeof automationPreferences.$inferSelect;
export type WhaleActivity = typeof whaleActivity.$inferSelect;
export type TechnicalIndicator = typeof technicalIndicators.$inferSelect;
export type BacktestSession = typeof backtestSessions.$inferSelect;
export type BacktestTrade = typeof backtestTrades.$inferSelect;
export type PaperTradingAccount = typeof paperTradingAccounts.$inferSelect;
export type PaperTradingPosition = typeof paperTradingPositions.$inferSelect;
export type PaperTradingTransaction = typeof paperTradingTransactions.$inferSelect;
