// Block 77: Risk Exposure Meter - Types
// Comprehensive Risk Analytics with AU/NZ Market Integration

export interface RiskExposureMeter {
  id: string;
  userId: string;
  portfolioId: string;
  
  // Risk meter identification
  meterName: string;
  description?: string;
  
  // Portfolio reference
  portfolioValue: number;
  currency: 'AUD' | 'NZD' | 'USD';
  
  // Overall risk assessment
  overallRiskLevel: RiskLevel;
  riskScore: number; // 0-100 scale
  
  // Core risk metrics
  riskMetrics: PortfolioRiskMetrics;
  
  // Risk breakdown
  riskContributions: RiskContribution[];
  concentrationRisks: ConcentrationRisk[];
  
  // AU/NZ specific risks
  auNzRiskFactors: AUNZRiskFactors;
  
  // Stress testing
  stressTestResults: StressTestResult[];
  
  // Risk monitoring
  riskAlerts: RiskAlert[];
  riskThresholds: RiskThreshold[];
  
  // Risk trends
  riskTrends: RiskTrend[];
  
  // Meter configuration
  meterConfig: RiskMeterConfiguration;
  
  // Compliance and limits
  riskCompliance: RiskComplianceStatus;
  
  // Performance vs risk
  riskAdjustedMetrics: RiskAdjustedMetrics;
  
  // Metadata
  lastCalculated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RiskLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';

export interface PortfolioRiskMetrics {
  // Volatility metrics
  portfolioVolatility: number; // Annualized standard deviation
  volatility1M: number;
  volatility3M: number;
  volatility1Y: number;
  
  // Value at Risk (VaR)
  var1Day95: number; // 1-day 95% VaR
  var1Day99: number; // 1-day 99% VaR
  var1Week95: number;
  var1Month95: number;
  
  // Expected Shortfall (CVaR)
  cvar1Day95: number;
  cvar1Day99: number;
  
  // Drawdown metrics
  maxDrawdown: number;
  currentDrawdown: number;
  averageDrawdown: number;
  drawdownDuration: number; // Days in current drawdown
  
  // Beta and correlation
  marketBeta: number; // Beta to market index
  benchmarkCorrelation: number;
  
  // Sharpe ratios
  sharpeRatio: number;
  informationRatio: number;
  calmarRatio: number;
  sortinoRatio: number;
  
  // Risk-adjusted returns
  treynorRatio: number;
  jensenAlpha: number;
  
  // Tail risk measures
  skewness: number;
  kurtosis: number;
  tailRisk: number;
  
  // Liquidity risk
  liquidityScore: number; // 0-100 scale
  liquidityRisk: number;
  
  // Currency risk (for multi-currency portfolios)
  currencyExposure: CurrencyExposure[];
  currencyRisk: number;
}

export interface RiskContribution {
  id: string;
  
  // Contributor identification
  contributorType: RiskContributorType;
  contributorId: string;
  contributorName: string;
  
  // Risk contribution
  volatilityContribution: number; // Contribution to portfolio volatility
  varContribution: number; // Contribution to VaR
  marginalVar: number; // Marginal VaR
  componentVar: number; // Component VaR
  
  // Percentage contributions
  percentageOfRisk: number;
  percentageOfPortfolio: number;
  
  // Risk efficiency
  riskEfficiency: number; // Return per unit of risk
  diversificationBenefit: number;
  
  // Correlation impact
  correlationWithPortfolio: number;
  averageCorrelation: number;
}

export type RiskContributorType = 
  | 'asset_class'
  | 'individual_holding'
  | 'sector'
  | 'geography'
  | 'currency'
  | 'factor';

export interface ConcentrationRisk {
  concentrationType: ConcentrationType;
  concentrationName: string;
  
  // Concentration metrics
  concentration: number; // Herfindahl index or similar
  topNConcentration: number; // Top N holdings concentration
  maxSingleWeight: number;
  
  // Risk assessment
  concentrationRisk: RiskLevel;
  diversificationScore: number; // 0-100 scale
  
  // Threshold analysis
  isOverConcentrated: boolean;
  thresholdBreached?: ConcentrationThreshold;
  
  // Impact analysis
  potentialLoss: number; // Potential loss from concentration
  liquidationRisk: number;
}

export type ConcentrationType = 
  | 'single_asset'
  | 'asset_class'
  | 'sector'
  | 'geography'
  | 'currency'
  | 'issuer'
  | 'counterparty';

export interface ConcentrationThreshold {
  thresholdType: ConcentrationType;
  warningLevel: number;
  limitLevel: number;
  description: string;
}

export interface AUNZRiskFactors {
  // Market-specific risks
  asxRisk?: AUMarketRisk; // Australian market risks
  nzxRisk?: NZMarketRisk; // New Zealand market risks
  
  // Currency risks
  audExposure: number;
  nzDollarExposure: number;
  foreignCurrencyRisk: number;
  
  // Regulatory and tax risks
  taxRisks: TaxRisk[];
  regulatoryRisks: RegulatoryRisk[];
  
  // Sector concentration (AU/NZ specific)
  miningExposure: number; // AU mining concentration
  bankingExposure: number; // AU big 4 banks
  dairyExposure: number; // NZ dairy sector
  
  // Commodity exposure
  commodityRisk: CommodityRisk;
  
  // Interest rate sensitivity
  interestRateSensitivity: InterestRateRisk;
  
  // Liquidity considerations
  marketLiquidityRisk: number;
  crossListingRisk: number;
}

export interface AUMarketRisk {
  asxConcentration: number;
  top20Exposure: number; // ASX 20 exposure
  resourcesSectorRisk: number;
  financialsSectorRisk: number;
  reitExposure: number;
  frankingCreditRisk: number; // Risk from franking changes
}

export interface NZMarketRisk {
  nzxConcentration: number;
  top10Exposure: number; // NZX top 10 exposure
  dualListingExposure: number; // Companies listed on both ASX/NZX
  economicDependencyRisk: number; // Dependence on AU economy
  commodityDependencyRisk: number;
}

export interface TaxRisk {
  riskType: TaxRiskType;
  jurisdiction: 'AU' | 'NZ';
  description: string;
  potentialImpact: number; // Estimated $ impact
  probability: 'low' | 'medium' | 'high';
  
  // Specific risk details
  legislativeRisk?: string;
  complianceRisk?: string;
  optimizationRisk?: string;
}

export type TaxRiskType = 
  | 'franking_credit_changes' // AU
  | 'cgt_rule_changes'
  | 'fif_threshold_changes' // NZ
  | 'investor_trader_reclassification' // NZ
  | 'withholding_tax_changes'
  | 'super_rule_changes' // AU
  | 'kiwisaver_changes'; // NZ

export interface RegulatoryRisk {
  riskType: RegulatoryRiskType;
  jurisdiction: 'AU' | 'NZ';
  description: string;
  potentialImpact: number;
  timeframe: string;
  
  // Risk mitigation
  mitigationStrategies: string[];
  monitoringRequired: boolean;
}

export type RegulatoryRiskType = 
  | 'banking_regulation'
  | 'investment_regulation'
  | 'market_structure_changes'
  | 'prudential_requirements'
  | 'consumer_protection'
  | 'environmental_regulation';

export interface CommodityRisk {
  ironOreExposure: number; // AU iron ore exposure
  goldExposure: number;
  coalExposure: number;
  dairyExposure: number; // NZ dairy exposure
  
  // Commodity risk metrics
  commodityBeta: number;
  commodityVolatility: number;
  commodityCorrelation: number;
}

export interface InterestRateRisk {
  duration: number; // Modified duration
  dv01: number; // Dollar value of 01
  
  // Rate sensitivity by term
  shortRateSensitivity: number; // 0-2 years
  mediumRateSensitivity: number; // 2-10 years
  longRateSensitivity: number; // 10+ years
  
  // Central bank exposure
  rbaNzrbSensitivity: number; // RBA/RBNZ policy sensitivity
}

export interface CurrencyExposure {
  currency: string;
  exposure: number; // Portfolio percentage
  hedged: number; // Hedged percentage
  unhedged: number; // Unhedged percentage
  
  // Currency risk metrics
  currencyVolatility: number;
  currencyBeta: number;
}

export interface StressTestResult {
  id: string;
  testName: string;
  scenario: StressTestScenario;
  
  // Test results
  portfolioImpact: number; // $ impact
  percentageImpact: number; // % impact
  
  // Recovery metrics
  timeToRecover: number; // Days to recover
  maxDrawdownInScenario: number;
  
  // Component impacts
  assetClassImpacts: AssetClassStressImpact[];
  
  // Risk metrics under stress
  stressedVaR: number;
  stressedVolatility: number;
  stressedCorrelations: Record<string, number>;
  
  // Liquidity impact
  liquidityStress: number;
  
  // Test metadata
  testDate: Date;
  testDuration: number; // Scenario duration in days
}

export interface StressTestScenario {
  scenarioId: string;
  scenarioName: string;
  scenarioType: StressTestType;
  
  // Scenario description
  description: string;
  historicalBasis?: string;
  
  // Market shocks
  marketShocks: MarketShock[];
  
  // Economic assumptions
  economicAssumptions: EconomicAssumption[];
  
  // Duration and probability
  scenarioDuration: number; // Days
  probability: 'low' | 'medium' | 'high' | 'extreme';
  
  // AU/NZ specific factors
  auNzFactors?: AUNZStressFactors;
}

export type StressTestType = 
  | 'market_crash'
  | 'interest_rate_shock'
  | 'currency_crisis'
  | 'commodity_shock'
  | 'black_swan'
  | 'historical_replay'
  | 'regulatory_shock'
  | 'liquidity_crisis'
  | 'inflation_shock'
  | 'custom';

export interface MarketShock {
  marketIndex: string; // e.g., 'ASX200', 'NZX50', 'SPX'
  shockType: 'absolute' | 'percentage';
  shockValue: number; // e.g., -20% or -500 points
  
  // Correlation changes
  correlationChanges?: Record<string, number>;
  
  // Volatility changes
  volatilityMultiplier?: number;
}

export interface EconomicAssumption {
  factor: EconomicFactor;
  baselineValue: number;
  stressedValue: number;
  unit: string;
}

export type EconomicFactor = 
  | 'cash_rate' // RBA/RBNZ cash rate
  | 'inflation_rate'
  | 'unemployment_rate'
  | 'gdp_growth'
  | 'commodity_prices'
  | 'exchange_rates'
  | 'credit_spreads'
  | 'volatility_index';

export interface AUNZStressFactors {
  // AU specific stress factors
  miningCommodityShock?: number; // % change in mining commodities
  bankingStress?: number; // Banking sector stress multiplier
  housingMarketShock?: number; // Property market impact
  
  // NZ specific stress factors
  dairyPriceShock?: number; // Dairy commodity shock
  touristFlowImpact?: number; // Tourism impact
  earthquakeRisk?: number; // Natural disaster impact
  
  // Cross-Tasman factors
  auNzSpreadShock?: number; // Interest rate spread changes
  transTasmanTradeImpact?: number; // Trade relationship impact
}

export interface AssetClassStressImpact {
  assetClass: string;
  baselineValue: number;
  stressedValue: number;
  impact: number;
  percentageImpact: number;
  
  // Recovery characteristics
  expectedRecoveryTime: number;
  recoveryProbability: number;
}

export interface RiskAlert {
  id: string;
  alertType: RiskAlertType;
  severity: AlertSeverity;
  
  // Alert details
  title: string;
  message: string;
  description: string;
  
  // Risk data
  currentValue: number;
  thresholdValue: number;
  variance: number;
  
  // Alert timing
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  
  // Actions
  recommendedActions: string[];
  autoActions: AutoAction[];
  
  // Status
  status: AlertStatus;
  priority: AlertPriority;
  
  // Escalation
  escalationLevel: number;
  escalationTriggered: boolean;
}

export type RiskAlertType = 
  | 'var_breach'
  | 'volatility_spike'
  | 'concentration_limit'
  | 'drawdown_threshold'
  | 'correlation_breakdown'
  | 'liquidity_stress'
  | 'stress_test_failure'
  | 'regulatory_breach'
  | 'currency_exposure'
  | 'custom_threshold';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';
export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AutoAction {
  actionType: AutoActionType;
  actionDescription: string;
  isEnabled: boolean;
  parameters: Record<string, any>;
}

export type AutoActionType = 
  | 'send_notification'
  | 'email_alert'
  | 'reduce_exposure'
  | 'hedge_position'
  | 'stop_trading'
  | 'escalate_alert';

export interface RiskThreshold {
  id: string;
  thresholdName: string;
  thresholdType: RiskThresholdType;
  
  // Threshold levels
  warningLevel: number;
  limitLevel: number;
  breachLevel: number;
  
  // Threshold configuration
  measurementPeriod: string; // e.g., '1D', '1W', '1M'
  calculationMethod: string;
  
  // Actions
  warningActions: AutoAction[];
  limitActions: AutoAction[];
  breachActions: AutoAction[];
  
  // Status
  isActive: boolean;
  lastChecked: Date;
  
  // Compliance
  isRegulatory: boolean;
  regulatoryReference?: string;
}

export type RiskThresholdType = 
  | 'portfolio_var'
  | 'asset_concentration'
  | 'sector_concentration'
  | 'currency_exposure'
  | 'volatility_limit'
  | 'drawdown_limit'
  | 'leverage_limit'
  | 'liquidity_minimum'
  | 'stress_test_minimum';

export interface RiskTrend {
  metricName: string;
  metricType: RiskMetricType;
  
  // Trend data
  trendDirection: TrendDirection;
  trendStrength: number; // 0-1 scale
  trendDuration: number; // Days
  
  // Historical data points
  dataPoints: RiskDataPoint[];
  
  // Trend analysis
  volatilityOfRisk: number; // How volatile the risk metric itself is
  predictability: number; // How predictable the trend is
  
  // Forecasting
  shortTermForecast: RiskForecast; // 1-7 days
  mediumTermForecast: RiskForecast; // 1-4 weeks
  
  // Significance
  isSignificant: boolean;
  confidenceLevel: number;
}

export type RiskMetricType = 
  | 'portfolio_volatility'
  | 'var_95'
  | 'max_drawdown'
  | 'correlation_average'
  | 'concentration_index'
  | 'liquidity_score'
  | 'stress_test_score';

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

export interface RiskDataPoint {
  date: Date;
  value: number;
  
  // Context
  marketCondition?: MarketCondition;
  significantEvent?: string;
}

export type MarketCondition = 'bull' | 'bear' | 'sideways' | 'volatile' | 'crisis';

export interface RiskForecast {
  forecastValue: number;
  confidenceInterval: [number, number]; // [lower, upper]
  probability: number;
  
  // Scenario probabilities
  scenarios: ForecastScenario[];
}

export interface ForecastScenario {
  scenarioName: string;
  probability: number;
  forecastValue: number;
  description: string;
}

export interface RiskMeterConfiguration {
  // Visual settings
  meterType: MeterType;
  colorScheme: RiskColorScheme;
  displayMetrics: RiskDisplayMetric[];
  
  // Update frequency
  updateFrequency: UpdateFrequency;
  realTimeUpdates: boolean;
  
  // Alert settings
  enableAlerts: boolean;
  alertChannels: AlertChannel[];
  
  // Calculation settings
  calculationWindow: number; // Days for rolling calculations
  confidenceLevel: number; // For VaR calculations
  
  // Stress testing
  enableAutoStressTesting: boolean;
  stressTestFrequency: StressTestFrequency;
  stressScenarios: string[]; // IDs of enabled scenarios
  
  // AU/NZ specific settings
  includeAUNZFactors: boolean;
  auNzWeighting: number; // Weighting for AU/NZ specific risks
  
  // Risk model settings
  riskModel: RiskModelType;
  correlationModel: CorrelationModelType;
}

export type MeterType = 'gauge' | 'speedometer' | 'progress_bar' | 'heat_map' | 'radar_chart';
export type RiskColorScheme = 'traffic_light' | 'heat_map' | 'blue_red' | 'custom';
export type UpdateFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly';
export type AlertChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook';
export type StressTestFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
export type RiskModelType = 'historical' | 'monte_carlo' | 'parametric' | 'hybrid';
export type CorrelationModelType = 'static' | 'ewma' | 'garch' | 'dynamic';

export interface RiskDisplayMetric {
  metricName: string;
  displayName: string;
  isVisible: boolean;
  displayOrder: number;
  
  // Formatting
  numberFormat: string;
  colorCoding: boolean;
  
  // Thresholds for color coding
  greenThreshold?: number;
  yellowThreshold?: number;
  redThreshold?: number;
}

export interface RiskComplianceStatus {
  // Overall status
  overallStatus: ComplianceStatus;
  lastAssessment: Date;
  
  // Specific compliance areas
  varCompliance: ThresholdCompliance;
  concentrationCompliance: ThresholdCompliance;
  liquidityCompliance: ThresholdCompliance;
  stressTestCompliance: ThresholdCompliance;
  
  // Regulatory compliance (AU/NZ specific)
  regulatoryCompliance: RegulatoryCompliance[];
  
  // Issues and violations
  activeViolations: ComplianceViolation[];
  riskWarnings: ComplianceWarning[];
  
  // Reporting
  lastReport: Date;
  nextReportDue: Date;
}

export type ComplianceStatus = 'compliant' | 'warning' | 'violation' | 'breach';

export interface ThresholdCompliance {
  thresholdName: string;
  isCompliant: boolean;
  currentValue: number;
  thresholdValue: number;
  exceedanceAmount?: number;
  
  // History
  violationCount: number;
  lastViolation?: Date;
  averageExceedance: number;
}

export interface RegulatoryCompliance {
  regulation: string;
  jurisdiction: 'AU' | 'NZ';
  isCompliant: boolean;
  requirements: string[];
  
  // Compliance details
  lastCheck: Date;
  nextCheck: Date;
  complianceScore: number; // 0-100
  
  // Documentation
  evidenceRequired: string[];
  evidenceProvided: string[];
}

export interface ComplianceViolation {
  violationId: string;
  violationType: ViolationType;
  severity: ViolationSeverity;
  
  // Violation details
  description: string;
  threshold: number;
  actualValue: number;
  exceedanceAmount: number;
  
  // Timing
  detectedAt: Date;
  resolvedAt?: Date;
  duration?: number; // Hours in violation
  
  // Actions
  actionsRequired: string[];
  actionsTaken: string[];
  
  // Status
  status: ViolationStatus;
}

export type ViolationType = 'var_breach' | 'concentration_limit' | 'liquidity_minimum' | 'regulatory_limit' | 'custom_threshold';
export type ViolationSeverity = 'minor' | 'major' | 'critical' | 'severe';
export type ViolationStatus = 'active' | 'acknowledged' | 'resolving' | 'resolved';

export interface ComplianceWarning {
  warningId: string;
  warningType: string;
  message: string;
  threshold: number;
  currentValue: number;
  
  // Timing
  triggeredAt: Date;
  expiresAt?: Date;
  
  // Actions
  recommendedActions: string[];
  isAcknowledged: boolean;
}

export interface RiskAdjustedMetrics {
  // Sharpe family
  sharpeRatio: number;
  informationRatio: number;
  calmarRatio: number;
  sortinoRatio: number;
  
  // Alpha and beta
  alpha: number;
  beta: number;
  treynorRatio: number;
  jensenAlpha: number;
  
  // Maximum drawdown adjusted
  marRatio: number; // MAR ratio (return/max drawdown)
  sterlingRatio: number;
  burkeRatio: number;
  
  // VaR adjusted
  varRatio: number; // Return/VaR
  cvarRatio: number; // Return/CVaR
  
  // Omega ratio
  omegaRatio: number;
  
  // Upside/downside analysis
  upsideCapture: number;
  downsideCapture: number;
  captureRatio: number; // Upside/Downside
  
  // Tail risk adjusted
  tailRatio: number;
  
  // AU/NZ specific
  auNzAdjustedReturn?: number; // Return adjusted for AU/NZ specific risks
  taxAdjustedRiskMetrics?: TaxAdjustedRiskMetrics;
}

export interface TaxAdjustedRiskMetrics {
  afterTaxSharpe: number;
  afterTaxAlpha: number;
  taxRiskAdjustment: number;
  
  // AU specific
  frankingAdjustedReturn?: number;
  
  // NZ specific
  fifAdjustedReturn?: number;
}

// Filter and search interfaces
export interface RiskMeterFilter {
  riskLevels?: RiskLevel[];
  alertTypes?: RiskAlertType[];
  complianceStatus?: ComplianceStatus[];
  portfolioValueRange?: [number, number];
  
  // Date filters
  lastCalculatedAfter?: Date;
  createdAfter?: Date;
  
  // Metric filters
  varRange?: [number, number];
  volatilityRange?: [number, number];
  drawdownRange?: [number, number];
  
  // AU/NZ specific
  includeAUNZRisks?: boolean;
  currencyExposure?: string[];
  
  // Search
  searchTerm?: string;
}

// API interfaces
export interface RiskMeterResponse {
  success: boolean;
  meter?: RiskExposureMeter;
  errors?: string[];
  warnings?: string[];
}

export interface RiskMeterListResponse {
  meters: RiskExposureMeter[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface StressTestRequest {
  meterId: string;
  scenarioIds: string[];
  customScenarios?: StressTestScenario[];
  
  // Test options
  includeCorrelationChanges: boolean;
  includeLiquidityStress: boolean;
  timeHorizon: number; // Days
  
  // AU/NZ specific
  includeAUNZFactors: boolean;
  auNzMarketStress?: number;
}

export interface StressTestResponse {
  success: boolean;
  results?: StressTestResult[];
  aggregateResults?: AggregateStressResults;
  errors?: string[];
}

export interface AggregateStressResults {
  worstCaseScenario: string;
  worstCaseLoss: number;
  averageLoss: number;
  probabilityOfLoss: number;
  
  // Recovery analysis
  averageRecoveryTime: number;
  probabilityOfRecovery: number;
  
  // Recommendations
  riskReductions: RiskReductionRecommendation[];
}

export interface RiskReductionRecommendation {
  recommendationType: ReductionType;
  description: string;
  expectedBenefit: number;
  implementationCost: number;
  timeToImplement: string;
  
  // Specific actions
  actions: ReductionAction[];
}

export type ReductionType = 'diversification' | 'hedging' | 'position_sizing' | 'correlation_reduction' | 'liquidity_improvement';

export interface ReductionAction {
  actionType: string;
  targetAssets: string[];
  adjustmentAmount: number;
  expectedImpact: number;
}

// Hook return interface
export interface UseRiskExposureMeterReturn {
  // Data
  meters: RiskExposureMeter[];
  currentMeter: RiskExposureMeter | null;
  
  // Loading states
  isLoading: boolean;
  isCalculating: boolean;
  isStressTesting: boolean;
  
  // Meter operations
  createMeter: (config: Omit<RiskExposureMeter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<RiskExposureMeter>;
  updateMeter: (id: string, updates: Partial<RiskExposureMeter>) => Promise<RiskExposureMeter>;
  deleteMeter: (id: string) => Promise<void>;
  
  // Risk calculations
  calculateRisk: (meterId: string) => Promise<PortfolioRiskMetrics>;
  runStressTest: (request: StressTestRequest) => Promise<StressTestResponse>;
  
  // Alert management
  getActiveAlerts: (meterId: string) => RiskAlert[];
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  
  // Threshold management
  updateThresholds: (meterId: string, thresholds: RiskThreshold[]) => Promise<void>;
  
  // Compliance monitoring
  checkCompliance: (meterId: string) => Promise<RiskComplianceStatus>;
  
  // Filtering and search
  filterMeters: (filter: RiskMeterFilter) => void;
  searchMeters: (query: string) => void;
  
  // Real-time monitoring
  startMonitoring: (meterId: string) => void;
  stopMonitoring: (meterId: string) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  
  // Additional computed values
  riskStats: {
    totalValue: number;
    avgRiskScore: number;
    riskLevelCounts: Record<RiskLevel, number>;
    activeAlertCount: number;
    meterCount: number;
  } | null;
  
  quickActions: {
    calculateAllRisk: () => Promise<void>;
    getMetersByRiskLevel: (level: RiskLevel) => RiskExposureMeter[];
    getMetersWithAlerts: () => RiskExposureMeter[];
    getComplianceIssues: () => RiskExposureMeter[];
  };
  
  // Current filter state
  currentFilter: RiskMeterFilter;
  currentSearchQuery: string;
  
  // Monitoring state
  monitoringMeters: string[];
  
  // Utility functions
  setCurrentMeter: (meter: RiskExposureMeter | null) => void;
  refreshData: () => Promise<void>;
}

// Store state interface
export interface RiskExposureMeterState {
  // Data
  meters: Record<string, RiskExposureMeter>;
  
  // Current meter
  currentMeterId: string | null;
  
  // UI state
  activeFilter: RiskMeterFilter;
  searchQuery: string;
  selectedMeterIds: string[];
  
  // Processing state
  calculatingMeters: Record<string, boolean>;
  stressTestingMeters: Record<string, boolean>;
  
  // Monitoring state
  monitoringMeters: Record<string, boolean>;
  
  // Cache management
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Alert state
  activeAlerts: Record<string, RiskAlert[]>;
  acknowledgedAlerts: Record<string, string[]>;
  
  // Error handling
  errors: Record<string, string>;
} 