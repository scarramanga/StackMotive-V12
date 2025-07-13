// Block 36: Rebalance Override Handler - Hook
// React hook for rebalance override handling

import { useState, useEffect, useCallback } from 'react';
import { RebalanceOverrideHandlerEngine } from '../engines/RebalanceOverrideHandlerEngine';
import { useRebalanceOverrideHandlerStore } from '../store/rebalanceOverrideHandlerStore';
import {
  RebalanceOverrideHandler,
  RebalancePlan,
  RebalanceOverride,
  OverrideStatus,
  ProcessingStage
} from '../types/rebalanceOverrideHandler';

export const useRebalanceOverrideHandler = () => {
  const engine = RebalanceOverrideHandlerEngine.getInstance();
  const store = useRebalanceOverrideHandlerStore();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Initialize store
  useEffect(() => {
    const initializeStore = async () => {
      try {
        setLoading(true);
        const handlers = engine.getAllOverrides();
        store.setHandlers(handlers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeStore();
  }, []);

  // Plan Management
  const registerRebalancePlan = useCallback(async (plan: RebalancePlan): Promise<RebalancePlan> => {
    try {
      setLoading(true);
      setError(null);

      const registeredPlan = engine.registerRebalancePlan(plan);
      return registeredPlan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register rebalance plan';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRebalancePlan = useCallback((id: string): RebalancePlan | undefined => {
    return engine.getRebalancePlan(id);
  }, []);

  // Override Management
  const createOverride = useCallback(async (
    rebalanceId: string,
    portfolioId: string,
    userId: string,
    override: RebalanceOverride
  ): Promise<RebalanceOverrideHandler> => {
    try {
      setLoading(true);
      setError(null);

      const handler = engine.createOverride(rebalanceId, portfolioId, userId, override);
      store.addHandler(handler);

      return handler;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create override';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOverride = useCallback(async (
    id: string,
    updates: Partial<RebalanceOverrideHandler>
  ): Promise<RebalanceOverrideHandler> => {
    try {
      setLoading(true);
      setError(null);

      const handler = engine.updateOverride(id, updates);
      store.updateHandler(id, handler);

      return handler;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update override';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Status Management
  const updateStatus = useCallback(async (
    id: string,
    status: OverrideStatus
  ): Promise<RebalanceOverrideHandler> => {
    try {
      setLoading(true);
      setError(null);

      const handler = engine.updateStatus(id, status);
      store.updateHandler(id, handler);

      return handler;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProcessingStage = useCallback(async (
    id: string,
    stage: ProcessingStage
  ): Promise<RebalanceOverrideHandler> => {
    try {
      setProcessing(true);
      setError(null);

      const handler = engine.updateProcessingStage(id, stage);
      store.updateHandler(id, handler);

      return handler;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update processing stage';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setProcessing(false);
    }
  }, []);

  // Approval Management
  const approveOverride = useCallback(async (
    id: string,
    approverId: string,
    comment?: string
  ): Promise<RebalanceOverrideHandler> => {
    try {
      setLoading(true);
      setError(null);

      const handler = engine.approveOverride(id, approverId, comment);
      store.updateHandler(id, handler);

      return handler;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve override';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectOverride = useCallback(async (
    id: string,
    approverId: string,
    reason: string
  ): Promise<RebalanceOverrideHandler> => {
    try {
      setLoading(true);
      setError(null);

      const handler = engine.rejectOverride(id, approverId, reason);
      store.updateHandler(id, handler);

      return handler;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject override';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Execution Management
  const executeOverride = useCallback(async (id: string): Promise<RebalanceOverrideHandler> => {
    try {
      setExecuting(true);
      setError(null);

      const handler = await engine.executeOverride(id);
      store.updateHandler(id, handler);

      return handler;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute override';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setExecuting(false);
    }
  }, []);

  // Monitoring
  const monitorOverride = useCallback(async (
    id: string,
    options: {
      interval?: number;
      onProgress?: (progress: any) => void;
      onStatus?: (status: OverrideStatus) => void;
      onComplete?: (handler: RebalanceOverrideHandler) => void;
      onError?: (error: any) => void;
    } = {}
  ): Promise<() => void> => {
    const { interval = 1000, onProgress, onStatus, onComplete, onError } = options;

    const monitorInterval = setInterval(async () => {
      try {
        const handler = engine.getOverride(id);
        if (!handler) {
          clearInterval(monitorInterval);
          return;
        }

        // Check for progress updates
        if (onProgress && handler.execution) {
          onProgress(handler.execution.progress);
        }

        // Check for status changes
        if (onStatus) {
          onStatus(handler.status);
        }

        // Check if override is complete
        if (handler.status === 'completed' || handler.status === 'failed' || handler.status === 'cancelled') {
          if (onComplete) {
            onComplete(handler);
          }
          clearInterval(monitorInterval);
        }
      } catch (err) {
        if (onError) {
          onError(err);
        }
        console.error('Error monitoring override:', err);
      }
    }, interval);

    // Return cleanup function
    return () => {
      clearInterval(monitorInterval);
    };
  }, []);

  // Analytics
  const getOverrideAnalytics = useCallback(() => {
    return engine.getOverrideAnalytics();
  }, []);

  // Utilities
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshHandlers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const handlers = engine.getAllOverrides();
      store.setHandlers(handlers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh handlers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Store data
  const handlers = store.handlers;
  const selectedHandler = store.selectedHandler;
  const currentHandler = selectedHandler ? store.getHandler(selectedHandler) : null;

  // Filtered data
  const pendingHandlers = handlers.filter(h => h.status === 'pending');
  const approvedHandlers = handlers.filter(h => h.status === 'approved');
  const executingHandlers = handlers.filter(h => h.status === 'executing');
  const completedHandlers = handlers.filter(h => h.status === 'completed');
  const failedHandlers = handlers.filter(h => h.status === 'failed');

  // Processing queue
  const queuedHandlers = handlers.filter(h => h.processing.stage === 'queued');
  const processingHandlers = handlers.filter(h => ['validating', 'approving', 'planning'].includes(h.processing.stage));

  // Analytics
  const analytics = getOverrideAnalytics();

  return {
    // State
    loading,
    error,
    executing,
    processing,

    // Data
    handlers,
    selectedHandler,
    currentHandler,
    pendingHandlers,
    approvedHandlers,
    executingHandlers,
    completedHandlers,
    failedHandlers,
    queuedHandlers,
    processingHandlers,
    analytics,

    // Plan management
    registerRebalancePlan,
    getRebalancePlan,

    // Override management
    createOverride,
    updateOverride,

    // Status management
    updateStatus,
    updateProcessingStage,

    // Approval management
    approveOverride,
    rejectOverride,

    // Execution
    executeOverride,
    monitorOverride,

    // Analytics
    getOverrideAnalytics,

    // Utilities
    clearError,
    refreshHandlers,

    // Store actions
    setSelectedHandler: store.setSelectedHandler,
    setView: store.setView,
    setFilter: store.setFilter,
    setSort: store.setSort
  };
};

// Specialized hooks
export const useOverrideManagement = () => {
  const {
    handlers,
    selectedHandler,
    createOverride,
    updateOverride,
    setSelectedHandler,
    loading,
    error,
    clearError
  } = useRebalanceOverrideHandler();

  return {
    handlers,
    selectedHandler,
    createOverride,
    updateOverride,
    setSelectedHandler,
    loading,
    error,
    clearError
  };
};

export const useOverrideApproval = () => {
  const {
    pendingHandlers,
    approveOverride,
    rejectOverride,
    loading,
    error,
    clearError
  } = useRebalanceOverrideHandler();

  return {
    pendingHandlers,
    approveOverride,
    rejectOverride,
    loading,
    error,
    clearError
  };
};

export const useOverrideExecution = () => {
  const {
    approvedHandlers,
    executingHandlers,
    executeOverride,
    monitorOverride,
    executing,
    error,
    clearError
  } = useRebalanceOverrideHandler();

  return {
    approvedHandlers,
    executingHandlers,
    executeOverride,
    monitorOverride,
    executing,
    error,
    clearError
  };
};

export const useOverrideAnalytics = () => {
  const {
    analytics,
    completedHandlers,
    failedHandlers,
    getOverrideAnalytics
  } = useRebalanceOverrideHandler();

  return {
    analytics,
    completedHandlers,
    failedHandlers,
    getOverrideAnalytics
  };
}; 