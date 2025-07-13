// Block 91: Rebalance Simulation Engine - Hook
// React Integration for Portfolio Rebalancing

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RebalanceSimulationEngine } from '../engines/RebalanceSimulationEngine';
import {
  RebalanceSimulationEngine as IRebalanceSimulationEngine,
  RebalanceSimulation,
  RebalanceTemplate,
  SimulationResults,
  PortfolioSnapshot,
  TargetAllocation,
  UseRebalanceSimulationEngineReturn,
  SimulationStatus
} from '../types/rebalanceSimulationEngine';

export const useRebalanceSimulationEngine = (): UseRebalanceSimulationEngineReturn => {
  // Core state
  const [engines, setEngines] = useState<IRebalanceSimulationEngine[]>([]);
  const [currentEngine, setCurrentEngine] = useState<IRebalanceSimulationEngine | null>(null);
  const [simulations, setSimulations] = useState<RebalanceSimulation[]>([]);
  const [templates, setTemplates] = useState<RebalanceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation state
  const [runningSimulations, setRunningSimulations] = useState<Set<string>>(new Set());

  // Engine instance
  const engine = useMemo(() => RebalanceSimulationEngine.getInstance(), []);

  // Initialize data
  useEffect(() => {
    loadEngines();
    loadTemplates();
  }, []);

  // Auto-refresh for running simulations
  useEffect(() => {
    if (runningSimulations.size > 0) {
      const interval = setInterval(() => {
        refreshRunningSimulations();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [runningSimulations.size]);

  // Load all engines
  const loadEngines = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allEngines = engine.getEngines();
      setEngines(allEngines);

      // Set first engine as current if none selected
      if (!currentEngine && allEngines.length > 0) {
        setCurrentEngine(allEngines[0]);
        loadSimulations(allEngines[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load engines');
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentEngine]);

  // Load simulations for current engine
  const loadSimulations = useCallback(async (engineId?: string) => {
    try {
      const targetEngineId = engineId || currentEngine?.id;
      if (!targetEngineId) return;

      const engineSimulations = engine.getEngineSimulations(targetEngineId);
      setSimulations(engineSimulations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load simulations');
    }
  }, [engine, currentEngine]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const allTemplates = engine.getTemplates();
      setTemplates(allTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    }
  }, [engine]);

  // Create new engine
  const createEngine = useCallback(async (
    config: Omit<IRebalanceSimulationEngine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<IRebalanceSimulationEngine> => {
    try {
      setIsLoading(true);
      setError(null);

      const newEngine = engine.createEngine(config);

      // Update state
      setEngines(prev => [...prev, newEngine]);
      setCurrentEngine(newEngine);

      return newEngine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create engine';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  // Update engine
  const updateEngine = useCallback(async (
    id: string,
    updates: Partial<IRebalanceSimulationEngine>
  ): Promise<IRebalanceSimulationEngine> => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedEngine = engine.updateEngine(id, updates);

      // Update state
      setEngines(prev => prev.map(eng =>
        eng.id === id ? updatedEngine : eng
      ));

      // Update current engine if it's the one being updated
      if (currentEngine?.id === id) {
        setCurrentEngine(updatedEngine);
      }

      return updatedEngine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update engine';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentEngine]);

  // Delete engine
  const deleteEngine = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      engine.deleteEngine(id);

      // Update state
      setEngines(prev => prev.filter(eng => eng.id !== id));

      // Clear current engine if it was deleted
      if (currentEngine?.id === id) {
        const remainingEngines = engines.filter(eng => eng.id !== id);
        setCurrentEngine(remainingEngines.length > 0 ? remainingEngines[0] : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete engine';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentEngine, engines]);

  // Create simulation
  const createSimulation = useCallback(async (
    engineId: string,
    config: Omit<RebalanceSimulation, 'id' | 'engineId' | 'createdAt' | 'updatedAt'>
  ): Promise<RebalanceSimulation> => {
    try {
      setIsLoading(true);
      setError(null);

      const newSimulation = engine.createSimulation(engineId, config);

      // Update simulations if it's for the current engine
      if (engineId === currentEngine?.id) {
        setSimulations(prev => [...prev, newSimulation]);
      }

      return newSimulation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create simulation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentEngine]);

  // Run simulation
  const runSimulation = useCallback(async (simulationId: string): Promise<SimulationResults> => {
    try {
      setIsSimulating(true);
      setError(null);

      // Add to running simulations
      setRunningSimulations(prev => new Set(prev).add(simulationId));

      // Update simulation status in local state
      setSimulations(prev => prev.map(sim => {
        if (sim.id === simulationId) {
          return { ...sim, status: 'running' };
        }
        return sim;
      }));

      const results = await engine.runSimulation(simulationId);

      // Update simulation with results
      const updatedSimulation = engine.getSimulation(simulationId);
      if (updatedSimulation) {
        setSimulations(prev => prev.map(sim =>
          sim.id === simulationId ? updatedSimulation : sim
        ));
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run simulation';
      setError(errorMessage);

      // Update simulation status to failed
      setSimulations(prev => prev.map(sim => {
        if (sim.id === simulationId) {
          return { ...sim, status: 'failed' };
        }
        return sim;
      }));

      throw new Error(errorMessage);
    } finally {
      setIsSimulating(false);
      
      // Remove from running simulations
      setRunningSimulations(prev => {
        const updated = new Set(prev);
        updated.delete(simulationId);
        return updated;
      });
    }
  }, [engine]);

  // Cancel simulation
  const cancelSimulation = useCallback(async (simulationId: string): Promise<void> => {
    try {
      setError(null);

      engine.cancelSimulation(simulationId);

      // Remove from running simulations
      setRunningSimulations(prev => {
        const updated = new Set(prev);
        updated.delete(simulationId);
        return updated;
      });

      // Update simulation status
      setSimulations(prev => prev.map(sim => {
        if (sim.id === simulationId) {
          return { ...sim, status: 'cancelled' };
        }
        return sim;
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel simulation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  // Template operations
  const createTemplate = useCallback(async (
    template: Omit<RebalanceTemplate, 'templateId' | 'createdAt' | 'updatedAt'>
  ): Promise<RebalanceTemplate> => {
    try {
      setError(null);

      const newTemplate = engine.createTemplate(template);

      // Update templates
      setTemplates(prev => [...prev, newTemplate]);

      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const updateTemplate = useCallback(async (
    templateId: string,
    updates: Partial<RebalanceTemplate>
  ): Promise<RebalanceTemplate> => {
    try {
      setError(null);

      // Note: Template update method not implemented in engine
      // This is a placeholder for future implementation
      const existingTemplate = templates.find(t => t.templateId === templateId);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      const updatedTemplate = { ...existingTemplate, ...updates, updatedAt: new Date() };
      
      setTemplates(prev => prev.map(template =>
        template.templateId === templateId ? updatedTemplate : template
      ));

      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [templates]);

  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    try {
      setError(null);

      // Note: Template delete method not implemented in engine
      // This is a placeholder for future implementation
      setTemplates(prev => prev.filter(template => template.templateId !== templateId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Analysis operations
  const analyzePortfolio = useCallback(async (portfolioId: string): Promise<any> => {
    try {
      setError(null);

      // Mock portfolio analysis
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        portfolioId,
        totalValue: 50000,
        riskLevel: 'moderate',
        diversificationScore: 0.75,
        rebalanceNeeded: true,
        suggestedActions: [
          'Reduce overweight in technology sector',
          'Increase bond allocation',
          'Consider tax-loss harvesting'
        ],
        analysis: {
          assetAllocation: {
            equity: 85,
            bonds: 10,
            cash: 5
          },
          sectorAllocation: {
            technology: 35,
            healthcare: 20,
            financials: 15,
            other: 30
          },
          riskMetrics: {
            volatility: 15.2,
            sharpeRatio: 0.91,
            maxDrawdown: -12.3
          }
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze portfolio';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const compareAllocations = useCallback(async (
    current: TargetAllocation,
    target: TargetAllocation
  ): Promise<any> => {
    try {
      setError(null);

      // Mock allocation comparison
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        differences: {
          equity: target.assetClassTargets.find(t => t.assetClass === 'equity')?.targetWeight || 0 - 
                  current.assetClassTargets.find(t => t.assetClass === 'equity')?.targetWeight || 0,
          bonds: target.assetClassTargets.find(t => t.assetClass === 'bond')?.targetWeight || 0 - 
                 current.assetClassTargets.find(t => t.assetClass === 'bond')?.targetWeight || 0,
          cash: target.assetClassTargets.find(t => t.assetClass === 'cash')?.targetWeight || 0 - 
                current.assetClassTargets.find(t => t.assetClass === 'cash')?.targetWeight || 0
        },
        impact: {
          expectedReturn: 0.5,
          expectedRisk: -0.3,
          estimatedCost: 150
        },
        recommendations: [
          'Gradual rebalancing over 2-3 transactions',
          'Consider tax implications of large changes',
          'Monitor market conditions before execution'
        ]
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare allocations';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const optimizeAllocation = useCallback(async (constraints: any): Promise<TargetAllocation> => {
    try {
      setError(null);

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
          },
          {
            assetClass: 'bond',
            targetWeight: 25,
            tolerance: 5,
            minWeight: 15,
            maxWeight: 35,
            priority: 'medium',
            rebalanceThreshold: 3,
            expectedReturn: 4.2,
            expectedVolatility: 6.8
          },
          {
            assetClass: 'cash',
            targetWeight: 10,
            tolerance: 2,
            minWeight: 5,
            maxWeight: 15,
            priority: 'low',
            rebalanceThreshold: 1,
            expectedReturn: 2.5,
            expectedVolatility: 0.5
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize allocation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh running simulations
  const refreshRunningSimulations = useCallback(() => {
    const runningIds = Array.from(runningSimulations);
    
    runningIds.forEach(id => {
      const simulation = engine.getSimulation(id);
      if (simulation) {
        setSimulations(prev => prev.map(s => s.id === id ? simulation : s));
        
        // Remove from running set if completed or failed
        if (simulation.status === 'completed' || simulation.status === 'failed' || simulation.status === 'cancelled') {
          setRunningSimulations(prev => {
            const updated = new Set(prev);
            updated.delete(id);
            return updated;
          });
        }
      }
    });
  }, [runningSimulations, engine]);

  // Set current engine
  const setCurrentEngineCallback = useCallback((engineId: string | null) => {
    if (engineId) {
      const selectedEngine = engines.find(eng => eng.id === engineId);
      if (selectedEngine) {
        setCurrentEngine(selectedEngine);
        loadSimulations(engineId);
      }
    } else {
      setCurrentEngine(null);
      setSimulations([]);
    }
  }, [engines, loadSimulations]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadEngines(),
      loadTemplates()
    ]);
  }, [loadEngines, loadTemplates]);

  // Computed values
  const simulationStats = useMemo(() => {
    if (simulations.length === 0) return null;

    const completedSimulations = simulations.filter(s => s.status === 'completed').length;
    const runningSimulationsCount = simulations.filter(s => s.status === 'running').length;
    const failedSimulations = simulations.filter(s => s.status === 'failed').length;
    const pendingSimulations = simulations.filter(s => s.status === 'pending').length;

    const averageScore = simulations
      .filter(s => s.status === 'completed' && s.simulationResults)
      .reduce((sum, s) => sum + (s.simulationResults?.summary?.recommendationScore || 0), 0) / completedSimulations || 0;

    return {
      totalSimulations: simulations.length,
      completedSimulations,
      runningSimulations: runningSimulationsCount,
      failedSimulations,
      pendingSimulations,
      averageScore: Math.round(averageScore),
      successRate: completedSimulations / (completedSimulations + failedSimulations) || 0
    };
  }, [simulations]);

  // Filter simulations by status
  const getSimulationsByStatus = useCallback((status: SimulationStatus) => {
    return simulations.filter(simulation => simulation.status === status);
  }, [simulations]);

  // Get running simulations
  const getRunningSimulations = useCallback(() => {
    return simulations.filter(simulation => runningSimulations.has(simulation.id));
  }, [simulations, runningSimulations]);

  // Quick actions
  const quickActions = useMemo(() => ({
    // Run all pending simulations
    runAllPending: async () => {
      const pendingSimulations = simulations.filter(s => s.status === 'pending');
      for (const simulation of pendingSimulations) {
        try {
          await runSimulation(simulation.id);
        } catch (error) {
          console.error(`Failed to run simulation ${simulation.id}:`, error);
        }
      }
    },

    // Cancel all running simulations
    cancelAllRunning: async () => {
      const runningSimulationsList = Array.from(runningSimulations);
      for (const simulationId of runningSimulationsList) {
        try {
          await cancelSimulation(simulationId);
        } catch (error) {
          console.error(`Failed to cancel simulation ${simulationId}:`, error);
        }
      }
    },

    // Get best performing simulation
    getBestSimulation: () => {
      const completed = simulations.filter(s => s.status === 'completed' && s.simulationResults);
      return completed.reduce((best, current) => {
        const currentScore = current.simulationResults?.summary?.recommendationScore || 0;
        const bestScore = best?.simulationResults?.summary?.recommendationScore || 0;
        return currentScore > bestScore ? current : best;
      }, null);
    },

    // Get template usage statistics
    getTemplateUsage: () => {
      const usage = templates.reduce((acc, template) => {
        acc[template.templateName] = template.usageCount;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(usage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5 most used
    }
  }), [simulations, runningSimulations, templates, runSimulation, cancelSimulation]);

  return {
    // Data
    engines,
    currentEngine,
    simulations,

    // Loading states
    isLoading,
    isSimulating,

    // Engine operations
    createEngine,
    updateEngine,
    deleteEngine,

    // Simulation operations
    createSimulation,
    runSimulation,
    cancelSimulation,

    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,

    // Analysis operations
    analyzePortfolio,
    compareAllocations,
    optimizeAllocation,

    // Utility functions
    setCurrentEngine: setCurrentEngineCallback,
    refreshData,

    // Error handling
    error,
    clearError,

    // Additional computed values
    simulationStats,

    // Utility functions
    getSimulationsByStatus,
    getRunningSimulations,

    // Quick actions
    quickActions,

    // Status tracking
    runningSimulations: Array.from(runningSimulations),
    templates
  };
};

export default useRebalanceSimulationEngine; 