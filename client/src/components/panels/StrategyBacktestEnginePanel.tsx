import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toast } from '@/components/ui/use-toast';
import { 
  TrendingUp, 
  Play, 
  Stop, 
  BarChart3, 
  Activity, 
  Target, 
  Settings,
  Search,
  Plus,
  Eye,
  Download,
  Trash2,
  LineChart,
  PieChart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  TrendingDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import {
  useBacktests,
  useBacktest,
  useCreateBacktest,
  useRunBacktest,
  useStopBacktest,
  useStrategyBacktestUtils,
  type BacktestStrategy,
  type BacktestRequest,
  type BacktestQuery,
  type BacktestStatus,
  type StrategyType,
  type PerformanceMetrics,
} from '@/services/strategyBacktestEngineService';

interface StrategyBacktestEnginePanelProps {
  userId: string;
  className?: string;
}

export function StrategyBacktestEnginePanel({ 
  userId, 
  className = '' 
}: StrategyBacktestEnginePanelProps) {
  const [activeTab, setActiveTab] = useState<'strategies' | 'create' | 'results'>('strategies');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BacktestStatus | 'all'>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [strategyName, setStrategyName] = useState('');
  const [strategyType, setStrategyType] = useState<StrategyType>('momentum');
  const [timeRange, setTimeRange] = useState({ start: '', end: '' });
  const [assets, setAssets] = useState<string[]>([]);
  const [initialCapital, setInitialCapital] = useState(100000);

  const backtestQuery: BacktestQuery = {
    userId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined,
    limit: 50,
  };

  const { data: backtestsData, isLoading: backtestsLoading } = useBacktests(backtestQuery);
  const { data: selectedBacktest } = useBacktest(selectedStrategy);
  const createBacktestMutation = useCreateBacktest(userId);
  const runBacktestMutation = useRunBacktest(selectedStrategy, userId);
  const stopBacktestMutation = useStopBacktest(selectedStrategy, userId);
  const utils = useStrategyBacktestUtils(userId);

  const handleCreateBacktest = useCallback(async () => {
    if (!strategyName.trim()) {
      Toast({ title: 'Error', description: 'Please enter a strategy name' });
      return;
    }

    const request: BacktestRequest = {
      name: strategyName,
      description: `${utils.formatStrategyType(strategyType)} strategy`,
      strategyType,
      components: [],
      configuration: {
        timeRange,
        assets,
        benchmark: 'SPY',
        frequency: 'daily',
        initialCapital,
        rebalanceFrequency: 'daily',
        transactionCosts: { fixed: 5, variable: 0.001 },
        riskLimits: { maxDrawdown: 0.2, maxVolatility: 0.3 },
        options: {
          includeWeekends: false,
          includeHolidays: false,
          lookaheadBias: false,
          survivorshipBias: false,
          warmupPeriod: 30,
          cooldownPeriod: 0,
        },
      },
    };

    try {
      await createBacktestMutation.mutateAsync(request);
      setShowCreateDialog(false);
      Toast({ title: 'Success', description: 'Backtest created successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to create backtest' });
    }
  }, [strategyName, strategyType, timeRange, assets, initialCapital, createBacktestMutation, utils]);

  const handleRunBacktest = useCallback(async (strategyId: string) => {
    try {
      await runBacktestMutation.mutateAsync();
      Toast({ title: 'Success', description: 'Backtest started' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to start backtest' });
    }
  }, [runBacktestMutation]);

  const renderPerformanceMetrics = useCallback((performance: PerformanceMetrics) => {
    const metrics = [
      { label: 'Total Return', value: performance.totalReturn, format: 'percentage' },
      { label: 'Sharpe Ratio', value: performance.sharpeRatio, format: 'ratio' },
      { label: 'Max Drawdown', value: performance.maxDrawdown, format: 'percentage' },
      { label: 'Volatility', value: performance.volatility, format: 'percentage' },
      { label: 'Win Rate', value: performance.winRate, format: 'percentage' },
      { label: 'Alpha', value: performance.alpha, format: 'percentage' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                <div className="flex items-center space-x-1">
                  {metric.format === 'percentage' && metric.value > 0 && (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  )}
                  {metric.format === 'percentage' && metric.value < 0 && (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-lg font-bold ${
                    metric.format === 'percentage' ? 
                      (metric.value > 0 ? 'text-green-500' : 'text-red-500') : 
                      'text-foreground'
                  }`}>
                    {utils.formatPerformanceMetric(metric.value, metric.format as any)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }, [utils]);

  const renderStrategyItem = useCallback((strategy: BacktestStrategy) => {
    const latestResult = strategy.results[strategy.results.length - 1];
    const score = latestResult ? utils.calculatePerformanceScore(latestResult.performance) : 0;

    return (
      <Card key={strategy.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">{strategy.name}</h4>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={
                strategy.status === 'completed' ? 'default' :
                strategy.status === 'running' ? 'secondary' :
                strategy.status === 'failed' ? 'destructive' : 'outline'
              }>
                {utils.formatBacktestStatus(strategy.status)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {utils.formatStrategyType(strategy.strategyType)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Assets:</span>
              <span className="ml-2">{strategy.configuration.assets.join(', ')}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Period:</span>
              <span className="ml-2">
                {new Date(strategy.configuration.timeRange.start).toLocaleDateString()} - 
                {new Date(strategy.configuration.timeRange.end).toLocaleDateString()}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Capital:</span>
              <span className="ml-2">${strategy.configuration.initialCapital.toLocaleString()}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Score:</span>
              <span className="ml-2 font-medium">{score.toFixed(1)}/100</span>
            </div>
          </div>

          {latestResult && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Return:</span>
                <span className={`ml-2 font-medium ${latestResult.performance.totalReturn > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {utils.formatPerformanceMetric(latestResult.performance.totalReturn, 'percentage')}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Sharpe:</span>
                <span className="ml-2 font-medium">{latestResult.performance.sharpeRatio.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Max DD:</span>
                <span className="ml-2 font-medium text-red-500">
                  {utils.formatPerformanceMetric(latestResult.performance.maxDrawdown, 'percentage')}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Volatility:</span>
                <span className="ml-2 font-medium">
                  {utils.formatPerformanceMetric(latestResult.performance.volatility, 'percentage')}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Created: {new Date(strategy.created).toLocaleDateString()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStrategy(strategy.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              {strategy.status === 'configured' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunBacktest(strategy.id)}
                  disabled={runBacktestMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </Button>
              )}
              
              {strategy.status === 'running' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stopBacktestMutation.mutate()}
                  disabled={stopBacktestMutation.isPending}
                >
                  <Stop className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [utils, handleRunBacktest, runBacktestMutation, stopBacktestMutation]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Strategy Backtest Engine</span>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Backtest
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="strategies">
                <TrendingUp className="h-4 w-4 mr-2" />
                Strategies
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </TabsTrigger>
              <TabsTrigger value="results">
                <BarChart3 className="h-4 w-4 mr-2" />
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="strategies" className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search strategies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="configured">Configured</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {backtestsData?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{backtestsData.summary.totalStrategies}</div>
                      <p className="text-sm text-muted-foreground">Total Strategies</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-500">{backtestsData.summary.completedBacktests}</div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-500">{backtestsData.summary.runningBacktests}</div>
                      <p className="text-sm text-muted-foreground">Running</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{(backtestsData.summary.averageReturn * 100).toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Avg Return</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {backtestsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading strategies...</p>
                    </div>
                  ) : backtestsData?.strategies?.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No strategies found</p>
                    </div>
                  ) : (
                    backtestsData?.strategies?.map(renderStrategyItem)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Backtest Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Strategy Name</label>
                    <Input
                      value={strategyName}
                      onChange={(e) => setStrategyName(e.target.value)}
                      placeholder="Enter strategy name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Strategy Type</label>
                    <Select value={strategyType} onValueChange={(value) => setStrategyType(value as StrategyType)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="momentum">Momentum</SelectItem>
                        <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                        <SelectItem value="pairs_trading">Pairs Trading</SelectItem>
                        <SelectItem value="multi_factor">Multi-Factor</SelectItem>
                        <SelectItem value="equity_long_short">Equity Long/Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={timeRange.start}
                        onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        type="date"
                        value={timeRange.end}
                        onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Initial Capital</label>
                    <Input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setActiveTab('strategies')}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateBacktest} disabled={createBacktestMutation.isPending}>
                      {createBacktestMutation.isPending ? 'Creating...' : 'Create Strategy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {selectedBacktest && selectedBacktest.results.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Results for {selectedBacktest.name}</h3>
                  {renderPerformanceMetrics(selectedBacktest.results[selectedBacktest.results.length - 1].performance)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Select a completed strategy to view results</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 