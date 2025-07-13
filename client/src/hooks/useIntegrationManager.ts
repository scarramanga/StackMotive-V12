// Block 81: Integration Manager - Hook
// React Integration for External API Management

import { useState, useEffect, useCallback, useMemo } from 'react';
import { IntegrationManagerEngine } from '../engines/IntegrationManagerEngine';
import {
  IntegrationManager,
  Integration,
  IntegrationManagerFilter,
  TestConnectionRequest,
  TestConnectionResponse,
  ManagerStatus,
  IntegrationAlert,
  IntegrationMetrics,
  HealthSummary,
  UseIntegrationManagerReturn,
  IntegrationType,
  IntegrationProvider
} from '../types/integrationManager';

export const useIntegrationManager = (): UseIntegrationManagerReturn => {
  // Core state
  const [managers, setManagers] = useState<IntegrationManager[]>([]);
  const [currentManager, setCurrentManager] = useState<IntegrationManager | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<IntegrationManagerFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Engine instance
  const engine = useMemo(() => IntegrationManagerEngine.getInstance(), []);

  // Initialize data
  useEffect(() => {
    loadManagers();
  }, []);

  // Load all managers
  const loadManagers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allManagers = engine.getManagers();
      setManagers(allManagers);

      // Set first manager as current if none selected
      if (!currentManager && allManagers.length > 0) {
        setCurrentManager(allManagers[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load managers');
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentManager]);

  // Create new manager
  const createManager = useCallback(async (
    config: Omit<IntegrationManager, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<IntegrationManager> => {
    try {
      setIsLoading(true);
      setError(null);

      const newManager = engine.createManager(config);

      // Update state
      setManagers(prev => [...prev, newManager]);
      setCurrentManager(newManager);

      return newManager;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create manager';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  // Update manager
  const updateManager = useCallback(async (
    id: string,
    updates: Partial<IntegrationManager>
  ): Promise<IntegrationManager> => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedManager = engine.updateManager(id, updates);

      // Update state
      setManagers(prev => prev.map(manager =>
        manager.id === id ? updatedManager : manager
      ));

      // Update current manager if it's the one being updated
      if (currentManager?.id === id) {
        setCurrentManager(updatedManager);
      }

      return updatedManager;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update manager';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentManager]);

  // Delete manager
  const deleteManager = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      engine.deleteManager(id);

      // Update state
      setManagers(prev => prev.filter(manager => manager.id !== id));

      // Clear current manager if it was deleted
      if (currentManager?.id === id) {
        const remainingManagers = managers.filter(manager => manager.id !== id);
        setCurrentManager(remainingManagers.length > 0 ? remainingManagers[0] : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete manager';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentManager, managers]);

  // Add integration
  const addIntegration = useCallback(async (
    managerId: string,
    integration: Omit<Integration, 'id' | 'managerId' | 'createdAt' | 'updatedAt'>
  ): Promise<Integration> => {
    try {
      setIsConnecting(true);
      setError(null);

      const newIntegration = await engine.addIntegration(managerId, integration);

      // Update manager in state
      setManagers(prev => prev.map(manager => {
        if (manager.id === managerId) {
          return engine.getManager(managerId) || manager;
        }
        return manager;
      }));

      // Update current manager if it's the one being modified
      if (currentManager?.id === managerId) {
        setCurrentManager(engine.getManager(managerId) || currentManager);
      }

      return newIntegration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add integration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [engine, currentManager]);

  // Update integration
  const updateIntegration = useCallback(async (
    integrationId: string,
    updates: Partial<Integration>
  ): Promise<Integration> => {
    try {
      setError(null);

      const updatedIntegration = await engine.updateIntegration(integrationId, updates);

      // Find and update the manager containing this integration
      const managerWithIntegration = managers.find(manager =>
        manager.integrations.some(i => i.id === integrationId)
      );

      if (managerWithIntegration) {
        const updatedManager = engine.getManager(managerWithIntegration.id);
        if (updatedManager) {
          setManagers(prev => prev.map(manager =>
            manager.id === managerWithIntegration.id ? updatedManager : manager
          ));

          if (currentManager?.id === managerWithIntegration.id) {
            setCurrentManager(updatedManager);
          }
        }
      }

      return updatedIntegration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update integration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, managers, currentManager]);

  // Remove integration
  const removeIntegration = useCallback(async (integrationId: string): Promise<void> => {
    try {
      setError(null);

      await engine.removeIntegration(integrationId);

      // Find and update the manager containing this integration
      const managerWithIntegration = managers.find(manager =>
        manager.integrations.some(i => i.id === integrationId)
      );

      if (managerWithIntegration) {
        const updatedManager = engine.getManager(managerWithIntegration.id);
        if (updatedManager) {
          setManagers(prev => prev.map(manager =>
            manager.id === managerWithIntegration.id ? updatedManager : manager
          ));

          if (currentManager?.id === managerWithIntegration.id) {
            setCurrentManager(updatedManager);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove integration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, managers, currentManager]);

  // Test connection
  const testConnection = useCallback(async (
    request: TestConnectionRequest
  ): Promise<TestConnectionResponse> => {
    try {
      setIsTesting(true);
      setError(null);

      const result = await engine.testConnection(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsTesting(false);
    }
  }, [engine]);

  // Enable integration
  const enableIntegration = useCallback(async (integrationId: string): Promise<void> => {
    try {
      setError(null);
      await engine.enableIntegration(integrationId);
      
      // Refresh manager state
      await loadManagers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable integration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, loadManagers]);

  // Disable integration
  const disableIntegration = useCallback(async (integrationId: string): Promise<void> => {
    try {
      setError(null);
      await engine.disableIntegration(integrationId);
      
      // Refresh manager state
      await loadManagers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable integration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, loadManagers]);

  // Run health check
  const runHealthCheck = useCallback(async (managerId: string): Promise<HealthSummary> => {
    try {
      setError(null);
      const healthSummary = await engine.runHealthCheck(managerId);
      
      // Update manager state
      const updatedManager = engine.getManager(managerId);
      if (updatedManager) {
        setManagers(prev => prev.map(manager =>
          manager.id === managerId ? updatedManager : manager
        ));

        if (currentManager?.id === managerId) {
          setCurrentManager(updatedManager);
        }
      }

      return healthSummary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentManager]);

  // Get integration metrics
  const getIntegrationMetrics = useCallback((integrationId: string): IntegrationMetrics => {
    try {
      return engine.getIntegrationMetrics(integrationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get metrics');
      throw err;
    }
  }, [engine]);

  // Get manager status
  const getManagerStatus = useCallback((managerId: string): ManagerStatus => {
    try {
      return engine.getManagerStatus(managerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get status');
      throw err;
    }
  }, [engine]);

  // Get active alerts
  const getActiveAlerts = useCallback((managerId: string): IntegrationAlert[] => {
    try {
      return engine.getActiveAlerts(managerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get alerts');
      return [];
    }
  }, [engine]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      setError(null);
      await engine.acknowledgeAlert(alertId);
      
      // Refresh managers to update alert status
      await loadManagers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge alert';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, loadManagers]);

  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      setError(null);
      await engine.resolveAlert(alertId);
      
      // Refresh managers to update alert status
      await loadManagers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve alert';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, loadManagers]);

  // Filter managers
  const filterManagers = useCallback((newFilter: IntegrationManagerFilter) => {
    setFilter(newFilter);
  }, []);

  // Search managers
  const searchManagers = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed values
  const filteredManagers = useMemo(() => {
    let filtered = managers;

    // Apply engine filtering
    if (Object.keys(filter).length > 0) {
      filtered = engine.filterManagers(filtered, filter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const searchFilter: IntegrationManagerFilter = { searchTerm: searchQuery.trim() };
      filtered = engine.filterManagers(filtered, searchFilter);
    }

    return filtered;
  }, [managers, filter, searchQuery, engine]);

  // Manager statistics
  const managerStats = useMemo(() => {
    if (filteredManagers.length === 0) return null;

    const totalIntegrations = filteredManagers.reduce((sum, manager) => sum + manager.integrations.length, 0);
    const activeIntegrations = filteredManagers.reduce((sum, manager) => 
      sum + manager.integrations.filter(i => i.isEnabled).length, 0
    );
    const healthyIntegrations = filteredManagers.reduce((sum, manager) => 
      sum + manager.integrations.filter(i => i.connectionInfo.healthStatus === 'healthy').length, 0
    );
    const totalAlerts = filteredManagers.reduce((sum, manager) => sum + manager.managerStatus.activeAlerts.length, 0);

    return {
      totalManagers: filteredManagers.length,
      totalIntegrations,
      activeIntegrations,
      healthyIntegrations,
      totalAlerts,
      healthPercentage: totalIntegrations > 0 ? (healthyIntegrations / totalIntegrations) * 100 : 100
    };
  }, [filteredManagers]);

  return {
    // Data
    managers: filteredManagers,
    currentManager,

    // Loading states
    isLoading,
    isConnecting,
    isTesting,

    // Manager operations
    createManager,
    updateManager,
    deleteManager,

    // Integration operations
    addIntegration,
    updateIntegration,
    removeIntegration,

    // Connection management
    testConnection,
    enableIntegration,
    disableIntegration,

    // Health monitoring
    runHealthCheck,
    getIntegrationMetrics,
    getManagerStatus,

    // Alert management
    getActiveAlerts,
    acknowledgeAlert,
    resolveAlert,

    // Filtering and search
    filterManagers,
    searchManagers,

    // Error handling
    error,
    clearError,

    // Additional computed values
    managerStats,

    // Current filter state
    currentFilter: filter,
    currentSearchQuery: searchQuery,

    // Utility functions
    setCurrentManager,
    refreshData: loadManagers
  };
};

export default useIntegrationManager; 