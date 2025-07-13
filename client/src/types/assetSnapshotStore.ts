// Block 47: Asset Snapshot Store - Types
export interface AssetSnapshot {
  id: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  assetType: AssetType;
  timestamp: Date;
  triggerEvent: SnapshotTrigger;
  data: AssetData;
  metadata: SnapshotMetadata;
  tags: string[];
  retentionDays: number;
  compressed: boolean;
  compressedSize?: number;
  originalSize: number;
  checksumHash: string;
  version: string;
  source: string;
  userId?: string;
  correlationId?: string;
}

export type AssetType = 
  | 'stock'
  | 'bond'
  | 'etf'
  | 'mutual_fund'
  | 'crypto'
  | 'commodity'
  | 'forex'
  | 'option'
  | 'future'
  | 'reit'
  | 'index'
  | 'cash';

export type SnapshotTrigger = 
  | 'scheduled'
  | 'price_change'
  | 'volume_spike'
  | 'market_event'
  | 'strategy_signal'
  | 'manual'
  | 'portfolio_rebalance'
  | 'earnings_announcement'
  | 'news_event'
  | 'technical_indicator'
  | 'sentiment_change'
  | 'compliance_audit'
  | 'backup';

export interface AssetData {
  pricing: PricingData;
  fundamentals?: FundamentalData;
  technical?: TechnicalData;
  market?: MarketData;
  sentiment?: SentimentData;
  news?: NewsData;
  holdings?: HoldingsData;
  risk?: RiskData;
  performance?: PerformanceData;
  metadata?: AssetMetadata;
}

export interface PricingData {
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  averageVolume: number;
  marketCap?: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  lastTrade?: Date;
  currency: string;
  exchange: string;
}

export interface FundamentalData {
  pe?: number;
  pb?: number;
  ps?: number;
  pegRatio?: number;
  eps?: number;
  epsGrowth?: number;
  revenue?: number;
  revenueGrowth?: number;
  profitMargin?: number;
  operatingMargin?: number;
  grossMargin?: number;
  roe?: number;
  roa?: number;
  debt?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  cashFlow?: number;
  freeCashFlow?: number;
  dividendYield?: number;
  dividendRate?: number;
  payoutRatio?: number;
  beta?: number;
  marketCapValue?: number;
  enterpriseValue?: number;
  earningsDate?: Date;
  exDividendDate?: Date;
}

export interface TechnicalData {
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bollingerUpper?: number;
  bollingerLower?: number;
  bollingerMiddle?: number;
  stochK?: number;
  stochD?: number;
  williams?: number;
  atr?: number;
  adx?: number;
  cci?: number;
  momentum?: number;
  roc?: number;
  obv?: number;
  vwap?: number;
  support?: number[];
  resistance?: number[];
  trendDirection?: 'up' | 'down' | 'sideways';
  volatility?: number;
}

export interface MarketData {
  sector?: string;
  industry?: string;
  marketStatus: 'open' | 'closed' | 'pre_market' | 'after_hours' | 'holiday';
  tradingSession: 'regular' | 'pre_market' | 'after_hours';
  timeZone: string;
  lastUpdated: Date;
  dataProvider: string;
  realTime: boolean;
  delay?: number;
  correlations?: Record<string, number>;
  sectorPerformance?: number;
  indexWeights?: Record<string, number>;
}

export interface SentimentData {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  confidence: number; // 0 to 1
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalMentions: number;
  socialTrend: 'increasing' | 'decreasing' | 'stable';
  newssentiment: number;
  analystSentiment: number;
  retailSentiment: number;
  institutionalSentiment: number;
  fearGreedIndex?: number;
  volatilityIndex?: number;
  sources: string[];
  lastAnalyzed: Date;
}

export interface NewsData {
  headlines: NewsItem[];
  keyEvents: EventItem[];
  pressReleases: PressRelease[];
  analystReports: AnalystReport[];
  socialPosts: SocialPost[];
  sentiment: SentimentData;
  impact: 'low' | 'medium' | 'high' | 'critical';
  relevanceScore: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment: number;
  relevance: number;
  impact: 'low' | 'medium' | 'high';
  categories: string[];
}

export interface EventItem {
  id: string;
  type: 'earnings' | 'dividend' | 'split' | 'merger' | 'ipo' | 'other';
  title: string;
  description: string;
  date: Date;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confirmed: boolean;
  source: string;
}

export interface PressRelease {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  importance: 'low' | 'medium' | 'high';
}

export interface AnalystReport {
  id: string;
  analyst: string;
  firm: string;
  rating: 'buy' | 'hold' | 'sell' | 'strong_buy' | 'strong_sell';
  targetPrice?: number;
  priceTarget?: number;
  summary: string;
  publishedAt: Date;
  confidence: number;
}

export interface SocialPost {
  id: string;
  platform: string;
  author: string;
  content: string;
  url: string;
  publishedAt: Date;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  sentiment: number;
  influence: number;
}

export interface HoldingsData {
  totalShares?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  institutionalOwnership?: number;
  insiderOwnership?: number;
  shortInterest?: number;
  shortRatio?: number;
  topHolders?: Holder[];
  recentTransactions?: Transaction[];
}

export interface Holder {
  name: string;
  type: 'institutional' | 'insider' | 'retail';
  shares: number;
  percentage: number;
  value: number;
  lastReported: Date;
  change?: number;
  changePercent?: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'transfer';
  shares: number;
  price: number;
  value: number;
  date: Date;
  party: string;
  reported: Date;
}

export interface RiskData {
  beta?: number;
  volatility?: number;
  var?: number; // Value at Risk
  cvar?: number; // Conditional Value at Risk
  sharpeRatio?: number;
  sortinoRatio?: number;
  maxDrawdown?: number;
  downside?: number;
  correlation?: Record<string, number>;
  riskRating?: 'low' | 'medium' | 'high' | 'very_high';
  riskFactors?: string[];
  stressTestResults?: StressTestResult[];
}

export interface StressTestResult {
  scenario: string;
  priceChange: number;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'severe';
  timeframe: string;
}

export interface PerformanceData {
  returns: {
    day: number;
    week: number;
    month: number;
    quarter: number;
    year: number;
    ytd: number;
    threeYear: number;
    fiveYear: number;
  };
  benchmarkComparison?: {
    benchmark: string;
    alpha: number;
    beta: number;
    trackingError: number;
    informationRatio: number;
  };
  attribution?: {
    selection: number;
    allocation: number;
    interaction: number;
    total: number;
  };
}

export interface AssetMetadata {
  description?: string;
  website?: string;
  headquarters?: string;
  employees?: number;
  founded?: Date;
  ceo?: string;
  businessSummary?: string;
  tags?: string[];
  categories?: string[];
  aliases?: string[];
  identifiers?: {
    isin?: string;
    cusip?: string;
    sedol?: string;
    ric?: string;
    bloomberg?: string;
    figi?: string;
  };
}

export interface SnapshotMetadata {
  captureTimeMs: number;
  dataSourceLatency: number;
  compressionRatio?: number;
  errorCount: number;
  warningCount: number;
  missingFields: string[];
  qualityScore: number;
  confidenceScore: number;
  staleness: number; // Hours since last update
  providerInfo: {
    primary: string;
    secondary?: string[];
    cost?: number;
    rateLimit?: number;
  };
  processingInfo: {
    version: string;
    algorithm?: string;
    parameters?: Record<string, any>;
    enrichments?: string[];
    validations?: ValidationResult[];
  };
}

export interface ValidationResult {
  field: string;
  rule: string;
  passed: boolean;
  message?: string;
  severity: 'info' | 'warning' | 'error';
}

export interface AssetSnapshotStoreState {
  snapshots: AssetSnapshot[];
  assets: Asset[];
  selectedSnapshot: AssetSnapshot | null;
  selectedAsset: Asset | null;
  filter: SnapshotFilter;
  isLoading: boolean;
  error: string | null;
  stats: SnapshotStats | null;
  storageInfo: StorageInfo | null;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  exchange: string;
  currency: string;
  active: boolean;
  tracked: boolean;
  snapshotConfig: SnapshotConfig;
  lastSnapshot?: Date;
  snapshotCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SnapshotConfig {
  enabled: boolean;
  frequency: SnapshotFrequency;
  triggers: SnapshotTrigger[];
  retentionDays: number;
  compression: boolean;
  fields: SnapshotField[];
  conditions: SnapshotCondition[];
  notifications: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface SnapshotFrequency {
  type: 'interval' | 'schedule' | 'event';
  interval?: number; // Minutes
  schedule?: string; // Cron expression
  timezone?: string;
  marketHours?: boolean;
}

export interface SnapshotField {
  category: keyof AssetData;
  fields: string[];
  required: boolean;
  enabled: boolean;
}

export interface SnapshotCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
  enabled: boolean;
}

export interface SnapshotFilter {
  assetId?: string;
  assetSymbol?: string;
  assetType?: AssetType;
  trigger?: SnapshotTrigger;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
  tags?: string[];
  minSize?: number;
  maxSize?: number;
  compressed?: boolean;
  hasErrors?: boolean;
  source?: string;
  userId?: string;
}

export interface SnapshotStats {
  totalSnapshots: number;
  snapshotsLast24h: number;
  snapshotsLast7d: number;
  totalAssets: number;
  activeAssets: number;
  trackedAssets: number;
  totalStorage: number;
  compressedStorage: number;
  compressionRatio: number;
  averageSize: number;
  averageQuality: number;
  errorRate: number;
  byType: Record<AssetType, number>;
  byTrigger: Record<SnapshotTrigger, number>;
  topAssets: Array<{ assetId: string; count: number }>;
  storageByMonth: Array<{ month: string; size: number }>;
  qualityTrend: Array<{ date: Date; quality: number }>;
}

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  compressionRatio: number;
  retention: {
    active: number;
    expired: number;
    pendingDeletion: number;
  };
  performance: {
    avgWriteTime: number;
    avgReadTime: number;
    avgCompressionTime: number;
    throughput: number;
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    lastCheck: Date;
  };
}

export interface SnapshotActions {
  captureSnapshot: (assetId: string, trigger: SnapshotTrigger, options?: CaptureOptions) => Promise<AssetSnapshot>;
  getSnapshot: (snapshotId: string) => Promise<AssetSnapshot | null>;
  getSnapshotHistory: (assetId: string, period?: { start: Date; end: Date }) => Promise<AssetSnapshot[]>;
  compareSnapshots: (snapshotId1: string, snapshotId2: string) => Promise<SnapshotComparison>;
  deleteSnapshot: (snapshotId: string) => Promise<boolean>;
  compressSnapshot: (snapshotId: string) => Promise<boolean>;
  decompressSnapshot: (snapshotId: string) => Promise<boolean>;
  validateSnapshot: (snapshotId: string) => Promise<ValidationResult[]>;
  exportSnapshots: (snapshotIds: string[], format: 'json' | 'csv' | 'parquet') => Promise<string>;
  bulkCapture: (assetIds: string[], trigger: SnapshotTrigger) => Promise<AssetSnapshot[]>;
  scheduleSnapshot: (assetId: string, schedule: SnapshotFrequency) => Promise<boolean>;
  getStorageStats: () => Promise<StorageInfo>;
  cleanupExpired: () => Promise<number>;
  refreshData: () => Promise<void>;
}

export interface CaptureOptions {
  fields?: (keyof AssetData)[];
  compress?: boolean;
  tags?: string[];
  retentionDays?: number;
  priority?: 'low' | 'medium' | 'high';
  correlationId?: string;
}

export interface SnapshotComparison {
  snapshot1: AssetSnapshot;
  snapshot2: AssetSnapshot;
  timeDiff: number;
  changes: SnapshotChange[];
  summary: {
    totalChanges: number;
    significantChanges: number;
    priceChange: number;
    priceChangePercent: number;
    volumeChange: number;
    volatilityChange: number;
  };
  analysis: {
    trend: 'improving' | 'deteriorating' | 'stable';
    significance: 'low' | 'medium' | 'high';
    confidence: number;
    recommendations: string[];
  };
}

export interface SnapshotChange {
  field: string;
  category: string;
  oldValue: any;
  newValue: any;
  change: number;
  changePercent: number;
  significance: 'low' | 'medium' | 'high';
  direction: 'up' | 'down' | 'unchanged';
}

export interface SnapshotEvent {
  id: string;
  type: 'snapshot_created' | 'snapshot_deleted' | 'snapshot_compressed' | 'schedule_created' | 'cleanup_completed' | 'error_occurred';
  snapshotId?: string;
  assetId?: string;
  userId?: string;
  timestamp: Date;
  data: Record<string, any>;
  processed: boolean;
}

export interface SnapshotSchedule {
  id: string;
  assetId: string;
  name: string;
  description: string;
  frequency: SnapshotFrequency;
  triggers: SnapshotTrigger[];
  options: CaptureOptions;
  enabled: boolean;
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SnapshotAlert {
  id: string;
  type: 'storage_limit' | 'capture_failure' | 'quality_degradation' | 'schedule_failure' | 'compression_failure';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  assetId?: string;
  snapshotId?: string;
  scheduleId?: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  autoResolved: boolean;
  resolvedAt?: Date;
  details: Record<string, any>;
}

export interface SnapshotBackup {
  id: string;
  name: string;
  description: string;
  type: 'full' | 'incremental' | 'differential';
  assetIds: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  size: number;
  location: string;
  encryption: boolean;
  compression: boolean;
  checksum: string;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  retention: number;
  metadata: Record<string, any>;
} 