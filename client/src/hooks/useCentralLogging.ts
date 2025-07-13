// Block 34: Central Logging Dashboard - Hook
import { useState, useEffect, useCallback } from 'react';
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

export function useCentralLogging() {
  const [state, setState] = useState<LogState>({
    logs: [],
    filter: {},
    selectedLogs: [],
    sortBy: 'timestamp',
    sortOrder: 'desc',
    isLoading: false,
    error: null,
    autoRefresh: false,
    refreshInterval: 5000 // 5 seconds
  });

  // Initialize logs
  useEffect(() => {
    refreshLogs();
  }, []);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!state.autoRefresh) return;

    const interval = setInterval(() => {
      refreshLogs();
    }, state.refreshInterval);

    return () => clearInterval(interval);
  }, [state.autoRefresh, state.refreshInterval]);

  // Refresh logs
  const refreshLogs = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const logs = centralLoggingEngine.getAllLogs();
      setState(prev => ({
        ...prev,
        logs,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh logs'
      }));
    }
  }, []);

  // Create log entry
  const log = useCallback((
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    source?: string,
    userId?: string
  ) => {
    try {
      const entry = centralLoggingEngine.log(level, category, message, data, source, userId);
      refreshLogs(); // Refresh to show new log
      return entry;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create log'
      }));
      throw error;
    }
  }, [refreshLogs]);

  // Convenience logging methods
  const debug = useCallback((category: LogCategory, message: string, data?: any, source?: string) => {
    return log('debug', category, message, data, source);
  }, [log]);

  const info = useCallback((category: LogCategory, message: string, data?: any, source?: string) => {
    return log('info', category, message, data, source);
  }, [log]);

  const warn = useCallback((category: LogCategory, message: string, data?: any, source?: string) => {
    return log('warn', category, message, data, source);
  }, [log]);

  const error = useCallback((category: LogCategory, message: string, data?: any, source?: string) => {
    return log('error', category, message, data, source);
  }, [log]);

  // Filter logs
  const filterLogs = useCallback((filter: LogFilter) => {
    return centralLoggingEngine.filterLogs(filter);
  }, []);

  // Search logs
  const searchLogs = useCallback((query: string) => {
    return centralLoggingEngine.searchLogs(query);
  }, []);

  // Get filtered logs based on current state
  const getFilteredLogs = useCallback(() => {
    let filtered = filterLogs(state.filter);

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (state.sortBy) {
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
        return state.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return state.sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [state.filter, state.sortBy, state.sortOrder, filterLogs]);

  // Get log statistics
  const getLogStats = useCallback((): LogStats => {
    return centralLoggingEngine.getLogStats();
  }, []);

  // Clear logs
  const clearLogs = useCallback((filter?: LogFilter) => {
    try {
      const count = centralLoggingEngine.clearLogs(filter);
      refreshLogs();
      return count;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear logs'
      }));
      return 0;
    }
  }, [refreshLogs]);

  // Export logs
  const exportLogs = useCallback((filter?: LogFilter, format: 'json' | 'csv' = 'json') => {
    try {
      return centralLoggingEngine.exportLogs(filter, format);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export logs'
      }));
      throw error;
    }
  }, []);

  // Get log context
  const getLogContext = useCallback((logId: string, contextSize: number = 10) => {
    return centralLoggingEngine.getLogContext(logId, contextSize);
  }, []);

  // Tracking methods
  const trackUserAction = useCallback((action: string, data?: any, userId?: string) => {
    return centralLoggingEngine.trackUserAction(action, data, userId);
  }, []);

  const trackAPICall = useCallback((endpoint: string, method: string, status: number, duration: number, data?: any) => {
    return centralLoggingEngine.trackAPICall(endpoint, method, status, duration, data);
  }, []);

  const trackError = useCallback((error: Error, context?: any, source?: string) => {
    return centralLoggingEngine.trackError(error, context, source);
  }, []);

  const trackGPTInteraction = useCallback((prompt: string, response: string, model?: string, tokens?: number) => {
    return centralLoggingEngine.trackGPTInteraction(prompt, response, model, tokens);
  }, []);

  const trackSignal = useCallback((signalType: string, symbol: string, confidence: number, data?: any) => {
    return centralLoggingEngine.trackSignal(signalType, symbol, confidence, data);
  }, []);

  const trackTrade = useCallback((action: string, symbol: string, quantity: number, price: number, data?: any) => {
    return centralLoggingEngine.trackTrade(action, symbol, quantity, price, data);
  }, []);

  // State setters
  const setFilter = useCallback((filter: LogFilter) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  const setSort = useCallback((sortBy: 'timestamp' | 'level' | 'category' | 'source', sortOrder: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const setSelectedLogs = useCallback((logIds: string[]) => {
    setState(prev => ({ ...prev, selectedLogs: logIds }));
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }));
  }, []);

  const setRefreshInterval = useCallback((interval: number) => {
    setState(prev => ({ ...prev, refreshInterval: interval }));
  }, []);

  // Selection helpers
  const selectAllVisible = useCallback(() => {
    const visible = getFilteredLogs();
    setSelectedLogs(visible.map(log => log.id));
  }, [getFilteredLogs, setSelectedLogs]);

  const clearSelection = useCallback(() => {
    setSelectedLogs([]);
  }, [setSelectedLogs]);

  return {
    // State
    logs: state.logs,
    filteredLogs: getFilteredLogs(),
    filter: state.filter,
    selectedLogs: state.selectedLogs,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    isLoading: state.isLoading,
    error: state.error,
    autoRefresh: state.autoRefresh,
    refreshInterval: state.refreshInterval,

    // Actions
    log,
    debug,
    info,
    warn,
    error,
    refreshLogs,
    filterLogs,
    searchLogs,
    getLogStats,
    clearLogs,
    exportLogs,
    getLogContext,

    // Tracking
    trackUserAction,
    trackAPICall,
    trackError,
    trackGPTInteraction,
    trackSignal,
    trackTrade,

    // State management
    setFilter,
    setSort,
    setSelectedLogs,
    selectAllVisible,
    clearSelection,
    toggleAutoRefresh,
    setRefreshInterval
  };
} 