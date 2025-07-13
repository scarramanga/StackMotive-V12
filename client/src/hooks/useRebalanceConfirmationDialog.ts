// Block 27: Rebalance Confirmation Dialog - Hook
// React hook for rebalance confirmation dialog management

import { useState, useEffect, useCallback } from 'react';
import { RebalanceConfirmationDialogEngine } from '../engines/RebalanceConfirmationDialogEngine';
import { useRebalanceConfirmationDialogStore } from '../store/rebalanceConfirmationDialogStore';
import {
  RebalanceConfirmationDialog,
  RebalanceData,
  DialogConfig,
  ValidationResult,
  UserAction,
  RebalanceImpact
} from '../types/rebalanceConfirmationDialog';

export const useRebalanceConfirmationDialog = () => {
  const engine = RebalanceConfirmationDialogEngine.getInstance();
  const store = useRebalanceConfirmationDialogStore();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Dialog Management
  const createDialog = useCallback(async (
    rebalanceData: RebalanceData,
    config?: Partial<DialogConfig>
  ): Promise<RebalanceConfirmationDialog> => {
    try {
      setLoading(true);
      setError(null);

      const dialog = engine.createDialog(rebalanceData, config);
      store.addDialog(dialog);

      return dialog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create dialog';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const openDialog = useCallback(async (id: string): Promise<RebalanceConfirmationDialog> => {
    try {
      setLoading(true);
      setError(null);

      const dialog = engine.openDialog(id);
      store.updateDialog(id, dialog);
      store.setSelectedDialog(id);

      return dialog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open dialog';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeDialog = useCallback(async (id: string): Promise<RebalanceConfirmationDialog> => {
    try {
      setLoading(true);
      setError(null);

      const dialog = engine.closeDialog(id);
      store.updateDialog(id, dialog);
      
      if (store.selectedDialog === id) {
        store.setSelectedDialog(null);
      }

      return dialog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close dialog';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDialog = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = engine.deleteDialog(id);
      if (success) {
        store.removeDialog(id);
        if (store.selectedDialog === id) {
          store.setSelectedDialog(null);
        }
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete dialog';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Step Navigation
  const nextStep = useCallback(async (dialogId: string): Promise<RebalanceConfirmationDialog> => {
    try {
      setLoading(true);
      setError(null);

      const dialog = engine.nextStep(dialogId);
      store.updateDialog(dialogId, dialog);

      return dialog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to go to next step';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const previousStep = useCallback(async (dialogId: string): Promise<RebalanceConfirmationDialog> => {
    try {
      setLoading(true);
      setError(null);

      const dialog = engine.previousStep(dialogId);
      store.updateDialog(dialogId, dialog);

      return dialog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to go to previous step';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const goToStep = useCallback(async (dialogId: string, stepIndex: number): Promise<RebalanceConfirmationDialog> => {
    try {
      setLoading(true);
      setError(null);

      const dialog = engine.goToStep(dialogId, stepIndex);
      store.updateDialog(dialogId, dialog);

      return dialog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to go to step';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Validation
  const validateStep = useCallback(async (dialogId: string, stepIndex: number): Promise<ValidationResult> => {
    try {
      setValidating(true);
      setError(null);

      const dialog = engine.getDialog(dialogId);
      if (!dialog) {
        throw new Error('Dialog not found');
      }

      const result = engine.validateStep(dialog, stepIndex);
      
      // Update dialog validation state
      store.updateDialog(dialogId, { validation: result });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate step';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setValidating(false);
    }
  }, []);

  const validateDialog = useCallback(async (dialogId: string): Promise<ValidationResult> => {
    try {
      setValidating(true);
      setError(null);

      const result = engine.validateDialog(dialogId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate dialog';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setValidating(false);
    }
  }, []);

  // User Actions
  const recordUserAction = useCallback(async (
    dialogId: string,
    action: string,
    target: string,
    value?: any
  ): Promise<UserAction> => {
    try {
      const userAction = engine.recordUserAction(dialogId, action, target, value);
      
      // Update store
      const dialog = engine.getDialog(dialogId);
      if (dialog) {
        store.updateDialog(dialogId, dialog);
      }

      return userAction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record user action';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Confirmation and Execution
  const confirmRebalance = useCallback(async (dialogId: string): Promise<void> => {
    try {
      setConfirming(true);
      setError(null);

      await engine.confirmRebalance(dialogId);
      
      // Update dialog state
      const dialog = engine.getDialog(dialogId);
      if (dialog) {
        store.updateDialog(dialogId, dialog);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm rebalance';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setConfirming(false);
    }
  }, []);

  const cancelRebalance = useCallback(async (dialogId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      engine.cancelRebalance(dialogId);
      
      // Update dialog state
      const dialog = engine.getDialog(dialogId);
      if (dialog) {
        store.updateDialog(dialogId, dialog);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel rebalance';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Analysis
  const analyzeRebalanceImpact = useCallback(async (rebalanceData: RebalanceData): Promise<RebalanceImpact> => {
    try {
      setLoading(true);
      setError(null);

      const impact = await engine.analyzeRebalanceImpact(rebalanceData);
      return impact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze rebalance impact';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
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

  const getDialog = useCallback((id: string): RebalanceConfirmationDialog | undefined => {
    return engine.getDialog(id);
  }, []);

  // Store data
  const dialogs = store.dialogs;
  const selectedDialog = store.selectedDialog;
  const currentDialog = selectedDialog ? store.getDialog(selectedDialog) : null;

  // Filtered data
  const openDialogs = dialogs.filter(d => d.isOpen);
  const expiredDialogs = dialogs.filter(d => d.expiresAt && d.expiresAt < new Date());

  return {
    // State
    loading,
    error,
    validating,
    confirming,

    // Data
    dialogs,
    selectedDialog,
    currentDialog,
    openDialogs,
    expiredDialogs,

    // Dialog actions
    createDialog,
    openDialog,
    closeDialog,
    deleteDialog,

    // Navigation
    nextStep,
    previousStep,
    goToStep,

    // Validation
    validateStep,
    validateDialog,

    // User actions
    recordUserAction,

    // Confirmation
    confirmRebalance,
    cancelRebalance,

    // Analysis
    analyzeRebalanceImpact,

    // Events
    addEventListener,
    removeEventListener,

    // Utilities
    clearError,
    getDialog,

    // Store actions
    setSelectedDialog: store.setSelectedDialog
  };
};

// Specialized hooks
export const useDialogManagement = () => {
  const {
    dialogs,
    selectedDialog,
    createDialog,
    openDialog,
    closeDialog,
    deleteDialog,
    setSelectedDialog,
    loading,
    error,
    clearError
  } = useRebalanceConfirmationDialog();

  return {
    dialogs,
    selectedDialog,
    createDialog,
    openDialog,
    closeDialog,
    deleteDialog,
    setSelectedDialog,
    loading,
    error,
    clearError
  };
};

export const useDialogNavigation = () => {
  const {
    currentDialog,
    nextStep,
    previousStep,
    goToStep,
    loading,
    error,
    clearError
  } = useRebalanceConfirmationDialog();

  return {
    currentDialog,
    nextStep,
    previousStep,
    goToStep,
    loading,
    error,
    clearError
  };
};

export const useDialogValidation = () => {
  const {
    validateStep,
    validateDialog,
    validating,
    error,
    clearError
  } = useRebalanceConfirmationDialog();

  return {
    validateStep,
    validateDialog,
    validating,
    error,
    clearError
  };
};

export const useRebalanceConfirmation = () => {
  const {
    confirmRebalance,
    cancelRebalance,
    confirming,
    error,
    clearError
  } = useRebalanceConfirmationDialog();

  return {
    confirmRebalance,
    cancelRebalance,
    confirming,
    error,
    clearError
  };
};

export const useRebalanceAnalysis = () => {
  const {
    analyzeRebalanceImpact,
    loading,
    error,
    clearError
  } = useRebalanceConfirmationDialog();

  return {
    analyzeRebalanceImpact,
    loading,
    error,
    clearError
  };
}; 