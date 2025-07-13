// Block 91: Rebalance Simulation Engine - Engine
// Portfolio Rebalancing Simulation and Optimization

import {
  RebalanceSimulationEngine as IRebalanceSimulationEngine,
  RebalanceSimulation,
  PortfolioSnapshot,
  TargetAllocation,
  SimulationResults,
  RebalanceAction,
  PerformanceAnalysis,
  RiskAnalysis,
  CostAnalysis,
  TaxAnalysis,
  RebalanceTemplate,
  SimulationParameters,
  OptimizationMethod,
  SimulationStatus
} from '../types/rebalanceSimulationEngine';

export class RebalanceSimulationEngine {
  private static instance: RebalanceSimulationEngine;
  private engines: Map<string, IRebalanceSimulationEngine> = new Map();
  private simulations: Map<string, RebalanceSimulation> = new Map();
  private templates: Map<string, RebalanceTemplate> = new Map();
  private simulationQueue: Map<string, AbortController> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): RebalanceSimulationEngine {
    if (!RebalanceSimulationEngine.instance) {
      RebalanceSimulationEngine.instance = new RebalanceSimulationEngine();
    }
    return RebalanceSimulationEngine.instance;
  }

  private initializeEngine(): void {
    // Initialize with mock data
    this.createMockEngine();
    this.createMockTemplates();
    this.createMockSimulations();
  }

  // Engine Management
  public createEngine(config: Omit<IRebalanceSimulationEngine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): IRebalanceSimulationEngine {
    const newEngine: IRebalanceSimulationEngine = {
      ...config,
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.engines.set(newEngine.id, newEngine);
    return newEngine;
  }

  public updateEngine(id: string, updates: Partial<IRebalanceSimulationEngine>): IRebalanceSimulationEngine {
    const existingEngine = this.engines.get(id);
    if (!existingEngine) {
      throw new Error(`Engine with id ${id} not found`);
    }

    const updatedEngine = {
      ...existingEngine,
      ...updates,
      updatedAt: new Date()
    };

    this.engines.set(id, updatedEngine);
    return updatedEngine;
  }

  public deleteEngine(id: string): void {
    if (!this.engines.has(id)) {
      throw new Error(`Engine with id ${id} not found`);
    }

    // Cancel any active simulations for this engine
    this.cancelEngineSimulations(id);

    this.engines.delete(id);
  }

  public getEngine(id: string): IRebalanceSimulationEngine | undefined {
    return this.engines.get(id);
  }

  public getEngines(): IRebalanceSimulationEngine[] {
    return Array.from(this.engines.values());
  }

  // Simulation Management
  public createSimulation(engineId: string, config: Omit<RebalanceSimulation, 'id' | 'engineId' | 'createdAt' | 'updatedAt'>): RebalanceSimulation {
    const engine = this.engines.get(engineId);
    if (!engine) {
      throw new Error(`Engine with id ${engineId} not found`);
    }

    const newSimulation: RebalanceSimulation = {
      ...config,
      id: this.generateId(),
      engineId,
      status: 'pending',
      startTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.simulations.set(newSimulation.id, newSimulation);
    
    // Add to engine's active simulations
    engine.activeSimulations.push(newSimulation);
    this.engines.set(engineId, engine);

    return newSimulation;
  }

  public async runSimulation(simulationId: string): Promise<SimulationResults> {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    try {
      // Update status
      this.updateSimulationStatus(simulationId, 'running');

      // Create abort controller
      const abortController = new AbortController();
      this.simulationQueue.set(simulationId, abortController);

      // Run simulation
      const results = await this.executeSimulation(simulation, abortController.signal);

      // Update simulation with results
      const updatedSimulation = {
        ...simulation,
        simulationResults: results,
        status: 'completed' as SimulationStatus,
        endTime: new Date(),
        duration: Date.now() - simulation.startTime.getTime()
      };

      this.simulations.set(simulationId, updatedSimulation);

      return results;
    } catch (error) {
      this.updateSimulationStatus(simulationId, 'failed');
      throw error;
    } finally {
      this.simulationQueue.delete(simulationId);
    }
  }

  public cancelSimulation(simulationId: string): void {
    const abortController = this.simulationQueue.get(simulationId);
    if (abortController) {
      abortController.abort();
      this.simulationQueue.delete(simulationId);
      this.updateSimulationStatus(simulationId, 'cancelled');
    }
  }

  public getSimulation(id: string): RebalanceSimulation | undefined {
    return this.simulations.get(id);
  }

  public getSimulations(): RebalanceSimulation[] {
    return Array.from(this.simulations.values());
  }

  public getEngineSimulations(engineId: string): RebalanceSimulation[] {
    return Array.from(this.simulations.values()).filter(sim => sim.engineId === engineId);
  }

  // Core Simulation Logic
  private async executeSimulation(simulation: RebalanceSimulation, signal: AbortSignal): Promise<SimulationResults> {
    // Step 1: Analyze current portfolio
    const portfolioAnalysis = await this.analyzePortfolio(simulation.currentPortfolio);
    
    // Step 2: Calculate rebalance actions
    const rebalanceActions = await this.calculateRebalanceActions(
      simulation.currentPortfolio,
      simulation.targetAllocation,
      simulation.simulationParams
    );

    // Step 3: Perform analysis
    const performanceAnalysis = await this.performPerformanceAnalysis(
      simulation.currentPortfolio,
      rebalanceActions,
      simulation.simulationParams
    );

    const riskAnalysis = await this.performRiskAnalysis(
      simulation.currentPortfolio,
      rebalanceActions,
      simulation.simulationParams
    );

    const costAnalysis = await this.performCostAnalysis(
      rebalanceActions,
      simulation.simulationParams
    );

    const taxAnalysis = await this.performTaxAnalysis(
      rebalanceActions,
      simulation.simulationParams
    );

    // Step 4: Generate scenarios
    const scenarios = await this.generateScenarios(
      simulation.currentPortfolio,
      rebalanceActions,
      simulation.simulationParams
    );

    // Step 5: Generate recommendations
    const recommendations = await this.generateRecommendations(
      portfolioAnalysis,
      rebalanceActions,
      performanceAnalysis,
      riskAnalysis,
      costAnalysis,
      taxAnalysis
    );

    // Step 6: Calculate summary
    const summary = this.calculateSummary(
      rebalanceActions,
      performanceAnalysis,
      riskAnalysis,
      costAnalysis,
      taxAnalysis
    );

    return {
      summary,
      rebalanceActions,
      performanceAnalysis,
      riskAnalysis,
      costAnalysis,
      taxAnalysis,
      scenarios,
      recommendations
    };
  }

  private async calculateRebalanceActions(
    currentPortfolio: PortfolioSnapshot,
    targetAllocation: TargetAllocation,
    params: SimulationParameters
  ): Promise<RebalanceAction[]> {
    const actions: RebalanceAction[] = [];

    // Calculate current weights
    const currentWeights = this.calculateCurrentWeights(currentPortfolio);

    // Process each holding target
    for (const holdingTarget of targetAllocation.holdingTargets) {
      const currentHolding = currentPortfolio.holdings.find(h => h.symbol === holdingTarget.symbol);
      const currentWeight = currentWeights[holdingTarget.symbol] || 0;
      const targetWeight = holdingTarget.targetWeight;

      // Check if rebalance is needed
      if (Math.abs(currentWeight - targetWeight) > holdingTarget.tolerance) {
        const action = await this.createRebalanceAction(
          holdingTarget.symbol,
          currentHolding,
          currentWeight,
          targetWeight,
          currentPortfolio.totalValue,
          params
        );
        actions.push(action);
      }
    }

    // Sort actions by priority
    actions.sort((a, b) => {
      const priorityMap = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityMap[b.executionPriority] - priorityMap[a.executionPriority];
    });

    return actions;
  }

  private async createRebalanceAction(
    symbol: string,
    currentHolding: any,
    currentWeight: number,
    targetWeight: number,
    totalValue: number,
    params: SimulationParameters
  ): Promise<RebalanceAction> {
    const targetValue = totalValue * (targetWeight / 100);
    const currentValue = currentHolding ? currentHolding.value : 0;
    const changeValue = targetValue - currentValue;
    const changePercent = currentValue > 0 ? (changeValue / currentValue) * 100 : 0;

    const price = currentHolding?.price || 100; // Mock price
    const currentQuantity = currentHolding?.quantity || 0;
    const targetQuantity = Math.round(targetValue / price);
    const changeQuantity = targetQuantity - currentQuantity;

    const action: RebalanceAction = {
      actionId: this.generateId(),
      symbol,
      name: currentHolding?.name || symbol,
      action: changeQuantity >= 0 ? 'buy' : 'sell',
      currentQuantity,
      targetQuantity,
      changeQuantity: Math.abs(changeQuantity),
      changePercent,
      currentValue,
      targetValue,
      changeValue: Math.abs(changeValue),
      currentWeight,
      targetWeight,
      changeWeight: targetWeight - currentWeight,
      transactionCost: this.calculateTransactionCost(Math.abs(changeValue), params),
      marketImpact: this.calculateMarketImpact(Math.abs(changeValue), symbol),
      taxImplications: await this.calculateTaxImplications(currentHolding, changeQuantity, params),
      suggestedExecutionDate: this.calculateExecutionDate(params),
      executionPriority: this.calculateExecutionPriority(Math.abs(changeValue), Math.abs(changePercent)),
      rationale: this.generateRationale(currentWeight, targetWeight, changePercent)
    };

    return action;
  }

  private calculateCurrentWeights(portfolio: PortfolioSnapshot): Record<string, number> {
    const weights: Record<string, number> = {};
    
    portfolio.holdings.forEach(holding => {
      weights[holding.symbol] = holding.weight;
    });

    return weights;
  }

  private calculateTransactionCost(value: number, params: SimulationParameters): number {
    const costRate = params.transactionCosts.variableCostRate || 0.001; // 0.1%
    const fixedCost = params.transactionCosts.fixedCost || 10;
    return value * costRate + fixedCost;
  }

  private calculateMarketImpact(value: number, symbol: string): number {
    // Mock market impact calculation
    const liquidityScore = 0.8; // Mock liquidity score
    const impactRate = (1 - liquidityScore) * 0.005; // 0.5% max impact
    return value * impactRate;
  }

  private async calculateTaxImplications(holding: any, changeQuantity: number, params: SimulationParameters): Promise<any> {
    if (!holding || changeQuantity >= 0) {
      return {
        capitalGains: 0,
        capitalGainsType: 'long_term',
        estimatedTax: 0,
        taxRate: 0,
        taxOptimization: {
          harvestLosses: false,
          deferGains: false,
          optimalExecutionDate: new Date(),
          taxSavings: 0,
          recommendations: []
        }
      };
    }

    const sellQuantity = Math.abs(changeQuantity);
    const sellValue = sellQuantity * holding.price;
    const costBasis = holding.costBasis * (sellQuantity / holding.quantity);
    const capitalGains = sellValue - costBasis;
    
    const taxRate = params.taxAssumptions.capitalGainsTaxRate || 0.20;
    const estimatedTax = Math.max(0, capitalGains * taxRate);

    return {
      capitalGains,
      capitalGainsType: holding.holdingPeriod > 365 ? 'long_term' : 'short_term',
      estimatedTax,
      taxRate,
      taxOptimization: {
        harvestLosses: capitalGains < 0,
        deferGains: capitalGains > 0 && holding.holdingPeriod < 365,
        optimalExecutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        taxSavings: capitalGains < 0 ? Math.abs(capitalGains) * taxRate : 0,
        recommendations: [
          capitalGains < 0 ? 'Consider harvesting losses for tax benefits' : 'Consider deferring gains to next tax year'
        ]
      }
    };
  }

  private calculateExecutionDate(params: SimulationParameters): Date {
    // Simple logic - execute within next 5 business days
    const baseDate = new Date();
    const daysToAdd = Math.ceil(Math.random() * 5);
    return new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  private calculateExecutionPriority(value: number, percentChange: number): 'high' | 'medium' | 'low' {
    if (value > 10000 || percentChange > 20) return 'high';
    if (value > 5000 || percentChange > 10) return 'medium';
    return 'low';
  }

  private generateRationale(currentWeight: number, targetWeight: number, changePercent: number): string {
    const diff = targetWeight - currentWeight;
    const action = diff > 0 ? 'increase' : 'decrease';
    const magnitude = Math.abs(diff);
    
    if (magnitude > 5) {
      return `Significant ${action} needed to align with target allocation (${magnitude.toFixed(1)}% adjustment)`;
    } else if (magnitude > 2) {
      return `Moderate ${action} required for optimal allocation (${magnitude.toFixed(1)}% adjustment)`;
    } else {
      return `Minor ${action} to fine-tune allocation (${magnitude.toFixed(1)}% adjustment)`;
    }
  }

  // Analysis Methods
  private async analyzePortfolio(portfolio: PortfolioSnapshot): Promise<any> {
    // Mock portfolio analysis
    await this.delay(500);
    
    return {
      diversificationScore: 0.75,
      concentrationRisk: 0.25,
      liquidityScore: 0.85,
      overallHealth: 'good'
    };
  }

  private async performPerformanceAnalysis(
    portfolio: PortfolioSnapshot,
    actions: RebalanceAction[],
    params: SimulationParameters
  ): Promise<PerformanceAnalysis> {
    await this.delay(1000);

    const beforeMetrics = {
      totalReturn: 12.5,
      annualizedReturn: 8.7,
      volatility: 15.2,
      sharpeRatio: 0.91,
      maxDrawdown: -12.3,
      valueAtRisk: -2.1,
      conditionalVaR: -3.2,
      beta: 0.89,
      informationRatio: 0.45,
      trackingError: 4.2,
      calmarRatio: 0.71,
      sortinoRatio: 1.24,
      treynorRatio: 0.098
    };

    const afterMetrics = {
      totalReturn: 13.8,
      annualizedReturn: 9.2,
      volatility: 14.1,
      sharpeRatio: 1.08,
      maxDrawdown: -10.9,
      valueAtRisk: -1.9,
      conditionalVaR: -2.8,
      beta: 0.85,
      informationRatio: 0.52,
      trackingError: 3.8,
      calmarRatio: 0.84,
      sortinoRatio: 1.41,
      treynorRatio: 0.108
    };

    const improvement = {
      totalReturn: afterMetrics.totalReturn - beforeMetrics.totalReturn,
      annualizedReturn: afterMetrics.annualizedReturn - beforeMetrics.annualizedReturn,
      volatility: afterMetrics.volatility - beforeMetrics.volatility,
      sharpeRatio: afterMetrics.sharpeRatio - beforeMetrics.sharpeRatio,
      maxDrawdown: afterMetrics.maxDrawdown - beforeMetrics.maxDrawdown,
      valueAtRisk: afterMetrics.valueAtRisk - beforeMetrics.valueAtRisk,
      conditionalVaR: afterMetrics.conditionalVaR - beforeMetrics.conditionalVaR,
      beta: afterMetrics.beta - beforeMetrics.beta,
      informationRatio: afterMetrics.informationRatio - beforeMetrics.informationRatio,
      trackingError: afterMetrics.trackingError - beforeMetrics.trackingError,
      calmarRatio: afterMetrics.calmarRatio - beforeMetrics.calmarRatio,
      sortinoRatio: afterMetrics.sortinoRatio - beforeMetrics.sortinoRatio,
      treynorRatio: afterMetrics.treynorRatio - beforeMetrics.treynorRatio
    };

    return {
      expectedReturn: afterMetrics.annualizedReturn,
      expectedVolatility: afterMetrics.volatility,
      sharpeRatio: afterMetrics.sharpeRatio,
      trackingError: afterMetrics.trackingError,
      informationRatio: afterMetrics.informationRatio,
      valueAtRisk: afterMetrics.valueAtRisk,
      conditionalVaR: afterMetrics.conditionalVaR,
      maxDrawdown: afterMetrics.maxDrawdown,
      rebalanceEfficiency: 0.85,
      costEfficiency: 0.78,
      beforeRebalance: beforeMetrics,
      afterRebalance: afterMetrics,
      improvement
    };
  }

  private async performRiskAnalysis(
    portfolio: PortfolioSnapshot,
    actions: RebalanceAction[],
    params: SimulationParameters
  ): Promise<RiskAnalysis> {
    await this.delay(800);

    return {
      portfolioRisk: {
        totalRisk: 14.1,
        systematicRisk: 9.8,
        specificRisk: 4.3,
        concentrationRisk: 2.1
      },
      concentrationRisk: {
        topHoldingsRisk: 0.35,
        sectorConcentration: 0.28,
        geographicConcentration: 0.15,
        currencyConcentration: 0.12
      },
      correlationAnalysis: {
        averageCorrelation: 0.45,
        maxCorrelation: 0.89,
        minCorrelation: 0.05,
        portfolioCorrelation: 0.72
      },
      riskAttribution: {
        equityRisk: 0.65,
        bondRisk: 0.20,
        currencyRisk: 0.10,
        specificRisk: 0.05
      },
      stressTestResults: [
        {
          scenario: 'Market Crash',
          probability: 0.05,
          impact: -25.4,
          confidence: 0.95
        },
        {
          scenario: 'Interest Rate Shock',
          probability: 0.10,
          impact: -12.8,
          confidence: 0.90
        }
      ],
      riskBudget: {
        totalBudget: 15.0,
        usedBudget: 14.1,
        remainingBudget: 0.9,
        utilization: 0.94
      }
    };
  }

  private async performCostAnalysis(
    actions: RebalanceAction[],
    params: SimulationParameters
  ): Promise<CostAnalysis> {
    await this.delay(500);

    const totalTransactionCosts = actions.reduce((sum, action) => sum + action.transactionCost, 0);
    const totalMarketImpact = actions.reduce((sum, action) => sum + action.marketImpact, 0);

    return {
      totalTransactionCosts,
      costBreakdown: {
        commissions: totalTransactionCosts * 0.4,
        fees: totalTransactionCosts * 0.2,
        bidAskSpread: totalTransactionCosts * 0.3,
        other: totalTransactionCosts * 0.1
      },
      marketImpact: totalMarketImpact,
      opportunityCosts: totalTransactionCosts * 0.15,
      costEfficiency: 0.85,
      breakEvenAnalysis: {
        breakEvenPeriod: 45, // days
        breakEvenReturn: 0.8, // %
        probabilityOfBreakEven: 0.78
      }
    };
  }

  private async performTaxAnalysis(
    actions: RebalanceAction[],
    params: SimulationParameters
  ): Promise<TaxAnalysis> {
    await this.delay(600);

    const totalTaxLiability = actions.reduce((sum, action) => sum + action.taxImplications.estimatedTax, 0);
    const totalCapitalGains = actions.reduce((sum, action) => sum + action.taxImplications.capitalGains, 0);

    return {
      totalTaxLiability,
      taxBreakdown: {
        capitalGainsTax: totalTaxLiability * 0.8,
        incomeTax: totalTaxLiability * 0.2,
        other: 0
      },
      afterTaxReturns: {
        grossReturn: 9.2,
        taxLiability: totalTaxLiability / 50000, // As percentage
        netReturn: 9.2 - (totalTaxLiability / 50000)
      },
      taxOptimization: {
        potentialSavings: Math.abs(totalCapitalGains * 0.05),
        optimizationStrategies: [
          'Loss harvesting',
          'Tax-lot optimization',
          'Timing optimization'
        ]
      },
      jurisdictionSpecific: {
        jurisdiction: params.taxAssumptions.jurisdiction || 'AU',
        specificConsiderations: [
          'CGT discount eligibility',
          'Franking credits',
          'Wash sale rules'
        ]
      }
    };
  }

  private async generateScenarios(
    portfolio: PortfolioSnapshot,
    actions: RebalanceAction[],
    params: SimulationParameters
  ): Promise<any[]> {
    await this.delay(1200);

    return [
      {
        scenarioId: 'bull_market',
        scenarioName: 'Bull Market',
        marketConditions: { trend: 'bullish', volatility: 'low' },
        performanceResult: { return: 15.2, risk: 12.8 },
        riskResult: { var: -1.5, maxDrawdown: -8.2 },
        probability: 0.25,
        impact: 'high'
      },
      {
        scenarioId: 'bear_market',
        scenarioName: 'Bear Market',
        marketConditions: { trend: 'bearish', volatility: 'high' },
        performanceResult: { return: -8.5, risk: 22.1 },
        riskResult: { var: -4.2, maxDrawdown: -18.7 },
        probability: 0.15,
        impact: 'high'
      },
      {
        scenarioId: 'neutral_market',
        scenarioName: 'Neutral Market',
        marketConditions: { trend: 'neutral', volatility: 'medium' },
        performanceResult: { return: 7.8, risk: 14.5 },
        riskResult: { var: -2.1, maxDrawdown: -11.2 },
        probability: 0.60,
        impact: 'medium'
      }
    ];
  }

  private async generateRecommendations(
    portfolioAnalysis: any,
    actions: RebalanceAction[],
    performanceAnalysis: PerformanceAnalysis,
    riskAnalysis: RiskAnalysis,
    costAnalysis: CostAnalysis,
    taxAnalysis: TaxAnalysis
  ): Promise<any[]> {
    await this.delay(400);

    return [
      {
        recommendationId: 'timing_opt',
        type: 'timing',
        title: 'Optimize Execution Timing',
        description: 'Execute rebalancing over multiple days to minimize market impact',
        rationale: 'Large position changes can benefit from staged execution',
        expectedImpact: { cost: -0.15, risk: -0.05, return: 0.02 },
        implementationSteps: [
          'Split large trades into smaller blocks',
          'Execute over 3-5 business days',
          'Monitor market conditions'
        ],
        priority: 'medium',
        timeframe: '1 week',
        confidence: 0.75
      },
      {
        recommendationId: 'tax_harvest',
        type: 'tax_optimization',
        title: 'Tax Loss Harvesting',
        description: 'Harvest losses to offset capital gains',
        rationale: 'Reduce overall tax liability through strategic loss realization',
        expectedImpact: { cost: 0, risk: 0, return: 0.08 },
        implementationSteps: [
          'Identify loss positions',
          'Execute loss harvesting trades',
          'Reinvest proceeds in similar assets'
        ],
        priority: 'high',
        timeframe: '2 weeks',
        confidence: 0.85
      }
    ];
  }

  private calculateSummary(
    actions: RebalanceAction[],
    performanceAnalysis: PerformanceAnalysis,
    riskAnalysis: RiskAnalysis,
    costAnalysis: CostAnalysis,
    taxAnalysis: TaxAnalysis
  ): any {
    const totalValue = actions.reduce((sum, action) => sum + action.changeValue, 0);
    const totalCost = costAnalysis.totalTransactionCosts;
    const totalTax = taxAnalysis.totalTaxLiability;
    const netBenefit = (performanceAnalysis.improvement.annualizedReturn / 100) * 50000 - totalCost - totalTax;

    return {
      totalValue,
      totalCost,
      totalTax,
      netBenefit,
      expectedReturn: performanceAnalysis.expectedReturn,
      expectedRisk: performanceAnalysis.expectedVolatility,
      sharpeRatio: performanceAnalysis.sharpeRatio,
      rebalanceEfficiency: performanceAnalysis.rebalanceEfficiency,
      costEfficiency: costAnalysis.costEfficiency,
      totalActions: actions.length,
      buyActions: actions.filter(a => a.action === 'buy').length,
      sellActions: actions.filter(a => a.action === 'sell').length,
      recommendationScore: netBenefit > 0 ? Math.min(100, (netBenefit / 1000) * 10 + 60) : 30,
      implementationComplexity: actions.length > 10 ? 'high' : actions.length > 5 ? 'medium' : 'low'
    };
  }

  // Template Management
  public createTemplate(template: Omit<RebalanceTemplate, 'templateId' | 'createdAt' | 'updatedAt'>): RebalanceTemplate {
    const newTemplate: RebalanceTemplate = {
      ...template,
      templateId: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(newTemplate.templateId, newTemplate);
    return newTemplate;
  }

  public getTemplates(): RebalanceTemplate[] {
    return Array.from(this.templates.values());
  }

  // Utility Methods
  private updateSimulationStatus(simulationId: string, status: SimulationStatus): void {
    const simulation = this.simulations.get(simulationId);
    if (simulation) {
      simulation.status = status;
      simulation.updatedAt = new Date();
      this.simulations.set(simulationId, simulation);
    }
  }

  private cancelEngineSimulations(engineId: string): void {
    const engineSimulations = this.getEngineSimulations(engineId);
    engineSimulations.forEach(sim => {
      if (sim.status === 'running') {
        this.cancelSimulation(sim.id);
      }
    });
  }

  private generateId(): string {
    return `rebal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    return 'user_123';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock Data Creation
  private createMockEngine(): void {
    const mockEngine = this.createMockEngineData();
    this.engines.set(mockEngine.id, mockEngine);
  }

  private createMockEngineData(): IRebalanceSimulationEngine {
    return {
      id: this.generateId(),
      userId: 'user_123',
      engineName: 'Primary Rebalance Engine',
      description: 'Main engine for portfolio rebalancing simulations',
      simulationConfig: {
        simulationHorizon: 365,
        rebalanceFrequency: 'quarterly',
        costModel: {
          fixedCost: 10,
          variableCostRate: 0.001,
          marketImpactModel: 'linear',
          timingCosts: { opportunityCost: 0.0005 },
          brokerageFees: { rate: 0.0015, minimum: 15 }
        },
        taxConfig: {
          jurisdiction: 'AU',
          capitalGainsTaxRate: 0.20,
          incomeTaxRate: 0.30,
          cgtDiscount: 0.50,
          taxOptimizationEnabled: true,
          lossHarvestingEnabled: true,
          taxYearEnd: new Date('2024-06-30')
        },
        riskConstraints: {
          maxPortfolioVolatility: 18,
          maxDrawdown: 20,
          maxVaR: 5,
          maxAssetWeight: 40,
          maxSectorWeight: 25,
          maxCountryWeight: 60,
          maxConcentration: 30,
          maxCorrelation: 0.8,
          minLiquidity: 0.6
        },
        optimizationConfig: {
          method: 'mean_variance',
          objective: 'maximize_sharpe',
          constraints: {},
          riskAversion: 5,
          tolerance: 0.001,
          maxIterations: 1000,
          useBlackLittermanViews: false,
          robustOptimization: true
        },
        jurisdiction: 'AU',
        complianceSettings: {
          regulatoryFramework: 'ASIC',
          reportingRequirements: ['Annual Report', 'Quarterly Updates'],
          disclosureRequirements: ['Holdings Disclosure', 'Performance Reporting'],
          investmentRestrictions: [],
          documentationRequired: true
        }
      },
      engineStatus: {
        status: 'active',
        lastHealthCheck: new Date(),
        activeSimulations: 0,
        queuedSimulations: 0,
        totalSimulations: 15,
        successRate: 0.93
      },
      performanceMetrics: {
        totalReturn: 12.5,
        annualizedReturn: 8.7,
        volatility: 15.2,
        sharpeRatio: 0.91,
        maxDrawdown: -12.3,
        valueAtRisk: -2.1,
        conditionalVaR: -3.2,
        beta: 0.89,
        informationRatio: 0.45,
        trackingError: 4.2,
        calmarRatio: 0.71,
        sortinoRatio: 1.24,
        treynorRatio: 0.098
      },
      activeSimulations: [],
      simulationHistory: [],
      rebalanceTemplates: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createMockTemplates(): void {
    const templates = [
      this.createMockTemplate('Conservative', 'AU'),
      this.createMockTemplate('Balanced', 'AU'),
      this.createMockTemplate('Growth', 'NZ')
    ];

    templates.forEach(template => {
      this.templates.set(template.templateId, template);
    });
  }

  private createMockTemplate(name: string, jurisdiction: 'AU' | 'NZ'): RebalanceTemplate {
    return {
      templateId: this.generateId(),
      templateName: `${name} Portfolio - ${jurisdiction}`,
      targetAllocation: this.createMockTargetAllocation(name),
      rebalanceRules: {
        rebalanceThreshold: 5,
        minimumRebalanceInterval: 30,
        maximumRebalanceInterval: 120,
        triggers: [],
        constraints: {},
        maxTransactionCost: 500,
        maxTransactionCostPercent: 1,
        taxAwareRebalancing: true,
        marketConditionRules: []
      },
      defaultParameters: this.createMockSimulationParameters(),
      constraints: {},
      isDefault: name === 'Balanced',
      usageCount: Math.floor(Math.random() * 10),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createMockTargetAllocation(type: string): TargetAllocation {
    const allocations = {
      'Conservative': { equity: 30, bond: 60, cash: 10 },
      'Balanced': { equity: 60, bond: 30, cash: 10 },
      'Growth': { equity: 80, bond: 15, cash: 5 }
    };

    const allocation = allocations[type] || allocations['Balanced'];

    return {
      allocationId: this.generateId(),
      allocationName: `${type} Allocation`,
      assetClassTargets: [
        {
          assetClass: 'equity',
          targetWeight: allocation.equity,
          tolerance: 5,
          minWeight: allocation.equity - 10,
          maxWeight: allocation.equity + 10,
          priority: 'high',
          rebalanceThreshold: 3,
          expectedReturn: 9.5,
          expectedVolatility: 18.2
        },
        {
          assetClass: 'bond',
          targetWeight: allocation.bond,
          tolerance: 5,
          minWeight: allocation.bond - 10,
          maxWeight: allocation.bond + 10,
          priority: 'medium',
          rebalanceThreshold: 3,
          expectedReturn: 4.2,
          expectedVolatility: 6.8
        },
        {
          assetClass: 'cash',
          targetWeight: allocation.cash,
          tolerance: 2,
          minWeight: allocation.cash - 5,
          maxWeight: allocation.cash + 5,
          priority: 'low',
          rebalanceThreshold: 1,
          expectedReturn: 2.5,
          expectedVolatility: 0.5
        }
      ],
      sectorTargets: [],
      geographicTargets: [],
      holdingTargets: [],
      constraints: {},
      rebalanceRules: {
        rebalanceThreshold: 5,
        minimumRebalanceInterval: 30,
        maximumRebalanceInterval: 120,
        triggers: [],
        constraints: {},
        maxTransactionCost: 500,
        maxTransactionCostPercent: 1,
        taxAwareRebalancing: true,
        marketConditionRules: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createMockSimulationParameters(): SimulationParameters {
    return {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      rebalanceFrequency: 'quarterly',
      marketAssumptions: {
        expectedReturns: { 'equity': 0.095, 'bond': 0.042, 'cash': 0.025 },
        volatilities: { 'equity': 0.182, 'bond': 0.068, 'cash': 0.005 },
        correlations: [[1, 0.2, 0.05], [0.2, 1, 0.1], [0.05, 0.1, 1]],
        marketRegime: 'neutral',
        inflationRate: 0.025,
        interestRates: { short: 0.035, long: 0.045 }
      },
      transactionCosts: {
        commissions: 15,
        fees: 5,
        bidAskSpread: 0.002,
        marketImpact: 0.001,
        opportunityCost: 0.0005,
        totalCost: 0,
        totalCostPercent: 0
      },
      taxAssumptions: {
        marginalTaxRate: 0.30,
        capitalGainsTaxRate: 0.20,
        shortTermThreshold: 365,
        longTermThreshold: 365,
        taxDeferral: true,
        lossHarvesting: true,
        jurisdiction: 'AU'
      },
      riskParameters: {
        confidenceLevel: 0.95,
        timeHorizon: 30,
        monteCarloSimulations: 10000,
        stressTestScenarios: []
      },
      optimizationMethod: 'mean_variance',
      constraints: {
        minPositionSize: 100,
        maxPositionSize: 50000,
        maxTurnover: 0.5,
        minCashBalance: 1000,
        maxCashBalance: 10000,
        sectorConstraints: []
      }
    };
  }

  private createMockSimulations(): void {
    const mockSimulation = this.createMockSimulationData();
    this.simulations.set(mockSimulation.id, mockSimulation);
  }

  private createMockSimulationData(): RebalanceSimulation {
    return {
      id: this.generateId(),
      engineId: Array.from(this.engines.keys())[0],
      simulationName: 'Q4 2024 Rebalance',
      description: 'Quarterly rebalancing simulation',
      currentPortfolio: this.createMockPortfolioSnapshot(),
      targetAllocation: this.createMockTargetAllocation('Balanced'),
      simulationParams: this.createMockSimulationParameters(),
      simulationResults: {
        summary: {
          totalValue: 50000,
          totalCost: 250,
          totalTax: 180,
          netBenefit: 1200,
          expectedReturn: 9.2,
          expectedRisk: 14.1,
          sharpeRatio: 1.08,
          rebalanceEfficiency: 0.85,
          costEfficiency: 0.78,
          totalActions: 8,
          buyActions: 4,
          sellActions: 4,
          recommendationScore: 82,
          implementationComplexity: 'medium'
        },
        rebalanceActions: [],
        performanceAnalysis: {} as any,
        riskAnalysis: {} as any,
        costAnalysis: {} as any,
        taxAnalysis: {} as any,
        scenarios: [],
        recommendations: []
      },
      status: 'completed',
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(),
      duration: 60000,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createMockPortfolioSnapshot(): PortfolioSnapshot {
    return {
      portfolioId: 'portfolio_123',
      snapshotDate: new Date(),
      holdings: [
        {
          symbol: 'VAS.AX',
          name: 'Vanguard Australian Shares',
          assetClass: 'equity',
          sector: 'Diversified',
          quantity: 150,
          price: 95.50,
          value: 14325,
          weight: 28.65,
          dayChange: 75,
          dayChangePercent: 0.52,
          totalReturn: 1325,
          totalReturnPercent: 10.2,
          volatility: 16.8,
          beta: 1.02,
          costBasis: 13000,
          unrealizedGain: 1325,
          unrealizedGainPercent: 10.2,
          holdingPeriod: 420,
          jurisdiction: 'AU',
          frankedDividendYield: 3.8,
          liquidityScore: 0.95,
          averageVolume: 500000,
          lastUpdated: new Date()
        },
        {
          symbol: 'VGS.AX',
          name: 'Vanguard MSCI Index Fund',
          assetClass: 'equity',
          sector: 'International',
          quantity: 200,
          price: 120.25,
          value: 24050,
          weight: 48.1,
          dayChange: -150,
          dayChangePercent: -0.62,
          totalReturn: 2050,
          totalReturnPercent: 9.3,
          volatility: 18.2,
          beta: 0.98,
          costBasis: 22000,
          unrealizedGain: 2050,
          unrealizedGainPercent: 9.3,
          holdingPeriod: 380,
          jurisdiction: 'AU',
          liquidityScore: 0.92,
          averageVolume: 300000,
          lastUpdated: new Date()
        }
      ],
      totalValue: 50000,
      cashBalance: 5000,
      performance: {
        totalReturn: 8.7,
        annualizedReturn: 8.7,
        volatility: 15.2,
        sharpeRatio: 0.91,
        maxDrawdown: -12.3,
        valueAtRisk: -2.1,
        conditionalVaR: -3.2,
        beta: 0.89,
        informationRatio: 0.45,
        trackingError: 4.2,
        calmarRatio: 0.71,
        sortinoRatio: 1.24,
        treynorRatio: 0.098
      },
      riskMetrics: {
        portfolioVolatility: 15.2,
        maxDrawdown: -12.3,
        valueAtRisk: -2.1,
        conditionalVaR: -3.2,
        concentrationRisk: 0.25,
        correlationRisk: 0.45
      },
      currentAllocation: {
        equity: 85.5,
        bond: 4.5,
        cash: 10.0,
        alternative: 0
      }
    };
  }
} 