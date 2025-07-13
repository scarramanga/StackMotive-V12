// Block 91: Rebalance Simulation Engine - Store
// Zustand State Management for Portfolio Rebalancing

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RebalanceSimulationEngine } from '../engines/RebalanceSimulationEngine';
import {
  RebalanceSimulationEngine as IRebalanceSimulationEngine,
  RebalanceSimulation,
  RebalanceTemplate,
  RebalanceSimulationEngineState,
  SimulationResults,
  TargetAllocation,
  PortfolioSnapshot,
  SimulationStatus
} from '../types/rebalanceSimulationEngine';

interface RebalanceSimulationEngineStore extends RebalanceSimulationEngineState {
  // Engine reference
  engine: RebalanceSimulationEngine;
  
  // Actions
  actions: {
    // Engine operations
    createEngine: (config: Omit<IRebalanceSimulationEngine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<IRebalanceSimulationEngine>;
    updateEngine: (id: string, updates: Partial<IRebalanceSimulationEngine>) => Promise<IRebalanceSimulationEngine>;
    deleteEngine: (id: string) => Promise<void>;
    loadEngines: () => Promise<void>;
    
    // Simulation operations
    createSimulation: (engineId: string, config: Omit<RebalanceSimulation, 'id' | 'engineId' | 'createdAt' | 'updatedAt'>) => Promise<RebalanceSimulation>;
    runSimulation: (simulationId: string) => Promise<SimulationResults>;
    cancelSimulation: (simulationId: string) => Promise<void>;
    
    // Template operations
    createTemplate: (template: Omit<RebalanceTemplate, 'templateId' | 'createdAt' | 'updatedAt'>) => Promise<RebalanceTemplate>;
    loadTemplates: () => Promise<void>;
    
    // Analysis operations
    analyzePortfolio: (portfolioId: string) => Promise<any>;
    compareAllocations: (current: TargetAllocation, target: TargetAllocation) => Promise<any>;
    optimizeAllocation: (constraints: any) => Promise<TargetAllocation>;
    
    // Selection and UI state
    setCurrentEngine: (engineId: string | null) => void;
    toggleSimulationSelection: (simulationId: string) => void;
    clearSelection: () => void;
    
    // Simulation queue management
    addToQueue: (simulationId: string) => void;
    removeFromQueue: (simulationId: string) => void;
    processQueue: () => Promise<void>;
    
    // Cache management
    invalidateCache: (engineId?: string) => void;
    refreshData: () => Promise<void>;
    
    // Error handling
    setError: (key: string, error: string) => void;
    clearError: (key: string) => void;
    clearAllErrors: () => void;
  };
  
  // Computed values
  computed: {
    getCurrentEngine: () => IRebalanceSimulationEngine | null;
    getEngineSimulations: (engineId: string) => RebalanceSimulation[];
    getSimulationsByStatus: (status: SimulationStatus) => RebalanceSimulation[];
    getRunningSimulations: () => RebalanceSimulation[];
    getEngineStats: () => {
      totalEngines: number;
      activeEngines: number;
      totalSimulations: number;
      completedSimulations: number;
      runningSimulations: number;
      failedSimulations: number;
      averageSuccessRate: number;
    } | null;
    getTemplatesByUsage: () => RebalanceTemplate[];
  };
}

export const useRebalanceSimulationEngineStore = create<RebalanceSimulationEngineStore>()(
  persist(
    (set, get) => ({
      // Initial state
      engines: {},
      currentEngineId: null,
      activeSimulations: {},
      simulationQueue: [],
      selectedSimulationIds: [],
      lastUpdated: {},
      cacheExpiry: 10 * 60 * 1000, // 10 minutes
      errors: {},
      
      // Engine instance
      engine: RebalanceSimulationEngine.getInstance(),
      
      // Actions
      actions: {
        // Create new engine
        createEngine: async (config) => {
          const { engine } = get();
          
          try {
            const newEngine = engine.createEngine(config);
            
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
          const { engine } = get();
          
          try {
            const updatedEngine = engine.updateEngine(id, updates);
            
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
          const { engine } = get();
          
          try {
            engine.deleteEngine(id);
            
            set((state) => {
              const { [id]: deletedEngine, ...remainingEngines } = state.engines;
              const { [id]: deletedUpdate, ...remainingUpdates } = state.lastUpdated;
              const { [id]: deletedErrors, ...remainingErrors } = state.errors;
              
              // Remove associated simulations
              const updatedSimulations = Object.fromEntries(
                Object.entries(state.activeSimulations).filter(([, sim]) => sim.engineId !== id)
              );
              
              return {
                engines: remainingEngines,
                currentEngineId: state.currentEngineId === id ? null : state.currentEngineId,
                activeSimulations: updatedSimulations,
                selectedSimulationIds: state.selectedSimulationIds.filter(simId => 
                  updatedSimulations[simId]?.engineId !== id
                ),
                simulationQueue: state.simulationQueue.filter(simId => 
                  updatedSimulations[simId]?.engineId !== id
                ),
                lastUpdated: remainingUpdates,
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
          const { engine } = get();
          
          try {
            const engines = engine.getEngines();
            const engineDict = engines.reduce((acc, eng) => {
              acc[eng.id] = eng;
              return acc;
            }, {} as Record<string, IRebalanceSimulationEngine>);
            
            const now = new Date();
            const lastUpdated = engines.reduce((acc, eng) => {
              acc[eng.id] = now;
              return acc;
            }, {} as Record<string, Date>);
            
            // Load simulations for all engines
            const allSimulations: Record<string, RebalanceSimulation> = {};
            engines.forEach(eng => {
              const engineSimulations = engine.getEngineSimulations(eng.id);
              engineSimulations.forEach(sim => {
                allSimulations[sim.id] = sim;
              });
            });
            
            set((state) => ({
              engines: engineDict,
              activeSimulations: allSimulations,
              lastUpdated,
              currentEngineId: state.currentEngineId || (engines.length > 0 ? engines[0].id : null)
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load engines';
            get().actions.setError('load', errorMessage);
            throw error;
          }
        },
        
        // Create simulation
        createSimulation: async (engineId, config) => {
          const { engine } = get();
          
          try {
            const newSimulation = engine.createSimulation(engineId, config);
            
            set((state) => ({
              activeSimulations: {
                ...state.activeSimulations,
                [newSimulation.id]: newSimulation
              }
            }));
            
            return newSimulation;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create simulation';
            get().actions.setError(engineId, errorMessage);
            throw error;
          }
        },
        
        // Run simulation
        runSimulation: async (simulationId) => {
          const { engine } = get();
          
          try {
            // Update simulation status
            set((state) => ({
              activeSimulations: {
                ...state.activeSimulations,
                [simulationId]: {
                  ...state.activeSimulations[simulationId],
                  status: 'running'
                }
              }
            }));
            
            const results = await engine.runSimulation(simulationId);
            
            // Update simulation with results
            const updatedSimulation = engine.getSimulation(simulationId);
            if (updatedSimulation) {
              set((state) => ({
                activeSimulations: {
                  ...state.activeSimulations,
                  [simulationId]: updatedSimulation
                }
              }));
            }
            
            return results;
          } catch (error) {
            // Update simulation status to failed
            set((state) => ({
              activeSimulations: {
                ...state.activeSimulations,
                [simulationId]: {
                  ...state.activeSimulations[simulationId],
                  status: 'failed'
                }
              }
            }));
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to run simulation';
            get().actions.setError(simulationId, errorMessage);
            throw error;
          }
        },
        
        // Cancel simulation
        cancelSimulation: async (simulationId) => {
          const { engine } = get();
          
          try {
            engine.cancelSimulation(simulationId);
            
            // Update simulation status
            set((state) => ({
              activeSimulations: {
                ...state.activeSimulations,
                [simulationId]: {
                  ...state.activeSimulations[simulationId],
                  status: 'cancelled'
                }
              },
              simulationQueue: state.simulationQueue.filter(id => id !== simulationId)
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel simulation';
            get().actions.setError(simulationId, errorMessage);
            throw error;
          }
        },
        
        // Create template
        createTemplate: async (template) => {
          const { engine } = get();
          
          try {
            const newTemplate = engine.createTemplate(template);
            
            // Templates are managed by the engine, so no local state update needed
            // Could add local template caching in the future
            
            return newTemplate;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create template';
            get().actions.setError('template_create', errorMessage);
            throw error;
          }
        },
        
        // Load templates
        loadTemplates: async () => {
          const { engine } = get();
          
          try {
            // Templates are loaded directly from engine when needed
            // This is a placeholder for future template caching
            engine.getTemplates();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
            get().actions.setError('templates', errorMessage);
            throw error;
          }
        },
        
        // Analyze portfolio
        analyzePortfolio: async (portfolioId) => {
          try {
            // Mock portfolio analysis
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
              portfolioId,
              totalValue: 50000,
              riskLevel: 'moderate',
              diversificationScore: 0.75,
              rebalanceNeeded: true,
              analysis: {
                assetAllocation: { equity: 85, bonds: 10, cash: 5 },
                riskMetrics: { volatility: 15.2, sharpeRatio: 0.91, maxDrawdown: -12.3 }
              }
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to analyze portfolio';
            get().actions.setError('portfolio_analysis', errorMessage);
            throw error;
          }
        },
        
        // Compare allocations
        compareAllocations: async (current, target) => {
          try {
            // Mock allocation comparison
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return {
              differences: { equity: 5, bonds: -3, cash: -2 },
              impact: { expectedReturn: 0.5, expectedRisk: -0.3, estimatedCost: 150 },
              recommendations: ['Gradual rebalancing recommended']
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to compare allocations';
            get().actions.setError('allocation_comparison', errorMessage);
            throw error;
          }
        },
        
        // Optimize allocation
        optimizeAllocation: async (constraints) => {
          try {
            // Mock optimization
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            return {
              allocationId: `optimized_${Date.now()}`,
              allocationName: 'Optimized Allocation',
              assetClassTargets: [
                {
                  assetClass: 'equity',
                  targetWeight: 65,
                  tolerance: 5,
                  minWeight: 55,
                  maxWeight: 75,
                  priority: 'high',
                  rebalanceThreshold: 3,
                  expectedReturn: 9.5,
                  expectedVolatility: 18.2
                }
              ],
              sectorTargets: [],
              geographicTargets: [],
              holdingTargets: [],
              constraints: constraints || {},
              rebalanceRules: {
                rebalanceThreshold: 5,
                minimumRebalanceInterval: 30,
                maximumRebalanceInterval: 120,
                triggers: [],
                constraints: {},
                maxTransactionCost: 500,
                maxTransactionCostPercent: 1,
                taxAwareRebalancing: true,
                marketConditionRules: []
              },
              createdAt: new Date(),
              updatedAt: new Date()
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to optimize allocation';
            get().actions.setError('allocation_optimization', errorMessage);
            throw error;
          }
        },
        
        // Set current engine
        setCurrentEngine: (engineId) => {
          set({ currentEngineId: engineId });
        },
        
        // Toggle simulation selection
        toggleSimulationSelection: (simulationId) => {
          set((state) => ({
            selectedSimulationIds: state.selectedSimulationIds.includes(simulationId)
              ? state.selectedSimulationIds.filter(id => id !== simulationId)
              : [...state.selectedSimulationIds, simulationId]
          }));
        },
        
        // Clear selection
        clearSelection: () => {
          set({ selectedSimulationIds: [] });
        },
        
        // Add to queue
        addToQueue: (simulationId) => {
          set((state) => ({
            simulationQueue: [...state.simulationQueue, simulationId]
          }));
        },
        
        // Remove from queue
        removeFromQueue: (simulationId) => {
          set((state) => ({
            simulationQueue: state.simulationQueue.filter(id => id !== simulationId)
          }));
        },
        
        // Process queue
        processQueue: async () => {
          const { simulationQueue } = get();
          
          for (const simulationId of simulationQueue) {
            try {
              await get().actions.runSimulation(simulationId);
              get().actions.removeFromQueue(simulationId);
            } catch (error) {
              console.error(`Failed to process simulation ${simulationId}:`, error);
              get().actions.removeFromQueue(simulationId);
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
          await Promise.all([
            get().actions.loadEngines(),
            get().actions.loadTemplates()
          ]);
        },
        
        // Error handling
        setError: (key, error) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [key]: error
            }
          }));
        },
        
        clearError: (key) => {
          set((state) => {
            const { [key]: deleted, ...remaining } = state.errors;
            return { errors: remaining };
          });
        },
        
        clearAllErrors: () => {
          set({ errors: {} });
        }
      },
      
      // Computed values
      computed: {
        // Get current engine
        getCurrentEngine: () => {
          const { engines, currentEngineId } = get();
          return currentEngineId ? engines[currentEngineId] || null : null;
        },
        
        // Get engine simulations
        getEngineSimulations: (engineId) => {
          const { activeSimulations } = get();
          return Object.values(activeSimulations).filter(sim => sim.engineId === engineId);
        },
        
        // Get simulations by status
        getSimulationsByStatus: (status) => {
          const { activeSimulations } = get();
          return Object.values(activeSimulations).filter(sim => sim.status === status);
        },
        
        // Get running simulations
        getRunningSimulations: () => {
          const { activeSimulations } = get();
          return Object.values(activeSimulations).filter(sim => sim.status === 'running');
        },
        
        // Get engine statistics
        getEngineStats: () => {
          const { engines, activeSimulations } = get();
          const engineArray = Object.values(engines);
          const simulationArray = Object.values(activeSimulations);
          
          if (engineArray.length === 0) return null;
          
          const activeEngines = engineArray.filter(engine => engine.isActive).length;
          const completedSimulations = simulationArray.filter(sim => sim.status === 'completed').length;
          const runningSimulations = simulationArray.filter(sim => sim.status === 'running').length;
          const failedSimulations = simulationArray.filter(sim => sim.status === 'failed').length;
          
          const totalFinished = completedSimulations + failedSimulations;
          const averageSuccessRate = totalFinished > 0 ? completedSimulations / totalFinished : 0;
          
          return {
            totalEngines: engineArray.length,
            activeEngines,
            totalSimulations: simulationArray.length,
            completedSimulations,
            runningSimulations,
            failedSimulations,
            averageSuccessRate
          };
        },
        
        // Get templates by usage
        getTemplatesByUsage: () => {
          const { engine } = get();
          const templates = engine.getTemplates();
          return templates.sort((a, b) => b.usageCount - a.usageCount);
        }
      }
    }),
    {
      name: 'rebalance-simulation-engine-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        currentEngineId: state.currentEngineId,
        selectedSimulationIds: state.selectedSimulationIds,
        simulationQueue: state.simulationQueue,
        cacheExpiry: state.cacheExpiry
      })
    }
  )
);

// Initialize store
useRebalanceSimulationEngineStore.getState().actions.loadEngines();

export default useRebalanceSimulationEngineStore; 