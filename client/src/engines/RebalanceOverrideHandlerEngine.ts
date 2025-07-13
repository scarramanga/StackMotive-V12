// Block 36: Rebalance Override Handler - Engine
// Core engine for rebalance override handling and execution

import {
  RebalanceOverrideHandler,
  RebalancePlan,
  RebalanceOverride,
  OverrideValidation,
  OverrideStatus,
  OverrideType,
  ProcessingStage,
  RebalanceOverrideError
} from '../types/rebalanceOverrideHandler';

export class RebalanceOverrideHandlerEngine {
  private static instance: RebalanceOverrideHandlerEngine;
  private handlers: Map<string, RebalanceOverrideHandler> = new Map();
  private rebalancePlans: Map<string, RebalancePlan> = new Map();
  private processingQueue: string[] = [];
  private eventHandlers: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): RebalanceOverrideHandlerEngine {
    if (!RebalanceOverrideHandlerEngine.instance) {
      RebalanceOverrideHandlerEngine.instance = new RebalanceOverrideHandlerEngine();
    }
    return RebalanceOverrideHandlerEngine.instance;
  }

  private initializeEngine(): void {
    this.startProcessingLoop();
    console.log('Rebalance Override Handler Engine initialized');
  }

  // Plan Management
  public registerRebalancePlan(plan: RebalancePlan): RebalancePlan {
    this.rebalancePlans.set(plan.id, plan);
    this.emit('planRegistered', plan);
    return plan;
  }

  public getRebalancePlan(id: string): RebalancePlan | undefined {
    return this.rebalancePlans.get(id);
  }

  // Override Management
  public createOverride(
    rebalanceId: string,
    portfolioId: string,
    userId: string,
    override: RebalanceOverride
  ): RebalanceOverrideHandler {
    const plan = this.rebalancePlans.get(rebalanceId);
    if (!plan) {
      throw new RebalanceOverrideError('Rebalance plan not found', 'PLAN_NOT_FOUND', { rebalanceId });
    }

    const handler: RebalanceOverrideHandler = {
      id: this.generateId(),
      rebalanceId,
      portfolioId,
      userId,
      originalPlan: plan,
      override,
      status: 'draft',
      processing: {
        stage: 'queued',
        progress: 0,
        currentTask: 'Initialization',
        queuePosition: this.processingQueue.length + 1,
        estimatedWaitTime: this.estimateWaitTime(),
        dependencies: [],
        resources: [],
        isBlocked: false,
        blockingIssues: []
      },
      validation: this.validateOverride(plan, override),
      approval: this.createApprovalWorkflow(override),
      execution: this.createExecutionPlan(plan, override),
      monitoring: {
        active: false,
        frequency: 60000, // 1 minute
        metrics: [],
        alerts: [],
        reporting: {
          frequency: 'hourly',
          recipients: [userId],
          format: 'json',
          automated: true
        }
      },
      results: {
        success: false,
        completion: 0,
        performance: {
          financial: { roi: 0, costSavings: 0, revenueImpact: 0, paybackPeriod: 0 },
          operational: { efficiency: 0, quality: 0, reliability: 0, scalability: 0 },
          strategic: { alignment: 0, innovation: 0, learning: 0, adaptability: 0 }
        },
        impact: {
          intended: [],
          unintended: [],
          stakeholders: [],
          systems: []
        },
        lessons: [],
        recommendations: []
      },
      createdAt: new Date(),
      metadata: {
        source: 'user',
        version: '1.0.0',
        environment: 'production',
        correlationId: this.generateId(),
        auditTrail: [{
          timestamp: new Date(),
          user: userId,
          action: 'override_created',
          details: { rebalanceId, overrideType: override.type },
          impact: 'medium'
        }],
        context: {
          marketContext: { conditions: [], volatility: 0.15, trends: [], events: [] },
          portfolioContext: { value: 100000, performance: 0.08, risk: 0.12, allocation: [] },
          userContext: { experience: 'intermediate', preferences: [], constraints: [], goals: [] },
          systemContext: { load: 0.3, performance: 0.95, capacity: 0.8, health: 0.98 }
        },
        tags: ['override', override.type, override.scope]
      }
    };

    this.handlers.set(handler.id, handler);
    this.processingQueue.push(handler.id);
    
    this.emit('overrideCreated', handler);
    return handler;
  }

  public getOverride(id: string): RebalanceOverrideHandler | undefined {
    return this.handlers.get(id);
  }

  public getAllOverrides(): RebalanceOverrideHandler[] {
    return Array.from(this.handlers.values());
  }

  public updateOverride(id: string, updates: Partial<RebalanceOverrideHandler>): RebalanceOverrideHandler {
    const handler = this.handlers.get(id);
    if (!handler) {
      throw new RebalanceOverrideError('Override handler not found', 'HANDLER_NOT_FOUND', { id });
    }

    const updatedHandler = { ...handler, ...updates };
    
    // Update audit trail
    updatedHandler.metadata.auditTrail.push({
      timestamp: new Date(),
      user: handler.userId,
      action: 'override_updated',
      details: updates,
      impact: 'low'
    });

    this.handlers.set(id, updatedHandler);
    this.emit('overrideUpdated', updatedHandler);
    
    return updatedHandler;
  }

  // Status Management
  public updateStatus(id: string, status: OverrideStatus): RebalanceOverrideHandler {
    const handler = this.handlers.get(id);
    if (!handler) {
      throw new RebalanceOverrideError('Override handler not found', 'HANDLER_NOT_FOUND', { id });
    }

    const updates: Partial<RebalanceOverrideHandler> = { status };

    // Set timestamps based on status
    switch (status) {
      case 'approved':
        updates.approvedAt = new Date();
        break;
      case 'executing':
        updates.executedAt = new Date();
        break;
      case 'completed':
      case 'failed':
      case 'cancelled':
        updates.completedAt = new Date();
        break;
    }

    return this.updateOverride(id, updates);
  }

  public updateProcessingStage(id: string, stage: ProcessingStage): RebalanceOverrideHandler {
    const handler = this.handlers.get(id);
    if (!handler) {
      throw new RebalanceOverrideError('Override handler not found', 'HANDLER_NOT_FOUND', { id });
    }

    const processing = {
      ...handler.processing,
      stage,
      currentTask: this.getStageTask(stage)
    };

    return this.updateOverride(id, { processing });
  }

  // Approval Management
  public approveOverride(id: string, approverId: string, comment?: string): RebalanceOverrideHandler {
    const handler = this.handlers.get(id);
    if (!handler) {
      throw new RebalanceOverrideError('Override handler not found', 'HANDLER_NOT_FOUND', { id });
    }

    // Update approval record
    const approval = handler.approval.approvals.find(a => a.approver === approverId);
    if (approval) {
      approval.status = 'approved';
      approval.comment = comment;
      approval.timestamp = new Date();
    }

    // Check if all approvals are complete
    const pendingApprovals = handler.approval.approvals.filter(a => a.status === 'pending');
    const newStatus: OverrideStatus = pendingApprovals.length === 0 ? 'approved' : 'pending';

    return this.updateOverride(id, {
      status: newStatus,
      approval: handler.approval
    });
  }

  public rejectOverride(id: string, approverId: string, reason: string): RebalanceOverrideHandler {
    const handler = this.handlers.get(id);
    if (!handler) {
      throw new RebalanceOverrideError('Override handler not found', 'HANDLER_NOT_FOUND', { id });
    }

    // Update approval record
    const approval = handler.approval.approvals.find(a => a.approver === approverId);
    if (approval) {
      approval.status = 'rejected';
      approval.comment = reason;
      approval.timestamp = new Date();
    }

    return this.updateOverride(id, {
      status: 'cancelled',
      approval: handler.approval
    });
  }

  // Execution Management
  public executeOverride(id: string): Promise<RebalanceOverrideHandler> {
    return new Promise(async (resolve, reject) => {
      try {
        const handler = this.handlers.get(id);
        if (!handler) {
          throw new RebalanceOverrideError('Override handler not found', 'HANDLER_NOT_FOUND', { id });
        }

        if (handler.status !== 'approved') {
          throw new RebalanceOverrideError('Override not approved', 'NOT_APPROVED', { id, status: handler.status });
        }

        // Start execution
        let updatedHandler = this.updateStatus(id, 'executing');
        updatedHandler = this.updateProcessingStage(id, 'executing');

        // Execute phases
        for (const phase of handler.execution.plan.phases) {
          await this.executePhase(id, phase);
        }

        // Complete execution
        updatedHandler = this.updateStatus(id, 'completed');
        updatedHandler.results.success = true;
        updatedHandler.results.completion = 100;

        this.updateOverride(id, updatedHandler);
        this.emit('overrideCompleted', updatedHandler);
        
        resolve(updatedHandler);
      } catch (error) {
        const handler = this.updateStatus(id, 'failed');
        this.emit('overrideFailed', { id, error });
        reject(error);
      }
    });
  }

  private async executePhase(handlerId: string, phase: any): Promise<void> {
    // Simulate phase execution
    const handler = this.handlers.get(handlerId);
    if (!handler) return;

    // Update progress
    const progress = {
      ...handler.execution.progress,
      phase: phase.phase,
      task: phase.tasks[0]?.task || 'Processing'
    };

    this.updateOverride(handlerId, {
      execution: { ...handler.execution, progress }
    });

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Validation
  private validateOverride(plan: RebalancePlan, override: RebalanceOverride): OverrideValidation {
    const validation: OverrideValidation = {
      isValid: true,
      score: 0.8,
      checks: [],
      warnings: [],
      errors: [],
      compliance: [],
      riskValidation: {
        withinLimits: true,
        limitBreaches: [],
        riskScore: 0.3,
        acceptability: 'acceptable'
      },
      impactValidation: {
        financialImpact: {
          withinBudget: true,
          estimatedCost: 1000,
          budgetLimit: 10000,
          approvalRequired: false
        },
        operationalImpact: {
          feasible: true,
          complexity: 5,
          resourceRequirements: [],
          timeline: {
            achievable: true,
            estimatedTime: 3600000, // 1 hour
            constraints: [],
            risks: []
          }
        },
        strategicImpact: {
          aligned: true,
          deviations: [],
          implications: [],
          recommendations: []
        }
      }
    };

    // Validate override scope
    if (override.scope === 'complete') {
      validation.checks.push({
        check: 'complete_override_validation',
        passed: true,
        score: 0.9,
        details: 'Complete override validation passed',
        requirements: ['manager_approval']
      });
    }

    // Validate changes
    override.changes.forEach(change => {
      if (change.impact === 'critical') {
        validation.warnings.push({
          warning: `Critical change detected: ${change.field}`,
          severity: 'warning',
          recommendation: 'Consider additional review',
          dismissible: false
        });
      }
    });

    // Risk validation
    if (override.riskConsiderations.some(r => r.residualRisk > 0.7)) {
      validation.riskValidation.withinLimits = false;
      validation.riskValidation.limitBreaches.push({
        limit: 'risk_threshold',
        current: 0.8,
        threshold: 0.7,
        severity: 'major'
      });
    }

    validation.isValid = validation.errors.length === 0;
    return validation;
  }

  // Workflow Management
  private createApprovalWorkflow(override: RebalanceOverride): any {
    const workflow = {
      required: override.type === 'full' || override.scope === 'complete',
      workflow: [],
      currentStep: 0,
      approvals: [],
      escalation: [],
      deadlines: []
    };

    if (workflow.required) {
      workflow.workflow.push({
        step: 1,
        name: 'Portfolio Manager Approval',
        approver: 'portfolio_manager',
        role: 'manager',
        criteria: ['risk_assessment', 'impact_analysis'],
        timeout: 3600000, // 1 hour
        optional: false
      });

      workflow.approvals.push({
        step: 1,
        approver: 'portfolio_manager',
        status: 'pending'
      });
    }

    return workflow;
  }

  // Execution Planning
  private createExecutionPlan(plan: RebalancePlan, override: RebalanceOverride): any {
    return {
      plan: {
        phases: [
          {
            phase: 'preparation',
            tasks: [
              { task: 'validate_override', type: 'validation', parameters: {}, priority: 1, dependencies: [] },
              { task: 'prepare_trades', type: 'trade', parameters: {}, priority: 2, dependencies: ['validate_override'] }
            ],
            dependencies: [],
            timeline: { start: new Date(), end: new Date(Date.now() + 300000), duration: 300000, buffer: 60000 }
          },
          {
            phase: 'execution',
            tasks: [
              { task: 'execute_trades', type: 'trade', parameters: {}, priority: 1, dependencies: [] },
              { task: 'monitor_execution', type: 'monitoring', parameters: {}, priority: 2, dependencies: ['execute_trades'] }
            ],
            dependencies: ['preparation'],
            timeline: { start: new Date(Date.now() + 300000), end: new Date(Date.now() + 1800000), duration: 1500000, buffer: 300000 }
          }
        ],
        sequence: [
          { order: 1, action: 'validate', conditions: [], fallback: 'cancel' },
          { order: 2, action: 'execute', conditions: ['validated'], fallback: 'rollback' }
        ],
        contingencies: [],
        rollback: {
          triggers: ['critical_error', 'user_cancel'],
          actions: [
            { action: 'stop_execution', order: 1, conditions: [], impact: 0.5 },
            { action: 'restore_original', order: 2, conditions: [], impact: 0.8 }
          ],
          timeline: 300000,
          resources: ['trading_system', 'risk_system']
        }
      },
      progress: {
        percentage: 0,
        phase: 'preparation',
        task: 'validate_override',
        tradesCompleted: 0,
        tradesTotal: plan.trades.length,
        valueExecuted: 0,
        valueTotal: plan.trades.reduce((sum, trade) => sum + trade.estimatedValue, 0),
        startTime: new Date(),
        elapsedTime: 0,
        estimatedCompletion: new Date(Date.now() + 1800000),
        status: 'pending',
        issues: []
      },
      state: {
        phase: 'preparation',
        status: 'pending',
        resources: [],
        environment: {
          marketState: { session: 'regular', volatility: 0.15, liquidity: 0.8, conditions: [] },
          systemState: { performance: 0.95, load: 0.3, errors: 0, warnings: 0 },
          networkState: { latency: 50, bandwidth: 1000, connectivity: 1.0, stability: 0.98 }
        },
        health: {
          overall: 0.95,
          components: [],
          alerts: []
        }
      },
      trades: [],
      monitoring: {
        metrics: [],
        alerts: [],
        thresholds: [],
        realTimeData: [],
        performance: {
          throughput: 0,
          latency: 0,
          errorRate: 0,
          successRate: 0,
          efficiency: 0
        }
      },
      results: {
        success: false,
        completion: 0,
        financialResults: { totalValue: 0, totalCost: 0, netResult: 0, costEfficiency: 0, slippage: 0 },
        operationalResults: { duration: 0, tradesExecuted: 0, successRate: 0, errorCount: 0, efficiency: 0 },
        qualityResults: { executionQuality: 0, priceImprovement: 0, timingQuality: 0, overallQuality: 0 },
        comparison: {
          vsOriginal: { metric: 'performance', original: 0, actual: 0, difference: 0, percentage: 0 },
          vsExpected: { metric: 'performance', original: 0, actual: 0, difference: 0, percentage: 0 },
          vsBenchmark: { metric: 'performance', original: 0, actual: 0, difference: 0, percentage: 0 }
        }
      }
    };
  }

  // Queue Management
  private startProcessingLoop(): void {
    setInterval(() => {
      this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  private processQueue(): void {
    if (this.processingQueue.length === 0) return;

    const handlerId = this.processingQueue.shift();
    if (!handlerId) return;

    const handler = this.handlers.get(handlerId);
    if (!handler) return;

    // Process based on current stage
    switch (handler.processing.stage) {
      case 'queued':
        this.updateProcessingStage(handlerId, 'validating');
        break;
      case 'validating':
        if (handler.validation.isValid) {
          this.updateProcessingStage(handlerId, 'approving');
        }
        break;
      case 'approving':
        if (handler.status === 'approved') {
          this.updateProcessingStage(handlerId, 'planning');
        }
        break;
      case 'planning':
        this.updateProcessingStage(handlerId, 'executing');
        break;
      case 'executing':
        // Execution is handled separately
        break;
    }
  }

  // Analytics
  public getOverrideAnalytics(): {
    total: number;
    byStatus: Record<OverrideStatus, number>;
    byType: Record<OverrideType, number>;
    successRate: number;
    averageProcessingTime: number;
  } {
    const handlers = this.getAllOverrides();
    
    const analytics = {
      total: handlers.length,
      byStatus: {} as Record<OverrideStatus, number>,
      byType: {} as Record<OverrideType, number>,
      successRate: 0,
      averageProcessingTime: 0
    };

    // Count by status and type
    handlers.forEach(handler => {
      analytics.byStatus[handler.status] = (analytics.byStatus[handler.status] || 0) + 1;
      analytics.byType[handler.override.type] = (analytics.byType[handler.override.type] || 0) + 1;
    });

    // Calculate success rate
    const completed = analytics.byStatus.completed || 0;
    analytics.successRate = handlers.length > 0 ? completed / handlers.length : 0;

    // Calculate average processing time
    const completedHandlers = handlers.filter(h => h.completedAt);
    if (completedHandlers.length > 0) {
      const totalTime = completedHandlers.reduce((sum, handler) => {
        const processingTime = handler.completedAt!.getTime() - handler.createdAt.getTime();
        return sum + processingTime;
      }, 0);
      analytics.averageProcessingTime = totalTime / completedHandlers.length;
    }

    return analytics;
  }

  // Utilities
  private estimateWaitTime(): number {
    return this.processingQueue.length * 60000; // 1 minute per item
  }

  private getStageTask(stage: ProcessingStage): string {
    const stageTasks = {
      'queued': 'Waiting in queue',
      'validating': 'Validating override',
      'approving': 'Waiting for approval',
      'planning': 'Creating execution plan',
      'executing': 'Executing override',
      'monitoring': 'Monitoring execution',
      'completed': 'Completed'
    };
    return stageTasks[stage] || 'Processing';
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  public on(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(event, handlers);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 