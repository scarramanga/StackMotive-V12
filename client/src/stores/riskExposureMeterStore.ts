// Block 77: Risk Exposure Meter - Store
// Zustand State Management for Risk Analytics

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RiskExposureMeterEngine } from '../engines/RiskExposureMeterEngine';
import {
  RiskExposureMeter,
  RiskExposureMeterState,
  RiskAlert,
  RiskMeterFilter,
  StressTestRequest,
  StressTestResponse,
  RiskThreshold,
  RiskComplianceStatus,
  PortfolioRiskMetrics,
  RiskLevel
} from '../types/riskExposureMeter';

interface RiskExposureMeterStore extends RiskExposureMeterState {
  // Engine reference
  engine: RiskExposureMeterEngine;
  
  // Actions
  actions: {
    // Meter operations
    createMeter: (config: Omit<RiskExposureMeter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<RiskExposureMeter>;
    updateMeter: (id: string, updates: Partial<RiskExposureMeter>) => Promise<RiskExposureMeter>;
    deleteMeter: (id: string) => Promise<void>;
    loadMeters: () => Promise<void>;
    
    // Risk calculations
    calculateRisk: (meterId: string) => Promise<PortfolioRiskMetrics>;
    runStressTest: (request: StressTestRequest) => Promise<StressTestResponse>;
    
    // Alert management
    getActiveAlerts: (meterId: string) => RiskAlert[];
    acknowledgeAlert: (alertId: string) => Promise<void>;
    resolveAlert: (alertId: string) => Promise<void>;
    
    // Threshold management
    updateThresholds: (meterId: string, thresholds: RiskThreshold[]) => Promise<void>;
    
    // Compliance monitoring
    checkCompliance: (meterId: string) => Promise<RiskComplianceStatus>;
    
    // Selection and filtering
    setCurrentMeter: (meterId: string | null) => void;
    setFilter: (filter: RiskMeterFilter) => void;
    setSearchQuery: (query: string) => void;
    
    // UI state
    toggleMeterSelection: (meterId: string) => void;
    clearSelection: () => void;
    
    // Real-time monitoring
    startMonitoring: (meterId: string) => void;
    stopMonitoring: (meterId: string) => void;
    refreshMonitoredMeters: () => Promise<void>;
    
    // Cache management
    invalidateCache: (meterId?: string) => void;
    refreshData: () => Promise<void>;
    
    // Error handling
    setError: (meterId: string, error: string) => void;
    clearError: (meterId: string) => void;
    clearAllErrors: () => void;
  };
  
  // Computed values
  computed: {
    // Get filtered meters
    getFilteredMeters: () => RiskExposureMeter[];
    
    // Get current meter
    getCurrentMeter: () => RiskExposureMeter | null;
    
    // Get meters by risk level
    getMetersByRiskLevel: (level: RiskLevel) => RiskExposureMeter[];
    
    // Get meters with alerts
    getMetersWithAlerts: () => RiskExposureMeter[];
    
    // Get compliance issues
    getComplianceIssues: () => RiskExposureMeter[];
    
    // Get risk statistics
    getRiskStats: () => {
      totalValue: number;
      avgRiskScore: number;
      riskLevelCounts: Record<RiskLevel, number>;
      activeAlertCount: number;
      meterCount: number;
    } | null;
    
    // Get monitoring status
    getMonitoringStatus: () => {
      isMonitoring: boolean;
      monitoredCount: number;
      monitoredMeters: string[];
    };
  };
  
  // Subscriptions
  subscriptions: {
    // Subscribe to meter updates
    subscribeMeterUpdates: (meterId: string, callback: (meter: RiskExposureMeter) => void) => () => void;
    
    // Subscribe to alerts
    subscribeAlerts: (callback: (alerts: RiskAlert[]) => void) => () => void;
    
    // Subscribe to compliance changes
    subscribeCompliance: (callback: (compliance: RiskComplianceStatus[]) => void) => () => void;
  };
}

export const useRiskExposureMeterStore = create<RiskExposureMeterStore>()(
  persist(
    (set, get) => ({
      // Initial state
      meters: {},
      currentMeterId: null,
      activeFilter: {},
      searchQuery: '',
      selectedMeterIds: [],
      calculatingMeters: {},
      stressTestingMeters: {},
      monitoringMeters: {},
      lastUpdated: {},
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      activeAlerts: {},
      acknowledgedAlerts: {},
      errors: {},
      
      // Engine instance
      engine: RiskExposureMeterEngine.getInstance(),
      
      // Actions
      actions: {
        // Create new meter
        createMeter: async (config) => {
          const { engine } = get();
          
          try {
            const newMeter = engine.createMeter(config);
            
            set((state) => ({
              meters: {
                ...state.meters,
                [newMeter.id]: newMeter
              },
              currentMeterId: newMeter.id,
              lastUpdated: {
                ...state.lastUpdated,
                [newMeter.id]: new Date()
              }
            }));
            
            return newMeter;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create meter';
            get().actions.setError('create', errorMessage);
            throw error;
          }
        },
        
        // Update meter
        updateMeter: async (id, updates) => {
          const { engine } = get();
          
          try {
            set((state) => ({
              calculatingMeters: {
                ...state.calculatingMeters,
                [id]: true
              }
            }));
            
            const updatedMeter = engine.updateMeter(id, updates);
            
            set((state) => ({
              meters: {
                ...state.meters,
                [id]: updatedMeter
              },
              lastUpdated: {
                ...state.lastUpdated,
                [id]: new Date()
              },
              calculatingMeters: {
                ...state.calculatingMeters,
                [id]: false
              }
            }));
            
            return updatedMeter;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update meter';
            get().actions.setError(id, errorMessage);
            
            set((state) => ({
              calculatingMeters: {
                ...state.calculatingMeters,
                [id]: false
              }
            }));
            
            throw error;
          }
        },
        
        // Delete meter
        deleteMeter: async (id) => {
          const { engine } = get();
          
          try {
            engine.deleteMeter(id);
            
            set((state) => {
              const { [id]: deletedMeter, ...remainingMeters } = state.meters;
              const { [id]: deletedUpdate, ...remainingUpdates } = state.lastUpdated;
              const { [id]: deletedCalc, ...remainingCalc } = state.calculatingMeters;
              const { [id]: deletedStress, ...remainingStress } = state.stressTestingMeters;
              const { [id]: deletedMonitoring, ...remainingMonitoring } = state.monitoringMeters;
              const { [id]: deletedAlerts, ...remainingAlerts } = state.activeAlerts;
              const { [id]: deletedAck, ...remainingAck } = state.acknowledgedAlerts;
              const { [id]: deletedErrors, ...remainingErrors } = state.errors;
              
              return {
                meters: remainingMeters,
                currentMeterId: state.currentMeterId === id ? null : state.currentMeterId,
                selectedMeterIds: state.selectedMeterIds.filter(meterId => meterId !== id),
                lastUpdated: remainingUpdates,
                calculatingMeters: remainingCalc,
                stressTestingMeters: remainingStress,
                monitoringMeters: remainingMonitoring,
                activeAlerts: remainingAlerts,
                acknowledgedAlerts: remainingAck,
                errors: remainingErrors
              };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete meter';
            get().actions.setError(id, errorMessage);
            throw error;
          }
        },
        
        // Load all meters
        loadMeters: async () => {
          const { engine } = get();
          
          try {
            const meters = engine.getMeters();
            const meterDict = meters.reduce((acc, meter) => {
              acc[meter.id] = meter;
              return acc;
            }, {} as Record<string, RiskExposureMeter>);
            
            const now = new Date();
            const lastUpdated = meters.reduce((acc, meter) => {
              acc[meter.id] = now;
              return acc;
            }, {} as Record<string, Date>);
            
            set((state) => ({
              meters: meterDict,
              lastUpdated,
              currentMeterId: state.currentMeterId || (meters.length > 0 ? meters[0].id : null)
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load meters';
            get().actions.setError('load', errorMessage);
            throw error;
          }
        },
        
        // Calculate risk for a meter
        calculateRisk: async (meterId) => {
          const { engine } = get();
          
          try {
            set((state) => ({
              calculatingMeters: {
                ...state.calculatingMeters,
                [meterId]: true
              }
            }));
            
            const meter = get().meters[meterId];
            if (!meter) {
              throw new Error('Meter not found');
            }
            
            const metrics = engine.calculateRiskMetrics(meter);
            
            set((state) => ({
              meters: {
                ...state.meters,
                [meterId]: {
                  ...state.meters[meterId],
                  riskMetrics: metrics,
                  lastCalculated: new Date()
                }
              },
              lastUpdated: {
                ...state.lastUpdated,
                [meterId]: new Date()
              },
              calculatingMeters: {
                ...state.calculatingMeters,
                [meterId]: false
              }
            }));
            
            return metrics;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to calculate risk';
            get().actions.setError(meterId, errorMessage);
            
            set((state) => ({
              calculatingMeters: {
                ...state.calculatingMeters,
                [meterId]: false
              }
            }));
            
            throw error;
          }
        },
        
        // Run stress test
        runStressTest: async (request) => {
          const { engine } = get();
          
          try {
            set((state) => ({
              stressTestingMeters: {
                ...state.stressTestingMeters,
                [request.meterId]: true
              }
            }));
            
            const response = engine.runStressTest(request);
            
            // Update meter with results
            if (response.success && response.results) {
              set((state) => ({
                meters: {
                  ...state.meters,
                  [request.meterId]: {
                    ...state.meters[request.meterId],
                    stressTestResults: [
                      ...state.meters[request.meterId].stressTestResults,
                      ...response.results!
                    ],
                    lastCalculated: new Date()
                  }
                },
                lastUpdated: {
                  ...state.lastUpdated,
                  [request.meterId]: new Date()
                },
                stressTestingMeters: {
                  ...state.stressTestingMeters,
                  [request.meterId]: false
                }
              }));
            }
            
            return response;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to run stress test';
            get().actions.setError(request.meterId, errorMessage);
            
            set((state) => ({
              stressTestingMeters: {
                ...state.stressTestingMeters,
                [request.meterId]: false
              }
            }));
            
            throw error;
          }
        },
        
        // Get active alerts
        getActiveAlerts: (meterId) => {
          const meter = get().meters[meterId];
          return meter?.riskAlerts.filter(alert => alert.status === 'active') || [];
        },
        
        // Acknowledge alert
        acknowledgeAlert: async (alertId) => {
          set((state) => {
            const updatedMeters = { ...state.meters };
            const updatedAcknowledged = { ...state.acknowledgedAlerts };
            
            for (const [meterId, meter] of Object.entries(updatedMeters)) {
              const alertIndex = meter.riskAlerts.findIndex(alert => alert.id === alertId);
              if (alertIndex >= 0) {
                updatedMeters[meterId] = {
                  ...meter,
                  riskAlerts: meter.riskAlerts.map(alert =>
                    alert.id === alertId
                      ? { ...alert, status: 'acknowledged' as const, acknowledgedAt: new Date() }
                      : alert
                  )
                };
                
                if (!updatedAcknowledged[meterId]) {
                  updatedAcknowledged[meterId] = [];
                }
                updatedAcknowledged[meterId].push(alertId);
                break;
              }
            }
            
            return {
              meters: updatedMeters,
              acknowledgedAlerts: updatedAcknowledged
            };
          });
        },
        
        // Resolve alert
        resolveAlert: async (alertId) => {
          set((state) => {
            const updatedMeters = { ...state.meters };
            
            for (const [meterId, meter] of Object.entries(updatedMeters)) {
              const alertIndex = meter.riskAlerts.findIndex(alert => alert.id === alertId);
              if (alertIndex >= 0) {
                updatedMeters[meterId] = {
                  ...meter,
                  riskAlerts: meter.riskAlerts.map(alert =>
                    alert.id === alertId
                      ? { ...alert, status: 'resolved' as const, resolvedAt: new Date() }
                      : alert
                  )
                };
                break;
              }
            }
            
            return { meters: updatedMeters };
          });
        },
        
        // Update thresholds
        updateThresholds: async (meterId, thresholds) => {
          await get().actions.updateMeter(meterId, { riskThresholds: thresholds });
          await get().actions.calculateRisk(meterId);
        },
        
        // Check compliance
        checkCompliance: async (meterId) => {
          const meter = get().meters[meterId];
          if (!meter) {
            throw new Error('Meter not found');
          }
          return meter.riskCompliance;
        },
        
        // Set current meter
        setCurrentMeter: (meterId) => {
          set({ currentMeterId: meterId });
        },
        
        // Set filter
        setFilter: (filter) => {
          set({ activeFilter: filter });
        },
        
        // Set search query
        setSearchQuery: (query) => {
          set({ searchQuery: query });
        },
        
        // Toggle meter selection
        toggleMeterSelection: (meterId) => {
          set((state) => ({
            selectedMeterIds: state.selectedMeterIds.includes(meterId)
              ? state.selectedMeterIds.filter(id => id !== meterId)
              : [...state.selectedMeterIds, meterId]
          }));
        },
        
        // Clear selection
        clearSelection: () => {
          set({ selectedMeterIds: [] });
        },
        
        // Start monitoring
        startMonitoring: (meterId) => {
          set((state) => ({
            monitoringMeters: {
              ...state.monitoringMeters,
              [meterId]: true
            }
          }));
        },
        
        // Stop monitoring
        stopMonitoring: (meterId) => {
          set((state) => ({
            monitoringMeters: {
              ...state.monitoringMeters,
              [meterId]: false
            }
          }));
        },
        
        // Refresh monitored meters
        refreshMonitoredMeters: async () => {
          const { monitoringMeters } = get();
          const activeMonitoring = Object.entries(monitoringMeters)
            .filter(([_, isMonitoring]) => isMonitoring)
            .map(([meterId]) => meterId);
          
          for (const meterId of activeMonitoring) {
            try {
              await get().actions.calculateRisk(meterId);
            } catch (error) {
              // Don't throw errors during background refresh
              console.error(`Failed to refresh meter ${meterId}:`, error);
            }
          }
        },
        
        // Cache management
        invalidateCache: (meterId) => {
          if (meterId) {
            set((state) => {
              const { [meterId]: deleted, ...remaining } = state.lastUpdated;
              return { lastUpdated: remaining };
            });
          } else {
            set({ lastUpdated: {} });
          }
        },
        
        // Refresh data
        refreshData: async () => {
          await get().actions.loadMeters();
        },
        
        // Error handling
        setError: (meterId, error) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [meterId]: error
            }
          }));
        },
        
        clearError: (meterId) => {
          set((state) => {
            const { [meterId]: deleted, ...remaining } = state.errors;
            return { errors: remaining };
          });
        },
        
        clearAllErrors: () => {
          set({ errors: {} });
        }
      },
      
      // Computed values
      computed: {
        // Get filtered meters
        getFilteredMeters: () => {
          const { meters, activeFilter, searchQuery, engine } = get();
          let filteredMeters = Object.values(meters);
          
          // Apply engine filtering
          if (Object.keys(activeFilter).length > 0) {
            filteredMeters = engine.filterMeters(filteredMeters, activeFilter);
          }
          
          // Apply search
          if (searchQuery.trim()) {
            const searchFilter = { searchTerm: searchQuery.trim() };
            filteredMeters = engine.filterMeters(filteredMeters, searchFilter);
          }
          
          return filteredMeters;
        },
        
        // Get current meter
        getCurrentMeter: () => {
          const { meters, currentMeterId } = get();
          return currentMeterId ? meters[currentMeterId] || null : null;
        },
        
        // Get meters by risk level
        getMetersByRiskLevel: (level) => {
          return get().computed.getFilteredMeters().filter(meter => meter.overallRiskLevel === level);
        },
        
        // Get meters with alerts
        getMetersWithAlerts: () => {
          return get().computed.getFilteredMeters().filter(meter => 
            meter.riskAlerts.some(alert => alert.status === 'active')
          );
        },
        
        // Get compliance issues
        getComplianceIssues: () => {
          return get().computed.getFilteredMeters().filter(meter => 
            meter.riskCompliance.overallStatus !== 'compliant'
          );
        },
        
        // Get risk statistics
        getRiskStats: () => {
          const filteredMeters = get().computed.getFilteredMeters();
          
          if (filteredMeters.length === 0) return null;
          
          const totalValue = filteredMeters.reduce((sum, meter) => sum + meter.portfolioValue, 0);
          const avgRiskScore = filteredMeters.reduce((sum, meter) => sum + meter.riskScore, 0) / filteredMeters.length;
          
          const riskLevelCounts = filteredMeters.reduce((counts, meter) => {
            counts[meter.overallRiskLevel] = (counts[meter.overallRiskLevel] || 0) + 1;
            return counts;
          }, {} as Record<RiskLevel, number>);
          
          const activeAlertCount = filteredMeters.reduce((count, meter) => {
            return count + meter.riskAlerts.filter(alert => alert.status === 'active').length;
          }, 0);
          
          return {
            totalValue,
            avgRiskScore,
            riskLevelCounts,
            activeAlertCount,
            meterCount: filteredMeters.length
          };
        },
        
        // Get monitoring status
        getMonitoringStatus: () => {
          const { monitoringMeters } = get();
          const activeMonitoring = Object.entries(monitoringMeters)
            .filter(([_, isMonitoring]) => isMonitoring)
            .map(([meterId]) => meterId);
          
          return {
            isMonitoring: activeMonitoring.length > 0,
            monitoredCount: activeMonitoring.length,
            monitoredMeters: activeMonitoring
          };
        }
      },
      
      // Subscriptions
      subscriptions: {
        // Subscribe to meter updates
        subscribeMeterUpdates: (meterId, callback) => {
          const interval = setInterval(() => {
            const meter = get().meters[meterId];
            if (meter) {
              callback(meter);
            }
          }, 1000);
          
          return () => clearInterval(interval);
        },
        
        // Subscribe to alerts
        subscribeAlerts: (callback) => {
          const interval = setInterval(() => {
            const allAlerts = Object.values(get().meters).flatMap(meter => 
              meter.riskAlerts.filter(alert => alert.status === 'active')
            );
            callback(allAlerts);
          }, 5000);
          
          return () => clearInterval(interval);
        },
        
        // Subscribe to compliance changes
        subscribeCompliance: (callback) => {
          const interval = setInterval(() => {
            const complianceStatuses = Object.values(get().meters).map(meter => meter.riskCompliance);
            callback(complianceStatuses);
          }, 10000);
          
          return () => clearInterval(interval);
        }
      }
    }),
    {
      name: 'risk-exposure-meter-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        currentMeterId: state.currentMeterId,
        activeFilter: state.activeFilter,
        searchQuery: state.searchQuery,
        selectedMeterIds: state.selectedMeterIds,
        monitoringMeters: state.monitoringMeters,
        acknowledgedAlerts: state.acknowledgedAlerts,
        cacheExpiry: state.cacheExpiry
      })
    }
  )
);

// Auto-refresh setup
let autoRefreshInterval: NodeJS.Timeout | null = null;

export const startAutoRefresh = (intervalMs: number = 30000) => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    const store = useRiskExposureMeterStore.getState();
    store.actions.refreshMonitoredMeters();
  }, intervalMs);
};

export const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
};

// Initialize store
useRiskExposureMeterStore.getState().actions.loadMeters();

export default useRiskExposureMeterStore; 