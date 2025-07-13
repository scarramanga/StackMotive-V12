import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface PaperTradingAccount {
  id: number;
  userId: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  strategyName?: string;
  lastStrategyRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Enhanced portfolio valuation fields
  cashBalance: number;
  totalHoldingsValue: number;
  totalPortfolioValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
}

export function usePaperTradingAccount() {
  return useQuery({
    queryKey: ['/api/user/paper-trading-account'],
    queryFn: async () => {
      try {
        const data = await apiRequest('GET', '/api/user/paper-trading-account');
        
        // apiRequest returns null for 404, so handle that case
        if (!data) {
          return null;
        }
        
        // 🧪 DIAGNOSTIC: Log raw API response
        console.log("🧪 Hook Result RAW API Response:", data);
        
        // 🔍 Enhanced diagnostic logging for critical portfolio fields
        console.log('📊 Paper Trading Account - Portfolio Fields Check:', {
          id: data.id,
          userId: data.userId,
          initialBalance: data.initialBalance,
          currentBalance: data.currentBalance,
          cashBalance: data.cashBalance,
          totalHoldingsValue: data.totalHoldingsValue,
          totalPortfolioValue: data.totalPortfolioValue,
          totalProfitLoss: data.totalProfitLoss,
          totalProfitLossPercent: data.totalProfitLossPercent,
          allFields: Object.keys(data)
        });
        
        const result = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          lastStrategyRunAt: data.lastStrategyRunAt ? new Date(data.lastStrategyRunAt) : undefined
        } as PaperTradingAccount;
        
        // 🧪 DIAGNOSTIC: Log final hook result
        console.log("🧪 Hook Result FINAL:", {
          cashBalance: result.cashBalance,
          totalPortfolioValue: result.totalPortfolioValue,
          totalHoldingsValue: result.totalHoldingsValue,
          totalProfitLoss: result.totalProfitLoss,
          initialBalance: result.initialBalance
        });
        
        return result;
      } catch (error) {
        console.error('Paper trading account fetch error:', error);
        // For 404 errors, return null instead of throwing
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
    refetchOnWindowFocus: false
  });
} 