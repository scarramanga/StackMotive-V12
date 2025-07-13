// Block 35: AI Override Explainer - Store
// Zustand store for AI override explainer management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AIOverrideExplainer,
  AIDecision,
  OverrideStatus,
  DecisionType,
  OverrideType
} from '../types/aiOverrideExplainer';

interface AIOverrideExplainerState {
  // Data
  aiDecisions: AIDecision[];
  overrides: AIOverrideExplainer[];
  
  // Selection
  selectedDecision: string | null;
  selectedOverride: string | null;
  
  // View state
  view: 'decisions' | 'overrides' | 'analytics' | 'explanations';
  
  // Filter state
  filter: {
    decisionType: DecisionType | 'all';
    overrideStatus: OverrideStatus | 'all';
    overrideType: OverrideType | 'all';
    timeRange: 'all' | 'today' | 'week' | 'month' | 'quarter';
    userId: string | 'all';
    search: string;
  };
  
  // Sort state
  sort: {
    field: 'createdAt' | 'confidence' | 'impact' | 'status';
    direction: 'asc' | 'desc';
  };
  
  // UI state
  showExplanations: boolean;
  expandedDecisions: string[];
  expandedOverrides: string[];
  
  // Settings
  settings: {
    autoExplain: boolean;
    showConfidenceScores: boolean;
    requireApproval: boolean;
    notifyOnOverride: boolean;
    explanationDepth: 'basic' | 'detailed' | 'expert';
  };
  
  // Actions
  setAIDecisions: (decisions: AIDecision[]) => void;
  addAIDecision: (decision: AIDecision) => void;
  updateAIDecision: (id: string, updates: Partial<AIDecision>) => void;
  removeAIDecision: (id: string) => void;
  
  setOverrides: (overrides: AIOverrideExplainer[]) => void;
  addOverride: (override: AIOverrideExplainer) => void;
  updateOverride: (id: string, updates: Partial<AIOverrideExplainer>) => void;
  removeOverride: (id: string) => void;
  
  setSelectedDecision: (id: string | null) => void;
  setSelectedOverride: (id: string | null) => void;
  
  setView: (view: 'decisions' | 'overrides' | 'analytics' | 'explanations') => void;
  setFilter: (filter: Partial<AIOverrideExplainerState['filter']>) => void;
  setSort: (sort: AIOverrideExplainerState['sort']) => void;
  
  setShowExplanations: (show: boolean) => void;
  toggleDecisionExpansion: (id: string) => void;
  toggleOverrideExpansion: (id: string) => void;
  
  setSettings: (settings: Partial<AIOverrideExplainerState['settings']>) => void;
  
  // Computed getters
  getAIDecision: (id: string) => AIDecision | undefined;
  getOverride: (id: string) => AIOverrideExplainer | undefined;
  getFilteredDecisions: () => AIDecision[];
  getFilteredOverrides: () => AIOverrideExplainer[];
  getSortedDecisions: () => AIDecision[];
  getSortedOverrides: () => AIOverrideExplainer[];
  getOverridesByDecision: (decisionId: string) => AIOverrideExplainer[];
  
  // Statistics
  getDecisionStats: () => {
    total: number;
    byType: Record<DecisionType, number>;
    averageConfidence: number;
    overrideRate: number;
  };
  
  getOverrideStats: () => {
    total: number;
    byStatus: Record<OverrideStatus, number>;
    byType: Record<OverrideType, number>;
    averageImpact: number;
    approvalRate: number;
  };
  
  // Utilities
  clearOldDecisions: (days: number) => void;
  exportData: () => string;
  importData: (data: string) => void;
}

export const useAIOverrideExplainerStore = create<AIOverrideExplainerState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial data
        aiDecisions: [],
        overrides: [],
        
        // Initial selection
        selectedDecision: null,
        selectedOverride: null,
        
        // Initial view state
        view: 'decisions',
        
        // Initial filter state
        filter: {
          decisionType: 'all',
          overrideStatus: 'all',
          overrideType: 'all',
          timeRange: 'all',
          userId: 'all',
          search: ''
        },
        
        // Initial sort state
        sort: {
          field: 'createdAt',
          direction: 'desc'
        },
        
        // Initial UI state
        showExplanations: true,
        expandedDecisions: [],
        expandedOverrides: [],
        
        // Initial settings
        settings: {
          autoExplain: true,
          showConfidenceScores: true,
          requireApproval: true,
          notifyOnOverride: true,
          explanationDepth: 'detailed'
        },
        
        // AI Decision actions
        setAIDecisions: (decisions) => set({ aiDecisions: decisions }),
        addAIDecision: (decision) => set((state) => ({ 
          aiDecisions: [...state.aiDecisions, decision] 
        })),
        updateAIDecision: (id, updates) => set((state) => ({
          aiDecisions: state.aiDecisions.map(d => 
            d.id === id ? { ...d, ...updates } : d
          )
        })),
        removeAIDecision: (id) => set((state) => ({
          aiDecisions: state.aiDecisions.filter(d => d.id !== id),
          selectedDecision: state.selectedDecision === id ? null : state.selectedDecision
        })),
        
        // Override actions
        setOverrides: (overrides) => set({ overrides }),
        addOverride: (override) => set((state) => ({ 
          overrides: [...state.overrides, override] 
        })),
        updateOverride: (id, updates) => set((state) => ({
          overrides: state.overrides.map(o => 
            o.id === id ? { ...o, ...updates } : o
          )
        })),
        removeOverride: (id) => set((state) => ({
          overrides: state.overrides.filter(o => o.id !== id),
          selectedOverride: state.selectedOverride === id ? null : state.selectedOverride
        })),
        
        // Selection actions
        setSelectedDecision: (id) => set({ selectedDecision: id }),
        setSelectedOverride: (id) => set({ selectedOverride: id }),
        
        // View actions
        setView: (view) => set({ view }),
        setFilter: (filter) => set((state) => ({
          filter: { ...state.filter, ...filter }
        })),
        setSort: (sort) => set({ sort }),
        
        // UI actions
        setShowExplanations: (show) => set({ showExplanations: show }),
        toggleDecisionExpansion: (id) => set((state) => ({
          expandedDecisions: state.expandedDecisions.includes(id)
            ? state.expandedDecisions.filter(eid => eid !== id)
            : [...state.expandedDecisions, id]
        })),
        toggleOverrideExpansion: (id) => set((state) => ({
          expandedOverrides: state.expandedOverrides.includes(id)
            ? state.expandedOverrides.filter(eid => eid !== id)
            : [...state.expandedOverrides, id]
        })),
        
        // Settings actions
        setSettings: (settings) => set((state) => ({
          settings: { ...state.settings, ...settings }
        })),
        
        // Computed getters
        getAIDecision: (id) => {
          const state = get();
          return state.aiDecisions.find(d => d.id === id);
        },
        
        getOverride: (id) => {
          const state = get();
          return state.overrides.find(o => o.id === id);
        },
        
        getFilteredDecisions: () => {
          const state = get();
          let filtered = state.aiDecisions;
          
          // Filter by decision type
          if (state.filter.decisionType !== 'all') {
            filtered = filtered.filter(d => d.type === state.filter.decisionType);
          }
          
          // Filter by time range
          if (state.filter.timeRange !== 'all') {
            const now = new Date();
            let cutoff: Date;
            
            switch (state.filter.timeRange) {
              case 'today':
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
              case 'week':
                cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
              case 'month':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
              case 'quarter':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
              default:
                cutoff = new Date(0);
            }
            
            filtered = filtered.filter(d => d.context.temporal.timestamp >= cutoff);
          }
          
          // Filter by search
          if (state.filter.search) {
            const search = state.filter.search.toLowerCase();
            filtered = filtered.filter(d => 
              d.id.toLowerCase().includes(search) ||
              d.decision.action.toLowerCase().includes(search) ||
              d.decision.reasoning.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getFilteredOverrides: () => {
          const state = get();
          let filtered = state.overrides;
          
          // Filter by status
          if (state.filter.overrideStatus !== 'all') {
            filtered = filtered.filter(o => o.status === state.filter.overrideStatus);
          }
          
          // Filter by type
          if (state.filter.overrideType !== 'all') {
            filtered = filtered.filter(o => o.override.type === state.filter.overrideType);
          }
          
          // Filter by user
          if (state.filter.userId !== 'all') {
            filtered = filtered.filter(o => o.userId === state.filter.userId);
          }
          
          // Filter by time range
          if (state.filter.timeRange !== 'all') {
            const now = new Date();
            let cutoff: Date;
            
            switch (state.filter.timeRange) {
              case 'today':
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
              case 'week':
                cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
              case 'month':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
              case 'quarter':
                cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
              default:
                cutoff = new Date(0);
            }
            
            filtered = filtered.filter(o => o.createdAt >= cutoff);
          }
          
          // Filter by search
          if (state.filter.search) {
            const search = state.filter.search.toLowerCase();
            filtered = filtered.filter(o => 
              o.id.toLowerCase().includes(search) ||
              o.override.action.toLowerCase().includes(search) ||
              o.override.justification.reason.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getSortedDecisions: () => {
          const state = get();
          const filtered = state.getFilteredDecisions();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.sort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'createdAt':
                aValue = a.context.temporal.timestamp;
                bValue = b.context.temporal.timestamp;
                break;
              case 'confidence':
                aValue = a.confidence;
                bValue = b.confidence;
                break;
              case 'impact':
                aValue = a.riskScore;
                bValue = b.riskScore;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getSortedOverrides: () => {
          const state = get();
          const filtered = state.getFilteredOverrides();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.sort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'createdAt':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
              case 'impact':
                aValue = a.override.impact.financial.netImpact;
                bValue = b.override.impact.financial.netImpact;
                break;
              case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getOverridesByDecision: (decisionId) => {
          const state = get();
          return state.overrides.filter(o => o.decisionId === decisionId);
        },
        
        // Statistics
        getDecisionStats: () => {
          const state = get();
          const decisions = state.aiDecisions;
          
          const stats = {
            total: decisions.length,
            byType: {} as Record<DecisionType, number>,
            averageConfidence: 0,
            overrideRate: 0
          };
          
          // Count by type
          decisions.forEach(decision => {
            stats.byType[decision.type] = (stats.byType[decision.type] || 0) + 1;
          });
          
          // Average confidence
          if (decisions.length > 0) {
            stats.averageConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
          }
          
          // Override rate
          const overriddenDecisions = decisions.filter(d => 
            state.overrides.some(o => o.decisionId === d.id)
          ).length;
          stats.overrideRate = decisions.length > 0 ? overriddenDecisions / decisions.length : 0;
          
          return stats;
        },
        
        getOverrideStats: () => {
          const state = get();
          const overrides = state.overrides;
          
          const stats = {
            total: overrides.length,
            byStatus: {} as Record<OverrideStatus, number>,
            byType: {} as Record<OverrideType, number>,
            averageImpact: 0,
            approvalRate: 0
          };
          
          // Count by status and type
          overrides.forEach(override => {
            stats.byStatus[override.status] = (stats.byStatus[override.status] || 0) + 1;
            stats.byType[override.override.type] = (stats.byType[override.override.type] || 0) + 1;
          });
          
          // Average impact
          if (overrides.length > 0) {
            stats.averageImpact = overrides.reduce((sum, o) => sum + o.override.impact.financial.netImpact, 0) / overrides.length;
          }
          
          // Approval rate
          const approvedOverrides = overrides.filter(o => o.status === 'approved' || o.status === 'active').length;
          stats.approvalRate = overrides.length > 0 ? approvedOverrides / overrides.length : 0;
          
          return stats;
        },
        
        // Utilities
        clearOldDecisions: (days) => set((state) => {
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          return {
            aiDecisions: state.aiDecisions.filter(d => d.context.temporal.timestamp >= cutoff)
          };
        }),
        
        exportData: () => {
          const state = get();
          return JSON.stringify({
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            aiDecisions: state.aiDecisions,
            overrides: state.overrides
          }, null, 2);
        },
        
        importData: (data) => {
          try {
            const imported = JSON.parse(data);
            if (imported.aiDecisions && imported.overrides) {
              set((state) => ({
                aiDecisions: [...state.aiDecisions, ...imported.aiDecisions],
                overrides: [...state.overrides, ...imported.overrides]
              }));
            }
          } catch (error) {
            console.error('Failed to import data:', error);
          }
        }
      }),
      {
        name: 'ai-override-explainer-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist UI preferences and settings only
          view: state.view,
          filter: state.filter,
          sort: state.sort,
          showExplanations: state.showExplanations,
          settings: state.settings
        }),
        version: 1
      }
    )
  )
);

// Selector hooks for specific data
export const useAIDecisionData = () => useAIOverrideExplainerStore(state => ({
  aiDecisions: state.aiDecisions,
  selectedDecision: state.selectedDecision,
  getAIDecision: state.getAIDecision,
  getSortedDecisions: state.getSortedDecisions
}));

export const useOverrideData = () => useAIOverrideExplainerStore(state => ({
  overrides: state.overrides,
  selectedOverride: state.selectedOverride,
  getOverride: state.getOverride,
  getSortedOverrides: state.getSortedOverrides
}));

export const useExplainerSettings = () => useAIOverrideExplainerStore(state => ({
  settings: state.settings,
  setSettings: state.setSettings,
  showExplanations: state.showExplanations,
  setShowExplanations: state.setShowExplanations
}));

export const useExplainerFilters = () => useAIOverrideExplainerStore(state => ({
  filter: state.filter,
  sort: state.sort,
  setFilter: state.setFilter,
  setSort: state.setSort
}));

export const useExplainerStats = () => useAIOverrideExplainerStore(state => ({
  getDecisionStats: state.getDecisionStats,
  getOverrideStats: state.getOverrideStats
})); 