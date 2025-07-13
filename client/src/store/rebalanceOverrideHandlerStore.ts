// Block 36: Rebalance Override Handler - Store
// Zustand store for rebalance override handler management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  RebalanceOverrideHandler,
  RebalancePlan,
  OverrideStatus,
  ProcessingStage,
  OverrideType
} from '../types/rebalanceOverrideHandler';

interface RebalanceOverrideHandlerState {
  // Data
  handlers: RebalanceOverrideHandler[];
  plans: RebalancePlan[];
  
  // Selection
  selectedHandler: string | null;
  
  // View state
  view: 'list' | 'timeline' | 'kanban' | 'analytics';
  handlerView: 'summary' | 'detailed' | 'execution' | 'monitoring';
  
  // Filter state
  filter: {
    status: OverrideStatus | 'all';
    stage: ProcessingStage | 'all';
    type: OverrideType | 'all';
    timeRange: 'all' | 'today' | 'week' | 'month' | 'quarter';
    portfolio: string | 'all';
    userId: string | 'all';
    search: string;
    
    // Processing filters
    showExecuting: boolean;
    showPending: boolean;
    showCompleted: boolean;
    showFailed: boolean;
  };
  
  // Sort state
  sort: {
    field: 'createdAt' | 'status' | 'progress' | 'priority' | 'executedAt';
    direction: 'asc' | 'desc';
  };
  
  // Display settings
  displaySettings: {
    autoRefresh: boolean;
    refreshInterval: number;
    showProgress: boolean;
    showMetrics: boolean;
    groupByStatus: boolean;
    compactView: boolean;
    showTimestamps: boolean;
    showApprovals: boolean;
  };
  
  // Monitoring settings
  monitoringSettings: {
    enableNotifications: boolean;
    notificationThresholds: {
      executionTime: number;
      failureRate: number;
      queueLength: number;
      errorRate: number;
    };
    alertLevels: string[];
    realTimeUpdates: boolean;
  };
  
  // Actions
  setHandlers: (handlers: RebalanceOverrideHandler[]) => void;
  addHandler: (handler: RebalanceOverrideHandler) => void;
  updateHandler: (id: string, updates: Partial<RebalanceOverrideHandler>) => void;
  removeHandler: (id: string) => void;
  setSelectedHandler: (id: string | null) => void;
  
  setPlans: (plans: RebalancePlan[]) => void;
  addPlan: (plan: RebalancePlan) => void;
  updatePlan: (id: string, updates: Partial<RebalancePlan>) => void;
  removePlan: (id: string) => void;
  
  setView: (view: 'list' | 'timeline' | 'kanban' | 'analytics') => void;
  setHandlerView: (view: 'summary' | 'detailed' | 'execution' | 'monitoring') => void;
  setFilter: (filter: Partial<RebalanceOverrideHandlerState['filter']>) => void;
  setSort: (sort: RebalanceOverrideHandlerState['sort']) => void;
  setDisplaySettings: (settings: Partial<RebalanceOverrideHandlerState['displaySettings']>) => void;
  setMonitoringSettings: (settings: Partial<RebalanceOverrideHandlerState['monitoringSettings']>) => void;
  
  // Computed getters
  getHandler: (id: string) => RebalanceOverrideHandler | undefined;
  getHandlersByStatus: (status: OverrideStatus) => RebalanceOverrideHandler[];
  getHandlersByPortfolio: (portfolioId: string) => RebalanceOverrideHandler[];
  getFilteredHandlers: () => RebalanceOverrideHandler[];
  getSortedHandlers: () => RebalanceOverrideHandler[];
  getActiveHandlers: () => RebalanceOverrideHandler[];
  getPendingHandlers: () => RebalanceOverrideHandler[];
  getExecutingHandlers: () => RebalanceOverrideHandler[];
  getCompletedHandlers: () => RebalanceOverrideHandler[];
  getFailedHandlers: () => RebalanceOverrideHandler[];
  
  getPlan: (id: string) => RebalancePlan | undefined;
  
  // Analytics
  getHandlerStats: () => any;
  getPerformanceMetrics: () => any;
  
  // Utilities
  bulkUpdateHandlers: (updates: Array<{ id: string; updates: Partial<RebalanceOverrideHandler> }>) => void;
  clearCompletedHandlers: () => void;
  exportHandlers: () => string;
  importHandlers: (data: string) => void;
}

export const useRebalanceOverrideHandlerStore = create<RebalanceOverrideHandlerState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial data
        handlers: [],
        plans: [],
        
        // Initial selection
        selectedHandler: null,
        
        // Initial view state
        view: 'list',
        handlerView: 'summary',
        
        // Initial filter state
        filter: {
          status: 'all',
          stage: 'all',
          type: 'all',
          timeRange: 'all',
          portfolio: 'all',
          userId: 'all',
          search: '',
          showExecuting: true,
          showPending: true,
          showCompleted: true,
          showFailed: true
        },
        
        // Initial sort state
        sort: {
          field: 'createdAt',
          direction: 'desc'
        },
        
        // Initial display settings
        displaySettings: {
          autoRefresh: true,
          refreshInterval: 30000,
          showProgress: true,
          showMetrics: true,
          groupByStatus: false,
          compactView: false,
          showTimestamps: true,
          showApprovals: true
        },
        
        // Initial monitoring settings
        monitoringSettings: {
          enableNotifications: true,
          notificationThresholds: {
            executionTime: 300000, // 5 minutes
            failureRate: 0.1, // 10%
            queueLength: 10,
            errorRate: 0.05 // 5%
          },
          alertLevels: ['warning', 'error', 'critical'],
          realTimeUpdates: true
        },
        
        // Handler actions
        setHandlers: (handlers) => set({ handlers }),
        addHandler: (handler) => set((state) => ({ 
          handlers: [...state.handlers, handler] 
        })),
        updateHandler: (id, updates) => set((state) => ({
          handlers: state.handlers.map(h => 
            h.id === id ? { ...h, ...updates } : h
          )
        })),
        removeHandler: (id) => set((state) => ({
          handlers: state.handlers.filter(h => h.id !== id),
          selectedHandler: state.selectedHandler === id ? null : state.selectedHandler
        })),
        setSelectedHandler: (id) => set({ selectedHandler: id }),
        
        // Plan actions
        setPlans: (plans) => set({ plans }),
        addPlan: (plan) => set((state) => ({ 
          plans: [...state.plans, plan] 
        })),
        updatePlan: (id, updates) => set((state) => ({
          plans: state.plans.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        })),
        removePlan: (id) => set((state) => ({
          plans: state.plans.filter(p => p.id !== id)
        })),
        
        // View actions
        setView: (view) => set({ view }),
        setHandlerView: (handlerView) => set({ handlerView }),
        setFilter: (filter) => set((state) => ({
          filter: { ...state.filter, ...filter }
        })),
        setSort: (sort) => set({ sort }),
        setDisplaySettings: (settings) => set((state) => ({
          displaySettings: { ...state.displaySettings, ...settings }
        })),
        setMonitoringSettings: (settings) => set((state) => ({
          monitoringSettings: { ...state.monitoringSettings, ...settings }
        })),
        
        // Computed getters
        getHandler: (id) => {
          const state = get();
          return state.handlers.find(h => h.id === id);
        },
        
        getHandlersByStatus: (status) => {
          const state = get();
          return state.handlers.filter(h => h.status === status);
        },
        
        getHandlersByPortfolio: (portfolioId) => {
          const state = get();
          return state.handlers.filter(h => h.portfolioId === portfolioId);
        },
        
        getFilteredHandlers: () => {
          const state = get();
          let filtered = state.handlers;
          
          // Apply filters
          if (state.filter.status !== 'all') {
            filtered = filtered.filter(h => h.status === state.filter.status);
          }
          
          if (state.filter.stage !== 'all') {
            filtered = filtered.filter(h => h.processing.stage === state.filter.stage);
          }
          
          if (state.filter.type !== 'all') {
            filtered = filtered.filter(h => h.override.type === state.filter.type);
          }
          
          if (state.filter.portfolio !== 'all') {
            filtered = filtered.filter(h => h.portfolioId === state.filter.portfolio);
          }
          
          if (state.filter.userId !== 'all') {
            filtered = filtered.filter(h => h.userId === state.filter.userId);
          }
          
          // Time range filter
          if (state.filter.timeRange !== 'all') {
            const now = new Date();
            const timeRanges = {
              today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
              month: new Date(now.getFullYear(), now.getMonth(), 1),
              quarter: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
            };
            
            const cutoff = timeRanges[state.filter.timeRange as keyof typeof timeRanges];
            if (cutoff) {
              filtered = filtered.filter(h => h.createdAt >= cutoff);
            }
          }
          
          // Search filter
          if (state.filter.search) {
            const searchLower = state.filter.search.toLowerCase();
            filtered = filtered.filter(h => 
              h.id.toLowerCase().includes(searchLower) ||
              h.override.reason.toLowerCase().includes(searchLower) ||
              h.portfolioId.toLowerCase().includes(searchLower)
            );
          }
          
          // Status-specific filters
          if (!state.filter.showExecuting) {
            filtered = filtered.filter(h => h.status !== 'executing');
          }
          if (!state.filter.showPending) {
            filtered = filtered.filter(h => h.status !== 'pending');
          }
          if (!state.filter.showCompleted) {
            filtered = filtered.filter(h => h.status !== 'completed');
          }
          if (!state.filter.showFailed) {
            filtered = filtered.filter(h => h.status !== 'failed');
          }
          
          return filtered;
        },
        
        getSortedHandlers: () => {
          const state = get();
          const filtered = state.getFilteredHandlers();
          
          return filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (state.sort.field) {
              case 'createdAt':
                aValue = a.createdAt.getTime();
                bValue = b.createdAt.getTime();
                break;
              case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
              case 'progress':
                aValue = a.processing.progress;
                bValue = b.processing.progress;
                break;
              case 'executedAt':
                aValue = a.executedAt?.getTime() || 0;
                bValue = b.executedAt?.getTime() || 0;
                break;
              default:
                aValue = a.createdAt.getTime();
                bValue = b.createdAt.getTime();
            }
            
            if (state.sort.direction === 'asc') {
              return aValue > bValue ? 1 : -1;
            } else {
              return aValue < bValue ? 1 : -1;
            }
          });
        },
        
        getActiveHandlers: () => {
          const state = get();
          return state.handlers.filter(h => 
            h.status === 'executing' || h.status === 'pending' || h.status === 'approved'
          );
        },
        
        getPendingHandlers: () => {
          const state = get();
          return state.handlers.filter(h => h.status === 'pending');
        },
        
        getExecutingHandlers: () => {
          const state = get();
          return state.handlers.filter(h => h.status === 'executing');
        },
        
        getCompletedHandlers: () => {
          const state = get();
          return state.handlers.filter(h => h.status === 'completed');
        },
        
        getFailedHandlers: () => {
          const state = get();
          return state.handlers.filter(h => h.status === 'failed');
        },
        
        getPlan: (id) => {
          const state = get();
          return state.plans.find(p => p.id === id);
        },
        
        // Analytics
        getHandlerStats: () => {
          const state = get();
          const total = state.handlers.length;
          const completed = state.getCompletedHandlers().length;
          const failed = state.getFailedHandlers().length;
          const pending = state.getPendingHandlers().length;
          const executing = state.getExecutingHandlers().length;
          
          return {
            total,
            completed,
            failed,
            pending,
            executing,
            successRate: total > 0 ? (completed / total) * 100 : 0,
            failureRate: total > 0 ? (failed / total) * 100 : 0,
            completionRate: total > 0 ? ((completed + failed) / total) * 100 : 0
          };
        },
        
        getPerformanceMetrics: () => {
          const state = get();
          const completedHandlers = state.getCompletedHandlers();
          
          if (completedHandlers.length === 0) {
            return {
              averageExecutionTime: 0,
              averageQueueTime: 0,
              throughput: 0,
              efficiency: 0
            };
          }
          
          const executionTimes = completedHandlers
            .filter(h => h.executedAt && h.completedAt)
            .map(h => h.completedAt!.getTime() - h.executedAt!.getTime());
          
          const queueTimes = completedHandlers
            .filter(h => h.executedAt)
            .map(h => h.executedAt!.getTime() - h.createdAt.getTime());
          
          return {
            averageExecutionTime: executionTimes.length > 0 
              ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
              : 0,
            averageQueueTime: queueTimes.length > 0 
              ? queueTimes.reduce((a, b) => a + b, 0) / queueTimes.length 
              : 0,
            throughput: completedHandlers.length,
            efficiency: completedHandlers.length > 0 
              ? (completedHandlers.filter(h => h.results.success).length / completedHandlers.length) * 100
              : 0
          };
        },
        
        // Utilities
        bulkUpdateHandlers: (updates) => set((state) => ({
          handlers: state.handlers.map(h => {
            const update = updates.find(u => u.id === h.id);
            return update ? { ...h, ...update.updates } : h;
          })
        })),
        
        clearCompletedHandlers: () => set((state) => ({
          handlers: state.handlers.filter(h => h.status !== 'completed'),
          selectedHandler: state.handlers.find(h => h.id === state.selectedHandler)?.status === 'completed' 
            ? null 
            : state.selectedHandler
        })),
        
        exportHandlers: () => {
          const state = get();
          return JSON.stringify({
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            handlers: state.handlers,
            plans: state.plans
          }, null, 2);
        },
        
        importHandlers: (data) => {
          try {
            const imported = JSON.parse(data);
            if (imported.handlers && Array.isArray(imported.handlers)) {
              set((state) => ({
                handlers: [...state.handlers, ...imported.handlers]
              }));
            }
            if (imported.plans && Array.isArray(imported.plans)) {
              set((state) => ({
                plans: [...state.plans, ...imported.plans]
              }));
            }
          } catch (error) {
            console.error('Failed to import handlers:', error);
          }
        }
      }),
      {
        name: 'rebalance-override-handler-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist UI preferences and settings only
          view: state.view,
          handlerView: state.handlerView,
          filter: state.filter,
          sort: state.sort,
          displaySettings: state.displaySettings,
          monitoringSettings: state.monitoringSettings
        }),
        version: 1
      }
    )
  )
);

// Selector hooks for specific data
export const useHandlerData = () => useRebalanceOverrideHandlerStore(state => ({
  handlers: state.handlers,
  selectedHandler: state.selectedHandler,
  getHandler: state.getHandler,
  setSelectedHandler: state.setSelectedHandler
}));

export const useHandlerFilters = () => useRebalanceOverrideHandlerStore(state => ({
  filter: state.filter,
  sort: state.sort,
  setFilter: state.setFilter,
  setSort: state.setSort,
  getFilteredHandlers: state.getFilteredHandlers,
  getSortedHandlers: state.getSortedHandlers
}));

export const useHandlerStats = () => useRebalanceOverrideHandlerStore(state => ({
  stats: state.getHandlerStats(),
  metrics: state.getPerformanceMetrics(),
  activeHandlers: state.getActiveHandlers(),
  pendingHandlers: state.getPendingHandlers(),
  executingHandlers: state.getExecutingHandlers(),
  completedHandlers: state.getCompletedHandlers(),
  failedHandlers: state.getFailedHandlers()
}));

export const useHandlerSettings = () => useRebalanceOverrideHandlerStore(state => ({
  displaySettings: state.displaySettings,
  monitoringSettings: state.monitoringSettings,
  setDisplaySettings: state.setDisplaySettings,
  setMonitoringSettings: state.setMonitoringSettings
})); 