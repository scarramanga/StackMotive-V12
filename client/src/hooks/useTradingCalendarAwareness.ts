// Block 87: Trading Calendar Awareness - Hook
// React hook for trading calendar awareness and market closure conflict detection

import { useState, useEffect, useCallback } from 'react';
import { TradingCalendarAwarenessEngine } from '../engines/TradingCalendarAwarenessEngine';
import { useTradingCalendarStore } from '../store/tradingCalendarStore';
import {
  TradingCalendarAwareness,
  TradingCalendar,
  CalendarAlert,
  MarketConflict,
  AllocationIntent,
  PendingRebalance,
  ScheduledTrade,
  CalendarSettings
} from '../types/tradingCalendarAwareness';

export const useTradingCalendarAwareness = () => {
  const engine = TradingCalendarAwarenessEngine.getInstance();
  const store = useTradingCalendarStore();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Initialize store
  useEffect(() => {
    const initializeStore = async () => {
      try {
        setLoading(true);
        
        const calendars = engine.getAllCalendars();
        store.setCalendars(calendars);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeStore();
  }, []);

  // Calendar Management
  const loadCalendar = useCallback(async (calendar: TradingCalendar): Promise<TradingCalendar> => {
    try {
      setLoading(true);
      setError(null);

      const loadedCalendar = engine.loadCalendar(calendar);
      store.addCalendar(loadedCalendar);

      return loadedCalendar;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calendar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCalendar = useCallback((marketCode: string): TradingCalendar | undefined => {
    return engine.getCalendar(marketCode);
  }, []);

  // Awareness Management
  const createAwareness = useCallback(async (
    portfolioId: string,
    userId: string,
    allocations: AllocationIntent[],
    settings?: Partial<CalendarSettings>
  ): Promise<TradingCalendarAwareness> => {
    try {
      setLoading(true);
      setError(null);

      const awareness = engine.createAwareness(portfolioId, userId, allocations, settings);
      store.addAwareness(awareness);

      return awareness;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create awareness';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAwareness = useCallback(async (
    id: string,
    updates: Partial<TradingCalendarAwareness>
  ): Promise<TradingCalendarAwareness> => {
    try {
      setLoading(true);
      setError(null);

      const awareness = engine.updateAwareness(id, updates);
      store.updateAwareness(id, awareness);

      return awareness;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update awareness';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Conflict Detection
  const detectConflicts = useCallback(async (awarenessId: string): Promise<MarketConflict[]> => {
    try {
      setAnalyzing(true);
      setError(null);

      const conflicts = engine.detectConflicts(awarenessId);
      
      // Update store with detected conflicts
      const awareness = engine.getAwareness?.(awarenessId);
      if (awareness) {
        store.updateAwareness(awarenessId, { ...awareness, conflicts });
      }

      return conflicts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect conflicts';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Alert Management
  const generateAlerts = useCallback(async (awarenessId: string): Promise<CalendarAlert[]> => {
    try {
      setAnalyzing(true);
      setError(null);

      const alerts = engine.generateAlerts(awarenessId);
      
      // Update store with generated alerts
      const awareness = engine.getAwareness?.(awarenessId);
      if (awareness) {
        store.updateAwareness(awarenessId, { ...awareness, alerts });
      }

      return alerts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate alerts';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (
    awarenessId: string,
    alertId: string,
    userId: string
  ): Promise<void> => {
    try {
      setError(null);

      const awareness = store.getAwareness(awarenessId);
      if (!awareness) {
        throw new Error('Awareness not found');
      }

      const updatedAlerts = awareness.alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() }
          : alert
      );

      await updateAwareness(awarenessId, { alerts: updatedAlerts });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge alert';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [updateAwareness]);

  // Monitoring
  const startMonitoring = useCallback(async (
    awarenessId: string,
    options: {
      interval?: number;
      onConflictDetected?: (conflicts: MarketConflict[]) => void;
      onAlertGenerated?: (alerts: CalendarAlert[]) => void;
      onStatusChange?: (status: string) => void;
    } = {}
  ): Promise<() => void> => {
    const { interval = 60000, onConflictDetected, onAlertGenerated, onStatusChange } = options;

    setMonitoring(true);

    const monitoringInterval = setInterval(async () => {
      try {
        // Detect conflicts
        const conflicts = await detectConflicts(awarenessId);
        if (onConflictDetected && conflicts.length > 0) {
          onConflictDetected(conflicts);
        }

        // Generate alerts
        const alerts = await generateAlerts(awarenessId);
        if (onAlertGenerated && alerts.length > 0) {
          onAlertGenerated(alerts);
        }

        // Update status
        if (onStatusChange) {
          onStatusChange('monitoring');
        }
      } catch (err) {
        console.error('Monitoring error:', err);
        if (onStatusChange) {
          onStatusChange('error');
        }
      }
    }, interval);

    // Return cleanup function
    return () => {
      clearInterval(monitoringInterval);
      setMonitoring(false);
    };
  }, [detectConflicts, generateAlerts]);

  // Analysis
  const performFullAnalysis = useCallback(async (awarenessId: string): Promise<{
    conflicts: MarketConflict[];
    alerts: CalendarAlert[];
    recommendations: string[];
  }> => {
    try {
      setAnalyzing(true);
      setError(null);

      // Run comprehensive analysis
      engine.analyzeAndAlert(awarenessId);

      // Get results
      const conflicts = await detectConflicts(awarenessId);
      const alerts = await generateAlerts(awarenessId);

      // Generate recommendations
      const recommendations = generateRecommendations(conflicts, alerts);

      return { conflicts, alerts, recommendations };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform analysis';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }, [detectConflicts, generateAlerts]);

  // Data Management
  const addPendingRebalance = useCallback(async (
    awarenessId: string,
    rebalance: PendingRebalance
  ): Promise<void> => {
    try {
      setError(null);

      const awareness = store.getAwareness(awarenessId);
      if (!awareness) {
        throw new Error('Awareness not found');
      }

      const updatedRebalances = [...awareness.pendingRebalances, rebalance];
      await updateAwareness(awarenessId, { pendingRebalances: updatedRebalances });

      // Re-analyze after adding rebalance
      await performFullAnalysis(awarenessId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add pending rebalance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [updateAwareness, performFullAnalysis]);

  const addScheduledTrade = useCallback(async (
    awarenessId: string,
    trade: ScheduledTrade
  ): Promise<void> => {
    try {
      setError(null);

      const awareness = store.getAwareness(awarenessId);
      if (!awareness) {
        throw new Error('Awareness not found');
      }

      const updatedTrades = [...awareness.scheduledTrades, trade];
      await updateAwareness(awarenessId, { scheduledTrades: updatedTrades });

      // Re-analyze after adding trade
      await performFullAnalysis(awarenessId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add scheduled trade';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [updateAwareness, performFullAnalysis]);

  const updateAllocationIntent = useCallback(async (
    awarenessId: string,
    allocations: AllocationIntent[]
  ): Promise<void> => {
    try {
      setError(null);

      await updateAwareness(awarenessId, { currentAllocations: allocations });

      // Re-analyze after updating allocations
      await performFullAnalysis(awarenessId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update allocation intent';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [updateAwareness, performFullAnalysis]);

  // Notification Integration
  const sendToNotificationCenter = useCallback(async (
    alert: CalendarAlert,
    awarenessId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const success = await engine.sendToNotificationCenter(alert, awarenessId);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Event Handling
  const addEventListener = useCallback((event: string, handler: Function): void => {
    engine.on(event, handler);
  }, []);

  const removeEventListener = useCallback((event: string, handler: Function): void => {
    engine.off(event, handler);
  }, []);

  // Utilities
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const calendars = engine.getAllCalendars();
      store.setCalendars(calendars);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper Functions
  const generateRecommendations = useCallback((
    conflicts: MarketConflict[],
    alerts: CalendarAlert[]
  ): string[] => {
    const recommendations: string[] = [];

    if (conflicts.length === 0) {
      recommendations.push('No conflicts detected - all operations can proceed as scheduled');
      return recommendations;
    }

    // High severity conflicts
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical' || c.severity === 'blocking');
    if (criticalConflicts.length > 0) {
      recommendations.push('Address critical conflicts immediately to avoid execution failures');
    }

    // Market closure conflicts
    const marketClosureConflicts = conflicts.filter(c => c.type === 'market_closure');
    if (marketClosureConflicts.length > 0) {
      recommendations.push('Consider rescheduling operations to avoid market closures');
    }

    // Multiple market conflicts
    const affectedMarkets = new Set(conflicts.flatMap(c => c.affectedMarkets));
    if (affectedMarkets.size > 2) {
      recommendations.push('Diversify execution across multiple markets to reduce risk');
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push('Review and respond to critical alerts within deadlines');
    }

    return recommendations;
  }, []);

  // Store data
  const calendars = store.calendars;
  const awarenessInstances = store.awarenessInstances;
  const selectedAwareness = store.selectedAwareness;
  const currentAwareness = selectedAwareness ? store.getAwareness(selectedAwareness) : null;

  // Filtered data
  const activeAlerts = currentAwareness?.alerts.filter(a => a.status === 'active') || [];
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const unacknowledgedAlerts = activeAlerts.filter(a => !a.acknowledged);
  
  const activeConflicts = currentAwareness?.conflicts.filter(c => c.status === 'detected') || [];
  const criticalConflicts = activeConflicts.filter(c => c.severity === 'critical' || c.severity === 'blocking');

  // Analytics
  const analytics = {
    totalAwarenessInstances: awarenessInstances.length,
    activeMonitoring: awarenessInstances.filter(a => a.status === 'active').length,
    totalConflicts: awarenessInstances.reduce((sum, a) => sum + a.conflicts.length, 0),
    totalAlerts: awarenessInstances.reduce((sum, a) => sum + a.alerts.length, 0),
    criticalIssues: criticalConflicts.length + criticalAlerts.length,
    marketsMonitored: calendars.length
  };

  return {
    // State
    loading,
    error,
    monitoring,
    analyzing,

    // Data
    calendars,
    awarenessInstances,
    selectedAwareness,
    currentAwareness,
    activeAlerts,
    criticalAlerts,
    unacknowledgedAlerts,
    activeConflicts,
    criticalConflicts,
    analytics,

    // Calendar management
    loadCalendar,
    getCalendar,

    // Awareness management
    createAwareness,
    updateAwareness,

    // Conflict detection
    detectConflicts,

    // Alert management
    generateAlerts,
    acknowledgeAlert,

    // Monitoring
    startMonitoring,
    performFullAnalysis,

    // Data management
    addPendingRebalance,
    addScheduledTrade,
    updateAllocationIntent,

    // Notification integration
    sendToNotificationCenter,

    // Events
    addEventListener,
    removeEventListener,

    // Utilities
    clearError,
    refreshData,
    generateRecommendations,

    // Store actions
    setSelectedAwareness: store.setSelectedAwareness,
    setView: store.setView,
    setFilter: store.setFilter,
    setSort: store.setSort
  };
};

// Specialized hooks
export const useCalendarManagement = () => {
  const {
    calendars,
    loadCalendar,
    getCalendar,
    loading,
    error,
    clearError
  } = useTradingCalendarAwareness();

  return {
    calendars,
    loadCalendar,
    getCalendar,
    loading,
    error,
    clearError
  };
};

export const useConflictDetection = () => {
  const {
    activeConflicts,
    criticalConflicts,
    detectConflicts,
    analyzing,
    error,
    clearError
  } = useTradingCalendarAwareness();

  return {
    activeConflicts,
    criticalConflicts,
    detectConflicts,
    analyzing,
    error,
    clearError
  };
};

export const useAlertManagement = () => {
  const {
    activeAlerts,
    criticalAlerts,
    unacknowledgedAlerts,
    generateAlerts,
    acknowledgeAlert,
    sendToNotificationCenter,
    analyzing,
    error,
    clearError
  } = useTradingCalendarAwareness();

  return {
    activeAlerts,
    criticalAlerts,
    unacknowledgedAlerts,
    generateAlerts,
    acknowledgeAlert,
    sendToNotificationCenter,
    analyzing,
    error,
    clearError
  };
};

export const useCalendarMonitoring = () => {
  const {
    startMonitoring,
    performFullAnalysis,
    monitoring,
    analytics,
    error,
    clearError
  } = useTradingCalendarAwareness();

  return {
    startMonitoring,
    performFullAnalysis,
    monitoring,
    analytics,
    error,
    clearError
  };
}; 