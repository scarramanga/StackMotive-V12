// Block 29: Vault Config Snapshot - Engine
// Core engine for vault configuration snapshot management

import {
  VaultConfigSnapshot,
  VaultConfiguration,
  ConfigChange,
  ValidationResult,
  SnapshotComparison,
  ChangeType,
  ChangeImpact,
  SnapshotError
} from '../types/vaultConfigSnapshot';

export class VaultConfigSnapshotEngine {
  private static instance: VaultConfigSnapshotEngine;
  private snapshots: Map<string, VaultConfigSnapshot> = new Map();
  private configurations: Map<string, VaultConfiguration> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): VaultConfigSnapshotEngine {
    if (!VaultConfigSnapshotEngine.instance) {
      VaultConfigSnapshotEngine.instance = new VaultConfigSnapshotEngine();
    }
    return VaultConfigSnapshotEngine.instance;
  }

  private initializeEngine(): void {
    console.log('Vault Config Snapshot Engine initialized');
  }

  // Snapshot Management
  public createSnapshot(
    vaultId: string,
    config: VaultConfiguration,
    name: string,
    description: string = '',
    tags: string[] = []
  ): VaultConfigSnapshot {
    const snapshot: VaultConfigSnapshot = {
      id: this.generateId(),
      vaultId,
      name,
      description,
      version: this.generateVersion(),
      config: this.deepClone(config),
      createdAt: new Date(),
      createdBy: 'current_user',
      tags,
      isActive: false,
      isValid: true,
      parentSnapshotId: this.getLatestSnapshotId(vaultId),
      changes: this.calculateChanges(vaultId, config),
      validation: this.validateConfiguration(config)
    };

    this.snapshots.set(snapshot.id, snapshot);
    this.configurations.set(vaultId, config);
    
    this.emit('snapshotCreated', snapshot);
    return snapshot;
  }

  public getSnapshot(id: string): VaultConfigSnapshot | undefined {
    return this.snapshots.get(id);
  }

  public getAllSnapshots(): VaultConfigSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  public getSnapshotsByVault(vaultId: string): VaultConfigSnapshot[] {
    return Array.from(this.snapshots.values()).filter(s => s.vaultId === vaultId);
  }

  public updateSnapshot(id: string, updates: Partial<VaultConfigSnapshot>): VaultConfigSnapshot {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new SnapshotError('Snapshot not found', 'SNAPSHOT_NOT_FOUND', { id });
    }

    const updatedSnapshot = { ...snapshot, ...updates };
    this.snapshots.set(id, updatedSnapshot);
    
    this.emit('snapshotUpdated', updatedSnapshot);
    return updatedSnapshot;
  }

  public deleteSnapshot(id: string): boolean {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      return false;
    }

    // Check if snapshot is active
    if (snapshot.isActive) {
      throw new SnapshotError('Cannot delete active snapshot', 'ACTIVE_SNAPSHOT', { id });
    }

    const success = this.snapshots.delete(id);
    if (success) {
      this.emit('snapshotDeleted', { id });
    }
    
    return success;
  }

  public activateSnapshot(id: string): VaultConfigSnapshot {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new SnapshotError('Snapshot not found', 'SNAPSHOT_NOT_FOUND', { id });
    }

    // Validate before activation
    const validation = this.validateConfiguration(snapshot.config);
    if (!validation.isValid) {
      throw new SnapshotError('Invalid configuration', 'INVALID_CONFIG', validation);
    }

    // Deactivate other snapshots for the same vault
    const vaultSnapshots = this.getSnapshotsByVault(snapshot.vaultId);
    vaultSnapshots.forEach(s => {
      if (s.isActive && s.id !== id) {
        this.updateSnapshot(s.id, { isActive: false });
      }
    });

    // Activate this snapshot
    const activeSnapshot = this.updateSnapshot(id, { isActive: true });
    this.configurations.set(snapshot.vaultId, snapshot.config);
    
    this.emit('snapshotActivated', activeSnapshot);
    return activeSnapshot;
  }

  // Configuration Management
  public getCurrentConfiguration(vaultId: string): VaultConfiguration | undefined {
    return this.configurations.get(vaultId);
  }

  public updateConfiguration(vaultId: string, config: VaultConfiguration): VaultConfiguration {
    const validation = this.validateConfiguration(config);
    if (!validation.isValid) {
      throw new SnapshotError('Invalid configuration', 'INVALID_CONFIG', validation);
    }

    this.configurations.set(vaultId, config);
    this.emit('configurationUpdated', { vaultId, config });
    
    return config;
  }

  // Validation
  public validateConfiguration(config: VaultConfiguration): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic validation
    if (!config.basic.name || config.basic.name.trim() === '') {
      result.errors.push({
        field: 'basic.name',
        message: 'Vault name is required',
        code: 'REQUIRED_FIELD',
        severity: 'high'
      });
    }

    // Allocation validation
    const totalWeight = config.allocation.targets.reduce((sum, target) => sum + target.targetWeight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      result.errors.push({
        field: 'allocation.targets',
        message: 'Target weights must sum to 100%',
        code: 'INVALID_ALLOCATION',
        severity: 'critical'
      });
    }

    // Risk validation
    if (config.risk.maxDrawdown <= 0 || config.risk.maxDrawdown > 1) {
      result.errors.push({
        field: 'risk.maxDrawdown',
        message: 'Max drawdown must be between 0 and 1',
        code: 'INVALID_RANGE',
        severity: 'medium'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Comparison
  public compareSnapshots(id1: string, id2: string): SnapshotComparison {
    const snapshot1 = this.snapshots.get(id1);
    const snapshot2 = this.snapshots.get(id2);

    if (!snapshot1 || !snapshot2) {
      throw new SnapshotError('Snapshot not found', 'SNAPSHOT_NOT_FOUND', { id1, id2 });
    }

    const changes = this.calculateConfigDifferences(snapshot1.config, snapshot2.config);
    
    return {
      snapshot1,
      snapshot2,
      changes,
      summary: {
        totalChanges: changes.length,
        criticalChanges: changes.filter(c => c.impact === 'critical').length,
        riskImpact: this.assessRiskImpact(changes),
        performanceImpact: this.assessPerformanceImpact(changes),
        compatibilityIssues: this.findCompatibilityIssues(changes)
      },
      recommendations: this.generateRecommendations(changes)
    };
  }

  // Import/Export
  public exportSnapshot(id: string): string {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new SnapshotError('Snapshot not found', 'SNAPSHOT_NOT_FOUND', { id });
    }

    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      snapshot
    }, null, 2);
  }

  public importSnapshot(data: string): VaultConfigSnapshot {
    try {
      const imported = JSON.parse(data);
      if (!imported.snapshot) {
        throw new Error('Invalid snapshot data');
      }

      const snapshot = imported.snapshot;
      snapshot.id = this.generateId();
      snapshot.createdAt = new Date();
      snapshot.isActive = false;

      // Validate imported configuration
      const validation = this.validateConfiguration(snapshot.config);
      snapshot.validation = validation;
      snapshot.isValid = validation.isValid;

      this.snapshots.set(snapshot.id, snapshot);
      this.emit('snapshotImported', snapshot);
      
      return snapshot;
    } catch (error) {
      throw new SnapshotError('Failed to import snapshot', 'IMPORT_FAILED', { error });
    }
  }

  // Rollback
  public rollbackToSnapshot(id: string): VaultConfigSnapshot {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      throw new SnapshotError('Snapshot not found', 'SNAPSHOT_NOT_FOUND', { id });
    }

    // Create rollback snapshot
    const rollbackSnapshot = this.createSnapshot(
      snapshot.vaultId,
      snapshot.config,
      `Rollback to ${snapshot.name}`,
      `Rolled back from snapshot ${snapshot.id}`,
      ['rollback', ...snapshot.tags]
    );

    // Activate the rollback
    return this.activateSnapshot(rollbackSnapshot.id);
  }

  // Version Management
  public getVersionHistory(vaultId: string): VaultConfigSnapshot[] {
    return this.getSnapshotsByVault(vaultId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public createBranch(snapshotId: string, branchName: string): VaultConfigSnapshot {
    const baseSnapshot = this.snapshots.get(snapshotId);
    if (!baseSnapshot) {
      throw new SnapshotError('Base snapshot not found', 'SNAPSHOT_NOT_FOUND', { id: snapshotId });
    }

    return this.createSnapshot(
      baseSnapshot.vaultId,
      baseSnapshot.config,
      `${branchName} (from ${baseSnapshot.name})`,
      `Branch created from snapshot ${baseSnapshot.id}`,
      ['branch', branchName, ...baseSnapshot.tags]
    );
  }

  // Private Methods
  private calculateChanges(vaultId: string, newConfig: VaultConfiguration): ConfigChange[] {
    const currentConfig = this.configurations.get(vaultId);
    if (!currentConfig) {
      return [];
    }

    return this.calculateConfigDifferences(currentConfig, newConfig);
  }

  private calculateConfigDifferences(config1: VaultConfiguration, config2: VaultConfiguration): ConfigChange[] {
    const changes: ConfigChange[] = [];
    
    // Compare basic settings
    this.compareObjects('basic', config1.basic, config2.basic, changes);
    
    // Compare allocation
    this.compareObjects('allocation', config1.allocation, config2.allocation, changes);
    
    // Compare risk settings
    this.compareObjects('risk', config1.risk, config2.risk, changes);
    
    // Compare trading settings
    this.compareObjects('trading', config1.trading, config2.trading, changes);
    
    // Compare compliance settings
    this.compareObjects('compliance', config1.compliance, config2.compliance, changes);
    
    // Compare advanced settings
    this.compareObjects('advanced', config1.advanced, config2.advanced, changes);

    return changes;
  }

  private compareObjects(prefix: string, obj1: any, obj2: any, changes: ConfigChange[]): void {
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    
    for (const key of keys) {
      const field = `${prefix}.${key}`;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];
      
      if (val1 !== val2) {
        changes.push({
          id: this.generateId(),
          timestamp: new Date(),
          field,
          oldValue: val1,
          newValue: val2,
          changeType: this.getChangeType(val1, val2),
          impact: this.assessChangeImpact(field, val1, val2),
          author: 'system',
          reason: 'Configuration update'
        });
      }
    }
  }

  private getChangeType(oldValue: any, newValue: any): ChangeType {
    if (oldValue === undefined) return 'added';
    if (newValue === undefined) return 'removed';
    return 'modified';
  }

  private assessChangeImpact(field: string, oldValue: any, newValue: any): ChangeImpact {
    // Assess impact based on field type and value change
    if (field.includes('risk') || field.includes('limit')) {
      return 'high';
    }
    if (field.includes('allocation') || field.includes('target')) {
      return 'medium';
    }
    return 'low';
  }

  private assessRiskImpact(changes: ConfigChange[]): string {
    const riskChanges = changes.filter(c => c.field.includes('risk'));
    if (riskChanges.length === 0) return 'None';
    if (riskChanges.some(c => c.impact === 'critical')) return 'High';
    if (riskChanges.some(c => c.impact === 'high')) return 'Medium';
    return 'Low';
  }

  private assessPerformanceImpact(changes: ConfigChange[]): string {
    const perfChanges = changes.filter(c => 
      c.field.includes('allocation') || c.field.includes('rebalance')
    );
    if (perfChanges.length === 0) return 'None';
    if (perfChanges.some(c => c.impact === 'critical')) return 'High';
    if (perfChanges.some(c => c.impact === 'high')) return 'Medium';
    return 'Low';
  }

  private findCompatibilityIssues(changes: ConfigChange[]): string[] {
    const issues: string[] = [];
    
    // Check for breaking changes
    const breakingChanges = changes.filter(c => c.impact === 'critical');
    if (breakingChanges.length > 0) {
      issues.push('Critical configuration changes detected');
    }
    
    return issues;
  }

  private generateRecommendations(changes: ConfigChange[]): string[] {
    const recommendations: string[] = [];
    
    if (changes.length === 0) {
      recommendations.push('No changes detected');
      return recommendations;
    }
    
    const criticalChanges = changes.filter(c => c.impact === 'critical');
    if (criticalChanges.length > 0) {
      recommendations.push('Review critical changes carefully before applying');
    }
    
    const riskChanges = changes.filter(c => c.field.includes('risk'));
    if (riskChanges.length > 0) {
      recommendations.push('Consider backtesting with new risk parameters');
    }
    
    return recommendations;
  }

  private getLatestSnapshotId(vaultId: string): string | undefined {
    const snapshots = this.getSnapshotsByVault(vaultId);
    if (snapshots.length === 0) return undefined;
    
    const latest = snapshots.reduce((prev, current) => 
      current.createdAt > prev.createdAt ? current : prev
    );
    
    return latest.id;
  }

  private generateVersion(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `v${timestamp}-${random}`;
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
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