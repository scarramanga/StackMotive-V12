// Block 94: Trust Score Badge - Types
// Trust Score Metrics and Badge Visualization

export interface TrustScoreBadge {
  id: string;
  userId: string;
  
  // Badge identification
  badgeType: BadgeType;
  entityId: string; // Portfolio, asset, strategy, etc.
  entityType: EntityType;
  
  // Trust score
  trustScore: TrustScore;
  
  // Historical data
  scoreHistory: TrustScoreHistory[];
  
  // Badge configuration
  badgeConfig: BadgeConfig;
  
  // Display settings
  displaySettings: DisplaySettings;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastCalculated: Date;
}

export interface TrustScore {
  // Overall score
  overallScore: number; // 0-100
  scoreGrade: ScoreGrade;
  
  // Component scores
  componentScores: ComponentScore[];
  
  // Confidence metrics
  confidence: ConfidenceMetrics;
  
  // Performance metrics
  performance: PerformanceMetrics;
  
  // Risk assessment
  riskAssessment: RiskAssessment;
  
  // Consistency metrics
  consistency: ConsistencyMetrics;
  
  // Transparency metrics
  transparency: TransparencyMetrics;
  
  // Market validation
  marketValidation: MarketValidation;
  
  // Time-based metrics
  timeBasedMetrics: TimeBasedMetrics;
  
  // Calculation metadata
  calculationInfo: CalculationInfo;
}

export interface ComponentScore {
  componentId: string;
  componentName: string;
  componentType: ComponentType;
  
  // Score details
  score: number; // 0-100
  weight: number; // 0-1
  contribution: number; // Weighted contribution to overall
  
  // Sub-components
  subComponents: SubComponent[];
  
  // Trend analysis
  trend: ScoreTrend;
  
  // Quality indicators
  quality: QualityIndicator;
  
  // Calculation details
  calculationMethod: string;
  dataPoints: number;
  confidence: number;
  
  // Historical comparison
  historicalComparison: HistoricalComparison;
}

export interface SubComponent {
  subComponentId: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  
  // Data source
  dataSource: DataSource;
  
  // Validation
  validation: ValidationInfo;
}

export interface ConfidenceMetrics {
  // Overall confidence
  overallConfidence: number; // 0-100
  
  // Data quality confidence
  dataQualityScore: number;
  sampleSizeScore: number;
  timeRangeScore: number;
  
  // Model confidence
  modelAccuracy: number;
  backtestingScore: number;
  crossValidationScore: number;
  
  // Market confidence
  marketValidationScore: number;
  benchmarkComparison: number;
  
  // Stability metrics
  scoreStability: number;
  volatilityAdjusted: number;
  
  // Confidence intervals
  confidenceIntervals: ConfidenceInterval[];
  
  // Uncertainty sources
  uncertaintySources: UncertaintySource[];
}

export interface PerformanceMetrics {
  // Returns
  returns: ReturnMetrics;
  
  // Risk-adjusted metrics
  riskAdjusted: RiskAdjustedMetrics;
  
  // Benchmark comparison
  benchmarkComparison: BenchmarkComparison;
  
  // Consistency metrics
  consistencyScore: number;
  
  // Predictability
  predictabilityScore: number;
  
  // Drawdown analysis
  drawdownAnalysis: DrawdownAnalysis;
  
  // Performance attribution
  performanceAttribution: PerformanceAttribution;
}

export interface RiskAssessment {
  // Overall risk score
  overallRiskScore: number; // 0-100, lower is better
  riskGrade: RiskGrade;
  
  // Risk components
  marketRisk: number;
  creditRisk: number;
  liquidityRisk: number;
  concentrationRisk: number;
  operationalRisk: number;
  
  // Volatility metrics
  volatilityMetrics: VolatilityMetrics;
  
  // Tail risk
  tailRisk: TailRisk;
  
  // Risk-adjusted scores
  riskAdjustedScores: RiskAdjustedScores;
  
  // Stress testing
  stressTestResults: StressTestResult[];
  
  // Risk management
  riskManagementScore: number;
}

export interface ConsistencyMetrics {
  // Performance consistency
  performanceConsistency: number; // 0-100
  
  // Strategy consistency
  strategyConsistency: number;
  
  // Risk consistency
  riskConsistency: number;
  
  // Time-based consistency
  monthlyConsistency: number;
  quarterlyConsistency: number;
  yearlyConsistency: number;
  
  // Pattern analysis
  patternConsistency: PatternConsistency;
  
  // Deviation metrics
  deviationMetrics: DeviationMetrics;
  
  // Predictability
  predictabilityMetrics: PredictabilityMetrics;
}

export interface TransparencyMetrics {
  // Disclosure score
  disclosureScore: number; // 0-100
  
  // Reporting quality
  reportingQuality: ReportingQuality;
  
  // Data availability
  dataAvailability: DataAvailability;
  
  // Methodology transparency
  methodologyTransparency: number;
  
  // Holdings transparency
  holdingsTransparency: number;
  
  // Fee transparency
  feeTransparency: number;
  
  // Communication quality
  communicationQuality: CommunicationQuality;
  
  // Regulatory compliance
  regulatoryCompliance: RegulatoryCompliance;
}

export interface MarketValidation {
  // Market acceptance
  marketAcceptance: number; // 0-100
  
  // Peer comparison
  peerComparison: PeerComparison;
  
  // Third-party ratings
  thirdPartyRatings: ThirdPartyRating[];
  
  // Market indicators
  marketIndicators: MarketIndicator[];
  
  // Institutional adoption
  institutionalAdoption: number;
  
  // Liquidity indicators
  liquidityIndicators: LiquidityIndicator[];
  
  // Market sentiment
  marketSentiment: MarketSentiment;
}

export interface TimeBasedMetrics {
  // Short-term metrics (1-3 months)
  shortTerm: TimePeriodMetrics;
  
  // Medium-term metrics (3-12 months)
  mediumTerm: TimePeriodMetrics;
  
  // Long-term metrics (1+ years)
  longTerm: TimePeriodMetrics;
  
  // Trend analysis
  trendAnalysis: TrendAnalysis;
  
  // Seasonality
  seasonality: SeasonalityMetrics;
  
  // Cycle analysis
  cycleAnalysis: CycleAnalysis;
}

export interface TrustScoreHistory {
  id: string;
  
  // Score snapshot
  score: number;
  grade: ScoreGrade;
  
  // Component breakdown
  componentBreakdown: Record<string, number>;
  
  // Metadata
  calculationDate: Date;
  dataAsOfDate: Date;
  calculationVersion: string;
  
  // Changes from previous
  changeFromPrevious: ScoreChange;
  
  // Events and context
  contextualEvents: ContextualEvent[];
  
  // Quality indicators
  qualityScore: number;
  confidence: number;
}

export interface BadgeConfig {
  // Visual configuration
  visualConfig: VisualConfig;
  
  // Calculation settings
  calculationSettings: CalculationSettings;
  
  // Update frequency
  updateFrequency: UpdateFrequency;
  
  // Thresholds
  scoreThresholds: ScoreThreshold[];
  
  // Alerts
  alertSettings: AlertSettings;
  
  // Customization
  customization: BadgeCustomization;
}

export interface DisplaySettings {
  // Badge appearance
  badgeAppearance: BadgeAppearance;
  
  // Information display
  informationDisplay: InformationDisplay;
  
  // Interactive elements
  interactiveElements: InteractiveElement[];
  
  // Animation settings
  animationSettings: AnimationSettings;
  
  // Responsive design
  responsiveSettings: ResponsiveSettings;
  
  // Accessibility
  accessibilitySettings: AccessibilitySettings;
}

export interface CalculationInfo {
  // Calculation metadata
  calculationId: string;
  calculationTimestamp: Date;
  calculationVersion: string;
  
  // Data used
  dataRange: DateRange;
  dataPoints: number;
  dataSources: string[];
  
  // Methodology
  methodology: CalculationMethodology;
  
  // Quality checks
  qualityChecks: QualityCheck[];
  
  // Performance
  calculationTime: number; // milliseconds
  
  // Validation
  validationResults: ValidationResult[];
}

// State and Hook Types
export interface TrustScoreBadgeState {
  badges: Record<string, TrustScoreBadge>;
  currentBadgeId: string | null;
  badgesByEntity: Record<string, string[]>; // entityId -> badgeIds
  calculationQueue: string[];
  selectedBadgeIds: string[];
  
  // Cache
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
}

export interface UseTrustScoreBadgeReturn {
  // Data
  badges: TrustScoreBadge[];
  currentBadge: TrustScoreBadge | null;
  
  // Loading states
  isLoading: boolean;
  isCalculating: boolean;
  
  // Badge operations
  createBadge: (config: Omit<TrustScoreBadge, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<TrustScoreBadge>;
  updateBadge: (id: string, updates: Partial<TrustScoreBadge>) => Promise<TrustScoreBadge>;
  deleteBadge: (id: string) => Promise<void>;
  
  // Score operations
  calculateScore: (badgeId: string) => Promise<TrustScore>;
  recalculateScore: (badgeId: string, forceRefresh?: boolean) => Promise<TrustScore>;
  
  // Analysis operations
  analyzeScoreComponents: (badgeId: string) => Promise<ComponentAnalysis>;
  compareScores: (badgeId1: string, badgeId2: string) => Promise<ScoreComparison>;
  getScoreInsights: (badgeId: string) => Promise<ScoreInsight[]>;
  
  // Historical operations
  getScoreHistory: (badgeId: string, timeRange?: TimeRange) => Promise<TrustScoreHistory[]>;
  getScoreTrends: (badgeId: string) => Promise<ScoreTrend>;
  
  // Utility functions
  setCurrentBadge: (badgeId: string | null) => void;
  refreshData: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Enums and Union Types
export type BadgeType = 'portfolio' | 'asset' | 'strategy' | 'manager' | 'fund' | 'advisor' | 'platform';
export type EntityType = 'portfolio' | 'security' | 'strategy' | 'fund_manager' | 'investment_fund' | 'robo_advisor' | 'trading_platform';
export type ScoreGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';
export type RiskGrade = 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
export type ComponentType = 'performance' | 'risk' | 'consistency' | 'transparency' | 'market_validation' | 'fees' | 'service_quality';
export type UpdateFrequency = 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

// Supporting Types
export interface DataSource {
  sourceId: string;
  sourceName: string;
  sourceType: 'internal' | 'external' | 'market_data' | 'regulatory';
  reliability: number; // 0-100
  lastUpdated: Date;
}

export interface ValidationInfo {
  isValidated: boolean;
  validationScore: number;
  validationMethod: string;
  validatedAt: Date;
  validationErrors: string[];
}

export interface ConfidenceInterval {
  level: number; // e.g., 95 for 95%
  lowerBound: number;
  upperBound: number;
}

export interface UncertaintySource {
  source: string;
  impact: number; // 0-100
  description: string;
}

export interface ReturnMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatilityAdjustedReturn: number;
  consistentPerformance: number;
  outperformanceFrequency: number;
}

export interface RiskAdjustedMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  treynorRatio: number;
  informationRatio: number;
  jensenAlpha: number;
}

export interface BenchmarkComparison {
  benchmarkName: string;
  outperformance: number;
  trackingError: number;
  upCaptureRatio: number;
  downCaptureRatio: number;
  beta: number;
}

export interface DrawdownAnalysis {
  maxDrawdown: number;
  averageDrawdown: number;
  recoveryTime: number;
  drawdownFrequency: number;
  currentDrawdown: number;
}

export interface PerformanceAttribution {
  assetAllocation: number;
  securitySelection: number;
  timingEffect: number;
  currencyEffect: number;
  interactionEffect: number;
}

export interface VolatilityMetrics {
  totalVolatility: number;
  systematicRisk: number;
  specificRisk: number;
  downSideVolatility: number;
}

export interface TailRisk {
  valueAtRisk95: number;
  valueAtRisk99: number;
  conditionalVaR95: number;
  conditionalVaR99: number;
  tailRatio: number;
}

export interface RiskAdjustedScores {
  volatilityAdjusted: number;
  downsideRiskAdjusted: number;
  tailRiskAdjusted: number;
  stressTestAdjusted: number;
}

export interface StressTestResult {
  scenarioName: string;
  loss: number;
  probability: number;
  impact: 'low' | 'medium' | 'high';
}

export interface PatternConsistency {
  trendConsistency: number;
  cyclicalConsistency: number;
  seasonalConsistency: number;
}

export interface DeviationMetrics {
  standardDeviation: number;
  meanAbsoluteDeviation: number;
  relativeDeviation: number;
}

export interface PredictabilityMetrics {
  forecastAccuracy: number;
  patternRecognition: number;
  behaviorPredictability: number;
}

export interface ReportingQuality {
  frequency: number;
  timeliness: number;
  accuracy: number;
  completeness: number;
  clarity: number;
}

export interface DataAvailability {
  historicalDepth: number;
  updateFrequency: number;
  granularity: number;
  coverage: number;
}

export interface CommunicationQuality {
  clarityScore: number;
  responsivenessScore: number;
  proactiveScore: number;
  educationalValue: number;
}

export interface RegulatoryCompliance {
  complianceScore: number;
  disclosureCompliance: number;
  reportingCompliance: number;
  auditCompliance: number;
}

export interface PeerComparison {
  peerGroup: string;
  percentileRank: number;
  relativPerformance: number;
  peerCount: number;
}

export interface ThirdPartyRating {
  ratingAgency: string;
  rating: string;
  score: number;
  ratingDate: Date;
}

export interface MarketIndicator {
  indicatorName: string;
  value: number;
  trend: 'positive' | 'negative' | 'neutral';
  significance: 'high' | 'medium' | 'low';
}

export interface LiquidityIndicator {
  bidAskSpread: number;
  tradingVolume: number;
  marketDepth: number;
  liquidityScore: number;
}

export interface MarketSentiment {
  overallSentiment: number;
  institutionalSentiment: number;
  retailSentiment: number;
  analystSentiment: number;
}

export interface TimePeriodMetrics {
  performance: number;
  consistency: number;
  riskLevel: number;
  confidence: number;
}

export interface TrendAnalysis {
  overallTrend: 'improving' | 'stable' | 'declining';
  trendStrength: number;
  trendDuration: number;
  trendConfidence: number;
}

export interface SeasonalityMetrics {
  seasonalPattern: boolean;
  seasonalStrength: number;
  bestPeriods: string[];
  worstPeriods: string[];
}

export interface CycleAnalysis {
  cyclicalPattern: boolean;
  cycleLength: number;
  currentPhase: string;
  cycleStrength: number;
}

export interface ScoreChange {
  absoluteChange: number;
  percentageChange: number;
  changeDirection: 'up' | 'down' | 'stable';
  significantChange: boolean;
}

export interface ContextualEvent {
  eventId: string;
  eventType: string;
  eventDate: Date;
  impact: number;
  description: string;
}

export interface VisualConfig {
  style: 'minimal' | 'detailed' | 'comprehensive';
  colorScheme: string;
  badgeSize: 'small' | 'medium' | 'large';
  showGrade: boolean;
  showTrend: boolean;
  showConfidence: boolean;
}

export interface CalculationSettings {
  lookbackPeriod: number; // days
  minimumDataPoints: number;
  weightingScheme: string;
  adjustmentFactors: Record<string, number>;
}

export interface ScoreThreshold {
  grade: ScoreGrade;
  minScore: number;
  maxScore: number;
  color: string;
  description: string;
}

export interface AlertSettings {
  enableAlerts: boolean;
  scoreChangeThreshold: number;
  gradeChangeAlert: boolean;
  confidenceThreshold: number;
}

export interface BadgeCustomization {
  customColors: Record<string, string>;
  customLabels: Record<string, string>;
  customMetrics: CustomMetric[];
  displayFormat: string;
}

export interface CustomMetric {
  metricId: string;
  metricName: string;
  calculation: string;
  weight: number;
  enabled: boolean;
}

export interface BadgeAppearance {
  theme: 'light' | 'dark' | 'auto';
  borderStyle: string;
  shadowStyle: string;
  backgroundStyle: string;
}

export interface InformationDisplay {
  showDetailsOnHover: boolean;
  showHistoryChart: boolean;
  showComponentBreakdown: boolean;
  compactMode: boolean;
}

export interface InteractiveElement {
  elementType: string;
  action: string;
  target: string;
  enabled: boolean;
}

export interface AnimationSettings {
  enableAnimations: boolean;
  transitionDuration: number;
  animationType: string;
}

export interface ResponsiveSettings {
  breakpoints: Record<string, number>;
  adaptiveLayout: boolean;
  mobileOptimized: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  alternativeText: boolean;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CalculationMethodology {
  algorithm: string;
  version: string;
  parameters: Record<string, any>;
  dataProcessing: string[];
}

export interface QualityCheck {
  checkName: string;
  passed: boolean;
  score: number;
  details: string;
}

export interface ValidationResult {
  validationType: string;
  passed: boolean;
  confidence: number;
  details: string;
}

// Additional Analysis Types
export interface ComponentAnalysis {
  componentScores: ComponentScore[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  improvementPotential: number;
}

export interface ScoreComparison {
  badge1: TrustScoreBadge;
  badge2: TrustScoreBadge;
  scoreDifference: number;
  componentComparison: Record<string, number>;
  relativeStrengths: string[];
  analysis: string;
}

export interface ScoreInsight {
  insightId: string;
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  title: string;
  description: string;
  impact: number;
  actionable: boolean;
  recommendation?: string;
}

export interface ScoreTrend {
  direction: 'improving' | 'stable' | 'declining';
  strength: number;
  duration: number;
  projectedScore: number;
  confidence: number;
}

export interface TimeRange {
  period: '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'ALL';
  startDate?: Date;
  endDate?: Date;
}

export interface QualityIndicator {
  dataQuality: number;
  calculationQuality: number;
  validationQuality: number;
  overallQuality: number;
}

export interface HistoricalComparison {
  oneMonthAgo: number;
  threeMonthsAgo: number;
  oneYearAgo: number;
  allTimeHigh: number;
  allTimeLow: number;
}

export default TrustScoreBadge; 