// Block 25: Strategy Overlay Selector - Engine
// Core engine for strategy overlay selection and management

import {
  StrategyOverlay,
  OverlaySelection,
  OverlayRecommendation,
  OverlayComparison,
  OverlaySimulation,
  OverlaySelector,
  SelectionCriteria,
  OverlayFilter,
  OverlaySorting,
  ComparisonCriteria,
  SimulationParameters,
  OverlayType,
  StrategyCategory,
  RiskLevel,
  OverlayError,
  SelectionError,
  SimulationError
} from '../types/strategyOverlaySelector';

export class StrategyOverlaySelectorEngine {
  private static instance: StrategyOverlaySelectorEngine;
  private overlays: Map<string, StrategyOverlay> = new Map();
  private selectors: Map<string, OverlaySelector> = new Map();
  private selections: Map<string, OverlaySelection> = new Map();
  private simulations: Map<string, OverlaySimulation> = new Map();
  private recommendations: Map<string, OverlayRecommendation[]> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): StrategyOverlaySelectorEngine {
    if (!StrategyOverlaySelectorEngine.instance) {
      StrategyOverlaySelectorEngine.instance = new StrategyOverlaySelectorEngine();
    }
    return StrategyOverlaySelectorEngine.instance;
  }

  private initializeEngine(): void {
    // Load default overlays
    this.loadDefaultOverlays();
    
    // Initialize recommendation engine
    this.initializeRecommendationEngine();
  }

  // Overlay Management
  public createOverlay(overlay: Omit<StrategyOverlay, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'popularity'>): StrategyOverlay {
    const newOverlay: StrategyOverlay = {
      ...overlay,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      popularity: 0
    };

    this.overlays.set(newOverlay.id, newOverlay);
    return newOverlay;
  }

  public getOverlay(id: string): StrategyOverlay | undefined {
    return this.overlays.get(id);
  }

  public getAllOverlays(): StrategyOverlay[] {
    return Array.from(this.overlays.values());
  }

  public getOverlaysByType(type: OverlayType): StrategyOverlay[] {
    return this.getAllOverlays().filter(overlay => overlay.type === type);
  }

  public getOverlaysByCategory(category: StrategyCategory): StrategyOverlay[] {
    return this.getAllOverlays().filter(overlay => overlay.category === category);
  }

  public getOverlaysByRiskLevel(riskLevel: RiskLevel): StrategyOverlay[] {
    return this.getAllOverlays().filter(overlay => overlay.riskLevel === riskLevel);
  }

  public updateOverlay(id: string, updates: Partial<StrategyOverlay>): StrategyOverlay {
    const overlay = this.overlays.get(id);
    if (!overlay) {
      throw new OverlayError('Overlay not found', 'OVERLAY_NOT_FOUND', { id });
    }

    const updatedOverlay = {
      ...overlay,
      ...updates,
      updatedAt: new Date()
    };

    this.overlays.set(id, updatedOverlay);
    return updatedOverlay;
  }

  public deleteOverlay(id: string): boolean {
    const overlay = this.overlays.get(id);
    if (!overlay) {
      return false;
    }

    // Check if overlay is in use
    const inUse = Array.from(this.selections.values()).some(s => s.overlayId === id);
    if (inUse) {
      throw new OverlayError('Cannot delete overlay that is in use', 'OVERLAY_IN_USE', { id });
    }

    return this.overlays.delete(id);
  }

  // Selection Management
  public createSelection(selection: Omit<OverlaySelection, 'id' | 'selectedAt'>): OverlaySelection {
    const overlay = this.overlays.get(selection.overlayId);
    if (!overlay) {
      throw new SelectionError('Overlay not found', 'OVERLAY_NOT_FOUND', { overlayId: selection.overlayId });
    }

    const newSelection: OverlaySelection = {
      ...selection,
      id: this.generateId(),
      selectedAt: new Date()
    };

    this.selections.set(newSelection.id, newSelection);
    
    // Update overlay usage
    overlay.usageCount++;
    overlay.lastUsed = new Date();
    this.overlays.set(overlay.id, overlay);

    return newSelection;
  }

  public getSelection(id: string): OverlaySelection | undefined {
    return this.selections.get(id);
  }

  public getSelectionsByStrategy(strategyId: string): OverlaySelection[] {
    return Array.from(this.selections.values()).filter(s => s.strategyId === strategyId);
  }

  public updateSelection(id: string, updates: Partial<OverlaySelection>): OverlaySelection {
    const selection = this.selections.get(id);
    if (!selection) {
      throw new SelectionError('Selection not found', 'SELECTION_NOT_FOUND', { id });
    }

    const updatedSelection = {
      ...selection,
      ...updates
    };

    this.selections.set(id, updatedSelection);
    return updatedSelection;
  }

  public deleteSelection(id: string): boolean {
    return this.selections.delete(id);
  }

  // Selector Management
  public createSelector(selector: Omit<OverlaySelector, 'id' | 'createdAt' | 'updatedAt' | 'lastAnalysis'>): OverlaySelector {
    const newSelector: OverlaySelector = {
      ...selector,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalysis: new Date()
    };

    this.selectors.set(newSelector.id, newSelector);
    return newSelector;
  }

  public getSelector(id: string): OverlaySelector | undefined {
    return this.selectors.get(id);
  }

  public getAllSelectors(): OverlaySelector[] {
    return Array.from(this.selectors.values());
  }

  public updateSelector(id: string, updates: Partial<OverlaySelector>): OverlaySelector {
    const selector = this.selectors.get(id);
    if (!selector) {
      throw new SelectionError('Selector not found', 'SELECTOR_NOT_FOUND', { id });
    }

    const updatedSelector = {
      ...selector,
      ...updates,
      updatedAt: new Date()
    };

    this.selectors.set(id, updatedSelector);
    return updatedSelector;
  }

  // Filtering and Sorting
  public filterOverlays(overlays: StrategyOverlay[], filters: OverlayFilter[]): StrategyOverlay[] {
    let filtered = [...overlays];

    filters.forEach(filter => {
      if (!filter.isActive) return;

      filtered = filtered.filter(overlay => {
        const value = this.getOverlayFieldValue(overlay, filter.field);
        return this.evaluateFilter(value, filter.operator, filter.value);
      });
    });

    return filtered;
  }

  public sortOverlays(overlays: StrategyOverlay[], sorting: OverlaySorting): StrategyOverlay[] {
    return [...overlays].sort((a, b) => {
      const primaryResult = this.compareOverlayValues(a, b, sorting.field, sorting.direction);
      
      if (primaryResult === 0 && sorting.secondary) {
        return this.compareOverlayValues(a, b, sorting.secondary.field, sorting.secondary.direction);
      }
      
      return primaryResult;
    });
  }

  // Recommendation Engine
  public async generateRecommendations(
    strategyId: string,
    criteria: SelectionCriteria,
    maxRecommendations: number = 5
  ): Promise<OverlayRecommendation[]> {
    try {
      // Get all available overlays
      const overlays = this.getAllOverlays();
      
      // Filter overlays based on criteria
      const candidates = this.filterOverlaysByCriteria(overlays, criteria);
      
      // Score each candidate
      const scoredOverlays = await Promise.all(
        candidates.map(overlay => this.scoreOverlay(overlay, strategyId, criteria))
      );
      
      // Sort by score
      const sortedOverlays = scoredOverlays.sort((a, b) => b.score - a.score);
      
      // Take top recommendations
      const recommendations = sortedOverlays.slice(0, maxRecommendations);
      
      // Cache recommendations
      this.recommendations.set(strategyId, recommendations);
      
      return recommendations;
    } catch (error) {
      throw new SelectionError(
        'Failed to generate recommendations',
        'RECOMMENDATION_FAILED',
        { strategyId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  public getRecommendations(strategyId: string): OverlayRecommendation[] {
    return this.recommendations.get(strategyId) || [];
  }

  // Comparison Engine
  public async compareOverlays(
    overlayIds: string[],
    criteria: ComparisonCriteria
  ): Promise<OverlayComparison> {
    try {
      const overlays = overlayIds.map(id => this.getOverlay(id)).filter(Boolean) as StrategyOverlay[];
      
      if (overlays.length === 0) {
        throw new SelectionError('No overlays found for comparison', 'NO_OVERLAYS_FOUND', { overlayIds });
      }

      const comparison: OverlayComparison = {
        overlays,
        criteria,
        results: [],
        bestOverall: '',
        bestForRisk: '',
        bestForReturn: '',
        bestForSharpe: '',
        primaryRecommendation: '',
        alternativeRecommendations: [],
        combinationRecommendations: []
      };

      // Analyze each overlay
      for (const overlay of overlays) {
        const result = await this.analyzeOverlayForComparison(overlay, criteria);
        comparison.results.push(result);
      }

      // Determine best overlays
      comparison.bestOverall = this.findBestOverlay(comparison.results, 'overall');
      comparison.bestForRisk = this.findBestOverlay(comparison.results, 'risk');
      comparison.bestForReturn = this.findBestOverlay(comparison.results, 'performance');
      comparison.bestForSharpe = this.findBestOverlay(comparison.results, 'fit');

      // Generate recommendations
      const recommended = comparison.results.filter(r => r.recommended);
      comparison.primaryRecommendation = recommended[0]?.overlayId || '';
      comparison.alternativeRecommendations = recommended.slice(1, 3).map(r => r.overlayId);
      comparison.combinationRecommendations = this.generateCombinationRecommendations(overlays);

      return comparison;
    } catch (error) {
      throw new SelectionError(
        'Failed to compare overlays',
        'COMPARISON_FAILED',
        { overlayIds, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  // Simulation Engine
  public async runSimulation(
    selections: OverlaySelection[],
    parameters: SimulationParameters
  ): Promise<OverlaySimulation> {
    try {
      const simulation: OverlaySimulation = {
        id: this.generateId(),
        name: `Simulation ${new Date().toISOString()}`,
        description: 'Automated simulation',
        overlays: selections,
        parameters,
        results: {
          totalReturn: 0,
          annualizedReturn: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          benchmarkReturn: 0,
          excess: 0,
          beta: 0,
          alpha: 0,
          totalTrades: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0,
          equityCurve: [],
          drawdownCurve: [],
          returns: [],
          overlayPerformance: [],
          riskMetrics: [],
          analysis: '',
          conclusions: [],
          recommendations: []
        },
        createdAt: new Date(),
        status: 'pending'
      };

      this.simulations.set(simulation.id, simulation);

      // Start simulation
      await this.executeSimulation(simulation);

      return simulation;
    } catch (error) {
      throw new SimulationError(
        'Failed to run simulation',
        'SIMULATION_FAILED',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  public getSimulation(id: string): OverlaySimulation | undefined {
    return this.simulations.get(id);
  }

  public getAllSimulations(): OverlaySimulation[] {
    return Array.from(this.simulations.values());
  }

  // Utility Methods
  private loadDefaultOverlays(): void {
    const defaultOverlays = [
      {
        name: 'Momentum Overlay',
        description: 'Momentum-based overlay for trend following',
        type: 'momentum' as OverlayType,
        category: 'momentum' as StrategyCategory,
        parameters: {
          lookback: { type: 'number', value: 20, default: 20, min: 5, max: 100, step: 1, required: true, description: 'Lookback period' },
          threshold: { type: 'number', value: 0.05, default: 0.05, min: 0.01, max: 0.2, step: 0.01, required: true, description: 'Momentum threshold' }
        },
        constraints: {
          minHoldings: 1,
          maxHoldings: 100,
          minValue: 1000,
          maxValue: 1000000,
          allowedAssetTypes: ['equity', 'etf'],
          excludedAssetTypes: [],
          requiredDataSources: ['price', 'volume'],
          minTimeframe: '1d',
          maxTimeframe: '1y',
          allowedTimeframes: ['1d', '1w', '1m'],
          allowedMarkets: ['US', 'AU', 'NZ'],
          excludedMarkets: [],
          requiredMarketHours: false,
          maxConcurrentOverlays: 3,
          mutuallyExclusive: [],
          requiredPrecedence: []
        },
        triggers: [],
        performance: this.generateMockPerformance(),
        backtest: this.generateMockBacktest(),
        author: 'System',
        version: '1.0.0',
        isActive: true,
        isSystem: true,
        riskLevel: 'moderate' as RiskLevel,
        volatility: 0.15,
        maxDrawdown: 0.08,
        compatibleStrategies: ['growth', 'momentum'],
        conflictingStrategies: ['mean_reversion'],
        requiredIndicators: ['RSI', 'MACD'],
        tags: ['momentum', 'trend', 'growth']
      },
      {
        name: 'Risk Management Overlay',
        description: 'Dynamic risk management overlay',
        type: 'risk_management' as OverlayType,
        category: 'defensive' as StrategyCategory,
        parameters: {
          maxDrawdown: { type: 'number', value: 0.05, default: 0.05, min: 0.01, max: 0.2, step: 0.01, required: true, description: 'Maximum drawdown' },
          stopLoss: { type: 'number', value: 0.03, default: 0.03, min: 0.01, max: 0.1, step: 0.01, required: true, description: 'Stop loss threshold' }
        },
        constraints: {
          minHoldings: 1,
          maxHoldings: 1000,
          minValue: 100,
          maxValue: 10000000,
          allowedAssetTypes: ['equity', 'bond', 'etf'],
          excludedAssetTypes: [],
          requiredDataSources: ['price', 'volatility'],
          minTimeframe: '1d',
          maxTimeframe: '1y',
          allowedTimeframes: ['1d', '1w', '1m'],
          allowedMarkets: ['US', 'AU', 'NZ'],
          excludedMarkets: [],
          requiredMarketHours: false,
          maxConcurrentOverlays: 1,
          mutuallyExclusive: [],
          requiredPrecedence: []
        },
        triggers: [],
        performance: this.generateMockPerformance(),
        backtest: this.generateMockBacktest(),
        author: 'System',
        version: '1.0.0',
        isActive: true,
        isSystem: true,
        riskLevel: 'low' as RiskLevel,
        volatility: 0.08,
        maxDrawdown: 0.03,
        compatibleStrategies: ['defensive', 'balanced'],
        conflictingStrategies: [],
        requiredIndicators: ['VIX', 'ATR'],
        tags: ['risk', 'protection', 'defensive']
      }
    ];

    defaultOverlays.forEach(overlay => {
      this.createOverlay(overlay);
    });
  }

  private generateMockPerformance(): any {
    return {
      returns: {
        total: 0.12,
        annualized: 0.10,
        ytd: 0.08,
        mtd: 0.02,
        daily: 0.0004
      },
      risk: {
        volatility: 0.15,
        beta: 1.1,
        alpha: 0.02,
        sharpe: 0.8,
        sortino: 1.2,
        maxDrawdown: 0.08,
        var95: 0.025,
        var99: 0.045
      },
      metrics: {
        winRate: 0.6,
        lossRate: 0.4,
        avgWin: 0.025,
        avgLoss: -0.015,
        profitFactor: 1.5,
        trades: 100,
        successfulTrades: 60,
        failedTrades: 40
      },
      periods: {
        lastDay: 0.001,
        lastWeek: 0.005,
        lastMonth: 0.02,
        lastQuarter: 0.06,
        lastYear: 0.10,
        allTime: 0.12
      }
    };
  }

  private generateMockBacktest(): any {
    return {
      period: {
        start: new Date('2020-01-01'),
        end: new Date('2023-12-31'),
        duration: 1461 // days
      },
      returns: {
        total: 0.32,
        annualized: 0.10,
        benchmark: 0.08,
        excess: 0.02
      },
      risk: {
        volatility: 0.15,
        maxDrawdown: 0.08,
        calmarRatio: 1.25,
        sharpeRatio: 0.8,
        sortinoRatio: 1.2,
        informationRatio: 0.5
      },
      trades: {
        total: 150,
        profitable: 90,
        unprofitable: 60,
        avgReturn: 0.002,
        avgDuration: 10
      },
      monthlyReturns: [],
      drawdownPeriods: [],
      keyMetrics: []
    };
  }

  private initializeRecommendationEngine(): void {
    // Initialize ML models and recommendation algorithms
    console.log('Recommendation engine initialized');
  }

  private filterOverlaysByCriteria(overlays: StrategyOverlay[], criteria: SelectionCriteria): StrategyOverlay[] {
    return overlays.filter(overlay => {
      // Check performance criteria
      if (overlay.performance.returns.annualized < criteria.minReturn) return false;
      if (overlay.performance.risk.volatility > criteria.maxRisk) return false;
      if (overlay.performance.risk.sharpe < criteria.minSharpe) return false;
      if (overlay.performance.risk.maxDrawdown > criteria.maxDrawdown) return false;

      return true;
    });
  }

  private async scoreOverlay(
    overlay: StrategyOverlay,
    strategyId: string,
    criteria: SelectionCriteria
  ): Promise<OverlayRecommendation> {
    // Simulate scoring algorithm
    await this.delay(100);

    const scores = {
      performance: Math.random() * 0.3 + 0.7,
      risk: Math.random() * 0.3 + 0.7,
      fit: Math.random() * 0.3 + 0.7,
      timing: Math.random() * 0.3 + 0.7
    };

    const overallScore = (scores.performance + scores.risk + scores.fit + scores.timing) / 4;

    return {
      overlay,
      score: overallScore,
      confidence: Math.random() * 0.3 + 0.7,
      reasoning: [
        `Strong performance metrics with ${(scores.performance * 100).toFixed(1)}% score`,
        `Risk profile aligns with strategy requirements`,
        `Good strategic fit for current market conditions`
      ],
      strategicFit: scores.fit,
      riskFit: scores.risk,
      performanceFit: scores.performance,
      timingFit: scores.timing,
      expectedImpact: {
        return: 0.02,
        risk: -0.01,
        sharpe: 0.1,
        drawdown: -0.005
      },
      parameterAdjustments: [],
      timingRecommendations: [],
      riskMitigations: []
    };
  }

  private async analyzeOverlayForComparison(overlay: StrategyOverlay, criteria: ComparisonCriteria): Promise<any> {
    // Simulate analysis
    await this.delay(200);

    const scores = {
      overall: Math.random() * 0.4 + 0.6,
      performance: Math.random() * 0.4 + 0.6,
      risk: Math.random() * 0.4 + 0.6,
      fit: Math.random() * 0.4 + 0.6,
      timing: Math.random() * 0.4 + 0.6
    };

    return {
      overlayId: overlay.id,
      scores,
      pros: ['Strong performance', 'Low risk', 'Good fit'],
      cons: ['Limited market coverage', 'Higher fees'],
      performanceAnalysis: 'Consistent performance across market cycles',
      riskAnalysis: 'Well-managed risk profile',
      fitAnalysis: 'Excellent fit with strategy requirements',
      timingAnalysis: 'Good timing for current market conditions',
      recommended: scores.overall > 0.7,
      reasoning: 'Strong overall performance and fit',
      confidence: scores.overall
    };
  }

  private findBestOverlay(results: any[], metric: string): string {
    return results.reduce((best, current) => 
      current.scores[metric] > best.scores[metric] ? current : best
    ).overlayId;
  }

  private generateCombinationRecommendations(overlays: StrategyOverlay[]): string[] {
    // Generate combinations of overlays
    const combinations: string[] = [];
    for (let i = 0; i < overlays.length; i++) {
      for (let j = i + 1; j < overlays.length; j++) {
        combinations.push(`${overlays[i].id}+${overlays[j].id}`);
      }
    }
    return combinations.slice(0, 3); // Return top 3 combinations
  }

  private async executeSimulation(simulation: OverlaySimulation): Promise<void> {
    try {
      simulation.status = 'running';
      this.simulations.set(simulation.id, simulation);

      // Simulate computation
      await this.delay(2000);

      // Generate mock results
      simulation.results = {
        totalReturn: Math.random() * 0.3 + 0.05,
        annualizedReturn: Math.random() * 0.2 + 0.08,
        volatility: Math.random() * 0.1 + 0.1,
        sharpeRatio: Math.random() * 0.5 + 0.5,
        maxDrawdown: Math.random() * 0.05 + 0.02,
        benchmarkReturn: Math.random() * 0.15 + 0.06,
        excess: Math.random() * 0.05 + 0.01,
        beta: Math.random() * 0.5 + 0.8,
        alpha: Math.random() * 0.03 + 0.01,
        totalTrades: Math.floor(Math.random() * 200) + 50,
        winRate: Math.random() * 0.3 + 0.5,
        avgWin: Math.random() * 0.02 + 0.01,
        avgLoss: -(Math.random() * 0.015 + 0.005),
        profitFactor: Math.random() * 1.0 + 1.0,
        equityCurve: [],
        drawdownCurve: [],
        returns: [],
        overlayPerformance: [],
        riskMetrics: [],
        analysis: 'Simulation completed successfully with positive results',
        conclusions: [
          'Strategy shows strong performance',
          'Risk management is effective',
          'Overlay combination works well'
        ],
        recommendations: [
          'Consider increasing position sizes',
          'Monitor market conditions closely',
          'Review quarterly'
        ]
      };

      simulation.status = 'completed';
      simulation.completedAt = new Date();
      this.simulations.set(simulation.id, simulation);
    } catch (error) {
      simulation.status = 'failed';
      this.simulations.set(simulation.id, simulation);
      throw error;
    }
  }

  private getOverlayFieldValue(overlay: StrategyOverlay, field: string): any {
    const fieldParts = field.split('.');
    let value: any = overlay;
    
    for (const part of fieldParts) {
      value = value?.[part];
    }
    
    return value;
  }

  private evaluateFilter(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'eq': return value === filterValue;
      case 'ne': return value !== filterValue;
      case 'gt': return value > filterValue;
      case 'lt': return value < filterValue;
      case 'gte': return value >= filterValue;
      case 'lte': return value <= filterValue;
      case 'in': return Array.isArray(filterValue) && filterValue.includes(value);
      case 'nin': return Array.isArray(filterValue) && !filterValue.includes(value);
      case 'contains': return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'regex': return new RegExp(filterValue).test(String(value));
      default: return true;
    }
  }

  private compareOverlayValues(a: StrategyOverlay, b: StrategyOverlay, field: string, direction: 'asc' | 'desc'): number {
    const aValue = this.getOverlayFieldValue(a, field);
    const bValue = this.getOverlayFieldValue(b, field);
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 