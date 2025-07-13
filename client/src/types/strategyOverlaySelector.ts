// Block 25: Strategy Overlay Selector - Types
// TypeScript interfaces for strategy overlay selection and management

export interface StrategyOverlay {
  id: string;
  name: string;
  description: string;
  type: OverlayType;
  category: StrategyCategory;
  
  // Configuration
  parameters: OverlayParameters;
  constraints: OverlayConstraints;
  triggers: OverlayTrigger[];
  
  // Performance
  performance: OverlayPerformance;
  backtest: BacktestResults;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  author: string;
  version: string;
  isActive: boolean;
  isSystem: boolean;
  
  // Usage
  usageCount: number;
  lastUsed?: Date;
  popularity: number;
  
  // Risk
  riskLevel: RiskLevel;
  volatility: number;
  maxDrawdown: number;
  
  // Compatibility
  compatibleStrategies: string[];
  conflictingStrategies: string[];
  requiredIndicators: string[];
  
  // Display
  icon?: string;
  color?: string;
  tags: string[];
}

export interface OverlayParameters {
  [key: string]: ParameterValue;
}

export interface ParameterValue {
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  value: any;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: any[];
  required: boolean;
  description: string;
}

export interface OverlayConstraints {
  minHoldings: number;
  maxHoldings: number;
  minValue: number;
  maxValue: number;
  allowedAssetTypes: AssetType[];
  excludedAssetTypes: AssetType[];
  requiredDataSources: string[];
  
  // Time constraints
  minTimeframe: string;
  maxTimeframe: string;
  allowedTimeframes: string[];
  
  // Market constraints
  allowedMarkets: string[];
  excludedMarkets: string[];
  requiredMarketHours: boolean;
  
  // Strategy constraints
  maxConcurrentOverlays: number;
  mutuallyExclusive: string[];
  requiredPrecedence: string[];
}

export interface OverlayTrigger {
  id: string;
  name: string;
  type: TriggerType;
  condition: TriggerCondition;
  parameters: Record<string, any>;
  isActive: boolean;
  priority: number;
}

export interface TriggerCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: any;
  values?: any[];
}

export interface OverlayPerformance {
  returns: {
    total: number;
    annualized: number;
    ytd: number;
    mtd: number;
    daily: number;
  };
  
  risk: {
    volatility: number;
    beta: number;
    alpha: number;
    sharpe: number;
    sortino: number;
    maxDrawdown: number;
    var95: number;
    var99: number;
  };
  
  metrics: {
    winRate: number;
    lossRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    trades: number;
    successfulTrades: number;
    failedTrades: number;
  };
  
  periods: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
    lastQuarter: number;
    lastYear: number;
    allTime: number;
  };
}

export interface BacktestResults {
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  
  returns: {
    total: number;
    annualized: number;
    benchmark: number;
    excess: number;
  };
  
  risk: {
    volatility: number;
    maxDrawdown: number;
    calmarRatio: number;
    sharpeRatio: number;
    sortinoRatio: number;
    informationRatio: number;
  };
  
  trades: {
    total: number;
    profitable: number;
    unprofitable: number;
    avgReturn: number;
    avgDuration: number;
  };
  
  monthlyReturns: MonthlyReturn[];
  drawdownPeriods: DrawdownPeriod[];
  keyMetrics: KeyMetric[];
}

export interface MonthlyReturn {
  date: Date;
  return: number;
  benchmark: number;
  excess: number;
}

export interface DrawdownPeriod {
  start: Date;
  end: Date;
  duration: number;
  peak: number;
  trough: number;
  drawdown: number;
}

export interface KeyMetric {
  name: string;
  value: number;
  benchmark?: number;
  percentile?: number;
  interpretation: string;
}

export interface OverlaySelection {
  id: string;
  strategyId: string;
  overlayId: string;
  parameters: OverlayParameters;
  priority: number;
  isActive: boolean;
  
  // Selection criteria
  reason: string;
  confidence: number;
  expectedImpact: number;
  
  // Timing
  selectedAt: Date;
  activateAt?: Date;
  deactivateAt?: Date;
  
  // Performance tracking
  actualPerformance?: OverlayPerformance;
  expectedPerformance: OverlayPerformance;
  performanceDelta?: number;
}

export interface OverlayRecommendation {
  overlay: StrategyOverlay;
  score: number;
  confidence: number;
  reasoning: string[];
  
  // Fit analysis
  strategicFit: number;
  riskFit: number;
  performanceFit: number;
  timingFit: number;
  
  // Impact projection
  expectedImpact: {
    return: number;
    risk: number;
    sharpe: number;
    drawdown: number;
  };
  
  // Recommendations
  parameterAdjustments: ParameterAdjustment[];
  timingRecommendations: TimingRecommendation[];
  riskMitigations: RiskMitigation[];
}

export interface ParameterAdjustment {
  parameter: string;
  currentValue: any;
  recommendedValue: any;
  reason: string;
  impact: number;
  confidence: number;
}

export interface TimingRecommendation {
  type: 'immediate' | 'delayed' | 'conditional';
  condition?: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  expectedDelay?: number;
}

export interface RiskMitigation {
  risk: string;
  mitigation: string;
  implementation: string;
  effectiveness: number;
}

export interface OverlayComparison {
  overlays: StrategyOverlay[];
  criteria: ComparisonCriteria;
  results: ComparisonResult[];
  
  // Analysis
  bestOverall: string;
  bestForRisk: string;
  bestForReturn: string;
  bestForSharpe: string;
  
  // Recommendations
  primaryRecommendation: string;
  alternativeRecommendations: string[];
  combinationRecommendations: string[];
}

export interface ComparisonCriteria {
  timeframe: string;
  riskTolerance: RiskLevel;
  returnTarget: number;
  
  weights: {
    performance: number;
    risk: number;
    fit: number;
    timing: number;
  };
  
  constraints: OverlayConstraints;
}

export interface ComparisonResult {
  overlayId: string;
  scores: {
    overall: number;
    performance: number;
    risk: number;
    fit: number;
    timing: number;
  };
  
  pros: string[];
  cons: string[];
  
  // Detailed analysis
  performanceAnalysis: string;
  riskAnalysis: string;
  fitAnalysis: string;
  timingAnalysis: string;
  
  // Recommendation
  recommended: boolean;
  reasoning: string;
  confidence: number;
}

export interface OverlaySelector {
  id: string;
  name: string;
  description: string;
  
  // Configuration
  criteria: SelectionCriteria;
  filters: OverlayFilter[];
  sorting: OverlaySorting;
  
  // State
  availableOverlays: StrategyOverlay[];
  filteredOverlays: StrategyOverlay[];
  selectedOverlays: OverlaySelection[];
  recommendations: OverlayRecommendation[];
  
  // Analysis
  comparison: OverlayComparison;
  simulation: OverlaySimulation;
  
  // Settings
  settings: SelectorSettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastAnalysis: Date;
}

export interface SelectionCriteria {
  // Performance criteria
  minReturn: number;
  maxRisk: number;
  minSharpe: number;
  maxDrawdown: number;
  
  // Strategy criteria
  strategicAlignment: number;
  riskCompatibility: number;
  performanceConsistency: number;
  
  // Timing criteria
  marketConditions: string[];
  timeframe: string;
  urgency: 'low' | 'medium' | 'high';
  
  // Other criteria
  complexity: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  liquidity: 'low' | 'medium' | 'high';
}

export interface OverlayFilter {
  id: string;
  name: string;
  field: string;
  operator: string;
  value: any;
  isActive: boolean;
  group?: string;
}

export interface OverlaySorting {
  field: string;
  direction: 'asc' | 'desc';
  secondary?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface OverlaySimulation {
  id: string;
  name: string;
  description: string;
  
  // Configuration
  overlays: OverlaySelection[];
  parameters: SimulationParameters;
  
  // Results
  results: SimulationResults;
  
  // Metadata
  createdAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface SimulationParameters {
  startDate: Date;
  endDate: Date;
  initialValue: number;
  rebalanceFrequency: string;
  transactionCosts: number;
  
  // Market conditions
  marketScenario: 'historical' | 'bull' | 'bear' | 'volatile' | 'custom';
  customScenario?: MarketScenario;
  
  // Risk management
  stopLoss: number;
  takeProfit: number;
  maxPosition: number;
  
  // Other parameters
  includeCommissions: boolean;
  includeSlippage: boolean;
  includeTaxes: boolean;
}

export interface MarketScenario {
  name: string;
  description: string;
  parameters: Record<string, any>;
  marketConditions: MarketCondition[];
}

export interface MarketCondition {
  period: {
    start: Date;
    end: Date;
  };
  
  conditions: {
    volatility: number;
    trend: 'up' | 'down' | 'sideways';
    strength: number;
    sector_rotation: boolean;
    correlation: number;
  };
}

export interface SimulationResults {
  // Performance
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  
  // Comparison
  benchmarkReturn: number;
  excess: number;
  beta: number;
  alpha: number;
  
  // Trade statistics
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  
  // Time series
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  returns: ReturnPoint[];
  
  // Overlay performance
  overlayPerformance: OverlayPerformanceDetail[];
  
  // Risk metrics
  riskMetrics: RiskMetric[];
  
  // Analysis
  analysis: string;
  conclusions: string[];
  recommendations: string[];
}

export interface EquityPoint {
  date: Date;
  value: number;
  benchmark: number;
  drawdown: number;
}

export interface DrawdownPoint {
  date: Date;
  drawdown: number;
  duration: number;
  isActive: boolean;
}

export interface ReturnPoint {
  date: Date;
  return: number;
  benchmark: number;
  excess: number;
}

export interface OverlayPerformanceDetail {
  overlayId: string;
  contribution: number;
  trades: number;
  winRate: number;
  avgReturn: number;
  risk: number;
  sharpe: number;
}

export interface RiskMetric {
  name: string;
  value: number;
  benchmark?: number;
  percentile?: number;
  interpretation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SelectorSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Display settings
  defaultView: 'list' | 'grid' | 'comparison';
  showPerformanceChart: boolean;
  showRiskMetrics: boolean;
  showBacktestResults: boolean;
  
  // Analysis settings
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  includeAlternatives: boolean;
  includeCombinations: boolean;
  
  // Recommendation settings
  maxRecommendations: number;
  minConfidence: number;
  requireBacktest: boolean;
  
  // Notification settings
  notifyOnRecommendation: boolean;
  notifyOnPerformanceChange: boolean;
  notifyOnRiskChange: boolean;
}

// Enums
export type OverlayType = 
  | 'momentum'
  | 'mean_reversion'
  | 'trend_following'
  | 'volatility'
  | 'risk_management'
  | 'timing'
  | 'sector_rotation'
  | 'factor'
  | 'alpha'
  | 'hedge'
  | 'custom';

export type StrategyCategory = 
  | 'growth'
  | 'value'
  | 'momentum'
  | 'quality'
  | 'defensive'
  | 'income'
  | 'balanced'
  | 'aggressive'
  | 'conservative'
  | 'alternative';

export type AssetType = 
  | 'equity'
  | 'bond'
  | 'commodity'
  | 'currency'
  | 'reit'
  | 'crypto'
  | 'alternative'
  | 'cash';

export type RiskLevel = 
  | 'very_low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high';

export type TriggerType = 
  | 'market_condition'
  | 'performance_threshold'
  | 'time_based'
  | 'volatility_spike'
  | 'correlation_change'
  | 'volume_surge'
  | 'news_sentiment'
  | 'technical_signal'
  | 'fundamental_change'
  | 'custom';

// Error types
export class OverlayError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'OverlayError';
  }
}

export class SelectionError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'SelectionError';
  }
}

export class SimulationError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'SimulationError';
  }
} 