// Block 28: Rebalance Execution Log - Types
// TypeScript interfaces for rebalance execution logging and monitoring

export interface RebalanceExecutionLog {
  id: string;
  rebalanceId: string;
  portfolioId: string;
  strategyId: string;
  
  // Execution metadata
  execution: ExecutionMetadata;
  
  // Status and progress
  status: ExecutionStatus;
  progress: ExecutionProgress;
  
  // Logs and events
  events: ExecutionEvent[];
  trades: TradeExecution[];
  
  // Results
  results: ExecutionResults;
  
  // Errors and warnings
  errors: ExecutionError[];
  warnings: ExecutionWarning[];
  
  // Performance metrics
  metrics: ExecutionMetrics;
  
  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
  
  // Configuration
  config: LogConfig;
  
  // Context
  context: ExecutionContext;
}

export interface ExecutionMetadata {
  // Execution details
  executionId: string;
  executionType: ExecutionType;
  triggeredBy: string;
  reason: string;
  
  // Planning
  plannedTrades: number;
  plannedValue: number;
  estimatedDuration: number;
  
  // Environment
  environment: 'live' | 'paper' | 'simulation';
  marketSession: MarketSession;
  
  // User context
  userId: string;
  sessionId: string;
  clientVersion: string;
}

export interface ExecutionProgress {
  // Overall progress
  percentage: number;
  currentStage: ExecutionStage;
  
  // Trade progress
  tradesCompleted: number;
  tradesTotal: number;
  tradesPending: number;
  tradesFailed: number;
  
  // Value progress
  valueExecuted: number;
  valueTotal: number;
  valueRemaining: number;
  
  // Time estimates
  elapsedTime: number;
  estimatedTimeRemaining: number;
  
  // Current operation
  currentOperation: string;
  currentAsset?: string;
  
  // Rates
  executionRate: number;
  successRate: number;
  errorRate: number;
}

export interface ExecutionEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  level: EventLevel;
  
  // Event details
  message: string;
  description?: string;
  
  // Context
  stage: ExecutionStage;
  tradeId?: string;
  assetId?: string;
  
  // Data
  data: Record<string, any>;
  
  // Source
  source: EventSource;
  component: string;
  
  // Correlation
  correlationId?: string;
  parentEventId?: string;
  
  // User impact
  userVisible: boolean;
  requiresAction: boolean;
  actionType?: ActionType;
}

export interface TradeExecution {
  id: string;
  tradeId: string;
  parentRebalanceId: string;
  
  // Trade details
  assetId: string;
  symbol: string;
  side: TradeSide;
  
  // Order details
  orderType: OrderType;
  quantity: number;
  price?: number;
  
  // Execution details
  executedQuantity: number;
  executedPrice: number;
  executedValue: number;
  
  // Status
  status: TradeStatus;
  
  // Timing
  submittedAt: Date;
  executedAt?: Date;
  
  // Fills
  fills: TradeFill[];
  
  // Costs
  commission: number;
  fees: number;
  slippage: number;
  marketImpact: number;
  
  // Market data
  marketData: MarketData;
  
  // Execution quality
  executionQuality: ExecutionQuality;
  
  // Errors
  errors: TradeError[];
  retries: number;
  
  // Metadata
  algorithm?: string;
  venue?: string;
  routingDecision?: string;
}

export interface TradeFill {
  id: string;
  timestamp: Date;
  
  // Fill details
  quantity: number;
  price: number;
  value: number;
  
  // Source
  venue: string;
  executionId: string;
  
  // Costs
  commission: number;
  fees: number;
  
  // Metadata
  isPartialFill: boolean;
  fillReason: string;
}

export interface ExecutionResults {
  // Overall results
  overallStatus: 'success' | 'partial' | 'failed';
  completionPercentage: number;
  
  // Trade results
  tradesExecuted: number;
  tradesTotal: number;
  tradeSuccessRate: number;
  
  // Financial results
  totalValueExecuted: number;
  totalValuePlanned: number;
  executionEfficiency: number;
  
  // Cost results
  totalCosts: CostSummary;
  costEfficiency: number;
  
  // Performance results
  performance: PerformanceResults;
  
  // Variance analysis
  variance: VarianceAnalysis;
  
  // Quality metrics
  quality: QualityMetrics;
  
  // Impact assessment
  impact: ImpactAssessment;
}

export interface CostSummary {
  totalCommissions: number;
  totalFees: number;
  totalSlippage: number;
  totalMarketImpact: number;
  totalCosts: number;
  costAsPercentage: number;
  
  // Cost breakdown
  costByAsset: AssetCostBreakdown[];
  costByCategory: CostCategoryBreakdown[];
}

export interface AssetCostBreakdown {
  assetId: string;
  symbol: string;
  totalCost: number;
  commission: number;
  fees: number;
  slippage: number;
  marketImpact: number;
}

export interface CostCategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface PerformanceResults {
  // Execution performance
  averageExecutionTime: number;
  medianExecutionTime: number;
  executionTimeVariance: number;
  
  // Price performance
  averageSlippage: number;
  priceImprovement: number;
  marketTiming: number;
  
  // Fill rates
  fillRate: number;
  partialFillRate: number;
  rejectionRate: number;
  
  // Benchmarks
  benchmarkComparison: BenchmarkComparison[];
}

export interface BenchmarkComparison {
  benchmark: string;
  metric: string;
  value: number;
  benchmarkValue: number;
  difference: number;
  percentageImprovement: number;
}

export interface VarianceAnalysis {
  // Quantity variance
  quantityVariance: number;
  quantityVariancePercentage: number;
  
  // Price variance
  priceVariance: number;
  priceVariancePercentage: number;
  
  // Time variance
  timeVariance: number;
  timeVariancePercentage: number;
  
  // Cost variance
  costVariance: number;
  costVariancePercentage: number;
  
  // Variance by asset
  assetVariances: AssetVariance[];
}

export interface AssetVariance {
  assetId: string;
  symbol: string;
  quantityVariance: number;
  priceVariance: number;
  timeVariance: number;
  costVariance: number;
}

export interface QualityMetrics {
  // Execution quality score
  overallQualityScore: number;
  
  // Component scores
  timingScore: number;
  priceScore: number;
  liquidityScore: number;
  costScore: number;
  
  // Industry benchmarks
  industryPercentile: number;
  peerComparison: number;
  
  // Improvement areas
  improvementAreas: string[];
  recommendations: string[];
}

export interface ImpactAssessment {
  // Portfolio impact
  portfolioImpact: PortfolioImpactResult;
  
  // Market impact
  marketImpact: MarketImpactResult;
  
  // Risk impact
  riskImpact: RiskImpactResult;
  
  // Performance impact
  performanceImpact: PerformanceImpactResult;
}

export interface PortfolioImpactResult {
  allocationAccuracy: number;
  deviationFromTarget: number;
  riskProfileChange: number;
  diversificationChange: number;
}

export interface MarketImpactResult {
  priceMovement: number;
  volumeImpact: number;
  liquidityConsumption: number;
  marketShare: number;
}

export interface RiskImpactResult {
  riskReduction: number;
  volatilityChange: number;
  varChange: number;
  concentrationChange: number;
}

export interface PerformanceImpactResult {
  expectedReturnChange: number;
  sharpeRatioChange: number;
  trackingErrorChange: number;
  informationRatioChange: number;
}

export interface ExecutionError {
  id: string;
  timestamp: Date;
  type: ErrorType;
  severity: ErrorSeverity;
  
  // Error details
  code: string;
  message: string;
  description: string;
  
  // Context
  stage: ExecutionStage;
  tradeId?: string;
  assetId?: string;
  
  // Technical details
  stackTrace?: string;
  systemInfo?: SystemInfo;
  
  // Resolution
  resolved: boolean;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Impact
  impact: ErrorImpact;
  
  // Retry information
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface ExecutionWarning {
  id: string;
  timestamp: Date;
  type: WarningType;
  level: WarningLevel;
  
  // Warning details
  message: string;
  description: string;
  
  // Context
  stage: ExecutionStage;
  tradeId?: string;
  assetId?: string;
  
  // Recommendations
  recommendations: string[];
  
  // Dismissal
  dismissed: boolean;
  dismissedAt?: Date;
  dismissedBy?: string;
}

export interface ExecutionMetrics {
  // Performance metrics
  totalExecutionTime: number;
  averageTradeTime: number;
  throughput: number;
  
  // Efficiency metrics
  executionEfficiency: number;
  costEfficiency: number;
  timeEfficiency: number;
  
  // Quality metrics
  executionQuality: number;
  slippageMetrics: SlippageMetrics;
  
  // Resource utilization
  resourceUtilization: ResourceUtilization;
  
  // Comparison metrics
  benchmarkMetrics: BenchmarkMetrics;
}

export interface SlippageMetrics {
  averageSlippage: number;
  medianSlippage: number;
  slippageVariance: number;
  positiveSlippage: number;
  negativeSlippage: number;
  slippageDistribution: SlippageDistribution[];
}

export interface SlippageDistribution {
  range: string;
  count: number;
  percentage: number;
  value: number;
}

export interface ResourceUtilization {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  diskUsage: number;
  connectionCount: number;
}

export interface BenchmarkMetrics {
  vwapComparison: number;
  twapComparison: number;
  arrivalPriceComparison: number;
  implementationShortfall: number;
}

export interface LogConfig {
  // Logging levels
  logLevel: LogLevel;
  eventFilters: EventFilter[];
  
  // Retention
  retentionDays: number;
  archiveAfterDays: number;
  
  // Output
  outputFormats: OutputFormat[];
  destinations: LogDestination[];
  
  // Real-time
  realTimeUpdates: boolean;
  updateInterval: number;
  
  // Privacy
  maskSensitiveData: boolean;
  dataRetentionPolicy: string;
  
  // Performance
  bufferSize: number;
  flushInterval: number;
  compressionEnabled: boolean;
}

export interface EventFilter {
  type: EventType;
  level: EventLevel;
  enabled: boolean;
  pattern?: string;
}

export interface LogDestination {
  type: 'console' | 'file' | 'database' | 'remote';
  config: Record<string, any>;
  enabled: boolean;
}

export interface ExecutionContext {
  // Market context
  marketConditions: MarketConditions;
  
  // Portfolio context
  portfolioState: PortfolioState;
  
  // System context
  systemState: SystemState;
  
  // User context
  userPreferences: UserPreferences;
  
  // Regulatory context
  complianceRules: ComplianceRule[];
  
  // Risk context
  riskLimits: RiskLimit[];
}

export interface MarketConditions {
  volatility: number;
  liquidity: number;
  trend: 'up' | 'down' | 'sideways';
  volume: number;
  spread: number;
}

export interface PortfolioState {
  totalValue: number;
  cashBalance: number;
  positions: PositionSummary[];
  riskMetrics: RiskMetrics;
}

export interface PositionSummary {
  assetId: string;
  symbol: string;
  quantity: number;
  value: number;
  weight: number;
}

export interface RiskMetrics {
  var95: number;
  var99: number;
  beta: number;
  volatility: number;
  maxDrawdown: number;
}

export interface SystemState {
  version: string;
  performance: SystemPerformance;
  connectivity: ConnectivityStatus;
  resources: ResourceStatus;
}

export interface SystemPerformance {
  latency: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

export interface ConnectivityStatus {
  brokerConnection: boolean;
  marketDataConnection: boolean;
  orderManagementConnection: boolean;
  riskSystemConnection: boolean;
}

export interface ResourceStatus {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
}

export interface UserPreferences {
  executionPreferences: ExecutionPreferences;
  notificationPreferences: NotificationPreferences;
  displayPreferences: DisplayPreferences;
}

export interface ExecutionPreferences {
  defaultOrderType: OrderType;
  slippageTolerance: number;
  timeoutSettings: TimeoutSettings;
  retrySettings: RetrySettings;
}

export interface TimeoutSettings {
  orderTimeout: number;
  executionTimeout: number;
  confirmationTimeout: number;
}

export interface RetrySettings {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationThresholds: NotificationThreshold[];
}

export interface NotificationThreshold {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '=' | '>=' | '<=';
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto';
  refreshRate: number;
  chartPreferences: ChartPreferences;
  tablePreferences: TablePreferences;
}

export interface ChartPreferences {
  defaultChartType: string;
  showGrid: boolean;
  showLegend: boolean;
  autoScale: boolean;
}

export interface TablePreferences {
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  visibleColumns: string[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  type: 'regulatory' | 'internal';
  status: 'active' | 'inactive';
  parameters: Record<string, any>;
}

export interface RiskLimit {
  id: string;
  name: string;
  type: 'position' | 'exposure' | 'loss';
  limit: number;
  current: number;
  utilization: number;
}

export interface MarketData {
  price: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: Date;
  
  // Level 2 data
  bidSize?: number;
  askSize?: number;
  
  // Market metrics
  vwap?: number;
  twap?: number;
  high?: number;
  low?: number;
  previousClose?: number;
}

export interface ExecutionQuality {
  // Timing quality
  executionSpeed: number;
  
  // Price quality
  priceImprovement: number;
  slippage: number;
  
  // Liquidity quality
  fillRate: number;
  marketImpact: number;
  
  // Overall quality score
  qualityScore: number;
  
  // Peer comparison
  peerRanking: number;
  industryPercentile: number;
}

export interface TradeError {
  code: string;
  message: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
}

export interface SystemInfo {
  operatingSystem: string;
  version: string;
  architecture: string;
  availableMemory: number;
  cpuCores: number;
}

export interface ErrorImpact {
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedTrades: number;
  financialImpact: number;
  userImpact: string;
  systemImpact: string;
}

export interface MarketSession {
  session: 'pre-market' | 'regular' | 'after-hours' | 'closed';
  timezone: string;
  openTime: Date;
  closeTime: Date;
}

// Enums
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export type ExecutionType = 'rebalance' | 'allocation' | 'liquidation' | 'hedging' | 'tax_optimization';

export type ExecutionStage = 
  | 'initialization'
  | 'validation'
  | 'pre_trade'
  | 'execution'
  | 'settlement'
  | 'reconciliation'
  | 'completion';

export type EventType = 
  | 'trade_submitted'
  | 'trade_executed'
  | 'trade_failed'
  | 'order_filled'
  | 'order_cancelled'
  | 'market_data_update'
  | 'system_alert'
  | 'compliance_check'
  | 'risk_limit_breach'
  | 'user_action';

export type EventLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type EventSource = 'system' | 'user' | 'market' | 'external' | 'scheduled';

export type ActionType = 'acknowledge' | 'retry' | 'cancel' | 'approve' | 'investigate';

export type TradeSide = 'buy' | 'sell';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'twap' | 'vwap' | 'iceberg';

export type TradeStatus = 'pending' | 'submitted' | 'partial' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export type ErrorType = 'system' | 'market' | 'connectivity' | 'validation' | 'timeout' | 'user';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type WarningType = 'performance' | 'cost' | 'market' | 'compliance' | 'risk';

export type WarningLevel = 'info' | 'caution' | 'warning';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type OutputFormat = 'json' | 'csv' | 'xml' | 'text';

// Error types
export class ExecutionLogError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'ExecutionLogError';
  }
}

export class LoggingError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'LoggingError';
  }
}

export class MetricsError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'MetricsError';
  }
} 