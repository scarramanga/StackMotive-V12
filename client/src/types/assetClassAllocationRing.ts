// Block 76: Asset Class Allocation Ring - Types
// Smart Asset Class Allocation Ring with AU/NZ Tax Integration

export interface AssetClassAllocationRing {
  id: string;
  userId: string;
  
  // Ring identification
  ringName: string;
  description?: string;
  
  // Portfolio reference
  portfolioId: string;
  portfolioValue: number;
  currency: 'AUD' | 'NZD' | 'USD';
  
  // Asset class allocations
  assetClasses: AssetClassAllocation[];
  
  // Ring visualization configuration
  ringConfig: RingConfiguration;
  
  // Target allocations
  targetAllocations: TargetAllocation[];
  
  // Rebalancing
  rebalancingNeeded: boolean;
  rebalancingSuggestions: RebalancingSuggestion[];
  
  // AU/NZ specific insights
  taxInsights: AUNZTaxInsights;
  complianceStatus: AllocationComplianceStatus;
  
  // Performance and analytics
  allocationPerformance: AllocationPerformance;
  historicalDrift: AllocationDrift[];
  
  // Ring layers and views
  activeLayers: RingLayer[];
  currentView: RingViewType;
  
  // Metadata
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetClassAllocation {
  id: string;
  ringId: string;
  
  // Asset class details
  assetClass: AssetClassType;
  assetClassName: string;
  description: string;
  
  // Current allocation
  currentValue: number;
  currentPercentage: number;
  targetPercentage: number;
  variance: number; // Difference from target
  
  // Geographic breakdown
  geographicBreakdown: GeographicAllocation[];
  
  // Tax characteristics (AU/NZ specific)
  taxCharacteristics: AssetClassTaxCharacteristics;
  
  // Holdings composition
  topHoldings: AssetClassHolding[];
  holdingsCount: number;
  
  // Performance metrics
  performance: AssetClassPerformance;
  
  // Ring visualization
  ringSegment: RingSegment;
  
  // Metadata
  lastRebalanced?: Date;
  createdAt: Date;
}

export type AssetClassType = 
  | 'equities'
  | 'bonds'
  | 'etfs'
  | 'managed_funds'
  | 'property'
  | 'crypto'
  | 'commodities'
  | 'cash'
  | 'alternatives'
  | 'other';

export interface GeographicAllocation {
  region: GeographicRegion;
  regionName: string;
  value: number;
  percentage: number;
  
  // Tax implications for region
  taxImplications: RegionalTaxImplications;
}

export type GeographicRegion = 'AU' | 'NZ' | 'US' | 'UK' | 'ASIA' | 'EUROPE' | 'EMERGING' | 'GLOBAL' | 'OTHER';

export interface RegionalTaxImplications {
  // NZ specific
  fifApplicable?: boolean; // Foreign holdings >$50K threshold
  cgtExempt?: boolean; // NZ investor in AU/NZ equities
  
  // AU specific
  frankingCreditsEligible?: boolean; // AU equities
  cgtDiscountEligible?: boolean; // >12 month holdings
  
  // General
  withholdingTaxRate?: number;
  foreignTaxCredits?: number;
  isDomestic: boolean;
}

export interface AssetClassTaxCharacteristics {
  // Overall tax efficiency
  taxEfficiencyScore: number; // 0-100
  
  // Income characteristics
  dividendYield: number;
  frankingCreditYield?: number; // AU only
  taxableIncomeYield: number;
  
  // Capital gains characteristics
  expectedTurnover: number; // Annual turnover rate
  cgtImplications: CGTImplications;
  
  // AU/NZ specific
  auSpecific?: AUTaxCharacteristics;
  nzSpecific?: NZTaxCharacteristics;
}

export interface CGTImplications {
  shortTermGainsRisk: 'low' | 'medium' | 'high';
  longTermGainsExpected: number;
  discountEligible: boolean; // AU >12 months
  exemptionApplicable: boolean; // NZ investor status
}

export interface AUTaxCharacteristics {
  frankingLevel: 'none' | 'partial' | 'full';
  averageFrankingRate: number;
  cgtDiscountPercentage: number; // Percentage of holdings >12 months
  negativeGearingPotential: 'none' | 'low' | 'medium' | 'high';
}

export interface NZTaxCharacteristics {
  investorStatusImplications: 'cgt_exempt' | 'cgt_applicable' | 'income_treatment';
  fifStatus: 'not_applicable' | 'under_threshold' | 'applicable';
  pureInvestmentPercentage: number; // Percentage considered pure investment
}

export interface AssetClassHolding {
  id: string;
  symbol: string;
  name: string;
  value: number;
  percentage: number; // Of this asset class
  
  // Classification
  subAssetClass?: string;
  sector?: string;
  geography: GeographicRegion;
  
  // Tax status
  taxStatus: HoldingTaxStatus;
}

export interface HoldingTaxStatus {
  cgtStatus: 'exempt' | 'discount_eligible' | 'full_rate';
  frankingEligible: boolean;
  fifApplicable: boolean;
  taxTreatment: 'income' | 'capital' | 'mixed';
}

export interface AssetClassPerformance {
  // Returns
  oneMonthReturn: number;
  threeMonthReturn: number;
  sixMonthReturn: number;
  oneYearReturn: number;
  threeYearReturn: number;
  
  // Risk metrics
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  
  // Tax-adjusted performance
  afterTaxReturn: number;
  taxDrag: number; // Impact of taxes on returns
  
  // Contribution to portfolio
  contributionToReturn: number;
  contributionToRisk: number;
}

export interface RingConfiguration {
  // Visual settings
  innerRadius: number;
  outerRadius: number;
  padding: number;
  
  // Colors and themes
  colorScheme: RingColorScheme;
  customColors?: Record<AssetClassType, string>;
  
  // Animation settings
  animationDuration: number;
  animationEasing: AnimationEasing;
  enableAnimations: boolean;
  
  // Interaction settings
  enableHover: boolean;
  enableClick: boolean;
  enableDragRebalance: boolean;
  
  // Ring layers
  layerConfiguration: RingLayerConfig[];
  
  // Labels and text
  showLabels: boolean;
  showPercentages: boolean;
  showValues: boolean;
  labelPosition: LabelPosition;
  
  // Responsive settings
  responsiveBreakpoints: ResponsiveBreakpoint[];
}

export type RingColorScheme = 'default' | 'vibrant' | 'muted' | 'professional' | 'tax_aware' | 'performance' | 'custom';
export type AnimationEasing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
export type LabelPosition = 'inside' | 'outside' | 'center' | 'none';

export interface RingLayerConfig {
  layerId: string;
  layerType: RingLayerType;
  enabled: boolean;
  order: number;
  
  // Layer-specific settings
  thickness: number;
  gap: number;
  dataSource: LayerDataSource;
  
  // Styling
  colorMapping: ColorMapping;
  opacity: number;
}

export type RingLayerType = 'asset_class' | 'geography' | 'tax_treatment' | 'performance' | 'risk' | 'custom';

export interface LayerDataSource {
  source: 'asset_class' | 'geographic' | 'tax' | 'performance' | 'custom';
  field?: string;
  aggregation?: 'sum' | 'average' | 'weighted_average';
}

export interface ColorMapping {
  type: 'categorical' | 'gradient' | 'threshold';
  colors: string[];
  domain?: number[];
  thresholds?: number[];
}

export interface ResponsiveBreakpoint {
  minWidth: number;
  config: Partial<RingConfiguration>;
}

export interface RingSegment {
  id: string;
  assetClassId: string;
  
  // Segment geometry
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  
  // Visual properties
  color: string;
  opacity: number;
  stroke?: string;
  strokeWidth?: number;
  
  // Data
  value: number;
  percentage: number;
  label: string;
  
  // Interaction state
  isHovered: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  
  // Animation
  transition: SegmentTransition;
}

export interface SegmentTransition {
  fromAngle: number;
  toAngle: number;
  duration: number;
  delay: number;
  easing: AnimationEasing;
}

export interface TargetAllocation {
  id: string;
  ringId: string;
  
  // Target details
  targetName: string;
  description: string;
  
  // Asset class targets
  assetClassTargets: AssetClassTarget[];
  
  // Strategy information
  strategy: AllocationStrategy;
  
  // Constraints
  constraints: AllocationConstraint[];
  
  // Rebalancing settings
  rebalancingTriggers: RebalancingTrigger[];
  
  // Performance tracking
  targetPerformance: TargetPerformance;
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface AssetClassTarget {
  assetClass: AssetClassType;
  targetPercentage: number;
  minPercentage?: number;
  maxPercentage?: number;
  
  // Tolerance bands
  rebalanceThreshold: number; // % variance before rebalancing
  
  // Priority for rebalancing
  priority: 'high' | 'medium' | 'low';
}

export interface AllocationStrategy {
  strategyType: StrategyType;
  strategyName: string;
  description: string;
  
  // Strategy parameters
  riskTolerance: RiskTolerance;
  timeHorizon: TimeHorizon;
  investmentGoals: InvestmentGoal[];
  
  // AU/NZ specific considerations
  taxOptimization: TaxOptimizationSettings;
  
  // Benchmarks
  benchmarkPortfolio?: BenchmarkPortfolio;
}

export type StrategyType = 
  | 'conservative'
  | 'moderate'
  | 'aggressive'
  | 'income_focused'
  | 'growth_focused'
  | 'tax_efficient'
  | 'custom';

export type RiskTolerance = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
export type TimeHorizon = 'short' | 'medium' | 'long' | 'very_long';
export type InvestmentGoal = 'retirement' | 'wealth_building' | 'income' | 'tax_minimization' | 'capital_preservation' | 'other';

export interface TaxOptimizationSettings {
  // Overall tax efficiency priority
  taxEfficiencyPriority: 'low' | 'medium' | 'high';
  
  // AU specific
  frankingCreditPreference?: 'maximize' | 'moderate' | 'ignore';
  cgtMinimization?: boolean;
  negativeGearingUtilization?: boolean;
  
  // NZ specific
  investorStatusMaintenance?: boolean; // Maintain investor vs trader classification
  fifMinimization?: boolean; // Minimize FIF obligations
  domesticPreference?: boolean; // Prefer AU/NZ assets for CGT exemption
  
  // General
  harvestLosses: boolean;
  deferGains: boolean;
  useAccountTypes: AccountTypeStrategy;
}

export interface AccountTypeStrategy {
  useSuper: boolean; // AU superannuation
  useKiwiSaver: boolean; // NZ KiwiSaver
  useTaxableAccounts: boolean;
  accountPriority: AccountPriority[];
}

export interface AccountPriority {
  accountType: string;
  priority: number;
  assetClassPreferences: AssetClassType[];
}

export interface BenchmarkPortfolio {
  benchmarkName: string;
  assetClassBenchmarks: AssetClassBenchmark[];
  expectedReturn: number;
  expectedVolatility: number;
}

export interface AssetClassBenchmark {
  assetClass: AssetClassType;
  benchmark: string; // e.g., "ASX 200", "NZX 50"
  weight: number;
}

export interface AllocationConstraint {
  constraintType: ConstraintType;
  constraintName: string;
  description: string;
  
  // Constraint parameters
  assetClass?: AssetClassType;
  geography?: GeographicRegion;
  
  // Limits
  minValue?: number;
  maxValue?: number;
  absoluteLimit?: number;
  
  // Tax constraints
  taxConstraints?: TaxConstraint[];
  
  // Active status
  isActive: boolean;
}

export type ConstraintType = 
  | 'asset_class_limit'
  | 'geographic_limit'
  | 'sector_limit'
  | 'tax_limit'
  | 'risk_limit'
  | 'liquidity_limit'
  | 'custom';

export interface TaxConstraint {
  // FIF threshold management (NZ)
  fifThresholdBuffer?: number; // Stay X% below $50K threshold
  
  // Franking credit targets (AU)
  minFrankingYield?: number;
  maxFrankingConcentration?: number;
  
  // CGT optimization
  cgtDiscountMinimum?: number; // Minimum % of holdings >12 months
  maxCgtLiability?: number; // Maximum annual CGT liability
  
  // General tax efficiency
  maxTaxDrag?: number; // Maximum acceptable tax drag
}

export interface RebalancingTrigger {
  triggerId: string;
  triggerType: TriggerType;
  triggerName: string;
  
  // Trigger conditions
  thresholdPercentage?: number;
  absoluteThreshold?: number;
  timeBasedInterval?: RebalanceInterval;
  
  // Tax-aware triggers
  taxAwareTriggers?: TaxAwareTrigger[];
  
  // Actions
  suggestRebalance: boolean;
  autoRebalance: boolean;
  
  // Status
  isActive: boolean;
  lastTriggered?: Date;
}

export type TriggerType = 'percentage_variance' | 'absolute_variance' | 'time_based' | 'tax_event' | 'performance_based' | 'custom';
export type RebalanceInterval = 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually';

export interface TaxAwareTrigger {
  // CGT-aware rebalancing
  avoidShortTermGains: boolean;
  preferLossHarvesting: boolean;
  
  // FIF-aware (NZ)
  respectFifThreshold: boolean;
  
  // Franking credit aware (AU)
  maintainFrankingYield: boolean;
  
  // Tax year optimization
  yearEndOptimization: boolean;
}

export interface TargetPerformance {
  // Expected returns
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  
  // Tracking vs actual
  trackingError: number;
  informationRatio: number;
  
  // Tax efficiency
  expectedTaxDrag: number;
  afterTaxReturn: number;
  
  // Performance attribution
  assetClassContribution: AssetClassContribution[];
}

export interface AssetClassContribution {
  assetClass: AssetClassType;
  returnContribution: number;
  riskContribution: number;
  taxContribution: number;
}

export interface RebalancingSuggestion {
  id: string;
  ringId: string;
  
  // Suggestion details
  suggestionType: SuggestionType;
  priority: SuggestionPriority;
  description: string;
  
  // Proposed changes
  proposedChanges: ProposedChange[];
  
  // Expected impact
  expectedImpact: RebalanceImpact;
  
  // Tax implications
  taxImplications: RebalanceTaxImplications;
  
  // Implementation
  implementationSteps: ImplementationStep[];
  estimatedCost: number;
  
  // Timing
  suggestedTiming: Date;
  urgency: SuggestionUrgency;
  
  // Status
  isAccepted: boolean;
  isImplemented: boolean;
  createdAt: Date;
}

export type SuggestionType = 
  | 'drift_correction'
  | 'tax_optimization'
  | 'performance_improvement'
  | 'risk_reduction'
  | 'constraint_compliance'
  | 'opportunity_based';

export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';
export type SuggestionUrgency = 'immediate' | 'soon' | 'moderate' | 'when_convenient';

export interface ProposedChange {
  assetClass: AssetClassType;
  fromPercentage: number;
  toPercentage: number;
  change: number;
  
  // Specific actions
  actions: RebalanceAction[];
  
  // Cost estimation
  estimatedCost: number;
  taxImpact: number;
}

export interface RebalanceAction {
  actionType: ActionType;
  assetClass: AssetClassType;
  amount: number;
  
  // Specific holdings
  targetHoldings?: string[];
  
  // Tax considerations
  taxOptimized: boolean;
  cgtImplications?: number;
  frankingImpact?: number;
}

export type ActionType = 'buy' | 'sell' | 'hold' | 'switch' | 'reweight';

export interface RebalanceImpact {
  // Portfolio level impact
  expectedReturnChange: number;
  riskChange: number;
  diversificationImprovement: number;
  
  // Cost impact
  transactionCosts: number;
  taxCosts: number;
  totalCosts: number;
  
  // Time to complete
  estimatedTimeframe: string;
  
  // Risk assessment
  implementationRisk: 'low' | 'medium' | 'high';
}

export interface RebalanceTaxImplications {
  // CGT implications
  capitalGainsTrigger: number;
  capitalLossesRealized: number;
  netCgtImpact: number;
  
  // AU specific
  frankingCreditImpact?: number;
  cgtDiscountLost?: number;
  
  // NZ specific
  fifThresholdImpact?: number;
  investorStatusRisk?: 'none' | 'low' | 'medium' | 'high';
  
  // Tax efficiency score change
  taxEfficiencyChange: number;
}

export interface ImplementationStep {
  stepNumber: number;
  action: string;
  description: string;
  
  // Dependencies
  dependencies: string[];
  
  // Timing
  estimatedDuration: string;
  optimalTiming?: Date;
  
  // Tax optimization
  taxOptimalOrder: boolean;
}

export interface AUNZTaxInsights {
  // Overall tax efficiency
  overallTaxEfficiency: number; // 0-100 score
  taxDragEstimate: number;
  
  // AU specific insights
  auInsights?: AUAllocationInsights;
  
  // NZ specific insights
  nzInsights?: NZAllocationInsights;
  
  // General insights
  generalInsights: TaxInsight[];
  
  // Recommendations
  taxOptimizationRecommendations: TaxRecommendation[];
}

export interface AUAllocationInsights {
  // Franking credits
  totalFrankingYield: number;
  frankingConcentration: number;
  frankingEfficiency: 'poor' | 'fair' | 'good' | 'excellent';
  
  // CGT optimization
  cgtDiscountEligiblePercentage: number;
  potentialCgtLiability: number;
  cgtOptimizationScore: number;
  
  // Superannuation utilization
  superUtilization: number;
  superOptimizationPotential: number;
  
  // Negative gearing opportunities
  negativeGearingUtilization: 'none' | 'limited' | 'moderate' | 'extensive';
}

export interface NZAllocationInsights {
  // Investor status maintenance
  investorStatusRisk: 'low' | 'medium' | 'high';
  pureInvestmentPercentage: number;
  
  // FIF implications
  fifThresholdUtilization: number; // % of $50K threshold used
  fifLiabilityEstimate: number;
  fifOptimizationScore: number;
  
  // CGT exemption utilization
  cgtExemptPercentage: number;
  domesticFocusScore: number;
  
  // KiwiSaver utilization
  kiwiSaverUtilization: number;
  kiwiSaverOptimizationPotential: number;
}

export interface TaxInsight {
  insightType: TaxInsightType;
  category: 'opportunity' | 'risk' | 'optimization' | 'compliance';
  severity: 'info' | 'warning' | 'important' | 'critical';
  
  // Insight details
  title: string;
  description: string;
  impact: string;
  
  // Quantification
  potentialSaving?: number;
  riskAmount?: number;
  confidenceLevel: number;
  
  // Action items
  recommendations: string[];
  actionable: boolean;
}

export type TaxInsightType = 
  | 'franking_optimization'
  | 'fif_threshold_management'
  | 'cgt_planning'
  | 'loss_harvesting'
  | 'account_optimization'
  | 'timing_optimization'
  | 'compliance_risk';

export interface TaxRecommendation {
  recommendationType: TaxInsightType;
  priority: 'low' | 'medium' | 'high';
  
  // Recommendation details
  title: string;
  description: string;
  rationale: string;
  
  // Expected benefit
  expectedBenefit: number;
  timeframe: string;
  
  // Implementation
  implementationSteps: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  
  // Risks
  risks: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AllocationComplianceStatus {
  // Overall compliance
  overallStatus: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
  
  // Specific compliance areas
  constraintCompliance: ConstraintCompliance[];
  taxCompliance: TaxComplianceStatus;
  
  // Issues and warnings
  activeIssues: ComplianceIssue[];
  warnings: ComplianceWarning[];
  
  // Last check
  lastComplianceCheck: Date;
  nextScheduledCheck: Date;
}

export interface ConstraintCompliance {
  constraintId: string;
  constraintName: string;
  isCompliant: boolean;
  
  // Variance details
  currentValue: number;
  limitValue: number;
  variance: number;
  
  // Severity
  severity: 'info' | 'warning' | 'violation';
}

export interface TaxComplianceStatus {
  // AU compliance
  auCompliance?: {
    superContributionLimits: boolean;
    cgtRecordKeeping: boolean;
    frankingCreditEligibility: boolean;
  };
  
  // NZ compliance
  nzCompliance?: {
    investorStatusMaintained: boolean;
    fifThresholdCompliance: boolean;
    kiwiSaverCompliance: boolean;
  };
  
  // General compliance
  recordKeepingAdequate: boolean;
  taxReportingReady: boolean;
}

export interface ComplianceIssue {
  issueId: string;
  issueType: 'constraint_violation' | 'tax_compliance' | 'regulatory' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Issue details
  title: string;
  description: string;
  impact: string;
  
  // Resolution
  recommendations: string[];
  urgency: 'immediate' | 'soon' | 'moderate' | 'low';
  
  // Status
  isResolved: boolean;
  resolutionDate?: Date;
}

export interface ComplianceWarning {
  warningId: string;
  warningType: string;
  title: string;
  message: string;
  
  // Timing
  expiryDate?: Date;
  acknowledged: boolean;
}

export interface AllocationPerformance {
  // Performance metrics
  overallPerformance: PerformanceMetrics;
  assetClassPerformance: AssetClassPerformanceMetrics[];
  
  // Attribution analysis
  performanceAttribution: PerformanceAttribution;
  
  // Benchmarking
  benchmarkComparison: BenchmarkComparison[];
  
  // Risk metrics
  riskMetrics: AllocationRiskMetrics;
  
  // Tax-adjusted performance
  taxAdjustedPerformance: TaxAdjustedPerformance;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  
  // Time periods
  periodReturns: PeriodReturn[];
}

export interface PeriodReturn {
  period: '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ITD';
  return: number;
  benchmark?: number;
  excess?: number;
}

export interface AssetClassPerformanceMetrics {
  assetClass: AssetClassType;
  
  // Returns
  totalReturn: number;
  contributionToPortfolio: number;
  
  // Risk contribution
  volatilityContribution: number;
  trackingError: number;
  
  // Efficiency
  sharpeRatio: number;
  informationRatio: number;
}

export interface PerformanceAttribution {
  // Asset allocation effect
  assetAllocationEffect: number;
  securitySelectionEffect: number;
  interactionEffect: number;
  
  // Attribution by asset class
  assetClassAttribution: AssetClassAttribution[];
  
  // Currency attribution (for multi-currency portfolios)
  currencyAttribution?: CurrencyAttribution[];
}

export interface AssetClassAttribution {
  assetClass: AssetClassType;
  allocationEffect: number;
  selectionEffect: number;
  totalEffect: number;
}

export interface CurrencyAttribution {
  currency: string;
  currencyEffect: number;
  hedgingEffect: number;
}

export interface BenchmarkComparison {
  benchmarkName: string;
  
  // Performance comparison
  portfolioReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  
  // Risk comparison
  portfolioRisk: number;
  benchmarkRisk: number;
  trackingError: number;
  
  // Risk-adjusted metrics
  informationRatio: number;
  treynorRatio: number;
}

export interface AllocationRiskMetrics {
  // Portfolio level risk
  totalRisk: number;
  systematicRisk: number;
  idiosyncraticRisk: number;
  
  // Risk decomposition
  assetClassRiskContribution: AssetClassRiskContribution[];
  
  // Concentration risk
  concentrationMetrics: ConcentrationMetrics;
  
  // Stress testing
  stressTestResults: StressTestResult[];
}

export interface AssetClassRiskContribution {
  assetClass: AssetClassType;
  riskContribution: number;
  marginalRisk: number;
  componentRisk: number;
}

export interface ConcentrationMetrics {
  herfindahlIndex: number;
  topHoldingsConcentration: number;
  effectiveNHoldings: number;
  maxSingleHoldingWeight: number;
}

export interface StressTestResult {
  scenarioName: string;
  portfolioImpact: number;
  worstAssetClass: AssetClassType;
  worstAssetClassImpact: number;
  
  // Recovery metrics
  estimatedRecoveryTime: string;
  maxDrawdownInScenario: number;
}

export interface TaxAdjustedPerformance {
  // Pre-tax vs after-tax
  preTaxReturn: number;
  afterTaxReturn: number;
  taxDrag: number;
  
  // Tax components
  taxOnIncome: number;
  taxOnCapitalGains: number;
  frankingCreditBenefit?: number; // AU
  
  // Efficiency metrics
  taxEfficiencyRatio: number;
  taxAlpha: number; // Tax-adjusted excess return
}

export interface AllocationDrift {
  id: string;
  ringId: string;
  
  // Drift measurement
  measurementDate: Date;
  totalDrift: number; // Sum of absolute variances
  maxDrift: number; // Largest single variance
  
  // Asset class specific drift
  assetClassDrifts: AssetClassDrift[];
  
  // Drift causes
  driftCauses: DriftCause[];
  
  // Actions taken
  actionsTaken: DriftAction[];
}

export interface AssetClassDrift {
  assetClass: AssetClassType;
  targetPercentage: number;
  actualPercentage: number;
  drift: number;
  driftDirection: 'over' | 'under' | 'on_target';
}

export interface DriftCause {
  cause: DriftCauseType;
  impact: number;
  description: string;
}

export type DriftCauseType = 
  | 'market_movement'
  | 'cash_flow'
  | 'dividend_reinvestment'
  | 'rebalancing_lag'
  | 'currency_movement'
  | 'corporate_action';

export interface DriftAction {
  actionType: 'rebalance' | 'trade' | 'cash_deployment' | 'none';
  description: string;
  impact: number;
  cost: number;
}

export interface RingLayer {
  layerId: string;
  layerName: string;
  layerType: RingLayerType;
  
  // Layer data
  layerData: LayerDataPoint[];
  
  // Visual configuration
  visualConfig: LayerVisualConfig;
  
  // Interaction settings
  interactive: boolean;
  
  // Status
  isVisible: boolean;
  isActive: boolean;
}

export interface LayerDataPoint {
  id: string;
  label: string;
  value: number;
  percentage: number;
  
  // Visual properties
  color: string;
  opacity?: number;
  
  // Additional data
  metadata: Record<string, any>;
}

export interface LayerVisualConfig {
  innerRadius: number;
  outerRadius: number;
  
  // Styling
  strokeWidth: number;
  strokeColor: string;
  fillOpacity: number;
  
  // Labels
  showLabels: boolean;
  labelFont: string;
  labelColor: string;
}

export type RingViewType = 
  | 'simple' // Basic asset class view
  | 'detailed' // Multi-layer view
  | 'tax_aware' // Tax-optimized view
  | 'performance' // Performance-focused view
  | 'risk' // Risk-focused view
  | 'geographic' // Geographic breakdown
  | 'custom'; // User-defined view

// Filter and search interfaces
export interface AllocationRingFilter {
  assetClasses?: AssetClassType[];
  geographicRegions?: GeographicRegion[];
  valueRange?: [number, number];
  performanceRange?: [number, number];
  taxEfficiencyRange?: [number, number];
  
  // Status filters
  needsRebalancing?: boolean;
  hasIssues?: boolean;
  isCompliant?: boolean;
  
  // Date filters
  createdAfter?: Date;
  lastUpdatedAfter?: Date;
  
  // Search
  searchTerm?: string;
}

// API interfaces
export interface AllocationRingResponse {
  success: boolean;
  ring?: AssetClassAllocationRing;
  errors?: string[];
  warnings?: string[];
}

export interface AllocationRingListResponse {
  rings: AssetClassAllocationRing[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface RebalanceAnalysisRequest {
  ringId: string;
  targetAllocationId?: string;
  customTargets?: AssetClassTarget[];
  
  // Analysis options
  includeTaxAnalysis: boolean;
  includeTransactionCosts: boolean;
  
  // Constraints
  maxSingleTradeSize?: number;
  respectTaxLots?: boolean;
}

export interface RebalanceAnalysisResponse {
  success: boolean;
  analysis?: {
    currentState: AssetClassAllocation[];
    proposedState: AssetClassAllocation[];
    requiredTrades: ProposedChange[];
    taxImplications: RebalanceTaxImplications;
    costs: RebalanceImpact;
    alternatives: RebalancingSuggestion[];
  };
  errors?: string[];
}

// Hook return interface
export interface UseAssetClassAllocationRingReturn {
  // Data
  rings: AssetClassAllocationRing[];
  currentRing: AssetClassAllocationRing | null;
  
  // Loading states
  isLoading: boolean;
  isAnalyzing: boolean;
  isRebalancing: boolean;
  
  // Ring operations
  createRing: (config: Omit<AssetClassAllocationRing, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<AssetClassAllocationRing>;
  updateRing: (id: string, updates: Partial<AssetClassAllocationRing>) => Promise<AssetClassAllocationRing>;
  deleteRing: (id: string) => Promise<void>;
  
  // Asset class operations
  addAssetClass: (ringId: string, assetClass: Omit<AssetClassAllocation, 'id' | 'ringId' | 'createdAt'>) => Promise<void>;
  updateAssetClass: (ringId: string, assetClassId: string, updates: Partial<AssetClassAllocation>) => Promise<void>;
  removeAssetClass: (ringId: string, assetClassId: string) => Promise<void>;
  
  // Target allocation management
  setTargetAllocations: (ringId: string, targets: AssetClassTarget[]) => Promise<void>;
  updateTargetAllocation: (ringId: string, targetId: string, updates: Partial<TargetAllocation>) => Promise<void>;
  
  // Rebalancing
  analyzeRebalancing: (request: RebalanceAnalysisRequest) => Promise<RebalanceAnalysisResponse>;
  executeRebalancing: (ringId: string, changes: ProposedChange[]) => Promise<void>;
  getSuggestions: (ringId: string) => Promise<RebalancingSuggestion[]>;
  
  // Ring configuration
  updateRingConfig: (ringId: string, config: Partial<RingConfiguration>) => Promise<void>;
  setActiveView: (ringId: string, view: RingViewType) => void;
  toggleLayer: (ringId: string, layerId: string) => void;
  
  // Performance and analytics
  getPerformanceAnalysis: (ringId: string, period?: string) => Promise<AllocationPerformance>;
  getTaxInsights: (ringId: string) => Promise<AUNZTaxInsights>;
  getComplianceStatus: (ringId: string) => Promise<AllocationComplianceStatus>;
  
  // Filtering and search
  filterRings: (filter: AllocationRingFilter) => void;
  searchRings: (query: string) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  
  // Real-time updates
  subscribeToUpdates: (ringId: string) => void;
  unsubscribeFromUpdates: (ringId: string) => void;
}

// Store state interface
export interface AssetClassAllocationRingState {
  // Data
  rings: Record<string, AssetClassAllocationRing>;
  
  // Current ring
  currentRingId: string | null;
  
  // UI state
  activeFilter: AllocationRingFilter;
  searchQuery: string;
  selectedRingIds: string[];
  
  // Ring interaction state
  hoveredSegment: string | null;
  selectedSegment: string | null;
  dragState: RingDragState | null;
  
  // Processing state
  analyzingRings: Record<string, boolean>;
  rebalancingRings: Record<string, boolean>;
  
  // Cache management
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Real-time subscriptions
  activeSubscriptions: Record<string, boolean>;
  
  // Error handling
  errors: Record<string, string>;
}

export interface RingDragState {
  ringId: string;
  segmentId: string;
  startAngle: number;
  currentAngle: number;
  isDragging: boolean;
  
  // Preview state
  previewAllocations: AssetClassAllocation[];
}

// Calculation utilities
export interface AllocationCalculator {
  calculateVariance: (actual: number, target: number) => number;
  calculateRebalanceAmount: (currentValue: number, targetPercentage: number, totalValue: number) => number;
  calculateTaxImpact: (change: ProposedChange, taxStatus: HoldingTaxStatus) => number;
  optimizeTradeOrder: (changes: ProposedChange[]) => ProposedChange[];
}

// Export utility interfaces
export interface RingExportOptions {
  format: 'pdf' | 'png' | 'svg' | 'csv' | 'xlsx';
  includeData: boolean;
  includeAnalysis: boolean;
  includeTaxInsights: boolean;
  customTitle?: string;
  
  // Visual options
  resolution?: number;
  colorScheme?: RingColorScheme;
  showLabels?: boolean;
}

export interface RingExportResult {
  format: string;
  data: Blob | string;
  filename: string;
  size: number;
} 