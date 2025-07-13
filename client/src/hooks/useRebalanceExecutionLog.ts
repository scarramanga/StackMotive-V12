// Block 28: Rebalance Execution Log - Hook
// React hook for rebalance execution logging and monitoring

import { useState, useEffect, useCallback } from 'react';
import { RebalanceExecutionLogEngine } from '../engines/RebalanceExecutionLogEngine';
import { useRebalanceExecutionLogStore } from '../store/rebalanceExecutionLogStore';
import {
  RebalanceExecutionLog,
  ExecutionEvent,
  TradeExecution,
  ExecutionError,
  ExecutionWarning,
  ExecutionMetrics,
  ExecutionStatus,
  ExecutionStage,
  LogConfig,
  ExecutionContext
} from '../types/rebalanceExecutionLog';

export const useRebalanceExecutionLog = () => {
  const engine = RebalanceExecutionLogEngine.getInstance();
  const store = useRebalanceExecutionLogStore();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Initialize store
  useEffect(() => {
    const initializeStore = async () => {
      try {
        setLoading(true);
        
        const logs = engine.getAllLogs();
        store.setLogs(logs);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeStore();
  }, []);

  // Log Management
  const createExecutionLog = useCallback(async (
    rebalanceId: string,
    portfolioId: string,
    strategyId: string,
    config?: Partial<LogConfig>,
    context?: Partial<ExecutionContext>
  ): Promise<RebalanceExecutionLog> => {
    try {
      setLoading(true);
      setError(null);

      const log = engine.createExecutionLog(rebalanceId, portfolioId, strategyId, config, context);
      store.addLog(log);

      return log;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create execution log';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getExecutionLog = useCallback((id: string): RebalanceExecutionLog | undefined => {
    return engine.getExecutionLog(id);
  }, []);

  const getLogByRebalanceId = useCallback((rebalanceId: string): RebalanceExecutionLog | undefined => {
    return engine.getLogByRebalanceId(rebalanceId);
  }, []);

  const updateExecutionLog = useCallback(async (
    id: string,
    updates: Partial<RebalanceExecutionLog>
  ): Promise<RebalanceExecutionLog> => {
    try {
      setLoading(true);
      setError(null);

      const log = engine.updateExecutionLog(id, updates);
      store.updateLog(id, log);

      return log;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update execution log';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Event Logging
  const logEvent = useCallback(async (
    logId: string,
    event: Partial<ExecutionEvent>
  ): Promise<ExecutionEvent> => {
    try {
      setError(null);

      const executionEvent = engine.logEvent(logId, event);
      
      // Update store
      const log = engine.getExecutionLog(logId);
      if (log) {
        store.updateLog(logId, log);
      }

      return executionEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Trade Execution Logging
  const logTradeExecution = useCallback(async (
    logId: string,
    trade: Partial<TradeExecution>
  ): Promise<TradeExecution> => {
    try {
      setError(null);

      const tradeExecution = engine.logTradeExecution(logId, trade);
      
      // Update store
      const log = engine.getExecutionLog(logId);
      if (log) {
        store.updateLog(logId, log);
      }

      return tradeExecution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log trade execution';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Status Management
  const updateExecutionStatus = useCallback(async (
    logId: string,
    status: ExecutionStatus
  ): Promise<RebalanceExecutionLog> => {
    try {
      setLoading(true);
      setError(null);

      const log = engine.updateExecutionStatus(logId, status);
      store.updateLog(logId, log);

      return log;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update execution status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExecutionStage = useCallback(async (
    logId: string,
    stage: ExecutionStage
  ): Promise<RebalanceExecutionLog> => {
    try {
      setLoading(true);
      setError(null);

      const log = engine.updateExecutionStage(logId, stage);
      store.updateLog(logId, log);

      return log;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update execution stage';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Progress Tracking
  const updateProgress = useCallback(async (
    logId: string,
    progressData: Partial<RebalanceExecutionLog['progress']>
  ): Promise<RebalanceExecutionLog> => {
    try {
      setError(null);

      const log = engine.updateProgress(logId, progressData);
      store.updateLog(logId, log);

      return log;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Error and Warning Management
  const logError = useCallback(async (
    logId: string,
    error: Partial<ExecutionError>
  ): Promise<ExecutionError> => {
    try {
      const executionError = engine.logError(logId, error);
      
      // Update store
      const log = engine.getExecutionLog(logId);
      if (log) {
        store.updateLog(logId, log);
      }

      return executionError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log error';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const logWarning = useCallback(async (
    logId: string,
    warning: Partial<ExecutionWarning>
  ): Promise<ExecutionWarning> => {
    try {
      const executionWarning = engine.logWarning(logId, warning);
      
      // Update store
      const log = engine.getExecutionLog(logId);
      if (log) {
        store.updateLog(logId, log);
      }

      return executionWarning;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log warning';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Metrics and Analysis
  const calculateMetrics = useCallback(async (logId: string): Promise<ExecutionMetrics> => {
    try {
      setCalculating(true);
      setError(null);

      const metrics = await engine.calculateMetrics(logId);
      
      // Update store
      const log = engine.getExecutionLog(logId);
      if (log) {
        store.updateLog(logId, log);
      }

      return metrics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate metrics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCalculating(false);
    }
  }, []);

  // Reporting
  const generateExecutionReport = useCallback(async (logId: string): Promise<{
    summary: any;
    details: any;
    charts: any[];
    recommendations: string[];
  }> => {
    try {
      setGenerating(true);
      setError(null);

      const report = await engine.generateExecutionReport(logId);
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate execution report';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setGenerating(false);
    }
  }, []);

  // Real-time Updates
  const startRealTimeUpdates = useCallback((logId: string, callback: (event: any) => void): () => void => {
    const handleEvent = (data: any) => {
      if (data.logId === logId) {
        callback(data);
      }
    };

    engine.on('eventLogged', handleEvent);
    engine.on('logUpdated', handleEvent);

    // Return cleanup function
    return () => {
      engine.off('eventLogged', handleEvent);
      engine.off('logUpdated', handleEvent);
    };
  }, []);

  // Monitoring Functions
  const monitorExecution = useCallback(async (
    logId: string,
    options: {
      interval?: number;
      onProgress?: (progress: any) => void;
      onEvent?: (event: ExecutionEvent) => void;
      onError?: (error: ExecutionError) => void;
      onComplete?: (log: RebalanceExecutionLog) => void;
    } = {}
  ): Promise<() => void> => {
    const { interval = 1000, onProgress, onEvent, onError, onComplete } = options;

    const monitorInterval = setInterval(async () => {
      try {
        const log = engine.getExecutionLog(logId);
        if (!log) {
          clearInterval(monitorInterval);
          return;
        }

        // Check for progress updates
        if (onProgress) {
          onProgress(log.progress);
        }

        // Check for new events
        if (onEvent && log.events.length > 0) {
          const latestEvent = log.events[log.events.length - 1];
          onEvent(latestEvent);
        }

        // Check for new errors
        if (onError && log.errors.length > 0) {
          const latestError = log.errors[log.errors.length - 1];
          onError(latestError);
        }

        // Check if execution is complete
        if (log.status === 'completed' || log.status === 'failed' || log.status === 'cancelled') {
          if (onComplete) {
            onComplete(log);
          }
          clearInterval(monitorInterval);
        }
      } catch (err) {
        console.error('Error monitoring execution:', err);
      }
    }, interval);

    // Return cleanup function
    return () => {
      clearInterval(monitorInterval);
    };
  }, []);

  // Analysis Functions
  const analyzeExecutionPerformance = useCallback(async (logId: string): Promise<{
    efficiency: number;
    quality: number;
    costs: number;
    recommendations: string[];
  }> => {
    try {
      setCalculating(true);
      setError(null);

      const log = engine.getExecutionLog(logId);
      if (!log) {
        throw new Error('Execution log not found');
      }

      const metrics = await engine.calculateMetrics(logId);

      return {
        efficiency: metrics.executionEfficiency,
        quality: metrics.executionQuality,
        costs: log.results.totalCosts.costAsPercentage,
        recommendations: log.results.quality.recommendations
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze execution performance';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCalculating(false);
    }
  }, []);

  const compareExecutions = useCallback(async (logIds: string[]): Promise<{
    comparison: any[];
    insights: string[];
    recommendations: string[];
  }> => {
    try {
      setCalculating(true);
      setError(null);

      const logs = logIds.map(id => engine.getExecutionLog(id)).filter(Boolean) as RebalanceExecutionLog[];
      
      if (logs.length === 0) {
        throw new Error('No valid execution logs found');
      }

      // Calculate metrics for all logs
      const metricsPromises = logs.map(log => engine.calculateMetrics(log.id));
      const allMetrics = await Promise.all(metricsPromises);

      // Generate comparison data
      const comparison = logs.map((log, index) => ({
        logId: log.id,
        executionId: log.execution.executionId,
        duration: allMetrics[index].totalExecutionTime,
        efficiency: allMetrics[index].executionEfficiency,
        quality: allMetrics[index].executionQuality,
        costs: log.results.totalCosts.totalCosts,
        tradesExecuted: log.progress.tradesCompleted,
        successRate: log.progress.successRate
      }));

      // Generate insights
      const insights = [
        'Execution performance comparison completed',
        `Best efficiency: ${Math.max(...allMetrics.map(m => m.executionEfficiency)).toFixed(2)}`,
        `Best quality: ${Math.max(...allMetrics.map(m => m.executionQuality)).toFixed(2)}`
      ];

      // Generate recommendations
      const recommendations = [
        'Consider replicating best practices from top-performing executions',
        'Review execution strategies for underperforming trades',
        'Optimize order routing based on performance patterns'
      ];

      return { comparison, insights, recommendations };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare executions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCalculating(false);
    }
  }, []);

  // Event Handlers
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

  const refreshLogs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const logs = engine.getAllLogs();
      store.setLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh logs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Store data
  const logs = store.logs;
  const selectedLog = store.selectedLog;
  const currentLog = selectedLog ? store.getLog(selectedLog) : null;

  // Filtered data
  const activeLogs = logs.filter(log => log.status === 'running');
  const completedLogs = logs.filter(log => log.status === 'completed');
  const failedLogs = logs.filter(log => log.status === 'failed');
  const recentLogs = logs.filter(log => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return log.createdAt >= dayAgo;
  });

  // Statistics
  const stats = {
    total: logs.length,
    active: activeLogs.length,
    completed: completedLogs.length,
    failed: failedLogs.length,
    successRate: logs.length > 0 ? completedLogs.length / logs.length : 0,
    averageExecutionTime: logs.length > 0 
      ? logs.reduce((sum, log) => sum + log.metrics.totalExecutionTime, 0) / logs.length
      : 0
  };

  return {
    // State
    loading,
    error,
    calculating,
    generating,

    // Data
    logs,
    selectedLog,
    currentLog,
    activeLogs,
    completedLogs,
    failedLogs,
    recentLogs,
    stats,

    // Log management
    createExecutionLog,
    getExecutionLog,
    getLogByRebalanceId,
    updateExecutionLog,

    // Event logging
    logEvent,
    logTradeExecution,

    // Status management
    updateExecutionStatus,
    updateExecutionStage,
    updateProgress,

    // Error management
    logError,
    logWarning,

    // Metrics and analysis
    calculateMetrics,
    analyzeExecutionPerformance,
    compareExecutions,

    // Reporting
    generateExecutionReport,

    // Real-time
    startRealTimeUpdates,
    monitorExecution,

    // Events
    addEventListener,
    removeEventListener,

    // Utilities
    clearError,
    refreshLogs,

    // Store actions
    setSelectedLog: store.setSelectedLog,
    setView: store.setView,
    setFilter: store.setFilter,
    setSort: store.setSort
  };
};

// Specialized hooks
export const useExecutionLogManagement = () => {
  const {
    logs,
    selectedLog,
    createExecutionLog,
    updateExecutionLog,
    setSelectedLog,
    loading,
    error,
    clearError
  } = useRebalanceExecutionLog();

  return {
    logs,
    selectedLog,
    createExecutionLog,
    updateExecutionLog,
    setSelectedLog,
    loading,
    error,
    clearError
  };
};

export const useExecutionMonitoring = () => {
  const {
    activeLogs,
    monitorExecution,
    startRealTimeUpdates,
    updateProgress,
    updateExecutionStatus,
    updateExecutionStage,
    error,
    clearError
  } = useRebalanceExecutionLog();

  return {
    activeLogs,
    monitorExecution,
    startRealTimeUpdates,
    updateProgress,
    updateExecutionStatus,
    updateExecutionStage,
    error,
    clearError
  };
};

export const useExecutionAnalysis = () => {
  const {
    calculateMetrics,
    analyzeExecutionPerformance,
    compareExecutions,
    generateExecutionReport,
    calculating,
    generating,
    error,
    clearError
  } = useRebalanceExecutionLog();

  return {
    calculateMetrics,
    analyzeExecutionPerformance,
    compareExecutions,
    generateExecutionReport,
    calculating,
    generating,
    error,
    clearError
  };
};

export const useExecutionEvents = () => {
  const {
    logEvent,
    logTradeExecution,
    logError,
    logWarning,
    addEventListener,
    removeEventListener,
    error,
    clearError
  } = useRebalanceExecutionLog();

  return {
    logEvent,
    logTradeExecution,
    logError,
    logWarning,
    addEventListener,
    removeEventListener,
    error,
    clearError
  };
}; 