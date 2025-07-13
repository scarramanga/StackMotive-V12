// Block 76: Asset Class Allocation Ring - Store
// Smart Asset Class Allocation Ring with AU/NZ Tax Integration

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AssetClassAllocationRingEngine } from '../engines/AssetClassAllocationRingEngine';
import {
  AssetClassAllocationRing,
  AssetClassAllocationRingState,
  AssetClassAllocation,
  AllocationRingFilter,
  RingViewType,
  RingDragState,
  AllocationPerformance,
  AUNZTaxInsights,
  AllocationComplianceStatus,
  RebalancingSuggestion,
  ProposedChange,
  RingConfiguration
} from '../types/assetClassAllocationRing';

interface AssetClassAllocationRingStore extends AssetClassAllocationRingState {
  // Actions
  initializeStore: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Ring management
  setCurrentRing: (ring: AssetClassAllocationRing | null) => void;
  addRing: (ring: AssetClassAllocationRing) => void;
  updateRing: (id: string, updates: Partial<AssetClassAllocationRing>) => void;
  removeRing: (id: string) => void;
  selectRing: (id: string) => void;
  
  // Asset class management
  updateAssetClass: (ringId: string, assetClassId: string, updates: Partial<AssetClassAllocation>) => void;
  
  // Ring interaction state
  setHoveredSegment: (segmentId: string | null) => void;
  setSelectedSegment: (segmentId: string | null) => void;
  startDrag: (ringId: string, segmentId: string, startAngle: number) => void;
  updateDrag: (currentAngle: number, previewAllocations: AssetClassAllocation[]) => void;
  endDrag: () => void;
  
  // Filtering and search
  setRingFilter: (filter: AllocationRingFilter) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  
  // UI state
  setSelectedRingIds: (ids: string[]) => void;
  toggleRingSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Processing state
  setAnalyzingRing: (ringId: string, isAnalyzing: boolean) => void;
  setRebalancingRing: (ringId: string, isRebalancing: boolean) => void;
  
  // Performance data caching
  cachePerformanceData: (ringId: string, performance: AllocationPerformance) => void;
  cacheTaxInsights: (ringId: string, insights: AUNZTaxInsights) => void;
  cacheComplianceStatus: (ringId: string, status: AllocationComplianceStatus) => void;
  
  // Rebalancing suggestions
  updateSuggestions: (ringId: string, suggestions: RebalancingSuggestion[]) => void;
  acceptSuggestion: (ringId: string, suggestionId: string) => void;
  rejectSuggestion: (ringId: string, suggestionId: string) => void;
  
  // Ring configuration
  updateRingConfig: (ringId: string, config: Partial<RingConfiguration>) => void;
  setActiveView: (ringId: string, view: RingViewType) => void;
  
  // Error handling
  setError: (ringId: string, error: string) => void;
  clearError: (ringId: string) => void;
  clearAllErrors: () => void;
  
  // Cache management
  updateLastRefresh: (dataType: string) => void;
  isCacheExpired: (dataType: string) => boolean;
  setCacheExpiry: (minutes: number) => void;
  
  // Real-time subscriptions
  addSubscription: (ringId: string) => void;
  removeSubscription: (ringId: string) => void;
  clearAllSubscriptions: () => void;
  
  // Analytics and statistics
  getRingStats: () => {
    totalRings: number;
    averageAllocation: Record<string, number>;
    totalValue: number;
    rebalancingNeeded: number;
    complianceIssues: number;
  };
  
  getPerformanceStats: () => {
    averageReturn: number;
    averageVolatility: number;
    bestPerformer: string | null;
    worstPerformer: string | null;
    totalTaxDrag: number;
  };
  
  getTaxEfficiencyStats: () => {
    averageTaxEfficiency: number;
    frankingCreditUtilization: number; // AU
    fifThresholdUtilization: number; // NZ
    taxOptimizationOpportunities: number;
  };
}

export const useAssetClassAllocationRingStore = create<AssetClassAllocationRingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      rings: {},
      
      // Current ring
      currentRingId: null,
      
      // UI state
      activeFilter: {},
      searchQuery: '',
      selectedRingIds: [],
      
      // Ring interaction state
      hoveredSegment: null,
      selectedSegment: null,
      dragState: null,
      
      // Processing state
      analyzingRings: {},
      rebalancingRings: {},
      
      // Cache management
      lastUpdated: {},
      cacheExpiry: 5, // 5 minutes
      
      // Real-time subscriptions
      activeSubscriptions: {},
      
      // Error handling
      errors: {},
      
      // Actions
      initializeStore: async () => {
        const engine = AssetClassAllocationRingEngine.getInstance();
        
        try {
          // Load initial ring data
          const rings = engine.getRings();
          
          const ringMap: Record<string, AssetClassAllocationRing> = {};
          rings.forEach(ring => {
            ringMap[ring.id] = ring;
          });
          
          set({
            rings: ringMap,
            lastUpdated: {
              rings: new Date()
            }
          });
        } catch (error) {
          console.error('Failed to initialize ring store:', error);
          get().setError('store', 'Failed to initialize ring store');
        }
      },
      
      refreshData: async () => {
        const engine = AssetClassAllocationRingEngine.getInstance();
        
        try {
          // Check cache expiry
          const state = get();
          const needsRefresh = state.isCacheExpired('rings');
          
          if (needsRefresh) {
            const rings = engine.getRings();
            const ringMap: Record<string, AssetClassAllocationRing> = {};
            rings.forEach(ring => {
              ringMap[ring.id] = ring;
            });
            
            set(state => ({
              rings: ringMap,
              lastUpdated: { ...state.lastUpdated, rings: new Date() }
            }));
          }
        } catch (error) {
          console.error('Failed to refresh ring data:', error);
          get().setError('store', 'Failed to refresh ring data');
        }
      },
      
      // Ring management
      setCurrentRing: (ring: AssetClassAllocationRing | null) => {
        set({
          currentRingId: ring?.id || null
        });
      },
      
      addRing: (ring: AssetClassAllocationRing) => {
        set(state => ({
          rings: {
            ...state.rings,
            [ring.id]: ring
          }
        }));
      },
      
      updateRing: (id: string, updates: Partial<AssetClassAllocationRing>) => {
        set(state => ({
          rings: {
            ...state.rings,
            [id]: state.rings[id] ? { ...state.rings[id], ...updates } : state.rings[id]
          }
        }));
      },
      
      removeRing: (id: string) => {
        set(state => {
          const newRings = { ...state.rings };
          delete newRings[id];
          
          // Clear related state
          const newAnalyzingRings = { ...state.analyzingRings };
          delete newAnalyzingRings[id];
          
          const newRebalancingRings = { ...state.rebalancingRings };
          delete newRebalancingRings[id];
          
          const newActiveSubscriptions = { ...state.activeSubscriptions };
          delete newActiveSubscriptions[id];
          
          const newErrors = { ...state.errors };
          delete newErrors[id];
          
          return {
            rings: newRings,
            currentRingId: state.currentRingId === id ? null : state.currentRingId,
            selectedRingIds: state.selectedRingIds.filter(ringId => ringId !== id),
            analyzingRings: newAnalyzingRings,
            rebalancingRings: newRebalancingRings,
            activeSubscriptions: newActiveSubscriptions,
            errors: newErrors
          };
        });
      },
      
      selectRing: (id: string) => {
        const ring = get().rings[id];
        if (ring) {
          get().setCurrentRing(ring);
        }
      },
      
      // Asset class management
      updateAssetClass: (ringId: string, assetClassId: string, updates: Partial<AssetClassAllocation>) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          const updatedAssetClasses = ring.assetClasses.map(ac =>
            ac.id === assetClassId ? { ...ac, ...updates } : ac
          );
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                assetClasses: updatedAssetClasses,
                lastUpdated: new Date()
              }
            }
          };
        });
      },
      
      // Ring interaction state
      setHoveredSegment: (segmentId: string | null) => {
        set({ hoveredSegment: segmentId });
      },
      
      setSelectedSegment: (segmentId: string | null) => {
        set({ selectedSegment: segmentId });
      },
      
      startDrag: (ringId: string, segmentId: string, startAngle: number) => {
        const ring = get().rings[ringId];
        if (!ring) return;
        
        set({
          dragState: {
            ringId,
            segmentId,
            startAngle,
            currentAngle: startAngle,
            isDragging: true,
            previewAllocations: [...ring.assetClasses]
          }
        });
      },
      
      updateDrag: (currentAngle: number, previewAllocations: AssetClassAllocation[]) => {
        set(state => ({
          dragState: state.dragState ? {
            ...state.dragState,
            currentAngle,
            previewAllocations
          } : null
        }));
      },
      
      endDrag: () => {
        set({ dragState: null });
      },
      
      // Filtering and search
      setRingFilter: (filter: AllocationRingFilter) => {
        set({ activeFilter: filter });
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      clearFilters: () => {
        set({
          activeFilter: {},
          searchQuery: ''
        });
      },
      
      // UI state
      setSelectedRingIds: (ids: string[]) => {
        set({ selectedRingIds: ids });
      },
      
      toggleRingSelection: (id: string) => {
        set(state => ({
          selectedRingIds: state.selectedRingIds.includes(id)
            ? state.selectedRingIds.filter(ringId => ringId !== id)
            : [...state.selectedRingIds, id]
        }));
      },
      
      clearSelection: () => {
        set({ selectedRingIds: [] });
      },
      
      // Processing state
      setAnalyzingRing: (ringId: string, isAnalyzing: boolean) => {
        set(state => ({
          analyzingRings: {
            ...state.analyzingRings,
            [ringId]: isAnalyzing
          }
        }));
      },
      
      setRebalancingRing: (ringId: string, isRebalancing: boolean) => {
        set(state => ({
          rebalancingRings: {
            ...state.rebalancingRings,
            [ringId]: isRebalancing
          }
        }));
      },
      
      // Performance data caching
      cachePerformanceData: (ringId: string, performance: AllocationPerformance) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                allocationPerformance: performance
              }
            }
          };
        });
      },
      
      cacheTaxInsights: (ringId: string, insights: AUNZTaxInsights) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                taxInsights: insights
              }
            }
          };
        });
      },
      
      cacheComplianceStatus: (ringId: string, status: AllocationComplianceStatus) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                complianceStatus: status
              }
            }
          };
        });
      },
      
      // Rebalancing suggestions
      updateSuggestions: (ringId: string, suggestions: RebalancingSuggestion[]) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                rebalancingSuggestions: suggestions
              }
            }
          };
        });
      },
      
      acceptSuggestion: (ringId: string, suggestionId: string) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          const updatedSuggestions = ring.rebalancingSuggestions.map(suggestion =>
            suggestion.id === suggestionId
              ? { ...suggestion, isAccepted: true }
              : suggestion
          );
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                rebalancingSuggestions: updatedSuggestions
              }
            }
          };
        });
      },
      
      rejectSuggestion: (ringId: string, suggestionId: string) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          const updatedSuggestions = ring.rebalancingSuggestions.filter(
            suggestion => suggestion.id !== suggestionId
          );
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                rebalancingSuggestions: updatedSuggestions
              }
            }
          };
        });
      },
      
      // Ring configuration
      updateRingConfig: (ringId: string, config: Partial<RingConfiguration>) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                ringConfig: { ...ring.ringConfig, ...config }
              }
            }
          };
        });
      },
      
      setActiveView: (ringId: string, view: RingViewType) => {
        set(state => {
          const ring = state.rings[ringId];
          if (!ring) return state;
          
          return {
            rings: {
              ...state.rings,
              [ringId]: {
                ...ring,
                currentView: view
              }
            }
          };
        });
      },
      
      // Error handling
      setError: (ringId: string, error: string) => {
        set(state => ({
          errors: {
            ...state.errors,
            [ringId]: error
          }
        }));
      },
      
      clearError: (ringId: string) => {
        set(state => {
          const newErrors = { ...state.errors };
          delete newErrors[ringId];
          return { errors: newErrors };
        });
      },
      
      clearAllErrors: () => {
        set({ errors: {} });
      },
      
      // Cache management
      updateLastRefresh: (dataType: string) => {
        set(state => ({
          lastUpdated: {
            ...state.lastUpdated,
            [dataType]: new Date()
          }
        }));
      },
      
      isCacheExpired: (dataType: string) => {
        const state = get();
        const lastUpdate = state.lastUpdated[dataType];
        if (!lastUpdate) return true;
        
        const now = new Date();
        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        
        return diffMinutes > state.cacheExpiry;
      },
      
      setCacheExpiry: (minutes: number) => {
        set({ cacheExpiry: minutes });
      },
      
      // Real-time subscriptions
      addSubscription: (ringId: string) => {
        set(state => ({
          activeSubscriptions: {
            ...state.activeSubscriptions,
            [ringId]: true
          }
        }));
      },
      
      removeSubscription: (ringId: string) => {
        set(state => {
          const newSubscriptions = { ...state.activeSubscriptions };
          delete newSubscriptions[ringId];
          return { activeSubscriptions: newSubscriptions };
        });
      },
      
      clearAllSubscriptions: () => {
        set({ activeSubscriptions: {} });
      },
      
      // Analytics and statistics
      getRingStats: () => {
        const rings = Object.values(get().rings);
        
        // Calculate asset class averages
        const assetClassTotals: Record<string, number> = {};
        const assetClassCounts: Record<string, number> = {};
        
        rings.forEach(ring => {
          ring.assetClasses.forEach(ac => {
            assetClassTotals[ac.assetClass] = (assetClassTotals[ac.assetClass] || 0) + ac.currentPercentage;
            assetClassCounts[ac.assetClass] = (assetClassCounts[ac.assetClass] || 0) + 1;
          });
        });
        
        const averageAllocation: Record<string, number> = {};
        Object.keys(assetClassTotals).forEach(assetClass => {
          averageAllocation[assetClass] = assetClassTotals[assetClass] / assetClassCounts[assetClass];
        });
        
        return {
          totalRings: rings.length,
          averageAllocation,
          totalValue: rings.reduce((sum, ring) => sum + ring.portfolioValue, 0),
          rebalancingNeeded: rings.filter(ring => ring.rebalancingNeeded).length,
          complianceIssues: rings.filter(ring => ring.complianceStatus.overallStatus !== 'compliant').length
        };
      },
      
      getPerformanceStats: () => {
        const rings = Object.values(get().rings);
        
        if (rings.length === 0) {
          return {
            averageReturn: 0,
            averageVolatility: 0,
            bestPerformer: null,
            worstPerformer: null,
            totalTaxDrag: 0
          };
        }
        
        const returns = rings.map(ring => ring.allocationPerformance.overallPerformance.totalReturn);
        const volatilities = rings.map(ring => ring.allocationPerformance.overallPerformance.volatility);
        const taxDrags = rings.map(ring => ring.allocationPerformance.taxAdjustedPerformance.taxDrag);
        
        const averageReturn = returns.reduce((sum, ret) => sum + ret, 0) / rings.length;
        const averageVolatility = volatilities.reduce((sum, vol) => sum + vol, 0) / rings.length;
        const totalTaxDrag = taxDrags.reduce((sum, drag) => sum + drag, 0);
        
        // Find best and worst performers
        const bestIndex = returns.indexOf(Math.max(...returns));
        const worstIndex = returns.indexOf(Math.min(...returns));
        
        return {
          averageReturn,
          averageVolatility,
          bestPerformer: rings[bestIndex]?.ringName || null,
          worstPerformer: rings[worstIndex]?.ringName || null,
          totalTaxDrag
        };
      },
      
      getTaxEfficiencyStats: () => {
        const rings = Object.values(get().rings);
        
        if (rings.length === 0) {
          return {
            averageTaxEfficiency: 0,
            frankingCreditUtilization: 0,
            fifThresholdUtilization: 0,
            taxOptimizationOpportunities: 0
          };
        }
        
        const taxEfficiencies = rings.map(ring => ring.taxInsights.overallTaxEfficiency);
        const averageTaxEfficiency = taxEfficiencies.reduce((sum, eff) => sum + eff, 0) / rings.length;
        
        // AU specific - franking credit utilization
        const auRings = rings.filter(ring => ring.currency === 'AUD');
        const frankingCreditUtilization = auRings.length > 0
          ? auRings.reduce((sum, ring) => sum + (ring.taxInsights.auInsights?.totalFrankingYield || 0), 0) / auRings.length
          : 0;
        
        // NZ specific - FIF threshold utilization
        const nzRings = rings.filter(ring => ring.currency === 'NZD');
        const fifThresholdUtilization = nzRings.length > 0
          ? nzRings.reduce((sum, ring) => sum + (ring.taxInsights.nzInsights?.fifThresholdUtilization || 0), 0) / nzRings.length
          : 0;
        
        // Count optimization opportunities
        const taxOptimizationOpportunities = rings.reduce((sum, ring) => 
          sum + ring.taxInsights.taxOptimizationRecommendations.length, 0);
        
        return {
          averageTaxEfficiency,
          frankingCreditUtilization,
          fifThresholdUtilization,
          taxOptimizationOpportunities
        };
      }
    }),
    {
      name: 'asset-class-allocation-ring-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only essential state
        rings: state.rings,
        currentRingId: state.currentRingId,
        activeFilter: state.activeFilter,
        searchQuery: state.searchQuery,
        cacheExpiry: state.cacheExpiry,
        lastUpdated: state.lastUpdated
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize store after rehydration
        if (state) {
          // Auto-refresh data on store rehydration
          setTimeout(() => {
            state.refreshData();
          }, 100);
        }
      }
    }
  )
);

// Auto-refresh hook
let refreshInterval: NodeJS.Timeout | null = null;

export const startAutoRefresh = (intervalMs: number = 30000) => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    const store = useAssetClassAllocationRingStore.getState();
    store.refreshData();
  }, intervalMs);
};

export const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Selectors for computed state
export const useFilteredRings = () => {
  return useAssetClassAllocationRingStore((state) => {
    const rings = Object.values(state.rings);
    const engine = AssetClassAllocationRingEngine.getInstance();
    
    let filtered = rings;
    
    // Apply active filters
    if (Object.keys(state.activeFilter).length > 0) {
      filtered = engine.filterRings(filtered, state.activeFilter);
    }
    
    // Apply search query
    if (state.searchQuery) {
      const searchLower = state.searchQuery.toLowerCase();
      filtered = filtered.filter(ring => 
        ring.ringName.toLowerCase().includes(searchLower) ||
        ring.description?.toLowerCase().includes(searchLower) ||
        ring.assetClasses.some(ac => ac.assetClassName.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  });
};

export const useCurrentRing = () => {
  return useAssetClassAllocationRingStore((state) => {
    return state.currentRingId ? state.rings[state.currentRingId] : null;
  });
};

export const useRingProcessingState = (ringId: string) => {
  return useAssetClassAllocationRingStore((state) => ({
    isAnalyzing: state.analyzingRings[ringId] || false,
    isRebalancing: state.rebalancingRings[ringId] || false
  }));
};

export const useRingInteractionState = () => {
  return useAssetClassAllocationRingStore((state) => ({
    hoveredSegment: state.hoveredSegment,
    selectedSegment: state.selectedSegment,
    dragState: state.dragState
  }));
};

export const useRingErrors = (ringId: string) => {
  return useAssetClassAllocationRingStore((state) => {
    return state.errors[ringId] || null;
  });
};

export const useRingStats = () => {
  return useAssetClassAllocationRingStore((state) => state.getRingStats());
};

export const usePerformanceStats = () => {
  return useAssetClassAllocationRingStore((state) => state.getPerformanceStats());
};

export const useTaxEfficiencyStats = () => {
  return useAssetClassAllocationRingStore((state) => state.getTaxEfficiencyStats());
};

// High-performance selectors for specific ring data
export const useRingById = (ringId: string) => {
  return useAssetClassAllocationRingStore((state) => state.rings[ringId]);
};

export const useAssetClassesByRing = (ringId: string) => {
  return useAssetClassAllocationRingStore((state) => {
    const ring = state.rings[ringId];
    return ring ? ring.assetClasses : [];
  });
};

export const useRingTaxInsights = (ringId: string) => {
  return useAssetClassAllocationRingStore((state) => {
    const ring = state.rings[ringId];
    return ring ? ring.taxInsights : null;
  });
};

export const useRingRebalancingSuggestions = (ringId: string) => {
  return useAssetClassAllocationRingStore((state) => {
    const ring = state.rings[ringId];
    return ring ? ring.rebalancingSuggestions : [];
  });
};

// Initialize store on module load
if (typeof window !== 'undefined') {
  const store = useAssetClassAllocationRingStore.getState();
  store.initializeStore();
  
  // Start auto-refresh
  startAutoRefresh();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
  });
} 