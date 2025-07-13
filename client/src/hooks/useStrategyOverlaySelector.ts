// Block 25: Strategy Overlay Selector - Hook
// React hook for strategy overlay selection and management

import { useState, useEffect, useCallback } from 'react';
import { StrategyOverlaySelectorEngine } from '../engines/StrategyOverlaySelectorEngine';
import { useStrategyOverlaySelectorStore } from '../store/strategyOverlaySelectorStore';
import {
  StrategyOverlay,
  OverlaySelection,
  OverlayRecommendation,
  OverlayComparison,
  OverlaySimulation,
  OverlaySelector,
  SelectionCriteria,
  OverlayFilter,
  OverlaySorting,
  ComparisonCriteria,
  SimulationParameters,
  OverlayType,
  StrategyCategory,
  RiskLevel
} from '../types/strategyOverlaySelector';

export const useStrategyOverlaySelector = () => {
  const engine = StrategyOverlaySelectorEngine.getInstance();
  const store = useStrategyOverlaySelectorStore();

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Initialize store from engine
  useEffect(() => {
    const initializeStore = async () => {
      try {
        setLoading(true);
        
        // Load overlays
        const overlays = engine.getAllOverlays();
        store.setOverlays(overlays);

        // Load selectors
        const selectors = engine.getAllSelectors();
        store.setSelectors(selectors);

        // Load simulations
        const simulations = engine.getAllSimulations();
        store.setSimulations(simulations);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeStore();
  }, []);

  // Overlay Management
  const createOverlay = useCallback(async (
    overlay: Omit<StrategyOverlay, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed' | 'popularity'>
  ): Promise<StrategyOverlay> => {
    try {
      setLoading(true);
      setError(null);

      const newOverlay = engine.createOverlay(overlay);
      store.addOverlay(newOverlay);

      return newOverlay;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create overlay';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOverlay = useCallback(async (
    id: string,
    updates: Partial<StrategyOverlay>
  ): Promise<StrategyOverlay> => {
    try {
      setLoading(true);
      setError(null);

      const updatedOverlay = engine.updateOverlay(id, updates);
      store.updateOverlay(id, updatedOverlay);

      return updatedOverlay;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update overlay';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOverlay = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.deleteOverlay(id);
      if (success) {
        store.removeOverlay(id);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete overlay';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOverlaysByType = useCallback((type: OverlayType): StrategyOverlay[] => {
    return engine.getOverlaysByType(type);
  }, []);

  const getOverlaysByCategory = useCallback((category: StrategyCategory): StrategyOverlay[] => {
    return engine.getOverlaysByCategory(category);
  }, []);

  const getOverlaysByRiskLevel = useCallback((riskLevel: RiskLevel): StrategyOverlay[] => {
    return engine.getOverlaysByRiskLevel(riskLevel);
  }, []);

  // Selection Management
  const createSelection = useCallback(async (
    selection: Omit<OverlaySelection, 'id' | 'selectedAt'>
  ): Promise<OverlaySelection> => {
    try {
      setLoading(true);
      setError(null);

      const newSelection = engine.createSelection(selection);
      store.addSelection(newSelection);

      return newSelection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create selection';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSelection = useCallback(async (
    id: string,
    updates: Partial<OverlaySelection>
  ): Promise<OverlaySelection> => {
    try {
      setLoading(true);
      setError(null);

      const updatedSelection = engine.updateSelection(id, updates);
      store.updateSelection(id, updatedSelection);

      return updatedSelection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update selection';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSelection = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.deleteSelection(id);
      if (success) {
        store.removeSelection(id);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete selection';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSelectionsByStrategy = useCallback((strategyId: string): OverlaySelection[] => {
    return engine.getSelectionsByStrategy(strategyId);
  }, []);

  // Selector Management
  const createSelector = useCallback(async (
    selector: Omit<OverlaySelector, 'id' | 'createdAt' | 'updatedAt' | 'lastAnalysis'>
  ): Promise<OverlaySelector> => {
    try {
      setLoading(true);
      setError(null);

      const newSelector = engine.createSelector(selector);
      store.addSelector(newSelector);

      return newSelector;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create selector';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSelector = useCallback(async (
    id: string,
    updates: Partial<OverlaySelector>
  ): Promise<OverlaySelector> => {
    try {
      setLoading(true);
      setError(null);

      const updatedSelector = engine.updateSelector(id, updates);
      store.updateSelector(id, updatedSelector);

      return updatedSelector;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update selector';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtering and Sorting
  const filterOverlays = useCallback((
    overlays: StrategyOverlay[],
    filters: OverlayFilter[]
  ): StrategyOverlay[] => {
    return engine.filterOverlays(overlays, filters);
  }, []);

  const sortOverlays = useCallback((
    overlays: StrategyOverlay[],
    sorting: OverlaySorting
  ): StrategyOverlay[] => {
    return engine.sortOverlays(overlays, sorting);
  }, []);

  const applyFiltersAndSort = useCallback((
    overlays: StrategyOverlay[],
    filters: OverlayFilter[],
    sorting: OverlaySorting
  ): StrategyOverlay[] => {
    const filtered = filterOverlays(overlays, filters);
    return sortOverlays(filtered, sorting);
  }, [filterOverlays, sortOverlays]);

  // Recommendation Engine
  const generateRecommendations = useCallback(async (
    strategyId: string,
    criteria: SelectionCriteria,
    maxRecommendations: number = 5
  ): Promise<OverlayRecommendation[]> => {
    try {
      setAnalyzing(true);
      setError(null);

      const recommendations = await engine.generateRecommendations(strategyId, criteria, maxRecommendations);
      store.setRecommendations(strategyId, recommendations);

      return recommendations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const getRecommendations = useCallback((strategyId: string): OverlayRecommendation[] => {
    return engine.getRecommendations(strategyId);
  }, []);

  // Comparison Engine
  const compareOverlays = useCallback(async (
    overlayIds: string[],
    criteria: ComparisonCriteria
  ): Promise<OverlayComparison> => {
    try {
      setAnalyzing(true);
      setError(null);

      const comparison = await engine.compareOverlays(overlayIds, criteria);
      store.setComparison(comparison);

      return comparison;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare overlays';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Simulation Engine
  const runSimulation = useCallback(async (
    selections: OverlaySelection[],
    parameters: SimulationParameters
  ): Promise<OverlaySimulation> => {
    try {
      setSimulating(true);
      setError(null);

      const simulation = await engine.runSimulation(selections, parameters);
      store.addSimulation(simulation);

      return simulation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run simulation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSimulating(false);
    }
  }, []);

  const getSimulation = useCallback((id: string): OverlaySimulation | undefined => {
    return engine.getSimulation(id);
  }, []);

  // Analysis Functions
  const analyzeOverlayCompatibility = useCallback(async (
    overlayId: string,
    strategyId: string
  ): Promise<{
    compatible: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  }> => {
    try {
      setAnalyzing(true);
      setError(null);

      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1000));

      const overlay = engine.getOverlay(overlayId);
      if (!overlay) {
        throw new Error('Overlay not found');
      }

      const score = Math.random() * 0.4 + 0.6;
      const compatible = score > 0.7;

      return {
        compatible,
        score,
        issues: compatible ? [] : ['Risk level mismatch', 'Performance correlation'],
        recommendations: compatible 
          ? ['Consider implementing immediately'] 
          : ['Adjust parameters', 'Review risk tolerance']
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze compatibility';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const analyzeOverlayPerformance = useCallback(async (
    overlayId: string,
    timeframe: string = '1y'
  ): Promise<{
    performance: any;
    trends: string[];
    insights: string[];
  }> => {
    try {
      setAnalyzing(true);
      setError(null);

      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1500));

      const overlay = engine.getOverlay(overlayId);
      if (!overlay) {
        throw new Error('Overlay not found');
      }

      return {
        performance: overlay.performance,
        trends: ['Upward trend in returns', 'Decreasing volatility', 'Stable drawdown'],
        insights: ['Strong momentum factor', 'Good risk-adjusted returns', 'Consistent performance']
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze performance';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const optimizeOverlayParameters = useCallback(async (
    overlayId: string,
    strategyId: string,
    optimization: 'return' | 'risk' | 'sharpe' = 'sharpe'
  ): Promise<{
    optimizedParameters: any;
    expectedImprovement: number;
    reasoning: string[];
  }> => {
    try {
      setAnalyzing(true);
      setError(null);

      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 2000));

      const overlay = engine.getOverlay(overlayId);
      if (!overlay) {
        throw new Error('Overlay not found');
      }

      return {
        optimizedParameters: overlay.parameters,
        expectedImprovement: Math.random() * 0.1 + 0.05,
        reasoning: ['Improved risk-return profile', 'Better market timing', 'Reduced drawdown']
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize parameters';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Utility Functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const overlays = engine.getAllOverlays();
      store.setOverlays(overlays);

      const selectors = engine.getAllSelectors();
      store.setSelectors(selectors);

      const simulations = engine.getAllSimulations();
      store.setSimulations(simulations);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Store selectors
  const overlays = store.overlays;
  const selections = store.selections;
  const selectors = store.selectors;
  const simulations = store.simulations;
  const recommendations = store.recommendations;
  const comparison = store.comparison;
  const selectedOverlay = store.selectedOverlay;
  const selectedSelection = store.selectedSelection;
  const selectedSelector = store.selectedSelector;
  const selectedSimulation = store.selectedSimulation;

  // Filtered data
  const filteredOverlays = store.getFilteredOverlays();
  const sortedOverlays = store.getSortedOverlays();
  const activeSelections = selections.filter(s => s.isActive);
  const runningSimulations = simulations.filter(s => s.status === 'running');
  const completedSimulations = simulations.filter(s => s.status === 'completed');

  // Statistics
  const overlayStats = {
    total: overlays.length,
    active: overlays.filter(o => o.isActive).length,
    system: overlays.filter(o => o.isSystem).length,
    custom: overlays.filter(o => !o.isSystem).length,
    byType: overlays.reduce((acc, overlay) => {
      acc[overlay.type] = (acc[overlay.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCategory: overlays.reduce((acc, overlay) => {
      acc[overlay.category] = (acc[overlay.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return {
    // State
    loading,
    error,
    analyzing,
    simulating,
    
    // Data
    overlays,
    selections,
    selectors,
    simulations,
    recommendations,
    comparison,
    
    // Selected items
    selectedOverlay,
    selectedSelection,
    selectedSelector,
    selectedSimulation,
    
    // Filtered data
    filteredOverlays,
    sortedOverlays,
    activeSelections,
    runningSimulations,
    completedSimulations,
    
    // Statistics
    overlayStats,
    
    // Overlay actions
    createOverlay,
    updateOverlay,
    deleteOverlay,
    getOverlaysByType,
    getOverlaysByCategory,
    getOverlaysByRiskLevel,
    
    // Selection actions
    createSelection,
    updateSelection,
    deleteSelection,
    getSelectionsByStrategy,
    
    // Selector actions
    createSelector,
    updateSelector,
    
    // Filtering and sorting
    filterOverlays,
    sortOverlays,
    applyFiltersAndSort,
    
    // Recommendation engine
    generateRecommendations,
    getRecommendations,
    
    // Comparison engine
    compareOverlays,
    
    // Simulation engine
    runSimulation,
    getSimulation,
    
    // Analysis functions
    analyzeOverlayCompatibility,
    analyzeOverlayPerformance,
    optimizeOverlayParameters,
    
    // Utilities
    clearError,
    refreshData,
    
    // Store actions
    setSelectedOverlay: store.setSelectedOverlay,
    setSelectedSelection: store.setSelectedSelection,
    setSelectedSelector: store.setSelectedSelector,
    setSelectedSimulation: store.setSelectedSimulation,
    setFilters: store.setFilters,
    setSorting: store.setSorting,
    setView: store.setView
  };
};

// Specialized hooks for specific functionality
export const useOverlayManagement = () => {
  const {
    overlays,
    selectedOverlay,
    createOverlay,
    updateOverlay,
    deleteOverlay,
    getOverlaysByType,
    getOverlaysByCategory,
    getOverlaysByRiskLevel,
    setSelectedOverlay,
    loading,
    error,
    clearError
  } = useStrategyOverlaySelector();

  return {
    overlays,
    selectedOverlay,
    createOverlay,
    updateOverlay,
    deleteOverlay,
    getOverlaysByType,
    getOverlaysByCategory,
    getOverlaysByRiskLevel,
    setSelectedOverlay,
    loading,
    error,
    clearError
  };
};

export const useOverlayRecommendations = () => {
  const {
    recommendations,
    generateRecommendations,
    getRecommendations,
    analyzing,
    error,
    clearError
  } = useStrategyOverlaySelector();

  return {
    recommendations,
    generateRecommendations,
    getRecommendations,
    analyzing,
    error,
    clearError
  };
};

export const useOverlayComparison = () => {
  const {
    comparison,
    compareOverlays,
    analyzing,
    error,
    clearError
  } = useStrategyOverlaySelector();

  return {
    comparison,
    compareOverlays,
    analyzing,
    error,
    clearError
  };
};

export const useOverlaySimulation = () => {
  const {
    simulations,
    selectedSimulation,
    runSimulation,
    getSimulation,
    runningSimulations,
    completedSimulations,
    setSelectedSimulation,
    simulating,
    error,
    clearError
  } = useStrategyOverlaySelector();

  return {
    simulations,
    selectedSimulation,
    runSimulation,
    getSimulation,
    runningSimulations,
    completedSimulations,
    setSelectedSimulation,
    simulating,
    error,
    clearError
  };
};

export const useOverlayAnalysis = () => {
  const {
    analyzeOverlayCompatibility,
    analyzeOverlayPerformance,
    optimizeOverlayParameters,
    analyzing,
    error,
    clearError
  } = useStrategyOverlaySelector();

  return {
    analyzeOverlayCompatibility,
    analyzeOverlayPerformance,
    optimizeOverlayParameters,
    analyzing,
    error,
    clearError
  };
}; 