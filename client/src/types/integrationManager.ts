// Block 81: Integration Manager - Types
// External API Integrations and Data Feed Management

export interface IntegrationManager {
  id: string;
  userId: string;
  
  // Manager identification
  managerName: string;
  description?: string;
  
  // Configuration
  integrationConfig: IntegrationConfiguration;
  
  // Connected integrations
  integrations: Integration[];
  
  // Status and monitoring
  managerStatus: ManagerStatus;
  lastHealthCheck: Date;
  
  // Performance metrics
  performanceMetrics: IntegrationPerformanceMetrics;
  
  // Error handling
  errorHandling: IntegrationErrorHandling;
  
  // Security settings
  securityConfig: SecurityConfiguration;
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfiguration {
  // Global settings
  maxConcurrentConnections: number;
  defaultTimeout: number; // milliseconds
  retryPolicy: RetryPolicy;
  
  // Rate limiting
  globalRateLimit: RateLimit;
  
  // Monitoring
  enableHealthChecks: boolean;
  healthCheckInterval: number; // seconds
  
  // Caching
  enableCaching: boolean;
  cacheConfig: CacheConfiguration;
  
  // Logging
  loggingLevel: LoggingLevel;
  logRetentionDays: number;
  
  // Notifications
  notificationChannels: NotificationChannel[];
  
  // AU/NZ specific
  enableAUNZCompliance: boolean;
  auNzDataSovereignty: DataSovereigntyConfig;
}

export type LoggingLevel = 'debug' | 'info' | 'warn' | 'error';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook' | 'slack';

export interface Integration {
  id: string;
  managerId: string;
  
  // Integration identification
  integrationName: string;
  integrationType: IntegrationType;
  provider: IntegrationProvider;
  
  // Configuration
  config: IntegrationConfig;
  
  // Connection details
  connectionInfo: ConnectionInfo;
  
  // Status
  status: IntegrationStatus;
  isEnabled: boolean;
  
  // Data flow
  dataFlow: DataFlowConfig;
  
  // Monitoring
  monitoringConfig: MonitoringConfig;
  
  // Security
  securitySettings: IntegrationSecurity;
  
  // Performance
  performanceMetrics: IntegrationMetrics;
  
  // AU/NZ specific
  jurisdiction?: 'AU' | 'NZ';
  complianceSettings?: ComplianceSettings;
  
  // Metadata
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationType = 
  | 'broker_api'
  | 'market_data'
  | 'news_feed'
  | 'economic_data'
  | 'tax_service'
  | 'bank_api'
  | 'crypto_exchange'
  | 'data_vendor'
  | 'social_sentiment'
  | 'webhook'
  | 'file_import'
  | 'database'
  | 'custom';

export type IntegrationProvider = 
  | 'commsec'
  | 'nabtrade'
  | 'westpac'
  | 'anz'
  | 'asb_securities'
  | 'sharesight'
  | 'yahoo_finance'
  | 'alpha_vantage'
  | 'iex_cloud'
  | 'quandl'
  | 'reuters'
  | 'bloomberg'
  | 'ato_business_portal' // AU Tax Office
  | 'ird_services' // NZ IRD
  | 'rba_data' // Reserve Bank of Australia
  | 'rbnz_data' // Reserve Bank of New Zealand
  | 'asx_data'
  | 'nzx_data'
  | 'custom';

export interface IntegrationConfig {
  // Endpoint configuration
  baseUrl: string;
  apiVersion?: string;
  endpoints: EndpointConfig[];
  
  // Authentication
  authConfig: AuthenticationConfig;
  
  // Request configuration
  requestConfig: RequestConfiguration;
  
  // Response handling
  responseConfig: ResponseConfiguration;
  
  // Error handling
  errorConfig: ErrorConfiguration;
  
  // Rate limiting
  rateLimits: RateLimit[];
  
  // Data transformation
  transformationRules: TransformationRule[];
  
  // Validation rules
  validationRules: ValidationRule[];
}

export interface EndpointConfig {
  name: string;
  path: string;
  method: HTTPMethod;
  description?: string;
  
  // Parameters
  requiredParams?: string[];
  optionalParams?: string[];
  
  // Headers
  customHeaders?: Record<string, string>;
  
  // Response format
  responseFormat: DataFormat;
  
  // Rate limiting
  rateLimitTier?: string;
  
  // Caching
  cacheable?: boolean;
  cacheExpiry?: number; // seconds
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type DataFormat = 'json' | 'xml' | 'csv' | 'text' | 'binary';

export interface ConnectionInfo {
  // Connection details
  connectionId: string;
  connectionUrl: string;
  
  // Connection status
  isConnected: boolean;
  lastConnected: Date;
  lastDisconnected?: Date;
  
  // Connection metrics
  connectionCount: number;
  totalUptime: number; // seconds
  
  // Health status
  healthStatus: HealthStatus;
  lastHealthCheck: Date;
  
  // Network info
  ipAddress?: string;
  region?: string;
  
  // SSL/TLS info
  sslInfo?: SSLInfo;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface SSLInfo {
  isSecure: boolean;
  certificateExpiry?: Date;
  certificateIssuer?: string;
  tlsVersion?: string;
}

export type IntegrationStatus = 
  | 'active'
  | 'inactive'
  | 'connecting'
  | 'disconnected'
  | 'error'
  | 'maintenance'
  | 'rate_limited'
  | 'suspended';

export interface DataFlowConfig {
  // Flow direction
  direction: DataFlowDirection;
  
  // Data types
  dataTypes: DataType[];
  
  // Sync configuration
  syncMode: SyncMode;
  syncFrequency: SyncFrequency;
  
  // Batch processing
  batchSize: number;
  batchTimeout: number; // seconds
  
  // Data filtering
  filters: DataFilter[];
  
  // Data mapping
  fieldMappings: FieldMapping[];
  
  // Quality controls
  qualityChecks: DataQualityCheck[];
}

export type DataFlowDirection = 'inbound' | 'outbound' | 'bidirectional';
export type SyncMode = 'real_time' | 'batch' | 'scheduled' | 'manual';
export type SyncFrequency = 'continuous' | 'minutely' | 'hourly' | 'daily' | 'weekly';

export type DataType = 
  | 'market_prices'
  | 'portfolio_holdings'
  | 'transactions'
  | 'news_articles'
  | 'economic_indicators'
  | 'company_financials'
  | 'dividends'
  | 'corporate_actions'
  | 'tax_documents'
  | 'account_statements'
  | 'order_status'
  | 'social_sentiment'
  | 'custom';

export interface DataFilter {
  filterType: FilterType;
  field: string;
  operator: FilterOperator;
  value: any;
  isEnabled: boolean;
}

export type FilterType = 'include' | 'exclude' | 'transform';
export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'in_list' | 'regex';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: FieldDataType;
  
  // Transformation
  transformation?: FieldTransformation;
  
  // Validation
  isRequired: boolean;
  validation?: FieldValidation;
  
  // Default value
  defaultValue?: any;
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
  | 'calculate_value'
  | 'lookup_value'
  | 'split_field'
  | 'combine_fields'
  | 'regex_extract';

export interface DataQualityCheck {
  checkType: QualityCheckType;
  field?: string;
  threshold: number;
  action: QualityAction;
  isEnabled: boolean;
}

export type QualityCheckType = 
  | 'completeness'
  | 'accuracy'
  | 'consistency'
  | 'timeliness'
  | 'validity'
  | 'uniqueness';

export type QualityAction = 'log_warning' | 'reject_record' | 'quarantine' | 'auto_correct' | 'escalate';

export interface MonitoringConfig {
  // Monitoring settings
  enableMonitoring: boolean;
  monitoringInterval: number; // seconds
  
  // Metrics to track
  trackPerformance: boolean;
  trackDataQuality: boolean;
  trackErrorRates: boolean;
  
  // Alerting
  alertThresholds: AlertThreshold[];
  
  // Logging
  enableDetailedLogging: boolean;
  logSensitiveData: boolean;
  
  // Health checks
  healthCheckEndpoint?: string;
  expectedResponseTime: number; // milliseconds
}

export interface AlertThreshold {
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
  isEnabled: boolean;
}

export type AlertMetric = 
  | 'response_time'
  | 'error_rate'
  | 'success_rate'
  | 'throughput'
  | 'data_latency'
  | 'connection_failures';

export type AlertOperator = 'greater_than' | 'less_than' | 'equals' | 'not_equals';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface IntegrationSecurity {
  // Authentication
  authType: AuthenticationType;
  credentials: AuthCredentials;
  
  // Encryption
  encryptInTransit: boolean;
  encryptAtRest: boolean;
  encryptionMethod?: string;
  
  // Access control
  allowedIPs?: string[];
  blockedIPs?: string[];
  
  // API security
  requireApiKey: boolean;
  rotateCredentials: boolean;
  credentialRotationDays?: number;
  
  // Audit logging
  enableAuditLogging: boolean;
  auditLogRetentionDays: number;
  
  // Compliance
  dataClassification: DataClassification;
  privacySettings: PrivacySettings;
}

export type AuthenticationType = 
  | 'api_key'
  | 'oauth2'
  | 'basic_auth'
  | 'bearer_token'
  | 'mutual_tls'
  | 'jwt'
  | 'saml';

export interface AuthCredentials {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  certificate?: string;
  privateKey?: string;
}

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface PrivacySettings {
  piiHandling: PIIHandling;
  dataRetentionPeriod: number; // days
  rightToErasure: boolean;
  consentRequired: boolean;
  anonymizeData: boolean;
}

export type PIIHandling = 'none' | 'minimal' | 'standard' | 'strict';

export interface IntegrationMetrics {
  // Performance metrics
  averageResponseTime: number; // milliseconds
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Reliability metrics
  successRate: number; // percentage
  errorRate: number; // percentage
  uptimePercentage: number;
  
  // Throughput metrics
  requestsPerSecond: number;
  requestsPerHour: number;
  dataVolumePerHour: number; // MB
  
  // Quality metrics
  dataQualityScore: number; // 0-100
  validationPassRate: number; // percentage
  
  // Usage metrics
  totalRequests: number;
  totalDataProcessed: number; // MB
  
  // Time metrics
  lastSuccessfulSync: Date;
  averageSyncDuration: number; // seconds
  
  // Error metrics
  totalErrors: number;
  errorBreakdown: ErrorBreakdown[];
}

export interface ErrorBreakdown {
  errorType: string;
  errorCount: number;
  lastOccurrence: Date;
}

export interface ManagerStatus {
  // Overall status
  overallStatus: ManagerStatusType;
  statusMessage: string;
  
  // Integration counts
  totalIntegrations: number;
  activeIntegrations: number;
  errorIntegrations: number;
  
  // Health summary
  healthSummary: HealthSummary;
  
  // Recent activity
  recentActivity: ActivityLog[];
  
  // Alerts
  activeAlerts: IntegrationAlert[];
  
  // Performance summary
  performanceSummary: PerformanceSummary;
}

export type ManagerStatusType = 'healthy' | 'degraded' | 'error' | 'maintenance';

export interface HealthSummary {
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  unknownCount: number;
  
  overallHealthScore: number; // 0-100
  lastHealthCheck: Date;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  activityType: ActivityType;
  integrationId?: string;
  description: string;
  details?: Record<string, any>;
  severity: LogSeverity;
}

export type ActivityType = 
  | 'integration_connected'
  | 'integration_disconnected'
  | 'sync_completed'
  | 'sync_failed'
  | 'alert_triggered'
  | 'configuration_changed'
  | 'health_check_failed'
  | 'rate_limit_exceeded';

export type LogSeverity = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface IntegrationAlert {
  id: string;
  integrationId: string;
  alertType: IntegrationAlertType;
  severity: AlertSeverity;
  
  // Alert details
  title: string;
  message: string;
  description?: string;
  
  // Timing
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  
  // Status
  status: AlertStatus;
  
  // Actions
  recommendedActions: string[];
  
  // Context
  contextData?: Record<string, any>;
}

export type IntegrationAlertType = 
  | 'connection_failed'
  | 'high_error_rate'
  | 'slow_response'
  | 'data_quality_issue'
  | 'rate_limit_exceeded'
  | 'authentication_failed'
  | 'health_check_failed'
  | 'configuration_error';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';

export interface PerformanceSummary {
  overallPerformance: number; // 0-100 score
  
  // Response time summary
  avgResponseTime: number;
  slowestIntegration: string;
  fastestIntegration: string;
  
  // Reliability summary
  avgSuccessRate: number;
  mostReliableIntegration: string;
  leastReliableIntegration: string;
  
  // Throughput summary
  totalRequestsPerHour: number;
  totalDataVolumePerHour: number;
  
  // Trends
  performanceTrend: TrendDirection;
  reliabilityTrend: TrendDirection;
}

export type TrendDirection = 'improving' | 'stable' | 'degrading';

export interface IntegrationPerformanceMetrics {
  // System-wide metrics
  totalConnections: number;
  activeConnections: number;
  connectionPoolUtilization: number; // percentage
  
  // Aggregate performance
  systemThroughput: number; // requests per second
  systemLatency: number; // milliseconds
  systemErrorRate: number; // percentage
  
  // Resource utilization
  cpuUtilization: number; // percentage
  memoryUtilization: number; // percentage
  networkUtilization: number; // percentage
  
  // Cache performance
  cacheHitRate: number; // percentage
  cacheSize: number; // MB
  
  // Quality metrics
  overallDataQuality: number; // 0-100 score
  validationFailureRate: number; // percentage
}

export interface IntegrationErrorHandling {
  // Retry configuration
  retryPolicy: RetryPolicy;
  
  // Circuit breaker
  circuitBreakerConfig: CircuitBreakerConfig;
  
  // Error classification
  errorClassification: ErrorClassification[];
  
  // Fallback strategies
  fallbackStrategies: FallbackStrategy[];
  
  // Dead letter queue
  deadLetterQueueConfig: DeadLetterQueueConfig;
  
  // Error reporting
  errorReporting: ErrorReportingConfig;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffStrategy: BackoffStrategy;
  retryableErrors: string[];
  exponentialBase?: number;
  jitterEnabled: boolean;
}

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential' | 'exponential_jitter';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutDuration: number; // milliseconds
  monitoringPeriod: number; // milliseconds
  halfOpenMaxCalls: number;
}

export interface ErrorClassification {
  errorPattern: string;
  errorCategory: ErrorCategory;
  severity: AlertSeverity;
  isRetryable: boolean;
  action: ErrorAction;
}

export type ErrorCategory = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'rate_limit'
  | 'server_error'
  | 'client_error'
  | 'timeout'
  | 'data_validation'
  | 'business_logic';

export type ErrorAction = 'retry' | 'skip' | 'fallback' | 'escalate' | 'terminate';

export interface FallbackStrategy {
  triggerCondition: string;
  fallbackType: FallbackType;
  fallbackConfig: Record<string, any>;
  timeoutDuration: number; // milliseconds
}

export type FallbackType = 
  | 'cached_data'
  | 'alternative_endpoint'
  | 'alternative_provider'
  | 'default_value'
  | 'manual_intervention';

export interface DeadLetterQueueConfig {
  enabled: boolean;
  maxRetentionDays: number;
  maxQueueSize: number;
  processingStrategy: DLQProcessingStrategy;
}

export type DLQProcessingStrategy = 'manual' | 'scheduled_retry' | 'escalate' | 'discard';

export interface ErrorReportingConfig {
  enableReporting: boolean;
  reportingChannels: NotificationChannel[];
  severityThreshold: AlertSeverity;
  batchingEnabled: boolean;
  batchSize?: number;
  batchTimeout?: number; // minutes
}

export interface SecurityConfiguration {
  // Access control
  enableAccessControl: boolean;
  allowedRoles: string[];
  
  // API security
  enableApiSecurity: boolean;
  apiSecurityConfig: ApiSecurityConfig;
  
  // Data protection
  dataProtection: DataProtectionConfig;
  
  // Compliance
  complianceRequirements: ComplianceRequirement[];
  
  // Audit
  auditConfig: AuditConfig;
  
  // Threat protection
  threatProtection: ThreatProtectionConfig;
}

export interface ApiSecurityConfig {
  requireApiKey: boolean;
  enableRateLimiting: boolean;
  enableIPWhitelisting: boolean;
  enableCORS: boolean;
  corsOrigins: string[];
  enableCSRFProtection: boolean;
}

export interface DataProtectionConfig {
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  encryptionAlgorithm: string;
  keyRotationEnabled: boolean;
  keyRotationDays: number;
  dataAnonymization: boolean;
  piiRedaction: boolean;
}

export interface ComplianceRequirement {
  requirementId: string;
  requirementName: string;
  jurisdiction: 'AU' | 'NZ' | 'EU' | 'US' | 'GLOBAL';
  description: string;
  isActive: boolean;
  lastAssessment: Date;
  complianceStatus: ComplianceStatus;
}

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'under_review';

export interface AuditConfig {
  enableAuditing: boolean;
  auditLevel: AuditLevel;
  auditRetentionDays: number;
  auditFields: string[];
  enableIntegrityChecks: boolean;
}

export type AuditLevel = 'minimal' | 'standard' | 'comprehensive' | 'verbose';

export interface ThreatProtectionConfig {
  enableThreatDetection: boolean;
  enableAnomalyDetection: boolean;
  suspiciousActivityThreshold: number;
  automaticBlockingEnabled: boolean;
  blockingDuration: number; // minutes
}

export interface DataSovereigntyConfig {
  requireLocalStorage: boolean;
  allowedRegions: string[];
  dataResidencyRules: DataResidencyRule[];
  crossBorderTransferRules: CrossBorderRule[];
}

export interface DataResidencyRule {
  dataType: DataType;
  requiredLocation: string;
  allowedLocations: string[];
  exceptions: string[];
}

export interface CrossBorderRule {
  fromRegion: string;
  toRegion: string;
  isAllowed: boolean;
  requiresConsent: boolean;
  requiresEncryption: boolean;
  additionalControls: string[];
}

export interface ComplianceSettings {
  // AU/NZ specific compliance
  privacyActCompliance: boolean; // AU Privacy Act
  nzPrivacyActCompliance: boolean; // NZ Privacy Act
  
  // Financial regulations
  austracCompliance: boolean; // AU AUSTRAC
  fmaCompliance: boolean; // NZ FMA
  
  // Data protection
  dataLocalization: boolean;
  consentManagement: boolean;
  
  // Reporting requirements
  regulatoryReporting: boolean;
  reportingFrequency: ReportingFrequency;
  
  // Audit requirements
  auditTrailRequired: boolean;
  auditRetentionPeriod: number; // years
}

export type ReportingFrequency = 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';

export interface CacheConfiguration {
  cacheType: CacheType;
  defaultTTL: number; // seconds
  maxCacheSize: number; // MB
  
  // Cache policies
  evictionPolicy: EvictionPolicy;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  
  // Cache warming
  warmupEnabled: boolean;
  warmupStrategy: WarmupStrategy;
  
  // Cache invalidation
  invalidationStrategy: InvalidationStrategy;
  
  // Distributed caching
  distributedCache: boolean;
  cacheNodes?: string[];
}

export type CacheType = 'memory' | 'redis' | 'memcached' | 'file' | 'database';
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl';
export type WarmupStrategy = 'eager' | 'lazy' | 'scheduled';
export type InvalidationStrategy = 'ttl' | 'manual' | 'event_based' | 'versioned';

export interface RateLimit {
  limitType: RateLimitType;
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  
  // Burst handling
  burstCapacity?: number;
  
  // Scope
  scope: RateLimitScope;
  
  // Actions
  actionOnExceed: RateLimitAction;
  
  // Recovery
  recoveryStrategy: RateLimitRecovery;
}

export type RateLimitType = 'token_bucket' | 'sliding_window' | 'fixed_window' | 'leaky_bucket';
export type RateLimitScope = 'global' | 'per_integration' | 'per_endpoint' | 'per_user' | 'per_ip';
export type RateLimitAction = 'throttle' | 'reject' | 'queue' | 'delay';
export type RateLimitRecovery = 'immediate' | 'gradual' | 'exponential_backoff';

// Filter and search interfaces
export interface IntegrationManagerFilter {
  integrationTypes?: IntegrationType[];
  providers?: IntegrationProvider[];
  statuses?: IntegrationStatus[];
  jurisdictions?: ('AU' | 'NZ')[];
  
  // Health filters
  healthStatuses?: HealthStatus[];
  hasActiveAlerts?: boolean;
  
  // Performance filters
  minSuccessRate?: number;
  maxResponseTime?: number;
  
  // Date filters
  lastSyncAfter?: Date;
  createdAfter?: Date;
  
  // Search
  searchTerm?: string;
}

// API interfaces
export interface IntegrationManagerResponse {
  success: boolean;
  manager?: IntegrationManager;
  errors?: string[];
  warnings?: string[];
}

export interface IntegrationResponse {
  success: boolean;
  integration?: Integration;
  errors?: string[];
  warnings?: string[];
}

export interface TestConnectionRequest {
  integrationId: string;
  testType: TestType;
  testParameters?: Record<string, any>;
}

export type TestType = 'connectivity' | 'authentication' | 'full_flow' | 'health_check';

export interface TestConnectionResponse {
  success: boolean;
  testResults: TestResult[];
  overallScore: number; // 0-100
  recommendations?: string[];
}

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number; // milliseconds
  details?: string;
  error?: string;
}

// Hook return interface
export interface UseIntegrationManagerReturn {
  // Data
  managers: IntegrationManager[];
  currentManager: IntegrationManager | null;
  
  // Loading states
  isLoading: boolean;
  isConnecting: boolean;
  isTesting: boolean;
  
  // Manager operations
  createManager: (config: Omit<IntegrationManager, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<IntegrationManager>;
  updateManager: (id: string, updates: Partial<IntegrationManager>) => Promise<IntegrationManager>;
  deleteManager: (id: string) => Promise<void>;
  
  // Integration operations
  addIntegration: (managerId: string, integration: Omit<Integration, 'id' | 'managerId' | 'createdAt' | 'updatedAt'>) => Promise<Integration>;
  updateIntegration: (integrationId: string, updates: Partial<Integration>) => Promise<Integration>;
  removeIntegration: (integrationId: string) => Promise<void>;
  
  // Connection management
  testConnection: (request: TestConnectionRequest) => Promise<TestConnectionResponse>;
  enableIntegration: (integrationId: string) => Promise<void>;
  disableIntegration: (integrationId: string) => Promise<void>;
  
  // Health monitoring
  runHealthCheck: (managerId: string) => Promise<HealthSummary>;
  getIntegrationMetrics: (integrationId: string) => IntegrationMetrics;
  getManagerStatus: (managerId: string) => ManagerStatus;
  
  // Alert management
  getActiveAlerts: (managerId: string) => IntegrationAlert[];
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  
  // Filtering and search
  filterManagers: (filter: IntegrationManagerFilter) => void;
  searchManagers: (query: string) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Store state interface
export interface IntegrationManagerState {
  // Data
  managers: Record<string, IntegrationManager>;
  
  // Current manager
  currentManagerId: string | null;
  
  // UI state
  activeFilter: IntegrationManagerFilter;
  searchQuery: string;
  selectedManagerIds: string[];
  
  // Connection state
  connectionTests: Record<string, TestConnectionResponse>;
  
  // Monitoring state
  monitoringManagers: Record<string, boolean>;
  
  // Cache management
  lastUpdated: Record<string, Date>;
  cacheExpiry: number;
  
  // Error handling
  errors: Record<string, string>;
} 