// Block 45: Vault Config Change Log - Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  VaultConfigChange, 
  VaultConfig,
  VaultChangeFilter,
  VaultChangeStats,
  VaultValidationResult,
  VaultAuditTrail
} from '../types/vaultConfigLog';
import { vaultConfigLogEngine } from '../engines/VaultConfigLogEngine';

interface VaultConfigLogStore {
  // State
  changes: VaultConfigChange[];
  vaults: VaultConfig[];
  selectedChange: VaultConfigChange | null;
  selectedVault: VaultConfig | null;
  filter: VaultChangeFilter;
  isLoading: boolean;
  error: string | null;
  stats: VaultChangeStats | null;
  pendingApprovals: VaultConfigChange[];
  
  // Actions
  initialize: () => Promise<void>;
  logChange: (change: Omit<VaultConfigChange, 'id' | 'timestamp'>) => Promise<VaultConfigChange>;
  approveChange: (changeId: string, approverId: string) => Promise<boolean>;
  rollbackChange: (changeId: string, reason: string, initiatedBy: string) => Promise<VaultConfigChange | null>;
  getChangeHistory: (vaultId: string, days?: number) => Promise<VaultConfigChange[]>;
  getVaultConfig: (vaultId: string) => Promise<VaultConfig | null>;
  updateVaultConfig: (vaultId: string, updates: Partial<VaultConfig>, reason: string, userId: string) => Promise<boolean>;
  validateChange: (change: Partial<VaultConfigChange>) => Promise<VaultValidationResult[]>;
  exportChangeLog: (vaultId?: string, format?: 'json' | 'csv' | 'pdf') => Promise<string>;
  generateAuditTrail: (vaultId: string, period: { start: Date; end: Date }) => Promise<VaultAuditTrail | null>;
  refreshData: () => Promise<void>;
  
  // Getters
  getChange: (changeId: string) => VaultConfigChange | undefined;
  getFilteredChanges: () => VaultConfigChange[];
  getFilteredVaults: () => VaultConfig[];
  getChangesByVault: (vaultId: string) => VaultConfigChange[];
  getChangesByUser: (userId: string) => VaultConfigChange[];
  getRecentChanges: (hours?: number) => VaultConfigChange[];
  getCriticalChanges: () => VaultConfigChange[];
  getUnapprovedChanges: () => VaultConfigChange[];
  getSecurityChanges: () => VaultConfigChange[];
  getComplianceSummary: () => any;
  
  // Filters
  setFilter: (filter: VaultChangeFilter) => void;
  clearFilter: () => void;
  setSelectedChange: (change: VaultConfigChange | null) => void;
  setSelectedVault: (vault: VaultConfig | null) => void;
  
  // Bulk operations
  bulkApproveChanges: (changeIds: string[], approverId: string) => Promise<number>;
  bulkExportChanges: (changeIds: string[], format?: 'json' | 'csv' | 'pdf') => Promise<string>;
  
  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useVaultConfigLogStore = create<VaultConfigLogStore>()(
  persist(
    (set, get) => ({
      // Initial state
      changes: [],
      vaults: [],
      selectedChange: null,
      selectedVault: null,
      filter: {},
      isLoading: false,
      error: null,
      stats: null,
      pendingApprovals: [],
      
      // Initialize store
      initialize: async () => {
        try {
          set({ isLoading: true });
          await get().refreshData();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize',
            isLoading: false
          });
        }
      },
      
      // Log change
      logChange: async (change: Omit<VaultConfigChange, 'id' | 'timestamp'>) => {
        try {
          set({ isLoading: true });
          const newChange = await vaultConfigLogEngine.logChange(change);
          await get().refreshData();
          return newChange;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to log change',
            isLoading: false
          });
          throw error;
        }
      },
      
      // Approve change
      approveChange: async (changeId: string, approverId: string) => {
        try {
          set({ isLoading: true });
          const success = await vaultConfigLogEngine.approveChange(changeId, approverId);
          if (success) {
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to approve change',
            isLoading: false
          });
          return false;
        }
      },
      
      // Rollback change
      rollbackChange: async (changeId: string, reason: string, initiatedBy: string) => {
        try {
          set({ isLoading: true });
          const rollbackChange = await vaultConfigLogEngine.rollbackChange(changeId, reason, initiatedBy);
          if (rollbackChange) {
            await get().refreshData();
          }
          return rollbackChange;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to rollback change',
            isLoading: false
          });
          return null;
        }
      },
      
      // Get change history
      getChangeHistory: async (vaultId: string, days: number = 30) => {
        try {
          const history = await vaultConfigLogEngine.getChangeHistory(vaultId, days);
          return history;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get change history'
          });
          return [];
        }
      },
      
      // Get vault config
      getVaultConfig: async (vaultId: string) => {
        try {
          const config = await vaultConfigLogEngine.getVaultConfig(vaultId);
          return config;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get vault config'
          });
          return null;
        }
      },
      
      // Update vault config
      updateVaultConfig: async (vaultId: string, updates: Partial<VaultConfig>, reason: string, userId: string) => {
        try {
          set({ isLoading: true });
          const success = await vaultConfigLogEngine.updateVaultConfig(vaultId, updates, reason, userId);
          if (success) {
            await get().refreshData();
          }
          return success;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update vault config',
            isLoading: false
          });
          return false;
        }
      },
      
      // Validate change
      validateChange: async (change: Partial<VaultConfigChange>) => {
        try {
          const results = await vaultConfigLogEngine.validateChange(change);
          return results;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to validate change'
          });
          return [];
        }
      },
      
      // Export change log
      exportChangeLog: async (vaultId?: string, format: 'json' | 'csv' | 'pdf' = 'json') => {
        try {
          const exportData = await vaultConfigLogEngine.exportChangeLog(vaultId, format);
          return exportData;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to export change log'
          });
          return '';
        }
      },
      
      // Generate audit trail
      generateAuditTrail: async (vaultId: string, period: { start: Date; end: Date }) => {
        try {
          const auditTrail = await vaultConfigLogEngine.generateAuditTrail(vaultId, period);
          return auditTrail;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to generate audit trail'
          });
          return null;
        }
      },
      
      // Refresh data
      refreshData: async () => {
        try {
          set({ isLoading: true });
          
          const changes = vaultConfigLogEngine.getAllChanges();
          const vaults = vaultConfigLogEngine.getAllVaults();
          const pendingApprovals = vaultConfigLogEngine.getPendingApprovals();
          const stats = vaultConfigLogEngine.getChangeStats();
          
          set({
            changes,
            vaults,
            pendingApprovals,
            stats,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh data',
            isLoading: false
          });
        }
      },
      
      // Get change by ID
      getChange: (changeId: string) => {
        return vaultConfigLogEngine.getChange(changeId);
      },
      
      // Get filtered changes
      getFilteredChanges: () => {
        const { changes, filter } = get();
        let filtered = [...changes];

        if (filter.vaultId) {
          filtered = filtered.filter(change => change.vaultId === filter.vaultId);
        }

        if (filter.userId) {
          filtered = filtered.filter(change => change.userId === filter.userId);
        }

        if (filter.changeType) {
          filtered = filtered.filter(change => change.changeType === filter.changeType);
        }

        if (filter.severity) {
          filtered = filtered.filter(change => change.severity === filter.severity);
        }

        if (filter.category) {
          filtered = filtered.filter(change => change.category === filter.category);
        }

        if (filter.approved !== undefined) {
          filtered = filtered.filter(change => change.approved === filter.approved);
        }

        if (filter.requiresApproval !== undefined) {
          filtered = filtered.filter(change => 
            change.metadata.requiresApproval === filter.requiresApproval
          );
        }

        if (filter.fieldPath) {
          filtered = filtered.filter(change => 
            change.fieldPath.toLowerCase().includes(filter.fieldPath!.toLowerCase())
          );
        }

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(change =>
            change.vaultName.toLowerCase().includes(query) ||
            change.reason.toLowerCase().includes(query) ||
            change.userName.toLowerCase().includes(query) ||
            change.fieldPath.toLowerCase().includes(query)
          );
        }

        if (filter.dateFrom || filter.dateTo) {
          filtered = filtered.filter(change => {
            if (filter.dateFrom && change.timestamp < filter.dateFrom) return false;
            if (filter.dateTo && change.timestamp > filter.dateTo) return false;
            return true;
          });
        }

        return filtered;
      },
      
      // Get filtered vaults
      getFilteredVaults: () => {
        const { vaults, filter } = get();
        let filtered = [...vaults];

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(vault =>
            vault.name.toLowerCase().includes(query) ||
            vault.description.toLowerCase().includes(query) ||
            vault.type.toLowerCase().includes(query)
          );
        }

        return filtered;
      },
      
      // Get changes by vault
      getChangesByVault: (vaultId: string) => {
        const { changes } = get();
        return changes.filter(change => change.vaultId === vaultId);
      },
      
      // Get changes by user
      getChangesByUser: (userId: string) => {
        const { changes } = get();
        return changes.filter(change => change.userId === userId);
      },
      
      // Get recent changes
      getRecentChanges: (hours: number = 24) => {
        const { changes } = get();
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return changes.filter(change => change.timestamp >= cutoff);
      },
      
      // Get critical changes
      getCriticalChanges: () => {
        const { changes } = get();
        return changes.filter(change => change.severity === 'critical');
      },
      
      // Get unapproved changes
      getUnapprovedChanges: () => {
        const { changes } = get();
        return changes.filter(change => change.metadata.requiresApproval && !change.approved);
      },
      
      // Get security changes
      getSecurityChanges: () => {
        const { changes } = get();
        return changes.filter(change => change.category === 'security');
      },
      
      // Get compliance summary
      getComplianceSummary: () => {
        const { changes, stats } = get();
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
          complianceScore: stats?.complianceScore || 0,
          securityScore: stats?.securityScore || 0
        };
      },
      
      // Set filter
      setFilter: (filter: VaultChangeFilter) => {
        set({ filter });
      },
      
      // Clear filter
      clearFilter: () => {
        set({ filter: {} });
      },
      
      // Set selected change
      setSelectedChange: (change: VaultConfigChange | null) => {
        set({ selectedChange: change });
      },
      
      // Set selected vault
      setSelectedVault: (vault: VaultConfig | null) => {
        set({ selectedVault: vault });
      },
      
      // Bulk approve changes
      bulkApproveChanges: async (changeIds: string[], approverId: string) => {
        let successCount = 0;
        for (const id of changeIds) {
          if (await get().approveChange(id, approverId)) {
            successCount++;
          }
        }
        return successCount;
      },
      
      // Bulk export changes
      bulkExportChanges: async (changeIds: string[], format: 'json' | 'csv' | 'pdf' = 'json') => {
        try {
          const { changes } = get();
          const selectedChanges = changeIds.map(id => changes.find(c => c.id === id)).filter(Boolean);
          
          switch (format) {
            case 'json':
              return JSON.stringify(selectedChanges, null, 2);
            case 'csv':
              const headers = ['ID', 'Vault', 'Type', 'Field', 'User', 'Reason', 'Severity', 'Timestamp'];
              const rows = selectedChanges.map(change => [
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
          set({ 
            error: error instanceof Error ? error.message : 'Failed to export changes'
          });
          return '';
        }
      },
      
      // Set loading
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      // Set error
      setError: (error: string | null) => {
        set({ error });
      },
      
      // Reset store
      reset: () => {
        set({
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
      }
    }),
    {
      name: 'vault-config-log-store',
      partialize: (state) => ({
        filter: state.filter,
        selectedChange: state.selectedChange,
        selectedVault: state.selectedVault
      })
    }
  )
);

// Auto-refresh data every 5 minutes for compliance tracking
let autoRefreshInterval: NodeJS.Timeout;

// Start auto-refresh
export const startAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    const store = useVaultConfigLogStore.getState();
    store.refreshData();
  }, 5 * 60 * 1000); // Refresh every 5 minutes
};

// Stop auto-refresh
export const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
};

// Initialize auto-refresh on store creation
startAutoRefresh(); 