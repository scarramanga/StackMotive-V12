// Block 43: Rebalance Timing Alert Engine - Hook
import { useState, useEffect, useCallback } from 'react';
import { 
  RebalanceTimer, 
  TimingStrategy, 
  RebalanceAlert, 
  TimingRule,
  RebalanceTimingState, 
  TimingFilter,
  TimingStats
} from '../types/rebalanceTiming';
import { rebalanceTimingEngine } from '../engines/RebalanceTimingEngine';

export function useRebalanceTiming() {
  const [state, setState] = useState<RebalanceTimingState>({
    timers: [],
    rules: [],
    alerts: [],
    selectedTimer: null,
    filter: {},
    isLoading: false,
    error: null,
    stats: null,
    upcomingTriggers: []
  });

  // Initialize data
  useEffect(() => {
    refreshData();
  }, []);

  // Auto-refresh every minute to check for due timers
  useEffect(() => {
    const interval = setInterval(() => {
      processDueTimers();
      refreshUpcomingTriggers();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Refresh all data
  const refreshData = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const timers = rebalanceTimingEngine.getAllTimers();
      const rules = rebalanceTimingEngine.getAllRules();
      const alerts = rebalanceTimingEngine.getRecentAlerts(168); // 7 days
      const stats = rebalanceTimingEngine.getTimingStats();
      const upcomingTriggers = rebalanceTimingEngine.getUpcomingTriggers(7);

      setState(prev => ({
        ...prev,
        timers,
        rules,
        alerts,
        stats,
        upcomingTriggers,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh data'
      }));
    }
  }, []);

  // Create timer
  const createTimer = useCallback((
    strategyId: string,
    name: string,
    strategy: TimingStrategy,
    userId?: string
  ) => {
    try {
      const timer = rebalanceTimingEngine.createTimer(strategyId, name, strategy, userId);
      refreshData();
      return timer;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create timer'
      }));
      throw error;
    }
  }, [refreshData]);

  // Start timer
  const startTimer = useCallback((timerId: string) => {
    try {
      const success = rebalanceTimingEngine.startTimer(timerId);
      if (success) {
        refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start timer'
      }));
      return false;
    }
  }, [refreshData]);

  // Stop timer
  const stopTimer = useCallback((timerId: string) => {
    try {
      const success = rebalanceTimingEngine.stopTimer(timerId);
      if (success) {
        refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop timer'
      }));
      return false;
    }
  }, [refreshData]);

  // Update timer
  const updateTimer = useCallback((timerId: string, updates: Partial<RebalanceTimer>) => {
    try {
      const success = rebalanceTimingEngine.updateTimer(timerId, updates);
      if (success) {
        refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update timer'
      }));
      return false;
    }
  }, [refreshData]);

  // Delete timer
  const deleteTimer = useCallback((timerId: string) => {
    try {
      const success = rebalanceTimingEngine.deleteTimer(timerId);
      if (success) {
        setState(prev => ({
          ...prev,
          selectedTimer: prev.selectedTimer?.id === timerId ? null : prev.selectedTimer
        }));
        refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete timer'
      }));
      return false;
    }
  }, [refreshData]);

  // Trigger manual rebalance
  const triggerRebalance = useCallback((timerId: string, reason: string = 'Manual trigger') => {
    try {
      const alert = rebalanceTimingEngine.triggerRebalance(timerId, reason);
      if (alert) {
        refreshData();
      }
      return alert;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to trigger rebalance'
      }));
      return null;
    }
  }, [refreshData]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string, userId?: string) => {
    try {
      const success = rebalanceTimingEngine.acknowledgeAlert(alertId, userId);
      if (success) {
        refreshData();
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to acknowledge alert'
      }));
      return false;
    }
  }, [refreshData]);

  // Process due timers
  const processDueTimers = useCallback(() => {
    try {
      const alerts = rebalanceTimingEngine.processDueTimers();
      if (alerts.length > 0) {
        refreshData();
      }
      return alerts;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process due timers'
      }));
      return [];
    }
  }, [refreshData]);

  // Get filtered timers
  const getFilteredTimers = useCallback(() => {
    let filtered = [...state.timers];

    if (state.filter.strategyId) {
      filtered = filtered.filter(timer => timer.strategyId === state.filter.strategyId);
    }

    if (state.filter.userId) {
      filtered = filtered.filter(timer => timer.userId === state.filter.userId);
    }

    if (state.filter.isActive !== undefined) {
      filtered = filtered.filter(timer => timer.isActive === state.filter.isActive);
    }

    if (state.filter.type) {
      filtered = filtered.filter(timer => timer.strategy.type === state.filter.type);
    }

    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(timer =>
        timer.name.toLowerCase().includes(query) ||
        timer.strategyId.toLowerCase().includes(query)
      );
    }

    if (state.filter.dateFrom || state.filter.dateTo) {
      filtered = filtered.filter(timer => {
        if (state.filter.dateFrom && timer.createdAt < state.filter.dateFrom) return false;
        if (state.filter.dateTo && timer.createdAt > state.filter.dateTo) return false;
        return true;
      });
    }

    return filtered;
  }, [state.timers, state.filter]);

  // Get filtered alerts
  const getFilteredAlerts = useCallback(() => {
    let filtered = [...state.alerts];

    if (state.filter.strategyId) {
      filtered = filtered.filter(alert => alert.strategyId === state.filter.strategyId);
    }

    if (state.filter.dateFrom || state.filter.dateTo) {
      filtered = filtered.filter(alert => {
        if (state.filter.dateFrom && alert.createdAt < state.filter.dateFrom) return false;
        if (state.filter.dateTo && alert.createdAt > state.filter.dateTo) return false;
        return true;
      });
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [state.alerts, state.filter]);

  // Refresh upcoming triggers
  const refreshUpcomingTriggers = useCallback(() => {
    try {
      const upcomingTriggers = rebalanceTimingEngine.getUpcomingTriggers(7);
      setState(prev => ({ ...prev, upcomingTriggers }));
    } catch (error) {
      console.error('Failed to refresh upcoming triggers:', error);
    }
  }, []);

  // Create rule
  const createRule = useCallback((rule: Omit<TimingRule, 'id' | 'createdAt'>) => {
    try {
      const newRule = rebalanceTimingEngine.createRule(rule);
      refreshData();
      return newRule;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create rule'
      }));
      throw error;
    }
  }, [refreshData]);

  // Get timer by ID
  const getTimer = useCallback((timerId: string) => {
    return rebalanceTimingEngine.getTimer(timerId);
  }, []);

  // Get alert by ID
  const getAlert = useCallback((alertId: string) => {
    return rebalanceTimingEngine.getAlert(alertId);
  }, []);

  // Get upcoming triggers
  const getUpcomingTriggers = useCallback((days: number = 7) => {
    return rebalanceTimingEngine.getUpcomingTriggers(days);
  }, []);

  // Get recent alerts
  const getRecentAlerts = useCallback((hours: number = 24) => {
    return rebalanceTimingEngine.getRecentAlerts(hours);
  }, []);

  // Set filter
  const setFilter = useCallback((filter: TimingFilter) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setState(prev => ({ ...prev, filter: {} }));
  }, []);

  // Set selected timer
  const setSelectedTimer = useCallback((timer: RebalanceTimer | null) => {
    setState(prev => ({ ...prev, selectedTimer: timer }));
  }, []);

  // Get due timers
  const getDueTimers = useCallback(() => {
    return rebalanceTimingEngine.getDueTimers();
  }, []);

  // Bulk operations
  const bulkStartTimers = useCallback((timerIds: string[]) => {
    let successCount = 0;
    timerIds.forEach(id => {
      if (startTimer(id)) successCount++;
    });
    return successCount;
  }, [startTimer]);

  const bulkStopTimers = useCallback((timerIds: string[]) => {
    let successCount = 0;
    timerIds.forEach(id => {
      if (stopTimer(id)) successCount++;
    });
    return successCount;
  }, [stopTimer]);

  const bulkDeleteTimers = useCallback((timerIds: string[]) => {
    let successCount = 0;
    timerIds.forEach(id => {
      if (deleteTimer(id)) successCount++;
    });
    return successCount;
  }, [deleteTimer]);

  const bulkAcknowledgeAlerts = useCallback((alertIds: string[], userId?: string) => {
    let successCount = 0;
    alertIds.forEach(id => {
      if (acknowledgeAlert(id, userId)) successCount++;
    });
    return successCount;
  }, [acknowledgeAlert]);

  return {
    // State
    timers: state.timers,
    filteredTimers: getFilteredTimers(),
    rules: state.rules,
    alerts: state.alerts,
    filteredAlerts: getFilteredAlerts(),
    selectedTimer: state.selectedTimer,
    filter: state.filter,
    isLoading: state.isLoading,
    error: state.error,
    stats: state.stats,
    upcomingTriggers: state.upcomingTriggers,

    // Actions
    createTimer,
    startTimer,
    stopTimer,
    updateTimer,
    deleteTimer,
    triggerRebalance,
    acknowledgeAlert,
    processDueTimers,
    createRule,
    refreshData,

    // Getters
    getTimer,
    getAlert,
    getUpcomingTriggers,
    getRecentAlerts,
    getDueTimers,

    // Filters
    setFilter,
    clearFilter,
    setSelectedTimer,

    // Bulk operations
    bulkStartTimers,
    bulkStopTimers,
    bulkDeleteTimers,
    bulkAcknowledgeAlerts
  };
} 