// Block 76: Asset Class Allocation Ring - Hook
// Smart Asset Class Allocation Ring with AU/NZ Tax Integration

import { useState, useEffect, useCallback, useRef } from 'react';
import { AssetClassAllocationRingEngine } from '../engines/AssetClassAllocationRingEngine';
import {
  AssetClassAllocationRing,
  AssetClassAllocation,
  UseAssetClassAllocationRingReturn,
  AllocationRingFilter,
  RebalanceAnalysisRequest,
  RebalanceAnalysisResponse,
  ProposedChange,
  TargetAllocation,
  AssetClassTarget,
  RingConfiguration,
  RingViewType,
  AllocationPerformance,
  AUNZTaxInsights,
  AllocationComplianceStatus,
  RebalancingSuggestion
} from '../types/assetClassAllocationRing';

export function useAssetClassAllocationRing(): UseAssetClassAllocationRingReturn {
  const engine = useRef(AssetClassAllocationRingEngine.getInstance()).current;
  
  // State management
  const [rings, setRings] = useState<AssetClassAllocationRing[]>([]);
  const [currentRing, setCurrentRing] = useState<AssetClassAllocationRing | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [ringFilter, setRingFilter] = useState<AllocationRingFilter>({});
  
  // Ring interaction state
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Auto-refresh for real-time updates
  const refreshInterval = useRef<NodeJS.Timeout>();

  // Load initial data
  useEffect(() => {
    loadRings();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    return () => {
      clearInterval(refreshInterval.current);
    };
  }, []);

  // Auto-refresh when rings are being processed
  useEffect(() => {
    const hasActiveProcessing = rings.some(r => 
      r.rebalancingNeeded || 
      r.complianceStatus.overallStatus !== 'compliant'
    );
    
    if (hasActiveProcessing) {
      startActiveMonitoring();
    }
  }, [rings]);

  // Data loading functions
  const loadRings = useCallback(async () => {
    try {
      setIsLoading(true);
      const ringList = engine.getRings();
      setRings(ringList);
      
      // Set current ring if none selected
      if (!currentRing && ringList.length > 0) {
        setCurrentRing(ringList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rings');
    } finally {
      setIsLoading(false);
    }
  }, [engine, currentRing]);

  // Ring operations
  const createRing = useCallback(async (config: Omit<AssetClassAllocationRing, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<AssetClassAllocationRing> => {
    try {
      setError(null);
      
      const newRing = engine.createRing(config);
      setRings(prev => [...prev, newRing]);
      setCurrentRing(newRing);
      
      return newRing;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create ring';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const updateRing = useCallback(async (id: string, updates: Partial<AssetClassAllocationRing>): Promise<AssetClassAllocationRing> => {
    try {
      setError(null);
      
      const updatedRing = engine.updateRing(id, updates);
      setRings(prev => prev.map(r => r.id === id ? updatedRing : r));
      
      if (currentRing?.id === id) {
        setCurrentRing(updatedRing);
      }
      
      return updatedRing;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ring';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentRing]);

  const deleteRing = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      engine.deleteRing(id);
      setRings(prev => prev.filter(r => r.id !== id));
      
      if (currentRing?.id === id) {
        const remainingRings = rings.filter(r => r.id !== id);
        setCurrentRing(remainingRings.length > 0 ? remainingRings[0] : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ring';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentRing, rings]);

  // Asset class operations
  const addAssetClass = useCallback(async (ringId: string, assetClass: Omit<AssetClassAllocation, 'id' | 'ringId' | 'createdAt'>): Promise<void> => {
    try {
      setError(null);
      
      engine.addAssetClass(ringId, assetClass as AssetClassAllocation);
      
      // Refresh the ring
      const updatedRing = engine.getRing(ringId);
      if (updatedRing) {
        setRings(prev => prev.map(r => r.id === ringId ? updatedRing : r));
        if (currentRing?.id === ringId) {
          setCurrentRing(updatedRing);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add asset class';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentRing]);

  const updateAssetClass = useCallback(async (ringId: string, assetClassId: string, updates: Partial<AssetClassAllocation>): Promise<void> => {
    try {
      setError(null);
      
      engine.updateAssetClass(ringId, assetClassId, updates);
      
      // Refresh the ring
      const updatedRing = engine.getRing(ringId);
      if (updatedRing) {
        setRings(prev => prev.map(r => r.id === ringId ? updatedRing : r));
        if (currentRing?.id === ringId) {
          setCurrentRing(updatedRing);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset class';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentRing]);

  const removeAssetClass = useCallback(async (ringId: string, assetClassId: string): Promise<void> => {
    try {
      setError(null);
      
      engine.removeAssetClass(ringId, assetClassId);
      
      // Refresh the ring
      const updatedRing = engine.getRing(ringId);
      if (updatedRing) {
        setRings(prev => prev.map(r => r.id === ringId ? updatedRing : r));
        if (currentRing?.id === ringId) {
          setCurrentRing(updatedRing);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove asset class';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine, currentRing]);

  // Target allocation management
  const setTargetAllocations = useCallback(async (ringId: string, targets: AssetClassTarget[]): Promise<void> => {
    try {
      setError(null);
      
      const ring = rings.find(r => r.id === ringId);
      if (!ring) throw new Error('Ring not found');
      
      // Create target allocation object
      const targetAllocation: TargetAllocation = {
        id: `target_${Date.now()}`,
        ringId,
        targetName: 'Default Target Allocation',
        description: 'Default target allocation settings',
        assetClassTargets: targets,
        strategy: {
          strategyType: 'moderate',
          strategyName: 'Balanced Growth',
          description: 'Balanced growth strategy',
          riskTolerance: 'moderate',
          timeHorizon: 'long',
          investmentGoals: ['wealth_building'],
          taxOptimization: {
            taxEfficiencyPriority: 'medium',
            harvestLosses: true,
            deferGains: true,
            useAccountTypes: {
              useSuper: true,
              useKiwiSaver: false,
              useTaxableAccounts: true,
              accountPriority: []
            }
          }
        },
        constraints: [],
        rebalancingTriggers: [],
        targetPerformance: {
          expectedReturn: 7,
          expectedVolatility: 12,
          sharpeRatio: 0.58,
          trackingError: 2,
          informationRatio: 0.3,
          expectedTaxDrag: 1.2,
          afterTaxReturn: 5.8,
          assetClassContribution: []
        },
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      };
      
      await updateRing(ringId, {
        targetAllocations: [targetAllocation]
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set target allocations';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [rings, updateRing]);

  const updateTargetAllocation = useCallback(async (ringId: string, targetId: string, updates: Partial<TargetAllocation>): Promise<void> => {
    try {
      setError(null);
      
      const ring = rings.find(r => r.id === ringId);
      if (!ring) throw new Error('Ring not found');
      
      const updatedTargets = ring.targetAllocations.map(target => 
        target.id === targetId ? { ...target, ...updates, lastModified: new Date() } : target
      );
      
      await updateRing(ringId, {
        targetAllocations: updatedTargets
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update target allocation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [rings, updateRing]);

  // Rebalancing operations
  const analyzeRebalancing = useCallback(async (request: RebalanceAnalysisRequest): Promise<RebalanceAnalysisResponse> => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const analysis = engine.analyzeRebalancing(request);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze rebalancing';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [engine]);

  const executeRebalancing = useCallback(async (ringId: string, changes: ProposedChange[]): Promise<void> => {
    try {
      setIsRebalancing(true);
      setError(null);
      
      // TODO: Implement actual rebalancing execution
      // This would typically involve:
      // 1. Validate changes
      // 2. Execute trades
      // 3. Update portfolio
      // 4. Refresh ring data
      
      // For now, simulate the execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh the ring after rebalancing
      const updatedRing = engine.getRing(ringId);
      if (updatedRing) {
        setRings(prev => prev.map(r => r.id === ringId ? updatedRing : r));
        if (currentRing?.id === ringId) {
          setCurrentRing(updatedRing);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute rebalancing';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsRebalancing(false);
    }
  }, [engine, currentRing]);

  const getSuggestions = useCallback(async (ringId: string): Promise<RebalancingSuggestion[]> => {
    try {
      setError(null);
      
      const ring = rings.find(r => r.id === ringId);
      if (!ring) throw new Error('Ring not found');
      
      return ring.rebalancingSuggestions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get suggestions';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [rings]);

  // Ring configuration
  const updateRingConfig = useCallback(async (ringId: string, config: Partial<RingConfiguration>): Promise<void> => {
    try {
      setError(null);
      
      const ring = rings.find(r => r.id === ringId);
      if (!ring) throw new Error('Ring not found');
      
      const updatedConfig = { ...ring.ringConfig, ...config };
      await updateRing(ringId, { ringConfig: updatedConfig });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ring configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [rings, updateRing]);

  const setActiveView = useCallback((ringId: string, view: RingViewType) => {
    const ring = rings.find(r => r.id === ringId);
    if (ring) {
      updateRing(ringId, { currentView: view });
    }
  }, [rings, updateRing]);

  const toggleLayer = useCallback((ringId: string, layerId: string) => {
    const ring = rings.find(r => r.id === ringId);
    if (!ring) return;
    
    const updatedLayers = ring.activeLayers.map(layer => 
      layer.layerId === layerId 
        ? { ...layer, isVisible: !layer.isVisible }
        : layer
    );
    
    updateRing(ringId, { activeLayers: updatedLayers });
  }, [rings, updateRing]);

  // Performance and analytics
  const getPerformanceAnalysis = useCallback(async (ringId: string, period?: string): Promise<AllocationPerformance> => {
    try {
      setError(null);
      
      const performance = engine.getPerformanceAnalysis(ringId);
      return performance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get performance analysis';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [engine]);

  const getTaxInsights = useCallback(async (ringId: string): Promise<AUNZTaxInsights> => {
    try {
      setError(null);
      
      const ring = rings.find(r => r.id === ringId);
      if (!ring) throw new Error('Ring not found');
      
      return ring.taxInsights;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get tax insights';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [rings]);

  const getComplianceStatus = useCallback(async (ringId: string): Promise<AllocationComplianceStatus> => {
    try {
      setError(null);
      
      const ring = rings.find(r => r.id === ringId);
      if (!ring) throw new Error('Ring not found');
      
      return ring.complianceStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get compliance status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [rings]);

  // Filtering and search
  const filterRings = useCallback((filter: AllocationRingFilter) => {
    setRingFilter(filter);
  }, []);

  const searchRings = useCallback((query: string) => {
    setRingFilter(prev => ({ ...prev, searchTerm: query }));
  }, []);

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Real-time updates
  const subscribeToUpdates = useCallback((ringId: string) => {
    // TODO: Implement real-time subscription logic
    console.log(`Subscribing to updates for ring ${ringId}`);
  }, []);

  const unsubscribeFromUpdates = useCallback((ringId: string) => {
    // TODO: Implement unsubscribe logic
    console.log(`Unsubscribing from updates for ring ${ringId}`);
  }, []);

  // Utility functions
  const setupAutoRefresh = useCallback(() => {
    refreshInterval.current = setInterval(async () => {
      // Auto-refresh rings every 30 seconds
      try {
        await loadRings();
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 30000);
  }, [loadRings]);

  const startActiveMonitoring = useCallback(() => {
    // More frequent updates when processing is active
    const activeInterval = setInterval(async () => {
      try {
        await loadRings();
      } catch (err) {
        console.error('Active monitoring failed:', err);
      }
    }, 5000); // Every 5 seconds

    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(activeInterval);
    }, 300000);
  }, [loadRings]);

  // Ring interaction handlers
  const handleSegmentHover = useCallback((segmentId: string | null) => {
    setHoveredSegment(segmentId);
  }, []);

  const handleSegmentClick = useCallback((segmentId: string | null) => {
    setSelectedSegment(segmentId);
  }, []);

  const handleDragStart = useCallback((segmentId: string) => {
    setIsDragging(true);
    setSelectedSegment(segmentId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Apply filters to data
  const filteredRings = engine.filterRings(rings, ringFilter);

  // Helper functions for ring management
  const createDefaultRing = useCallback(async (portfolioId: string, portfolioValue: number): Promise<AssetClassAllocationRing> => {
    const defaultConfig: Omit<AssetClassAllocationRing, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      ringName: 'My Portfolio Allocation',
      description: 'Default portfolio allocation ring',
      portfolioId,
      portfolioValue,
      currency: 'AUD',
      assetClasses: [],
      ringConfig: {
        innerRadius: 80,
        outerRadius: 160,
        padding: 2,
        colorScheme: 'tax_aware',
        animationDuration: 500,
        animationEasing: 'ease-out',
        enableAnimations: true,
        enableHover: true,
        enableClick: true,
        enableDragRebalance: true,
        layerConfiguration: [],
        showLabels: true,
        showPercentages: true,
        showValues: false,
        labelPosition: 'outside',
        responsiveBreakpoints: []
      },
      targetAllocations: [],
      rebalancingNeeded: false,
      rebalancingSuggestions: [],
      taxInsights: {
        overallTaxEfficiency: 0,
        taxDragEstimate: 0,
        generalInsights: [],
        taxOptimizationRecommendations: []
      },
      complianceStatus: {
        overallStatus: 'compliant',
        constraintCompliance: [],
        taxCompliance: {
          recordKeepingAdequate: true,
          taxReportingReady: true
        },
        activeIssues: [],
        warnings: [],
        lastComplianceCheck: new Date(),
        nextScheduledCheck: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      allocationPerformance: {
        overallPerformance: {
          totalReturn: 0,
          annualizedReturn: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          calmarRatio: 0,
          periodReturns: []
        },
        assetClassPerformance: [],
        performanceAttribution: {
          assetAllocationEffect: 0,
          securitySelectionEffect: 0,
          interactionEffect: 0,
          assetClassAttribution: []
        },
        benchmarkComparison: [],
        riskMetrics: {
          totalRisk: 0,
          systematicRisk: 0,
          idiosyncraticRisk: 0,
          assetClassRiskContribution: [],
          concentrationMetrics: {
            herfindahlIndex: 0,
            topHoldingsConcentration: 0,
            effectiveNHoldings: 0,
            maxSingleHoldingWeight: 0
          },
          stressTestResults: []
        },
        taxAdjustedPerformance: {
          preTaxReturn: 0,
          afterTaxReturn: 0,
          taxDrag: 0,
          taxOnIncome: 0,
          taxOnCapitalGains: 0,
          taxEfficiencyRatio: 0,
          taxAlpha: 0
        }
      },
      historicalDrift: [],
      activeLayers: [],
      currentView: 'simple',
      lastUpdated: new Date()
    };
    
    return createRing(defaultConfig);
  }, [createRing]);

  return {
    // Data
    rings: filteredRings,
    currentRing,
    
    // Loading states
    isLoading,
    isAnalyzing,
    isRebalancing,
    
    // Ring operations
    createRing,
    updateRing,
    deleteRing,
    
    // Asset class operations
    addAssetClass,
    updateAssetClass,
    removeAssetClass,
    
    // Target allocation management
    setTargetAllocations,
    updateTargetAllocation,
    
    // Rebalancing
    analyzeRebalancing,
    executeRebalancing,
    getSuggestions,
    
    // Ring configuration
    updateRingConfig,
    setActiveView,
    toggleLayer,
    
    // Performance and analytics
    getPerformanceAnalysis,
    getTaxInsights,
    getComplianceStatus,
    
    // Filtering and search
    filterRings,
    searchRings,
    
    // Error handling
    error,
    clearError,
    
    // Real-time updates
    subscribeToUpdates,
    unsubscribeFromUpdates,
    
    // Helper functions (not in interface but useful)
    createDefaultRing,
    handleSegmentHover,
    handleSegmentClick,
    handleDragStart,
    handleDragEnd,
    hoveredSegment,
    selectedSegment,
    isDragging,
    setCurrentRing
  };
} 