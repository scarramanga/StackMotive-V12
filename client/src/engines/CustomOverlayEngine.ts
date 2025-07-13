// Block 31: Custom Overlay Builder - Engine
import { 
  CustomOverlay, 
  OverlayRule, 
  OverlayCondition,
  OverlayAction,
  OverlayTemplate,
  OverlayValidationResult,
  OverlayBacktestResult
} from '../types/customOverlay';

export class CustomOverlayEngine {
  private overlays: Map<string, CustomOverlay> = new Map();
  private templates: Map<string, OverlayTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Create a new custom overlay
   */
  createOverlay(
    name: string,
    description: string,
    category: string = 'custom',
    userId?: string
  ): CustomOverlay {
    const overlay: CustomOverlay = {
      id: this.generateId(),
      name,
      description,
      category,
      userId,
      rules: [],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      backtest: null,
      metadata: {
        complexity: 'simple',
        riskLevel: 'medium',
        tags: []
      }
    };

    this.overlays.set(overlay.id, overlay);
    return overlay;
  }

  /**
   * Get overlay by ID
   */
  getOverlay(overlayId: string): CustomOverlay | undefined {
    return this.overlays.get(overlayId);
  }

  /**
   * Get all overlays
   */
  getAllOverlays(): CustomOverlay[] {
    return Array.from(this.overlays.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get overlays by user
   */
  getUserOverlays(userId: string): CustomOverlay[] {
    return this.getAllOverlays()
      .filter(overlay => overlay.userId === userId);
  }

  /**
   * Get active overlays
   */
  getActiveOverlays(): CustomOverlay[] {
    return this.getAllOverlays()
      .filter(overlay => overlay.isActive);
  }

  /**
   * Update overlay
   */
  updateOverlay(overlayId: string, updates: Partial<CustomOverlay>): boolean {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return false;

    const updatedOverlay = {
      ...overlay,
      ...updates,
      updatedAt: new Date(),
      version: overlay.version + 1
    };

    this.overlays.set(overlayId, updatedOverlay);
    return true;
  }

  /**
   * Delete overlay
   */
  deleteOverlay(overlayId: string): boolean {
    return this.overlays.delete(overlayId);
  }

  /**
   * Add rule to overlay
   */
  addRule(overlayId: string, rule: Omit<OverlayRule, 'id'>): OverlayRule | null {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return null;

    const newRule: OverlayRule = {
      ...rule,
      id: this.generateId()
    };

    overlay.rules.push(newRule);
    overlay.updatedAt = new Date();
    overlay.version++;

    return newRule;
  }

  /**
   * Update rule in overlay
   */
  updateRule(overlayId: string, ruleId: string, updates: Partial<OverlayRule>): boolean {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return false;

    const ruleIndex = overlay.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    overlay.rules[ruleIndex] = { ...overlay.rules[ruleIndex], ...updates };
    overlay.updatedAt = new Date();
    overlay.version++;

    return true;
  }

  /**
   * Remove rule from overlay
   */
  removeRule(overlayId: string, ruleId: string): boolean {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return false;

    const ruleIndex = overlay.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    overlay.rules.splice(ruleIndex, 1);
    overlay.updatedAt = new Date();
    overlay.version++;

    return true;
  }

  /**
   * Validate overlay
   */
  validateOverlay(overlayId: string): OverlayValidationResult {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) {
      return {
        isValid: false,
        errors: ['Overlay not found'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!overlay.name.trim()) {
      errors.push('Overlay name is required');
    }

    if (overlay.rules.length === 0) {
      errors.push('Overlay must have at least one rule');
    }

    // Rule validation
    overlay.rules.forEach((rule, index) => {
      if (!rule.name.trim()) {
        errors.push(`Rule ${index + 1}: Name is required`);
      }

      if (rule.conditions.length === 0) {
        errors.push(`Rule ${index + 1}: At least one condition is required`);
      }

      if (rule.actions.length === 0) {
        errors.push(`Rule ${index + 1}: At least one action is required`);
      }

      // Validate conditions
      rule.conditions.forEach((condition, condIndex) => {
        if (!this.validateCondition(condition)) {
          errors.push(`Rule ${index + 1}, Condition ${condIndex + 1}: Invalid condition`);
        }
      });

      // Validate actions
      rule.actions.forEach((action, actionIndex) => {
        if (!this.validateAction(action)) {
          errors.push(`Rule ${index + 1}, Action ${actionIndex + 1}: Invalid action`);
        }
      });
    });

    // Warnings
    if (overlay.rules.length > 10) {
      warnings.push('Overlay has many rules, consider simplifying');
    }

    const hasComplexConditions = overlay.rules.some(rule => 
      rule.conditions.some(condition => condition.operator === 'complex')
    );
    if (hasComplexConditions) {
      warnings.push('Complex conditions may impact performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Test overlay against historical data
   */
  async backtestOverlay(overlayId: string, startDate: Date, endDate: Date): Promise<OverlayBacktestResult> {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) {
      throw new Error('Overlay not found');
    }

    // Mock backtest implementation
    // In production, this would run against real historical data
    const mockResult: OverlayBacktestResult = {
      overlayId,
      startDate,
      endDate,
      totalTrades: Math.floor(Math.random() * 100) + 10,
      winRate: 0.55 + Math.random() * 0.3,
      totalReturn: (Math.random() - 0.3) * 0.5,
      maxDrawdown: Math.random() * 0.2,
      sharpeRatio: Math.random() * 2,
      avgTradeReturn: (Math.random() - 0.4) * 0.1,
      avgHoldingPeriod: Math.floor(Math.random() * 30) + 1,
      tradeDetails: this.generateMockTrades(Math.floor(Math.random() * 10) + 5),
      performance: this.generateMockPerformance(startDate, endDate),
      generatedAt: new Date()
    };

    // Update overlay with backtest result
    overlay.backtest = mockResult;
    overlay.updatedAt = new Date();

    return mockResult;
  }

  /**
   * Clone overlay
   */
  cloneOverlay(overlayId: string, newName: string, userId?: string): CustomOverlay | null {
    const originalOverlay = this.overlays.get(overlayId);
    if (!originalOverlay) return null;

    const clonedOverlay: CustomOverlay = {
      ...originalOverlay,
      id: this.generateId(),
      name: newName,
      userId,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      rules: originalOverlay.rules.map(rule => ({
        ...rule,
        id: this.generateId()
      }))
    };

    this.overlays.set(clonedOverlay.id, clonedOverlay);
    return clonedOverlay;
  }

  /**
   * Export overlay
   */
  exportOverlay(overlayId: string): any {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return null;

    return {
      ...overlay,
      exportedAt: new Date(),
      version: '1.0'
    };
  }

  /**
   * Import overlay
   */
  importOverlay(overlayData: any, userId?: string): CustomOverlay | null {
    try {
      const overlay: CustomOverlay = {
        ...overlayData,
        id: this.generateId(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isActive: false,
        rules: overlayData.rules.map((rule: any) => ({
          ...rule,
          id: this.generateId()
        }))
      };

      this.overlays.set(overlay.id, overlay);
      return overlay;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get overlay templates
   */
  getTemplates(): OverlayTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Create overlay from template
   */
  createFromTemplate(templateId: string, name: string, userId?: string): CustomOverlay | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const overlay = this.createOverlay(name, template.description, template.category, userId);
    
    // Add rules from template
    template.rules.forEach(rule => {
      this.addRule(overlay.id, rule);
    });

    overlay.metadata = { ...template.metadata };
    
    return overlay;
  }

  /**
   * Search overlays
   */
  searchOverlays(query: string, userId?: string): CustomOverlay[] {
    const searchTerm = query.toLowerCase();
    let overlays = userId ? this.getUserOverlays(userId) : this.getAllOverlays();
    
    return overlays.filter(overlay =>
      overlay.name.toLowerCase().includes(searchTerm) ||
      overlay.description.toLowerCase().includes(searchTerm) ||
      overlay.category.toLowerCase().includes(searchTerm) ||
      overlay.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Validate condition
   */
  private validateCondition(condition: OverlayCondition): boolean {
    if (!condition.field || !condition.operator) return false;
    
    // Validate based on field type
    switch (condition.field) {
      case 'price':
      case 'volume':
      case 'marketCap':
        return typeof condition.value === 'number' && condition.value > 0;
      case 'symbol':
      case 'sector':
        return typeof condition.value === 'string' && condition.value.length > 0;
      default:
        return true;
    }
  }

  /**
   * Validate action
   */
  private validateAction(action: OverlayAction): boolean {
    if (!action.type) return false;
    
    switch (action.type) {
      case 'buy':
      case 'sell':
        return typeof action.percentage === 'number' && action.percentage > 0 && action.percentage <= 100;
      case 'hold':
        return true;
      case 'rebalance':
        return typeof action.targetWeight === 'number' && action.targetWeight >= 0 && action.targetWeight <= 100;
      default:
        return false;
    }
  }

  /**
   * Generate mock trades for backtesting
   */
  private generateMockTrades(count: number): Array<{
    date: Date;
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    return: number;
  }> {
    const trades = [];
    for (let i = 0; i < count; i++) {
      trades.push({
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        symbol: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'][Math.floor(Math.random() * 5)],
        action: Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell',
        quantity: Math.floor(Math.random() * 100) + 1,
        price: Math.random() * 200 + 50,
        return: (Math.random() - 0.4) * 0.2
      });
    }
    return trades.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generate mock performance data
   */
  private generateMockPerformance(startDate: Date, endDate: Date): Array<{
    date: Date;
    value: number;
    return: number;
  }> {
    const performance = [];
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    let currentValue = 10000; // Starting value
    
    for (let i = 0; i <= daysDiff; i += 7) { // Weekly data points
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dailyReturn = (Math.random() - 0.48) * 0.05; // Slightly positive bias
      currentValue *= (1 + dailyReturn);
      
      performance.push({
        date,
        value: currentValue,
        return: dailyReturn
      });
    }
    
    return performance;
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const templates: OverlayTemplate[] = [
      {
        id: 'momentum_growth',
        name: 'Momentum Growth',
        description: 'Buys assets with strong momentum and growth signals',
        category: 'growth',
        rules: [
          {
            id: 'momentum_rule',
            name: 'Momentum Check',
            conditions: [
              { field: 'priceChange', operator: '>', value: 0.05 },
              { field: 'volume', operator: '>', value: 1000000 }
            ],
            actions: [
              { type: 'buy', percentage: 25, reason: 'Strong momentum detected' }
            ],
            priority: 1,
            enabled: true
          }
        ],
        metadata: {
          complexity: 'simple',
          riskLevel: 'medium',
          tags: ['momentum', 'growth']
        }
      },
      {
        id: 'defensive_value',
        name: 'Defensive Value',
        description: 'Focuses on undervalued, stable assets',
        category: 'value',
        rules: [
          {
            id: 'value_rule',
            name: 'Value Check',
            conditions: [
              { field: 'pe_ratio', operator: '<', value: 15 },
              { field: 'debt_to_equity', operator: '<', value: 0.5 }
            ],
            actions: [
              { type: 'buy', percentage: 20, reason: 'Undervalued asset detected' }
            ],
            priority: 1,
            enabled: true
          }
        ],
        metadata: {
          complexity: 'simple',
          riskLevel: 'low',
          tags: ['value', 'defensive']
        }
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private generateId(): string {
    return `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const customOverlayEngine = new CustomOverlayEngine(); 