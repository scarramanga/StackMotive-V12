// Block 28: Rebalance Execution Log - Store
// Zustand store for rebalance execution log management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  RebalanceExecutionLog,
  ExecutionStatus,
  ExecutionStage,
  EventLevel,
  EventType
} from '../types/rebalanceExecutionLog';

interface RebalanceExecutionLogState {
  // Data
  logs: RebalanceExecutionLog[];
  
  // Selection
  selectedLog: string | null;
  
  // View state
  view: 'list' | 'timeline' | 'dashboard' | 'analytics';
  logView: 'detailed' | 'summary' | 'events' | 'trades';
  
  // Filter state
  filter: {
    status: ExecutionStatus | 'all';
    stage: ExecutionStage | 'all';
    timeRange: 'all' | 'today' | 'week' | 'month' | 'quarter';
    portfolios: string[];
    strategies: string[];
    search: string;
    
    // Event filters
    eventLevel: EventLevel | 'all';
    eventType: EventType | 'all';
    showErrors: boolean;
    showWarnings: boolean;
  };
  
  // Sort state
  sort: {
    field: 'createdAt' | 'updatedAt' | 'status' | 'progress' | 'duration';
    direction: 'asc' | 'desc';
  };
  
  // Display settings
  displaySettings: {
    autoRefresh: boolean;
    refreshInterval: number;
    showRealTimeUpdates: boolean;
    eventPagination: number;
    tradePagination: number;
    groupByPortfolio: boolean;
    showMetrics: boolean;
    showCharts: boolean;
  };
  
  // Monitoring settings
  monitoringSettings: {
    enableNotifications: boolean;
    notificationThresholds: {
      errorRate: number;
      executionTime: number;
      slippage: number;
      failureRate: number;
    };
    alertLevels: string[];
    soundEnabled: boolean;
  };
  
  // Actions
  setLogs: (logs: RebalanceExecutionLog[]) => void;
  addLog: (log: RebalanceExecutionLog) => void;
  updateLog: (id: string, updates: Partial<RebalanceExecutionLog>) => void;
  removeLog: (id: string) => void;
  setSelectedLog: (id: string | null) => void;
  
  setView: (view: 'list' | 'timeline' | 'dashboard' | 'analytics') => void;
  setLogView: (view: 'detailed' | 'summary' | 'events' | 'trades') => void;
  
  setFilter: (filter: Partial<RebalanceExecutionLogState['filter']>) => void;
  setSort: (sort: RebalanceExecutionLogState['sort']) => void;
  
  setDisplaySettings: (settings: Partial<RebalanceExecutionLogState['displaySettings']>) => void;
  setMonitoringSettings: (settings: Partial<RebalanceExecutionLogState['monitoringSettings']>) => void;
  
  // Computed getters
  getLog: (id: string) => RebalanceExecutionLog | undefined;
  getFilteredLogs: () => RebalanceExecutionLog[];
  getSortedLogs: () => RebalanceExecutionLog[];
  getLogsByStatus: (status: ExecutionStatus) => RebalanceExecutionLog[];
  getLogsByPortfolio: (portfolioId: string) => RebalanceExecutionLog[];
  getLogsByStrategy: (strategyId: string) => RebalanceExecutionLog[];
  getActiveExecutions: () => RebalanceExecutionLog[];
  getRecentExecutions: (hours?: number) => RebalanceExecutionLog[];
  
  // Statistics
  getExecutionStats: () => {
    total: number;
    active: number;
    completed: number;
    failed: number;
    successRate: number;
    averageExecutionTime: number;
    totalTradesExecuted: number;
    averageSlippage: number;
  };
  
  // Utilities
  clearOldLogs: (days: number) => void;
  exportLogs: (logIds?: string[]) => string;
  importLogs: (data: string) => void;
}

export const useRebalanceExecutionLogStore = create<RebalanceExecutionLogState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial data
        logs: [],
        
        // Initial selection
        selectedLog: null,
        
        // Initial view state
        view: 'list',
        logView: 'detailed',
        
        // Initial filter state
        filter: {
          status: 'all',
          stage: 'all',
          timeRange: 'all',
          portfolios: [],
          strategies: [],
          search: '',
          eventLevel: 'all',
          eventType: 'all',
          showErrors: true,
          showWarnings: true
        },
        
        // Initial sort state
        sort: {
          field: 'createdAt',
          direction: 'desc'
        },
        
        // Initial display settings
        displaySettings: {
          autoRefresh: true,
          refreshInterval: 5000,
          showRealTimeUpdates: true,
          eventPagination: 50,
          tradePagination: 100,
          groupByPortfolio: false,
          showMetrics: true,
          showCharts: true
        },
        
        // Initial monitoring settings
        monitoringSettings: {
          enableNotifications: true,
          notificationThresholds: {
            errorRate: 0.05,
            executionTime: 300000, // 5 minutes
            slippage: 0.01,
            failureRate: 0.1
          },
          alertLevels: ['error', 'critical'],
          soundEnabled: false
        },
        
        // Log actions
        setLogs: (logs) => set({ logs }),
        addLog: (log) => set((state) => ({ 
          logs: [...state.logs, log] 
        })),
        updateLog: (id, updates) => set((state) => ({
          logs: state.logs.map(log => 
            log.id === id ? { ...log, ...updates } : log
          )
        })),
        removeLog: (id) => set((state) => ({
          logs: state.logs.filter(log => log.id !== id),
          selectedLog: state.selectedLog === id ? null : state.selectedLog
        })),
        setSelectedLog: (id) => set({ selectedLog: id }),
        
        // View actions
        setView: (view) => set({ view }),
        setLogView: (logView) => set({ logView }),
        
        // Filter actions
        setFilter: (filter) => set((state) => ({
          filter: { ...state.filter, ...filter }
        })),
        setSort: (sort) => set({ sort }),
        
        // Settings actions
        setDisplaySettings: (settings) => set((state) => ({
          displaySettings: { ...state.displaySettings, ...settings }
        })),
        setMonitoringSettings: (settings) => set((state) => ({
          monitoringSettings: { ...state.monitoringSettings, ...settings }
        })),
        
        // Computed getters
        getLog: (id) => {
          const state = get();
          return state.logs.find(log => log.id === id);
        },
        
        getFilteredLogs: () => {
          const state = get();
          let filtered = state.logs;
          
          // Filter by status
          if (state.filter.status !== 'all') {
            filtered = filtered.filter(log => log.status === state.filter.status);
          }
          
          // Filter by stage
          if (state.filter.stage !== 'all') {
            filtered = filtered.filter(log => log.progress.currentStage === state.filter.stage);
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
            
            filtered = filtered.filter(log => log.createdAt >= cutoff);
          }
          
          // Filter by portfolios
          if (state.filter.portfolios.length > 0) {
            filtered = filtered.filter(log => 
              state.filter.portfolios.includes(log.portfolioId)
            );
          }
          
          // Filter by strategies
          if (state.filter.strategies.length > 0) {
            filtered = filtered.filter(log => 
              state.filter.strategies.includes(log.strategyId)
            );
          }
          
          // Filter by search
          if (state.filter.search) {
            const search = state.filter.search.toLowerCase();
            filtered = filtered.filter(log => 
              log.execution.executionId.toLowerCase().includes(search) ||
              log.rebalanceId.toLowerCase().includes(search) ||
              log.portfolioId.toLowerCase().includes(search) ||
              log.strategyId.toLowerCase().includes(search)
            );
          }
          
          return filtered;
        },
        
        getSortedLogs: () => {
          const state = get();
          const filtered = state.getFilteredLogs();
          
          return filtered.sort((a, b) => {
            const { field, direction } = state.sort;
            let aValue: any, bValue: any;
            
            switch (field) {
              case 'createdAt':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
              case 'updatedAt':
                aValue = a.updatedAt;
                bValue = b.updatedAt;
                break;
              case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
              case 'progress':
                aValue = a.progress.percentage;
                bValue = b.progress.percentage;
                break;
              case 'duration':
                aValue = a.metrics.totalExecutionTime;
                bValue = b.metrics.totalExecutionTime;
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        },
        
        getLogsByStatus: (status) => {
          const state = get();
          return state.logs.filter(log => log.status === status);
        },
        
        getLogsByPortfolio: (portfolioId) => {
          const state = get();
          return state.logs.filter(log => log.portfolioId === portfolioId);
        },
        
        getLogsByStrategy: (strategyId) => {
          const state = get();
          return state.logs.filter(log => log.strategyId === strategyId);
        },
        
        getActiveExecutions: () => {
          const state = get();
          return state.logs.filter(log => log.status === 'running');
        },
        
        getRecentExecutions: (hours = 24) => {
          const state = get();
          const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
          return state.logs.filter(log => log.createdAt >= cutoff);
        },
        
        // Statistics
        getExecutionStats: () => {
          const state = get();
          const logs = state.logs;
          
          const total = logs.length;
          const active = logs.filter(log => log.status === 'running').length;
          const completed = logs.filter(log => log.status === 'completed').length;
          const failed = logs.filter(log => log.status === 'failed').length;
          
          const successRate = total > 0 ? completed / total : 0;
          
          const completedLogs = logs.filter(log => log.status === 'completed');
          const averageExecutionTime = completedLogs.length > 0
            ? completedLogs.reduce((sum, log) => sum + log.metrics.totalExecutionTime, 0) / completedLogs.length
            : 0;
          
          const totalTradesExecuted = logs.reduce((sum, log) => sum + log.progress.tradesCompleted, 0);
          
          const allTrades = logs.flatMap(log => log.trades);
          const averageSlippage = allTrades.length > 0
            ? allTrades.reduce((sum, trade) => sum + trade.slippage, 0) / allTrades.length
            : 0;
          
          return {
            total,
            active,
            completed,
            failed,
            successRate,
            averageExecutionTime,
            totalTradesExecuted,
            averageSlippage
          };
        },
        
        // Utilities
        clearOldLogs: (days) => set((state) => {
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          return {
            logs: state.logs.filter(log => log.createdAt >= cutoff)
          };
        }),
        
        exportLogs: (logIds) => {
          const state = get();
          const logsToExport = logIds 
            ? state.logs.filter(log => logIds.includes(log.id))
            : state.logs;
          
          return JSON.stringify({
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            logs: logsToExport.map(log => ({
              id: log.id,
              rebalanceId: log.rebalanceId,
              portfolioId: log.portfolioId,
              strategyId: log.strategyId,
              execution: log.execution,
              status: log.status,
              progress: log.progress,
              events: log.events,
              trades: log.trades,
              results: log.results,
              errors: log.errors,
              warnings: log.warnings,
              metrics: log.metrics,
              createdAt: log.createdAt,
              startedAt: log.startedAt,
              completedAt: log.completedAt,
              updatedAt: log.updatedAt
            }))
          }, null, 2);
        },
        
        importLogs: (data) => {
          try {
            const imported = JSON.parse(data);
            if (imported.logs && Array.isArray(imported.logs)) {
              set((state) => ({
                logs: [...state.logs, ...imported.logs]
              }));
            }
          } catch (error) {
            console.error('Failed to import logs:', error);
          }
        }
      }),
      {
        name: 'rebalance-execution-log-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist UI preferences and settings only
          view: state.view,
          logView: state.logView,
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
export const useExecutionLogData = () => useRebalanceExecutionLogStore(state => ({
  logs: state.logs,
  selectedLog: state.selectedLog,
  getLog: state.getLog,
  getSortedLogs: state.getSortedLogs
}));

export const useExecutionLogFilters = () => useRebalanceExecutionLogStore(state => ({
  filter: state.filter,
  sort: state.sort,
  setFilter: state.setFilter,
  setSort: state.setSort,
  getFilteredLogs: state.getFilteredLogs
}));

export const useExecutionLogSettings = () => useRebalanceExecutionLogStore(state => ({
  displaySettings: state.displaySettings,
  monitoringSettings: state.monitoringSettings,
  setDisplaySettings: state.setDisplaySettings,
  setMonitoringSettings: state.setMonitoringSettings
}));

export const useExecutionLogStats = () => useRebalanceExecutionLogStore(state => ({
  getExecutionStats: state.getExecutionStats,
  getActiveExecutions: state.getActiveExecutions,
  getRecentExecutions: state.getRecentExecutions,
  getLogsByStatus: state.getLogsByStatus,
  getLogsByPortfolio: state.getLogsByPortfolio,
  getLogsByStrategy: state.getLogsByStrategy
})); 