// Block 101 Implementation
import { useAuth } from './useAuth';
import { usePortfolio } from '../contexts/PortfolioContext';
import { OverlayDecision, UserStrategy } from './useStrategyOverlay';

export interface ExecutionResult {
  success: boolean;
  error?: string;
  message?: string;
}

function hasUserId(user: any): user is { userId: string } {
  return user && typeof user.userId === 'string';
}

export function useExecutionHooks() {
  // Block 101 Implementation
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();

  const postExecution = async (payload: any): Promise<ExecutionResult> => {
    if (typeof window === 'undefined' || !user || !activeVaultId) {
      return { success: false, error: 'SSR or missing session/vault' };
    }
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(hasUserId(user) ? { Authorization: user.userId } : {}),
        },
        body: JSON.stringify({ ...payload, vaultId: activeVaultId, userId: hasUserId(user) ? user.userId : undefined }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Execution failed', message: data.message };
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unknown error' };
    }
  };

  const triggerDCAExecution = async (decision: OverlayDecision): Promise<ExecutionResult> => {
    return postExecution({ type: 'dca', decision });
  };

  const triggerStopLoss = async (asset: string, threshold: number): Promise<ExecutionResult> => {
    return postExecution({ type: 'stoploss', asset, threshold });
  };

  const triggerTakeProfit = async (asset: string, threshold: number): Promise<ExecutionResult> => {
    return postExecution({ type: 'takeprofit', asset, threshold });
  };

  const triggerRebalance = async (strategy: UserStrategy): Promise<ExecutionResult> => {
    return postExecution({ type: 'rebalance', strategy });
  };

  return {
    triggerDCAExecution,
    triggerStopLoss,
    triggerTakeProfit,
    triggerRebalance,
  };
} 