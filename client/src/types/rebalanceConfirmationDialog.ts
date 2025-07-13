// Block 27: Rebalance Confirmation Dialog - Types
// TypeScript interfaces for rebalance confirmation and dialog management

export interface RebalanceConfirmationDialog {
  id: string;
  title: string;
  isOpen: boolean;
  
  // Rebalance data
  rebalanceData: RebalanceData;
  
  // Dialog configuration
  config: DialogConfig;
  
  // User interactions
  userActions: UserAction[];
  confirmationSteps: ConfirmationStep[];
  
  // Validation
  validation: ValidationResult;
  
  // State
  currentStep: number;
  isLoading: boolean;
  canProceed: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface RebalanceData {
  id: string;
  portfolioId: string;
  strategyId: string;
  
  // Current state
  currentAllocations: AssetAllocation[];
  targetAllocations: AssetAllocation[];
  
  // Changes
  changes: AllocationChange[];
  trades: ProposedTrade[];
  
  // Impact analysis
  impact: RebalanceImpact;
  
  // Costs
  costs: TradingCosts;
  
  // Risk analysis
  riskAnalysis: RiskAnalysis;
  
  // Performance projection
  performanceProjection: PerformanceProjection;
  
  // Metadata
  triggeredBy: RebalanceTrigger;
  reason: string;
  confidence: number;
  
  // Timing
  proposedExecutionTime: Date;
  estimatedDuration: number;
  marketHours: boolean;
  
  // Compliance
  compliance: ComplianceCheck;
}

export interface AssetAllocation {
  assetId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  
  // Current allocation
  currentShares: number;
  currentValue: number;
  currentWeight: number;
  
  // Target allocation
  targetShares: number;
  targetValue: number;
  targetWeight: number;
  
  // Market data
  currentPrice: number;
  marketValue: number;
  
  // Metadata
  sector?: string;
  region?: string;
  currency: string;
}

export interface AllocationChange {
  assetId: string;
  symbol: string;
  
  // Change details
  changeType: 'buy' | 'sell' | 'hold';
  
  // Quantities
  currentShares: number;
  targetShares: number;
  sharesDifference: number;
  
  // Values
  currentValue: number;
  targetValue: number;
  valueDifference: number;
  
  // Weights
  currentWeight: number;
  targetWeight: number;
  weightDifference: number;
  
  // Trade details
  estimatedPrice: number;
  estimatedCost: number;
  
  // Risk impact
  riskImpact: number;
  
  // Rationale
  reason: string;
  priority: number;
}

export interface ProposedTrade {
  id: string;
  assetId: string;
  symbol: string;
  
  // Trade details
  side: 'buy' | 'sell';
  orderType: OrderType;
  quantity: number;
  estimatedPrice: number;
  estimatedValue: number;
  
  // Timing
  proposedTime: Date;
  timeInForce: TimeInForce;
  
  // Execution
  executionAlgorithm: ExecutionAlgorithm;
  
  // Costs
  commission: number;
  fees: number;
  marketImpact: number;
  slippage: number;
  
  // Risk
  liquidity: LiquidityMetrics;
  volatility: number;
  
  // Constraints
  constraints: TradeConstraint[];
  
  // Priority
  priority: number;
  sequence: number;
}

export interface RebalanceImpact {
  // Portfolio impact
  portfolioImpact: PortfolioImpact;
  
  // Risk impact
  riskImpact: RiskImpact;
  
  // Cost impact
  costImpact: CostImpact;
  
  // Tax impact
  taxImpact: TaxImpact;
  
  // Liquidity impact
  liquidityImpact: LiquidityImpact;
  
  // Market impact
  marketImpact: MarketImpact;
  
  // Overall assessment
  overallImpact: OverallImpact;
}

export interface PortfolioImpact {
  // Diversification
  diversificationChange: number;
  concentrationChange: number;
  
  // Risk metrics
  riskChange: number;
  sharpeChange: number;
  volatilityChange: number;
  
  // Expected return
  returnChange: number;
  
  // Tracking error
  trackingErrorChange: number;
  
  // Sector exposure
  sectorExposureChanges: SectorExposureChange[];
  
  // Factor exposure
  factorExposureChanges: FactorExposureChange[];
}

export interface SectorExposureChange {
  sector: string;
  currentExposure: number;
  targetExposure: number;
  change: number;
}

export interface FactorExposureChange {
  factor: string;
  currentExposure: number;
  targetExposure: number;
  change: number;
}

export interface RiskImpact {
  // VaR changes
  var95Change: number;
  var99Change: number;
  
  // Drawdown risk
  maxDrawdownChange: number;
  
  // Correlation changes
  correlationChanges: CorrelationChange[];
  
  // Concentration risk
  concentrationRiskChange: number;
  
  // Liquidity risk
  liquidityRiskChange: number;
  
  // Overall risk score
  riskScoreChange: number;
}

export interface CorrelationChange {
  asset1: string;
  asset2: string;
  currentCorrelation: number;
  newCorrelation: number;
  change: number;
}

export interface CostImpact {
  // Direct costs
  totalCommissions: number;
  totalFees: number;
  regulatoryFees: number;
  
  // Market impact costs
  bidAskSpread: number;
  priceImpact: number;
  slippage: number;
  
  // Opportunity costs
  delayedExecution: number;
  marketTiming: number;
  
  // Total cost
  totalCost: number;
  costAsPercentage: number;
}

export interface TaxImpact {
  // Capital gains/losses
  realizedGains: number;
  realizedLosses: number;
  netRealizedGainLoss: number;
  
  // Tax liability
  shortTermCapitalGainsTax: number;
  longTermCapitalGainsTax: number;
  totalTaxLiability: number;
  
  // Tax efficiency
  taxEfficiencyChange: number;
  
  // Wash sale implications
  washSaleRisk: WashSaleRisk[];
  
  // Tax loss harvesting opportunities
  taxLossHarvestingOpportunities: TaxLossOpportunity[];
}

export interface WashSaleRisk {
  assetId: string;
  symbol: string;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
}

export interface TaxLossOpportunity {
  assetId: string;
  symbol: string;
  potentialLoss: number;
  taxBenefit: number;
  recommendation: string;
}

export interface LiquidityImpact {
  // Time to execute
  estimatedExecutionTime: number;
  
  // Market depth
  marketDepthImpact: number;
  
  // Liquidity constraints
  liquidityConstraints: LiquidityConstraint[];
  
  // Trading volume impact
  volumeImpact: number;
}

export interface LiquidityConstraint {
  assetId: string;
  constraint: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface MarketImpact {
  // Price impact
  estimatedPriceImpact: number;
  
  // Volume impact
  volumeAsPercentageOfADV: number;
  
  // Timing impact
  marketTimingRisk: number;
  
  // Volatility impact
  volatilityImpact: number;
}

export interface OverallImpact {
  score: number;
  level: 'low' | 'medium' | 'high';
  recommendation: 'proceed' | 'caution' | 'review';
  
  // Key risks
  keyRisks: string[];
  
  // Key benefits
  keyBenefits: string[];
  
  // Mitigation strategies
  mitigationStrategies: string[];
}

export interface TradingCosts {
  // Direct costs
  commissions: CostBreakdown;
  fees: CostBreakdown;
  taxes: CostBreakdown;
  
  // Indirect costs
  marketImpact: CostBreakdown;
  slippage: CostBreakdown;
  
  // Total
  totalCosts: number;
  costAsPercentage: number;
  
  // Breakdown by trade
  tradeBreakdown: TradeCostBreakdown[];
}

export interface CostBreakdown {
  amount: number;
  percentage: number;
  description: string;
}

export interface TradeCostBreakdown {
  tradeId: string;
  symbol: string;
  totalCost: number;
  costComponents: CostComponent[];
}

export interface CostComponent {
  type: string;
  amount: number;
  percentage: number;
}

export interface RiskAnalysis {
  // Current vs target risk
  currentRisk: RiskMetrics;
  targetRisk: RiskMetrics;
  riskChange: RiskMetrics;
  
  // Scenario analysis
  scenarios: ScenarioAnalysis[];
  
  // Stress testing
  stressTests: StressTestResult[];
  
  // Risk decomposition
  riskDecomposition: RiskDecomposition;
  
  // Risk limits
  riskLimits: RiskLimitCheck[];
}

export interface RiskMetrics {
  volatility: number;
  var95: number;
  var99: number;
  expectedShortfall: number;
  beta: number;
  sharpeRatio: number;
  trackingError: number;
}

export interface ScenarioAnalysis {
  scenario: string;
  probability: number;
  impact: number;
  description: string;
}

export interface StressTestResult {
  stressTest: string;
  impact: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface RiskDecomposition {
  systematic: number;
  specific: number;
  factors: FactorRisk[];
}

export interface FactorRisk {
  factor: string;
  contribution: number;
  percentage: number;
}

export interface RiskLimitCheck {
  limit: string;
  currentValue: number;
  limitValue: number;
  status: 'ok' | 'warning' | 'breach';
  action: string;
}

export interface PerformanceProjection {
  // Expected returns
  expectedReturn: number;
  
  // Return scenarios
  scenarios: ReturnScenario[];
  
  // Time horizon analysis
  timeHorizons: TimeHorizonAnalysis[];
  
  // Benchmark comparison
  benchmarkComparison: BenchmarkComparison;
  
  // Attribution
  attribution: PerformanceAttribution;
}

export interface ReturnScenario {
  scenario: string;
  probability: number;
  return: number;
  description: string;
}

export interface TimeHorizonAnalysis {
  timeHorizon: string;
  expectedReturn: number;
  volatility: number;
  probabilityOfPositiveReturn: number;
}

export interface BenchmarkComparison {
  benchmark: string;
  expectedExcess: number;
  trackingError: number;
  informationRatio: number;
}

export interface PerformanceAttribution {
  assetSelection: number;
  sectorAllocation: number;
  interaction: number;
  total: number;
}

export interface DialogConfig {
  // Appearance
  width: number;
  height: number;
  position: 'center' | 'top' | 'bottom';
  
  // Behavior
  modal: boolean;
  closable: boolean;
  escapeClosable: boolean;
  
  // Steps
  showSteps: boolean;
  allowSkipSteps: boolean;
  
  // Validation
  requireConfirmation: boolean;
  validateOnNext: boolean;
  
  // Auto-actions
  autoClose: boolean;
  autoCloseDelay: number;
  
  // Notifications
  showNotifications: boolean;
  notificationLevel: 'info' | 'warning' | 'error';
}

export interface UserAction {
  id: string;
  type: UserActionType;
  timestamp: Date;
  
  // Action details
  action: string;
  target: string;
  value?: any;
  
  // Context
  step: number;
  page: string;
  
  // Validation
  isValid: boolean;
  validationErrors: string[];
}

export interface ConfirmationStep {
  id: string;
  title: string;
  description: string;
  type: StepType;
  
  // Content
  content: StepContent;
  
  // Navigation
  isRequired: boolean;
  canSkip: boolean;
  showNext: boolean;
  showPrevious: boolean;
  
  // Validation
  validation: StepValidation;
  
  // State
  isCompleted: boolean;
  isValid: boolean;
  
  // Actions
  actions: StepAction[];
}

export interface StepContent {
  // Display content
  title: string;
  description: string;
  details?: string;
  
  // Data to display
  data?: any;
  
  // Charts and visualizations
  charts?: ChartConfig[];
  
  // Tables
  tables?: TableConfig[];
  
  // Interactive elements
  inputs?: InputConfig[];
  
  // Warnings and alerts
  alerts?: AlertConfig[];
}

export interface ChartConfig {
  id: string;
  type: string;
  title: string;
  data: any;
  options: any;
}

export interface TableConfig {
  id: string;
  title: string;
  columns: string[];
  data: any[];
  options: any;
}

export interface InputConfig {
  id: string;
  type: 'checkbox' | 'radio' | 'text' | 'select';
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface AlertConfig {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  dismissible: boolean;
}

export interface StepValidation {
  isRequired: boolean;
  rules: ValidationRule[];
  customValidation?: (data: any) => ValidationResult;
}

export interface ValidationRule {
  field: string;
  rule: string;
  value?: any;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StepAction {
  id: string;
  type: 'button' | 'link' | 'custom';
  label: string;
  
  // Behavior
  action: string;
  primary: boolean;
  disabled: boolean;
  
  // Validation
  requiresValidation: boolean;
  
  // Confirmation
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

export interface ComplianceCheck {
  status: 'compliant' | 'warning' | 'violation';
  checks: ComplianceRule[];
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: 'regulatory' | 'internal' | 'best_practice';
  status: 'pass' | 'fail' | 'warning';
}

export interface ComplianceViolation {
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  impact: string;
  resolution: string;
}

export interface ComplianceWarning {
  ruleId: string;
  message: string;
  recommendation: string;
}

export interface LiquidityMetrics {
  averageDailyVolume: number;
  volumeAsPercentageOfADV: number;
  bidAskSpread: number;
  marketDepth: number;
  liquidityScore: number;
}

export interface TradeConstraint {
  type: string;
  value: any;
  description: string;
}

// Enums
export type AssetType = 'equity' | 'bond' | 'etf' | 'mutual_fund' | 'reit' | 'commodity' | 'currency' | 'alternative';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'twap' | 'vwap';

export type TimeInForce = 'day' | 'gtc' | 'ioc' | 'fok' | 'at_open' | 'at_close';

export type ExecutionAlgorithm = 'market' | 'twap' | 'vwap' | 'pov' | 'is' | 'custom';

export type RebalanceTrigger = 'scheduled' | 'threshold' | 'manual' | 'signal' | 'risk_limit' | 'compliance';

export type UserActionType = 'click' | 'input' | 'navigation' | 'validation' | 'confirmation';

export type StepType = 'overview' | 'analysis' | 'confirmation' | 'execution' | 'summary';

// Error types
export class RebalanceError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'RebalanceError';
  }
}

export class DialogError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'DialogError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
} 