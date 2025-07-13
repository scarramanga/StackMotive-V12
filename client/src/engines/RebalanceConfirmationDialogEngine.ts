// Block 27: Rebalance Confirmation Dialog - Engine
// Core engine for rebalance confirmation dialog management

import {
  RebalanceConfirmationDialog,
  RebalanceData,
  DialogConfig,
  ConfirmationStep,
  ValidationResult,
  UserAction,
  RebalanceImpact,
  ComplianceCheck,
  PerformanceProjection,
  TradingCosts,
  RiskAnalysis,
  RebalanceError,
  DialogError,
  UserActionType,
  StepType
} from '../types/rebalanceConfirmationDialog';

export class RebalanceConfirmationDialogEngine {
  private static instance: RebalanceConfirmationDialogEngine;
  private dialogs: Map<string, RebalanceConfirmationDialog> = new Map();
  private templates: Map<string, ConfirmationStep[]> = new Map();
  private validators: Map<string, Function> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): RebalanceConfirmationDialogEngine {
    if (!RebalanceConfirmationDialogEngine.instance) {
      RebalanceConfirmationDialogEngine.instance = new RebalanceConfirmationDialogEngine();
    }
    return RebalanceConfirmationDialogEngine.instance;
  }

  private initializeEngine(): void {
    this.loadStepTemplates();
    this.registerValidators();
    this.setupEventHandlers();
  }

  // Dialog Management
  public createDialog(
    rebalanceData: RebalanceData,
    config?: Partial<DialogConfig>
  ): RebalanceConfirmationDialog {
    const defaultConfig: DialogConfig = {
      width: 800,
      height: 600,
      position: 'center',
      modal: true,
      closable: true,
      escapeClosable: false,
      showSteps: true,
      allowSkipSteps: false,
      requireConfirmation: true,
      validateOnNext: true,
      autoClose: false,
      autoCloseDelay: 5000,
      showNotifications: true,
      notificationLevel: 'info'
    };

    const dialog: RebalanceConfirmationDialog = {
      id: this.generateId(),
      title: 'Rebalance Confirmation',
      isOpen: false,
      rebalanceData,
      config: { ...defaultConfig, ...config },
      userActions: [],
      confirmationSteps: this.generateSteps(rebalanceData),
      validation: { isValid: false, errors: [], warnings: [] },
      currentStep: 0,
      isLoading: false,
      canProceed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set expiration if needed
    if (rebalanceData.proposedExecutionTime) {
      dialog.expiresAt = new Date(rebalanceData.proposedExecutionTime.getTime() + 30 * 60 * 1000); // 30 minutes
    }

    this.dialogs.set(dialog.id, dialog);
    this.emit('dialogCreated', dialog);

    return dialog;
  }

  public getDialog(id: string): RebalanceConfirmationDialog | undefined {
    return this.dialogs.get(id);
  }

  public updateDialog(id: string, updates: Partial<RebalanceConfirmationDialog>): RebalanceConfirmationDialog {
    const dialog = this.dialogs.get(id);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id });
    }

    const updatedDialog = {
      ...dialog,
      ...updates,
      updatedAt: new Date()
    };

    this.dialogs.set(id, updatedDialog);
    this.emit('dialogUpdated', updatedDialog);

    return updatedDialog;
  }

  public openDialog(id: string): RebalanceConfirmationDialog {
    const dialog = this.getDialog(id);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id });
    }

    // Check if expired
    if (dialog.expiresAt && dialog.expiresAt < new Date()) {
      throw new DialogError('Dialog has expired', 'DIALOG_EXPIRED', { id, expiresAt: dialog.expiresAt });
    }

    const updatedDialog = this.updateDialog(id, { isOpen: true });
    this.recordUserAction(id, 'open', 'dialog');

    return updatedDialog;
  }

  public closeDialog(id: string): RebalanceConfirmationDialog {
    const dialog = this.getDialog(id);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id });
    }

    const updatedDialog = this.updateDialog(id, { isOpen: false });
    this.recordUserAction(id, 'close', 'dialog');

    return updatedDialog;
  }

  public deleteDialog(id: string): boolean {
    const dialog = this.dialogs.get(id);
    if (!dialog) {
      return false;
    }

    const success = this.dialogs.delete(id);
    if (success) {
      this.emit('dialogDeleted', { id });
    }

    return success;
  }

  // Step Navigation
  public nextStep(dialogId: string): RebalanceConfirmationDialog {
    const dialog = this.getDialog(dialogId);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id: dialogId });
    }

    // Validate current step if required
    if (dialog.config.validateOnNext) {
      const validation = this.validateStep(dialog, dialog.currentStep);
      if (!validation.isValid) {
        throw new DialogError('Current step validation failed', 'STEP_VALIDATION_FAILED', validation);
      }
    }

    // Check if can proceed to next step
    if (dialog.currentStep >= dialog.confirmationSteps.length - 1) {
      throw new DialogError('Already at last step', 'LAST_STEP_REACHED', { currentStep: dialog.currentStep });
    }

    const nextStepIndex = dialog.currentStep + 1;
    const updatedDialog = this.updateDialog(dialogId, { currentStep: nextStepIndex });
    
    this.recordUserAction(dialogId, 'nextStep', 'navigation', nextStepIndex);
    
    return updatedDialog;
  }

  public previousStep(dialogId: string): RebalanceConfirmationDialog {
    const dialog = this.getDialog(dialogId);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id: dialogId });
    }

    if (dialog.currentStep <= 0) {
      throw new DialogError('Already at first step', 'FIRST_STEP_REACHED', { currentStep: dialog.currentStep });
    }

    const prevStepIndex = dialog.currentStep - 1;
    const updatedDialog = this.updateDialog(dialogId, { currentStep: prevStepIndex });
    
    this.recordUserAction(dialogId, 'previousStep', 'navigation', prevStepIndex);
    
    return updatedDialog;
  }

  public goToStep(dialogId: string, stepIndex: number): RebalanceConfirmationDialog {
    const dialog = this.getDialog(dialogId);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id: dialogId });
    }

    if (stepIndex < 0 || stepIndex >= dialog.confirmationSteps.length) {
      throw new DialogError('Invalid step index', 'INVALID_STEP_INDEX', { stepIndex, totalSteps: dialog.confirmationSteps.length });
    }

    const updatedDialog = this.updateDialog(dialogId, { currentStep: stepIndex });
    
    this.recordUserAction(dialogId, 'goToStep', 'navigation', stepIndex);
    
    return updatedDialog;
  }

  // Validation
  public validateStep(dialog: RebalanceConfirmationDialog, stepIndex: number): ValidationResult {
    if (stepIndex < 0 || stepIndex >= dialog.confirmationSteps.length) {
      return {
        isValid: false,
        errors: [{ field: 'step', message: 'Invalid step index', code: 'INVALID_STEP' }],
        warnings: []
      };
    }

    const step = dialog.confirmationSteps[stepIndex];
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Run step-specific validation
    if (step.validation && step.validation.rules) {
      for (const rule of step.validation.rules) {
        const validator = this.validators.get(rule.rule);
        if (validator) {
          const validationResult = validator(dialog.rebalanceData, rule);
          if (!validationResult.isValid) {
            result.errors.push(...validationResult.errors);
            result.warnings.push(...validationResult.warnings);
          }
        }
      }
    }

    // Custom validation
    if (step.validation?.customValidation) {
      const customResult = step.validation.customValidation(dialog.rebalanceData);
      result.errors.push(...customResult.errors);
      result.warnings.push(...customResult.warnings);
    }

    result.isValid = result.errors.length === 0;
    
    return result;
  }

  public validateDialog(dialogId: string): ValidationResult {
    const dialog = this.getDialog(dialogId);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id: dialogId });
    }

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate all steps
    for (let i = 0; i < dialog.confirmationSteps.length; i++) {
      const stepResult = this.validateStep(dialog, i);
      result.errors.push(...stepResult.errors);
      result.warnings.push(...stepResult.warnings);
    }

    // Global validation
    const globalResult = this.validateRebalanceData(dialog.rebalanceData);
    result.errors.push(...globalResult.errors);
    result.warnings.push(...globalResult.warnings);

    result.isValid = result.errors.length === 0;

    // Update dialog validation
    this.updateDialog(dialogId, { validation: result, canProceed: result.isValid });

    return result;
  }

  // User Actions
  public recordUserAction(
    dialogId: string,
    action: string,
    target: string,
    value?: any
  ): UserAction {
    const dialog = this.getDialog(dialogId);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id: dialogId });
    }

    const userAction: UserAction = {
      id: this.generateId(),
      type: this.getActionType(action),
      timestamp: new Date(),
      action,
      target,
      value,
      step: dialog.currentStep,
      page: dialog.confirmationSteps[dialog.currentStep]?.id || 'unknown',
      isValid: true,
      validationErrors: []
    };

    dialog.userActions.push(userAction);
    this.updateDialog(dialogId, { userActions: dialog.userActions });

    this.emit('userAction', { dialogId, action: userAction });

    return userAction;
  }

  // Confirmation and Execution
  public async confirmRebalance(dialogId: string): Promise<void> {
    const dialog = this.getDialog(dialogId);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id: dialogId });
    }

    // Final validation
    const validation = this.validateDialog(dialogId);
    if (!validation.isValid) {
      throw new RebalanceError('Validation failed', 'VALIDATION_FAILED', validation);
    }

    // Record confirmation
    this.recordUserAction(dialogId, 'confirm', 'rebalance');

    // Update state
    this.updateDialog(dialogId, { isLoading: true });

    try {
      // Execute rebalance (mock implementation)
      await this.executeRebalance(dialog.rebalanceData);
      
      this.emit('rebalanceConfirmed', { dialogId, rebalanceData: dialog.rebalanceData });
      
      // Auto-close if configured
      if (dialog.config.autoClose) {
        setTimeout(() => {
          this.closeDialog(dialogId);
        }, dialog.config.autoCloseDelay);
      }
    } catch (error) {
      this.updateDialog(dialogId, { isLoading: false });
      throw error;
    }
  }

  public cancelRebalance(dialogId: string): void {
    const dialog = this.getDialog(dialogId);
    if (!dialog) {
      throw new DialogError('Dialog not found', 'DIALOG_NOT_FOUND', { id: dialogId });
    }

    this.recordUserAction(dialogId, 'cancel', 'rebalance');
    this.emit('rebalanceCancelled', { dialogId });
    this.closeDialog(dialogId);
  }

  // Analysis and Impact
  public async analyzeRebalanceImpact(rebalanceData: RebalanceData): Promise<RebalanceImpact> {
    // Mock implementation of impact analysis
    await this.delay(1000);

    return {
      portfolioImpact: {
        diversificationChange: 0.05,
        concentrationChange: -0.02,
        riskChange: -0.01,
        sharpeChange: 0.03,
        volatilityChange: -0.005,
        returnChange: 0.02,
        trackingErrorChange: 0.001,
        sectorExposureChanges: [],
        factorExposureChanges: []
      },
      riskImpact: {
        var95Change: -0.005,
        var99Change: -0.008,
        maxDrawdownChange: -0.01,
        correlationChanges: [],
        concentrationRiskChange: -0.02,
        liquidityRiskChange: 0.001,
        riskScoreChange: -0.1
      },
      costImpact: {
        totalCommissions: 125.50,
        totalFees: 45.20,
        regulatoryFees: 12.30,
        bidAskSpread: 89.75,
        priceImpact: 156.40,
        slippage: 78.20,
        delayedExecution: 23.10,
        marketTiming: 34.55,
        totalCost: 565.00,
        costAsPercentage: 0.0056
      },
      taxImpact: {
        realizedGains: 1250.00,
        realizedLosses: -456.78,
        netRealizedGainLoss: 793.22,
        shortTermCapitalGainsTax: 158.64,
        longTermCapitalGainsTax: 119.48,
        totalTaxLiability: 278.12,
        taxEfficiencyChange: -0.002,
        washSaleRisk: [],
        taxLossHarvestingOpportunities: []
      },
      liquidityImpact: {
        estimatedExecutionTime: 45,
        marketDepthImpact: 0.15,
        liquidityConstraints: [],
        volumeImpact: 0.08
      },
      marketImpact: {
        estimatedPriceImpact: 0.12,
        volumeAsPercentageOfADV: 2.5,
        marketTimingRisk: 0.05,
        volatilityImpact: 0.03
      },
      overallImpact: {
        score: 7.5,
        level: 'medium',
        recommendation: 'proceed',
        keyRisks: ['Market timing risk', 'Liquidity constraints'],
        keyBenefits: ['Improved diversification', 'Reduced concentration risk'],
        mitigationStrategies: ['Split execution across multiple days', 'Use TWAP algorithm']
      }
    };
  }

  // Private Methods
  private generateSteps(rebalanceData: RebalanceData): ConfirmationStep[] {
    const baseSteps: ConfirmationStep[] = [
      {
        id: 'overview',
        title: 'Rebalance Overview',
        description: 'Review the proposed rebalance changes',
        type: 'overview',
        content: {
          title: 'Portfolio Rebalance Summary',
          description: 'Review the proposed changes to your portfolio allocation',
          data: rebalanceData
        },
        isRequired: true,
        canSkip: false,
        showNext: true,
        showPrevious: false,
        validation: {
          isRequired: false,
          rules: []
        },
        isCompleted: false,
        isValid: true,
        actions: [
          {
            id: 'next',
            type: 'button',
            label: 'Next',
            action: 'nextStep',
            primary: true,
            disabled: false,
            requiresValidation: false,
            requiresConfirmation: false
          }
        ]
      },
      {
        id: 'analysis',
        title: 'Impact Analysis',
        description: 'Review the expected impact of the rebalance',
        type: 'analysis',
        content: {
          title: 'Rebalance Impact Analysis',
          description: 'Understand the risk, cost, and performance implications',
          data: rebalanceData.impact
        },
        isRequired: true,
        canSkip: false,
        showNext: true,
        showPrevious: true,
        validation: {
          isRequired: false,
          rules: []
        },
        isCompleted: false,
        isValid: true,
        actions: [
          {
            id: 'previous',
            type: 'button',
            label: 'Previous',
            action: 'previousStep',
            primary: false,
            disabled: false,
            requiresValidation: false,
            requiresConfirmation: false
          },
          {
            id: 'next',
            type: 'button',
            label: 'Next',
            action: 'nextStep',
            primary: true,
            disabled: false,
            requiresValidation: false,
            requiresConfirmation: false
          }
        ]
      },
      {
        id: 'confirmation',
        title: 'Final Confirmation',
        description: 'Confirm the rebalance execution',
        type: 'confirmation',
        content: {
          title: 'Confirm Rebalance Execution',
          description: 'Please confirm that you want to execute this rebalance',
          alerts: [
            {
              id: 'warning',
              type: 'warning',
              title: 'Important',
              message: 'This action cannot be undone once executed',
              dismissible: false
            }
          ]
        },
        isRequired: true,
        canSkip: false,
        showNext: false,
        showPrevious: true,
        validation: {
          isRequired: true,
          rules: [
            {
              field: 'confirmation',
              rule: 'required',
              message: 'Confirmation is required'
            }
          ]
        },
        isCompleted: false,
        isValid: false,
        actions: [
          {
            id: 'previous',
            type: 'button',
            label: 'Previous',
            action: 'previousStep',
            primary: false,
            disabled: false,
            requiresValidation: false,
            requiresConfirmation: false
          },
          {
            id: 'cancel',
            type: 'button',
            label: 'Cancel',
            action: 'cancel',
            primary: false,
            disabled: false,
            requiresValidation: false,
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to cancel this rebalance?'
          },
          {
            id: 'confirm',
            type: 'button',
            label: 'Confirm & Execute',
            action: 'confirm',
            primary: true,
            disabled: false,
            requiresValidation: true,
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to execute this rebalance?'
          }
        ]
      }
    ];

    return baseSteps;
  }

  private validateRebalanceData(data: RebalanceData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate allocations
    if (!data.targetAllocations || data.targetAllocations.length === 0) {
      result.errors.push({
        field: 'targetAllocations',
        message: 'Target allocations are required',
        code: 'MISSING_TARGET_ALLOCATIONS'
      });
    }

    // Validate allocation sum
    const totalWeight = data.targetAllocations.reduce((sum, allocation) => sum + allocation.targetWeight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      result.errors.push({
        field: 'targetAllocations',
        message: 'Target allocations must sum to 100%',
        code: 'INVALID_ALLOCATION_SUM'
      });
    }

    // Validate execution time
    if (data.proposedExecutionTime && data.proposedExecutionTime < new Date()) {
      result.errors.push({
        field: 'proposedExecutionTime',
        message: 'Execution time cannot be in the past',
        code: 'INVALID_EXECUTION_TIME'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  private async executeRebalance(data: RebalanceData): Promise<void> {
    // Mock rebalance execution
    await this.delay(2000);
    
    // Simulate execution steps
    console.log('Executing rebalance:', data.id);
  }

  private loadStepTemplates(): void {
    // Load predefined step templates
    console.log('Step templates loaded');
  }

  private registerValidators(): void {
    // Register validation functions
    this.validators.set('required', (data: any, rule: any) => ({
      isValid: data[rule.field] !== undefined && data[rule.field] !== null && data[rule.field] !== '',
      errors: [],
      warnings: []
    }));

    this.validators.set('range', (data: any, rule: any) => ({
      isValid: data[rule.field] >= rule.value.min && data[rule.field] <= rule.value.max,
      errors: [],
      warnings: []
    }));
  }

  private setupEventHandlers(): void {
    // Set up internal event handlers
    console.log('Event handlers initialized');
  }

  private getActionType(action: string): UserActionType {
    switch (action) {
      case 'open':
      case 'close':
      case 'confirm':
      case 'cancel':
        return 'click';
      case 'nextStep':
      case 'previousStep':
      case 'goToStep':
        return 'navigation';
      default:
        return 'click';
    }
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 