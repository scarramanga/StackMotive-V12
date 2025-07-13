// Block 35: AI Override Explainer - Types
// TypeScript interfaces for AI decision explanation and manual overrides

export interface AIOverrideExplainer {
  id: string;
  decisionId: string;
  userId: string;
  
  // AI Decision Context
  aiDecision: AIDecision;
  
  // Override Details
  override: OverrideDetails;
  
  // Explanation
  explanation: ExplanationData;
  
  // Validation
  validation: OverrideValidation;
  
  // Status
  status: OverrideStatus;
  
  // Timestamps
  createdAt: Date;
  appliedAt?: Date;
  expiresAt?: Date;
  
  // Metadata
  metadata: OverrideMetadata;
}

export interface AIDecision {
  id: string;
  type: DecisionType;
  category: DecisionCategory;
  
  // Decision Details
  decision: DecisionDetails;
  
  // AI Analysis
  analysis: AIAnalysis;
  
  // Confidence and Risk
  confidence: number;
  riskScore: number;
  
  // Context
  context: DecisionContext;
  
  // Model Information
  model: ModelInfo;
  
  // Supporting Data
  supportingData: SupportingData;
  
  // Alternatives
  alternatives: AlternativeDecision[];
}

export interface DecisionDetails {
  action: string;
  target: string;
  parameters: Record<string, any>;
  
  // Quantitative details
  amount?: number;
  percentage?: number;
  duration?: number;
  
  // Qualitative details
  reasoning: string;
  rationale: string[];
  assumptions: string[];
}

export interface AIAnalysis {
  // Primary factors
  primaryFactors: AnalysisFactor[];
  
  // Secondary factors
  secondaryFactors: AnalysisFactor[];
  
  // Market conditions
  marketConditions: MarketCondition[];
  
  // Risk assessment
  riskAssessment: RiskAssessment;
  
  // Performance projection
  performanceProjection: PerformanceProjection;
  
  // Sensitivity analysis
  sensitivityAnalysis: SensitivityAnalysis;
}

export interface AnalysisFactor {
  name: string;
  value: number;
  weight: number;
  impact: FactorImpact;
  confidence: number;
  source: string;
  description: string;
}

export interface MarketCondition {
  condition: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  volatility: number;
  relevance: number;
}

export interface RiskAssessment {
  overallRisk: number;
  riskFactors: RiskFactor[];
  mitigations: RiskMitigation[];
  scenarios: RiskScenario[];
}

export interface RiskFactor {
  factor: string;
  probability: number;
  impact: number;
  severity: RiskSeverity;
  description: string;
}

export interface RiskMitigation {
  risk: string;
  mitigation: string;
  effectiveness: number;
  cost: number;
}

export interface RiskScenario {
  scenario: string;
  probability: number;
  impact: number;
  description: string;
}

export interface PerformanceProjection {
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  
  // Time horizons
  shortTerm: ProjectionDetails;
  mediumTerm: ProjectionDetails;
  longTerm: ProjectionDetails;
  
  // Confidence intervals
  confidenceIntervals: ConfidenceInterval[];
}

export interface ProjectionDetails {
  timeframe: string;
  expectedReturn: number;
  volatility: number;
  probability: number;
}

export interface ConfidenceInterval {
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

export interface SensitivityAnalysis {
  parameters: ParameterSensitivity[];
  correlations: CorrelationAnalysis[];
  stressTests: StressTestResult[];
}

export interface ParameterSensitivity {
  parameter: string;
  sensitivity: number;
  impact: number;
  range: { min: number; max: number };
}

export interface CorrelationAnalysis {
  variable1: string;
  variable2: string;
  correlation: number;
  significance: number;
}

export interface StressTestResult {
  test: string;
  impact: number;
  likelihood: number;
  description: string;
}

export interface DecisionContext {
  // Portfolio context
  portfolio: PortfolioContext;
  
  // Market context
  market: MarketContext;
  
  // User context
  user: UserContext;
  
  // Regulatory context
  regulatory: RegulatoryContext;
  
  // Temporal context
  temporal: TemporalContext;
}

export interface PortfolioContext {
  totalValue: number;
  allocation: AllocationSummary[];
  riskProfile: string;
  objectives: string[];
  constraints: string[];
}

export interface AllocationSummary {
  assetClass: string;
  currentWeight: number;
  targetWeight: number;
  deviation: number;
}

export interface MarketContext {
  regime: string;
  volatility: number;
  trend: string;
  cycle: string;
  indicators: MarketIndicator[];
}

export interface MarketIndicator {
  name: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number;
}

export interface UserContext {
  riskTolerance: string;
  timeHorizon: string;
  preferences: UserPreference[];
  constraints: UserConstraint[];
}

export interface UserPreference {
  type: string;
  value: any;
  weight: number;
}

export interface UserConstraint {
  type: string;
  constraint: string;
  flexibility: number;
}

export interface RegulatoryContext {
  jurisdiction: string;
  regulations: string[];
  compliance: ComplianceStatus[];
  restrictions: string[];
}

export interface ComplianceStatus {
  regulation: string;
  status: 'compliant' | 'warning' | 'violation';
  details: string;
}

export interface TemporalContext {
  timestamp: Date;
  timeOfDay: string;
  dayOfWeek: string;
  marketSession: string;
  seasonality: string;
}

export interface ModelInfo {
  name: string;
  version: string;
  type: ModelType;
  architecture: string;
  
  // Training info
  trainingData: TrainingDataInfo;
  lastTrained: Date;
  performance: ModelPerformance;
  
  // Capabilities
  capabilities: string[];
  limitations: string[];
  
  // Explainability
  explainability: ExplainabilityInfo;
}

export interface TrainingDataInfo {
  datasetSize: number;
  timeRange: { start: Date; end: Date };
  features: string[];
  quality: number;
  biases: string[];
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  calibration: number;
}

export interface ExplainabilityInfo {
  methods: string[];
  globalExplainability: number;
  localExplainability: number;
  featureImportance: FeatureImportance[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  type: 'global' | 'local';
}

export interface SupportingData {
  // Historical data
  historicalAnalysis: HistoricalAnalysis;
  
  // Comparative analysis
  peerComparison: PeerComparison;
  
  // Technical indicators
  technicalIndicators: TechnicalIndicator[];
  
  // Fundamental data
  fundamentalData: FundamentalData;
  
  // Alternative data
  alternativeData: AlternativeData[];
}

export interface HistoricalAnalysis {
  timeframe: string;
  patterns: Pattern[];
  correlations: HistoricalCorrelation[];
  performance: HistoricalPerformance;
}

export interface Pattern {
  name: string;
  frequency: number;
  confidence: number;
  description: string;
}

export interface HistoricalCorrelation {
  variable: string;
  correlation: number;
  significance: number;
  timeframe: string;
}

export interface HistoricalPerformance {
  periods: PerformancePeriod[];
  volatility: number;
  sharpe: number;
  maxDrawdown: number;
}

export interface PerformancePeriod {
  period: string;
  return: number;
  benchmark: number;
  excess: number;
}

export interface PeerComparison {
  peers: PeerAnalysis[];
  ranking: number;
  percentile: number;
  outliers: OutlierAnalysis[];
}

export interface PeerAnalysis {
  peer: string;
  similarity: number;
  performance: number;
  decision: string;
  rationale: string;
}

export interface OutlierAnalysis {
  metric: string;
  value: number;
  percentile: number;
  explanation: string;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'hold';
  strength: number;
  timeframe: string;
}

export interface FundamentalData {
  metrics: FundamentalMetric[];
  valuation: ValuationMetric[];
  quality: QualityMetric[];
}

export interface FundamentalMetric {
  name: string;
  value: number;
  percentile: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ValuationMetric {
  name: string;
  value: number;
  fair_value: number;
  discount: number;
}

export interface QualityMetric {
  name: string;
  score: number;
  grade: string;
  trend: string;
}

export interface AlternativeData {
  source: string;
  type: string;
  signal: any;
  confidence: number;
  relevance: number;
}

export interface AlternativeDecision {
  id: string;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  pros: string[];
  cons: string[];
  impact: number;
  reasoning: string;
}

export interface OverrideDetails {
  type: OverrideType;
  action: string;
  parameters: Record<string, any>;
  
  // Justification
  justification: OverrideJustification;
  
  // Impact assessment
  impact: OverrideImpact;
  
  // Risk considerations
  risks: OverrideRisk[];
  
  // Monitoring
  monitoring: MonitoringPlan;
}

export interface OverrideJustification {
  reason: string;
  rationale: string[];
  evidence: Evidence[];
  expertise: ExpertiseLevel;
  precedents: Precedent[];
}

export interface Evidence {
  type: string;
  source: string;
  data: any;
  reliability: number;
  relevance: number;
}

export interface Precedent {
  case: string;
  outcome: string;
  similarity: number;
  lesson: string;
}

export interface OverrideImpact {
  financial: FinancialImpact;
  risk: RiskImpact;
  operational: OperationalImpact;
  strategic: StrategicImpact;
}

export interface FinancialImpact {
  expectedCost: number;
  expectedBenefit: number;
  netImpact: number;
  timeToRealize: number;
  confidence: number;
}

export interface RiskImpact {
  riskIncrease: number;
  newRisks: string[];
  mitigatedRisks: string[];
  overallRiskChange: number;
}

export interface OperationalImpact {
  complexity: number;
  resources: string[];
  timeline: number;
  dependencies: string[];
}

export interface StrategicImpact {
  alignment: number;
  precedent: boolean;
  implications: string[];
  long_term_effects: string[];
}

export interface OverrideRisk {
  risk: string;
  probability: number;
  impact: number;
  severity: RiskSeverity;
  mitigation: string;
}

export interface MonitoringPlan {
  metrics: MonitoringMetric[];
  frequency: string;
  alerts: AlertCondition[];
  reviews: ReviewSchedule[];
}

export interface MonitoringMetric {
  metric: string;
  target: number;
  threshold: number;
  action: string;
}

export interface AlertCondition {
  condition: string;
  threshold: number;
  action: string;
  escalation: string;
}

export interface ReviewSchedule {
  frequency: string;
  participants: string[];
  criteria: string[];
  actions: string[];
}

export interface ExplanationData {
  // Primary explanation
  summary: string;
  detailed: string;
  
  // Visual explanations
  visualizations: VisualizationData[];
  
  // Interactive explanations
  interactive: InteractiveExplanation[];
  
  // Comparative explanations
  comparisons: ComparisonExplanation[];
  
  // Scenario explanations
  scenarios: ScenarioExplanation[];
  
  // Learning resources
  resources: LearningResource[];
}

export interface VisualizationData {
  type: string;
  title: string;
  data: any;
  config: any;
  insights: string[];
}

export interface InteractiveExplanation {
  type: string;
  title: string;
  component: string;
  props: any;
  description: string;
}

export interface ComparisonExplanation {
  title: string;
  items: ComparisonItem[];
  insights: string[];
}

export interface ComparisonItem {
  name: string;
  value: any;
  comparison: string;
  significance: number;
}

export interface ScenarioExplanation {
  scenario: string;
  description: string;
  outcome: string;
  probability: number;
  implications: string[];
}

export interface LearningResource {
  type: string;
  title: string;
  url?: string;
  content?: string;
  difficulty: string;
  duration: number;
}

export interface OverrideValidation {
  isValid: boolean;
  warnings: ValidationWarning[];
  requirements: ValidationRequirement[];
  approvals: ApprovalStatus[];
}

export interface ValidationWarning {
  type: string;
  message: string;
  severity: WarningSeverity;
  dismissible: boolean;
}

export interface ValidationRequirement {
  requirement: string;
  satisfied: boolean;
  description: string;
  action: string;
}

export interface ApprovalStatus {
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  timestamp?: Date;
}

export interface OverrideMetadata {
  source: string;
  environment: string;
  version: string;
  correlationId: string;
  
  // User info
  userAgent: string;
  location: string;
  session: string;
  
  // System info
  systemState: any;
  modelVersion: string;
  confidence: number;
  
  // Audit trail
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  user: string;
  details: any;
  impact: string;
}

// Enums
export type DecisionType = 'allocation' | 'rebalance' | 'trade' | 'risk_adjustment' | 'strategy_change';

export type DecisionCategory = 'routine' | 'significant' | 'critical' | 'emergency';

export type FactorImpact = 'positive' | 'negative' | 'neutral';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ModelType = 'ml' | 'statistical' | 'rule_based' | 'hybrid';

export type OverrideStatus = 'draft' | 'pending' | 'approved' | 'active' | 'expired' | 'revoked';

export type OverrideType = 'manual' | 'conditional' | 'temporary' | 'permanent';

export type ExpertiseLevel = 'novice' | 'intermediate' | 'expert' | 'specialist';

export type WarningSeverity = 'info' | 'warning' | 'error' | 'critical';

// Error types
export class OverrideError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'OverrideError';
  }
} 