import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface BacktestSession {
  id: number;
  strategyId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  symbol: string;
  interval: string;
  initialCapital: string;
  finalCapital: string | null;
  profitLoss: string | null;
  profitLossPercentage: string | null;
  maxDrawdown: string | null;
  winRate: string | null;
  totalTrades: number | null;
  winningTrades: number | null;
  losingTrades: number | null;
  sharpeRatio: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt: Date | null;
  strategy: {
    name: string;
    description: string | null;
  };
}

export function useBacktestSessions() {
  return useQuery({
    queryKey: ['backtestSessions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/backtest-sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch backtest sessions');
      }
      const data = await response.json();
      return data as BacktestSession[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds to update running sessions
  });
} 