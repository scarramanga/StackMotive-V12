// Block 34: Central Logging Dashboard - Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  LogEntry, 
  LogLevel, 
  LogCategory, 
  LogFilter, 
  LogState,
  LogStats,
  LogExport
} from '../types/logging';
import { centralLoggingEngine } from '../engines/CentralLoggingEngine';

interface CentralLoggingStore extends LogState {
  // Additional state
  lastRefresh: Date | null;
  stats: LogStats | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshLogs: () => void;
  refreshStats: () => void;
  
  // Logging
  log: (level: LogLevel, category: LogCategory, message: string, data?: any, source?: string, userId?: string) => LogEntry;
  debug: (category: LogCategory, message: string, data?: any, source?: string) => LogEntry;
  info: (category: LogCategory, message: string, data?: any, source?: string) => LogEntry;
  warn: (category: LogCategory, message: string, data?: any, source?: string) => LogEntry;
  error: (category: LogCategory, message: string, data?: any, source?: string) => LogEntry;
  
  // Filtering and search
  setFilter: (filter: LogFilter) => void;
  clearFilter: () => void;
  searchLogs: (query: string) => LogEntry[];
  getFilteredLogs: () => LogEntry[];
  
  // Sorting
  setSort: (sortBy: 'timestamp' | 'level' | 'category' | 'source', sortOrder: 'asc' | 'desc') => void;
  
  // Selection
  setSelectedLogs: (logIds: string[]) => void;
  selectAll: () => void;
  selectAllVisible: () => void;
  clearSelection: () => void;
  
  // Management
  clearLogs: (filter?: LogFilter) => number;
  exportLogs: (filter?: LogFilter, format?: 'json' | 'csv') => LogExport;
  getLogContext: (logId: string, contextSize?: number) => LogEntry[];
  
  // Tracking methods
  trackUserAction: (action: string, data?: any, userId?: string) => LogEntry;
  trackAPICall: (endpoint: string, method: string, status: number, duration: number, data?: any) => LogEntry;
  trackError: (error: Error, context?: any, source?: string) => LogEntry;
  trackGPTInteraction: (prompt: string, response: string, model?: string, tokens?: number) => LogEntry;
  trackSignal: (signalType: string, symbol: string, confidence: number, data?: any) => LogEntry;
  trackTrade: (action: string, symbol: string, quantity: number, price: number, data?: any) => LogEntry;
  
  // Auto-refresh
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

let refreshIntervalId: NodeJS.Timeout | null = null;

export const useCentralLoggingStore = create<CentralLoggingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      logs: [],
      filter: {},
      selectedLogs: [],
      sortBy: 'timestamp',
      sortOrder: 'desc',
      isLoading: false,
      error: null,
      autoRefresh: false,
      refreshInterval: 5000,
      lastRefresh: null,
      stats: null,

      // Basic actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      refreshLogs: () => {
        try {
          set({ isLoading: true });
          const logs = centralLoggingEngine.getAllLogs();
          set({ 
            logs,
            isLoading: false,
            lastRefresh: new Date(),
            error: null 
          });
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh logs' 
          });
        }
      },

      refreshStats: () => {
        try {
          const stats = centralLoggingEngine.getLogStats();
          set({ stats, error: null });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to refresh stats' });
        }
      },

      // Logging methods
      log: (level, category, message, data, source, userId) => {
        try {
          const entry = centralLoggingEngine.log(level, category, message, data, source, userId);
          get().refreshLogs();
          get().refreshStats();
          set({ error: null });
          return entry;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create log' });
          throw error;
        }
      },

      debug: (category, message, data, source) => {
        return get().log('debug', category, message, data, source);
      },

      info: (category, message, data, source) => {
        return get().log('info', category, message, data, source);
      },

      warn: (category, message, data, source) => {
        return get().log('warn', category, message, data, source);
      },

      error: (category, message, data, source) => {
        return get().log('error', category, message, data, source);
      },

      // Filtering and search
      setFilter: (filter) => set({ filter }),
      clearFilter: () => set({ filter: {} }),
      
      searchLogs: (query) => {
        return centralLoggingEngine.searchLogs(query);
      },

      getFilteredLogs: () => {
        const { logs, filter, sortBy, sortOrder } = get();
        let filtered = centralLoggingEngine.filterLogs(filter);

        // Apply sorting
        filtered.sort((a, b) => {
          let aValue, bValue;

          switch (sortBy) {
            case 'timestamp':
              aValue = a.timestamp.getTime();
              bValue = b.timestamp.getTime();
              break;
            case 'level':
              const levelOrder = { error: 4, warn: 3, info: 2, debug: 1 };
              aValue = levelOrder[a.level];
              bValue = levelOrder[b.level];
              break;
            case 'category':
              aValue = a.category;
              bValue = b.category;
              break;
            case 'source':
              aValue = a.source;
              bValue = b.source;
              break;
            default:
              return 0;
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          return sortOrder === 'asc' 
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        });

        return filtered;
      },

      // Sorting
      setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

      // Selection
      setSelectedLogs: (logIds) => set({ selectedLogs: logIds }),
      
      selectAll: () => {
        const logs = get().logs;
        set({ selectedLogs: logs.map(log => log.id) });
      },

      selectAllVisible: () => {
        const filtered = get().getFilteredLogs();
        set({ selectedLogs: filtered.map(log => log.id) });
      },

      clearSelection: () => set({ selectedLogs: [] }),

      // Management
      clearLogs: (filter) => {
        try {
          const count = centralLoggingEngine.clearLogs(filter);
          get().refreshLogs();
          get().refreshStats();
          set({ selectedLogs: [], error: null });
          return count;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to clear logs' });
          return 0;
        }
      },

      exportLogs: (filter, format = 'json') => {
        try {
          const exportData = centralLoggingEngine.exportLogs(filter, format);
          set({ error: null });
          return exportData;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to export logs' });
          throw error;
        }
      },

      getLogContext: (logId, contextSize = 10) => {
        return centralLoggingEngine.getLogContext(logId, contextSize);
      },

      // Tracking methods
      trackUserAction: (action, data, userId) => {
        return centralLoggingEngine.trackUserAction(action, data, userId);
      },

      trackAPICall: (endpoint, method, status, duration, data) => {
        return centralLoggingEngine.trackAPICall(endpoint, method, status, duration, data);
      },

      trackError: (error, context, source) => {
        return centralLoggingEngine.trackError(error, context, source);
      },

      trackGPTInteraction: (prompt, response, model, tokens) => {
        return centralLoggingEngine.trackGPTInteraction(prompt, response, model, tokens);
      },

      trackSignal: (signalType, symbol, confidence, data) => {
        return centralLoggingEngine.trackSignal(signalType, symbol, confidence, data);
      },

      trackTrade: (action, symbol, quantity, price, data) => {
        return centralLoggingEngine.trackTrade(action, symbol, quantity, price, data);
      },

      // Auto-refresh
      toggleAutoRefresh: () => {
        const state = get();
        if (state.autoRefresh) {
          get().stopAutoRefresh();
        } else {
          get().startAutoRefresh();
        }
        set({ autoRefresh: !state.autoRefresh });
      },

      setRefreshInterval: (interval) => {
        set({ refreshInterval: interval });
        // Restart auto-refresh with new interval if it's active
        const state = get();
        if (state.autoRefresh) {
          get().stopAutoRefresh();
          get().startAutoRefresh();
        }
      },

      startAutoRefresh: () => {
        const { refreshInterval } = get();
        if (refreshIntervalId) {
          clearInterval(refreshIntervalId);
        }
        refreshIntervalId = setInterval(() => {
          get().refreshLogs();
          get().refreshStats();
        }, refreshInterval);
      },

      stopAutoRefresh: () => {
        if (refreshIntervalId) {
          clearInterval(refreshIntervalId);
          refreshIntervalId = null;
        }
      }
    }),
    {
      name: 'central-logging-store',
      partialize: (state) => ({
        filter: state.filter,
        selectedLogs: state.selectedLogs,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval
      })
    }
  )
); 