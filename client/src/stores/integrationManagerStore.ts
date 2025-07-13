// Block 81: Integration Manager - Store
// Zustand State Management for External API Integrations

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IntegrationManagerEngine } from '../engines/IntegrationManagerEngine';
import {
  IntegrationManager,
  Integration,
  IntegrationManagerState,
  IntegrationManagerFilter,
  TestConnectionRequest,
  TestConnectionResponse,
  IntegrationAlert
} from '../types/integrationManager';

interface IntegrationManagerStore extends IntegrationManagerState {
  // Engine reference
  engine: IntegrationManagerEngine;
  
  // Actions
  actions: {
    // Manager operations
    createManager: (config: Omit<IntegrationManager, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<IntegrationManager>;
    updateManager: (id: string, updates: Partial<IntegrationManager>) => Promise<IntegrationManager>;
    deleteManager: (id: string) => Promise<void>;
    loadManagers: () => Promise<void>;
    
    // Integration operations
    addIntegration: (managerId: string, integration: Omit<Integration, 'id' | 'managerId' | 'createdAt' | 'updatedAt'>) => Promise<Integration>;
    updateIntegration: (integrationId: string, updates: Partial<Integration>) => Promise<Integration>;
    removeIntegration: (integrationId: string) => Promise<void>;
    
    // Connection management
    testConnection: (request: TestConnectionRequest) => Promise<TestConnectionResponse>;
    enableIntegration: (integrationId: string) => Promise<void>;
    disableIntegration: (integrationId: string) => Promise<void>;
    
    // Health monitoring
    runHealthCheck: (managerId: string) => Promise<void>;
    
    // Alert management
    acknowledgeAlert: (alertId: string) => Promise<void>;
    resolveAlert: (alertId: string) => Promise<void>;
    
    // Selection and filtering
    setCurrentManager: (managerId: string | null) => void;
    setFilter: (filter: IntegrationManagerFilter) => void;
    setSearchQuery: (query: string) => void;
    
    // UI state
    toggleManagerSelection: (managerId: string) => void;
    clearSelection: () => void;
    
    // Cache management
    invalidateCache: (managerId?: string) => void;
    refreshData: () => Promise<void>;
    
    // Error handling
    setError: (managerId: string, error: string) => void;
    clearError: (managerId: string) => void;
    clearAllErrors: () => void;
  };
  
  // Computed values
  computed: {
    getFilteredManagers: () => IntegrationManager[];
    getCurrentManager: () => IntegrationManager | null;
    getManagerStats: () => {
      totalManagers: number;
      activeManagers: number;
      totalIntegrations: number;
      activeIntegrations: number;
      healthyIntegrations: number;
      totalAlerts: number;
    } | null;
    getActiveAlerts: () => IntegrationAlert[];
  };
}

export const useIntegrationManagerStore = create<IntegrationManagerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      managers: {},
      currentManagerId: null,
      activeFilter: {},
      searchQuery: '',
      selectedManagerIds: [],
      connectionTests: {},
      monitoringManagers: {},
      lastUpdated: {},
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      errors: {},
      
      // Engine instance
      engine: IntegrationManagerEngine.getInstance(),
      
      // Actions
      actions: {
        // Create new manager
        createManager: async (config) => {
          const { engine } = get();
          
          try {
            const newManager = engine.createManager(config);
            
            set((state) => ({
              managers: {
                ...state.managers,
                [newManager.id]: newManager
              },
              currentManagerId: newManager.id,
              lastUpdated: {
                ...state.lastUpdated,
                [newManager.id]: new Date()
              }
            }));
            
            return newManager;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create manager';
            get().actions.setError('create', errorMessage);
            throw error;
          }
        },
        
        // Update manager
        updateManager: async (id, updates) => {
          const { engine } = get();
          
          try {
            const updatedManager = engine.updateManager(id, updates);
            
            set((state) => ({
              managers: {
                ...state.managers,
                [id]: updatedManager
              },
              lastUpdated: {
                ...state.lastUpdated,
                [id]: new Date()
              }
            }));
            
            return updatedManager;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update manager';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Delete manager
        deleteManager: async (id) => {
          const { engine } = get();
          
          try {
            engine.deleteManager(id);
            
            set((state) => {
              const { [id]: deletedManager, ...remainingManagers } = state.managers;
              const { [id]: deletedUpdate, ...remainingUpdates } = state.lastUpdated;
              const { [id]: deletedMonitoring, ...remainingMonitoring } = state.monitoringManagers;
              const { [id]: deletedErrors, ...remainingErrors } = state.errors;
              
              return {
                managers: remainingManagers,
                currentManagerId: state.currentManagerId === id ? null : state.currentManagerId,
                selectedManagerIds: state.selectedManagerIds.filter(managerId => managerId !== id),
                lastUpdated: remainingUpdates,
                monitoringManagers: remainingMonitoring,
                errors: remainingErrors
              };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete manager';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Load all managers
        loadManagers: async () => {
          const { engine } = get();
          
          try {
            const managers = engine.getManagers();
            const managerDict = managers.reduce((acc, manager) => {
              acc[manager.id] = manager;
              return acc;
            }, {} as Record<string, IntegrationManager>);
            
            const now = new Date();
            const lastUpdated = managers.reduce((acc, manager) => {
              acc[manager.id] = now;
              return acc;
            }, {} as Record<string, Date>);
            
            set((state) => ({
              managers: managerDict,
              lastUpdated,
              currentManagerId: state.currentManagerId || (managers.length > 0 ? managers[0].id : null)
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load managers';
            get().actions.setError('load', errorMessage);
            throw error;
          }
        },
        
        // Add integration
        addIntegration: async (managerId, integration) => {
          const { engine } = get();
          
          try {
            const newIntegration = await engine.addIntegration(managerId, integration);
            
            // Refresh manager state
            const updatedManager = engine.getManager(managerId);
            if (updatedManager) {
              set((state) => ({
                managers: {
                  ...state.managers,
                  [managerId]: updatedManager
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [managerId]: new Date()
                }
              }));
            }
            
            return newIntegration;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add integration';
            get().actions.setError(managerId, errorMessage);
            throw error;
          }
        },
        
        // Update integration
        updateIntegration: async (integrationId, updates) => {
          const { engine } = get();
          
          try {
            const updatedIntegration = await engine.updateIntegration(integrationId, updates);
            
            // Find manager containing this integration and refresh
            const managers = Object.values(get().managers);
            const managerWithIntegration = managers.find(manager =>
              manager.integrations.some(i => i.id === integrationId)
            );
            
            if (managerWithIntegration) {
              const updatedManager = engine.getManager(managerWithIntegration.id);
              if (updatedManager) {
                set((state) => ({
                  managers: {
                    ...state.managers,
                    [managerWithIntegration.id]: updatedManager
                  },
                  lastUpdated: {
                    ...state.lastUpdated,
                    [managerWithIntegration.id]: new Date()
                  }
                }));
              }
            }
            
            return updatedIntegration;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update integration';
            get().actions.setError('integration', errorMessage);
            throw error;
          }
        },
        
        // Remove integration
        removeIntegration: async (integrationId) => {
          const { engine } = get();
          
          try {
            await engine.removeIntegration(integrationId);
            
            // Find manager containing this integration and refresh
            const managers = Object.values(get().managers);
            const managerWithIntegration = managers.find(manager =>
              manager.integrations.some(i => i.id === integrationId)
            );
            
            if (managerWithIntegration) {
              const updatedManager = engine.getManager(managerWithIntegration.id);
              if (updatedManager) {
                set((state) => ({
                  managers: {
                    ...state.managers,
                    [managerWithIntegration.id]: updatedManager
                  },
                  lastUpdated: {
                    ...state.lastUpdated,
                    [managerWithIntegration.id]: new Date()
                  }
                }));
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to remove integration';
            get().actions.setError('integration', errorMessage);
            throw error;
          }
        },
        
        // Test connection
        testConnection: async (request) => {
          const { engine } = get();
          
          try {
            const result = await engine.testConnection(request);
            
            set((state) => ({
              connectionTests: {
                ...state.connectionTests,
                [request.integrationId]: result
              }
            }));
            
            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
            get().actions.setError(request.integrationId, errorMessage);
            throw error;
          }
        },
        
        // Enable integration
        enableIntegration: async (integrationId) => {
          const { engine } = get();
          
          try {
            await engine.enableIntegration(integrationId);
            
            // Refresh relevant manager
            await get().actions.loadManagers();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to enable integration';
            get().actions.setError(integrationId, errorMessage);
            throw error;
          }
        },
        
        // Disable integration
        disableIntegration: async (integrationId) => {
          const { engine } = get();
          
          try {
            await engine.disableIntegration(integrationId);
            
            // Refresh relevant manager
            await get().actions.loadManagers();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to disable integration';
            get().actions.setError(integrationId, errorMessage);
            throw error;
          }
        },
        
        // Run health check
        runHealthCheck: async (managerId) => {
          const { engine } = get();
          
          try {
            await engine.runHealthCheck(managerId);
            
            // Refresh manager state
            const updatedManager = engine.getManager(managerId);
            if (updatedManager) {
              set((state) => ({
                managers: {
                  ...state.managers,
                  [managerId]: updatedManager
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [managerId]: new Date()
                }
              }));
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Health check failed';
            get().actions.setError(managerId, errorMessage);
            throw error;
          }
        },
        
        // Acknowledge alert
        acknowledgeAlert: async (alertId) => {
          const { engine } = get();
          
          try {
            await engine.acknowledgeAlert(alertId);
            
            // Refresh all managers to update alert status
            await get().actions.loadManagers();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to acknowledge alert';
            get().actions.setError('alert', errorMessage);
            throw error;
          }
        },
        
        // Resolve alert
        resolveAlert: async (alertId) => {
          const { engine } = get();
          
          try {
            await engine.resolveAlert(alertId);
            
            // Refresh all managers to update alert status
            await get().actions.loadManagers();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to resolve alert';
            get().actions.setError('alert', errorMessage);
            throw error;
          }
        },
        
        // Set current manager
        setCurrentManager: (managerId) => {
          set({ currentManagerId: managerId });
        },
        
        // Set filter
        setFilter: (filter) => {
          set({ activeFilter: filter });
        },
        
        // Set search query
        setSearchQuery: (query) => {
          set({ searchQuery: query });
        },
        
        // Toggle manager selection
        toggleManagerSelection: (managerId) => {
          set((state) => ({
            selectedManagerIds: state.selectedManagerIds.includes(managerId)
              ? state.selectedManagerIds.filter(id => id !== managerId)
              : [...state.selectedManagerIds, managerId]
          }));
        },
        
        // Clear selection
        clearSelection: () => {
          set({ selectedManagerIds: [] });
        },
        
        // Cache management
        invalidateCache: (managerId) => {
          if (managerId) {
            set((state) => {
              const { [managerId]: deleted, ...remaining } = state.lastUpdated;
              return { lastUpdated: remaining };
            });
          } else {
            set({ lastUpdated: {} });
          }
        },
        
        // Refresh data
        refreshData: async () => {
          await get().actions.loadManagers();
        },
        
        // Error handling
        setError: (managerId, error) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [managerId]: error
            }
          }));
        },
        
        clearError: (managerId) => {
          set((state) => {
            const { [managerId]: deleted, ...remaining } = state.errors;
            return { errors: remaining };
          });
        },
        
        clearAllErrors: () => {
          set({ errors: {} });
        }
      },
      
      // Computed values
      computed: {
        // Get filtered managers
        getFilteredManagers: () => {
          const { managers, activeFilter, searchQuery, engine } = get();
          let filteredManagers = Object.values(managers);
          
          // Apply engine filtering
          if (Object.keys(activeFilter).length > 0) {
            filteredManagers = engine.filterManagers(filteredManagers, activeFilter);
          }
          
          // Apply search
          if (searchQuery.trim()) {
            const searchFilter = { searchTerm: searchQuery.trim() };
            filteredManagers = engine.filterManagers(filteredManagers, searchFilter);
          }
          
          return filteredManagers;
        },
        
        // Get current manager
        getCurrentManager: () => {
          const { managers, currentManagerId } = get();
          return currentManagerId ? managers[currentManagerId] || null : null;
        },
        
        // Get manager statistics
        getManagerStats: () => {
          const filteredManagers = get().computed.getFilteredManagers();
          
          if (filteredManagers.length === 0) return null;
          
          const activeManagers = filteredManagers.filter(m => m.isActive).length;
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
            activeManagers,
            totalIntegrations,
            activeIntegrations,
            healthyIntegrations,
            totalAlerts
          };
        },
        
        // Get active alerts
        getActiveAlerts: () => {
          const filteredManagers = get().computed.getFilteredManagers();
          const allAlerts: IntegrationAlert[] = [];
          
          filteredManagers.forEach(manager => {
            manager.managerStatus.activeAlerts.forEach(alert => {
              if (alert.status === 'active') {
                allAlerts.push(alert);
              }
            });
          });
          
          return allAlerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
        }
      }
    }),
    {
      name: 'integration-manager-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        currentManagerId: state.currentManagerId,
        activeFilter: state.activeFilter,
        searchQuery: state.searchQuery,
        selectedManagerIds: state.selectedManagerIds,
        monitoringManagers: state.monitoringManagers,
        cacheExpiry: state.cacheExpiry
      })
    }
  )
);

// Initialize store
useIntegrationManagerStore.getState().actions.loadManagers();

export default useIntegrationManagerStore; 