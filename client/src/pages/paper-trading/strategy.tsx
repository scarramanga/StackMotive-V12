import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, TrendingUp, Repeat, Target, Clock, Activity, BarChart3 } from 'lucide-react';
import { usePaperTradingAccount } from '@/hooks/use-paper-trading';
import { BackToDashboard } from '@/components/ui/back-to-dashboard';

interface Strategy {
  name: string;
  title: string;
  description: string;
  details: string;
  icon: React.ReactNode;
  riskLevel: 'Low' | 'Medium' | 'High';
  frequency: string;
  targetAsset: string;
}

interface StrategyRecommendation {
  strategy: string;
  symbol?: string;
  action?: string;
  amount?: number;
  quantity?: number;
  reason: string;
  triggered: boolean;
  signals?: {
    symbol: string;
    current_price: number;
    rsi: number;
    macd: number;
    ma20: number;
    ma50: number;
    volume: number;
    volume_7d_avg: number;
    volume_ratio: number;
    timestamp: string;
  };
}

const strategies: Strategy[] = [
  {
    name: 'DCA Weekly',
    title: 'Dollar-Cost Averaging Weekly',
    description: 'Invest a fixed amount weekly regardless of price',
    details: 'Buys $100 worth of BTC every week. Reduces impact of volatility by spreading purchases over time. Perfect for long-term accumulation.',
    icon: <Repeat className="h-6 w-6" />,
    riskLevel: 'Low',
    frequency: 'Weekly',
    targetAsset: 'BTC'
  },
  {
    name: 'RSI Rebound',
    title: 'RSI Oversold Rebound',
    description: 'Buy when RSI indicates oversold conditions',
    details: 'Buys $50 worth of ETH when RSI drops below 30, indicating oversold conditions. Aims to catch bounces from oversold levels.',
    icon: <TrendingUp className="h-6 w-6" />,
    riskLevel: 'Medium',
    frequency: 'As needed',
    targetAsset: 'ETH'
  },
  {
    name: 'Momentum Buy',
    title: 'Momentum Breakout',
    description: 'Buy when price breaks above moving average',
    details: 'Buys $75 worth of SOL when price breaks above 50-day moving average. Follows momentum trends for potential upside.',
    icon: <Target className="h-6 w-6" />,
    riskLevel: 'Medium',
    frequency: 'As needed',
    targetAsset: 'SOL'
  },
  {
    name: 'Trend Exit',
    title: 'Trend Exit Strategy',
    description: 'Sell portion when price falls below moving average',
    details: 'Sells 25% of holdings when price drops below moving average. Helps protect profits and limit losses during downtrends.',
    icon: <Clock className="h-6 w-6" />,
    riskLevel: 'Low',
    frequency: 'As needed',
    targetAsset: 'Any holdings'
  }
];

const StrategySelector: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  // Fetch paper trading account using the proper hook
  const { data: account, isLoading: accountLoading } = usePaperTradingAccount();

  // Assign strategy mutation
  const assignStrategy = useMutation({
    mutationFn: async (strategyName: string) => {
      if (!account?.id) throw new Error('No account found');
      return await apiRequest('POST', `/api/user/paper-trading-account/${account.id}/strategy`, {
        strategyName
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Strategy Assigned',
        description: `${data.strategyName} has been assigned to your account.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/paper-trading-account'] });
      setSelectedStrategy(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  // Fetch strategy recommendations for all strategies
  const { data: strategyRecommendations = {} } = useQuery({
    queryKey: ['strategyRecommendations'],
    queryFn: async () => {
      const recommendations: Record<string, StrategyRecommendation> = {};
      
      for (const strategy of strategies) {
        try {
          recommendations[strategy.name] = await apiRequest('GET', `/api/strategy/recommendation/${encodeURIComponent(strategy.name)}`);
        } catch (error) {
          console.error(`Failed to fetch recommendation for ${strategy.name}:`, error);
        }
      }
      
      return recommendations;
    },
    enabled: !!account,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleAssignStrategy = (strategyName: string) => {
    if (!accountLoading && account?.strategyName && account.strategyName !== strategyName) {
      // Confirm replacement
      if (window.confirm(`Replace "${account.strategyName}" with "${strategyName}"?`)) {
        assignStrategy.mutate(strategyName);
      }
    } else {
      assignStrategy.mutate(strategyName);
    }
  };

  if (accountLoading) {
    return (
      <div className='p-4'>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!accountLoading && !account) {
    return (
      <div className='p-4'>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Strategy Selector
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You need to create a paper trading account first to assign strategies.
            </p>
            <Button onClick={() => window.location.href = '/paper-trading/new'}>
              Create Paper Trading Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render main content until account is loaded and available
  if (!account) {
    return (
      <div className='p-4'>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <div className="max-w-6xl mx-auto space-y-8">
        <BackToDashboard />
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Trading Strategy Selector
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Choose an automated trading strategy for your paper trading account. Each strategy 
            follows different rules and targets different assets based on market conditions.
          </p>
          
          {/* Current Strategy Display */}
          {account.strategyName && (
            <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Current Strategy: </span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {account.strategyName}
                  </Badge>
                  {account.lastStrategyRunAt && (
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      Last run: {new Date(account.lastStrategyRunAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Portfolio Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfolio Overview
            </CardTitle>
            <CardDescription>
              Current portfolio status for strategy evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Cash Balance</div>
                <div className="text-2xl font-bold">${(account.cashBalance ?? account.currentBalance ?? 0).toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Holdings Value</div>
                <div className="text-2xl font-bold">${(account.totalHoldingsValue ?? 0).toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Portfolio</div>
                <div className="text-2xl font-bold">${(account.totalPortfolioValue ?? account.currentBalance ?? 0).toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total P&L</div>
                <div className={`text-2xl font-bold ${(account.totalProfitLoss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(account.totalProfitLoss ?? 0).toLocaleString()}
                </div>
                <div className={`text-sm ${(account.totalProfitLoss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(account.totalProfitLoss ?? 0) >= 0 ? '+' : ''}{(account.totalProfitLossPercent ?? 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {strategies.map((strategy) => {
            const isSelected = selectedStrategy === strategy.name;
            const isCurrentStrategy = account.strategyName === strategy.name;
            const recommendation = strategyRecommendations[strategy.name];
            
            return (
              <Card 
                key={strategy.name}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : 
                  isCurrentStrategy ? 'ring-2 ring-green-500 shadow-lg' : 
                  'hover:shadow-md'
                }`}
                onClick={() => setSelectedStrategy(isSelected ? null : strategy.name)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {strategy.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{strategy.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {strategy.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentStrategy && (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                      {recommendation && (
                        <Badge 
                          variant={recommendation.triggered ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {recommendation.triggered ? "✅ Ready" : "⏳ Waiting"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {strategy.details}
                  </p>

                  {/* Live Signal Status */}
                  {recommendation && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Current Status</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Signal</span>
                          <Badge variant={recommendation.triggered ? "default" : "outline"} className="text-xs">
                            {recommendation.triggered ? "Triggered" : "Not Triggered"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {recommendation.reason}
                        </div>
                        {recommendation.signals && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {recommendation.symbol || strategy.targetAsset}
                            </span>
                            <span className="font-medium">
                              ${recommendation.signals.current_price.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Risk Level
                      </div>
                      <Badge 
                        variant={strategy.riskLevel === 'Low' ? 'default' : 
                                strategy.riskLevel === 'Medium' ? 'secondary' : 'destructive'}
                        className="mt-1"
                      >
                        {strategy.riskLevel}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Frequency
                      </div>
                      <div className="text-sm font-medium mt-1">{strategy.frequency}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Target Asset
                      </div>
                      <div className="text-sm font-medium mt-1">{strategy.targetAsset}</div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={isCurrentStrategy ? "outline" : "default"}
                    disabled={assignStrategy.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCurrentStrategy) {
                        handleAssignStrategy(strategy.name);
                      }
                    }}
                  >
                    {assignStrategy.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                        Assigning...
                      </>
                    ) : isCurrentStrategy ? (
                      'Currently Active'
                    ) : (
                      'Assign Strategy'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How Strategy Automation Works
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                • Strategies run automatically based on market conditions and timing rules
              </p>
              <p>
                • You can manually trigger a strategy execution or wait for automatic conditions
              </p>
              <p>
                • All trades are executed with paper money - no real funds at risk
              </p>
              <p>
                • Strategy performance can be tracked in your trading dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StrategySelector; 