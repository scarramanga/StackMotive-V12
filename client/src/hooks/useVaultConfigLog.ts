// Block 45: Vault Config Change Log - Hook
import { useState, useEffect, useCallback } from 'react';
import { 
  VaultConfigChange, 
  VaultConfig,
  VaultChangeLogState,
  VaultChangeFilter,
  VaultChangeStats,
  VaultValidationResult,
  VaultAuditTrail
} from '../types/vaultConfigLog';
import { vaultConfigLogEngine } from '../engines/VaultConfigLogEngine';

export function useVaultConfigLog() {
  const [state, setState] = useState<VaultChangeLogState>({
    changes: [],
    vaults: [],
    selectedChange: null,
    selectedVault: null,
    filter: {},
    isLoading: false,
    error: null,
    stats: null,
    pendingApprovals: []
  });

  // Initialize data
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const changes = vaultConfigLogEngine.getAllChanges();
      const vaults = vaultConfigLogEngine.getAllVaults();
      const pendingApprovals = vaultConfigLogEngine.getPendingApprovals();
      const stats = vaultConfigLogEngine.getChangeStats();

      setState(prev => ({
        ...prev,
        changes,
        vaults,
        pendingApprovals,
        stats,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh data'
      }));
    }
  }, []);

  // Log configuration change
  const logChange = useCallback(async (change: Omit<VaultConfigChange, 'id' | 'timestamp'>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const newChange = await vaultConfigLogEngine.logChange(change);
      await refreshData();
      return newChange;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to log change'
      }));
      throw error;
    }
  }, [refreshData]);

  // Approve change
  const approveChange = useCallback(async (changeId: string, approverId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const success = await vaultConfigLogEngine.approveChange(changeId, approverId);
      if (success) {
        await refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to approve change'
      }));
      return false;
    }
  }, [refreshData]);

  // Rollback change
  const rollbackChange = useCallback(async (changeId: string, reason: string, initiatedBy: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const rollbackChange = await vaultConfigLogEngine.rollbackChange(changeId, reason, initiatedBy);
      if (rollbackChange) {
        await refreshData();
      }
      return rollbackChange;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to rollback change'
      }));
      return null;
    }
  }, [refreshData]);

  // Get change history
  const getChangeHistory = useCallback(async (vaultId: string, days: number = 30) => {
    try {
      const history = await vaultConfigLogEngine.getChangeHistory(vaultId, days);
      return history;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get change history'
      }));
      return [];
    }
  }, []);

  // Get vault config
  const getVaultConfig = useCallback(async (vaultId: string) => {
    try {
      const config = await vaultConfigLogEngine.getVaultConfig(vaultId);
      return config;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get vault config'
      }));
      return null;
    }
  }, []);

  // Update vault config
  const updateVaultConfig = useCallback(async (
    vaultId: string, 
    updates: Partial<VaultConfig>, 
    reason: string,
    userId: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const success = await vaultConfigLogEngine.updateVaultConfig(vaultId, updates, reason, userId);
      if (success) {
        await refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update vault config'
      }));
      return false;
    }
  }, [refreshData]);

  // Validate change
  const validateChange = useCallback(async (change: Partial<VaultConfigChange>) => {
    try {
      const results = await vaultConfigLogEngine.validateChange(change);
      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to validate change'
      }));
      return [];
    }
  }, []);

  // Export change log
  const exportChangeLog = useCallback(async (vaultId?: string, format: 'json' | 'csv' | 'pdf' = 'json') => {
    try {
      const exportData = await vaultConfigLogEngine.exportChangeLog(vaultId, format);
      return exportData;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export change log'
      }));
      return '';
    }
  }, []);

  // Generate audit trail
  const generateAuditTrail = useCallback(async (vaultId: string, period: { start: Date; end: Date }) => {
    try {
      const auditTrail = await vaultConfigLogEngine.generateAuditTrail(vaultId, period);
      return auditTrail;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate audit trail'
      }));
      return null;
    }
  }, []);

  // Get filtered changes
  const getFilteredChanges = useCallback(() => {
    let filtered = [...state.changes];

    if (state.filter.vaultId) {
      filtered = filtered.filter(change => change.vaultId === state.filter.vaultId);
    }

    if (state.filter.userId) {
      filtered = filtered.filter(change => change.userId === state.filter.userId);
    }

    if (state.filter.changeType) {
      filtered = filtered.filter(change => change.changeType === state.filter.changeType);
    }

    if (state.filter.severity) {
      filtered = filtered.filter(change => change.severity === state.filter.severity);
    }

    if (state.filter.category) {
      filtered = filtered.filter(change => change.category === state.filter.category);
    }

    if (state.filter.approved !== undefined) {
      filtered = filtered.filter(change => change.approved === state.filter.approved);
    }

    if (state.filter.requiresApproval !== undefined) {
      filtered = filtered.filter(change => 
        change.metadata.requiresApproval === state.filter.requiresApproval
      );
    }

    if (state.filter.fieldPath) {
      filtered = filtered.filter(change => 
        change.fieldPath.toLowerCase().includes(state.filter.fieldPath!.toLowerCase())
      );
    }

    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(change =>
        change.vaultName.toLowerCase().includes(query) ||
        change.reason.toLowerCase().includes(query) ||
        change.userName.toLowerCase().includes(query) ||
        change.fieldPath.toLowerCase().includes(query)
      );
    }

    if (state.filter.dateFrom || state.filter.dateTo) {
      filtered = filtered.filter(change => {
        if (state.filter.dateFrom && change.timestamp < state.filter.dateFrom) return false;
        if (state.filter.dateTo && change.timestamp > state.filter.dateTo) return false;
        return true;
      });
    }

    return filtered;
  }, [state.changes, state.filter]);

  // Get filtered vaults
  const getFilteredVaults = useCallback(() => {
    let filtered = [...state.vaults];

    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(vault =>
        vault.name.toLowerCase().includes(query) ||
        vault.description.toLowerCase().includes(query) ||
        vault.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [state.vaults, state.filter]);

  // Get changes by vault
  const getChangesByVault = useCallback((vaultId: string) => {
    return state.changes.filter(change => change.vaultId === vaultId);
  }, [state.changes]);

  // Get changes by user
  const getChangesByUser = useCallback((userId: string) => {
    return state.changes.filter(change => change.userId === userId);
  }, [state.changes]);

  // Get recent changes
  const getRecentChanges = useCallback((hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return state.changes.filter(change => change.timestamp >= cutoff);
  }, [state.changes]);

  // Get critical changes
  const getCriticalChanges = useCallback(() => {
    return state.changes.filter(change => change.severity === 'critical');
  }, [state.changes]);

  // Get unapproved changes
  const getUnapprovedChanges = useCallback(() => {
    return state.changes.filter(change => change.metadata.requiresApproval && !change.approved);
  }, [state.changes]);

  // Get security changes
  const getSecurityChanges = useCallback(() => {
    return state.changes.filter(change => change.category === 'security');
  }, [state.changes]);

  // Get change by ID
  const getChange = useCallback((changeId: string) => {
    return vaultConfigLogEngine.getChange(changeId);
  }, []);

  // Set filter
  const setFilter = useCallback((filter: VaultChangeFilter) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setState(prev => ({ ...prev, filter: {} }));
  }, []);

  // Set selected change
  const setSelectedChange = useCallback((change: VaultConfigChange | null) => {
    setState(prev => ({ ...prev, selectedChange: change }));
  }, []);

  // Set selected vault
  const setSelectedVault = useCallback((vault: VaultConfig | null) => {
    setState(prev => ({ ...prev, selectedVault: vault }));
  }, []);

  // Bulk operations
  const bulkApproveChanges = useCallback(async (changeIds: string[], approverId: string) => {
    let successCount = 0;
    for (const id of changeIds) {
      if (await approveChange(id, approverId)) {
        successCount++;
      }
    }
    return successCount;
  }, [approveChange]);

  const bulkExportChanges = useCallback(async (changeIds: string[], format: 'json' | 'csv' | 'pdf' = 'json') => {
    try {
      const changes = changeIds.map(id => state.changes.find(c => c.id === id)).filter(Boolean);
      
      switch (format) {
        case 'json':
          return JSON.stringify(changes, null, 2);
        case 'csv':
          // Simple CSV export
          const headers = ['ID', 'Vault', 'Type', 'Field', 'User', 'Reason', 'Severity', 'Timestamp'];
          const rows = changes.map(change => [
            change!.id,
            change!.vaultName,
            change!.changeType,
            change!.fieldPath,
            change!.userName,
            change!.reason,
            change!.severity,
            change!.timestamp.toISOString()
          ]);
          return [headers, ...rows].map(row => row.join(',')).join('\n');
        default:
          return '';
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export changes'
      }));
      return '';
    }
  }, [state.changes]);

  // Get compliance summary
  const getComplianceSummary = useCallback(() => {
    const changes = state.changes;
    const totalChanges = changes.length;
    const approvedChanges = changes.filter(c => c.approved).length;
    const pendingApprovals = changes.filter(c => c.metadata.requiresApproval && !c.approved).length;
    const securityChanges = changes.filter(c => c.category === 'security').length;
    const criticalChanges = changes.filter(c => c.severity === 'critical').length;

    return {
      totalChanges,
      approvedChanges,
      pendingApprovals,
      securityChanges,
      criticalChanges,
      approvalRate: totalChanges > 0 ? (approvedChanges / totalChanges) * 100 : 0,
      complianceScore: state.stats?.complianceScore || 0,
      securityScore: state.stats?.securityScore || 0
    };
  }, [state.changes, state.stats]);

  return {
    // State
    changes: state.changes,
    filteredChanges: getFilteredChanges(),
    vaults: state.vaults,
    filteredVaults: getFilteredVaults(),
    selectedChange: state.selectedChange,
    selectedVault: state.selectedVault,
    filter: state.filter,
    isLoading: state.isLoading,
    error: state.error,
    stats: state.stats,
    pendingApprovals: state.pendingApprovals,

    // Actions
    logChange,
    approveChange,
    rollbackChange,
    getChangeHistory,
    getVaultConfig,
    updateVaultConfig,
    validateChange,
    exportChangeLog,
    generateAuditTrail,
    refreshData,

    // Getters
    getChange,
    getChangesByVault,
    getChangesByUser,
    getRecentChanges,
    getCriticalChanges,
    getUnapprovedChanges,
    getSecurityChanges,
    getComplianceSummary,

    // Filters
    setFilter,
    clearFilter,
    setSelectedChange,
    setSelectedVault,

    // Bulk operations
    bulkApproveChanges,
    bulkExportChanges
  };
} 