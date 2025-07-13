// Block 29: Vault Config Snapshot - Types
// TypeScript interfaces for vault configuration snapshots

export interface VaultConfigSnapshot {
  id: string;
  vaultId: string;
  name: string;
  description: string;
  version: string;
  
  // Configuration data
  config: VaultConfiguration;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  tags: string[];
  
  // Status
  isActive: boolean;
  isValid: boolean;
  
  // Comparison
  parentSnapshotId?: string;
  changes: ConfigChange[];
  
  // Validation
  validation: ValidationResult;
}

export interface VaultConfiguration {
  // Basic settings
  basic: BasicConfig;
  
  // Asset allocation
  allocation: AllocationConfig;
  
  // Risk management
  risk: RiskConfig;
  
  // Trading
  trading: TradingConfig;
  
  // Compliance
  compliance: ComplianceConfig;
  
  // Advanced settings
  advanced: AdvancedConfig;
}

export interface BasicConfig {
  name: string;
  strategy: string;
  currency: string;
  timezone: string;
  autoRebalance: boolean;
  rebalanceFrequency: string;
  minimumCash: number;
  
  // Portfolio constraints
  minPosition: number;
  maxPosition: number;
  maxPositions: number;
}

export interface AllocationConfig {
  method: 'equal' | 'market_cap' | 'risk_parity' | 'custom';
  targets: AssetTarget[];
  constraints: AllocationConstraint[];
  drift: DriftConfig;
  
  // Rebalancing
  rebalanceThreshold: number;
  rebalanceBands: RebalanceBand[];
}

export interface AssetTarget {
  assetId: string;
  symbol: string;
  targetWeight: number;
  minWeight: number;
  maxWeight: number;
  enabled: boolean;
}

export interface AllocationConstraint {
  type: 'asset' | 'sector' | 'region' | 'style';
  field: string;
  minWeight: number;
  maxWeight: number;
  values: string[];
}

export interface DriftConfig {
  allowedDrift: number;
  maxDrift: number;
  driftPenalty: number;
  autoCorrect: boolean;
}

export interface RebalanceBand {
  assetId: string;
  lowerBand: number;
  upperBand: number;
  priority: number;
}

export interface RiskConfig {
  maxDrawdown: number;
  var95: number;
  var99: number;
  beta: BetaConfig;
  volatility: VolatilityConfig;
  correlation: CorrelationConfig;
  
  // Risk limits
  limits: RiskLimit[];
  
  // Stress testing
  stressTests: StressTest[];
}

export interface BetaConfig {
  benchmark: string;
  targetBeta: number;
  maxBeta: number;
  hedgeRatio: number;
}

export interface VolatilityConfig {
  targetVolatility: number;
  maxVolatility: number;
  lookbackDays: number;
  adjustmentFrequency: string;
}

export interface CorrelationConfig {
  maxCorrelation: number;
  correlationWindow: number;
  diversificationTarget: number;
}

export interface RiskLimit {
  type: string;
  value: number;
  action: 'warn' | 'block';
  threshold: number;
}

export interface StressTest {
  name: string;
  scenario: string;
  maxLoss: number;
  probability: number;
}

export interface TradingConfig {
  orderTypes: string[];
  executionAlgorithms: string[];
  slippageLimit: number;
  timeoutLimit: number;
  
  // Market timing
  marketTiming: MarketTimingConfig;
  
  // Cost management
  costs: CostConfig;
  
  // Liquidity
  liquidity: LiquidityConfig;
}

export interface MarketTimingConfig {
  tradingHours: TradingHours;
  avoidNews: boolean;
  avoidEarnings: boolean;
  blackoutDates: Date[];
}

export interface TradingHours {
  start: string;
  end: string;
  timezone: string;
  extendedHours: boolean;
}

export interface CostConfig {
  maxCommission: number;
  maxSpread: number;
  costBudget: number;
  feeOptimization: boolean;
}

export interface LiquidityConfig {
  minLiquidity: number;
  maxVolumePercent: number;
  liquidityScore: number;
  emergencyLiquidity: boolean;
}

export interface ComplianceConfig {
  regulations: string[];
  reporting: ReportingConfig;
  restrictions: RestrictionConfig;
  monitoring: MonitoringConfig;
}

export interface ReportingConfig {
  frequency: string;
  format: string[];
  recipients: string[];
  autoSubmit: boolean;
}

export interface RestrictionConfig {
  excludedAssets: string[];
  allowedRegions: string[];
  allowedSectors: string[];
  esgConstraints: ESGConstraints;
}

export interface ESGConstraints {
  minESGScore: number;
  excludeControversial: boolean;
  carbonIntensity: number;
  sustainabilityThemes: string[];
}

export interface MonitoringConfig {
  realTimeMonitoring: boolean;
  alertThresholds: AlertThreshold[];
  escalationRules: EscalationRule[];
}

export interface AlertThreshold {
  metric: string;
  threshold: number;
  action: string;
}

export interface EscalationRule {
  condition: string;
  delay: number;
  recipients: string[];
}

export interface AdvancedConfig {
  taxOptimization: TaxConfig;
  rebalancing: AdvancedRebalancingConfig;
  performance: PerformanceConfig;
  integration: IntegrationConfig;
}

export interface TaxConfig {
  taxLossHarvesting: boolean;
  holdingPeriod: number;
  washSaleAvoidance: boolean;
  taxLotMethod: string;
}

export interface AdvancedRebalancingConfig {
  algorithm: string;
  parameters: Record<string, any>;
  customLogic: string;
  conditions: RebalanceCondition[];
}

export interface RebalanceCondition {
  trigger: string;
  condition: string;
  action: string;
  priority: number;
}

export interface PerformanceConfig {
  benchmarks: string[];
  attribution: boolean;
  riskAdjusted: boolean;
  customMetrics: string[];
}

export interface IntegrationConfig {
  dataProviders: string[];
  brokers: string[];
  riskSystems: string[];
  apis: APIConfig[];
}

export interface APIConfig {
  name: string;
  endpoint: string;
  auth: string;
  enabled: boolean;
}

export interface ConfigChange {
  id: string;
  timestamp: Date;
  field: string;
  oldValue: any;
  newValue: any;
  changeType: ChangeType;
  impact: ChangeImpact;
  author: string;
  reason: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  recommendation: string;
}

export interface ValidationSuggestion {
  field: string;
  suggestion: string;
  benefit: string;
}

export interface SnapshotMetadata {
  totalSize: number;
  configVersion: string;
  schemaVersion: string;
  dependencies: string[];
  compatibility: string[];
}

export interface SnapshotComparison {
  snapshot1: VaultConfigSnapshot;
  snapshot2: VaultConfigSnapshot;
  changes: ConfigChange[];
  summary: ComparisonSummary;
  recommendations: string[];
}

export interface ComparisonSummary {
  totalChanges: number;
  criticalChanges: number;
  riskImpact: string;
  performanceImpact: string;
  compatibilityIssues: string[];
}

// Enums
export type ChangeType = 'added' | 'modified' | 'removed' | 'renamed';

export type ChangeImpact = 'none' | 'low' | 'medium' | 'high' | 'critical';

// Error types
export class SnapshotError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'SnapshotError';
  }
} 