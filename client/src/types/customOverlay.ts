// Block 31: Custom Overlay Builder - Types
export interface CustomOverlay {
  id: string;
  name: string;
  description: string;
  category: string;
  userId?: string;
  rules: OverlayRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  backtest: OverlayBacktestResult | null;
  metadata: OverlayMetadata;
}

export interface OverlayRule {
  id: string;
  name: string;
  conditions: OverlayCondition[];
  actions: OverlayAction[];
  priority: number;
  enabled: boolean;
}

export interface OverlayCondition {
  field: string; // 'price', 'volume', 'marketCap', 'pe_ratio', etc.
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'between' | 'complex';
  value: any;
  valueSecondary?: any; // For 'between' operator
  logicalOperator?: 'AND' | 'OR'; // For combining with next condition
}

export interface OverlayAction {
  type: 'buy' | 'sell' | 'hold' | 'rebalance' | 'alert';
  percentage?: number; // For buy/sell actions
  targetWeight?: number; // For rebalance actions
  reason?: string;
  parameters?: Record<string, any>;
}

export interface OverlayMetadata {
  complexity: 'simple' | 'moderate' | 'complex';
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  estimatedTrades?: number;
  targetReturn?: number;
  maxDrawdown?: number;
}

export interface OverlayTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: Omit<OverlayRule, 'id'>[];
  metadata: OverlayMetadata;
}

export interface OverlayValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OverlayBacktestResult {
  overlayId: string;
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  avgTradeReturn: number;
  avgHoldingPeriod: number;
  tradeDetails: Array<{
    date: Date;
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    return: number;
  }>;
  performance: Array<{
    date: Date;
    value: number;
    return: number;
  }>;
  generatedAt: Date;
}

export interface CustomOverlayState {
  overlays: CustomOverlay[];
  templates: OverlayTemplate[];
  selectedOverlay: CustomOverlay | null;
  selectedRule: OverlayRule | null;
  isBuilding: boolean;
  isTesting: boolean;
  testResults: OverlayBacktestResult | null;
  validationResult: OverlayValidationResult | null;
  filter: OverlayFilter;
  isLoading: boolean;
  error: string | null;
}

export interface OverlayFilter {
  category?: string;
  userId?: string;
  isActive?: boolean;
  searchQuery?: string;
  tags?: string[];
  complexity?: OverlayMetadata['complexity'];
  riskLevel?: OverlayMetadata['riskLevel'];
}

export interface OverlayActions {
  createOverlay: (name: string, description: string, category?: string, userId?: string) => CustomOverlay;
  updateOverlay: (overlayId: string, updates: Partial<CustomOverlay>) => boolean;
  deleteOverlay: (overlayId: string) => boolean;
  cloneOverlay: (overlayId: string, newName: string, userId?: string) => CustomOverlay | null;
  addRule: (overlayId: string, rule: Omit<OverlayRule, 'id'>) => OverlayRule | null;
  updateRule: (overlayId: string, ruleId: string, updates: Partial<OverlayRule>) => boolean;
  removeRule: (overlayId: string, ruleId: string) => boolean;
  validateOverlay: (overlayId: string) => OverlayValidationResult;
  backtestOverlay: (overlayId: string, startDate: Date, endDate: Date) => Promise<OverlayBacktestResult>;
  exportOverlay: (overlayId: string) => any;
  importOverlay: (overlayData: any, userId?: string) => CustomOverlay | null;
  createFromTemplate: (templateId: string, name: string, userId?: string) => CustomOverlay | null;
  searchOverlays: (query: string, userId?: string) => CustomOverlay[];
}

export interface OverlayBuilderConfig {
  availableFields: OverlayField[];
  availableOperators: OverlayOperator[];
  availableActions: OverlayActionType[];
  maxRulesPerOverlay: number;
  maxConditionsPerRule: number;
  maxActionsPerRule: number;
}

export interface OverlayField {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'date' | 'percentage';
  description: string;
  category: 'price' | 'volume' | 'fundamental' | 'technical' | 'sentiment';
  dataSource?: string;
}

export interface OverlayOperator {
  id: string;
  symbol: string;
  name: string;
  description: string;
  applicableTypes: Array<'number' | 'string' | 'boolean' | 'date' | 'percentage'>;
  requiresSecondValue?: boolean; // For 'between' operator
}

export interface OverlayActionType {
  id: string;
  name: string;
  description: string;
  parameters: OverlayActionParameter[];
  category: 'trading' | 'allocation' | 'alert' | 'analysis';
}

export interface OverlayActionParameter {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'percentage' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: Array<{value: any, label: string}>; // For select type
  min?: number; // For number/percentage types
  max?: number; // For number/percentage types
}

export interface OverlayExecutionContext {
  symbol: string;
  currentPrice: number;
  marketData: Record<string, any>;
  portfolioData: Record<string, any>;
  timestamp: Date;
}

export interface OverlayExecutionResult {
  overlayId: string;
  ruleId: string;
  symbol: string;
  triggeredConditions: OverlayCondition[];
  executedActions: OverlayAction[];
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface OverlayPerformanceMetrics {
  overlayId: string;
  period: {
    start: Date;
    end: Date;
  };
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  triggeredRules: Array<{
    ruleId: string;
    triggerCount: number;
    successCount: number;
  }>;
  portfolioImpact: {
    totalTrades: number;
    totalReturn: number;
    winRate: number;
    avgTradeSize: number;
  };
} 