// Block 39: Sentiment Indicator Display - Types
// TypeScript interfaces for sentiment indicator visualization

export interface SentimentIndicatorDisplay {
  id: string;
  userId: string;
  
  // Display configuration
  config: IndicatorConfig;
  
  // Current sentiment data
  currentSentiment: SentimentData;
  
  // Display settings
  displaySettings: DisplaySettings;
  
  // Alert settings
  alertSettings: AlertSettings;
  
  // Historical data
  sentimentHistory: SentimentHistoryPoint[];
  
  // Status
  isActive: boolean;
  isVisible: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastRefresh: Date;
  
  // Performance metrics
  performance: PerformanceMetrics;
}

export interface IndicatorConfig {
  // Data sources
  dataSources: SentimentDataSource[];
  
  // Aggregation settings
  aggregationMethod: AggregationMethod;
  weightingStrategy: WeightingStrategy;
  
  // Update frequency
  updateInterval: number; // milliseconds
  
  // Time window
  timeWindow: TimeWindow;
  
  // Filtering
  filters: SentimentFilter[];
  
  // Normalization
  normalization: NormalizationSettings;
}

export interface SentimentData {
  // Overall sentiment
  overallSentiment: number; // -1 to +1
  sentimentLabel: SentimentLabel;
  confidence: number; // 0-1
  
  // Component breakdown
  components: SentimentComponent[];
  
  // Source breakdown
  sourceBreakdown: SourceSentimentData[];
  
  // Trend analysis
  trend: SentimentTrend;
  
  // Quality metrics
  quality: DataQuality;
  
  // Timestamp
  timestamp: Date;
  dataAge: number; // milliseconds
}

export interface SentimentComponent {
  id: string;
  name: string;
  type: ComponentType;
  
  // Sentiment values
  sentiment: number; // -1 to +1
  confidence: number;
  weight: number;
  
  // Contributing factors
  factors: SentimentFactor[];
  
  // Trend
  trend: ComponentTrend;
  
  // Data quality
  dataQuality: number;
  sampleSize: number;
  
  // Metadata
  lastUpdated: Date;
  source: string;
}

export interface SentimentFactor {
  id: string;
  name: string;
  description: string;
  
  // Impact
  impact: number; // -1 to +1
  confidence: number;
  weight: number;
  
  // Category
  category: FactorCategory;
  
  // Temporal data
  duration: number; // milliseconds
  intensity: number;
  
  // Source
  source: string;
  reliability: number;
  
  // Context
  context: Record<string, any>;
}

export interface SourceSentimentData {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  
  // Sentiment values
  sentiment: number; // -1 to +1
  confidence: number;
  weight: number;
  contribution: number;
  
  // Data metrics
  dataPoints: number;
  freshness: number; // milliseconds
  reliability: number;
  
  // Status
  isActive: boolean;
  isConnected: boolean;
  lastUpdate: Date;
  
  // Quality
  dataQuality: DataQuality;
  
  // Errors
  errors: SourceError[];
}

export interface SentimentTrend {
  direction: TrendDirection;
  strength: number; // 0-1
  confidence: number;
  
  // Change metrics
  shortTermChange: number; // 1 hour
  mediumTermChange: number; // 24 hours
  longTermChange: number; // 7 days
  
  // Momentum
  momentum: number;
  acceleration: number;
  
  // Volatility
  volatility: number;
  
  // Pattern recognition
  patterns: TrendPattern[];
  
  // Predictions
  predictions: SentimentPrediction[];
}

export interface DisplaySettings {
  // Visual style
  visualStyle: VisualStyle;
  
  // Layout
  layout: LayoutConfig;
  
  // Colors
  colorScheme: ColorScheme;
  
  // Animations
  animations: AnimationSettings;
  
  // Responsiveness
  responsive: ResponsiveSettings;
  
  // Accessibility
  accessibility: AccessibilitySettings;
  
  // Performance
  performance: PerformanceSettings;
}

export interface VisualStyle {
  style: IndicatorStyle;
  size: IndicatorSize;
  shape: IndicatorShape;
  
  // Gauge settings
  gaugeSettings?: GaugeSettings;
  
  // Bar settings
  barSettings?: BarSettings;
  
  // Thermometer settings
  thermometerSettings?: ThermometerSettings;
  
  // Traffic light settings
  trafficLightSettings?: TrafficLightSettings;
  
  // Custom settings
  customSettings?: Record<string, any>;
}

export interface LayoutConfig {
  position: DisplayPosition;
  alignment: DisplayAlignment;
  
  // Spacing
  padding: Spacing;
  margin: Spacing;
  
  // Dimensions
  width: DimensionConfig;
  height: DimensionConfig;
  
  // Z-index
  zIndex: number;
  
  // Floating
  floating: boolean;
  floatingPosition?: FloatingPosition;
}

export interface AlertSettings {
  // Alert types
  enabledAlerts: AlertType[];
  
  // Thresholds
  thresholds: AlertThreshold[];
  
  // Notification settings
  notifications: NotificationSettings;
  
  // Escalation
  escalation: EscalationSettings;
  
  // Customization
  customRules: CustomAlertRule[];
}

export interface AlertThreshold {
  id: string;
  name: string;
  description: string;
  
  // Condition
  condition: ThresholdCondition;
  value: number;
  duration: number; // milliseconds
  
  // Severity
  severity: AlertSeverity;
  
  // Actions
  actions: AlertAction[];
  
  // Status
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface SentimentHistoryPoint {
  timestamp: Date;
  sentiment: number;
  confidence: number;
  quality: number;
  
  // Context
  marketContext?: MarketContext;
  eventContext?: EventContext[];
  
  // Metadata
  dataPoints: number;
  sources: string[];
}

export interface PerformanceMetrics {
  // Update performance
  averageUpdateTime: number;
  updateReliability: number;
  
  // Data quality
  averageDataQuality: number;
  dataCompleteness: number;
  
  // User interaction
  viewTime: number;
  interactionCount: number;
  
  // System performance
  renderTime: number;
  memoryUsage: number;
  
  // Error rates
  errorRate: number;
  connectionIssues: number;
}

export interface DataQuality {
  overall: number; // 0-1
  
  // Component scores
  accuracy: number;
  completeness: number;
  consistency: number;
  timeliness: number;
  relevance: number;
  
  // Issues
  issues: DataQualityIssue[];
  
  // Recommendations
  recommendations: string[];
}

export interface SentimentPrediction {
  timeHorizon: number; // milliseconds
  predictedSentiment: number;
  confidence: number;
  
  // Scenario analysis
  scenarios: PredictionScenario[];
  
  // Risk factors
  riskFactors: string[];
  
  // Model info
  modelType: string;
  modelVersion: string;
  trainedOn: Date;
}

// Enums and types
export type SentimentLabel = 
  | 'Very Negative' 
  | 'Negative' 
  | 'Slightly Negative' 
  | 'Neutral' 
  | 'Slightly Positive' 
  | 'Positive' 
  | 'Very Positive';

export type ComponentType = 
  | 'news' 
  | 'social' 
  | 'technical' 
  | 'fundamental' 
  | 'macro' 
  | 'market' 
  | 'custom';

export type FactorCategory = 
  | 'economic' 
  | 'political' 
  | 'technical' 
  | 'social' 
  | 'environmental' 
  | 'regulatory';

export type SourceType = 
  | 'news' 
  | 'twitter' 
  | 'reddit' 
  | 'forum' 
  | 'blog' 
  | 'research' 
  | 'api' 
  | 'manual';

export type TrendDirection = 'up' | 'down' | 'sideways' | 'volatile';

export type IndicatorStyle = 
  | 'gauge' 
  | 'bar' 
  | 'thermometer' 
  | 'traffic_light' 
  | 'numeric' 
  | 'emoji' 
  | 'custom';

export type IndicatorSize = 'small' | 'medium' | 'large' | 'custom';

export type IndicatorShape = 'circle' | 'square' | 'rectangle' | 'custom';

export type DisplayPosition = 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right' 
  | 'center' 
  | 'custom';

export type AlertType = 
  | 'sentiment_change' 
  | 'threshold_breach' 
  | 'data_quality' 
  | 'connection_issue' 
  | 'trend_reversal';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AggregationMethod = 'weighted_average' | 'simple_average' | 'median' | 'mode';

export type WeightingStrategy = 'equal' | 'confidence' | 'recency' | 'reliability' | 'custom';

export type TimeWindow = '1h' | '4h' | '12h' | '24h' | '7d' | '30d' | 'custom';

export type ThresholdCondition = 
  | 'above' 
  | 'below' 
  | 'crosses_above' 
  | 'crosses_below' 
  | 'equals' 
  | 'change_exceeds';

// Additional interfaces
export interface SentimentDataSource {
  id: string;
  name: string;
  type: SourceType;
  
  // Configuration
  config: SourceConfig;
  
  // Status
  isEnabled: boolean;
  isConnected: boolean;
  
  // Reliability
  reliability: number;
  weight: number;
  
  // Rate limiting
  rateLimit: RateLimit;
  
  // Authentication
  auth?: AuthConfig;
}

export interface SentimentFilter {
  id: string;
  name: string;
  type: FilterType;
  
  // Filter criteria
  criteria: FilterCriteria;
  
  // Status
  isActive: boolean;
  
  // Impact
  impact: number;
}

export interface NormalizationSettings {
  method: NormalizationMethod;
  
  // Range settings
  inputRange: [number, number];
  outputRange: [number, number];
  
  // Scaling
  scalingFactor: number;
  
  // Bias correction
  biasCorrection: boolean;
  
  // Historical calibration
  useHistoricalCalibration: boolean;
  calibrationPeriod: number; // days
}

export interface ComponentTrend {
  direction: TrendDirection;
  strength: number;
  duration: number; // milliseconds
  reliability: number;
}

export interface TrendPattern {
  pattern: PatternType;
  confidence: number;
  significance: number;
  
  // Timing
  startTime: Date;
  duration: number;
  
  // Characteristics
  characteristics: PatternCharacteristic[];
}

export interface GaugeSettings {
  minValue: number;
  maxValue: number;
  showNeedle: boolean;
  showTicks: boolean;
  showLabels: boolean;
  
  // Colors
  colors: GaugeColorConfig;
  
  // Zones
  zones: GaugeZone[];
}

export interface BarSettings {
  orientation: 'horizontal' | 'vertical';
  showValue: boolean;
  showPercentage: boolean;
  
  // Animation
  animateChanges: boolean;
  animationDuration: number;
}

export interface ThermometerSettings {
  orientation: 'vertical' | 'horizontal';
  showScale: boolean;
  showBulb: boolean;
  
  // Temperature zones
  zones: TemperatureZone[];
}

export interface TrafficLightSettings {
  arrangement: 'vertical' | 'horizontal';
  showLabels: boolean;
  
  // Thresholds
  positiveThreshold: number;
  negativeThreshold: number;
}

export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DimensionConfig {
  value: number;
  unit: 'px' | '%' | 'em' | 'rem' | 'vw' | 'vh';
  min?: number;
  max?: number;
}

export interface FloatingPosition {
  x: number;
  y: number;
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  
  // Sentiment colors
  veryPositive: string;
  positive: string;
  slightlyPositive: string;
  neutral: string;
  slightlyNegative: string;
  negative: string;
  veryNegative: string;
  
  // UI colors
  background: string;
  text: string;
  border: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface AnimationSettings {
  enableAnimations: boolean;
  
  // Animation types
  transitions: boolean;
  dataUpdates: boolean;
  hover: boolean;
  
  // Timing
  duration: number;
  easing: string;
  
  // Performance
  reducedMotion: boolean;
}

export interface ResponsiveSettings {
  enableResponsive: boolean;
  
  // Breakpoints
  breakpoints: ResponsiveBreakpoint[];
  
  // Behavior
  behavior: ResponsiveBehavior;
}

export interface AccessibilitySettings {
  enableA11y: boolean;
  
  // Screen reader
  screenReader: boolean;
  ariaLabels: boolean;
  
  // Keyboard navigation
  keyboardNav: boolean;
  
  // High contrast
  highContrast: boolean;
  
  // Text scaling
  textScaling: boolean;
}

export interface PerformanceSettings {
  // Update optimization
  throttleUpdates: boolean;
  updateThreshold: number;
  
  // Rendering
  virtualizeData: boolean;
  lazyLoad: boolean;
  
  // Memory management
  maxHistoryPoints: number;
  cleanupInterval: number;
}

export interface NotificationSettings {
  enableNotifications: boolean;
  
  // Channels
  channels: NotificationChannel[];
  
  // Preferences
  preferences: NotificationPreferences;
  
  // Timing
  quietHours: QuietHours;
}

export interface EscalationSettings {
  enableEscalation: boolean;
  
  // Rules
  escalationRules: EscalationRule[];
  
  // Timing
  escalationDelay: number; // milliseconds
  maxEscalationLevel: number;
}

export interface CustomAlertRule {
  id: string;
  name: string;
  description: string;
  
  // Condition
  condition: RuleCondition;
  
  // Actions
  actions: RuleAction[];
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  lastTriggered?: Date;
}

export interface MarketContext {
  marketConditions: string[];
  volatility: number;
  volume: number;
  
  // Events
  significantEvents: MarketEvent[];
  
  // Indices
  marketIndices: MarketIndex[];
}

export interface EventContext {
  eventType: string;
  description: string;
  impact: number;
  timestamp: Date;
  
  // Related data
  relatedAssets: string[];
  relatedNews: string[];
}

export interface DataQualityIssue {
  type: QualityIssueType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  
  // Impact
  impact: number;
  affectedSources: string[];
  
  // Resolution
  recommendation: string;
  autoFixable: boolean;
}

export interface PredictionScenario {
  name: string;
  probability: number;
  
  // Predicted values
  sentimentRange: [number, number];
  confidence: number;
  
  // Conditions
  conditions: ScenarioCondition[];
  
  // Impact
  impact: ScenarioImpact;
}

// Additional enums
export type PatternType = 
  | 'trend' 
  | 'reversal' 
  | 'cycle' 
  | 'spike' 
  | 'consolidation' 
  | 'breakout';

export type FilterType = 
  | 'source' 
  | 'confidence' 
  | 'recency' 
  | 'relevance' 
  | 'sentiment_range' 
  | 'keyword';

export type NormalizationMethod = 
  | 'z_score' 
  | 'min_max' 
  | 'robust' 
  | 'quantile' 
  | 'custom';

export type QualityIssueType = 
  | 'missing_data' 
  | 'stale_data' 
  | 'inconsistent_data' 
  | 'low_confidence' 
  | 'bias_detected';

// Complex type definitions
export interface SourceConfig {
  apiUrl?: string;
  apiKey?: string;
  updateInterval: number;
  timeout: number;
  retryAttempts: number;
  
  // Custom parameters
  customParams: Record<string, any>;
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  
  // Burst handling
  burstSize: number;
  backoffStrategy: 'linear' | 'exponential';
}

export interface AuthConfig {
  type: 'api_key' | 'oauth' | 'bearer' | 'basic';
  credentials: Record<string, string>;
  
  // Token management
  tokenRefresh?: boolean;
  tokenExpiry?: Date;
}

export interface FilterCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  
  // Compound criteria
  logicalOperator?: 'and' | 'or';
  subCriteria?: FilterCriteria[];
}

export interface PatternCharacteristic {
  name: string;
  value: number;
  significance: number;
}

export interface GaugeColorConfig {
  needle: string;
  background: string;
  ticks: string;
  labels: string;
}

export interface GaugeZone {
  start: number;
  end: number;
  color: string;
  label: string;
}

export interface TemperatureZone {
  start: number;
  end: number;
  color: string;
  label: string;
}

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  
  // Settings overrides
  overrides: Partial<DisplaySettings>;
}

export type ResponsiveBehavior = 'scale' | 'reflow' | 'hide' | 'simplify';

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'webhook';
  address: string;
  isEnabled: boolean;
  
  // Filtering
  severityFilter: AlertSeverity[];
  typeFilter: AlertType[];
}

export interface NotificationPreferences {
  frequency: 'immediate' | 'batched' | 'digest';
  batchInterval?: number; // minutes
  
  // Content
  includeDetails: boolean;
  includeChart: boolean;
  includeHistory: boolean;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string;
  
  // Exceptions
  allowCritical: boolean;
  allowedTypes: AlertType[];
}

export interface EscalationRule {
  id: string;
  severity: AlertSeverity;
  
  // Timing
  delayMinutes: number;
  maxAttempts: number;
  
  // Actions
  escalationActions: EscalationAction[];
}

export interface RuleCondition {
  type: 'sentiment' | 'trend' | 'quality' | 'custom';
  
  // Parameters
  parameters: Record<string, any>;
  
  // Evaluation
  evaluationFunction?: string;
}

export interface RuleAction {
  type: 'notify' | 'log' | 'webhook' | 'custom';
  
  // Configuration
  config: Record<string, any>;
  
  // Timing
  delay?: number;
}

export interface MarketEvent {
  type: string;
  description: string;
  timestamp: Date;
  impact: number;
}

export interface MarketIndex {
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface ScenarioCondition {
  parameter: string;
  operator: string;
  value: any;
  weight: number;
}

export interface ScenarioImpact {
  magnitude: number;
  duration: number; // hours
  affectedComponents: string[];
  confidenceLevel: number;
}

export interface AlertAction {
  type: 'notify' | 'log' | 'execute' | 'webhook';
  config: Record<string, any>;
  
  // Timing
  delay?: number;
  retries?: number;
}

export interface SourceError {
  type: string;
  message: string;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
  
  // Resolution
  autoRetry: boolean;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface EscalationAction {
  type: 'email' | 'sms' | 'call' | 'webhook';
  target: string;
  
  // Message
  subject: string;
  body: string;
  
  // Priority
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export type DisplayAlignment = 'left' | 'center' | 'right' | 'justify';

// Error types
export class SentimentIndicatorError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'SentimentIndicatorError';
  }
} 