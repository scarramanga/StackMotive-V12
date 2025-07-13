import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useSessionStore } from '../../store/session';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowUp, ArrowDown, TrendingUp, Zap, Eye, BarChart3, Wallet, Plus, ArrowRight, DollarSign, TrendingDown, RefreshCw } from 'lucide-react';
import { useTrialStatus } from '@/hooks/use-trial-status';
import { useDashboardData, useRefreshDashboard } from '@/hooks/use-dashboard-data';
import { useOnboardingProgress } from '@/hooks/use-onboarding-progress';
import { cn } from '@/lib/utils';
import RecentTrades from '@/components/dashboard/recent-trades';
import { apiRequest } from '@/lib/queryClient';
import { StrategyPerformanceChart } from '@/components/charts/StrategyPerformanceChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StrategySignals from '@/components/ui/StrategySignals';
import SummaryCard from '@/components/ui/SummaryCard';
import TabSection from '@/components/ui/TabSection';
import WidgetContainer from '@/components/ui/WidgetContainer';
import AssetViewTabs from '@/components/ui/AssetViewTabs';

/**
 * Unified Paper Trading Dashboard - Uses backend endpoint for all data
 */
export default function DashboardPage() {

  const user = useSessionStore(s => s.user);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // 🛡️ Triple-guard shielding flags
  const useTourMode = false; // Set to true for tour mode
  const showMockDistributionView = false; // Set to true to show mock distribution cards
  const { data: trialStatus, isLoading: isLoadingTrial } = useTrialStatus();
  
  // 🚀 NEW: Use unified dashboard data endpoint
  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError } = useDashboardData();
  const refreshDashboard = useRefreshDashboard();
  
  // 🔍 Debug logging to track data flow
  React.useEffect(() => {

  }, [dashboardData]);
  
  // Format currency
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };
  
  // Fetch trading accounts
  const { data: tradingAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['/api/trading-accounts'],
    enabled: !!user,
    staleTime: 60000
  });
  
  // Fetch watchlist items
  const { data: watchlistItems } = useQuery({
    queryKey: ['/api/watchlist'],
    enabled: !!user,
    staleTime: 60000
  });
  
  // Fetch strategies
  const { data: strategies } = useQuery({
    queryKey: ['/api/strategies'],
    enabled: !!user,
    staleTime: 60000
  });
  
  // Fetch whale activities
  const { data: whaleActivities } = useQuery({
    queryKey: ['/api/whale-activities'],
    enabled: !!user,
    staleTime: 60000,
    select: (data) => {
      if (!Array.isArray(data)) return [];
      return data.slice(0, 3);
    }
  });
  
  // Fetch market events
  const { data: marketEvents } = useQuery({
    queryKey: ['/api/market-events'],
    staleTime: 60000,
    select: (data) => {
      if (!Array.isArray(data)) return [];
      return data.slice(0, 3);
    }
  });

  // 🚀 SIMPLIFIED: Portfolio data directly from backend
  const portfolioData = React.useMemo(() => {
    if (!dashboardData) {
      return {
        totalValue: 0,
        cashBalance: 0,
        holdingsValue: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        isPositive: false,
        accountValue: 0,
        totalChangeValue: 0,
        totalChangePercent: 0,
        totalChangeIsPositive: false,
        assetPerformanceValue: 0,
        assetPerformancePercent: 0,
        assetPerformanceIsPositive: false,
        hasTradeHistory: false,
        initialBalance: 0
      };
    }


    
    // Calculate total change since start
    const totalAccountValue = dashboardData.totalPortfolioValue;
    const totalChangeValue = totalAccountValue - dashboardData.initialBalance;
    const totalChangePercent = (dashboardData.initialBalance > 0) ? 
      (totalChangeValue / dashboardData.initialBalance) * 100 : 0;

    return {
      // Legacy fields (for backward compatibility)
      totalValue: dashboardData.totalPortfolioValue,
      totalPnL: dashboardData.totalProfitLoss,
      totalPnLPercent: dashboardData.totalProfitLossPercent,
      isPositive: dashboardData.totalProfitLoss >= 0,
      // Core data from backend
      cashBalance: dashboardData.cashBalance,
      holdingsValue: dashboardData.totalHoldingsValue,
      initialBalance: dashboardData.initialBalance,
      // Calculated total change
      accountValue: totalAccountValue,
      totalChangeValue: totalChangeValue,
      totalChangePercent: totalChangePercent,
      totalChangeIsPositive: totalChangeValue >= 0,
      // Asset performance from backend
      assetPerformanceValue: dashboardData.assetPerformance.assetPerformanceValue,
      assetPerformancePercent: dashboardData.assetPerformance.assetPerformancePercent,
      assetPerformanceIsPositive: dashboardData.assetPerformance.assetPerformanceIsPositive,
      hasTradeHistory: dashboardData.assetPerformance.hasTradeHistory
    };
  }, [dashboardData]);

  // Transform holdings for display table
  const holdingsTableData = React.useMemo(() => {
    if (!dashboardData?.holdings) return [];
    
    return dashboardData.holdings.map(holding => ({
      symbol: holding.symbol,
      currentPrice: formatCurrency(holding.currentPrice),
      change: (holding.profitLoss / holding.costBasis * 100).toFixed(2) || '0.00',
      changePercent: holding.profitLossPercent.toFixed(2) || '0.00',
      holdings: holding.quantity.toString() || '0',
      value: formatCurrency(holding.totalValue || 0),
      allocation: holding.allocation || 0,
      type: holding.type || 'equity',
    }));
  }, [dashboardData?.holdings]);
  
  // Asset type allocation data (should come from backend in future)
  const assetTypeAllocationData = React.useMemo(() => {
    // TODO: Replace with backend-provided allocation data
    if (!dashboardData?.holdings || dashboardData.holdings.length === 0) return [];
    
    // For now, use a simple allocation based on holdings presence
    const hasEquities = dashboardData.holdings.some(h => h.type === 'equity');
    const hasCrypto = dashboardData.holdings.some(h => h.type === 'crypto');
    
    const data = [];
    if (hasEquities) data.push({ name: 'Equities', value: 70, color: '#3b82f6', amount: 0 });
    if (hasCrypto) data.push({ name: 'Crypto', value: 30, color: '#10b981', amount: 0 });
    
    return data;
  }, [dashboardData?.holdings]);
  
  // Strategy allocation data for pie chart
  const strategyAllocationData = [
    { name: 'Stocks', value: 39.4, color: '#3b82f6' },
    { name: 'Cash', value: 20.6, color: '#06b6d4' },
    { name: 'High Growth', value: 16.7, color: '#ec4899' },
    { name: 'P/E Funds', value: 23.3, color: '#a855f7' },
  ];
  
  // Get class for change percent
  const getChangeClass = (change: string) => {
    const numChange = parseFloat(change);
    return numChange > 0 
      ? 'text-green-600' 
      : numChange < 0 
        ? 'text-red-600'
        : 'text-gray-600';
  };
  
  // Get icon for change percent
  const getChangeIcon = (change: string) => {
    const numChange = parseFloat(change);
    return numChange > 0 
      ? <ArrowUp className="h-3 w-3 text-green-600" />
      : numChange < 0 
        ? <ArrowDown className="h-3 w-3 text-red-600" />
        : null;
  };
  
  const handleStrategyChange = (value: string) => {
    setActiveStrategy(value);
  };

  // Portfolio Performance Chart Data (Placeholder/Mock Data)
  const portfolioPerformanceData = React.useMemo(() => {
    if (!dashboardData) return [];
    
    // TODO: Replace with real backend time series data from /api/user/paper-trading-account/{id}/performance-history
    // For now, generate realistic mock data based on current portfolio value
    const currentValue = dashboardData.totalPortfolioValue;
    const data = [];
    const today = new Date();
    
    // Generate 30 days of mock portfolio performance data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create realistic portfolio value progression
      // Start from initial balance and gradually move toward current value with some volatility
      const dayProgress = (29 - i) / 29; // 0 to 1
      const baseValue = dashboardData.initialBalance + (currentValue - dashboardData.initialBalance) * dayProgress;
      
      // Add some realistic daily volatility (±2% random movement)
      const volatility = 0.02;
      const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
      const portfolioValue = Math.max(baseValue * randomFactor, dashboardData.initialBalance * 0.8); // Don't go below 80% of initial
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolioValue: Math.round(portfolioValue)
      });
    }
    
    return data;
  }, [dashboardData]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Combined loading state
  const isLoading = isLoadingTrial || isLoadingDashboard || isLoadingAccounts;

  // Map trades to RecentTrades shape
  const recentTradesData = React.useMemo(() => {
    if (!dashboardData?.recentTrades || !Array.isArray(dashboardData.recentTrades)) {
      return [];
    }
    
    return dashboardData.recentTrades.slice(0, 3).map((trade) => ({
      id: String(trade.id),
      symbol: trade.symbol || '',
      name: trade.symbol || '',
      type: (trade.tradeType || '').toUpperCase() === 'BUY' ? 'BUY' as const : 'SELL' as const,
      entryPrice: `$${trade.price.toFixed(2)}`,
      exitPrice: null,
      profitLoss: '',
      status: 'executed' as const,
    }));
  }, [dashboardData?.recentTrades]);

  // 🔄 Manual refresh function
  const handleManualRefresh = async () => {

    refreshDashboard();
    
    setTimeout(() => {
      toast({
        title: "Dashboard Refreshed",
        description: "All portfolio data has been updated with the latest information.",
      });
    }, 500);
  };

  // Main portfolio summary metrics
  const portfolioMetrics = [
    {
      title: 'Account Value',
      value: formatCurrency(portfolioData.accountValue),
      subtitle: 'Total Portfolio + Cash',
      icon: Wallet,
      color: 'blue'
    },
    {
      title: 'Holdings Value',
      value: formatCurrency(portfolioData.holdingsValue),
      subtitle: 'Asset Holdings Only',
      icon: BarChart3,
      color: 'green'
    },
    {
      title: 'Cash Balance',
      value: formatCurrency(portfolioData.cashBalance),
      subtitle: 'Available Cash',
      icon: DollarSign,
      color: 'purple'
    },
    {
      title: 'Total Change Since Start',
      value: formatCurrency(portfolioData.totalChangeValue),
      subtitle: `${portfolioData.totalChangePercent.toFixed(2)}% vs Initial`,
      icon: portfolioData.totalChangeIsPositive ? TrendingUp : TrendingDown,
      color: portfolioData.totalChangeIsPositive ? 'green' : 'red'
    },
    {
      title: 'Performance (Assets Only)',
      value: portfolioData.hasTradeHistory ? formatCurrency(portfolioData.assetPerformanceValue) : '–',
      subtitle: portfolioData.hasTradeHistory ? `${portfolioData.assetPerformancePercent.toFixed(2)}% vs Cost Basis` : 'No trades yet',
      icon: portfolioData.assetPerformanceIsPositive ? TrendingUp : TrendingDown,
      color: portfolioData.assetPerformanceIsPositive ? 'green' : 'red'
    }
  ];

  // Example summary metrics (replace with real data as needed)
  const summaryCards = [
    {
      title: 'Account Value',
      value: formatCurrency(portfolioData.accountValue),
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
      variant: 'default' as const,
      footer: 'Total Portfolio + Cash',
    },
    {
      title: 'Holdings Value',
      value: formatCurrency(portfolioData.holdingsValue),
      icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
      variant: 'default' as const,
      footer: 'Asset Holdings Only',
    },
    {
      title: 'Cash Balance',
      value: formatCurrency(portfolioData.cashBalance),
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      variant: 'default' as const,
      footer: 'Available Cash',
    },
    {
      title: 'Total Change Since Start',
      value: formatCurrency(portfolioData.totalChangeValue),
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      variant: 'success' as const,
      footer: `${portfolioData.totalChangePercent.toFixed(2)}% vs Initial`,
    },
    {
      title: 'Performance (Assets Only)',
      value: portfolioData.hasTradeHistory ? formatCurrency(portfolioData.assetPerformanceValue) : '–',
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      variant: 'success' as const,
      footer: portfolioData.hasTradeHistory ? `${portfolioData.assetPerformancePercent.toFixed(2)}% vs Cost Basis` : 'No trades yet',
    },
  ];

  // Example strategies and signals (replace with real data as needed)
  const [activeStrategy, setActiveStrategy] = useState('Aggressive');

  // Provide a local mock for signals
  const signals = [
    { type: 'MACD Buy', symbol: 'ARKK', action: 'BUY', confidence: 'high' },
    { type: 'Whale Activity', symbol: 'BTC', action: 'BUY', confidence: 'medium' },
    { type: 'RSI Overbought', symbol: 'TSLA', action: 'SELL', confidence: 'high' },
  ];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Portfolio Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-2xl p-4 mb-4 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Holdings Table Skeleton */}
          <Card className="rounded-2xl p-4 mb-4 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart Skeleton */}
          <Card className="rounded-2xl p-4 mb-4 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="p-4">
        <div className="flex flex-col justify-center items-center h-96">
          <div className="text-lg text-red-600">Error loading dashboard</div>
          <Button onClick={handleManualRefresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Paper Trading Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track your portfolio performance and recent trading activity.</p>
          </div>
          <Button onClick={handleManualRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {summaryCards.map((card, i) => (
            <SummaryCard key={i} {...card} />
          ))}
        </div>

        {/* Strategy & Signals Section */}
        <StrategySignals
          strategies={Array.isArray(strategies) ? strategies : []}
          signals={signals}
          contextLabel="Paper"
          activeStrategy={activeStrategy}
          onStrategyChange={setActiveStrategy}
        />

        {/* Unified AssetViewTabs */}
        <AssetViewTabs
          showPerformanceTab={true}
          preferenceKey="paperAssetTab"
          renderHoldings={() => (
            <WidgetContainer title="Holdings">
              {/* Place holdings widgets here */}
              <div className="h-40 flex items-center justify-center text-muted-foreground">Holdings widgets go here</div>
            </WidgetContainer>
          )}
          renderAllocation={() => (
            <WidgetContainer title="Allocation">
              {/* Place allocation widgets here */}
              <div className="h-40 flex items-center justify-center text-muted-foreground">Allocation widgets go here</div>
            </WidgetContainer>
          )}
          renderPerformance={() => (
            <WidgetContainer title="Performance">
              {/* Place performance widgets here */}
              <div className="h-40 flex items-center justify-center text-muted-foreground">Performance widgets go here</div>
            </WidgetContainer>
          )}
        />

        {/* Strategy Performance Chart */}
        <StrategyPerformanceChart strategyName={activeStrategy} />

        {/* Recent Trades */}
        <Card className="rounded-2xl p-4 mb-4 shadow-md">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Your latest trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTrades trades={recentTradesData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 