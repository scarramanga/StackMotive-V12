// Block 96: AI Agent Config Panel - Types
// AI Agent Configuration Management and Control Panel

export interface AIAgentConfigPanel {
  id: string;
  userId: string;
  
  // Panel identification
  panelName: string;
  description: string;
  
  // Configuration
  agentConfigurations: AgentConfiguration[];
  
  // Panel settings
  panelSettings: PanelSettings;
  
  // Access control
  accessControl: AccessControl;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
}

export interface AgentConfiguration {
  id: string;
  agentId: string;
  agentName: string;
  agentType: AgentType;
  
  // Core configuration
  coreConfig: CoreAgentConfig;
  
  // Strategy parameters
  strategyParams: StrategyParameters;
  
  // Risk management
  riskConfig: RiskConfiguration;
  
  // Behavioral settings
  behaviorConfig: BehaviorConfiguration;
  
  // Performance settings
  performanceConfig: PerformanceConfiguration;
  
  // Notification settings
  notificationConfig: NotificationConfiguration;
  
  // Monitoring settings
  monitoringConfig: MonitoringConfiguration;
  
  // AU/NZ compliance
  complianceConfig: ComplianceConfiguration;
  
  // Status
  status: AgentStatus;
  isEnabled: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  version: number;
}

export interface CoreAgentConfig {
  // Basic settings
  name: string;
  description: string;
  version: string;
  
  // Execution settings
  executionMode: ExecutionMode;
  executionFrequency: ExecutionFrequency;
  
  // Market settings
  marketScope: MarketScope;
  assetScope: AssetScope;
  
  // Trading settings
  tradingConfig: TradingConfiguration;
  
  // Data sources
  dataSources: DataSourceConfiguration[];
  
  // Integration settings
  integrations: IntegrationConfiguration[];
  
  // Custom parameters
  customParameters: CustomParameter[];
}

export interface StrategyParameters {
  // Strategy type
  strategyType: StrategyType;
  
  // Entry parameters
  entryParameters: EntryParameters;
  
  // Exit parameters
  exitParameters: ExitParameters;
  
  // Position sizing
  positionSizing: PositionSizingConfig;
  
  // Rebalancing
  rebalancingConfig: RebalancingConfiguration;
  
  // Signal generation
  signalGeneration: SignalGenerationConfig;
  
  // Technical indicators
  technicalIndicators: TechnicalIndicatorConfig[];
  
  // Fundamental analysis
  fundamentalAnalysis: FundamentalAnalysisConfig;
  
  // Sentiment analysis
  sentimentAnalysis: SentimentAnalysisConfig;
  
  // Machine learning
  mlConfig: MachineLearningConfig;
}

export interface RiskConfiguration {
  // Risk limits
  riskLimits: RiskLimits;
  
  // Stop loss configuration
  stopLossConfig: StopLossConfiguration;
  
  // Take profit configuration
  takeProfitConfig: TakeProfitConfiguration;
  
  // Position limits
  positionLimits: PositionLimits;
  
  // Drawdown protection
  drawdownProtection: DrawdownProtection;
  
  // Volatility management
  volatilityManagement: VolatilityManagement;
  
  // Correlation limits
  correlationLimits: CorrelationLimits;
  
  // Sector exposure limits
  sectorExposureLimits: SectorExposureLimits;
  
  // Risk assessment
  riskAssessment: RiskAssessmentConfig;
}

export interface BehaviorConfiguration {
  // Decision making
  decisionMaking: DecisionMakingConfig;
  
  // Learning behavior
  learningBehavior: LearningBehaviorConfig;
  
  // Adaptation settings
  adaptationSettings: AdaptationSettings;
  
  // Response patterns
  responsePatterns: ResponsePattern[];
  
  // Conflict resolution
  conflictResolution: ConflictResolutionConfig;
  
  // Error handling
  errorHandling: ErrorHandlingConfig;
  
  // Performance adjustment
  performanceAdjustment: PerformanceAdjustmentConfig;
  
  // Market condition adaptation
  marketConditionAdaptation: MarketConditionAdaptationConfig;
}

export interface PerformanceConfiguration {
  // Performance targets
  performanceTargets: PerformanceTargets;
  
  // Benchmarking
  benchmarking: BenchmarkingConfig;
  
  // Performance metrics
  performanceMetrics: PerformanceMetricsConfig;
  
  // Performance monitoring
  performanceMonitoring: PerformanceMonitoringConfig;
  
  // Performance optimization
  performanceOptimization: PerformanceOptimizationConfig;
  
  // Backtesting configuration
  backtestingConfig: BacktestingConfiguration;
  
  // Paper trading
  paperTradingConfig: PaperTradingConfiguration;
  
  // Live trading
  liveTradingConfig: LiveTradingConfiguration;
}

export interface NotificationConfiguration {
  // Notification types
  notificationTypes: NotificationType[];
  
  // Delivery channels
  deliveryChannels: DeliveryChannel[];
  
  // Notification rules
  notificationRules: NotificationRule[];
  
  // Urgency levels
  urgencyLevels: UrgencyLevel[];
  
  // Scheduling
  scheduling: NotificationScheduling;
  
  // Filtering
  filtering: NotificationFiltering;
  
  // Templates
  templates: NotificationTemplate[];
}

export interface MonitoringConfiguration {
  // Monitoring scope
  monitoringScope: MonitoringScope;
  
  // Health checks
  healthChecks: HealthCheckConfig[];
  
  // Performance monitoring
  performanceMonitoring: PerformanceMonitoringConfig;
  
  // Alert thresholds
  alertThresholds: AlertThreshold[];
  
  // Logging configuration
  loggingConfig: LoggingConfiguration;
  
  // Audit trail
  auditTrail: AuditTrailConfig;
  
  // Reporting
  reporting: ReportingConfiguration;
  
  // Dashboard settings
  dashboardSettings: DashboardSettings;
}

export interface ComplianceConfiguration {
  // Regulatory framework
  regulatoryFramework: RegulatoryFramework;
  
  // Compliance rules
  complianceRules: ComplianceRule[];
  
  // Audit requirements
  auditRequirements: AuditRequirements;
  
  // Record keeping
  recordKeeping: RecordKeepingConfig;
  
  // Reporting requirements
  reportingRequirements: ReportingRequirements;
  
  // Risk disclosure
  riskDisclosure: RiskDisclosureConfig;
  
  // Client categorization
  clientCategorization: ClientCategorization;
  
  // Best execution
  bestExecution: BestExecutionConfig;
  
  // Market conduct
  marketConduct: MarketConductConfig;
}

export interface PanelSettings {
  // Layout settings
  layoutSettings: LayoutSettings;
  
  // Theme settings
  themeSettings: ThemeSettings;
  
  // Accessibility settings
  accessibilitySettings: AccessibilitySettings;
  
  // Customization options
  customizationOptions: CustomizationOptions;
  
  // Workflow settings
  workflowSettings: WorkflowSettings;
  
  // Integration settings
  integrationSettings: IntegrationSettings;
  
  // Export settings
  exportSettings: ExportSettings;
  
  // Backup settings
  backupSettings: BackupSettings;
}

export interface AccessControl {
  // User permissions
  userPermissions: UserPermission[];
  
  // Role-based access
  roleBasedAccess: RoleBasedAccessConfig;
  
  // Session management
  sessionManagement: SessionManagementConfig;
  
  // Authentication settings
  authenticationSettings: AuthenticationSettings;
  
  // Authorization rules
  authorizationRules: AuthorizationRule[];
  
  // Audit logging
  auditLogging: AuditLoggingConfig;
}

// State and Hook Types
export interface AIAgentConfigPanelState {
  panels: Record<string, AIAgentConfigPanel>;
  currentPanelId: string | null;
  selectedAgentIds: string[];
  activeConfigurations: Record<string, AgentConfiguration>;
  
  // UI state
  expandedSections: Record<string, boolean>;
  selectedTabs: Record<string, string>;
  
  // Cache
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
  validationErrors: Record<string, ValidationError[]>;
}

export interface UseAIAgentConfigPanelReturn {
  // Data
  panels: AIAgentConfigPanel[];
  currentPanel: AIAgentConfigPanel | null;
  activeConfigurations: AgentConfiguration[];
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  isSaving: boolean;
  
  // Panel operations
  createPanel: (config: Omit<AIAgentConfigPanel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<AIAgentConfigPanel>;
  updatePanel: (id: string, updates: Partial<AIAgentConfigPanel>) => Promise<AIAgentConfigPanel>;
  deletePanel: (id: string) => Promise<void>;
  
  // Agent configuration operations
  createAgentConfig: (panelId: string, config: Omit<AgentConfiguration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AgentConfiguration>;
  updateAgentConfig: (panelId: string, agentId: string, updates: Partial<AgentConfiguration>) => Promise<AgentConfiguration>;
  deleteAgentConfig: (panelId: string, agentId: string) => Promise<void>;
  
  // Configuration management
  saveConfiguration: (panelId: string, agentId: string) => Promise<void>;
  loadConfiguration: (panelId: string, agentId: string) => Promise<AgentConfiguration>;
  resetConfiguration: (panelId: string, agentId: string) => Promise<void>;
  cloneConfiguration: (panelId: string, agentId: string, newName: string) => Promise<AgentConfiguration>;
  
  // Validation
  validateConfiguration: (config: AgentConfiguration) => ValidationResult;
  validatePanel: (panel: AIAgentConfigPanel) => ValidationResult;
  
  // Testing
  testConfiguration: (config: AgentConfiguration) => Promise<TestResult>;
  runBacktest: (config: AgentConfiguration, parameters: BacktestParameters) => Promise<BacktestResult>;
  
  // Deployment
  deployConfiguration: (config: AgentConfiguration) => Promise<DeploymentResult>;
  undeployConfiguration: (agentId: string) => Promise<void>;
  
  // Import/Export
  exportConfiguration: (agentId: string, format: ExportFormat) => Promise<string>;
  importConfiguration: (panelId: string, data: string, format: ImportFormat) => Promise<AgentConfiguration>;
  
  // Utility functions
  setCurrentPanel: (panelId: string | null) => void;
  refreshData: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Enums and Union Types
export type AgentType = 'trading' | 'analysis' | 'monitoring' | 'risk_management' | 'portfolio_management' | 'data_collection' | 'reporting' | 'compliance' | 'custom';
export type ExecutionMode = 'manual' | 'semi_automatic' | 'fully_automatic' | 'scheduled' | 'event_driven';
export type ExecutionFrequency = 'real_time' | 'tick' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | 'custom';
export type AgentStatus = 'active' | 'inactive' | 'paused' | 'error' | 'maintenance' | 'testing' | 'deploying';
export type StrategyType = 'trend_following' | 'mean_reversion' | 'arbitrage' | 'momentum' | 'value' | 'growth' | 'dividend' | 'sector_rotation' | 'pairs_trading' | 'statistical_arbitrage' | 'custom';
export type NotificationType = 'email' | 'sms' | 'push' | 'slack' | 'webhook' | 'dashboard' | 'audit_log';
export type DeliveryChannel = 'email' | 'sms' | 'push_notification' | 'slack' | 'teams' | 'webhook' | 'in_app';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical' | 'emergency';
export type RegulatoryFramework = 'ASIC' | 'FMA' | 'MAS' | 'CFTC' | 'SEC' | 'ESMA' | 'custom';
export type ExportFormat = 'json' | 'yaml' | 'xml' | 'csv' | 'excel' | 'pdf';
export type ImportFormat = 'json' | 'yaml' | 'xml' | 'csv' | 'excel';

// Supporting Types
export interface MarketScope {
  exchanges: string[];
  instruments: string[];
  sectors: string[];
  regions: string[];
  marketCap: MarketCapRange[];
}

export interface AssetScope {
  assetClasses: string[];
  symbols: string[];
  excludeSymbols: string[];
  filters: AssetFilter[];
}

export interface MarketCapRange {
  min: number;
  max: number;
  label: string;
}

export interface AssetFilter {
  filterType: string;
  criteria: any;
  isActive: boolean;
}

export interface TradingConfiguration {
  tradingHours: TradingHours;
  orderTypes: OrderType[];
  executionSettings: ExecutionSettings;
  brokerSettings: BrokerSettings;
}

export interface TradingHours {
  timezone: string;
  marketOpen: string;
  marketClose: string;
  extendedHours: boolean;
  holidays: string[];
}

export interface OrderType {
  type: string;
  isEnabled: boolean;
  parameters: Record<string, any>;
}

export interface ExecutionSettings {
  slippage: number;
  maxSlippage: number;
  timeInForce: string;
  minimumQuantity: number;
}

export interface BrokerSettings {
  brokerId: string;
  accountId: string;
  apiSettings: Record<string, any>;
}

export interface DataSourceConfiguration {
  sourceId: string;
  sourceType: string;
  connectionSettings: Record<string, any>;
  isEnabled: boolean;
  priority: number;
}

export interface IntegrationConfiguration {
  integrationId: string;
  integrationType: string;
  settings: Record<string, any>;
  isEnabled: boolean;
}

export interface CustomParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  value: any;
  description: string;
  isRequired: boolean;
  validation: ValidationRule;
}

export interface ValidationRule {
  type: string;
  parameters: Record<string, any>;
  errorMessage: string;
}

export interface EntryParameters {
  entryConditions: EntryCondition[];
  entryTiming: EntryTiming;
  entrySize: EntrySizeConfig;
  entryPrice: EntryPriceConfig;
}

export interface EntryCondition {
  conditionType: string;
  parameters: Record<string, any>;
  weight: number;
}

export interface EntryTiming {
  timingType: string;
  parameters: Record<string, any>;
}

export interface EntrySizeConfig {
  sizingMethod: string;
  parameters: Record<string, any>;
}

export interface EntryPriceConfig {
  priceType: string;
  parameters: Record<string, any>;
}

export interface ExitParameters {
  exitConditions: ExitCondition[];
  exitTiming: ExitTiming;
  exitSize: ExitSizeConfig;
  exitPrice: ExitPriceConfig;
}

export interface ExitCondition {
  conditionType: string;
  parameters: Record<string, any>;
  weight: number;
}

export interface ExitTiming {
  timingType: string;
  parameters: Record<string, any>;
}

export interface ExitSizeConfig {
  sizingMethod: string;
  parameters: Record<string, any>;
}

export interface ExitPriceConfig {
  priceType: string;
  parameters: Record<string, any>;
}

export interface PositionSizingConfig {
  sizingMethod: string;
  baseSize: number;
  maxSize: number;
  scalingFactor: number;
  riskAdjustment: boolean;
}

export interface RebalancingConfiguration {
  rebalanceFrequency: string;
  rebalanceThreshold: number;
  rebalanceMethod: string;
  rebalanceConstraints: RebalanceConstraint[];
}

export interface RebalanceConstraint {
  constraintType: string;
  parameters: Record<string, any>;
}

export interface SignalGenerationConfig {
  signalSources: SignalSource[];
  signalCombination: SignalCombination;
  signalFiltering: SignalFiltering;
  signalValidation: SignalValidation;
}

export interface SignalSource {
  sourceType: string;
  parameters: Record<string, any>;
  weight: number;
}

export interface SignalCombination {
  combinationMethod: string;
  parameters: Record<string, any>;
}

export interface SignalFiltering {
  filters: SignalFilter[];
}

export interface SignalFilter {
  filterType: string;
  parameters: Record<string, any>;
}

export interface SignalValidation {
  validationRules: SignalValidationRule[];
}

export interface SignalValidationRule {
  ruleType: string;
  parameters: Record<string, any>;
}

export interface TechnicalIndicatorConfig {
  indicatorType: string;
  parameters: Record<string, any>;
  weight: number;
  isEnabled: boolean;
}

export interface FundamentalAnalysisConfig {
  factors: FundamentalFactor[];
  scoring: FundamentalScoring;
  screening: FundamentalScreening;
}

export interface FundamentalFactor {
  factorType: string;
  parameters: Record<string, any>;
  weight: number;
}

export interface FundamentalScoring {
  scoringMethod: string;
  parameters: Record<string, any>;
}

export interface FundamentalScreening {
  screeningCriteria: ScreeningCriteria[];
}

export interface ScreeningCriteria {
  criteriaType: string;
  parameters: Record<string, any>;
}

export interface SentimentAnalysisConfig {
  sentimentSources: SentimentSource[];
  sentimentWeighting: SentimentWeighting;
  sentimentFiltering: SentimentFiltering;
}

export interface SentimentSource {
  sourceType: string;
  parameters: Record<string, any>;
  weight: number;
}

export interface SentimentWeighting {
  weightingMethod: string;
  parameters: Record<string, any>;
}

export interface SentimentFiltering {
  filters: SentimentFilter[];
}

export interface SentimentFilter {
  filterType: string;
  parameters: Record<string, any>;
}

export interface MachineLearningConfig {
  models: MLModel[];
  training: MLTraining;
  prediction: MLPrediction;
  validation: MLValidation;
}

export interface MLModel {
  modelType: string;
  parameters: Record<string, any>;
  weight: number;
}

export interface MLTraining {
  trainingData: MLTrainingData;
  trainingFrequency: string;
  trainingParameters: Record<string, any>;
}

export interface MLTrainingData {
  dataSources: string[];
  timeRange: string;
  features: string[];
}

export interface MLPrediction {
  predictionHorizon: string;
  predictionParameters: Record<string, any>;
}

export interface MLValidation {
  validationMethod: string;
  validationParameters: Record<string, any>;
}

export interface RiskLimits {
  maxPositionSize: number;
  maxPortfolioRisk: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxLeverage: number;
  maxConcentration: number;
}

export interface StopLossConfiguration {
  stopLossType: string;
  stopLossLevel: number;
  trailingStop: boolean;
  trailingStopDistance: number;
  timeBasedStop: boolean;
  timeBasedStopDuration: number;
}

export interface TakeProfitConfiguration {
  takeProfitType: string;
  takeProfitLevel: number;
  partialTakeProfit: boolean;
  partialTakeProfitLevels: number[];
  scalingOut: boolean;
  scalingOutParameters: Record<string, any>;
}

export interface PositionLimits {
  maxSinglePosition: number;
  maxSectorExposure: number;
  maxAssetClassExposure: number;
  maxCountryExposure: number;
  maxCurrencyExposure: number;
}

export interface DrawdownProtection {
  maxDrawdownLimit: number;
  drawdownPeriod: string;
  recoveryThreshold: number;
  emergencyStop: boolean;
  emergencyStopThreshold: number;
}

export interface VolatilityManagement {
  volatilityThreshold: number;
  volatilityAdjustment: boolean;
  positionSizeAdjustment: boolean;
  stopLossAdjustment: boolean;
}

export interface CorrelationLimits {
  maxCorrelation: number;
  correlationPeriod: string;
  correlationThreshold: number;
}

export interface SectorExposureLimits {
  maxSectorExposure: number;
  sectorLimits: SectorLimit[];
}

export interface SectorLimit {
  sector: string;
  limit: number;
}

export interface RiskAssessmentConfig {
  assessmentFrequency: string;
  riskMetrics: RiskMetric[];
  riskReporting: RiskReporting;
}

export interface RiskMetric {
  metricType: string;
  parameters: Record<string, any>;
  threshold: number;
}

export interface RiskReporting {
  reportFrequency: string;
  reportFormat: string;
  reportRecipients: string[];
}

export interface DecisionMakingConfig {
  decisionMethod: string;
  decisionCriteria: DecisionCriteria[];
  decisionThreshold: number;
  decisionTimeout: number;
}

export interface DecisionCriteria {
  criteriaType: string;
  parameters: Record<string, any>;
  weight: number;
}

export interface LearningBehaviorConfig {
  learningEnabled: boolean;
  learningMethod: string;
  learningFrequency: string;
  learningParameters: Record<string, any>;
}

export interface AdaptationSettings {
  adaptationEnabled: boolean;
  adaptationTriggers: AdaptationTrigger[];
  adaptationParameters: Record<string, any>;
}

export interface AdaptationTrigger {
  triggerType: string;
  parameters: Record<string, any>;
}

export interface ResponsePattern {
  patternType: string;
  trigger: string;
  response: string;
  parameters: Record<string, any>;
}

export interface ConflictResolutionConfig {
  conflictResolutionMethod: string;
  conflictResolutionParameters: Record<string, any>;
}

export interface ErrorHandlingConfig {
  errorHandlingMethod: string;
  errorRecovery: boolean;
  errorLogging: boolean;
  errorNotification: boolean;
}

export interface PerformanceAdjustmentConfig {
  adjustmentEnabled: boolean;
  adjustmentTriggers: AdjustmentTrigger[];
  adjustmentParameters: Record<string, any>;
}

export interface AdjustmentTrigger {
  triggerType: string;
  parameters: Record<string, any>;
}

export interface MarketConditionAdaptationConfig {
  adaptationEnabled: boolean;
  marketConditions: MarketCondition[];
  adaptationRules: AdaptationRule[];
}

export interface MarketCondition {
  conditionType: string;
  parameters: Record<string, any>;
}

export interface AdaptationRule {
  ruleType: string;
  parameters: Record<string, any>;
}

export interface PerformanceTargets {
  returnTarget: number;
  riskTarget: number;
  sharpeRatioTarget: number;
  maxDrawdownTarget: number;
  winRateTarget: number;
}

export interface BenchmarkingConfig {
  benchmarks: Benchmark[];
  benchmarkingFrequency: string;
  benchmarkingParameters: Record<string, any>;
}

export interface Benchmark {
  benchmarkType: string;
  benchmarkId: string;
  parameters: Record<string, any>;
}

export interface PerformanceMetricsConfig {
  metrics: PerformanceMetric[];
  calculationFrequency: string;
  reportingFrequency: string;
}

export interface PerformanceMetric {
  metricType: string;
  parameters: Record<string, any>;
}

export interface PerformanceMonitoringConfig {
  monitoringEnabled: boolean;
  monitoringFrequency: string;
  alertThresholds: PerformanceThreshold[];
}

export interface PerformanceThreshold {
  metricType: string;
  threshold: number;
  alertType: string;
}

export interface PerformanceOptimizationConfig {
  optimizationEnabled: boolean;
  optimizationMethod: string;
  optimizationFrequency: string;
  optimizationParameters: Record<string, any>;
}

export interface BacktestingConfiguration {
  backtestingEnabled: boolean;
  backtestingPeriod: string;
  backtestingFrequency: string;
  backtestingParameters: Record<string, any>;
}

export interface PaperTradingConfiguration {
  paperTradingEnabled: boolean;
  paperTradingPeriod: string;
  paperTradingParameters: Record<string, any>;
}

export interface LiveTradingConfiguration {
  liveTradingEnabled: boolean;
  liveTradingParameters: Record<string, any>;
}

export interface NotificationRule {
  ruleType: string;
  trigger: string;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
}

export interface NotificationCondition {
  conditionType: string;
  parameters: Record<string, any>;
}

export interface NotificationAction {
  actionType: string;
  parameters: Record<string, any>;
}

export interface NotificationScheduling {
  scheduleType: string;
  scheduleParameters: Record<string, any>;
}

export interface NotificationFiltering {
  filters: NotificationFilter[];
}

export interface NotificationFilter {
  filterType: string;
  parameters: Record<string, any>;
}

export interface NotificationTemplate {
  templateType: string;
  templateContent: string;
  templateParameters: Record<string, any>;
}

export interface MonitoringScope {
  monitoringAreas: string[];
  monitoringFrequency: string;
  monitoringParameters: Record<string, any>;
}

export interface HealthCheckConfig {
  healthCheckType: string;
  healthCheckFrequency: string;
  healthCheckParameters: Record<string, any>;
}

export interface AlertThreshold {
  thresholdType: string;
  thresholdValue: number;
  alertActions: AlertAction[];
}

export interface AlertAction {
  actionType: string;
  parameters: Record<string, any>;
}

export interface LoggingConfiguration {
  loggingLevel: string;
  loggingDestination: string;
  loggingFormat: string;
  loggingParameters: Record<string, any>;
}

export interface AuditTrailConfig {
  auditTrailEnabled: boolean;
  auditTrailLevel: string;
  auditTrailRetention: string;
  auditTrailParameters: Record<string, any>;
}

export interface ReportingConfiguration {
  reportingEnabled: boolean;
  reportingFrequency: string;
  reportingFormat: string;
  reportingParameters: Record<string, any>;
}

export interface DashboardSettings {
  dashboardLayout: string;
  dashboardWidgets: DashboardWidget[];
  dashboardParameters: Record<string, any>;
}

export interface DashboardWidget {
  widgetType: string;
  widgetParameters: Record<string, any>;
}

export interface ComplianceRule {
  ruleType: string;
  ruleParameters: Record<string, any>;
  isEnabled: boolean;
}

export interface AuditRequirements {
  auditFrequency: string;
  auditScope: string;
  auditParameters: Record<string, any>;
}

export interface RecordKeepingConfig {
  recordKeepingEnabled: boolean;
  recordKeepingPeriod: string;
  recordKeepingParameters: Record<string, any>;
}

export interface ReportingRequirements {
  reportingFrequency: string;
  reportingFormat: string;
  reportingParameters: Record<string, any>;
}

export interface RiskDisclosureConfig {
  riskDisclosureEnabled: boolean;
  riskDisclosureParameters: Record<string, any>;
}

export interface ClientCategorization {
  categorizationEnabled: boolean;
  categorizationParameters: Record<string, any>;
}

export interface BestExecutionConfig {
  bestExecutionEnabled: boolean;
  bestExecutionParameters: Record<string, any>;
}

export interface MarketConductConfig {
  marketConductEnabled: boolean;
  marketConductParameters: Record<string, any>;
}

export interface LayoutSettings {
  layoutType: string;
  layoutParameters: Record<string, any>;
}

export interface ThemeSettings {
  themeType: string;
  themeParameters: Record<string, any>;
}

export interface AccessibilitySettings {
  accessibilityEnabled: boolean;
  accessibilityParameters: Record<string, any>;
}

export interface CustomizationOptions {
  customizationEnabled: boolean;
  customizationParameters: Record<string, any>;
}

export interface WorkflowSettings {
  workflowType: string;
  workflowParameters: Record<string, any>;
}

export interface IntegrationSettings {
  integrations: Integration[];
}

export interface Integration {
  integrationType: string;
  integrationParameters: Record<string, any>;
}

export interface ExportSettings {
  exportFormats: string[];
  exportParameters: Record<string, any>;
}

export interface BackupSettings {
  backupEnabled: boolean;
  backupFrequency: string;
  backupParameters: Record<string, any>;
}

export interface UserPermission {
  userId: string;
  permissions: string[];
  accessLevel: string;
}

export interface RoleBasedAccessConfig {
  rolesEnabled: boolean;
  roles: Role[];
}

export interface Role {
  roleType: string;
  permissions: string[];
  accessLevel: string;
}

export interface SessionManagementConfig {
  sessionTimeout: number;
  sessionParameters: Record<string, any>;
}

export interface AuthenticationSettings {
  authenticationMethod: string;
  authenticationParameters: Record<string, any>;
}

export interface AuthorizationRule {
  ruleType: string;
  ruleParameters: Record<string, any>;
}

export interface AuditLoggingConfig {
  auditLoggingEnabled: boolean;
  auditLoggingParameters: Record<string, any>;
}

// Utility Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface TestResult {
  success: boolean;
  results: TestResultItem[];
  duration: number;
}

export interface TestResultItem {
  testType: string;
  result: string;
  details: any;
}

export interface BacktestParameters {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  parameters: Record<string, any>;
}

export interface BacktestResult {
  performance: PerformanceMetrics;
  trades: TradeRecord[];
  statistics: BacktestStatistics;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
}

export interface TradeRecord {
  entryDate: Date;
  exitDate: Date;
  symbol: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  profitPercent: number;
}

export interface BacktestStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  message: string;
  timestamp: Date;
}

export default AIAgentConfigPanel; 