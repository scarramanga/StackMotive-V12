// Block 36: Rebalance Override Handler - Types
// TypeScript interfaces for rebalance override handling

export interface RebalanceOverrideHandler {
  id: string;
  rebalanceId: string;
  portfolioId: string;
  userId: string;
  
  // Original rebalance plan
  originalPlan: RebalancePlan;
  
  // Override details
  override: RebalanceOverride;
  
  // Status and processing
  status: OverrideStatus;
  processing: ProcessingState;
  
  // Validation and approval
  validation: OverrideValidation;
  approval: ApprovalWorkflow;
  
  // Execution
  execution: OverrideExecution;
  
  // Monitoring
  monitoring: OverrideMonitoring;
  
  // Results
  results: OverrideResults;
  
  // Timestamps
  createdAt: Date;
  approvedAt?: Date;
  executedAt?: Date;
  completedAt?: Date;
  
  // Metadata
  metadata: OverrideMetadata;
}

export interface RebalancePlan {
  id: string;
  strategy: string;
  triggeredBy: string;
  
  // Target allocation
  targetAllocation: AllocationTarget[];
  
  // Trades required
  trades: PlannedTrade[];
  
  // Constraints
  constraints: RebalanceConstraint[];
  
  // Parameters
  parameters: RebalanceParameters;
  
  // Risk assessment
  riskAssessment: RiskAssessment;
  
  // Cost estimation
  costEstimation: CostEstimation;
  
  // Timeline
  timeline: RebalanceTimeline;
}

export interface AllocationTarget {
  assetId: string;
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  deviation: number;
  priority: number;
}

export interface PlannedTrade {
  id: string;
  assetId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  estimatedPrice: number;
  estimatedValue: number;
  priority: number;
  timing: TradeTiming;
}

export interface TradeTiming {
  earliest: Date;
  latest: Date;
  preferred: Date;
  constraints: string[];
}

export interface RebalanceConstraint {
  type: ConstraintType;
  field: string;
  operator: ConstraintOperator;
  value: any;
  priority: number;
  flexible: boolean;
}

export interface RebalanceParameters {
  method: 'threshold' | 'time' | 'tactical' | 'strategic';
  threshold: number;
  tolerance: number;
  maxTrades: number;
  maxCost: number;
  timeHorizon: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface RiskAssessment {
  overallRisk: number;
  riskIncrease: number;
  riskFactors: RiskFactor[];
  scenarios: RiskScenario[];
  limits: RiskLimit[];
}

export interface RiskFactor {
  factor: string;
  impact: number;
  probability: number;
  mitigation: string;
}

export interface RiskScenario {
  scenario: string;
  probability: number;
  impact: number;
  description: string;
}

export interface RiskLimit {
  type: string;
  current: number;
  limit: number;
  headroom: number;
}

export interface CostEstimation {
  totalCost: number;
  breakdown: CostBreakdown[];
  optimization: CostOptimization;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface CostOptimization {
  opportunities: OptimizationOpportunity[];
  potentialSavings: number;
  recommendations: string[];
}

export interface OptimizationOpportunity {
  type: string;
  description: string;
  savings: number;
  effort: number;
}

export interface RebalanceTimeline {
  estimatedDuration: number;
  phases: TimelinePhase[];
  milestones: TimelineMilestone[];
}

export interface TimelinePhase {
  phase: string;
  duration: number;
  dependencies: string[];
  resources: string[];
}

export interface TimelineMilestone {
  milestone: string;
  date: Date;
  critical: boolean;
  dependencies: string[];
}

export interface RebalanceOverride {
  type: OverrideType;
  scope: OverrideScope;
  
  // Override details
  changes: OverrideChange[];
  
  // Justification
  justification: OverrideJustification;
  
  // Alternative plan
  alternativePlan: AlternativePlan;
  
  // Risk considerations
  riskConsiderations: RiskConsideration[];
  
  // Timing
  timing: OverrideTiming;
  
  // Conditions
  conditions: OverrideCondition[];
}

export interface OverrideChange {
  id: string;
  field: string;
  originalValue: any;
  newValue: any;
  changeType: ChangeType;
  impact: ChangeImpact;
  rationale: string;
}

export interface OverrideJustification {
  reason: string;
  category: JustificationCategory;
  evidence: Evidence[];
  expertise: ExpertiseLevel;
  precedents: Precedent[];
  references: Reference[];
}

export interface Evidence {
  type: string;
  source: string;
  data: any;
  credibility: number;
  relevance: number;
}

export interface Precedent {
  case: string;
  date: Date;
  outcome: string;
  similarity: number;
  lesson: string;
}

export interface Reference {
  type: string;
  title: string;
  url?: string;
  description: string;
}

export interface AlternativePlan {
  allocation: AllocationTarget[];
  trades: PlannedTrade[];
  parameters: RebalanceParameters;
  riskProfile: RiskProfile;
  costProfile: CostProfile;
}

export interface RiskProfile {
  expectedRisk: number;
  riskRange: { min: number; max: number };
  volatility: number;
  correlations: CorrelationData[];
}

export interface CorrelationData {
  asset1: string;
  asset2: string;
  correlation: number;
  stability: number;
}

export interface CostProfile {
  expectedCost: number;
  costRange: { min: number; max: number };
  breakdown: CostBreakdown[];
  sensitivity: CostSensitivity[];
}

export interface CostSensitivity {
  parameter: string;
  elasticity: number;
  impact: number;
}

export interface RiskConsideration {
  risk: string;
  assessment: string;
  mitigation: string;
  residualRisk: number;
  acceptability: AcceptabilityLevel;
}

export interface OverrideTiming {
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  deadline?: Date;
  constraints: TimingConstraint[];
  preferences: TimingPreference[];
}

export interface TimingConstraint {
  type: string;
  constraint: string;
  flexibility: number;
}

export interface TimingPreference {
  type: string;
  preference: string;
  priority: number;
}

export interface OverrideCondition {
  condition: string;
  type: ConditionType;
  parameters: Record<string, any>;
  monitoring: boolean;
  actions: ConditionalAction[];
}

export interface ConditionalAction {
  trigger: string;
  action: string;
  parameters: Record<string, any>;
  priority: number;
}

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number;
  currentTask: string;
  
  // Queue position
  queuePosition: number;
  estimatedWaitTime: number;
  
  // Dependencies
  dependencies: Dependency[];
  
  // Resources
  resources: ResourceAllocation[];
  
  // Status
  isBlocked: boolean;
  blockingIssues: BlockingIssue[];
}

export interface Dependency {
  id: string;
  type: string;
  description: string;
  status: DependencyStatus;
  impact: DependencyImpact;
}

export interface ResourceAllocation {
  resource: string;
  allocated: number;
  required: number;
  availability: number;
}

export interface BlockingIssue {
  issue: string;
  severity: IssueSeverity;
  resolution: string;
  estimatedTime: number;
}

export interface OverrideValidation {
  isValid: boolean;
  score: number;
  
  // Validation results
  checks: ValidationCheck[];
  warnings: ValidationWarning[];
  errors: ValidationError[];
  
  // Compliance
  compliance: ComplianceCheck[];
  
  // Risk validation
  riskValidation: RiskValidation;
  
  // Impact validation
  impactValidation: ImpactValidation;
}

export interface ValidationCheck {
  check: string;
  passed: boolean;
  score: number;
  details: string;
  requirements: string[];
}

export interface ValidationWarning {
  warning: string;
  severity: WarningSeverity;
  recommendation: string;
  dismissible: boolean;
}

export interface ValidationError {
  error: string;
  severity: ErrorSeverity;
  resolution: string;
  blocking: boolean;
}

export interface ComplianceCheck {
  regulation: string;
  status: ComplianceStatus;
  requirements: string[];
  exceptions: string[];
}

export interface RiskValidation {
  withinLimits: boolean;
  limitBreaches: LimitBreach[];
  riskScore: number;
  acceptability: AcceptabilityLevel;
}

export interface LimitBreach {
  limit: string;
  current: number;
  threshold: number;
  severity: BreachSeverity;
}

export interface ImpactValidation {
  financialImpact: FinancialImpactValidation;
  operationalImpact: OperationalImpactValidation;
  strategicImpact: StrategicImpactValidation;
}

export interface FinancialImpactValidation {
  withinBudget: boolean;
  estimatedCost: number;
  budgetLimit: number;
  approvalRequired: boolean;
}

export interface OperationalImpactValidation {
  feasible: boolean;
  complexity: number;
  resourceRequirements: string[];
  timeline: TimelineValidation;
}

export interface TimelineValidation {
  achievable: boolean;
  estimatedTime: number;
  constraints: string[];
  risks: string[];
}

export interface StrategicImpactValidation {
  aligned: boolean;
  deviations: string[];
  implications: string[];
  recommendations: string[];
}

export interface ApprovalWorkflow {
  required: boolean;
  workflow: WorkflowStep[];
  currentStep: number;
  
  // Approvals
  approvals: ApprovalRecord[];
  
  // Escalation
  escalation: EscalationRule[];
  
  // Timeline
  deadlines: WorkflowDeadline[];
}

export interface WorkflowStep {
  step: number;
  name: string;
  approver: string;
  role: string;
  criteria: string[];
  timeout: number;
  optional: boolean;
}

export interface ApprovalRecord {
  step: number;
  approver: string;
  status: ApprovalStatus;
  timestamp?: Date;
  comment?: string;
  conditions?: string[];
}

export interface EscalationRule {
  condition: string;
  action: string;
  to: string;
  timeout: number;
}

export interface WorkflowDeadline {
  step: number;
  deadline: Date;
  critical: boolean;
  action: string;
}

export interface OverrideExecution {
  plan: ExecutionPlan;
  progress: ExecutionProgress;
  
  // Execution state
  state: ExecutionState;
  
  // Trade execution
  trades: TradeExecution[];
  
  // Monitoring
  monitoring: ExecutionMonitoring;
  
  // Results
  results: ExecutionResults;
}

export interface ExecutionPlan {
  phases: ExecutionPhase[];
  sequence: ExecutionSequence[];
  contingencies: Contingency[];
  rollback: RollbackPlan;
}

export interface ExecutionPhase {
  phase: string;
  tasks: ExecutionTask[];
  dependencies: string[];
  timeline: PhaseTimeline;
}

export interface ExecutionTask {
  task: string;
  type: TaskType;
  parameters: Record<string, any>;
  priority: number;
  dependencies: string[];
}

export interface PhaseTimeline {
  start: Date;
  end: Date;
  duration: number;
  buffer: number;
}

export interface ExecutionSequence {
  order: number;
  action: string;
  conditions: string[];
  fallback: string;
}

export interface Contingency {
  scenario: string;
  probability: number;
  impact: number;
  response: string;
  resources: string[];
}

export interface RollbackPlan {
  triggers: string[];
  actions: RollbackAction[];
  timeline: number;
  resources: string[];
}

export interface RollbackAction {
  action: string;
  order: number;
  conditions: string[];
  impact: number;
}

export interface ExecutionProgress {
  percentage: number;
  phase: string;
  task: string;
  
  // Metrics
  tradesCompleted: number;
  tradesTotal: number;
  valueExecuted: number;
  valueTotal: number;
  
  // Timing
  startTime: Date;
  elapsedTime: number;
  estimatedCompletion: Date;
  
  // Status
  status: ExecutionStatus;
  issues: ExecutionIssue[];
}

export interface ExecutionIssue {
  issue: string;
  severity: IssueSeverity;
  impact: string;
  resolution: string;
  timeline: number;
}

export interface ExecutionState {
  phase: string;
  status: ExecutionStatus;
  
  // Resources
  resources: ResourceState[];
  
  // Environment
  environment: ExecutionEnvironment;
  
  // Health
  health: HealthStatus;
}

export interface ResourceState {
  resource: string;
  status: ResourceStatus;
  utilization: number;
  availability: number;
}

export interface ExecutionEnvironment {
  marketState: MarketState;
  systemState: SystemState;
  networkState: NetworkState;
}

export interface MarketState {
  session: string;
  volatility: number;
  liquidity: number;
  conditions: string[];
}

export interface SystemState {
  performance: number;
  load: number;
  errors: number;
  warnings: number;
}

export interface NetworkState {
  latency: number;
  bandwidth: number;
  connectivity: number;
  stability: number;
}

export interface HealthStatus {
  overall: number;
  components: ComponentHealth[];
  alerts: HealthAlert[];
}

export interface ComponentHealth {
  component: string;
  status: HealthLevel;
  score: number;
  issues: string[];
}

export interface HealthAlert {
  alert: string;
  severity: AlertSeverity;
  timestamp: Date;
  acknowledged: boolean;
}

export interface TradeExecution {
  id: string;
  tradeId: string;
  
  // Trade details
  asset: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  
  // Status
  status: TradeStatus;
  
  // Execution
  executedQuantity: number;
  executedPrice: number;
  slippage: number;
  
  // Timing
  submittedAt: Date;
  executedAt?: Date;
  
  // Results
  success: boolean;
  error?: string;
}

export interface ExecutionMonitoring {
  metrics: MonitoringMetric[];
  alerts: MonitoringAlert[];
  thresholds: MonitoringThreshold[];
  
  // Real-time data
  realTimeData: RealTimeData[];
  
  // Performance
  performance: PerformanceMetrics;
}

export interface MonitoringMetric {
  metric: string;
  value: number;
  target: number;
  threshold: number;
  trend: TrendDirection;
}

export interface MonitoringAlert {
  alert: string;
  level: AlertLevel;
  triggered: Date;
  resolved?: Date;
  action: string;
}

export interface MonitoringThreshold {
  metric: string;
  warning: number;
  critical: number;
  action: string;
}

export interface RealTimeData {
  timestamp: Date;
  data: Record<string, any>;
  source: string;
  quality: DataQuality;
}

export interface PerformanceMetrics {
  throughput: number;
  latency: number;
  errorRate: number;
  successRate: number;
  efficiency: number;
}

export interface ExecutionResults {
  success: boolean;
  completion: number;
  
  // Financial results
  financialResults: FinancialResults;
  
  // Operational results
  operationalResults: OperationalResults;
  
  // Quality results
  qualityResults: QualityResults;
  
  // Comparison
  comparison: ResultComparison;
}

export interface FinancialResults {
  totalValue: number;
  totalCost: number;
  netResult: number;
  costEfficiency: number;
  slippage: number;
}

export interface OperationalResults {
  duration: number;
  tradesExecuted: number;
  successRate: number;
  errorCount: number;
  efficiency: number;
}

export interface QualityResults {
  executionQuality: number;
  priceImprovement: number;
  timingQuality: number;
  overallQuality: number;
}

export interface ResultComparison {
  vsOriginal: ComparisonResult;
  vsExpected: ComparisonResult;
  vsBenchmark: ComparisonResult;
}

export interface ComparisonResult {
  metric: string;
  original: number;
  actual: number;
  difference: number;
  percentage: number;
}

export interface OverrideMonitoring {
  // Active monitoring
  active: boolean;
  frequency: number;
  
  // Monitored metrics
  metrics: MonitoredMetric[];
  
  // Alerts
  alerts: MonitoringAlert[];
  
  // Reporting
  reporting: MonitoringReporting;
}

export interface MonitoredMetric {
  metric: string;
  current: number;
  target: number;
  tolerance: number;
  trend: TrendDirection;
}

export interface MonitoringReporting {
  frequency: string;
  recipients: string[];
  format: string;
  automated: boolean;
}

export interface OverrideResults {
  // Overall results
  success: boolean;
  completion: number;
  
  // Performance vs expectations
  performance: PerformanceResults;
  
  // Impact assessment
  impact: ImpactResults;
  
  // Lessons learned
  lessons: LessonLearned[];
  
  // Recommendations
  recommendations: Recommendation[];
}

export interface PerformanceResults {
  financial: FinancialPerformance;
  operational: OperationalPerformance;
  strategic: StrategicPerformance;
}

export interface FinancialPerformance {
  roi: number;
  costSavings: number;
  revenueImpact: number;
  paybackPeriod: number;
}

export interface OperationalPerformance {
  efficiency: number;
  quality: number;
  reliability: number;
  scalability: number;
}

export interface StrategicPerformance {
  alignment: number;
  innovation: number;
  learning: number;
  adaptability: number;
}

export interface ImpactResults {
  intended: ImpactMeasurement[];
  unintended: ImpactMeasurement[];
  
  // Stakeholder impact
  stakeholders: StakeholderImpact[];
  
  // System impact
  systems: SystemImpact[];
}

export interface ImpactMeasurement {
  impact: string;
  metric: string;
  baseline: number;
  actual: number;
  target: number;
  variance: number;
}

export interface StakeholderImpact {
  stakeholder: string;
  impact: string;
  sentiment: number;
  feedback: string;
}

export interface SystemImpact {
  system: string;
  impact: string;
  severity: number;
  duration: number;
}

export interface LessonLearned {
  lesson: string;
  category: LessonCategory;
  importance: number;
  applicability: string[];
  evidence: string;
}

export interface Recommendation {
  recommendation: string;
  priority: number;
  effort: number;
  impact: number;
  timeline: number;
  resources: string[];
}

export interface OverrideMetadata {
  source: string;
  version: string;
  environment: string;
  correlationId: string;
  
  // Audit trail
  auditTrail: AuditRecord[];
  
  // Context
  context: OverrideContext;
  
  // Tags
  tags: string[];
}

export interface AuditRecord {
  timestamp: Date;
  user: string;
  action: string;
  details: Record<string, any>;
  impact: string;
}

export interface OverrideContext {
  marketContext: MarketContext;
  portfolioContext: PortfolioContext;
  userContext: UserContext;
  systemContext: SystemContext;
}

export interface MarketContext {
  conditions: string[];
  volatility: number;
  trends: string[];
  events: string[];
}

export interface PortfolioContext {
  value: number;
  performance: number;
  risk: number;
  allocation: AllocationSummary[];
}

export interface AllocationSummary {
  asset: string;
  weight: number;
  performance: number;
  risk: number;
}

export interface UserContext {
  experience: string;
  preferences: UserPreference[];
  constraints: UserConstraint[];
  goals: string[];
}

export interface UserPreference {
  type: string;
  value: any;
  priority: number;
}

export interface UserConstraint {
  type: string;
  constraint: string;
  flexibility: number;
}

export interface SystemContext {
  load: number;
  performance: number;
  capacity: number;
  health: number;
}

// Enums
export type OverrideStatus = 'draft' | 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';

export type OverrideType = 'allocation' | 'timing' | 'constraints' | 'parameters' | 'trades' | 'full';

export type OverrideScope = 'partial' | 'complete' | 'conditional' | 'temporary';

export type ChangeType = 'add' | 'remove' | 'modify' | 'replace';

export type ChangeImpact = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type JustificationCategory = 'market' | 'risk' | 'cost' | 'strategy' | 'compliance' | 'other';

export type ExpertiseLevel = 'novice' | 'intermediate' | 'expert' | 'specialist';

export type AcceptabilityLevel = 'acceptable' | 'conditional' | 'unacceptable';

export type ConditionType = 'market' | 'time' | 'performance' | 'risk' | 'cost';

export type ProcessingStage = 'queued' | 'validating' | 'approving' | 'planning' | 'executing' | 'monitoring' | 'completed';

export type ConstraintType = 'hard' | 'soft' | 'preference';

export type ConstraintOperator = 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge' | 'in' | 'nin';

export type DependencyStatus = 'pending' | 'satisfied' | 'failed' | 'blocked';

export type DependencyImpact = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type IssueSeverity = 'info' | 'warning' | 'error' | 'critical';

export type WarningSeverity = 'info' | 'warning' | 'error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ComplianceStatus = 'compliant' | 'warning' | 'violation' | 'unknown';

export type BreachSeverity = 'minor' | 'major' | 'critical' | 'severe';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'conditional';

export type ExecutionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type TaskType = 'trade' | 'validation' | 'notification' | 'monitoring' | 'reporting';

export type ResourceStatus = 'available' | 'busy' | 'unavailable' | 'failed';

export type HealthLevel = 'healthy' | 'degraded' | 'unhealthy' | 'failed';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type TradeStatus = 'pending' | 'submitted' | 'filled' | 'cancelled' | 'failed';

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';

export type DataQuality = 'high' | 'medium' | 'low' | 'unknown';

export type LessonCategory = 'process' | 'technical' | 'market' | 'risk' | 'communication';

// Error types
export class RebalanceOverrideError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'RebalanceOverrideError';
  }
} 