// Block 78: Portfolio Sync Engine - Store
// Zustand State Management for Portfolio Synchronization

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PortfolioSyncEngineManager } from '../engines/PortfolioSyncEngine';
import {
  PortfolioSyncEngine,
  PortfolioSyncEngineState,
  SyncOperationRequest,
  SyncOperationResponse,
  BrokerConnection,
  SyncConflict,
  PortfolioSyncFilter,
  SyncStatusType,
  ConflictStrategy
} from '../types/portfolioSyncEngine';

interface PortfolioSyncEngineStore extends PortfolioSyncEngineState {
  // Engine reference
  manager: PortfolioSyncEngineManager;
  
  // Actions
  actions: {
    // Engine operations
    createEngine: (config: Omit<PortfolioSyncEngine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<PortfolioSyncEngine>;
    updateEngine: (id: string, updates: Partial<PortfolioSyncEngine>) => Promise<PortfolioSyncEngine>;
    deleteEngine: (id: string) => Promise<void>;
    loadEngines: () => Promise<void>;
    
    // Sync operations
    startSync: (request: SyncOperationRequest) => Promise<SyncOperationResponse>;
    pauseSync: (engineId: string) => Promise<void>;
    resumeSync: (engineId: string) => Promise<void>;
    cancelSync: (engineId: string) => Promise<void>;
    
    // Broker operations
    connectBroker: (engineId: string, brokerConfig: BrokerConnection) => Promise<BrokerConnection>;
    disconnectBroker: (engineId: string, brokerId: string) => Promise<void>;
    testBrokerConnection: (brokerId: string) => Promise<boolean>;
    
    // Conflict resolution
    resolveConflict: (conflictId: string, resolution: ConflictStrategy) => Promise<void>;
    addPendingConflict: (engineId: string, conflict: SyncConflict) => void;
    removePendingConflict: (engineId: string, conflictId: string) => void;
    
    // Selection and filtering
    setCurrentEngine: (engineId: string | null) => void;
    setFilter: (filter: PortfolioSyncFilter) => void;
    setSearchQuery: (query: string) => void;
    
    // UI state
    toggleEngineSelection: (engineId: string) => void;
    clearSelection: () => void;
    
    // Real-time monitoring
    startMonitoring: (engineId: string) => void;
    stopMonitoring: (engineId: string) => void;
    refreshMonitoredEngines: () => Promise<void>;
    
    // Cache management
    invalidateCache: (engineId?: string) => void;
    refreshData: () => Promise<void>;
    
    // Error handling
    setError: (engineId: string, error: string) => void;
    clearError: (engineId: string) => void;
    clearAllErrors: () => void;
  };
  
  // Computed values
  computed: {
    // Get filtered engines
    getFilteredEngines: () => PortfolioSyncEngine[];
    
    // Get current engine
    getCurrentEngine: () => PortfolioSyncEngine | null;
    
    // Get engines by status
    getEnginesByStatus: (status: SyncStatusType) => PortfolioSyncEngine[];
    
    // Get engines with issues
    getEnginesWithIssues: () => PortfolioSyncEngine[];
    
    // Get engine statistics
    getEngineStats: () => {
      totalEngines: number;
      activeEngines: number;
      syncingEngines: number;
      enginesWithIssues: number;
      totalBrokers: number;
      connectedBrokers: number;
      avgSyncRate: number;
    } | null;
    
    // Get monitoring status
    getMonitoringStatus: () => {
      isMonitoring: boolean;
      monitoredCount: number;
      monitoredEngines: string[];
    };
    
    // Get sync statistics
    getSyncStats: () => {
      totalSyncs: number;
      successfulSyncs: number;
      failedSyncs: number;
      successRate: number;
      totalRecords: number;
    };
  };
  
  // Subscriptions
  subscriptions: {
    // Subscribe to engine updates
    subscribeEngineUpdates: (engineId: string, callback: (engine: PortfolioSyncEngine) => void) => () => void;
    
    // Subscribe to sync status changes
    subscribeSyncStatus: (callback: (statuses: Record<string, SyncStatusType>) => void) => () => void;
    
    // Subscribe to conflict updates
    subscribeConflicts: (callback: (conflicts: SyncConflict[]) => void) => () => void;
  };
}

export const usePortfolioSyncEngineStore = create<PortfolioSyncEngineStore>()(
  persist(
    (set, get) => ({
      // Initial state
      engines: {},
      currentEngineId: null,
      activeFilter: {},
      searchQuery: '',
      selectedEngineIds: [],
      syncOperations: {},
      monitoringEngines: {},
      brokerConnections: {},
      pendingConflicts: {},
      lastUpdated: {},
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      errors: {},
      
      // Engine manager instance
      manager: PortfolioSyncEngineManager.getInstance(),
      
      // Actions
      actions: {
        // Create new engine
        createEngine: async (config) => {
          const { manager } = get();
          
          try {
            const newEngine = manager.createEngine(config);
            
            set((state) => ({
              engines: {
                ...state.engines,
                [newEngine.id]: newEngine
              },
              currentEngineId: newEngine.id,
              lastUpdated: {
                ...state.lastUpdated,
                [newEngine.id]: new Date()
              }
            }));
            
            return newEngine;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create engine';
            get().actions.setError('create', errorMessage);
            throw error;
          }
        },
        
        // Update engine
        updateEngine: async (id, updates) => {
          const { manager } = get();
          
          try {
            const updatedEngine = manager.updateEngine(id, updates);
            
            set((state) => ({
              engines: {
                ...state.engines,
                [id]: updatedEngine
              },
              lastUpdated: {
                ...state.lastUpdated,
                [id]: new Date()
              }
            }));
            
            return updatedEngine;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update engine';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Delete engine
        deleteEngine: async (id) => {
          const { manager } = get();
          
          try {
            manager.deleteEngine(id);
            
            set((state) => {
              const { [id]: deletedEngine, ...remainingEngines } = state.engines;
              const { [id]: deletedUpdate, ...remainingUpdates } = state.lastUpdated;
              const { [id]: deletedMonitoring, ...remainingMonitoring } = state.monitoringEngines;
              const { [id]: deletedConflicts, ...remainingConflicts } = state.pendingConflicts;
              const { [id]: deletedErrors, ...remainingErrors } = state.errors;
              
              return {
                engines: remainingEngines,
                currentEngineId: state.currentEngineId === id ? null : state.currentEngineId,
                selectedEngineIds: state.selectedEngineIds.filter(engineId => engineId !== id),
                lastUpdated: remainingUpdates,
                monitoringEngines: remainingMonitoring,
                pendingConflicts: remainingConflicts,
                errors: remainingErrors
              };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete engine';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Load all engines
        loadEngines: async () => {
          const { manager } = get();
          
          try {
            const engines = manager.getEngines();
            const engineDict = engines.reduce((acc, engine) => {
              acc[engine.id] = engine;
              return acc;
            }, {} as Record<string, PortfolioSyncEngine>);
            
            const now = new Date();
            const lastUpdated = engines.reduce((acc, engine) => {
              acc[engine.id] = now;
              return acc;
            }, {} as Record<string, Date>);
            
            set((state) => ({
              engines: engineDict,
              lastUpdated,
              currentEngineId: state.currentEngineId || (engines.length > 0 ? engines[0].id : null)
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load engines';
            get().actions.setError('load', errorMessage);
            throw error;
          }
        },
        
        // Start sync
        startSync: async (request) => {
          const { manager } = get();
          
          try {
            set((state) => ({
              syncOperations: {
                ...state.syncOperations,
                [request.engineId]: {
                  operationId: 'temp_' + Date.now(),
                  operationType: request.operationType,
                  startTime: new Date(),
                  estimatedCompletion: new Date(Date.now() + 300000), // 5 minutes
                  brokerId: '',
                  dataType: 'holdings',
                  totalRecords: 0,
                  processedRecords: 0,
                  failedRecords: 0,
                  status: 'syncing',
                  currentStep: 'Initializing sync...'
                }
              }
            }));
            
            const response = await manager.startSync(request);
            
            if (response.success && response.operationId) {
              set((state) => ({
                syncOperations: {
                  ...state.syncOperations,
                  [request.engineId]: {
                    ...state.syncOperations[request.engineId],
                    operationId: response.operationId!
                  }
                }
              }));
            }
            
            return response;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start sync';
            get().actions.setError(request.engineId, errorMessage);
            throw error;
          }
        },
        
        // Pause sync
        pauseSync: async (engineId) => {
          const { manager } = get();
          
          try {
            await manager.pauseSync(engineId);
            
            set((state) => ({
              syncOperations: {
                ...state.syncOperations,
                [engineId]: state.syncOperations[engineId] ? {
                  ...state.syncOperations[engineId],
                  status: 'paused'
                } : undefined
              }
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to pause sync';
            get().actions.setError(engineId, errorMessage);
            throw error;
          }
        },
        
        // Resume sync
        resumeSync: async (engineId) => {
          const { manager } = get();
          
          try {
            await manager.resumeSync(engineId);
            
            set((state) => ({
              syncOperations: {
                ...state.syncOperations,
                [engineId]: state.syncOperations[engineId] ? {
                  ...state.syncOperations[engineId],
                  status: 'syncing'
                } : undefined
              }
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to resume sync';
            get().actions.setError(engineId, errorMessage);
            throw error;
          }
        },
        
        // Cancel sync
        cancelSync: async (engineId) => {
          const { manager } = get();
          
          try {
            await manager.cancelSync(engineId);
            
            set((state) => {
              const { [engineId]: cancelledOperation, ...remainingOperations } = state.syncOperations;
              return {
                syncOperations: remainingOperations
              };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel sync';
            get().actions.setError(engineId, errorMessage);
            throw error;
          }
        },
        
        // Connect broker
        connectBroker: async (engineId, brokerConfig) => {
          const { manager } = get();
          
          try {
            const connectedBroker = await manager.connectBroker(engineId, brokerConfig);
            
            set((state) => ({
              engines: {
                ...state.engines,
                [engineId]: {
                  ...state.engines[engineId],
                  brokerConnections: [
                    ...state.engines[engineId].brokerConnections,
                    connectedBroker
                  ]
                }
              },
              brokerConnections: {
                ...state.brokerConnections,
                [connectedBroker.id]: connectedBroker
              },
              lastUpdated: {
                ...state.lastUpdated,
                [engineId]: new Date()
              }
            }));
            
            return connectedBroker;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect broker';
            get().actions.setError(engineId, errorMessage);
            throw error;
          }
        },
        
        // Disconnect broker
        disconnectBroker: async (engineId, brokerId) => {
          const { manager } = get();
          
          try {
            await manager.disconnectBroker(engineId, brokerId);
            
            set((state) => {
              const { [brokerId]: disconnectedBroker, ...remainingBrokers } = state.brokerConnections;
              
              return {
                engines: {
                  ...state.engines,
                  [engineId]: {
                    ...state.engines[engineId],
                    brokerConnections: state.engines[engineId].brokerConnections.filter(b => b.id !== brokerId)
                  }
                },
                brokerConnections: remainingBrokers,
                lastUpdated: {
                  ...state.lastUpdated,
                  [engineId]: new Date()
                }
              };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect broker';
            get().actions.setError(engineId, errorMessage);
            throw error;
          }
        },
        
        // Test broker connection
        testBrokerConnection: async (brokerId) => {
          const { manager, brokerConnections } = get();
          
          try {
            const broker = brokerConnections[brokerId];
            if (!broker) {
              throw new Error('Broker not found');
            }
            
            const result = await manager.testBrokerConnection(broker);
            return result.success;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to test broker connection';
            get().actions.setError(brokerId, errorMessage);
            return false;
          }
        },
        
        // Resolve conflict
        resolveConflict: async (conflictId, resolution) => {
          const { manager } = get();
          
          try {
            await manager.resolveConflict(conflictId, resolution);
            
            // Remove resolved conflict from all engines
            set((state) => {
              const updatedConflicts = { ...state.pendingConflicts };
              for (const [engineId, conflicts] of Object.entries(updatedConflicts)) {
                updatedConflicts[engineId] = conflicts.filter(c => c.conflictId !== conflictId);
              }
              return { pendingConflicts: updatedConflicts };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to resolve conflict';
            get().actions.setError('conflict', errorMessage);
            throw error;
          }
        },
        
        // Add pending conflict
        addPendingConflict: (engineId, conflict) => {
          set((state) => ({
            pendingConflicts: {
              ...state.pendingConflicts,
              [engineId]: [
                ...(state.pendingConflicts[engineId] || []),
                conflict
              ]
            }
          }));
        },
        
        // Remove pending conflict
        removePendingConflict: (engineId, conflictId) => {
          set((state) => ({
            pendingConflicts: {
              ...state.pendingConflicts,
              [engineId]: (state.pendingConflicts[engineId] || []).filter(c => c.conflictId !== conflictId)
            }
          }));
        },
        
        // Set current engine
        setCurrentEngine: (engineId) => {
          set({ currentEngineId: engineId });
        },
        
        // Set filter
        setFilter: (filter) => {
          set({ activeFilter: filter });
        },
        
        // Set search query
        setSearchQuery: (query) => {
          set({ searchQuery: query });
        },
        
        // Toggle engine selection
        toggleEngineSelection: (engineId) => {
          set((state) => ({
            selectedEngineIds: state.selectedEngineIds.includes(engineId)
              ? state.selectedEngineIds.filter(id => id !== engineId)
              : [...state.selectedEngineIds, engineId]
          }));
        },
        
        // Clear selection
        clearSelection: () => {
          set({ selectedEngineIds: [] });
        },
        
        // Start monitoring
        startMonitoring: (engineId) => {
          const { manager } = get();
          
          set((state) => ({
            monitoringEngines: {
              ...state.monitoringEngines,
              [engineId]: true
            }
          }));
          
          manager.startMonitoring(engineId);
        },
        
        // Stop monitoring
        stopMonitoring: (engineId) => {
          const { manager } = get();
          
          set((state) => ({
            monitoringEngines: {
              ...state.monitoringEngines,
              [engineId]: false
            }
          }));
          
          manager.stopMonitoring(engineId);
        },
        
        // Refresh monitored engines
        refreshMonitoredEngines: async () => {
          const { manager, monitoringEngines } = get();
          const activeMonitoring = Object.entries(monitoringEngines)
            .filter(([_, isMonitoring]) => isMonitoring)
            .map(([engineId]) => engineId);
          
          for (const engineId of activeMonitoring) {
            try {
              const engine = manager.getEngine(engineId);
              if (engine) {
                set((state) => ({
                  engines: {
                    ...state.engines,
                    [engineId]: engine
                  },
                  lastUpdated: {
                    ...state.lastUpdated,
                    [engineId]: new Date()
                  }
                }));
              }
            } catch (error) {
              console.error(`Failed to refresh engine ${engineId}:`, error);
            }
          }
        },
        
        // Cache management
        invalidateCache: (engineId) => {
          if (engineId) {
            set((state) => {
              const { [engineId]: deleted, ...remaining } = state.lastUpdated;
              return { lastUpdated: remaining };
            });
          } else {
            set({ lastUpdated: {} });
          }
        },
        
        // Refresh data
        refreshData: async () => {
          await get().actions.loadEngines();
        },
        
        // Error handling
        setError: (engineId, error) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [engineId]: error
            }
          }));
        },
        
        clearError: (engineId) => {
          set((state) => {
            const { [engineId]: deleted, ...remaining } = state.errors;
            return { errors: remaining };
          });
        },
        
        clearAllErrors: () => {
          set({ errors: {} });
        }
      },
      
      // Computed values
      computed: {
        // Get filtered engines
        getFilteredEngines: () => {
          const { engines, activeFilter, searchQuery, manager } = get();
          let filteredEngines = Object.values(engines);
          
          // Apply manager filtering
          if (Object.keys(activeFilter).length > 0) {
            filteredEngines = manager.filterEngines(filteredEngines, activeFilter);
          }
          
          // Apply search
          if (searchQuery.trim()) {
            const searchFilter = { searchTerm: searchQuery.trim() };
            filteredEngines = manager.filterEngines(filteredEngines, searchFilter);
          }
          
          return filteredEngines;
        },
        
        // Get current engine
        getCurrentEngine: () => {
          const { engines, currentEngineId } = get();
          return currentEngineId ? engines[currentEngineId] || null : null;
        },
        
        // Get engines by status
        getEnginesByStatus: (status) => {
          return get().computed.getFilteredEngines().filter(engine => engine.syncStatus.overallStatus === status);
        },
        
        // Get engines with issues
        getEnginesWithIssues: () => {
          return get().computed.getFilteredEngines().filter(engine => engine.syncStatus.activeIssues.length > 0);
        },
        
        // Get engine statistics
        getEngineStats: () => {
          const filteredEngines = get().computed.getFilteredEngines();
          
          if (filteredEngines.length === 0) return null;
          
          const activeEngines = filteredEngines.filter(e => e.isActive).length;
          const syncingEngines = filteredEngines.filter(e => e.syncStatus.overallStatus === 'syncing').length;
          const enginesWithIssues = filteredEngines.filter(e => e.syncStatus.activeIssues.length > 0).length;
          
          const totalBrokers = filteredEngines.reduce((sum, engine) => sum + engine.brokerConnections.length, 0);
          const connectedBrokers = filteredEngines.reduce((sum, engine) => 
            sum + engine.brokerConnections.filter(b => b.connectionStatus === 'connected').length, 0
          );
          
          const avgSyncRate = filteredEngines.reduce((sum, engine) => 
            sum + engine.performanceMetrics.syncSuccessRate, 0
          ) / filteredEngines.length;
          
          return {
            totalEngines: filteredEngines.length,
            activeEngines,
            syncingEngines,
            enginesWithIssues,
            totalBrokers,
            connectedBrokers,
            avgSyncRate
          };
        },
        
        // Get monitoring status
        getMonitoringStatus: () => {
          const { monitoringEngines } = get();
          const activeMonitoring = Object.entries(monitoringEngines)
            .filter(([_, isMonitoring]) => isMonitoring)
            .map(([engineId]) => engineId);
          
          return {
            isMonitoring: activeMonitoring.length > 0,
            monitoredCount: activeMonitoring.length,
            monitoredEngines: activeMonitoring
          };
        },
        
        // Get sync statistics
        getSyncStats: () => {
          const filteredEngines = get().computed.getFilteredEngines();
          
          const totalSyncs = filteredEngines.reduce((sum, engine) => 
            sum + engine.syncStatus.stats.totalSyncs, 0
          );
          const successfulSyncs = filteredEngines.reduce((sum, engine) => 
            sum + engine.syncStatus.stats.successfulSyncs, 0
          );
          const failedSyncs = filteredEngines.reduce((sum, engine) => 
            sum + engine.syncStatus.stats.failedSyncs, 0
          );
          const totalRecords = filteredEngines.reduce((sum, engine) => 
            sum + engine.syncStatus.stats.totalRecords, 0
          );
          
          return {
            totalSyncs,
            successfulSyncs,
            failedSyncs,
            successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
            totalRecords
          };
        }
      },
      
      // Subscriptions
      subscriptions: {
        // Subscribe to engine updates
        subscribeEngineUpdates: (engineId, callback) => {
          const interval = setInterval(() => {
            const engine = get().engines[engineId];
            if (engine) {
              callback(engine);
            }
          }, 1000);
          
          return () => clearInterval(interval);
        },
        
        // Subscribe to sync status changes
        subscribeSyncStatus: (callback) => {
          const interval = setInterval(() => {
            const engines = get().engines;
            const statuses = Object.keys(engines).reduce((acc, id) => {
              acc[id] = engines[id].syncStatus.overallStatus;
              return acc;
            }, {} as Record<string, SyncStatusType>);
            callback(statuses);
          }, 5000);
          
          return () => clearInterval(interval);
        },
        
        // Subscribe to conflict updates
        subscribeConflicts: (callback) => {
          const interval = setInterval(() => {
            const { pendingConflicts } = get();
            const allConflicts = Object.values(pendingConflicts).flat();
            callback(allConflicts);
          }, 10000);
          
          return () => clearInterval(interval);
        }
      }
    }),
    {
      name: 'portfolio-sync-engine-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        currentEngineId: state.currentEngineId,
        activeFilter: state.activeFilter,
        searchQuery: state.searchQuery,
        selectedEngineIds: state.selectedEngineIds,
        monitoringEngines: state.monitoringEngines,
        cacheExpiry: state.cacheExpiry
      })
    }
  )
);

// Auto-refresh setup for monitoring
let autoRefreshInterval: NodeJS.Timeout | null = null;

export const startAutoRefresh = (intervalMs: number = 30000) => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    const store = usePortfolioSyncEngineStore.getState();
    store.actions.refreshMonitoredEngines();
  }, intervalMs);
};

export const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
};

// Initialize store
usePortfolioSyncEngineStore.getState().actions.loadEngines();

export default usePortfolioSyncEngineStore; 