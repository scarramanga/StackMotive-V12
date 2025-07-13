// Block 29: Vault Config Snapshot - Hook
// React hook for vault configuration snapshot management

import { useState, useEffect, useCallback } from 'react';
import { VaultConfigSnapshotEngine } from '../engines/VaultConfigSnapshotEngine';
import { useVaultConfigSnapshotStore } from '../store/vaultConfigSnapshotStore';
import {
  VaultConfigSnapshot,
  VaultConfiguration,
  ValidationResult,
  SnapshotComparison
} from '../types/vaultConfigSnapshot';

export const useVaultConfigSnapshot = () => {
  const engine = VaultConfigSnapshotEngine.getInstance();
  const store = useVaultConfigSnapshotStore();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [comparing, setComparing] = useState(false);

  // Initialize store
  useEffect(() => {
    const initializeStore = async () => {
      try {
        setLoading(true);
        const snapshots = engine.getAllSnapshots();
        store.setSnapshots(snapshots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeStore();
  }, []);

  // Snapshot Management
  const createSnapshot = useCallback(async (
    vaultId: string,
    config: VaultConfiguration,
    name: string,
    description: string = '',
    tags: string[] = []
  ): Promise<VaultConfigSnapshot> => {
    try {
      setLoading(true);
      setError(null);

      const snapshot = engine.createSnapshot(vaultId, config, name, description, tags);
      store.addSnapshot(snapshot);

      return snapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSnapshot = useCallback(async (
    id: string,
    updates: Partial<VaultConfigSnapshot>
  ): Promise<VaultConfigSnapshot> => {
    try {
      setLoading(true);
      setError(null);

      const snapshot = engine.updateSnapshot(id, updates);
      store.updateSnapshot(id, snapshot);

      return snapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSnapshot = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.deleteSnapshot(id);
      if (success) {
        store.removeSnapshot(id);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const activateSnapshot = useCallback(async (id: string): Promise<VaultConfigSnapshot> => {
    try {
      setLoading(true);
      setError(null);

      const snapshot = engine.activateSnapshot(id);
      store.updateSnapshot(id, snapshot);

      // Update other snapshots in the same vault
      const vaultSnapshots = engine.getSnapshotsByVault(snapshot.vaultId);
      vaultSnapshots.forEach(s => {
        if (s.id !== id && s.isActive) {
          store.updateSnapshot(s.id, { ...s, isActive: false });
        }
      });

      return snapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Configuration Management
  const getCurrentConfiguration = useCallback((vaultId: string): VaultConfiguration | undefined => {
    return engine.getCurrentConfiguration(vaultId);
  }, []);

  const updateConfiguration = useCallback(async (
    vaultId: string,
    config: VaultConfiguration
  ): Promise<VaultConfiguration> => {
    try {
      setLoading(true);
      setError(null);

      const updatedConfig = engine.updateConfiguration(vaultId, config);
      return updatedConfig;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Validation
  const validateConfiguration = useCallback(async (
    config: VaultConfiguration
  ): Promise<ValidationResult> => {
    try {
      setValidating(true);
      setError(null);

      const result = engine.validateConfiguration(config);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setValidating(false);
    }
  }, []);

  // Comparison
  const compareSnapshots = useCallback(async (
    id1: string,
    id2: string
  ): Promise<SnapshotComparison> => {
    try {
      setComparing(true);
      setError(null);

      const comparison = engine.compareSnapshots(id1, id2);
      return comparison;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare snapshots';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setComparing(false);
    }
  }, []);

  // Import/Export
  const exportSnapshot = useCallback(async (id: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const exported = engine.exportSnapshot(id);
      return exported;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const importSnapshot = useCallback(async (data: string): Promise<VaultConfigSnapshot> => {
    try {
      setLoading(true);
      setError(null);

      const snapshot = engine.importSnapshot(data);
      store.addSnapshot(snapshot);

      return snapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Rollback
  const rollbackToSnapshot = useCallback(async (id: string): Promise<VaultConfigSnapshot> => {
    try {
      setLoading(true);
      setError(null);

      const snapshot = engine.rollbackToSnapshot(id);
      store.addSnapshot(snapshot);

      return snapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rollback to snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Version Management
  const getVersionHistory = useCallback((vaultId: string): VaultConfigSnapshot[] => {
    return engine.getVersionHistory(vaultId);
  }, []);

  const createBranch = useCallback(async (
    snapshotId: string,
    branchName: string
  ): Promise<VaultConfigSnapshot> => {
    try {
      setLoading(true);
      setError(null);

      const snapshot = engine.createBranch(snapshotId, branchName);
      store.addSnapshot(snapshot);

      return snapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create branch';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Utilities
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshSnapshots = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const snapshots = engine.getAllSnapshots();
      store.setSnapshots(snapshots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh snapshots');
    } finally {
      setLoading(false);
    }
  }, []);

  // Store data
  const snapshots = store.snapshots;
  const selectedSnapshot = store.selectedSnapshot;
  const currentSnapshot = selectedSnapshot ? store.getSnapshot(selectedSnapshot) : null;

  // Filtered data
  const snapshotsByVault = (vaultId: string) => store.getSnapshotsByVault(vaultId);
  const activeSnapshots = snapshots.filter(s => s.isActive);
  const validSnapshots = snapshots.filter(s => s.isValid);
  const invalidSnapshots = snapshots.filter(s => !s.isValid);

  return {
    // State
    loading,
    error,
    validating,
    comparing,

    // Data
    snapshots,
    selectedSnapshot,
    currentSnapshot,
    activeSnapshots,
    validSnapshots,
    invalidSnapshots,

    // Snapshot management
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    activateSnapshot,

    // Configuration management
    getCurrentConfiguration,
    updateConfiguration,

    // Validation
    validateConfiguration,

    // Comparison
    compareSnapshots,

    // Import/Export
    exportSnapshot,
    importSnapshot,

    // Rollback
    rollbackToSnapshot,

    // Version management
    getVersionHistory,
    createBranch,

    // Utilities
    clearError,
    refreshSnapshots,
    snapshotsByVault,

    // Store actions
    setSelectedSnapshot: store.setSelectedSnapshot,
    setView: store.setView,
    setFilter: store.setFilter,
    setSort: store.setSort
  };
};

// Specialized hooks
export const useSnapshotManagement = () => {
  const {
    snapshots,
    selectedSnapshot,
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    activateSnapshot,
    setSelectedSnapshot,
    loading,
    error,
    clearError
  } = useVaultConfigSnapshot();

  return {
    snapshots,
    selectedSnapshot,
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    activateSnapshot,
    setSelectedSnapshot,
    loading,
    error,
    clearError
  };
};

export const useConfigurationValidation = () => {
  const {
    validateConfiguration,
    validating,
    error,
    clearError
  } = useVaultConfigSnapshot();

  return {
    validateConfiguration,
    validating,
    error,
    clearError
  };
};

export const useSnapshotComparison = () => {
  const {
    compareSnapshots,
    comparing,
    error,
    clearError
  } = useVaultConfigSnapshot();

  return {
    compareSnapshots,
    comparing,
    error,
    clearError
  };
};

export const useSnapshotVersioning = () => {
  const {
    getVersionHistory,
    createBranch,
    rollbackToSnapshot,
    loading,
    error,
    clearError
  } = useVaultConfigSnapshot();

  return {
    getVersionHistory,
    createBranch,
    rollbackToSnapshot,
    loading,
    error,
    clearError
  };
}; 