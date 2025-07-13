// Block 46: GPT Explanation Log - Engine
import { 
  GPTExplanation, 
  ExplanationType,
  ExplanationCategory,
  ExplanationContext,
  GPTModel,
  TokenUsage,
  ExplanationMetadata,
  ExplanationTemplate,
  ExplanationFeedback,
  ExplanationAnalysis,
  ExplanationStats,
  ExplanationAudit,
  ExplanationCache,
  ExplanationQueue,
  ModelPerformance,
  ExplanationEvent,
  BiasCheckResult,
  FactCheckResult
} from '../types/gptExplanationLog';

export class GPTExplanationLogEngine {
  private explanations: Map<string, GPTExplanation> = new Map();
  private templates: Map<string, ExplanationTemplate> = new Map();
  private feedback: Map<string, ExplanationFeedback> = new Map();
  private analyses: Map<string, ExplanationAnalysis> = new Map();
  private cache: Map<string, ExplanationCache> = new Map();
  private queue: Map<string, ExplanationQueue> = new Map();
  private events: Map<string, ExplanationEvent> = new Map();
  private models: Map<string, GPTModel> = new Map();
  private modelPerformance: Map<string, ModelPerformance> = new Map();

  constructor() {
    this.initializeDefaultModels();
    this.initializeDefaultTemplates();
  }

  /**
   * Generate an explanation using GPT
   */
  async generateExplanation(
    context: ExplanationContext,
    prompt: string,
    model?: GPTModel,
    templateId?: string
  ): Promise<GPTExplanation> {
    const selectedModel = model || this.getDefaultModel();
    const sessionId = this.generateSessionId();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(context, prompt, selectedModel);
    const cached = this.getCachedExplanation(cacheKey);
    if (cached) {
      cached.hits++;
      cached.lastUsed = new Date();
      console.log(`[GPTExplanationLog] Using cached explanation: ${cached.explanation.id}`);
      return cached.explanation;
    }

    const startTime = Date.now();
    
    try {
      // Generate response (mock implementation)
      const response = await this.callGPTAPI(prompt, selectedModel, context);
      const processingTime = Date.now() - startTime;

      // Calculate confidence and quality scores
      const confidence = this.calculateConfidence(response, context);
      const qualityScores = await this.analyzeQuality(response, context);

      // Perform bias and fact checking
      const biasCheck = await this.performBiasCheck(response, context);
      const factCheck = await this.performFactCheck(response, context);

      // Create explanation record
      const explanation: GPTExplanation = {
        id: this.generateId(),
        type: this.determineType(context, prompt),
        category: this.determineCategory(context, prompt),
        context,
        prompt,
        response: response.text,
        model: selectedModel,
        confidence,
        tokens: response.tokens,
        metadata: {
          source: 'GPTExplanationLogEngine',
          version: '1.0.0',
          processingTimeMs: processingTime,
          retryCount: 0,
          errorCount: 0,
          qualityScore: qualityScores.overall,
          relevanceScore: qualityScores.relevance,
          clarityScore: qualityScores.clarity,
          actionableScore: qualityScores.actionable,
          biasCheck,
          factCheck,
          citations: this.extractCitations(response.text),
          disclaimers: this.generateDisclaimers(context)
        },
        timestamp: new Date(),
        sessionId,
        validated: false,
        tags: this.generateTags(context, response.text),
        correlationId: context.triggerEvent
      };

      // Store explanation
      this.explanations.set(explanation.id, explanation);

      // Cache for future use
      this.cacheExplanation(cacheKey, explanation);

      // Update model performance
      this.updateModelPerformance(selectedModel, explanation, processingTime);

      // Update template usage if applicable
      if (templateId) {
        this.updateTemplateUsage(templateId);
      }

      // Create event
      this.createEvent('explanation_generated', explanation.id, context.subject, {
        type: explanation.type,
        category: explanation.category,
        confidence: explanation.confidence,
        tokens: explanation.tokens.totalTokens
      });

      console.log(`[GPTExplanationLog] Generated explanation: ${explanation.id}`);
      return explanation;

    } catch (error) {
      console.error('[GPTExplanationLog] Failed to generate explanation:', error);
      
      // Create error event
      this.createEvent('error_occurred', undefined, context.subject, {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        prompt: prompt.substring(0, 100) // First 100 chars only
      });
      
      throw error;
    }
  }

  /**
   * Validate an explanation
   */
  async validateExplanation(explanationId: string, validatorId: string, accuracy: number): Promise<boolean> {
    const explanation = this.explanations.get(explanationId);
    if (!explanation) {
      throw new Error(`Explanation ${explanationId} not found`);
    }

    explanation.validated = true;
    explanation.validatedBy = validatorId;
    explanation.validatedAt = new Date();
    explanation.accuracy = accuracy;

    // Update model performance with validation data
    const modelKey = this.getModelKey(explanation.model);
    const performance = this.modelPerformance.get(modelKey);
    if (performance) {
      // Update accuracy with moving average
      const totalValidations = performance.usageCount;
      performance.metrics.averageAccuracy = 
        (performance.metrics.averageAccuracy * (totalValidations - 1) + accuracy) / totalValidations;
    }

    // Create event
    this.createEvent('explanation_validated', explanationId, validatorId, {
      accuracy,
      previouslyValidated: explanation.validated
    });

    return true;
  }

  /**
   * Provide feedback on an explanation
   */
  async provideFeedback(
    explanationId: string, 
    feedbackData: Omit<ExplanationFeedback, 'explanationId' | 'timestamp'>
  ): Promise<ExplanationFeedback> {
    const explanation = this.explanations.get(explanationId);
    if (!explanation) {
      throw new Error(`Explanation ${explanationId} not found`);
    }

    const feedback: ExplanationFeedback = {
      ...feedbackData,
      explanationId,
      timestamp: new Date()
    };

    this.feedback.set(this.generateId(), feedback);

    // Update explanation with feedback summary
    explanation.feedback = feedback.comments;

    // Update model performance with rating
    const modelKey = this.getModelKey(explanation.model);
    const performance = this.modelPerformance.get(modelKey);
    if (performance) {
      const totalRatings = performance.usageCount;
      performance.metrics.averageRating = 
        (performance.metrics.averageRating * (totalRatings - 1) + feedback.rating) / totalRatings;
    }

    // Create event
    this.createEvent('feedback_provided', explanationId, feedback.userId, {
      rating: feedback.rating,
      helpful: feedback.helpful,
      accurate: feedback.accurate
    });

    return feedback;
  }

  /**
   * Create a new template
   */
  async createTemplate(
    template: Omit<ExplanationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'rating'>
  ): Promise<ExplanationTemplate> {
    const fullTemplate: ExplanationTemplate = {
      ...template,
      id: this.generateId(),
      usage: 0,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(fullTemplate.id, fullTemplate);

    // Create event
    this.createEvent('template_created', undefined, undefined, {
      templateId: fullTemplate.id,
      name: fullTemplate.name,
      type: fullTemplate.type
    });

    return fullTemplate;
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<ExplanationTemplate>): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) return false;

    Object.assign(template, updates);
    template.updatedAt = new Date();

    return true;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    return this.templates.delete(templateId);
  }

  /**
   * Search explanations
   */
  async searchExplanations(query: string, filters?: any): Promise<GPTExplanation[]> {
    let results = Array.from(this.explanations.values());

    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(exp =>
        exp.response.toLowerCase().includes(lowerQuery) ||
        exp.prompt.toLowerCase().includes(lowerQuery) ||
        exp.context.subject.toLowerCase().includes(lowerQuery) ||
        exp.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.type) {
        results = results.filter(exp => exp.type === filters.type);
      }
      if (filters.category) {
        results = results.filter(exp => exp.category === filters.category);
      }
      if (filters.validated !== undefined) {
        results = results.filter(exp => exp.validated === filters.validated);
      }
      if (filters.minConfidence) {
        results = results.filter(exp => exp.confidence >= filters.minConfidence);
      }
      if (filters.dateFrom) {
        results = results.filter(exp => exp.timestamp >= filters.dateFrom);
      }
      if (filters.dateTo) {
        results = results.filter(exp => exp.timestamp <= filters.dateTo);
      }
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Analyze explanation quality
   */
  async analyzeExplanation(
    explanationId: string, 
    analysisType: ExplanationAnalysis['analysisType']
  ): Promise<ExplanationAnalysis> {
    const explanation = this.explanations.get(explanationId);
    if (!explanation) {
      throw new Error(`Explanation ${explanationId} not found`);
    }

    const analysis: ExplanationAnalysis = {
      id: this.generateId(),
      explanationId,
      analysisType,
      score: await this.performAnalysis(explanation, analysisType),
      details: await this.getAnalysisDetails(explanation, analysisType),
      automated: true,
      analysisModel: 'internal_analyzer_v1',
      timestamp: new Date()
    };

    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  /**
   * Export explanations
   */
  async exportExplanations(explanationIds?: string[], format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string> {
    let explanations = explanationIds 
      ? explanationIds.map(id => this.explanations.get(id)).filter(Boolean) as GPTExplanation[]
      : Array.from(this.explanations.values());

    switch (format) {
      case 'json':
        return JSON.stringify(explanations, null, 2);
      
      case 'csv':
        return this.exportToCsv(explanations);
      
      case 'pdf':
        return this.exportToPdf(explanations);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(period?: { start: Date; end: Date }): Promise<ExplanationStats> {
    const explanations = Array.from(this.explanations.values());
    let filteredExplanations = explanations;

    if (period) {
      filteredExplanations = explanations.filter(exp => 
        exp.timestamp >= period.start && exp.timestamp <= period.end
      );
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate category counts
    const categoryMap = new Map<ExplanationCategory, number>();
    const tagMap = new Map<string, number>();
    const typeMap = new Map<ExplanationType, number>();

    filteredExplanations.forEach(exp => {
      // Categories
      categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + 1);
      
      // Types
      typeMap.set(exp.type, (typeMap.get(exp.type) || 0) + 1);
      
      // Tags
      exp.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topTags = Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Find most used type and model
    const mostUsedType = Array.from(typeMap.entries())
      .reduce((max, [type, count]) => count > max.count ? { type, count } : max, { type: null as ExplanationType | null, count: 0 }).type;

    const modelCounts = new Map<string, number>();
    filteredExplanations.forEach(exp => {
      const modelKey = this.getModelKey(exp.model);
      modelCounts.set(modelKey, (modelCounts.get(modelKey) || 0) + 1);
    });
    
    const mostUsedModel = Array.from(modelCounts.entries())
      .reduce((max, [model, count]) => count > max.count ? { model, count } : max, { model: null as string | null, count: 0 }).model;

    return {
      totalExplanations: filteredExplanations.length,
      explanationsLast24h: explanations.filter(exp => exp.timestamp >= last24h).length,
      explanationsLast7d: explanations.filter(exp => exp.timestamp >= last7d).length,
      averageConfidence: this.calculateAverage(filteredExplanations.map(exp => exp.confidence)),
      averageAccuracy: this.calculateAverage(filteredExplanations.filter(exp => exp.accuracy).map(exp => exp.accuracy!)),
      averageRating: this.calculateAverageRating(filteredExplanations),
      totalTokensUsed: filteredExplanations.reduce((sum, exp) => sum + exp.tokens.totalTokens, 0),
      totalCost: filteredExplanations.reduce((sum, exp) => sum + (exp.tokens.cost || 0), 0),
      mostUsedType,
      mostUsedModel,
      topCategories,
      topTags,
      errorRate: this.calculateErrorRate(filteredExplanations),
      retryRate: this.calculateRetryRate(filteredExplanations),
      validationRate: filteredExplanations.filter(exp => exp.validated).length / filteredExplanations.length,
      qualityScore: this.calculateAverageQuality(filteredExplanations)
    };
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(period: { start: Date; end: Date }): Promise<ExplanationAudit> {
    const explanations = Array.from(this.explanations.values())
      .filter(exp => exp.timestamp >= period.start && exp.timestamp <= period.end);

    const byType = {} as Record<ExplanationType, number>;
    const byCategory = {} as Record<ExplanationCategory, number>;
    const byModel = {} as Record<string, number>;
    const byUser = {} as Record<string, number>;

    explanations.forEach(exp => {
      byType[exp.type] = (byType[exp.type] || 0) + 1;
      byCategory[exp.category] = (byCategory[exp.category] || 0) + 1;
      
      const modelKey = this.getModelKey(exp.model);
      byModel[modelKey] = (byModel[modelKey] || 0) + 1;
      
      if (exp.userId) {
        byUser[exp.userId] = (byUser[exp.userId] || 0) + 1;
      }
    });

    return {
      period,
      totalExplanations: explanations.length,
      byType,
      byCategory,
      byModel,
      byUser,
      qualityMetrics: {
        averageConfidence: this.calculateAverage(explanations.map(exp => exp.confidence)),
        averageAccuracy: this.calculateAverage(explanations.filter(exp => exp.accuracy).map(exp => exp.accuracy!)),
        averageRating: this.calculateAverageRating(explanations),
        validationRate: explanations.filter(exp => exp.validated).length / explanations.length,
        errorRate: this.calculateErrorRate(explanations)
      },
      costAnalysis: {
        totalCost: explanations.reduce((sum, exp) => sum + (exp.tokens.cost || 0), 0),
        totalTokens: explanations.reduce((sum, exp) => sum + exp.tokens.totalTokens, 0),
        costPerExplanation: explanations.length > 0 ? 
          explanations.reduce((sum, exp) => sum + (exp.tokens.cost || 0), 0) / explanations.length : 0,
        costByModel: this.calculateCostByModel(explanations)
      },
      topPerformers: {
        templates: this.getTopTemplates(),
        models: this.getTopModels()
      },
      issues: this.identifyIssues(explanations)
    };
  }

  /**
   * Get all explanations
   */
  getAllExplanations(): GPTExplanation[] {
    return Array.from(this.explanations.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ExplanationTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all feedback
   */
  getAllFeedback(): ExplanationFeedback[] {
    return Array.from(this.feedback.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get explanation by ID
   */
  getExplanation(explanationId: string): GPTExplanation | undefined {
    return this.explanations.get(explanationId);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ExplanationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get available models
   */
  getAvailableModels(): GPTModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Private helper methods
   */
  private async callGPTAPI(prompt: string, model: GPTModel, context: ExplanationContext): Promise<{text: string, tokens: TokenUsage}> {
    // Mock GPT API call - in production, this would call actual GPT API
    const delay = Math.random() * 2000 + 500; // 0.5-2.5s delay
    await new Promise(resolve => setTimeout(resolve, delay));

    const mockResponses = [
      "Based on current market conditions and technical indicators, this represents a strategic opportunity with moderate risk exposure.",
      "The analysis suggests a diversified approach focusing on long-term value creation while maintaining appropriate risk management.",
      "Current market volatility indicates a cautious but optimistic outlook, with emphasis on fundamental analysis over short-term movements.",
      "The recommended strategy balances growth potential with downside protection, considering macroeconomic factors and sector rotation patterns."
    ];

    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    const promptTokens = Math.floor(prompt.length / 4); // Rough estimate
    const completionTokens = Math.floor(response.length / 4);
    
    return {
      text: response,
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost: (promptTokens + completionTokens) * 0.0001, // Mock cost
        currency: 'USD'
      }
    };
  }

  private calculateConfidence(response: {text: string}, context: ExplanationContext): number {
    // Mock confidence calculation based on response length, context, etc.
    const baseConfidence = 0.7;
    const lengthBonus = Math.min(response.text.length / 1000, 0.2);
    const contextBonus = context.userLevel === 'expert' ? 0.1 : 0.05;
    
    return Math.min(baseConfidence + lengthBonus + contextBonus, 0.95);
  }

  private async analyzeQuality(response: {text: string}, context: ExplanationContext): Promise<{
    overall: number;
    relevance: number;
    clarity: number;
    actionable: number;
  }> {
    // Mock quality analysis
    return {
      overall: 0.8 + Math.random() * 0.15,
      relevance: 0.75 + Math.random() * 0.2,
      clarity: 0.85 + Math.random() * 0.1,
      actionable: 0.7 + Math.random() * 0.25
    };
  }

  private async performBiasCheck(response: {text: string}, context: ExplanationContext): Promise<BiasCheckResult> {
    // Mock bias checking
    return {
      score: 0.85 + Math.random() * 0.1,
      detectedBiases: Math.random() > 0.8 ? ['confirmation_bias'] : [],
      confidence: 0.9,
      recommendations: Math.random() > 0.7 ? ['Consider alternative viewpoints'] : []
    };
  }

  private async performFactCheck(response: {text: string}, context: ExplanationContext): Promise<FactCheckResult> {
    // Mock fact checking
    return {
      score: 0.9 + Math.random() * 0.05,
      verifiedClaims: 3,
      unverifiedClaims: 1,
      contradictedClaims: 0,
      sources: ['market_data', 'financial_statements'],
      confidence: 0.85
    };
  }

  private determineType(context: ExplanationContext, prompt: string): ExplanationType {
    // Simple heuristic to determine explanation type
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('risk')) return 'risk_assessment';
    if (lowerPrompt.includes('strategy')) return 'strategy_recommendation';
    if (lowerPrompt.includes('market')) return 'market_analysis';
    if (lowerPrompt.includes('portfolio')) return 'portfolio_optimization';
    if (lowerPrompt.includes('trade')) return 'trade_decision';
    return 'market_analysis'; // Default
  }

  private determineCategory(context: ExplanationContext, prompt: string): ExplanationCategory {
    // Simple heuristic to determine category
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('risk')) return 'risk';
    if (lowerPrompt.includes('compliance')) return 'compliance';
    if (lowerPrompt.includes('education') || lowerPrompt.includes('explain')) return 'education';
    if (lowerPrompt.includes('predict')) return 'prediction';
    return 'investment'; // Default
  }

  private generateTags(context: ExplanationContext, response: string): string[] {
    const tags: string[] = [];
    
    // Add context-based tags
    if (context.relatedAssets) {
      tags.push(...context.relatedAssets.map(asset => `asset:${asset}`));
    }
    
    if (context.marketConditions) {
      tags.push(`trend:${context.marketConditions.trend}`);
      tags.push(`volatility:${context.marketConditions.volatility}`);
    }
    
    if (context.userLevel) {
      tags.push(`level:${context.userLevel}`);
    }
    
    // Add response-based tags
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('bullish')) tags.push('sentiment:bullish');
    if (lowerResponse.includes('bearish')) tags.push('sentiment:bearish');
    if (lowerResponse.includes('risk')) tags.push('topic:risk');
    if (lowerResponse.includes('opportunity')) tags.push('topic:opportunity');
    
    return tags;
  }

  private extractCitations(response: string): string[] {
    // Mock citation extraction
    const citations: string[] = [];
    if (response.includes('market data')) citations.push('Market Data Analysis');
    if (response.includes('technical')) citations.push('Technical Analysis');
    if (response.includes('fundamental')) citations.push('Fundamental Analysis');
    return citations;
  }

  private generateDisclaimers(context: ExplanationContext): string[] {
    return [
      'This is AI-generated content and should not be considered as financial advice.',
      'Please consult with a qualified financial advisor before making investment decisions.',
      'Past performance does not guarantee future results.'
    ];
  }

  private async performAnalysis(explanation: GPTExplanation, analysisType: string): Promise<number> {
    // Mock analysis scoring
    return 0.7 + Math.random() * 0.25;
  }

  private async getAnalysisDetails(explanation: GPTExplanation, analysisType: string): Promise<Record<string, any>> {
    // Mock analysis details
    return {
      methodology: 'automated_analysis',
      factors: ['length', 'complexity', 'clarity', 'actionability'],
      scores: {
        length: 0.8,
        complexity: 0.7,
        clarity: 0.9,
        actionability: 0.75
      }
    };
  }

  private exportToCsv(explanations: GPTExplanation[]): string {
    const headers = ['ID', 'Type', 'Category', 'Confidence', 'Timestamp', 'Validated', 'Model', 'Tokens'];
    const rows = explanations.map(exp => [
      exp.id,
      exp.type,
      exp.category,
      exp.confidence.toFixed(3),
      exp.timestamp.toISOString(),
      exp.validated ? 'Yes' : 'No',
      exp.model.name,
      exp.tokens.totalTokens.toString()
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private exportToPdf(explanations: GPTExplanation[]): string {
    // Mock PDF export
    return `PDF export of ${explanations.length} GPT explanations`;
  }

  private generateCacheKey(context: ExplanationContext, prompt: string, model: GPTModel): string {
    const contextStr = JSON.stringify(context);
    const modelStr = `${model.name}_${model.version}`;
    return `${contextStr}_${prompt}_${modelStr}`;
  }

  private getCachedExplanation(key: string): ExplanationCache | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired
    }
    return null;
  }

  private cacheExplanation(key: string, explanation: GPTExplanation): void {
    const cache: ExplanationCache = {
      key,
      explanation,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      hits: 0,
      lastUsed: new Date()
    };
    this.cache.set(key, cache);
  }

  private updateModelPerformance(model: GPTModel, explanation: GPTExplanation, processingTime: number): void {
    const modelKey = this.getModelKey(model);
    let performance = this.modelPerformance.get(modelKey);
    
    if (!performance) {
      performance = {
        modelName: model.name,
        provider: model.provider,
        version: model.version,
        metrics: {
          averageAccuracy: 0,
          averageConfidence: explanation.confidence,
          averageRating: 0,
          averageResponseTime: processingTime,
          errorRate: 0,
          tokensPerResponse: explanation.tokens.totalTokens,
          costPerResponse: explanation.tokens.cost || 0
        },
        usageCount: 1,
        lastUsed: new Date(),
        recommendations: []
      };
    } else {
      const count = performance.usageCount;
      performance.metrics.averageConfidence = 
        (performance.metrics.averageConfidence * count + explanation.confidence) / (count + 1);
      performance.metrics.averageResponseTime = 
        (performance.metrics.averageResponseTime * count + processingTime) / (count + 1);
      performance.metrics.tokensPerResponse = 
        (performance.metrics.tokensPerResponse * count + explanation.tokens.totalTokens) / (count + 1);
      performance.metrics.costPerResponse = 
        (performance.metrics.costPerResponse * count + (explanation.tokens.cost || 0)) / (count + 1);
      
      performance.usageCount++;
      performance.lastUsed = new Date();
    }
    
    this.modelPerformance.set(modelKey, performance);
  }

  private updateTemplateUsage(templateId: string): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.usage++;
      template.updatedAt = new Date();
      
      // Create event
      this.createEvent('template_used', undefined, undefined, {
        templateId,
        usage: template.usage
      });
    }
  }

  private createEvent(
    type: ExplanationEvent['type'], 
    explanationId?: string, 
    userId?: string, 
    data: Record<string, any> = {}
  ): void {
    const event: ExplanationEvent = {
      id: this.generateId(),
      type,
      explanationId,
      userId,
      timestamp: new Date(),
      data,
      processed: false
    };
    
    this.events.set(event.id, event);
  }

  // Calculation helpers
  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateAverageRating(explanations: GPTExplanation[]): number {
    const ratings = Array.from(this.feedback.values())
      .filter(f => explanations.some(exp => exp.id === f.explanationId))
      .map(f => f.rating);
    return this.calculateAverage(ratings);
  }

  private calculateErrorRate(explanations: GPTExplanation[]): number {
    const totalErrors = explanations.reduce((sum, exp) => sum + exp.metadata.errorCount, 0);
    return explanations.length > 0 ? totalErrors / explanations.length : 0;
  }

  private calculateRetryRate(explanations: GPTExplanation[]): number {
    const totalRetries = explanations.reduce((sum, exp) => sum + exp.metadata.retryCount, 0);
    return explanations.length > 0 ? totalRetries / explanations.length : 0;
  }

  private calculateAverageQuality(explanations: GPTExplanation[]): number {
    const qualityScores = explanations
      .filter(exp => exp.metadata.qualityScore)
      .map(exp => exp.metadata.qualityScore!);
    return this.calculateAverage(qualityScores);
  }

  private calculateCostByModel(explanations: GPTExplanation[]): Record<string, number> {
    const costByModel: Record<string, number> = {};
    explanations.forEach(exp => {
      const modelKey = this.getModelKey(exp.model);
      costByModel[modelKey] = (costByModel[modelKey] || 0) + (exp.tokens.cost || 0);
    });
    return costByModel;
  }

  private getTopTemplates(): Array<{ templateId: string; usage: number; rating: number }> {
    return Array.from(this.templates.values())
      .map(template => ({
        templateId: template.id,
        usage: template.usage,
        rating: template.rating
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);
  }

  private getTopModels(): Array<{ model: string; accuracy: number; usage: number }> {
    return Array.from(this.modelPerformance.values())
      .map(perf => ({
        model: perf.modelName,
        accuracy: perf.metrics.averageAccuracy,
        usage: perf.usageCount
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);
  }

  private identifyIssues(explanations: GPTExplanation[]): Array<{
    type: 'bias' | 'inaccuracy' | 'low_quality' | 'high_cost' | 'error';
    count: number;
    examples: string[];
    recommendations: string[];
  }> {
    const issues: any[] = [];
    
    // Check for low quality explanations
    const lowQuality = explanations.filter(exp => 
      exp.metadata.qualityScore && exp.metadata.qualityScore < 0.6
    );
    if (lowQuality.length > 0) {
      issues.push({
        type: 'low_quality',
        count: lowQuality.length,
        examples: lowQuality.slice(0, 3).map(exp => exp.id),
        recommendations: ['Review prompts for clarity', 'Consider different models']
      });
    }
    
    return issues;
  }

  private getModelKey(model: GPTModel): string {
    return `${model.provider}_${model.name}_${model.version}`;
  }

  private getDefaultModel(): GPTModel {
    return Array.from(this.models.values())[0] || {
      name: 'gpt-4',
      version: '1.0',
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 2000
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize default models
   */
  private initializeDefaultModels(): void {
    const defaultModels: GPTModel[] = [
      {
        name: 'gpt-4',
        version: '1.0',
        provider: 'openai',
        temperature: 0.7,
        maxTokens: 2000
      },
      {
        name: 'gpt-3.5-turbo',
        version: '1.0',
        provider: 'openai',
        temperature: 0.8,
        maxTokens: 1500
      },
      {
        name: 'claude-3',
        version: '1.0',
        provider: 'anthropic',
        temperature: 0.6,
        maxTokens: 2500
      }
    ];

    defaultModels.forEach(model => {
      this.models.set(this.getModelKey(model), model);
    });
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<ExplanationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'rating'>[] = [
      {
        name: 'Market Analysis',
        description: 'Template for analyzing market conditions and trends',
        type: 'market_analysis',
        category: 'analysis',
        promptTemplate: 'Analyze the current market conditions for {asset} considering {timeframe} timeframe. Focus on {factors}.',
        variables: [
          { name: 'asset', type: 'string', required: true, description: 'Asset to analyze' },
          { name: 'timeframe', type: 'string', required: true, description: 'Analysis timeframe' },
          { name: 'factors', type: 'array', required: false, description: 'Specific factors to consider' }
        ],
        defaultModel: this.getDefaultModel(),
        enabled: true
      },
      {
        name: 'Risk Assessment',
        description: 'Template for evaluating investment risks',
        type: 'risk_assessment',
        category: 'risk',
        promptTemplate: 'Evaluate the risk profile of {investment} considering {riskFactors}. Provide risk rating and mitigation strategies.',
        variables: [
          { name: 'investment', type: 'string', required: true, description: 'Investment to evaluate' },
          { name: 'riskFactors', type: 'array', required: false, description: 'Specific risk factors to consider' }
        ],
        defaultModel: this.getDefaultModel(),
        enabled: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.createTemplate(template);
    });
  }
}

// Singleton instance
export const gptExplanationLogEngine = new GPTExplanationLogEngine(); 