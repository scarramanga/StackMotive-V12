// Block 91: Rebalance Simulation Engine - Types
// Portfolio Rebalancing Simulation and What-If Analysis

export interface RebalanceSimulationEngine {
  id: string;
  userId: string;
  
  // Engine identification
  engineName: string;
  description: string;
  
  // Configuration
  simulationConfig: SimulationConfig;
  
  // Current state
  engineStatus: EngineStatus;
  
  // Performance metrics
  performanceMetrics: PerformanceMetrics;
  
  // Simulations
  activeSimulations: RebalanceSimulation[];
  simulationHistory: RebalanceSimulation[];
  
  // Templates
  rebalanceTemplates: RebalanceTemplate[];
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface SimulationConfig {
  // Simulation parameters
  simulationHorizon: number; // days
  rebalanceFrequency: RebalanceFrequency;
  
  // Cost modeling
  costModel: CostModel;
  
  // Tax considerations
  taxConfig: TaxConfig;
  
  // Risk constraints
  riskConstraints: RiskConstraints;
  
  // Optimization settings
  optimizationConfig: OptimizationConfig;
  
  // AU/NZ specific
  jurisdiction: 'AU' | 'NZ';
  complianceSettings: ComplianceSettings;
}

export interface RebalanceSimulation {
  id: string;
  engineId: string;
  
  // Simulation identification
  simulationName: string;
  description: string;
  
  // Input data
  currentPortfolio: PortfolioSnapshot;
  targetAllocation: TargetAllocation;
  
  // Simulation parameters
  simulationParams: SimulationParameters;
  
  // Results
  simulationResults: SimulationResults;
  
  // Status
  status: SimulationStatus;
  
  // Execution info
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSnapshot {
  portfolioId: string;
  snapshotDate: Date;
  
  // Holdings
  holdings: HoldingSnapshot[];
  
  // Portfolio metrics
  totalValue: number;
  cashBalance: number;
  
  // Performance
  performance: PerformanceSnapshot;
  
  // Risk metrics
  riskMetrics: RiskMetricsSnapshot;
  
  // Allocation
  currentAllocation: AllocationSnapshot;
}

export interface HoldingSnapshot {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  sector: string;
  
  // Position details
  quantity: number;
  price: number;
  value: number;
  weight: number;
  
  // Performance
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  
  // Risk metrics
  volatility: number;
  beta: number;
  
  // Tax info
  costBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  holdingPeriod: number; // days
  
  // AU/NZ specific
  jurisdiction: 'AU' | 'NZ';
  frankedDividendYield?: number; // AU only
  imputationCredits?: number; // AU only
  
  // Liquidity
  liquidityScore: number;
  averageVolume: number;
  
  // Metadata
  lastUpdated: Date;
}

export interface TargetAllocation {
  allocationId: string;
  allocationName: string;
  
  // Asset class targets
  assetClassTargets: AssetClassTarget[];
  
  // Sector targets
  sectorTargets: SectorTarget[];
  
  // Geographic targets
  geographicTargets: GeographicTarget[];
  
  // Individual holdings
  holdingTargets: HoldingTarget[];
  
  // Constraints
  constraints: AllocationConstraints;
  
  // Rebalancing rules
  rebalanceRules: RebalanceRules;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetClassTarget {
  assetClass: AssetClass;
  targetWeight: number;
  tolerance: number;
  
  // Constraints
  minWeight: number;
  maxWeight: number;
  
  // Priority
  priority: 'high' | 'medium' | 'low';
  
  // Rebalancing
  rebalanceThreshold: number;
  
  // Expected returns
  expectedReturn: number;
  expectedVolatility: number;
}

export interface SectorTarget {
  sector: string;
  targetWeight: number;
  tolerance: number;
  
  // Constraints
  minWeight: number;
  maxWeight: number;
  
  // Concentration limits
  maxConcentration: number;
}

export interface GeographicTarget {
  region: string;
  country: string;
  targetWeight: number;
  tolerance: number;
  
  // Constraints
  minWeight: number;
  maxWeight: number;
  
  // Currency exposure
  currencyHedged: boolean;
}

export interface HoldingTarget {
  symbol: string;
  targetWeight: number;
  tolerance: number;
  
  // Position limits
  minPosition: number;
  maxPosition: number;
  
  // Actions
  action: 'buy' | 'sell' | 'hold';
  targetQuantity: number;
  
  // Priority
  priority: number;
}

export interface SimulationParameters {
  // Time parameters
  startDate: Date;
  endDate: Date;
  rebalanceFrequency: RebalanceFrequency;
  
  // Market assumptions
  marketAssumptions: MarketAssumptions;
  
  // Transaction costs
  transactionCosts: TransactionCosts;
  
  // Tax implications
  taxAssumptions: TaxAssumptions;
  
  // Risk parameters
  riskParameters: RiskParameters;
  
  // Optimization
  optimizationMethod: OptimizationMethod;
  
  // Constraints
  constraints: SimulationConstraints;
}

export interface SimulationResults {
  // Summary metrics
  summary: SimulationSummary;
  
  // Detailed results
  rebalanceActions: RebalanceAction[];
  
  // Performance analysis
  performanceAnalysis: PerformanceAnalysis;
  
  // Risk analysis
  riskAnalysis: RiskAnalysis;
  
  // Cost analysis
  costAnalysis: CostAnalysis;
  
  // Tax analysis
  taxAnalysis: TaxAnalysis;
  
  // Scenarios
  scenarios: ScenarioResult[];
  
  // Recommendations
  recommendations: Recommendation[];
}

export interface RebalanceAction {
  actionId: string;
  
  // Action details
  symbol: string;
  name: string;
  action: 'buy' | 'sell';
  
  // Quantities
  currentQuantity: number;
  targetQuantity: number;
  changeQuantity: number;
  changePercent: number;
  
  // Values
  currentValue: number;
  targetValue: number;
  changeValue: number;
  
  // Weights
  currentWeight: number;
  targetWeight: number;
  changeWeight: number;
  
  // Costs
  transactionCost: number;
  marketImpact: number;
  
  // Tax implications
  taxImplications: TaxImplication;
  
  // Timing
  suggestedExecutionDate: Date;
  executionPriority: 'high' | 'medium' | 'low';
  
  // Rationale
  rationale: string;
}

export interface TaxImplication {
  // Capital gains
  capitalGains: number;
  capitalGainsType: 'short_term' | 'long_term';
  
  // Tax liability
  estimatedTax: number;
  taxRate: number;
  
  // AU/NZ specific
  frankedDividends?: number; // AU
  imputationCredits?: number; // AU
  
  // Timing considerations
  taxOptimization: TaxOptimization;
}

export interface TaxOptimization {
  // Strategies
  harvestLosses: boolean;
  deferGains: boolean;
  
  // Timing
  optimalExecutionDate: Date;
  taxSavings: number;
  
  // Recommendations
  recommendations: string[];
}

export interface PerformanceAnalysis {
  // Returns
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  
  // Tracking
  trackingError: number;
  informationRatio: number;
  
  // Downside risk
  valueAtRisk: number;
  conditionalVaR: number;
  maxDrawdown: number;
  
  // Efficiency
  rebalanceEfficiency: number;
  costEfficiency: number;
  
  // Comparison
  beforeRebalance: PerformanceMetrics;
  afterRebalance: PerformanceMetrics;
  improvement: PerformanceMetrics;
}

export interface RiskAnalysis {
  // Portfolio risk
  portfolioRisk: RiskMetrics;
  
  // Concentration risk
  concentrationRisk: ConcentrationRisk;
  
  // Correlation analysis
  correlationAnalysis: CorrelationAnalysis;
  
  // Risk attribution
  riskAttribution: RiskAttribution;
  
  // Stress testing
  stressTestResults: StressTestResult[];
  
  // Risk budget
  riskBudget: RiskBudget;
}

export interface CostAnalysis {
  // Transaction costs
  totalTransactionCosts: number;
  
  // Cost breakdown
  costBreakdown: CostBreakdown;
  
  // Market impact
  marketImpact: number;
  
  // Opportunity costs
  opportunityCosts: number;
  
  // Cost efficiency
  costEfficiency: number;
  
  // Break-even analysis
  breakEvenAnalysis: BreakEvenAnalysis;
}

export interface TaxAnalysis {
  // Tax implications
  totalTaxLiability: number;
  
  // Tax breakdown
  taxBreakdown: TaxBreakdown;
  
  // After-tax returns
  afterTaxReturns: AfterTaxReturns;
  
  // Tax optimization
  taxOptimization: TaxOptimizationResult;
  
  // Jurisdiction specific
  jurisdictionSpecific: JurisdictionSpecificTax;
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  
  // Scenario parameters
  marketConditions: MarketConditions;
  
  // Results
  performanceResult: PerformanceResult;
  riskResult: RiskResult;
  
  // Probability
  probability: number;
  
  // Impact
  impact: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  recommendationId: string;
  type: RecommendationType;
  
  // Recommendation details
  title: string;
  description: string;
  rationale: string;
  
  // Impact
  expectedImpact: ExpectedImpact;
  
  // Implementation
  implementationSteps: string[];
  
  // Priority
  priority: 'high' | 'medium' | 'low';
  
  // Timing
  timeframe: string;
  
  // Confidence
  confidence: number;
}

export interface RebalanceTemplate {
  templateId: string;
  templateName: string;
  
  // Template configuration
  targetAllocation: TargetAllocation;
  rebalanceRules: RebalanceRules;
  
  // Parameters
  defaultParameters: SimulationParameters;
  
  // Constraints
  constraints: TemplateConstraints;
  
  // Usage
  isDefault: boolean;
  usageCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface RebalanceRules {
  // Thresholds
  rebalanceThreshold: number;
  
  // Frequency
  minimumRebalanceInterval: number; // days
  maximumRebalanceInterval: number; // days
  
  // Triggers
  triggers: RebalanceTrigger[];
  
  // Constraints
  constraints: RebalanceConstraints;
  
  // Cost limits
  maxTransactionCost: number;
  maxTransactionCostPercent: number;
  
  // Tax considerations
  taxAwareRebalancing: boolean;
  
  // Market conditions
  marketConditionRules: MarketConditionRule[];
}

export interface RebalanceTrigger {
  triggerId: string;
  triggerType: TriggerType;
  
  // Conditions
  conditions: TriggerCondition[];
  
  // Actions
  actions: TriggerAction[];
  
  // Status
  isActive: boolean;
  
  // Priority
  priority: number;
}

// Enums and Union Types
export type RebalanceFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'custom';
export type AssetClass = 'equity' | 'bond' | 'cash' | 'commodity' | 'real_estate' | 'alternative' | 'crypto';
export type SimulationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type OptimizationMethod = 'mean_variance' | 'black_litterman' | 'risk_parity' | 'minimum_variance' | 'maximum_diversification';
export type RecommendationType = 'allocation' | 'timing' | 'cost_optimization' | 'tax_optimization' | 'risk_management';
export type TriggerType = 'threshold' | 'time' | 'market_condition' | 'performance' | 'volatility';

// State and Hook Types
export interface RebalanceSimulationEngineState {
  engines: Record<string, RebalanceSimulationEngine>;
  currentEngineId: string | null;
  activeSimulations: Record<string, RebalanceSimulation>;
  simulationQueue: string[];
  selectedSimulationIds: string[];
  
  // Cache
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
}

export interface UseRebalanceSimulationEngineReturn {
  // Data
  engines: RebalanceSimulationEngine[];
  currentEngine: RebalanceSimulationEngine | null;
  simulations: RebalanceSimulation[];
  
  // Loading states
  isLoading: boolean;
  isSimulating: boolean;
  
  // Engine operations
  createEngine: (config: Omit<RebalanceSimulationEngine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<RebalanceSimulationEngine>;
  updateEngine: (id: string, updates: Partial<RebalanceSimulationEngine>) => Promise<RebalanceSimulationEngine>;
  deleteEngine: (id: string) => Promise<void>;
  
  // Simulation operations
  createSimulation: (engineId: string, config: Omit<RebalanceSimulation, 'id' | 'engineId' | 'createdAt' | 'updatedAt'>) => Promise<RebalanceSimulation>;
  runSimulation: (simulationId: string) => Promise<SimulationResults>;
  cancelSimulation: (simulationId: string) => Promise<void>;
  
  // Template operations
  createTemplate: (template: Omit<RebalanceTemplate, 'templateId' | 'createdAt' | 'updatedAt'>) => Promise<RebalanceTemplate>;
  updateTemplate: (templateId: string, updates: Partial<RebalanceTemplate>) => Promise<RebalanceTemplate>;
  deleteTemplate: (templateId: string) => Promise<void>;
  
  // Analysis operations
  analyzePortfolio: (portfolioId: string) => Promise<PortfolioAnalysis>;
  compareAllocations: (current: TargetAllocation, target: TargetAllocation) => Promise<AllocationComparison>;
  optimizeAllocation: (constraints: OptimizationConstraints) => Promise<TargetAllocation>;
  
  // Utility functions
  setCurrentEngine: (engineId: string | null) => void;
  refreshData: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Additional Supporting Types
export interface EngineStatus {
  status: 'active' | 'inactive' | 'maintenance';
  lastHealthCheck: Date;
  activeSimulations: number;
  queuedSimulations: number;
  totalSimulations: number;
  successRate: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  
  // Risk metrics
  valueAtRisk: number;
  conditionalVaR: number;
  beta: number;
  
  // Efficiency metrics
  informationRatio: number;
  trackingError: number;
  
  // Additional metrics
  calmarRatio: number;
  sortinoRatio: number;
  treynorRatio: number;
}

export interface CostModel {
  // Transaction costs
  fixedCost: number;
  variableCostRate: number;
  
  // Market impact
  marketImpactModel: MarketImpactModel;
  
  // Timing costs
  timingCosts: TimingCosts;
  
  // AU/NZ specific
  stampDuty?: number; // AU
  gst?: number; // AU/NZ
  
  // Brokerage
  brokerageFees: BrokerageFees;
}

export interface TaxConfig {
  // Jurisdiction
  jurisdiction: 'AU' | 'NZ';
  
  // Tax rates
  capitalGainsTaxRate: number;
  incomeTaxRate: number;
  
  // AU specific
  cgtDiscount?: number; // AU CGT discount
  frankedDividendTaxCredit?: number; // AU
  
  // NZ specific
  fdrRate?: number; // NZ FDR
  
  // Optimization
  taxOptimizationEnabled: boolean;
  lossHarvestingEnabled: boolean;
  
  // Timing
  taxYearEnd: Date;
}

export interface RiskConstraints {
  // Portfolio level
  maxPortfolioVolatility: number;
  maxDrawdown: number;
  maxVaR: number;
  
  // Asset level
  maxAssetWeight: number;
  maxSectorWeight: number;
  maxCountryWeight: number;
  
  // Concentration
  maxConcentration: number;
  
  // Correlation
  maxCorrelation: number;
  
  // Liquidity
  minLiquidity: number;
}

export interface OptimizationConfig {
  method: OptimizationMethod;
  objective: OptimizationObjective;
  
  // Constraints
  constraints: OptimizationConstraints;
  
  // Parameters
  riskAversion: number;
  
  // Convergence
  tolerance: number;
  maxIterations: number;
  
  // Advanced options
  useBlackLittermanViews: boolean;
  robustOptimization: boolean;
}

export interface ComplianceSettings {
  // Regulatory compliance
  regulatoryFramework: string;
  
  // Reporting requirements
  reportingRequirements: string[];
  
  // Disclosure requirements
  disclosureRequirements: string[];
  
  // Investment restrictions
  investmentRestrictions: InvestmentRestriction[];
  
  // Documentation
  documentationRequired: boolean;
}

export interface MarketAssumptions {
  // Return assumptions
  expectedReturns: Record<string, number>;
  
  // Risk assumptions
  volatilities: Record<string, number>;
  correlations: number[][];
  
  // Market conditions
  marketRegime: 'bull' | 'bear' | 'neutral';
  
  // Economic assumptions
  inflationRate: number;
  interestRates: InterestRateAssumptions;
}

export interface TransactionCosts {
  // Direct costs
  commissions: number;
  fees: number;
  
  // Indirect costs
  bidAskSpread: number;
  marketImpact: number;
  
  // Timing costs
  opportunityCost: number;
  
  // Total cost
  totalCost: number;
  totalCostPercent: number;
}

export interface TaxAssumptions {
  // Tax rates
  marginalTaxRate: number;
  capitalGainsTaxRate: number;
  
  // Holding periods
  shortTermThreshold: number; // days
  longTermThreshold: number; // days
  
  // Optimization
  taxDeferral: boolean;
  lossHarvesting: boolean;
}

export interface RiskParameters {
  // Risk measures
  confidenceLevel: number;
  timeHorizon: number;
  
  // Monte Carlo
  monteCarloSimulations: number;
  
  // Stress testing
  stressTestScenarios: StressTestScenario[];
}

export interface SimulationConstraints {
  // Position constraints
  minPositionSize: number;
  maxPositionSize: number;
  
  // Turnover constraints
  maxTurnover: number;
  
  // Cash constraints
  minCashBalance: number;
  maxCashBalance: number;
  
  // Sector constraints
  sectorConstraints: SectorConstraint[];
  
  // ESG constraints
  esgConstraints?: ESGConstraints;
}

export interface SimulationSummary {
  // Key metrics
  totalValue: number;
  totalCost: number;
  totalTax: number;
  netBenefit: number;
  
  // Performance
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  
  // Efficiency
  rebalanceEfficiency: number;
  costEfficiency: number;
  
  // Actions
  totalActions: number;
  buyActions: number;
  sellActions: number;
  
  // Summary
  recommendationScore: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

export default RebalanceSimulationEngine; 