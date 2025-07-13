// Block 87: Trading Calendar Awareness - Types
// TypeScript interfaces for trading calendar awareness and market closure alerts

export interface TradingCalendarAwareness {
  id: string;
  portfolioId: string;
  userId: string;
  
  // Calendar data
  calendars: TradingCalendar[];
  
  // Current state
  currentAllocations: AllocationIntent[];
  pendingRebalances: PendingRebalance[];
  scheduledTrades: ScheduledTrade[];
  
  // Alerts and conflicts
  alerts: CalendarAlert[];
  conflicts: MarketConflict[];
  
  // Configuration
  settings: CalendarSettings;
  
  // Status
  status: AwarenessStatus;
  lastUpdated: Date;
  nextUpdate: Date;
  
  // Metadata
  metadata: CalendarMetadata;
}

export interface TradingCalendar {
  id: string;
  market: MarketIdentifier;
  timezone: string;
  currency: string;
  
  // Calendar data
  tradingDays: TradingDay[];
  holidays: MarketHoliday[];
  specialSessions: SpecialSession[];
  
  // Market hours
  regularHours: MarketHours;
  extendedHours?: ExtendedHours;
  
  // Rules and patterns
  tradingRules: TradingRule[];
  settlementRules: SettlementRule[];
  
  // Status
  isActive: boolean;
  lastUpdated: Date;
  dataSource: string;
  reliability: number;
}

export interface MarketIdentifier {
  code: string; // NZX, ASX, NYSE, NASDAQ, etc.
  name: string;
  country: string;
  region: string;
  sector?: string;
}

export interface TradingDay {
  date: Date;
  isOpen: boolean;
  session: SessionType;
  
  // Hours
  preMarketOpen?: Date;
  marketOpen: Date;
  marketClose: Date;
  postMarketClose?: Date;
  
  // Special conditions
  isHalfDay: boolean;
  isHoliday: boolean;
  hasRestrictions: boolean;
  restrictions?: TradingRestriction[];
  
  // Volume and liquidity expectations
  expectedVolume: VolumeCategory;
  liquidityFactor: number;
}

export interface MarketHoliday {
  id: string;
  name: string;
  date: Date;
  type: HolidayType;
  
  // Impact
  affectedMarkets: string[];
  tradingStatus: TradingStatus;
  settlementImpact: SettlementImpact;
  
  // Planning
  advanceNotice: number; // days
  alternativeMarkets: string[];
  workarounds: string[];
  
  // Recurring
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface SpecialSession {
  id: string;
  date: Date;
  type: SpecialSessionType;
  
  // Hours
  startTime: Date;
  endTime: Date;
  
  // Conditions
  tradingConditions: TradingCondition[];
  volumeExpectations: VolumeExpectation;
  liquidityConditions: LiquidityCondition;
  
  // Impact
  affectedAssets: string[];
  restrictions: TradingRestriction[];
}

export interface MarketHours {
  timezone: string;
  
  // Regular session
  preMarketStart?: string; // HH:MM format
  marketOpen: string;
  marketClose: string;
  postMarketEnd?: string;
  
  // Day variations
  mondayHours?: DayHours;
  tuesdayHours?: DayHours;
  wednesdayHours?: DayHours;
  thursdayHours?: DayHours;
  fridayHours?: DayHours;
  weekendHours?: DayHours;
  
  // Special hours
  halfDayHours?: DayHours;
  holidayEveHours?: DayHours;
}

export interface DayHours {
  preMarketStart?: string;
  marketOpen: string;
  marketClose: string;
  postMarketEnd?: string;
}

export interface ExtendedHours {
  available: boolean;
  
  // Pre-market
  preMarketStart: string;
  preMarketEnd: string;
  preMarketLiquidity: number;
  
  // After-hours
  afterHoursStart: string;
  afterHoursEnd: string;
  afterHoursLiquidity: number;
  
  // Restrictions
  restrictions: ExtendedHoursRestriction[];
  eligibleAssets: string[];
}

export interface TradingRule {
  id: string;
  name: string;
  type: RuleType;
  
  // Rule definition
  condition: string;
  action: string;
  priority: number;
  
  // Scope
  applicableAssets: string[];
  applicableDates: DateRange[];
  
  // Impact
  tradingImpact: TradingImpact;
  settlementImpact: SettlementImpact;
  
  // Status
  isActive: boolean;
  effectiveFrom: Date;
  effectiveUntil?: Date;
}

export interface SettlementRule {
  id: string;
  name: string;
  
  // Settlement cycle
  standardCycle: number; // T+n days
  expeditedCycle?: number;
  delayedCycle?: number;
  
  // Conditions
  conditions: SettlementCondition[];
  exceptions: SettlementException[];
  
  // Holiday handling
  holidayHandling: HolidayHandling;
  weekendHandling: WeekendHandling;
}

export interface AllocationIntent {
  id: string;
  portfolioId: string;
  
  // Target allocation
  targets: AssetAllocation[];
  
  // Timing
  targetDate: Date;
  deadline?: Date;
  flexibility: FlexibilityLevel;
  
  // Constraints
  constraints: AllocationConstraint[];
  
  // Market requirements
  requiredMarkets: string[];
  optionalMarkets: string[];
  fallbackOptions: FallbackOption[];
  
  // Priority and urgency
  priority: PriorityLevel;
  urgency: UrgencyLevel;
  reasonCode: string;
}

export interface AssetAllocation {
  assetId: string;
  symbol: string;
  targetWeight: number;
  currentWeight: number;
  deviation: number;
  
  // Market info
  primaryMarket: string;
  tradingMarkets: string[];
  preferredMarket: string;
  
  // Trading requirements
  minimumTradeSize: number;
  tradingIncrements: number;
  liquidityRequirements: LiquidityRequirement;
  
  // Timing sensitivity
  timingSensitivity: TimingSensitivity;
  marketDependency: MarketDependency;
}

export interface PendingRebalance {
  id: string;
  portfolioId: string;
  strategyId: string;
  
  // Rebalance details
  plannedTrades: PlannedTrade[];
  totalValue: number;
  estimatedCost: number;
  
  // Timing
  scheduledDate: Date;
  deadline: Date;
  estimatedDuration: number;
  
  // Market dependencies
  marketDependencies: MarketDependency[];
  criticalMarkets: string[];
  
  // Flexibility
  canDefer: boolean;
  maxDeferralDays: number;
  deferralCost: number;
  
  // Status
  status: RebalanceStatus;
  conflicts: RebalanceConflict[];
}

export interface ScheduledTrade {
  id: string;
  portfolioId: string;
  
  // Trade details
  assetId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  orderType: OrderType;
  
  // Timing
  scheduledTime: Date;
  window: TimeWindow;
  
  // Market requirements
  preferredMarket: string;
  acceptableMarkets: string[];
  marketConditions: RequiredMarketCondition[];
  
  // Flexibility
  isFlexible: boolean;
  earliestTime?: Date;
  latestTime?: Date;
  
  // Dependencies
  dependencies: TradeDependency[];
  blockers: TradeBlocker[];
}

export interface CalendarAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  
  // Alert details
  title: string;
  message: string;
  description: string;
  
  // Timing
  alertTime: Date;
  eventTime: Date;
  leadTime: number; // hours before event
  
  // Affected items
  affectedRebalances: string[];
  affectedTrades: string[];
  affectedMarkets: string[];
  affectedAssets: string[];
  
  // Impact assessment
  impact: ImpactAssessment;
  
  // Actions
  suggestedActions: SuggestedAction[];
  automaticActions: AutomaticAction[];
  
  // Status
  status: AlertStatus;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  
  // Follow-up
  requiresResponse: boolean;
  responseDeadline?: Date;
  escalationRules: EscalationRule[];
}

export interface MarketConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  
  // Conflict details
  description: string;
  affectedOperations: AffectedOperation[];
  
  // Timing
  conflictStart: Date;
  conflictEnd: Date;
  duration: number;
  
  // Markets
  affectedMarkets: string[];
  availableAlternatives: string[];
  
  // Resolution options
  resolutionOptions: ResolutionOption[];
  recommendedAction: string;
  
  // Cost implications
  costImpact: CostImpact;
  opportunityCost: number;
  
  // Status
  status: ConflictStatus;
  resolution?: ConflictResolution;
}

export interface CalendarSettings {
  // Monitoring
  enableMonitoring: boolean;
  monitoringFrequency: MonitoringFrequency;
  lookAheadDays: number;
  
  // Markets to monitor
  monitoredMarkets: string[];
  primaryMarkets: string[];
  secondaryMarkets: string[];
  
  // Alert preferences
  alertPreferences: AlertPreferences;
  notificationChannels: NotificationChannel[];
  
  // Automation
  enableAutomation: boolean;
  automationRules: AutomationRule[];
  
  // Business rules
  businessRules: BusinessRule[];
  
  // Thresholds
  thresholds: CalendarThreshold[];
  
  // Integration
  notificationCenterIntegration: boolean;
  externalIntegrations: ExternalIntegration[];
}

export interface AlertPreferences {
  // Severity levels to alert on
  minSeverity: AlertSeverity;
  
  // Timing preferences
  advanceNoticeHours: number[];
  businessHoursOnly: boolean;
  weekendsEnabled: boolean;
  
  // Channel preferences
  emailAlerts: boolean;
  pushNotifications: boolean;
  smsAlerts: boolean;
  dashboardAlerts: boolean;
  
  // Content preferences
  includeImpactAnalysis: boolean;
  includeSuggestedActions: boolean;
  includeAlternatives: boolean;
  
  // Frequency limits
  maxAlertsPerDay: number;
  consolidateAlerts: boolean;
  quietHours: QuietHours;
}

export interface NotificationChannel {
  type: ChannelType;
  enabled: boolean;
  config: ChannelConfig;
  filters: ChannelFilter[];
}

export interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: AutomationAction;
  enabled: boolean;
  priority: number;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  rule: string;
  exceptions: string[];
  enabled: boolean;
}

export interface CalendarThreshold {
  metric: string;
  warningLevel: number;
  criticalLevel: number;
  unit: string;
}

export interface ExternalIntegration {
  name: string;
  type: IntegrationType;
  endpoint: string;
  enabled: boolean;
  config: IntegrationConfig;
}

export interface ImpactAssessment {
  // Financial impact
  financialImpact: FinancialImpact;
  
  // Operational impact
  operationalImpact: OperationalImpact;
  
  // Strategic impact
  strategicImpact: StrategicImpact;
  
  // Risk impact
  riskImpact: RiskImpact;
  
  // Overall assessment
  overallRating: ImpactRating;
  confidence: number;
}

export interface FinancialImpact {
  estimatedCost: number;
  opportunityCost: number;
  potentialSavings: number;
  netImpact: number;
  
  // Breakdown
  tradingCosts: number;
  delayCosts: number;
  alternativeCosts: number;
  
  // Time factor
  costPerDay: number;
  totalDays: number;
}

export interface OperationalImpact {
  // Complexity
  complexity: ComplexityLevel;
  additionalWork: number; // hours
  resourceRequirements: string[];
  
  // Dependencies
  dependentOperations: string[];
  cascadeEffects: CascadeEffect[];
  
  // Timeline
  timelineImpact: TimelineImpact;
}

export interface StrategicImpact {
  // Alignment
  strategyAlignment: AlignmentLevel;
  objectiveImpact: ObjectiveImpact[];
  
  // Long-term effects
  longTermEffects: string[];
  precedentSetting: boolean;
  
  // Stakeholder impact
  stakeholderImpact: StakeholderImpact[];
}

export interface RiskImpact {
  // Risk categories
  marketRisk: RiskLevel;
  liquidityRisk: RiskLevel;
  operationalRisk: RiskLevel;
  reputationalRisk: RiskLevel;
  
  // Risk changes
  riskIncrease: number;
  newRisks: string[];
  mitigatedRisks: string[];
  
  // Risk assessment
  overallRiskChange: RiskChange;
  riskMitigation: RiskMitigation[];
}

export interface SuggestedAction {
  id: string;
  action: string;
  description: string;
  
  // Feasibility
  feasibility: FeasibilityLevel;
  effort: EffortLevel;
  timeRequired: number;
  
  // Impact
  expectedBenefit: number;
  riskReduction: number;
  costImplication: number;
  
  // Implementation
  steps: ActionStep[];
  prerequisites: string[];
  dependencies: string[];
  
  // Alternatives
  alternatives: AlternativeAction[];
}

export interface AutomaticAction {
  id: string;
  action: string;
  trigger: TriggerCondition;
  
  // Execution
  executionTime: Date;
  parameters: ActionParameters;
  
  // Safety
  safetyChecks: SafetyCheck[];
  rollbackPlan: RollbackPlan;
  
  // Status
  status: ActionStatus;
  executed: boolean;
  executedAt?: Date;
  result?: ActionResult;
}

export interface CalendarMetadata {
  // Data sources
  dataSources: DataSource[];
  lastRefresh: Date;
  nextRefresh: Date;
  
  // Quality metrics
  dataQuality: DataQuality;
  coverage: Coverage;
  accuracy: Accuracy;
  
  // Performance
  performance: PerformanceMetrics;
  
  // Audit
  auditTrail: AuditEntry[];
  
  // Version
  version: string;
  schemaVersion: string;
}

// Supporting interfaces
export interface TimeWindow {
  start: Date;
  end: Date;
  timezone: string;
  flexible: boolean;
}

export interface MarketDependency {
  market: string;
  dependencyType: DependencyType;
  criticality: CriticalityLevel;
  alternatives: string[];
}

export interface TradeDependency {
  type: DependencyType;
  target: string;
  condition: string;
  flexible: boolean;
}

export interface TradeBlocker {
  type: BlockerType;
  description: string;
  canOverride: boolean;
  overrideConditions: string[];
}

export interface ResolutionOption {
  id: string;
  option: string;
  description: string;
  feasibility: number;
  cost: number;
  timeRequired: number;
  riskLevel: number;
  effectiveness: number;
}

export interface CostImpact {
  directCosts: number;
  indirectCosts: number;
  opportunityCosts: number;
  savingsLost: number;
  totalImpact: number;
  
  // Breakdown
  costBreakdown: CostBreakdownItem[];
  
  // Time sensitivity
  costPerHour: number;
  costPerDay: number;
}

export interface ConflictResolution {
  option: string;
  implementedAt: Date;
  implementedBy: string;
  result: ResolutionResult;
  actualCost: number;
  effectiveness: number;
  lessonsLearned: string[];
}

// Enums
export type AwarenessStatus = 'active' | 'inactive' | 'error' | 'updating';

export type SessionType = 'regular' | 'extended' | 'special' | 'closed';

export type VolumeCategory = 'very_low' | 'low' | 'normal' | 'high' | 'very_high';

export type HolidayType = 'national' | 'market_specific' | 'religious' | 'bank' | 'trading_halt';

export type TradingStatus = 'closed' | 'limited' | 'normal' | 'extended';

export type SettlementImpact = 'none' | 'delayed' | 'expedited' | 'suspended';

export type SpecialSessionType = 'opening_auction' | 'closing_auction' | 'volatility_halt' | 'news_pending' | 'system_maintenance';

export type RuleType = 'trading_hour' | 'settlement' | 'market_maker' | 'volatility' | 'circuit_breaker';

export type TradingImpact = 'none' | 'limited' | 'restricted' | 'suspended';

export type FlexibilityLevel = 'rigid' | 'limited' | 'moderate' | 'flexible' | 'very_flexible';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical' | 'urgent';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical' | 'immediate';

export type RebalanceStatus = 'planned' | 'pending' | 'executing' | 'completed' | 'cancelled' | 'deferred';

export type TradeSide = 'buy' | 'sell';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'iceberg' | 'twap' | 'vwap';

export type AlertType = 'market_closure' | 'holiday_warning' | 'liquidity_alert' | 'conflict_detected' | 'deadline_approaching';

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'expired' | 'escalated';

export type ConflictType = 'market_closure' | 'liquidity_shortage' | 'timing_conflict' | 'settlement_delay' | 'system_maintenance';

export type ConflictSeverity = 'minor' | 'moderate' | 'major' | 'critical' | 'blocking';

export type ConflictStatus = 'detected' | 'analyzing' | 'resolved' | 'deferred' | 'escalated';

export type MonitoringFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';

export type ChannelType = 'email' | 'sms' | 'push' | 'webhook' | 'dashboard';

export type IntegrationType = 'calendar' | 'market_data' | 'notification' | 'trading_system';

export type ImpactRating = 'minimal' | 'low' | 'moderate' | 'high' | 'severe';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'very_complex';

export type AlignmentLevel = 'poor' | 'fair' | 'good' | 'excellent';

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type RiskChange = 'decrease' | 'no_change' | 'slight_increase' | 'moderate_increase' | 'significant_increase';

export type FeasibilityLevel = 'not_feasible' | 'difficult' | 'moderate' | 'easy' | 'very_easy';

export type EffortLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'extensive';

export type ActionStatus = 'pending' | 'scheduled' | 'executing' | 'completed' | 'failed' | 'cancelled';

export type DependencyType = 'sequential' | 'parallel' | 'conditional' | 'optional';

export type CriticalityLevel = 'optional' | 'preferred' | 'important' | 'critical' | 'mandatory';

export type BlockerType = 'hard' | 'soft' | 'conditional' | 'temporary';

// Error types
export class TradingCalendarError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'TradingCalendarError';
  }
}

export class CalendarDataError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'CalendarDataError';
  }
}

export class ConflictDetectionError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'ConflictDetectionError';
  }
} 