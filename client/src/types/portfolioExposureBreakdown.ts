// Block 97: Portfolio Exposure Breakdown - Types
// Portfolio Analysis, Risk Exposure, and Diversification Metrics

export interface PortfolioExposureBreakdown {
  id: string;
  userId: string;
  portfolioId: string;
  
  // Breakdown identification
  breakdownName: string;
  description: string;
  
  // Analysis configuration
  analysisConfig: AnalysisConfiguration;
  
  // Current exposures
  currentExposures: ExposureAnalysis;
  
  // Risk metrics
  riskMetrics: RiskMetrics;
  
  // Diversification analysis
  diversificationAnalysis: DiversificationAnalysis;
  
  // Concentration analysis
  concentrationAnalysis: ConcentrationAnalysis;
  
  // Geographic exposure
  geographicExposure: GeographicExposure;
  
  // Sector exposure
  sectorExposure: SectorExposure;
  
  // Asset class exposure
  assetClassExposure: AssetClassExposure;
  
  // Market cap exposure
  marketCapExposure: MarketCapExposure;
  
  // Currency exposure
  currencyExposure: CurrencyExposure;
  
  // Correlation analysis
  correlationAnalysis: CorrelationAnalysis;
  
  // Compliance analysis
  complianceAnalysis: ComplianceAnalysis;
  
  // Recommendations
  recommendations: ExposureRecommendation[];
  
  // Alert configuration
  alertConfig: ExposureAlertConfig;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastAnalyzed: Date;
}

export interface AnalysisConfiguration {
  // Analysis scope
  analysisScope: AnalysisScope;
  
  // Frequency settings
  updateFrequency: UpdateFrequency;
  
  // Calculation methods
  calculationMethods: CalculationMethods;
  
  // Benchmark settings
  benchmarkConfig: BenchmarkConfiguration;
  
  // Risk parameters
  riskParameters: RiskParameters;
  
  // Thresholds
  exposureThresholds: ExposureThresholds;
  
  // AU/NZ specific settings
  jurisdiction: 'AU' | 'NZ' | 'BOTH';
  regulatorySettings: RegulatorySettings;
  
  // Visualization preferences
  visualizationConfig: VisualizationConfiguration;
  
  // Data sources
  dataSources: DataSourceConfig[];
}

export interface ExposureAnalysis {
  // Overall portfolio metrics
  totalValue: number;
  totalPositions: number;
  analysisTimestamp: Date;
  
  // Exposure breakdowns
  sectorBreakdown: SectorBreakdownItem[];
  assetClassBreakdown: AssetClassBreakdownItem[];
  geographicBreakdown: GeographicBreakdownItem[];
  marketCapBreakdown: MarketCapBreakdownItem[];
  currencyBreakdown: CurrencyBreakdownItem[];
  
  // Risk exposures
  riskExposures: RiskExposureItem[];
  
  // Concentration metrics
  concentrationMetrics: ConcentrationMetrics;
  
  // Quality scores
  qualityScores: QualityScores;
}

export interface RiskMetrics {
  // Overall risk measures
  portfolioVaR: ValueAtRisk;
  expectedShortfall: ExpectedShortfall;
  portfolioBeta: number;
  sharpeRatio: number;
  
  // Volatility measures
  portfolioVolatility: number;
  trackingError: number;
  informationRatio: number;
  
  // Downside risk
  downsideDeviation: number;
  sortinoRatio: number;
  maxDrawdown: number;
  
  // Risk decomposition
  riskContributions: RiskContribution[];
  marginalRisk: MarginalRisk[];
  
  // Stress testing
  stressTestResults: StressTestResult[];
  
  // Risk-adjusted returns
  riskAdjustedReturns: RiskAdjustedReturns;
}

export interface DiversificationAnalysis {
  // Diversification ratios
  diversificationRatio: number;
  effectiveNumberOfPositions: number;
  concentrationRatio: number;
  
  // Correlation metrics
  averageCorrelation: number;
  correlationMatrix: CorrelationMatrix;
  
  // Diversification scores
  diversificationScores: DiversificationScore[];
  
  // Optimization suggestions
  optimizationSuggestions: OptimizationSuggestion[];
  
  // Diversification efficiency
  diversificationEfficiency: DiversificationEfficiency;
}

export interface ConcentrationAnalysis {
  // Concentration indices
  herfindalIndex: number;
  giniCoefficient: number;
  concentrationIndex: number;
  
  // Top holdings analysis
  topHoldings: TopHolding[];
  
  // Concentration by dimensions
  sectorConcentration: ConcentrationByDimension[];
  geographicConcentration: ConcentrationByDimension[];
  assetClassConcentration: ConcentrationByDimension[];
  
  // Risk concentration
  riskConcentration: RiskConcentrationItem[];
  
  // Concentration trends
  concentrationTrends: ConcentrationTrend[];
  
  // Concentration alerts
  concentrationAlerts: ConcentrationAlert[];
}

export interface GeographicExposure {
  // Country exposures
  countryExposures: CountryExposure[];
  
  // Regional exposures
  regionalExposures: RegionalExposure[];
  
  // Developed vs emerging
  developedMarketExposure: number;
  emergingMarketExposure: number;
  
  // Currency translation effects
  currencyEffects: CurrencyEffect[];
  
  // Geographic risk metrics
  geographicRiskMetrics: GeographicRiskMetrics;
  
  // Home bias analysis
  homeBiasAnalysis: HomeBiasAnalysis;
}

export interface SectorExposure {
  // Sector allocations
  sectorAllocations: SectorAllocation[];
  
  // GICS classification
  gicsExposure: GICSExposure;
  
  // Sector rotation analysis
  sectorRotationAnalysis: SectorRotationAnalysis;
  
  // Sector risk metrics
  sectorRiskMetrics: SectorRiskMetrics[];
  
  // Sector momentum
  sectorMomentum: SectorMomentum[];
  
  // Sector valuations
  sectorValuations: SectorValuation[];
}

export interface AssetClassExposure {
  // Asset class allocations
  assetClassAllocations: AssetClassAllocation[];
  
  // Strategic vs actual allocation
  strategicAllocation: StrategicAllocation[];
  allocationDrift: AllocationDrift[];
  
  // Alternative investments
  alternativeInvestments: AlternativeInvestment[];
  
  // Liquidity analysis
  liquidityAnalysis: LiquidityAnalysis;
  
  // Asset class correlations
  assetClassCorrelations: AssetClassCorrelation[];
}

export interface MarketCapExposure {
  // Market cap allocations
  marketCapAllocations: MarketCapAllocation[];
  
  // Style analysis
  styleAnalysis: StyleAnalysis;
  
  // Size factor exposure
  sizeFactorExposure: SizeFactorExposure;
  
  // Growth vs value
  growthValueExposure: GrowthValueExposure;
  
  // Quality factor exposure
  qualityFactorExposure: QualityFactorExposure;
}

export interface CurrencyExposure {
  // Currency allocations
  currencyAllocations: CurrencyAllocation[];
  
  // Hedging analysis
  hedgingAnalysis: HedgingAnalysis;
  
  // Currency risk metrics
  currencyRiskMetrics: CurrencyRiskMetrics;
  
  // FX sensitivity analysis
  fxSensitivityAnalysis: FXSensitivityAnalysis;
}

export interface CorrelationAnalysis {
  // Correlation matrix
  correlationMatrix: CorrelationMatrix;
  
  // Rolling correlations
  rollingCorrelations: RollingCorrelation[];
  
  // Correlation breakdown
  correlationBreakdown: CorrelationBreakdown;
  
  // Correlation risk
  correlationRisk: CorrelationRisk;
  
  // Regime analysis
  regimeAnalysis: RegimeAnalysis;
}

export interface ComplianceAnalysis {
  // Regulatory compliance
  regulatoryCompliance: RegulatoryCompliance;
  
  // Investment restrictions
  investmentRestrictions: InvestmentRestriction[];
  
  // Concentration limits
  concentrationLimits: ConcentrationLimit[];
  
  // ESG compliance
  esgCompliance: ESGCompliance;
  
  // Audit trail
  auditTrail: AuditTrailItem[];
  
  // Compliance alerts
  complianceAlerts: ComplianceAlert[];
}

// State and Hook Types
export interface PortfolioExposureBreakdownState {
  breakdowns: Record<string, PortfolioExposureBreakdown>;
  currentBreakdownId: string | null;
  selectedPortfolioIds: string[];
  
  // Analysis state
  analysisResults: Record<string, ExposureAnalysis>;
  calculationProgress: Record<string, CalculationProgress>;
  
  // Cache
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
}

export interface UsePortfolioExposureBreakdownReturn {
  // Data
  breakdowns: PortfolioExposureBreakdown[];
  currentBreakdown: PortfolioExposureBreakdown | null;
  exposureAnalysis: ExposureAnalysis | null;
  
  // Loading states
  isLoading: boolean;
  isAnalyzing: boolean;
  calculationProgress: CalculationProgress | null;
  
  // Breakdown operations
  createBreakdown: (config: Omit<PortfolioExposureBreakdown, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<PortfolioExposureBreakdown>;
  updateBreakdown: (id: string, updates: Partial<PortfolioExposureBreakdown>) => Promise<PortfolioExposureBreakdown>;
  deleteBreakdown: (id: string) => Promise<void>;
  
  // Analysis operations
  analyzePortfolio: (breakdownId: string) => Promise<ExposureAnalysis>;
  refreshAnalysis: (breakdownId: string) => Promise<ExposureAnalysis>;
  comparePortfolios: (breakdownId1: string, breakdownId2: string) => Promise<ComparisonResult>;
  
  // Exposure calculations
  calculateSectorExposure: (breakdownId: string) => Promise<SectorExposure>;
  calculateGeographicExposure: (breakdownId: string) => Promise<GeographicExposure>;
  calculateRiskMetrics: (breakdownId: string) => Promise<RiskMetrics>;
  
  // Risk analysis
  performStressTesting: (breakdownId: string, scenarios: StressTestScenario[]) => Promise<StressTestResult[]>;
  calculateVaR: (breakdownId: string, confidence: number, horizon: number) => Promise<ValueAtRisk>;
  
  // Diversification analysis
  analyzeDiversification: (breakdownId: string) => Promise<DiversificationAnalysis>;
  optimizePortfolio: (breakdownId: string, constraints: OptimizationConstraints) => Promise<OptimizationResult>;
  
  // Reporting
  generateReport: (breakdownId: string, reportType: ReportType) => Promise<AnalysisReport>;
  exportAnalysis: (breakdownId: string, format: ExportFormat) => Promise<string>;
  
  // Utility functions
  setCurrentBreakdown: (breakdownId: string | null) => void;
  refreshData: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Enums and Union Types
export type UpdateFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on_demand';
export type ExposureDimension = 'sector' | 'geography' | 'asset_class' | 'market_cap' | 'currency' | 'factor' | 'style';
export type RiskMeasure = 'var' | 'expected_shortfall' | 'volatility' | 'beta' | 'tracking_error' | 'downside_deviation';
export type AnalysisType = 'exposure' | 'risk' | 'diversification' | 'concentration' | 'correlation' | 'compliance';
export type ReportType = 'summary' | 'detailed' | 'executive' | 'regulatory' | 'risk' | 'performance';
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'powerpoint';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'warning' | 'under_review';

// Supporting Types
export interface AnalysisScope {
  portfolioIds: string[];
  dateRange: DateRange;
  analysisTypes: AnalysisType[];
  exposureDimensions: ExposureDimension[];
  includeDerivatives: boolean;
  includeCash: boolean;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  frequency: string;
}

export interface CalculationMethods {
  exposureCalculation: ExposureCalculationMethod;
  riskCalculation: RiskCalculationMethod;
  correlationCalculation: CorrelationCalculationMethod;
  benchmarkComparison: BenchmarkComparisonMethod;
}

export interface ExposureCalculationMethod {
  method: 'market_value' | 'notional' | 'delta_adjusted' | 'risk_weighted';
  includeAccruedInterest: boolean;
  fxConversionMethod: 'spot' | 'forward' | 'hedged';
}

export interface RiskCalculationMethod {
  method: 'parametric' | 'historical' | 'monte_carlo' | 'hybrid';
  confidence: number;
  horizon: number;
  decayFactor: number;
}

export interface CorrelationCalculationMethod {
  method: 'pearson' | 'spearman' | 'kendall';
  window: number;
  minObservations: number;
}

export interface BenchmarkComparisonMethod {
  method: 'holdings_based' | 'returns_based' | 'factor_based';
  rebalanceFrequency: string;
}

export interface BenchmarkConfiguration {
  primaryBenchmark: BenchmarkInfo;
  secondaryBenchmarks: BenchmarkInfo[];
  customBenchmarks: CustomBenchmark[];
}

export interface BenchmarkInfo {
  benchmarkId: string;
  benchmarkName: string;
  benchmarkType: string;
  weight: number;
}

export interface CustomBenchmark {
  name: string;
  holdings: BenchmarkHolding[];
  rebalanceFrequency: string;
}

export interface BenchmarkHolding {
  symbol: string;
  weight: number;
  asOfDate: Date;
}

export interface RiskParameters {
  confidenceLevel: number;
  timeHorizon: number;
  riskFreeRate: number;
  marketPremium: number;
  liquidityAdjustment: number;
}

export interface ExposureThresholds {
  singlePositionLimit: number;
  sectorLimit: number;
  geographicLimit: number;
  currencyLimit: number;
  concentrationThreshold: number;
}

export interface RegulatorySettings {
  framework: string;
  reportingRequirements: ReportingRequirement[];
  investmentLimits: InvestmentLimit[];
  disclosureRequirements: DisclosureRequirement[];
}

export interface ReportingRequirement {
  requirementType: string;
  frequency: string;
  format: string;
  deadline: string;
}

export interface InvestmentLimit {
  limitType: string;
  category: string;
  limit: number;
  basis: string;
}

export interface DisclosureRequirement {
  requirementType: string;
  threshold: number;
  disclosureLevel: string;
}

export interface VisualizationConfiguration {
  chartTypes: ChartType[];
  colorScheme: ColorScheme;
  displayOptions: DisplayOptions;
  interactivityOptions: InteractivityOptions;
}

export interface ChartType {
  type: string;
  isEnabled: boolean;
  configuration: Record<string, any>;
}

export interface ColorScheme {
  primary: string[];
  secondary: string[];
  risk: string[];
  performance: string[];
}

export interface DisplayOptions {
  showLabels: boolean;
  showValues: boolean;
  showPercentages: boolean;
  decimalPlaces: number;
}

export interface InteractivityOptions {
  enableDrillDown: boolean;
  enableFiltering: boolean;
  enableComparison: boolean;
  enableExport: boolean;
}

export interface DataSourceConfig {
  sourceId: string;
  sourceType: string;
  isEnabled: boolean;
  priority: number;
  updateFrequency: string;
}

export interface SectorBreakdownItem {
  sectorId: string;
  sectorName: string;
  classification: string;
  allocation: number;
  marketValue: number;
  positionCount: number;
  averageWeight: number;
  riskContribution: number;
  performance: PerformanceMetrics;
}

export interface AssetClassBreakdownItem {
  assetClassId: string;
  assetClassName: string;
  allocation: number;
  marketValue: number;
  positionCount: number;
  liquidityScore: number;
  riskContribution: number;
  performance: PerformanceMetrics;
}

export interface GeographicBreakdownItem {
  countryId: string;
  countryName: string;
  region: string;
  allocation: number;
  marketValue: number;
  positionCount: number;
  currencyExposure: number;
  riskContribution: number;
  performance: PerformanceMetrics;
}

export interface MarketCapBreakdownItem {
  marketCapId: string;
  marketCapRange: string;
  allocation: number;
  marketValue: number;
  positionCount: number;
  averageMarketCap: number;
  riskContribution: number;
  performance: PerformanceMetrics;
}

export interface CurrencyBreakdownItem {
  currencyId: string;
  currencyCode: string;
  allocation: number;
  marketValue: number;
  hedgedAmount: number;
  unhedgedAmount: number;
  fxRisk: number;
  performance: PerformanceMetrics;
}

export interface RiskExposureItem {
  riskFactorId: string;
  riskFactorName: string;
  riskFactorType: string;
  exposure: number;
  contribution: number;
  volatility: number;
  beta: number;
}

export interface ConcentrationMetrics {
  herfindalIndex: number;
  concentrationRatio: number;
  effectiveNumberOfPositions: number;
  maxSinglePosition: number;
  topTenConcentration: number;
}

export interface QualityScores {
  dataQuality: number;
  calculationQuality: number;
  completeness: number;
  accuracy: number;
  timeliness: number;
  consistency: number;
}

export interface ValueAtRisk {
  var95: number;
  var99: number;
  var99_9: number;
  timeHorizon: number;
  confidence: number;
  methodology: string;
  componentVaR: ComponentVaR[];
}

export interface ComponentVaR {
  componentId: string;
  componentName: string;
  componentVaR: number;
  contribution: number;
  marginalVaR: number;
}

export interface ExpectedShortfall {
  es95: number;
  es99: number;
  timeHorizon: number;
  methodology: string;
}

export interface RiskContribution {
  assetId: string;
  assetName: string;
  weight: number;
  riskContribution: number;
  marginalRisk: number;
  componentRisk: number;
}

export interface MarginalRisk {
  assetId: string;
  assetName: string;
  marginalVaR: number;
  marginalVolatility: number;
  marginalBeta: number;
}

export interface StressTestResult {
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  portfolioImpact: number;
  positionImpacts: PositionImpact[];
  riskMetricChanges: RiskMetricChange[];
}

export interface PositionImpact {
  positionId: string;
  positionName: string;
  currentValue: number;
  stressedValue: number;
  impact: number;
  impactPercent: number;
}

export interface RiskMetricChange {
  metricName: string;
  currentValue: number;
  stressedValue: number;
  change: number;
  changePercent: number;
}

export interface RiskAdjustedReturns {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  informationRatio: number;
  treynorRatio: number;
}

export interface DiversificationScore {
  dimension: string;
  score: number;
  benchmark: number;
  percentile: number;
  rating: string;
}

export interface OptimizationSuggestion {
  suggestionType: string;
  description: string;
  expectedImpact: number;
  implementation: string;
  priority: number;
}

export interface DiversificationEfficiency {
  overallEfficiency: number;
  sectorEfficiency: number;
  geographicEfficiency: number;
  assetClassEfficiency: number;
  improvementOpportunities: string[];
}

export interface TopHolding {
  positionId: string;
  symbol: string;
  name: string;
  weight: number;
  marketValue: number;
  riskContribution: number;
  sector: string;
  geography: string;
}

export interface ConcentrationByDimension {
  dimension: string;
  concentrationIndex: number;
  topThreeConcentration: number;
  effectiveNumber: number;
  diversificationScore: number;
}

export interface RiskConcentrationItem {
  riskFactor: string;
  concentration: number;
  riskContribution: number;
  diversificationBenefit: number;
}

export interface ConcentrationTrend {
  date: Date;
  concentrationIndex: number;
  topTenConcentration: number;
  effectivePositions: number;
}

export interface ConcentrationAlert {
  alertType: string;
  severity: AlertSeverity;
  threshold: number;
  currentValue: number;
  description: string;
  recommendation: string;
}

export interface CountryExposure {
  countryCode: string;
  countryName: string;
  allocation: number;
  marketValue: number;
  riskRating: string;
  sovereignRisk: number;
  currencyRisk: number;
}

export interface RegionalExposure {
  regionId: string;
  regionName: string;
  allocation: number;
  marketValue: number;
  countryCount: number;
  riskMetrics: RegionalRiskMetrics;
}

export interface RegionalRiskMetrics {
  volatility: number;
  correlation: number;
  liquidity: number;
  politicalRisk: number;
}

export interface CurrencyEffect {
  currencyPair: string;
  exposure: number;
  hedgeRatio: number;
  fxReturn: number;
  contribution: number;
}

export interface GeographicRiskMetrics {
  concentrationRisk: number;
  correlationRisk: number;
  politicalRisk: number;
  liquidityRisk: number;
}

export interface HomeBiasAnalysis {
  homeBias: number;
  benchmarkWeight: number;
  actualWeight: number;
  overWeight: number;
  explanation: string;
}

export interface SectorAllocation {
  sectorId: string;
  sectorName: string;
  allocation: number;
  benchmarkAllocation: number;
  activeWeight: number;
  riskContribution: number;
}

export interface GICSExposure {
  level1: GICSLevel[];
  level2: GICSLevel[];
  level3: GICSLevel[];
  level4: GICSLevel[];
}

export interface GICSLevel {
  gicsId: string;
  gicsName: string;
  allocation: number;
  positionCount: number;
}

export interface SectorRotationAnalysis {
  momentum: SectorMomentum[];
  valuations: SectorValuation[];
  cyclicalPosition: CyclicalPosition[];
  rotationSignals: RotationSignal[];
}

export interface SectorRiskMetrics {
  sectorId: string;
  volatility: number;
  beta: number;
  correlation: number;
  var: number;
}

export interface SectorMomentum {
  sectorId: string;
  momentum1M: number;
  momentum3M: number;
  momentum6M: number;
  momentum1Y: number;
  momentumRank: number;
}

export interface SectorValuation {
  sectorId: string;
  peRatio: number;
  pbRatio: number;
  psRatio: number;
  evEbitda: number;
  valuationRank: number;
}

export interface CyclicalPosition {
  sectorId: string;
  cyclicalStage: string;
  cyclePosition: number;
  expectedDirection: string;
}

export interface RotationSignal {
  fromSector: string;
  toSector: string;
  signalStrength: number;
  rationale: string;
}

export interface AssetClassAllocation {
  assetClassId: string;
  assetClassName: string;
  allocation: number;
  targetAllocation: number;
  deviation: number;
  riskContribution: number;
}

export interface StrategicAllocation {
  assetClassId: string;
  strategicWeight: number;
  currentWeight: number;
  allowedRange: AllowedRange;
  rebalanceSignal: string;
}

export interface AllowedRange {
  minimum: number;
  target: number;
  maximum: number;
}

export interface AllocationDrift {
  assetClassId: string;
  drift: number;
  driftPercent: number;
  timeToRebalance: number;
  rebalanceCost: number;
}

export interface AlternativeInvestment {
  investmentId: string;
  investmentType: string;
  allocation: number;
  liquidityTier: number;
  lockupPeriod: number;
  valuationFrequency: string;
}

export interface LiquidityAnalysis {
  liquidityScore: number;
  liquidityTiers: LiquidityTier[];
  liquidationTimeframe: LiquidationTimeframe;
  liquidityCost: LiquidityCost;
}

export interface LiquidityTier {
  tier: number;
  description: string;
  allocation: number;
  liquidationTime: number;
}

export interface LiquidationTimeframe {
  immediate: number;
  oneDay: number;
  oneWeek: number;
  oneMonth: number;
  longerTerm: number;
}

export interface LiquidityCost {
  bidAskSpread: number;
  marketImpact: number;
  totalCost: number;
  costByTier: Record<number, number>;
}

export interface AssetClassCorrelation {
  assetClass1: string;
  assetClass2: string;
  correlation: number;
  rollingCorrelation: RollingCorrelationData[];
}

export interface RollingCorrelationData {
  date: Date;
  correlation: number;
}

export interface MarketCapAllocation {
  marketCapId: string;
  marketCapRange: string;
  allocation: number;
  benchmarkAllocation: number;
  activeWeight: number;
  riskContribution: number;
}

export interface StyleAnalysis {
  growthValue: GrowthValueAnalysis;
  sizeStyle: SizeStyleAnalysis;
  qualityStyle: QualityStyleAnalysis;
  momentumStyle: MomentumStyleAnalysis;
}

export interface GrowthValueAnalysis {
  growthAllocation: number;
  valueAllocation: number;
  blendAllocation: number;
  styleScore: number;
  styleDrift: number;
}

export interface SizeStyleAnalysis {
  largeCapAllocation: number;
  midCapAllocation: number;
  smallCapAllocation: number;
  sizeScore: number;
  sizeDrift: number;
}

export interface QualityStyleAnalysis {
  highQualityAllocation: number;
  mediumQualityAllocation: number;
  lowQualityAllocation: number;
  qualityScore: number;
  qualityDrift: number;
}

export interface MomentumStyleAnalysis {
  highMomentumAllocation: number;
  mediumMomentumAllocation: number;
  lowMomentumAllocation: number;
  momentumScore: number;
  momentumDrift: number;
}

export interface SizeFactorExposure {
  factorLoading: number;
  factorReturn: number;
  factorRisk: number;
  factorContribution: number;
}

export interface GrowthValueExposure {
  growthLoading: number;
  valueLoading: number;
  styleBalance: number;
  styleTilt: string;
}

export interface QualityFactorExposure {
  qualityLoading: number;
  qualityPremium: number;
  qualityRisk: number;
  qualityContribution: number;
}

export interface CurrencyAllocation {
  currencyCode: string;
  exposure: number;
  hedgedExposure: number;
  unhedgedExposure: number;
  hedgeRatio: number;
  fxRisk: number;
}

export interface HedgingAnalysis {
  overallHedgeRatio: number;
  hedgingEffectiveness: number;
  hedgingCost: number;
  currencyHedges: CurrencyHedge[];
  hedgingRecommendations: HedgingRecommendation[];
}

export interface CurrencyHedge {
  currencyPair: string;
  hedgeAmount: number;
  hedgeRatio: number;
  hedgeType: string;
  maturity: Date;
  cost: number;
}

export interface HedgingRecommendation {
  currencyPair: string;
  recommendedAction: string;
  rationale: string;
  expectedBenefit: number;
}

export interface CurrencyRiskMetrics {
  fxVar: number;
  fxVolatility: number;
  currencyBeta: number;
  fxContribution: number;
}

export interface FXSensitivityAnalysis {
  sensitivities: FXSensitivity[];
  scenarioAnalysis: FXScenario[];
}

export interface FXSensitivity {
  currencyPair: string;
  sensitivity: number;
  impact1Percent: number;
  impact5Percent: number;
}

export interface FXScenario {
  scenarioName: string;
  currencyMoves: CurrencyMove[];
  portfolioImpact: number;
}

export interface CurrencyMove {
  currencyPair: string;
  move: number;
  probability: number;
}

export interface CorrelationMatrix {
  assets: string[];
  correlations: number[][];
  averageCorrelation: number;
  minCorrelation: number;
  maxCorrelation: number;
}

export interface RollingCorrelation {
  date: Date;
  asset1: string;
  asset2: string;
  correlation: number;
  window: number;
}

export interface CorrelationBreakdown {
  withinSector: number;
  acrossSector: number;
  withinRegion: number;
  acrossRegion: number;
  withinAssetClass: number;
  acrossAssetClass: number;
}

export interface CorrelationRisk {
  correlationVaR: number;
  correlationContribution: number;
  diversificationBenefit: number;
  concentrationRisk: number;
}

export interface RegimeAnalysis {
  currentRegime: string;
  regimeProbabilities: RegimeProbability[];
  correlationByRegime: CorrelationByRegime[];
}

export interface RegimeProbability {
  regime: string;
  probability: number;
  duration: number;
  characteristics: string[];
}

export interface CorrelationByRegime {
  regime: string;
  averageCorrelation: number;
  correlationRange: CorrelationRange;
}

export interface CorrelationRange {
  minimum: number;
  maximum: number;
  volatility: number;
}

export interface RegulatoryCompliance {
  framework: string;
  complianceStatus: ComplianceStatus;
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
}

export interface ComplianceViolation {
  violationType: string;
  description: string;
  severity: string;
  currentValue: number;
  limit: number;
  remediation: string;
}

export interface ComplianceRecommendation {
  recommendationType: string;
  description: string;
  priority: number;
  timeline: string;
}

export interface InvestmentRestriction {
  restrictionType: string;
  category: string;
  limit: number;
  currentExposure: number;
  compliance: boolean;
}

export interface ConcentrationLimit {
  limitType: string;
  limit: number;
  currentValue: number;
  utilizationRate: number;
  timeToLimit: number;
}

export interface ESGCompliance {
  esgScore: number;
  esgRating: string;
  exclusions: ESGExclusion[];
  esgMetrics: ESGMetrics;
}

export interface ESGExclusion {
  exclusionType: string;
  description: string;
  affectedPositions: string[];
}

export interface ESGMetrics {
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  controversyScore: number;
}

export interface AuditTrailItem {
  timestamp: Date;
  action: string;
  details: string;
  userId: string;
  impact: string;
}

export interface ComplianceAlert {
  alertType: string;
  severity: AlertSeverity;
  description: string;
  threshold: number;
  currentValue: number;
  timeToViolation: number;
}

export interface CalculationProgress {
  stage: string;
  progress: number;
  estimatedTimeRemaining: number;
  currentOperation: string;
}

export interface ComparisonResult {
  portfolio1: string;
  portfolio2: string;
  differences: ExposureDifference[];
  similarities: ExposureSimilarity[];
  recommendations: string[];
}

export interface ExposureDifference {
  dimension: string;
  category: string;
  portfolio1Value: number;
  portfolio2Value: number;
  difference: number;
  significance: string;
}

export interface ExposureSimilarity {
  dimension: string;
  similarity: number;
  correlation: number;
  description: string;
}

export interface StressTestScenario {
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  parameters: Record<string, number>;
  probability: number;
}

export interface OptimizationConstraints {
  positionLimits: PositionLimit[];
  sectorLimits: SectorLimit[];
  regionLimits: RegionLimit[];
  turnoverLimit: number;
  trackingErrorLimit: number;
}

export interface PositionLimit {
  symbol: string;
  minWeight: number;
  maxWeight: number;
}

export interface SectorLimit {
  sectorId: string;
  minWeight: number;
  maxWeight: number;
}

export interface RegionLimit {
  regionId: string;
  minWeight: number;
  maxWeight: number;
}

export interface OptimizationResult {
  optimizedWeights: OptimizedWeight[];
  expectedReturn: number;
  expectedRisk: number;
  trackingError: number;
  turnover: number;
  improvementMetrics: ImprovementMetrics;
}

export interface OptimizedWeight {
  symbol: string;
  currentWeight: number;
  optimizedWeight: number;
  change: number;
}

export interface ImprovementMetrics {
  riskReduction: number;
  returnImprovement: number;
  sharpeImprovement: number;
  diversificationImprovement: number;
}

export interface AnalysisReport {
  reportId: string;
  reportType: ReportType;
  generatedAt: Date;
  summary: ReportSummary;
  sections: ReportSection[];
  charts: ChartDefinition[];
  recommendations: string[];
}

export interface ReportSummary {
  portfolioValue: number;
  positionCount: number;
  riskLevel: string;
  diversificationScore: number;
  complianceStatus: string;
  keyFindings: string[];
}

export interface ReportSection {
  sectionId: string;
  title: string;
  content: string;
  charts: string[];
  tables: TableDefinition[];
}

export interface ChartDefinition {
  chartId: string;
  chartType: string;
  title: string;
  data: any;
  configuration: any;
}

export interface TableDefinition {
  tableId: string;
  title: string;
  headers: string[];
  rows: any[][];
  formatting: TableFormatting;
}

export interface TableFormatting {
  decimalPlaces: number;
  percentColumns: number[];
  currencyColumns: number[];
  highlightRules: HighlightRule[];
}

export interface HighlightRule {
  column: number;
  condition: string;
  value: number;
  style: string;
}

export interface ExposureRecommendation {
  recommendationId: string;
  type: string;
  category: string;
  description: string;
  rationale: string;
  priority: number;
  expectedImpact: string;
  implementation: string;
  timeframe: string;
}

export interface ExposureAlertConfig {
  alertsEnabled: boolean;
  thresholdAlerts: ThresholdAlert[];
  trendAlerts: TrendAlert[];
  complianceAlerts: boolean;
  notificationSettings: NotificationSettings;
}

export interface ThresholdAlert {
  metric: string;
  threshold: number;
  condition: 'above' | 'below';
  severity: AlertSeverity;
  enabled: boolean;
}

export interface TrendAlert {
  metric: string;
  trendDirection: 'increasing' | 'decreasing';
  duration: number;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  slack: boolean;
  webhook: boolean;
  webhookUrl?: string;
}

export interface PerformanceMetrics {
  return1D: number;
  return1W: number;
  return1M: number;
  return3M: number;
  return1Y: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export default PortfolioExposureBreakdown; 