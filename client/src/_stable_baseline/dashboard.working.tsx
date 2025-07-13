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
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowUp, ArrowDown, TrendingUp, Zap, Eye, BarChart3, Wallet, Plus, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { useTrialStatus } from '@/hooks/use-trial-status';
import { useHoldings } from '@/hooks/use-holdings';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { useOnboardingProgress } from '@/hooks/use-onboarding-progress';
import { usePaperTradingAccount } from '@/hooks/use-paper-trading';
import { cn } from '@/lib/utils';
import { AuthReadyGuard } from '@/components/AuthReadyGuard';

interface Holding {
  id: string;
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  change: number;
  changePercent: number;
  allocation: number;
  type: 'equity' | 'crypto';
  lastUpdated: Date;
  trades: {
    id: number;
    entryPrice: string | number;
    amount: string | number;
    entryTime: Date;
    strategy?: string;
  }[];
}

interface PaperTradingAccount {
  id: number;
  name: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dashboard page - Main landing page after login
 */
export default function DashboardPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeStrategy, setActiveStrategy] = useState('Aggressive');
  const { data: holdings = [], isLoading: isLoadingHoldings } = useHoldings();
  const { data: trialStatus, isLoading: isLoadingTrial } = useTrialStatus();
  const { data: paperTradingAccount, isLoading: isLoadingPaper } = usePaperTradingAccount();
  
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
  
  // Fetch trades
  const { data: trades } = useQuery({
    queryKey: ['/api/trades'],
    enabled: !!user,
    staleTime: 60000
  });
  
  // Fetch strategies
  const { data: strategies } = useQuery({
    queryKey: ['/api/strategies'],
    enabled: !!user,
    staleTime: 60000
  });
  
  // Trading signals removed from dashboard as they are now in the Strategies & Signals section
  
  // Fetch whale activities
  const { data: whaleActivities } = useQuery({
    queryKey: ['/api/whale-activities'],
    enabled: !!user,
    staleTime: 60000,
    select: (data) => {
      if (!Array.isArray(data)) return [];
      // Only return the 3 most recent whale activities
      return data.slice(0, 3);
    }
  });
  
  // Fetch market events
  const { data: marketEvents } = useQuery({
    queryKey: ['/api/market-events'],
    staleTime: 60000,
    select: (data) => {
      if (!Array.isArray(data)) return [];
      // Only return the 3 most recent market events
      return data.slice(0, 3);
    }
  });

  // Transform holdings data for the dashboard
  const portfolioData = React.useMemo(() => {
    if (!holdings) return [];
    
    return holdings.map(holding => ({
      symbol: holding.symbol,
      currentPrice: formatCurrency(holding.currentPrice),
      change: holding.change.toFixed(2),
      changePercent: holding.changePercent.toFixed(2),
      holdings: holding.quantity.toString(),
      value: formatCurrency(holding.value),
      allocation: holding.allocation,
      type: holding.type,
    }));
  }, [holdings]);
  
  // Calculate asset type allocation data
  const assetTypeAllocationData = React.useMemo(() => {
    if (!holdings) return [];
    
    const equityHoldings = holdings.filter(h => h.type === 'equity');
    const cryptoHoldings = holdings.filter(h => h.type === 'crypto');
    
    const equitiesValue = equityHoldings.reduce((sum, item) => sum + item.value, 0);
    const cryptoValue = cryptoHoldings.reduce((sum, item) => sum + item.value, 0);
    const totalValue = equitiesValue + cryptoValue;
    
    return [
      { 
        name: 'Equities', 
        value: parseFloat(((equitiesValue / totalValue) * 100).toFixed(1)), 
        color: '#3b82f6',
        amount: equitiesValue
      },
      { 
        name: 'Crypto', 
        value: parseFloat(((cryptoValue / totalValue) * 100).toFixed(1)), 
        color: '#10b981',
        amount: cryptoValue
      }
    ];
  }, [holdings]);
  
  // Strategy allocation data for pie chart
  const strategyAllocationData = [
    { name: 'Stocks', value: 39.4, color: '#3b82f6' },
    { name: 'Cash', value: 20.6, color: '#06b6d4' },
    { name: 'High Growth', value: 16.7, color: '#ec4899' },
    { name: 'P/E Funds', value: 23.3, color: '#a855f7' },
  ];
  
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

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate('/login');
    }
  }, [user, isLoadingAuth, navigate]);

  // Combined loading state
  const isLoading = isLoadingAuth || isLoadingTrial || isLoadingPaper || isLoadingAccounts;

  return (
    // Prevent premature rendering while auth context is loading to avoid race conditions
    // during auth state transitions (e.g., after paper trading account creation)
    <AuthReadyGuard>
      {/* Show loading state only if we're loading essential data */}
      {isLoading ? (
        <PageLayout>
          <div className="container mx-auto py-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </PageLayout>
      ) : !user ? (
        null
      ) : !user.hasCompletedOnboarding ? (
        <OnboardingFlow />
      ) : !isLoadingPaper && !paperTradingAccount ? (
        <PageLayout>
          <div className="container mx-auto py-6">
            <Card className="w-full max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>Welcome to StackMotive</CardTitle>
                <CardDescription>Let's get you started with paper trading</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <p className="text-center text-muted-foreground">
                  Create a paper trading account to start practicing with virtual funds.
                </p>
                <Button 
                  onClick={() => navigate('/paper-trading/new')}
                  className="w-full max-w-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Paper Trading Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageLayout>
      ) : trialStatus && !trialStatus.isActive ? (
        <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Trial Period Ended</CardTitle>
              <CardDescription>
                Your 7-day trial period has expired. Thank you for testing StackMotive!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We hope you enjoyed exploring our platform. Stay tuned for our official launch!
              </p>
              <Button onClick={() => navigate('/feedback')} variant="outline">
                Share Your Feedback
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : !isLoadingHoldings && holdings.length === 0 ? (
        <PageLayout>
          <div className="container mx-auto py-6">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome to StackMotive
              </h1>
              <p className="text-muted-foreground">
                Start building your mock portfolio with {paperTradingAccount ? formatCurrency(paperTradingAccount.initialBalance) : '$100,000'} in virtual funds.
                Test your trading strategies without risking real money.
              </p>

              {trialStatus && trialStatus.daysRemaining > 0 && (
                <Card className="bg-primary/5 border-primary">
                  <CardContent className="py-3">
                    <p className="text-sm">
                      Trial period: <span className="font-medium">{trialStatus.daysRemaining} days remaining</span>
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button onClick={() => navigate('/trading/trade')} size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Position
                </Button>
                <Button onClick={() => navigate('/trading/strategies')} variant="outline" size="lg">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Browse Strategies
                </Button>
              </div>
            </div>
          </div>
        </PageLayout>
      ) : (
        // Regular dashboard with holdings
        <PageLayout>
          <div className="container mx-auto py-6 space-y-6">
            {/* Welcome Card */}
            {user?.hasCompletedOnboarding && !isLoadingPaper && !paperTradingAccount && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to StackMotive!</CardTitle>
              <CardDescription>
                You're all set up. Let's start your trading journey with a paper trading account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                With a paper trading account, you can:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Practice trading with virtual funds</li>
                <li>Test your strategies risk-free</li>
                <li>Track your performance in real-time</li>
                <li>Learn from simulated market conditions</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/paper-trading/new')} className="w-full">
                Create Paper Trading Account
              </Button>
            </CardFooter>
          </Card>
        )}
        {/* Trial status banner */}
        {trialStatus && trialStatus.daysRemaining > 0 && (
          <Card className="bg-primary/5 border-primary">
            <CardContent className="py-3 text-center">
              <p className="text-sm">
                Trial period: <span className="font-medium">{trialStatus.daysRemaining} days remaining</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Regular dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Portfolio Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
                <CardDescription>
                  Your paper trading portfolio performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="col-span-1 md:col-span-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                        <p className="text-2xl font-bold">
                          {paperTradingAccount ? formatCurrency(paperTradingAccount.currentBalance) : '$0.00'}
                        </p>
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          <span>Updated real-time</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Initial Balance</p>
                        <p className="text-2xl font-bold">
                          {paperTradingAccount ? formatCurrency(paperTradingAccount.initialBalance) : '$0.00'}
                        </p>
                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          <span>Paper Trading</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">P&L</p>
                        <p className="text-2xl font-bold text-green-600">
                          {paperTradingAccount ? formatCurrency(paperTradingAccount.currentBalance - paperTradingAccount.initialBalance) : '$0.00'}
                        </p>
                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          <span>Since Start</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetTypeAllocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={40}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {assetTypeAllocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-sm font-medium text-muted-foreground">Asset Allocation</p>
                      <div className="flex justify-center gap-4 mt-2">
                        {assetTypeAllocationData.map((entry, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">24h Change</TableHead>
                        <TableHead className="text-right">Holdings</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Allocation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolioData.map((asset, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {asset.symbol}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{asset.currentPrice}</TableCell>
                          <TableCell className={cn(
                            "text-right",
                            parseFloat(asset.changePercent) > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {asset.changePercent}%
                          </TableCell>
                          <TableCell className="text-right">{asset.holdings}</TableCell>
                          <TableCell className="text-right">{asset.value}</TableCell>
                          <TableCell className="text-right">{asset.allocation.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Column 2: Strategy & Signals */}
          <div className="space-y-6">

            
            {/* Strategy Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Strategy & Signals</CardTitle>
                    <CardDescription>Active strategies and recommendations</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/trading/strategies')}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
                    >
                      <Zap className="mr-2 h-4 w-4 text-purple-600" />
                      All Strategies
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-sm text-purple-900">Active Strategy</h3>
                    <Select value={activeStrategy} onValueChange={handleStrategyChange}>
                      <SelectTrigger className="h-7 text-xs bg-white border-purple-200 w-32">
                        <SelectValue placeholder="Select Strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Trading Strategies</SelectLabel>
                          <SelectItem value="Aggressive">Aggressive</SelectItem>
                          <SelectItem value="Balanced">Balanced</SelectItem>
                          <SelectItem value="Defensive">Defensive</SelectItem>
                          <SelectItem value="Income">Income</SelectItem>
                          <SelectItem value="Growth">Growth</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-start space-x-2 mb-4">
                    <Badge variant={activeStrategy === 'Aggressive' ? 'default' : 'outline'} className={activeStrategy === 'Aggressive' ? 'bg-purple-500' : 'text-purple-700 border-purple-200'}>
                      Aggressive
                    </Badge>
                    <Badge variant={activeStrategy === 'Balanced' ? 'default' : 'outline'} className={activeStrategy === 'Balanced' ? 'bg-blue-500' : 'text-blue-700 border-blue-200'}>
                      Balanced
                    </Badge>
                    <Badge variant={activeStrategy === 'Defensive' ? 'default' : 'outline'} className={activeStrategy === 'Defensive' ? 'bg-green-500' : 'text-green-700 border-green-200'}>
                      Defensive
                    </Badge>
                  </div>
                
                  <div>
                    <h3 className="text-xs font-medium mb-2 text-purple-900">Strategy Allocation</h3>
                    <div className="h-44 -mt-2 -mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={strategyAllocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            paddingAngle={2}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {strategyAllocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value}%`, '']}
                            contentStyle={{ borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                          />
                          <Legend 
                            layout="vertical"
                            verticalAlign="middle" 
                            align="right"
                            wrapperStyle={{ fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="flex justify-between gap-3 mt-3">
                    <Button variant="outline" size="sm" className="w-full bg-white border-purple-200 text-purple-700 hover:bg-purple-50">
                      Rebalance
                    </Button>
                    <Button variant="outline" size="sm" className="w-full bg-white border-purple-200 text-purple-700 hover:bg-purple-50">
                      Backtest
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-sm text-blue-900 mb-3">Latest Signals</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-100 shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm font-medium">MACD Buy</span>
                        <span className="text-xs ml-2 text-gray-500">ARKK</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">BUY</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-100 shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-sm font-medium">Whale Activity</span>
                        <span className="text-xs ml-2 text-gray-500">BTC</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">BUY</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-100 shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm font-medium">RSI Overbought</span>
                        <span className="text-xs ml-2 text-gray-500">TSLA</span>
                      </div>
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">SELL</Badge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" className="w-full bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => navigate('/trading/signals')}>
                      View All Signals
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Trading Queue Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Active Trade Queue</CardTitle>
                    <CardDescription>Pending and queued trades</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                      <span className="h-2 w-2 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                      Auto-Trading Active
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-lg border border-indigo-100 p-4">
                  <div className="mb-3 flex justify-between items-center">
                    <h3 className="font-medium text-sm text-indigo-900">Upcoming Trades</h3>
                    <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-700">
                      4 Pending
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-2 bg-white rounded border border-red-100 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600 mr-2">
                            <span className="font-semibold text-xs">TSLA</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium flex items-center">
                              <span className="text-red-600 font-semibold">SELL</span>
                              <span className="mx-1">•</span>
                              <span>40 shares</span>
                            </div>
                            <div className="text-xs text-gray-500">Strategy: MACD + RSI Cross</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Pending</Badge>
                      </div>
                    </div>
                    
                    <div className="p-2 bg-white rounded border border-green-100 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600 mr-2">
                            <span className="font-semibold text-xs">BTC</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium flex items-center">
                              <span className="text-green-600 font-semibold">BUY</span>
                              <span className="mx-1">•</span>
                              <span>0.3 BTC</span>
                            </div>
                            <div className="text-xs text-gray-500">Whale Activity Signal</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Pending</Badge>
                      </div>
                    </div>
                    
                    <div className="p-2 bg-white rounded border border-green-100 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600 mr-2">
                            <span className="font-semibold text-xs">NVDA</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium flex items-center">
                              <span className="text-green-600 font-semibold">BUY</span>
                              <span className="mx-1">•</span>
                              <span>15 shares</span>
                            </div>
                            <div className="text-xs text-gray-500">News Sentiment + Volume</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Pending</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/trading/trade')} className="flex-1 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Manual Trade
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/trading/queue')} className="flex-1 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <Eye className="mr-2 h-4 w-4" />
                      View Queue
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-100 p-4">
                  <div className="mb-3">
                    <h3 className="font-medium text-sm text-amber-900">Trade Stats (30 Days)</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-2 rounded border border-amber-100 shadow-sm">
                      <div className="text-xs text-gray-500">Win Rate</div>
                      <div className="text-lg font-bold text-amber-700">68.5%</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100 shadow-sm">
                      <div className="text-xs text-gray-500">Avg. Gain</div>
                      <div className="text-lg font-bold text-green-600">+8.4%</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100 shadow-sm">
                      <div className="text-xs text-gray-500">Avg. Loss</div>
                      <div className="text-lg font-bold text-red-600">-3.2%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Bottom Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Button onClick={() => navigate('/trading/trade')} className="flex-1">
            <Wallet className="mr-2 h-4 w-4" />
            Portfolio Management
          </Button>
          <Button onClick={() => navigate('/trading/strategies')} className="flex-1">
            <TrendingUp className="mr-2 h-4 w-4" />
            Strategy Builder
          </Button>
          <Button onClick={() => navigate('/whale-tracking')} className="flex-1">
            <Eye className="mr-2 h-4 w-4" />
            Whale Tracking
          </Button>
        </div>
          </div>
        </PageLayout>
      )}
    </AuthReadyGuard>
  );
}