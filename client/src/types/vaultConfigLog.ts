// Block 45: Vault Config Change Log - Types
export interface VaultConfigChange {
  id: string;
  vaultId: string;
  vaultName: string;
  changeType: VaultChangeType;
  fieldPath: string;
  previousValue: any;
  newValue: any;
  userId: string;
  userName: string;
  reason: string;
  timestamp: Date;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  severity: VaultChangeSeverity;
  category: VaultChangeCategory;
  rollbackable: boolean;
  rollbackChangeId?: string;
  metadata: VaultChangeMetadata;
}

export type VaultChangeType = 
  | 'config_updated'
  | 'access_granted'
  | 'access_revoked'
  | 'encryption_changed'
  | 'backup_configured'
  | 'security_updated'
  | 'permissions_modified'
  | 'integration_added'
  | 'integration_removed'
  | 'threshold_updated'
  | 'policy_changed'
  | 'created'
  | 'deleted'
  | 'archived'
  | 'restored';

export type VaultChangeSeverity = 'low' | 'medium' | 'high' | 'critical';

export type VaultChangeCategory = 
  | 'security'
  | 'access'
  | 'configuration'
  | 'integration'
  | 'backup'
  | 'compliance'
  | 'performance'
  | 'maintenance';

export interface VaultChangeMetadata {
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  correlationId?: string;
  sourceSystem: string;
  changeSize: number; // Number of fields changed
  validationResults?: VaultValidationResult[];
  complianceFlags?: string[];
  securityFlags?: string[];
  backupRequired?: boolean;
  requiresApproval?: boolean;
}

export interface VaultValidationResult {
  field: string;
  rule: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface VaultConfig {
  id: string;
  name: string;
  description: string;
  type: VaultType;
  status: VaultStatus;
  settings: VaultSettings;
  security: VaultSecurity;
  access: VaultAccess;
  integrations: VaultIntegration[];
  compliance: VaultCompliance;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export type VaultType = 
  | 'cold_storage'
  | 'hot_wallet'
  | 'hardware_vault'
  | 'custodial'
  | 'multi_sig'
  | 'smart_contract';

export type VaultStatus = 
  | 'active'
  | 'inactive'
  | 'locked'
  | 'archived'
  | 'maintenance'
  | 'compromised';

export interface VaultSettings {
  autoBackup: boolean;
  backupFrequency: string;
  retentionDays: number;
  encryptionLevel: 'standard' | 'high' | 'military';
  requiresApproval: boolean;
  approvalThreshold: number;
  maxTransactionAmount: number;
  dailyTransactionLimit: number;
  allowedCurrencies: string[];
  restrictedCountries: string[];
  notificationSettings: VaultNotificationSettings;
}

export interface VaultNotificationSettings {
  emailAlerts: boolean;
  smsAlerts: boolean;
  webhookUrl?: string;
  alertThresholds: {
    transactionAmount: number;
    dailyVolume: number;
    failedAttempts: number;
  };
}

export interface VaultSecurity {
  encryptionKey: string;
  keyRotationFrequency: number; // days
  lastKeyRotation: Date;
  multiFactorAuth: boolean;
  biometricAuth: boolean;
  ipWhitelist: string[];
  deviceWhitelist: string[];
  sessionTimeout: number; // minutes
  maxConcurrentSessions: number;
  requiresHardwareKey: boolean;
  auditLogging: boolean;
}

export interface VaultAccess {
  owners: VaultAccessUser[];
  administrators: VaultAccessUser[];
  operators: VaultAccessUser[];
  viewers: VaultAccessUser[];
  publicKey?: string;
  sharedKeys: VaultSharedKey[];
}

export interface VaultAccessUser {
  userId: string;
  userName: string;
  email: string;
  role: VaultRole;
  permissions: VaultPermission[];
  addedAt: Date;
  addedBy: string;
  lastAccess?: Date;
  isActive: boolean;
}

export type VaultRole = 'owner' | 'admin' | 'operator' | 'viewer' | 'auditor';

export type VaultPermission = 
  | 'read_config'
  | 'write_config'
  | 'manage_access'
  | 'approve_transactions'
  | 'view_audit_log'
  | 'backup_vault'
  | 'restore_vault'
  | 'emergency_access';

export interface VaultSharedKey {
  id: string;
  name: string;
  publicKey: string;
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface VaultIntegration {
  id: string;
  name: string;
  type: VaultIntegrationType;
  config: Record<string, any>;
  isActive: boolean;
  lastSync?: Date;
  errorCount: number;
  successRate: number;
}

export type VaultIntegrationType = 
  | 'exchange'
  | 'custodian'
  | 'oracle'
  | 'monitoring'
  | 'compliance'
  | 'backup'
  | 'analytics';

export interface VaultCompliance {
  regulations: string[];
  auditSchedule: string;
  lastAudit?: Date;
  nextAudit?: Date;
  complianceScore: number;
  findings: VaultComplianceFinding[];
  certifications: VaultCertification[];
}

export interface VaultComplianceFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
  foundAt: Date;
  resolvedAt?: Date;
}

export interface VaultCertification {
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt: Date;
  certificateId: string;
  isValid: boolean;
}

export interface VaultChangeLogState {
  changes: VaultConfigChange[];
  vaults: VaultConfig[];
  selectedChange: VaultConfigChange | null;
  selectedVault: VaultConfig | null;
  filter: VaultChangeFilter;
  isLoading: boolean;
  error: string | null;
  stats: VaultChangeStats | null;
  pendingApprovals: VaultConfigChange[];
}

export interface VaultChangeFilter {
  vaultId?: string;
  userId?: string;
  changeType?: VaultChangeType;
  severity?: VaultChangeSeverity;
  category?: VaultChangeCategory;
  approved?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
  fieldPath?: string;
  requiresApproval?: boolean;
}

export interface VaultChangeStats {
  totalChanges: number;
  changesLast24h: number;
  changesLast7d: number;
  pendingApprovals: number;
  mostActiveVault: string | null;
  mostActiveUser: string | null;
  changesByType: Record<VaultChangeType, number>;
  changesBySeverity: Record<VaultChangeSeverity, number>;
  changesByCategory: Record<VaultChangeCategory, number>;
  complianceScore: number;
  securityScore: number;
}

export interface VaultChangeActions {
  logChange: (change: Omit<VaultConfigChange, 'id' | 'timestamp'>) => Promise<VaultConfigChange>;
  approveChange: (changeId: string, approverId: string) => Promise<boolean>;
  rollbackChange: (changeId: string, reason: string) => Promise<VaultConfigChange | null>;
  getChangeHistory: (vaultId: string, days?: number) => Promise<VaultConfigChange[]>;
  getVaultConfig: (vaultId: string) => Promise<VaultConfig | null>;
  updateVaultConfig: (vaultId: string, updates: Partial<VaultConfig>, reason: string) => Promise<boolean>;
  validateChange: (change: Partial<VaultConfigChange>) => Promise<VaultValidationResult[]>;
  exportChangeLog: (vaultId?: string, format?: 'json' | 'csv' | 'pdf') => Promise<string>;
  getComplianceReport: (vaultId?: string) => Promise<any>;
  refreshData: () => Promise<void>;
}

export interface VaultChangeEvent {
  id: string;
  type: 'change_logged' | 'change_approved' | 'change_rolled_back' | 'vault_created' | 'vault_deleted';
  changeId: string;
  vaultId: string;
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
  processed: boolean;
}

export interface VaultAuditTrail {
  vaultId: string;
  period: {
    start: Date;
    end: Date;
  };
  changes: VaultConfigChange[];
  users: Array<{
    userId: string;
    userName: string;
    changeCount: number;
    lastActivity: Date;
  }>;
  summary: {
    totalChanges: number;
    approvedChanges: number;
    rolledBackChanges: number;
    complianceIssues: number;
    securityIncidents: number;
  };
  compliance: {
    score: number;
    violations: VaultComplianceFinding[];
    recommendations: string[];
  };
}

export interface VaultChangeTemplate {
  id: string;
  name: string;
  description: string;
  category: VaultChangeCategory;
  fields: VaultChangeTemplateField[];
  approvalRequired: boolean;
  defaultSeverity: VaultChangeSeverity;
  validationRules: VaultValidationRule[];
}

export interface VaultChangeTemplateField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: string;
  description: string;
}

export interface VaultValidationRule {
  field: string;
  rule: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  enabled: boolean;
}

export interface VaultChangeApproval {
  changeId: string;
  approvers: VaultApprover[];
  requiredApprovals: number;
  currentApprovals: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  deadline?: Date;
  comments: VaultApprovalComment[];
}

export interface VaultApprover {
  userId: string;
  userName: string;
  role: VaultRole;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: Date;
  comments?: string;
}

export interface VaultApprovalComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: Date;
  type: 'general' | 'approval' | 'rejection' | 'question';
}

export interface VaultChangeNotification {
  id: string;
  changeId: string;
  vaultId: string;
  type: 'change_logged' | 'approval_required' | 'change_approved' | 'change_rejected' | 'rollback_required';
  recipients: string[];
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  method: 'email' | 'sms' | 'webhook' | 'in_app';
}

export interface VaultChangeRollback {
  id: string;
  originalChangeId: string;
  rollbackChangeId: string;
  reason: string;
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  affectedFields: string[];
  rollbackData: Record<string, any>;
  errorMessage?: string;
} 