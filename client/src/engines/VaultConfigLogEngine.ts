// Block 45: Vault Config Change Log - Engine
import { 
  VaultConfigChange, 
  VaultConfig,
  VaultChangeType,
  VaultChangeSeverity,
  VaultChangeCategory,
  VaultChangeStats,
  VaultValidationResult,
  VaultAuditTrail,
  VaultChangeTemplate,
  VaultChangeApproval,
  VaultChangeNotification,
  VaultChangeRollback,
  VaultChangeEvent
} from '../types/vaultConfigLog';

export class VaultConfigLogEngine {
  private changes: Map<string, VaultConfigChange> = new Map();
  private vaults: Map<string, VaultConfig> = new Map();
  private templates: Map<string, VaultChangeTemplate> = new Map();
  private approvals: Map<string, VaultChangeApproval> = new Map();
  private notifications: Map<string, VaultChangeNotification> = new Map();
  private rollbacks: Map<string, VaultChangeRollback> = new Map();
  private events: Map<string, VaultChangeEvent> = new Map();

  constructor() {
    this.initializeDefaultVaults();
    this.initializeDefaultTemplates();
  }

  /**
   * Log a configuration change
   */
  async logChange(change: Omit<VaultConfigChange, 'id' | 'timestamp'>): Promise<VaultConfigChange> {
    // Validate the change
    const validationResults = await this.validateChange(change);
    const hasErrors = validationResults.some(r => r.severity === 'error');
    
    if (hasErrors) {
      throw new Error(`Validation failed: ${validationResults.filter(r => r.severity === 'error').map(r => r.message).join(', ')}`);
    }

    // Create full change record
    const fullChange: VaultConfigChange = {
      ...change,
      id: this.generateId(),
      timestamp: new Date(),
      approved: !change.metadata.requiresApproval || false,
      rollbackable: this.isRollbackable(change.changeType, change.fieldPath),
      metadata: {
        ...change.metadata,
        validationResults
      }
    };

    // Store the change
    this.changes.set(fullChange.id, fullChange);

    // Create approval process if required
    if (change.metadata.requiresApproval) {
      await this.createApprovalProcess(fullChange);
    }

    // Create notification
    await this.createNotification(fullChange, 'change_logged');

    // Create event
    this.createEvent('change_logged', fullChange.id, fullChange.vaultId, fullChange.userId, {
      changeType: fullChange.changeType,
      severity: fullChange.severity,
      category: fullChange.category
    });

    console.log(`[VaultConfigLog] Change logged: ${fullChange.id} for vault ${fullChange.vaultId}`);
    
    return fullChange;
  }

  /**
   * Approve a configuration change
   */
  async approveChange(changeId: string, approverId: string): Promise<boolean> {
    const change = this.changes.get(changeId);
    if (!change) {
      throw new Error(`Change ${changeId} not found`);
    }

    const approval = this.approvals.get(changeId);
    if (!approval) {
      throw new Error(`Approval process for change ${changeId} not found`);
    }

    // Find the approver
    const approver = approval.approvers.find(a => a.userId === approverId);
    if (!approver) {
      throw new Error(`User ${approverId} is not authorized to approve this change`);
    }

    if (approver.status !== 'pending') {
      throw new Error(`User ${approverId} has already decided on this change`);
    }

    // Mark as approved
    approver.status = 'approved';
    approver.decidedAt = new Date();
    approval.currentApprovals++;

    // Check if fully approved
    if (approval.currentApprovals >= approval.requiredApprovals) {
      approval.status = 'approved';
      change.approved = true;
      change.approvedBy = approverId;
      change.approvedAt = new Date();

      // Apply the change to vault config
      await this.applyChangeToVault(change);

      // Create notification
      await this.createNotification(change, 'change_approved');

      // Create event
      this.createEvent('change_approved', changeId, change.vaultId, approverId, {
        totalApprovals: approval.currentApprovals,
        requiredApprovals: approval.requiredApprovals
      });
    }

    console.log(`[VaultConfigLog] Change ${changeId} approved by ${approverId}`);
    return true;
  }

  /**
   * Rollback a configuration change
   */
  async rollbackChange(changeId: string, reason: string, initiatedBy: string): Promise<VaultConfigChange | null> {
    const originalChange = this.changes.get(changeId);
    if (!originalChange) {
      throw new Error(`Change ${changeId} not found`);
    }

    if (!originalChange.rollbackable) {
      throw new Error(`Change ${changeId} is not rollbackable`);
    }

    if (!originalChange.approved) {
      throw new Error(`Cannot rollback unapproved change ${changeId}`);
    }

    // Create rollback change
    const rollbackChange: Omit<VaultConfigChange, 'id' | 'timestamp'> = {
      vaultId: originalChange.vaultId,
      vaultName: originalChange.vaultName,
      changeType: originalChange.changeType,
      fieldPath: originalChange.fieldPath,
      previousValue: originalChange.newValue, // Swap values
      newValue: originalChange.previousValue,
      userId: initiatedBy,
      userName: await this.getUserName(initiatedBy),
      reason: `Rollback of change ${changeId}: ${reason}`,
      approved: true, // Rollbacks are automatically approved
      severity: originalChange.severity,
      category: originalChange.category,
      rollbackable: false, // Rollbacks themselves cannot be rolled back
      rollbackChangeId: changeId,
      metadata: {
        ...originalChange.metadata,
        sourceSystem: 'rollback',
        correlationId: changeId
      }
    };

    const newChange = await this.logChange(rollbackChange);

    // Create rollback record
    const rollback: VaultChangeRollback = {
      id: this.generateId(),
      originalChangeId: changeId,
      rollbackChangeId: newChange.id,
      reason,
      initiatedBy,
      initiatedAt: new Date(),
      status: 'completed',
      affectedFields: [originalChange.fieldPath],
      rollbackData: {
        originalValue: originalChange.newValue,
        restoredValue: originalChange.previousValue
      },
      completedAt: new Date()
    };

    this.rollbacks.set(rollback.id, rollback);

    // Apply rollback to vault
    await this.applyChangeToVault(newChange);

    // Create notification
    await this.createNotification(newChange, 'change_approved');

    // Create event
    this.createEvent('change_rolled_back', changeId, originalChange.vaultId, initiatedBy, {
      rollbackChangeId: newChange.id,
      reason
    });

    console.log(`[VaultConfigLog] Change ${changeId} rolled back as ${newChange.id}`);
    return newChange;
  }

  /**
   * Get change history for a vault
   */
  async getChangeHistory(vaultId: string, days: number = 30): Promise<VaultConfigChange[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.changes.values())
      .filter(change => 
        change.vaultId === vaultId && 
        change.timestamp >= cutoff
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get vault configuration
   */
  async getVaultConfig(vaultId: string): Promise<VaultConfig | null> {
    return this.vaults.get(vaultId) || null;
  }

  /**
   * Update vault configuration
   */
  async updateVaultConfig(
    vaultId: string, 
    updates: Partial<VaultConfig>, 
    reason: string,
    userId: string
  ): Promise<boolean> {
    const vault = this.vaults.get(vaultId);
    if (!vault) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    const userName = await this.getUserName(userId);

    // Track changes for each field
    for (const [fieldPath, newValue] of Object.entries(updates)) {
      if (fieldPath === 'id' || fieldPath === 'createdAt' || fieldPath === 'createdBy') {
        continue; // Skip read-only fields
      }

      const previousValue = this.getNestedValue(vault, fieldPath);
      
      if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
        const changeType = this.determineChangeType(fieldPath, previousValue, newValue);
        const severity = this.determineSeverity(fieldPath, changeType);
        const category = this.determineCategory(fieldPath);

        await this.logChange({
          vaultId,
          vaultName: vault.name,
          changeType,
          fieldPath,
          previousValue,
          newValue,
          userId,
          userName,
          reason,
          severity,
          category,
          metadata: {
            ipAddress: '127.0.0.1', // Would be real IP in production
            userAgent: 'VaultConfigLogEngine',
            sessionId: this.generateId(),
            sourceSystem: 'vault_config_update',
            changeSize: 1,
            requiresApproval: this.requiresApproval(fieldPath, severity)
          }
        });
      }
    }

    // Apply updates to vault
    Object.assign(vault, updates);
    vault.updatedAt = new Date();
    vault.lastModifiedBy = userId;

    return true;
  }

  /**
   * Validate a configuration change
   */
  async validateChange(change: Partial<VaultConfigChange>): Promise<VaultValidationResult[]> {
    const results: VaultValidationResult[] = [];

    // Basic validation
    if (!change.vaultId) {
      results.push({
        field: 'vaultId',
        rule: 'required',
        passed: false,
        message: 'Vault ID is required',
        severity: 'error'
      });
    }

    if (!change.fieldPath) {
      results.push({
        field: 'fieldPath',
        rule: 'required',
        passed: false,
        message: 'Field path is required',
        severity: 'error'
      });
    }

    if (!change.reason || change.reason.length < 10) {
      results.push({
        field: 'reason',
        rule: 'min_length',
        passed: false,
        message: 'Reason must be at least 10 characters',
        severity: 'warning'
      });
    }

    // Vault-specific validation
    if (change.vaultId) {
      const vault = this.vaults.get(change.vaultId);
      if (!vault) {
        results.push({
          field: 'vaultId',
          rule: 'exists',
          passed: false,
          message: 'Vault does not exist',
          severity: 'error'
        });
      } else {
        // Security validation
        if (change.fieldPath?.includes('security.') && vault.status === 'locked') {
          results.push({
            field: 'fieldPath',
            rule: 'vault_status',
            passed: false,
            message: 'Cannot modify security settings on locked vault',
            severity: 'error'
          });
        }

        // Compliance validation
        if (change.severity === 'critical' && !change.metadata?.requiresApproval) {
          results.push({
            field: 'severity',
            rule: 'approval_required',
            passed: false,
            message: 'Critical changes require approval',
            severity: 'warning'
          });
        }
      }
    }

    return results;
  }

  /**
   * Get all configuration changes
   */
  getAllChanges(): VaultConfigChange[] {
    return Array.from(this.changes.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all vaults
   */
  getAllVaults(): VaultConfig[] {
    return Array.from(this.vaults.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): VaultConfigChange[] {
    return this.getAllChanges()
      .filter(change => change.metadata.requiresApproval && !change.approved);
  }

  /**
   * Get change statistics
   */
  getChangeStats(): VaultChangeStats {
    const changes = this.getAllChanges();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count changes by type, severity, category
    const changesByType = {} as Record<VaultChangeType, number>;
    const changesBySeverity = {} as Record<VaultChangeSeverity, number>;
    const changesByCategory = {} as Record<VaultChangeCategory, number>;

    changes.forEach(change => {
      changesByType[change.changeType] = (changesByType[change.changeType] || 0) + 1;
      changesBySeverity[change.severity] = (changesBySeverity[change.severity] || 0) + 1;
      changesByCategory[change.category] = (changesByCategory[change.category] || 0) + 1;
    });

    // Find most active vault and user
    const vaultCounts = changes.reduce((counts, change) => {
      counts[change.vaultId] = (counts[change.vaultId] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const userCounts = changes.reduce((counts, change) => {
      counts[change.userId] = (counts[change.userId] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostActiveVault = Object.entries(vaultCounts)
      .reduce((max, [vault, count]) => 
        count > max.count ? { vault, count } : max,
        { vault: null as string | null, count: 0 }
      ).vault;

    const mostActiveUser = Object.entries(userCounts)
      .reduce((max, [user, count]) => 
        count > max.count ? { user, count } : max,
        { user: null as string | null, count: 0 }
      ).user;

    return {
      totalChanges: changes.length,
      changesLast24h: changes.filter(c => c.timestamp >= oneDayAgo).length,
      changesLast7d: changes.filter(c => c.timestamp >= sevenDaysAgo).length,
      pendingApprovals: this.getPendingApprovals().length,
      mostActiveVault,
      mostActiveUser,
      changesByType,
      changesBySeverity,
      changesByCategory,
      complianceScore: this.calculateComplianceScore(),
      securityScore: this.calculateSecurityScore()
    };
  }

  /**
   * Generate audit trail
   */
  async generateAuditTrail(vaultId: string, period: { start: Date; end: Date }): Promise<VaultAuditTrail> {
    const changes = Array.from(this.changes.values())
      .filter(change => 
        change.vaultId === vaultId &&
        change.timestamp >= period.start &&
        change.timestamp <= period.end
      );

    // Analyze users
    const userActivity = changes.reduce((activity, change) => {
      if (!activity[change.userId]) {
        activity[change.userId] = {
          userId: change.userId,
          userName: change.userName,
          changeCount: 0,
          lastActivity: change.timestamp
        };
      }
      activity[change.userId].changeCount++;
      if (change.timestamp > activity[change.userId].lastActivity) {
        activity[change.userId].lastActivity = change.timestamp;
      }
      return activity;
    }, {} as Record<string, any>);

    // Calculate summary
    const summary = {
      totalChanges: changes.length,
      approvedChanges: changes.filter(c => c.approved).length,
      rolledBackChanges: changes.filter(c => c.rollbackChangeId).length,
      complianceIssues: changes.filter(c => c.severity === 'critical').length,
      securityIncidents: changes.filter(c => c.category === 'security' && c.severity === 'high').length
    };

    return {
      vaultId,
      period,
      changes,
      users: Object.values(userActivity),
      summary,
      compliance: {
        score: this.calculateComplianceScore(),
        violations: [], // Would be populated from actual compliance checks
        recommendations: this.generateComplianceRecommendations(changes)
      }
    };
  }

  /**
   * Export change log
   */
  async exportChangeLog(vaultId?: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string> {
    let changes = this.getAllChanges();
    
    if (vaultId) {
      changes = changes.filter(change => change.vaultId === vaultId);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(changes, null, 2);
      
      case 'csv':
        return this.exportToCsv(changes);
      
      case 'pdf':
        return this.exportToPdf(changes);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get change by ID
   */
  getChange(changeId: string): VaultConfigChange | undefined {
    return this.changes.get(changeId);
  }

  /**
   * Apply change to vault configuration
   */
  private async applyChangeToVault(change: VaultConfigChange): Promise<void> {
    const vault = this.vaults.get(change.vaultId);
    if (!vault) return;

    // Apply the change
    this.setNestedValue(vault, change.fieldPath, change.newValue);
    vault.updatedAt = new Date();
    vault.lastModifiedBy = change.userId;
  }

  /**
   * Create approval process
   */
  private async createApprovalProcess(change: VaultConfigChange): Promise<void> {
    const vault = this.vaults.get(change.vaultId);
    if (!vault) return;

    // Find approvers based on vault access and change severity
    const approvers = vault.access.owners.concat(vault.access.administrators)
      .filter(user => user.isActive && user.userId !== change.userId)
      .map(user => ({
        userId: user.userId,
        userName: user.userName,
        role: user.role,
        status: 'pending' as const,
        decidedAt: undefined,
        comments: undefined
      }));

    const requiredApprovals = change.severity === 'critical' ? 2 : 1;

    const approval: VaultChangeApproval = {
      changeId: change.id,
      approvers,
      requiredApprovals,
      currentApprovals: 0,
      status: 'pending',
      createdAt: new Date(),
      comments: []
    };

    this.approvals.set(change.id, approval);

    // Create notification for approvers
    await this.createNotification(change, 'approval_required');
  }

  /**
   * Create notification
   */
  private async createNotification(
    change: VaultConfigChange, 
    type: VaultChangeNotification['type']
  ): Promise<void> {
    const notification: VaultChangeNotification = {
      id: this.generateId(),
      changeId: change.id,
      vaultId: change.vaultId,
      type,
      recipients: await this.getNotificationRecipients(change, type),
      message: this.generateNotificationMessage(change, type),
      priority: this.getNotificationPriority(change.severity),
      scheduledFor: new Date(),
      sent: false,
      method: 'email'
    };

    this.notifications.set(notification.id, notification);
    
    // Mock sending notification
    setTimeout(() => {
      notification.sent = true;
      notification.sentAt = new Date();
    }, 100);
  }

  /**
   * Create event
   */
  private createEvent(
    type: VaultChangeEvent['type'],
    changeId: string,
    vaultId: string,
    userId: string,
    data: Record<string, any>
  ): void {
    const event: VaultChangeEvent = {
      id: this.generateId(),
      type,
      changeId,
      vaultId,
      userId,
      timestamp: new Date(),
      data,
      processed: false
    };

    this.events.set(event.id, event);
  }

  /**
   * Utility methods
   */
  private isRollbackable(changeType: VaultChangeType, fieldPath: string): boolean {
    const nonRollbackableTypes: VaultChangeType[] = ['created', 'deleted'];
    const nonRollbackableFields = ['id', 'createdAt', 'createdBy'];
    
    return !nonRollbackableTypes.includes(changeType) && 
           !nonRollbackableFields.some(field => fieldPath.includes(field));
  }

  private determineChangeType(fieldPath: string, previousValue: any, newValue: any): VaultChangeType {
    if (fieldPath.includes('access.')) return 'permissions_modified';
    if (fieldPath.includes('security.')) return 'security_updated';
    if (fieldPath.includes('settings.')) return 'config_updated';
    if (fieldPath.includes('integrations.')) return 'integration_added';
    return 'config_updated';
  }

  private determineSeverity(fieldPath: string, changeType: VaultChangeType): VaultChangeSeverity {
    if (fieldPath.includes('security.encryptionKey')) return 'critical';
    if (fieldPath.includes('access.owners')) return 'high';
    if (fieldPath.includes('settings.maxTransactionAmount')) return 'medium';
    return 'low';
  }

  private determineCategory(fieldPath: string): VaultChangeCategory {
    if (fieldPath.includes('security.')) return 'security';
    if (fieldPath.includes('access.')) return 'access';
    if (fieldPath.includes('integrations.')) return 'integration';
    if (fieldPath.includes('compliance.')) return 'compliance';
    return 'configuration';
  }

  private requiresApproval(fieldPath: string, severity: VaultChangeSeverity): boolean {
    const criticalFields = ['security.encryptionKey', 'access.owners'];
    return severity === 'critical' || 
           severity === 'high' || 
           criticalFields.some(field => fieldPath.includes(field));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private async getUserName(userId: string): Promise<string> {
    // Mock user lookup
    const userNames: Record<string, string> = {
      'user1': 'John Doe',
      'user2': 'Jane Smith',
      'admin1': 'Admin User'
    };
    return userNames[userId] || `User ${userId}`;
  }

  private async getNotificationRecipients(
    change: VaultConfigChange, 
    type: VaultChangeNotification['type']
  ): Promise<string[]> {
    const vault = this.vaults.get(change.vaultId);
    if (!vault) return [];

    switch (type) {
      case 'approval_required':
        return vault.access.owners.concat(vault.access.administrators)
          .filter(user => user.isActive)
          .map(user => user.email);
      
      case 'change_approved':
      case 'change_logged':
        return [change.userId]; // Notify the user who made the change
      
      default:
        return [];
    }
  }

  private generateNotificationMessage(
    change: VaultConfigChange, 
    type: VaultChangeNotification['type']
  ): string {
    switch (type) {
      case 'change_logged':
        return `Configuration change logged for vault ${change.vaultName}: ${change.reason}`;
      
      case 'approval_required':
        return `Approval required for ${change.severity} change to vault ${change.vaultName}: ${change.reason}`;
      
      case 'change_approved':
        return `Configuration change approved for vault ${change.vaultName}: ${change.reason}`;
      
      default:
        return `Vault configuration change: ${change.reason}`;
    }
  }

  private getNotificationPriority(severity: VaultChangeSeverity): VaultChangeNotification['priority'] {
    switch (severity) {
      case 'critical': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private calculateComplianceScore(): number {
    // Mock compliance score calculation
    return 0.92; // 92% compliance
  }

  private calculateSecurityScore(): number {
    // Mock security score calculation
    return 0.88; // 88% security score
  }

  private generateComplianceRecommendations(changes: VaultConfigChange[]): string[] {
    const recommendations = [];
    
    if (changes.some(c => c.category === 'security' && !c.approved)) {
      recommendations.push('Ensure all security changes are properly approved');
    }
    
    if (changes.filter(c => c.severity === 'critical').length > 5) {
      recommendations.push('Review critical change frequency and approval processes');
    }
    
    return recommendations;
  }

  private exportToCsv(changes: VaultConfigChange[]): string {
    const headers = ['ID', 'Vault Name', 'Change Type', 'Field Path', 'User', 'Reason', 'Severity', 'Timestamp', 'Approved'];
    const rows = changes.map(change => [
      change.id,
      change.vaultName,
      change.changeType,
      change.fieldPath,
      change.userName,
      change.reason,
      change.severity,
      change.timestamp.toISOString(),
      change.approved ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private exportToPdf(changes: VaultConfigChange[]): string {
    // Mock PDF export - would use a real PDF library in production
    return `PDF export of ${changes.length} vault configuration changes`;
  }

  /**
   * Initialize default vaults
   */
  private initializeDefaultVaults(): void {
    const defaultVaults: VaultConfig[] = [
      {
        id: 'vault-001',
        name: 'Main Cold Storage',
        description: 'Primary cold storage vault for long-term holdings',
        type: 'cold_storage',
        status: 'active',
        settings: {
          autoBackup: true,
          backupFrequency: 'daily',
          retentionDays: 365,
          encryptionLevel: 'military',
          requiresApproval: true,
          approvalThreshold: 2,
          maxTransactionAmount: 1000000,
          dailyTransactionLimit: 5000000,
          allowedCurrencies: ['BTC', 'ETH', 'USDC'],
          restrictedCountries: ['CN', 'IR', 'KP'],
          notificationSettings: {
            emailAlerts: true,
            smsAlerts: true,
            alertThresholds: {
              transactionAmount: 100000,
              dailyVolume: 1000000,
              failedAttempts: 3
            }
          }
        },
        security: {
          encryptionKey: 'encrypted_key_001',
          keyRotationFrequency: 90,
          lastKeyRotation: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          multiFactorAuth: true,
          biometricAuth: true,
          ipWhitelist: ['192.168.1.100', '10.0.0.50'],
          deviceWhitelist: ['device-001', 'device-002'],
          sessionTimeout: 30,
          maxConcurrentSessions: 2,
          requiresHardwareKey: true,
          auditLogging: true
        },
        access: {
          owners: [
            {
              userId: 'user1',
              userName: 'John Doe',
              email: 'john@example.com',
              role: 'owner',
              permissions: ['read_config', 'write_config', 'manage_access', 'approve_transactions'],
              addedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
              addedBy: 'admin1',
              isActive: true
            }
          ],
          administrators: [
            {
              userId: 'admin1',
              userName: 'Admin User',
              email: 'admin@example.com',
              role: 'admin',
              permissions: ['read_config', 'write_config', 'view_audit_log'],
              addedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
              addedBy: 'user1',
              isActive: true
            }
          ],
          operators: [],
          viewers: [],
          sharedKeys: []
        },
        integrations: [],
        compliance: {
          regulations: ['SOX', 'GDPR', 'AML'],
          auditSchedule: 'quarterly',
          complianceScore: 0.95,
          findings: [],
          certifications: []
        },
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdBy: 'user1',
        lastModifiedBy: 'admin1'
      }
    ];

    defaultVaults.forEach(vault => {
      this.vaults.set(vault.id, vault);
    });
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: VaultChangeTemplate[] = [
      {
        id: 'template-001',
        name: 'Security Settings Update',
        description: 'Template for updating vault security settings',
        category: 'security',
        fields: [
          {
            name: 'encryptionLevel',
            type: 'string',
            required: true,
            description: 'Encryption level (standard, high, military)'
          },
          {
            name: 'multiFactorAuth',
            type: 'boolean',
            required: true,
            description: 'Enable multi-factor authentication'
          }
        ],
        approvalRequired: true,
        defaultSeverity: 'high',
        validationRules: [
          {
            field: 'encryptionLevel',
            rule: 'required',
            message: 'Encryption level is required',
            severity: 'error',
            enabled: true
          }
        ]
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private generateId(): string {
    return `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const vaultConfigLogEngine = new VaultConfigLogEngine(); 