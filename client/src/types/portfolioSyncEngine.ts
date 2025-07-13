// Block 78: Portfolio Sync Engine - Types
// Real-time Portfolio Synchronization with External Brokers

export interface PortfolioSyncEngine {
  id: string;
  userId: string;
  
  // Sync engine identification
  engineName: string;
  description?: string;
  
  // Configuration
  syncConfig: SyncConfiguration;
  
  // Connected brokers
  brokerConnections: BrokerConnection[];
  
  // Sync status
  syncStatus: SyncStatus;
  lastSyncAttempt: Date;
  lastSuccessfulSync: Date;
  
  // Sync history
  syncHistory: SyncRecord[];
  
  // Conflict resolution
  conflictResolution: ConflictResolutionSettings;
  
  // Error handling
  errorHandling: ErrorHandlingSettings;
  
  // Performance metrics
  performanceMetrics: SyncPerformanceMetrics;
  
  // Scheduling
  syncSchedule: SyncSchedule;
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncConfiguration {
  // Sync modes
  syncMode: SyncMode;
  direction: SyncDirection;
  frequency: SyncFrequency;
  
  // Real-time settings
  enableRealTimeSync: boolean;
  realTimeSyncInterval: number; // milliseconds
  
  // Batch settings
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // milliseconds
  
  // Data synchronization
  syncHoldings: boolean;
  syncTransactions: boolean;
  syncBalances: boolean;
  syncDividends: boolean;
  syncCorporateActions: boolean;
  
  // Filtering
  syncFilters: SyncFilter[];
  
  // Validation
  enableValidation: boolean;
  validationRules: ValidationRule[];
  
  // AU/NZ specific
  enableAUNZTaxSync: boolean;
  syncFrankingCredits: boolean; // AU
  syncFIFTaxCalculations: boolean; // NZ
  
  // Notifications
  notifyOnSync: boolean;
  notifyOnErrors: boolean;
  notificationChannels: NotificationChannel[];
}

export type SyncMode = 'manual' | 'automatic' | 'scheduled' | 'real_time';
export type SyncDirection = 'pull' | 'push' | 'bidirectional';
export type SyncFrequency = 'continuous' | 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface SyncFilter {
  filterType: SyncFilterType;
  filterValue: string;
  isEnabled: boolean;
  
  // Filter conditions
  conditions: FilterCondition[];
}

export type SyncFilterType = 
  | 'asset_class'
  | 'sector'
  | 'market_cap'
  | 'holding_value'
  | 'transaction_type'
  | 'date_range'
  | 'account_type'
  | 'currency';

export interface FilterCondition {
  operator: FilterOperator;
  value: string | number | Date;
  logicalOperator?: LogicalOperator;
}

export type FilterOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'in_range';
export type LogicalOperator = 'AND' | 'OR';

export interface ValidationRule {
  ruleId: string;
  ruleName: string;
  ruleType: ValidationRuleType;
  
  // Rule configuration
  isEnabled: boolean;
  severity: ValidationSeverity;
  
  // Rule logic
  conditions: ValidationCondition[];
  
  // Actions
  onViolation: ValidationAction[];
}

export type ValidationRuleType = 
  | 'balance_consistency'
  | 'holding_validation'
  | 'transaction_integrity'
  | 'duplicate_detection'
  | 'data_completeness'
  | 'price_validation'
  | 'tax_calculation'
  | 'currency_consistency';

export type ValidationSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ValidationCondition {
  field: string;
  operator: FilterOperator;
  expectedValue: any;
  tolerance?: number; // For numeric comparisons
}

export interface ValidationAction {
  actionType: ValidationActionType;
  actionConfig: Record<string, any>;
}

export type ValidationActionType = 
  | 'log_warning'
  | 'send_notification'
  | 'skip_record'
  | 'mark_for_review'
  | 'auto_correct'
  | 'escalate_error';

export interface BrokerConnection {
  id: string;
  brokerName: string;
  brokerType: BrokerType;
  
  // Connection details
  connectionConfig: BrokerConnectionConfig;
  connectionStatus: ConnectionStatus;
  
  // Authentication
  authConfig: AuthenticationConfig;
  
  // API configuration
  apiConfig: APIConfiguration;
  
  // Sync settings
  syncSettings: BrokerSyncSettings;
  
  // Performance
  connectionMetrics: ConnectionMetrics;
  
  // AU/NZ specific
  jurisdiction: 'AU' | 'NZ';
  regulatoryCompliance: RegulatoryCompliance;
  
  // Status
  isActive: boolean;
  lastConnected: Date;
  lastDataReceived: Date;
}

export type BrokerType = 
  | 'full_service'
  | 'discount'
  | 'robo_advisor'
  | 'crypto_exchange'
  | 'bank_broker'
  | 'selfwealth'
  | 'commsec'
  | 'nabtrade'
  | 'westpac'
  | 'anz'
  | 'asb_securities'
  | 'kiwibank'
  | 'sharesight'
  | 'stake'
  | 'tiger'
  | 'interactive_brokers';

export interface BrokerConnectionConfig {
  // Connection parameters
  baseUrl: string;
  apiVersion: string;
  timeout: number;
  
  // Rate limiting
  rateLimits: RateLimit[];
  
  // Connection pooling
  maxConnections: number;
  connectionTimeout: number;
  
  // SSL/Security
  sslVerification: boolean;
  certificatePath?: string;
  
  // Proxy settings
  proxyConfig?: ProxyConfig;
}

export interface RateLimit {
  endpoint: string;
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
}

export type ConnectionStatus = 
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error'
  | 'rate_limited'
  | 'maintenance'
  | 'suspended';

export interface AuthenticationConfig {
  authType: AuthenticationType;
  credentials: AuthCredentials;
  
  // Token management
  tokenConfig?: TokenConfig;
  
  // OAuth settings
  oauthConfig?: OAuthConfig;
  
  // Security
  encryptCredentials: boolean;
  
  // Expiration
  credentialExpiry?: Date;
  refreshRequired: boolean;
}

export type AuthenticationType = 
  | 'api_key'
  | 'oauth2'
  | 'basic_auth'
  | 'bearer_token'
  | 'certificate'
  | 'session_based';

export interface AuthCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  
  // AU/NZ specific
  tfn?: string; // Tax File Number (AU)
  ird?: string; // IRD Number (NZ)
  accountNumber?: string;
}

export interface TokenConfig {
  tokenEndpoint: string;
  refreshEndpoint: string;
  tokenExpiry: number; // seconds
  refreshThreshold: number; // seconds before expiry
  autoRefresh: boolean;
}

export interface OAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
}

export interface APIConfiguration {
  // Endpoints
  endpoints: APIEndpoint[];
  
  // Data formats
  requestFormat: DataFormat;
  responseFormat: DataFormat;
  
  // Pagination
  paginationConfig: PaginationConfig;
  
  // Error handling
  errorMapping: ErrorMapping[];
  
  // Field mapping
  fieldMapping: FieldMapping[];
}

export interface APIEndpoint {
  name: string;
  path: string;
  method: HTTPMethod;
  description: string;
  
  // Parameters
  requiredParams: string[];
  optionalParams: string[];
  
  // Headers
  requiredHeaders: string[];
  customHeaders: Record<string, string>;
  
  // Response
  responseFields: string[];
  
  // Rate limiting
  rateLimitTier: string;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type DataFormat = 'json' | 'xml' | 'csv' | 'form_data' | 'binary';

export interface PaginationConfig {
  type: PaginationType;
  pageSize: number;
  maxPages: number;
  
  // Parameter names
  pageParam: string;
  limitParam: string;
  offsetParam: string;
  
  // Response fields
  totalField: string;
  pageField: string;
  dataField: string;
}

export type PaginationType = 'offset' | 'page' | 'cursor' | 'none';

export interface ErrorMapping {
  brokerErrorCode: string;
  brokerErrorMessage: string;
  internalErrorCode: string;
  internalErrorMessage: string;
  severity: ValidationSeverity;
  retryable: boolean;
}

export interface FieldMapping {
  internalField: string;
  brokerField: string;
  dataType: FieldDataType;
  
  // Transformation
  transformation?: FieldTransformation;
  
  // Validation
  isRequired: boolean;
  validation?: FieldValidation;
}

export type FieldDataType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

export interface FieldTransformation {
  type: TransformationType;
  config: Record<string, any>;
}

export type TransformationType = 
  | 'format_date'
  | 'convert_currency'
  | 'normalize_text'
  | 'map_values'
  | 'calculate_field'
  | 'split_field'
  | 'combine_fields';

export interface FieldValidation {
  rules: ValidationRule[];
  onFailure: ValidationAction[];
}

export interface BrokerSyncSettings {
  // Sync preferences
  syncPriority: SyncPriority;
  dataTypes: SyncDataType[];
  
  // Timing
  syncWindow: SyncWindow;
  excludedDays: string[]; // Day names
  
  // Conflict resolution
  conflictStrategy: ConflictStrategy;
  
  // Performance
  batchSize: number;
  parallelSyncs: number;
  
  // Monitoring
  enableMonitoring: boolean;
  alertThresholds: AlertThreshold[];
}

export type SyncPriority = 'low' | 'normal' | 'high' | 'critical';

export type SyncDataType = 
  | 'holdings'
  | 'transactions'
  | 'balances'
  | 'dividends'
  | 'corporate_actions'
  | 'tax_documents'
  | 'account_info'
  | 'market_data'
  | 'orders'
  | 'positions';

export interface SyncWindow {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
  
  // Market hours alignment
  alignWithMarketHours: boolean;
  marketHours: MarketHours[];
}

export interface MarketHours {
  market: string; // ASX, NZX, NYSE, etc.
  openTime: string;
  closeTime: string;
  timezone: string;
  tradingDays: string[];
}

export type ConflictStrategy = 
  | 'broker_wins'
  | 'internal_wins'
  | 'merge'
  | 'manual_review'
  | 'timestamp_based'
  | 'value_based';

export interface AlertThreshold {
  metric: AlertMetric;
  threshold: number;
  comparison: AlertComparison;
  action: AlertAction;
}

export type AlertMetric = 
  | 'sync_duration'
  | 'error_rate'
  | 'data_variance'
  | 'connection_failures'
  | 'validation_failures'
  | 'record_count_change';

export type AlertComparison = 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';

export interface AlertAction {
  actionType: AlertActionType;
  recipients: string[];
  message: string;
  escalation: boolean;
}

export type AlertActionType = 'email' | 'sms' | 'push' | 'webhook' | 'log' | 'disable_sync';

export interface ConnectionMetrics {
  // Performance metrics
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  
  // Volume metrics
  requestsPerHour: number;
  dataVolumePerHour: number; // MB
  
  // Reliability metrics
  uptime: number; // percentage
  lastDowntime: Date;
  downtimeReason: string;
  
  // Recent activity
  recentRequests: RequestMetric[];
  
  // Limits
  rateLimitStatus: RateLimitStatus;
}

export interface RequestMetric {
  timestamp: Date;
  endpoint: string;
  method: HTTPMethod;
  responseTime: number;
  statusCode: number;
  success: boolean;
  errorMessage?: string;
}

export interface RateLimitStatus {
  endpoint: string;
  current: number;
  limit: number;
  resetTime: Date;
  isThrottled: boolean;
}

export interface RegulatoryCompliance {
  // Compliance requirements
  requirements: ComplianceRequirement[];
  
  // Reporting
  reportingRequired: boolean;
  reportingFrequency: ReportingFrequency;
  
  // Data retention
  dataRetentionPeriod: number; // days
  
  // Privacy
  privacyCompliance: PrivacyCompliance;
  
  // Audit
  auditRequired: boolean;
  auditFrequency: AuditFrequency;
}

export interface ComplianceRequirement {
  requirementId: string;
  requirementName: string;
  jurisdiction: 'AU' | 'NZ';
  regulatoryBody: string;
  description: string;
  isActive: boolean;
  lastChecked: Date;
  complianceStatus: ComplianceStatus;
}

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'under_review' | 'not_applicable';
export type ReportingFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
export type AuditFrequency = 'monthly' | 'quarterly' | 'annually';

export interface PrivacyCompliance {
  gdprCompliant: boolean;
  privacyActCompliant: boolean; // AU Privacy Act
  nzPrivacyActCompliant: boolean; // NZ Privacy Act
  
  // Data handling
  dataMinimization: boolean;
  purposeLimitation: boolean;
  storageLocation: string;
  encryptionRequired: boolean;
}

export interface SyncStatus {
  // Overall status
  overallStatus: SyncStatusType;
  statusMessage: string;
  
  // Current operation
  currentOperation?: SyncOperation;
  
  // Progress
  progress: SyncProgress;
  
  // Statistics
  stats: SyncStatistics;
  
  // Issues
  activeIssues: SyncIssue[];
  
  // Last sync details
  lastSyncSummary: SyncSummary;
}

export type SyncStatusType = 
  | 'idle'
  | 'syncing'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled'
  | 'scheduled'
  | 'rate_limited'
  | 'maintenance';

export interface SyncOperation {
  operationId: string;
  operationType: SyncOperationType;
  startTime: Date;
  estimatedCompletion: Date;
  brokerId: string;
  dataType: SyncDataType;
  
  // Progress
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  
  // Status
  status: SyncStatusType;
  currentStep: string;
}

export type SyncOperationType = 
  | 'full_sync'
  | 'incremental_sync'
  | 'delta_sync'
  | 'reconciliation'
  | 'validation'
  | 'cleanup';

export interface SyncProgress {
  // Overall progress
  overallProgress: number; // 0-100
  
  // Broker-specific progress
  brokerProgress: BrokerProgress[];
  
  // Data type progress
  dataTypeProgress: DataTypeProgress[];
  
  // Estimated completion
  estimatedCompletion: Date;
  estimatedDuration: number; // seconds
}

export interface BrokerProgress {
  brokerId: string;
  brokerName: string;
  progress: number; // 0-100
  status: SyncStatusType;
  recordsProcessed: number;
  recordsTotal: number;
  lastActivity: Date;
}

export interface DataTypeProgress {
  dataType: SyncDataType;
  progress: number; // 0-100
  recordsProcessed: number;
  recordsTotal: number;
  errors: number;
}

export interface SyncStatistics {
  // Sync counts
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  
  // Record counts
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  deletedRecords: number;
  duplicateRecords: number;
  
  // Performance
  avgSyncDuration: number; // seconds
  avgRecordsPerSecond: number;
  
  // Data volume
  totalDataSynced: number; // MB
  
  // Time periods
  lastHour: PeriodStats;
  lastDay: PeriodStats;
  lastWeek: PeriodStats;
  lastMonth: PeriodStats;
}

export interface PeriodStats {
  syncCount: number;
  recordCount: number;
  errorCount: number;
  dataVolume: number; // MB
  avgDuration: number; // seconds
}

export interface SyncIssue {
  issueId: string;
  issueType: SyncIssueType;
  severity: ValidationSeverity;
  
  // Issue details
  title: string;
  description: string;
  brokerId?: string;
  dataType?: SyncDataType;
  
  // Occurrence
  firstOccurrence: Date;
  lastOccurrence: Date;
  occurrenceCount: number;
  
  // Resolution
  status: IssueStatus;
  resolutionSteps: string[];
  resolvedAt?: Date;
  
  // Impact
  impactLevel: ImpactLevel;
  affectedRecords: number;
}

export type SyncIssueType = 
  | 'connection_error'
  | 'authentication_error'
  | 'api_error'
  | 'data_validation_error'
  | 'rate_limit_exceeded'
  | 'timeout'
  | 'data_conflict'
  | 'mapping_error'
  | 'compliance_violation';

export type IssueStatus = 'open' | 'investigating' | 'resolved' | 'ignored';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SyncSummary {
  syncId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  
  // Results
  status: SyncStatusType;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  
  // Data breakdown
  dataTypeSummary: DataTypeSyncSummary[];
  
  // Broker breakdown
  brokerSummary: BrokerSyncSummary[];
  
  // Issues
  issuesEncountered: SyncIssue[];
  
  // Performance
  performanceMetrics: SyncPerformanceMetrics;
}

export interface DataTypeSyncSummary {
  dataType: SyncDataType;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  duration: number; // seconds
  issues: SyncIssue[];
}

export interface BrokerSyncSummary {
  brokerId: string;
  brokerName: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  duration: number; // seconds
  issues: SyncIssue[];
}

export interface SyncRecord {
  id: string;
  syncId: string;
  
  // Sync details
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  
  // Configuration
  syncMode: SyncMode;
  brokersInvolved: string[];
  dataTypesInvolved: SyncDataType[];
  
  // Results
  status: SyncStatusType;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  
  // Performance
  avgProcessingTime: number; // ms per record
  dataVolume: number; // MB
  
  // Issues
  issuesCount: number;
  criticalIssuesCount: number;
  
  // Metadata
  triggeredBy: SyncTrigger;
  triggeredAt: Date;
  completedAt: Date;
}

export type SyncTrigger = 'manual' | 'scheduled' | 'real_time' | 'event_based' | 'api_call';

export interface ConflictResolutionSettings {
  // Default strategy
  defaultStrategy: ConflictStrategy;
  
  // Data type specific strategies
  dataTypeStrategies: DataTypeConflictStrategy[];
  
  // Field specific strategies
  fieldStrategies: FieldConflictStrategy[];
  
  // Automatic resolution
  enableAutoResolution: boolean;
  autoResolutionThreshold: number; // confidence percentage
  
  // Manual review
  requireManualReview: boolean;
  manualReviewThreshold: number; // confidence percentage
  
  // Escalation
  enableEscalation: boolean;
  escalationCriteria: EscalationCriteria[];
}

export interface DataTypeConflictStrategy {
  dataType: SyncDataType;
  strategy: ConflictStrategy;
  confidence: number; // 0-100
}

export interface FieldConflictStrategy {
  fieldName: string;
  strategy: ConflictStrategy;
  conditions: ConflictCondition[];
}

export interface ConflictCondition {
  conditionType: ConflictConditionType;
  value: any;
  operator: FilterOperator;
}

export type ConflictConditionType = 
  | 'value_difference'
  | 'timestamp_difference'
  | 'source_priority'
  | 'data_quality'
  | 'validation_score';

export interface EscalationCriteria {
  criteriaType: EscalationCriteriaType;
  threshold: number;
  action: EscalationAction;
}

export type EscalationCriteriaType = 
  | 'conflict_count'
  | 'value_difference'
  | 'critical_field'
  | 'multiple_conflicts'
  | 'validation_failure';

export interface EscalationAction {
  actionType: EscalationActionType;
  recipients: string[];
  message: string;
  priority: AlertPriority;
}

export type EscalationActionType = 'notify' | 'pause_sync' | 'create_ticket' | 'escalate_to_admin';
export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ErrorHandlingSettings {
  // Retry settings
  retryPolicy: RetryPolicy;
  
  // Error classification
  errorClassification: ErrorClassification[];
  
  // Fallback strategies
  fallbackStrategies: FallbackStrategy[];
  
  // Circuit breaker
  enableCircuitBreaker: boolean;
  circuitBreakerConfig: CircuitBreakerConfig;
  
  // Error reporting
  errorReporting: ErrorReportingConfig;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffStrategy: BackoffStrategy;
  retryableErrors: string[];
}

export type BackoffStrategy = 'fixed' | 'exponential' | 'linear' | 'random';

export interface ErrorClassification {
  errorPattern: string;
  errorType: ErrorType;
  severity: ValidationSeverity;
  retryable: boolean;
  action: ErrorAction;
}

export type ErrorType = 
  | 'connection_error'
  | 'authentication_error'
  | 'rate_limit_error'
  | 'data_error'
  | 'validation_error'
  | 'system_error'
  | 'business_logic_error';

export interface ErrorAction {
  actionType: ErrorActionType;
  actionConfig: Record<string, any>;
}

export type ErrorActionType = 
  | 'retry'
  | 'skip'
  | 'fallback'
  | 'alert'
  | 'escalate'
  | 'stop_sync';

export interface FallbackStrategy {
  errorType: ErrorType;
  fallbackType: FallbackType;
  fallbackConfig: Record<string, any>;
}

export type FallbackType = 
  | 'cached_data'
  | 'alternative_source'
  | 'manual_data'
  | 'estimated_data'
  | 'skip_field'
  | 'default_value';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeoutDuration: number; // milliseconds
  recoveryTimeout: number; // milliseconds
  halfOpenMaxCalls: number;
}

export interface ErrorReportingConfig {
  enableReporting: boolean;
  reportingChannels: NotificationChannel[];
  errorAggregation: ErrorAggregationConfig;
  
  // Sensitivity
  reportCriticalImmediately: boolean;
  batchNonCriticalErrors: boolean;
  batchSize: number;
  batchTimeout: number; // minutes
}

export interface ErrorAggregationConfig {
  aggregationWindow: number; // minutes
  duplicateDetection: boolean;
  errorGrouping: ErrorGrouping[];
}

export interface ErrorGrouping {
  groupBy: ErrorGroupingField;
  threshold: number;
  action: string;
}

export type ErrorGroupingField = 'error_type' | 'broker_id' | 'data_type' | 'error_message';

export interface SyncPerformanceMetrics {
  // Throughput
  recordsPerSecond: number;
  bytesPerSecond: number;
  
  // Latency
  avgResponseTime: number; // milliseconds
  p95ResponseTime: number; // milliseconds
  p99ResponseTime: number; // milliseconds
  
  // Efficiency
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  networkUsage: number; // KB/s
  
  // Quality
  dataQualityScore: number; // 0-100
  validationPassRate: number; // percentage
  
  // Reliability
  syncSuccessRate: number; // percentage
  connectionStability: number; // percentage
  
  // Trends
  performanceTrends: PerformanceTrend[];
}

export interface PerformanceTrend {
  metric: string;
  trend: TrendDirection;
  changePercentage: number;
  period: string;
}

export type TrendDirection = 'improving' | 'degrading' | 'stable';

export interface SyncSchedule {
  // Schedule configuration
  isEnabled: boolean;
  scheduleType: ScheduleType;
  
  // Timing
  cronExpression?: string;
  interval?: number; // minutes
  
  // Recurrence
  recurrencePattern: RecurrencePattern;
  
  // Execution window
  executionWindow: ExecutionWindow;
  
  // Conditions
  executionConditions: ExecutionCondition[];
  
  // Next execution
  nextExecution: Date;
  lastExecution: Date;
}

export type ScheduleType = 'cron' | 'interval' | 'fixed_time' | 'market_based' | 'event_driven';

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: string[];
  daysOfMonth: number[];
  months: string[];
  
  // Exceptions
  exceptions: Date[];
  holidays: Holiday[];
}

export type RecurrenceFrequency = 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Holiday {
  date: Date;
  name: string;
  country: string;
  skipSync: boolean;
}

export interface ExecutionWindow {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string;
  
  // Market alignment
  alignWithMarketHours: boolean;
  markets: string[];
  
  // Blackout periods
  blackoutPeriods: BlackoutPeriod[];
}

export interface BlackoutPeriod {
  startTime: string;
  endTime: string;
  reason: string;
  recurring: boolean;
}

export interface ExecutionCondition {
  conditionType: ExecutionConditionType;
  conditionValue: any;
  operator: FilterOperator;
}

export type ExecutionConditionType = 
  | 'market_open'
  | 'market_close'
  | 'data_availability'
  | 'system_load'
  | 'error_rate'
  | 'manual_approval';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook' | 'slack' | 'teams';

// Filter and search interfaces
export interface PortfolioSyncFilter {
  syncStatus?: SyncStatusType[];
  brokerTypes?: BrokerType[];
  syncModes?: SyncMode[];
  dataTypes?: SyncDataType[];
  
  // Date filters
  lastSyncAfter?: Date;
  lastSyncBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  
  // Performance filters
  errorRateThreshold?: number;
  syncDurationThreshold?: number;
  
  // Status filters
  hasActiveIssues?: boolean;
  hasConnectedBrokers?: boolean;
  
  // Search
  searchTerm?: string;
}

// API interfaces
export interface SyncEngineResponse {
  success: boolean;
  engine?: PortfolioSyncEngine;
  errors?: string[];
  warnings?: string[];
}

export interface SyncEngineListResponse {
  engines: PortfolioSyncEngine[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SyncOperationRequest {
  engineId: string;
  operationType: SyncOperationType;
  brokerIds?: string[];
  dataTypes?: SyncDataType[];
  
  // Options
  forceSync?: boolean;
  validateOnly?: boolean;
  dryRun?: boolean;
  
  // Filters
  syncFilters?: SyncFilter[];
  
  // Notifications
  notifyOnCompletion?: boolean;
  notificationChannels?: NotificationChannel[];
}

export interface SyncOperationResponse {
  success: boolean;
  operationId?: string;
  status?: SyncStatusType;
  estimatedCompletion?: Date;
  errors?: string[];
  warnings?: string[];
}

// Hook return interface
export interface UsePortfolioSyncEngineReturn {
  // Data
  engines: PortfolioSyncEngine[];
  currentEngine: PortfolioSyncEngine | null;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  isConnecting: boolean;
  
  // Engine operations
  createEngine: (config: Omit<PortfolioSyncEngine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<PortfolioSyncEngine>;
  updateEngine: (id: string, updates: Partial<PortfolioSyncEngine>) => Promise<PortfolioSyncEngine>;
  deleteEngine: (id: string) => Promise<void>;
  
  // Sync operations
  startSync: (request: SyncOperationRequest) => Promise<SyncOperationResponse>;
  pauseSync: (engineId: string) => Promise<void>;
  resumeSync: (engineId: string) => Promise<void>;
  cancelSync: (engineId: string) => Promise<void>;
  
  // Broker operations
  connectBroker: (engineId: string, brokerConfig: BrokerConnection) => Promise<BrokerConnection>;
  disconnectBroker: (engineId: string, brokerId: string) => Promise<void>;
  testBrokerConnection: (brokerId: string) => Promise<boolean>;
  
  // Monitoring
  getSyncStatus: (engineId: string) => SyncStatus;
  getSyncHistory: (engineId: string, limit?: number) => SyncRecord[];
  getActiveIssues: (engineId: string) => SyncIssue[];
  
  // Conflict resolution
  resolveConflict: (conflictId: string, resolution: ConflictStrategy) => Promise<void>;
  getPendingConflicts: (engineId: string) => SyncConflict[];
  
  // Filtering and search
  filterEngines: (filter: PortfolioSyncFilter) => void;
  searchEngines: (query: string) => void;
  
  // Real-time monitoring
  startMonitoring: (engineId: string) => void;
  stopMonitoring: (engineId: string) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export interface SyncConflict {
  conflictId: string;
  engineId: string;
  brokerId: string;
  dataType: SyncDataType;
  
  // Conflict details
  field: string;
  internalValue: any;
  brokerValue: any;
  
  // Metadata
  timestamp: Date;
  recordId: string;
  
  // Resolution
  suggestedResolution: ConflictStrategy;
  confidence: number; // 0-100
  
  // Status
  status: ConflictResolutionStatus;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type ConflictResolutionStatus = 'pending' | 'resolved' | 'escalated' | 'ignored';

// Store state interface
export interface PortfolioSyncEngineState {
  // Data
  engines: Record<string, PortfolioSyncEngine>;
  
  // Current engine
  currentEngineId: string | null;
  
  // UI state
  activeFilter: PortfolioSyncFilter;
  searchQuery: string;
  selectedEngineIds: string[];
  
  // Sync state
  syncOperations: Record<string, SyncOperation>;
  
  // Monitoring state
  monitoringEngines: Record<string, boolean>;
  
  // Broker connections
  brokerConnections: Record<string, BrokerConnection>;
  
  // Conflicts
  pendingConflicts: Record<string, SyncConflict[]>;
  
  // Cache management
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
} 