// Block 46: GPT Explanation Log - Types
export interface GPTExplanation {
  id: string;
  type: ExplanationType;
  category: ExplanationCategory;
  context: ExplanationContext;
  prompt: string;
  response: string;
  model: GPTModel;
  confidence: number;
  tokens: TokenUsage;
  metadata: ExplanationMetadata;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  accuracy?: number;
  feedback?: string;
  tags: string[];
  correlationId?: string;
}

export type ExplanationType = 
  | 'market_analysis'
  | 'strategy_recommendation'
  | 'risk_assessment'
  | 'portfolio_optimization'
  | 'trade_decision'
  | 'performance_analysis'
  | 'news_interpretation'
  | 'technical_analysis'
  | 'fundamental_analysis'
  | 'sentiment_analysis'
  | 'prediction'
  | 'educational'
  | 'alert_explanation'
  | 'compliance_check'
  | 'error_diagnosis';

export type ExplanationCategory = 
  | 'investment'
  | 'trading'
  | 'risk'
  | 'compliance'
  | 'education'
  | 'analysis'
  | 'prediction'
  | 'support'
  | 'research';

export interface ExplanationContext {
  subject: string; // What is being explained
  requestType: 'user_query' | 'automatic' | 'scheduled' | 'triggered';
  triggerEvent?: string;
  relatedAssets?: string[];
  relatedStrategies?: string[];
  timeframe?: string;
  marketConditions?: {
    trend: 'bull' | 'bear' | 'sideways';
    volatility: 'low' | 'medium' | 'high';
    volume: 'low' | 'medium' | 'high';
  };
  userLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  language?: string;
  format?: 'brief' | 'detailed' | 'technical' | 'simple';
}

export interface GPTModel {
  name: string;
  version: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
  currency?: string;
}

export interface ExplanationMetadata {
  source: string;
  version: string;
  processingTimeMs: number;
  retryCount: number;
  errorCount: number;
  qualityScore?: number;
  relevanceScore?: number;
  clarityScore?: number;
  actionableScore?: number;
  biasCheck?: BiasCheckResult;
  factCheck?: FactCheckResult;
  citations?: string[];
  disclaimers?: string[];
}

export interface BiasCheckResult {
  score: number; // 0-1, higher is less biased
  detectedBiases: string[];
  confidence: number;
  recommendations: string[];
}

export interface FactCheckResult {
  score: number; // 0-1, higher is more factual
  verifiedClaims: number;
  unverifiedClaims: number;
  contradictedClaims: number;
  sources: string[];
  confidence: number;
}

export interface ExplanationTemplate {
  id: string;
  name: string;
  description: string;
  type: ExplanationType;
  category: ExplanationCategory;
  promptTemplate: string;
  variables: TemplateVariable[];
  defaultModel: GPTModel;
  enabled: boolean;
  usage: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: string;
}

export interface ExplanationFeedback {
  explanationId: string;
  userId: string;
  rating: number; // 1-5 stars
  helpful: boolean;
  accurate: boolean;
  clear: boolean;
  actionable: boolean;
  comments?: string;
  suggestedImprovements?: string[];
  timestamp: Date;
  userLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ExplanationAnalysis {
  id: string;
  explanationId: string;
  analysisType: 'sentiment' | 'complexity' | 'accuracy' | 'completeness' | 'bias' | 'quality';
  score: number;
  details: Record<string, any>;
  automated: boolean;
  analysisModel?: string;
  timestamp: Date;
}

export interface GPTExplanationLogState {
  explanations: GPTExplanation[];
  templates: ExplanationTemplate[];
  feedback: ExplanationFeedback[];
  analysis: ExplanationAnalysis[];
  selectedExplanation: GPTExplanation | null;
  selectedTemplate: ExplanationTemplate | null;
  filter: ExplanationFilter;
  isLoading: boolean;
  error: string | null;
  stats: ExplanationStats | null;
  models: GPTModel[];
}

export interface ExplanationFilter {
  type?: ExplanationType;
  category?: ExplanationCategory;
  model?: string;
  userId?: string;
  sessionId?: string;
  validated?: boolean;
  minConfidence?: number;
  maxConfidence?: number;
  minAccuracy?: number;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
  tags?: string[];
  minRating?: number;
  language?: string;
  hasErrors?: boolean;
}

export interface ExplanationStats {
  totalExplanations: number;
  explanationsLast24h: number;
  explanationsLast7d: number;
  averageConfidence: number;
  averageAccuracy: number;
  averageRating: number;
  totalTokensUsed: number;
  totalCost: number;
  mostUsedType: ExplanationType | null;
  mostUsedModel: string | null;
  topCategories: Array<{ category: ExplanationCategory; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
  errorRate: number;
  retryRate: number;
  validationRate: number;
  qualityScore: number;
}

export interface ExplanationActions {
  generateExplanation: (context: ExplanationContext, prompt: string, model?: GPTModel) => Promise<GPTExplanation>;
  validateExplanation: (explanationId: string, validatorId: string, accuracy: number) => Promise<boolean>;
  provideFeedback: (explanationId: string, feedback: Omit<ExplanationFeedback, 'explanationId' | 'timestamp'>) => Promise<ExplanationFeedback>;
  createTemplate: (template: Omit<ExplanationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'rating'>) => Promise<ExplanationTemplate>;
  updateTemplate: (templateId: string, updates: Partial<ExplanationTemplate>) => Promise<boolean>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  searchExplanations: (query: string, filters?: ExplanationFilter) => Promise<GPTExplanation[]>;
  exportExplanations: (explanationIds?: string[], format?: 'json' | 'csv' | 'pdf') => Promise<string>;
  analyzeExplanation: (explanationId: string, analysisType: ExplanationAnalysis['analysisType']) => Promise<ExplanationAnalysis>;
  getUsageStats: (period?: { start: Date; end: Date }) => Promise<ExplanationStats>;
  refreshData: () => Promise<void>;
}

export interface ExplanationEvent {
  id: string;
  type: 'explanation_generated' | 'explanation_validated' | 'feedback_provided' | 'template_created' | 'template_used' | 'error_occurred';
  explanationId?: string;
  templateId?: string;
  userId?: string;
  timestamp: Date;
  data: Record<string, any>;
  processed: boolean;
}

export interface ExplanationAudit {
  period: { start: Date; end: Date };
  totalExplanations: number;
  byType: Record<ExplanationType, number>;
  byCategory: Record<ExplanationCategory, number>;
  byModel: Record<string, number>;
  byUser: Record<string, number>;
  qualityMetrics: {
    averageConfidence: number;
    averageAccuracy: number;
    averageRating: number;
    validationRate: number;
    errorRate: number;
  };
  costAnalysis: {
    totalCost: number;
    totalTokens: number;
    costPerExplanation: number;
    costByModel: Record<string, number>;
  };
  topPerformers: {
    templates: Array<{ templateId: string; usage: number; rating: number }>;
    models: Array<{ model: string; accuracy: number; usage: number }>;
  };
  issues: Array<{
    type: 'bias' | 'inaccuracy' | 'low_quality' | 'high_cost' | 'error';
    count: number;
    examples: string[];
    recommendations: string[];
  }>;
}

export interface ExplanationCache {
  key: string;
  explanation: GPTExplanation;
  expiresAt: Date;
  hits: number;
  lastUsed: Date;
}

export interface ExplanationQueue {
  id: string;
  context: ExplanationContext;
  prompt: string;
  model: GPTModel;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  result?: GPTExplanation;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelPerformance {
  modelName: string;
  provider: string;
  version: string;
  metrics: {
    averageAccuracy: number;
    averageConfidence: number;
    averageRating: number;
    averageResponseTime: number;
    errorRate: number;
    tokensPerResponse: number;
    costPerResponse: number;
  };
  usageCount: number;
  lastUsed: Date;
  recommendations: string[];
}

export interface ExplanationWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  enabled: boolean;
  executionCount: number;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'condition' | 'manual';
  config: Record<string, any>;
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  type: 'generate_explanation' | 'validate' | 'analyze' | 'notify' | 'store' | 'condition';
  config: Record<string, any>;
  order: number;
  enabled: boolean;
  onError: 'continue' | 'stop' | 'retry';
}

export interface ExplanationNotification {
  id: string;
  explanationId: string;
  type: 'generation_complete' | 'validation_required' | 'quality_alert' | 'cost_alert' | 'error_alert';
  recipients: string[];
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('email' | 'sms' | 'webhook' | 'in_app')[];
  scheduled: boolean;
  scheduledFor?: Date;
  sent: boolean;
  sentAt?: Date;
  deliveryStatus: Record<string, 'pending' | 'delivered' | 'failed'>;
}

export interface ExplanationConfig {
  defaultModel: GPTModel;
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
  retryAttempts: number;
  cacheTtlHours: number;
  qualityThresholds: {
    minConfidence: number;
    minAccuracy: number;
    minRating: number;
  };
  costLimits: {
    dailyLimit: number;
    monthlyLimit: number;
    perRequestLimit: number;
  };
  biasDetection: {
    enabled: boolean;
    threshold: number;
    categories: string[];
  };
  factChecking: {
    enabled: boolean;
    sources: string[];
    threshold: number;
  };
  notifications: {
    enabled: boolean;
    channels: string[];
    thresholds: Record<string, number>;
  };
} 