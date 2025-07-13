import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface DashboardHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  costBasis: number;
  allocation: number;
  type: string;
}

export interface AssetPerformance {
  assetPerformanceValue: number;
  assetPerformancePercent: number;
  assetPerformanceIsPositive: boolean;
  costBasisFromTrades: number;
  hasTradeHistory: boolean;
}

export interface DashboardTrade {
  id: number;
  symbol: string;
  tradeType: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  id: number;
  userId: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  strategyName: string | null;
  lastStrategyRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Portfolio summary
  cashBalance: number;
  totalHoldingsValue: number;
  totalPortfolioValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  
  // Detailed breakdowns
  holdings: DashboardHolding[];
  assetPerformance: AssetPerformance;
  recentTrades: DashboardTrade[];
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      console.log('🔄 Fetching unified dashboard data from backend...');
      const data = await apiRequest('GET', '/api/user/paper-trading-account/dashboard');
      console.log('✅ Dashboard data received:', data);
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 60000, // Refresh every 60 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  
  return () => {
    console.log('🔄 Manual refresh triggered');
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
  };
} 