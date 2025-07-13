import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackLink } from '@/components/ui/back-link';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { TrendingUp, TrendingDown, ChevronRight, BarChart3, PieChart as PieChartIcon, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Define chart colors
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#6366f1', // indigo
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#84cc16', // lime
  '#14b8a6', // teal
];

export default function HoldingsPage() {
  const [_, navigate] = useLocation();
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const [activeTab, setActiveTab] = useState<'list' | 'chart'>('list');

  // Transform backend holdings data for display
  const holdings = React.useMemo(() => {
    if (!dashboardData?.holdings) return [];
    
    return dashboardData.holdings.map(holding => ({
      symbol: holding.symbol,
      exchange: 'Paper Trading', // Backend doesn't provide exchange info yet
      broker: 'StackMotive Paper Trading',
      quantity: holding.quantity,
      averagePrice: holding.costBasis / holding.quantity, // Calculate average price from cost basis
      totalValue: holding.totalValue,
      currentPrice: holding.currentPrice,
      profitLoss: holding.profitLoss,
      profitLossPercent: holding.profitLossPercent,
      allocation: holding.allocation,
      type: holding.type,
      // Recent trades - not available in unified endpoint yet
      trades: []
    }));
  }, [dashboardData?.holdings]);

  // Calculate total portfolio value from backend data
  const totalValue = dashboardData?.totalHoldingsValue || 0;

  // Prepare data for pie chart
  const chartData = holdings.map((holding, index) => ({
    name: holding.symbol,
    value: holding.totalValue,
    color: CHART_COLORS[index % CHART_COLORS.length],
    details: {
      exchange: holding.exchange,
      broker: holding.broker,
      quantity: holding.quantity,
      averagePrice: holding.averagePrice
    }
  }));

  // Loading state
  if (isLoading) {
    return (
      <div className='p-4'>
        <BackLink href="/dashboard">← Back to Dashboard</BackLink>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='p-4'>
        <BackLink href="/dashboard">← Back to Dashboard</BackLink>
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Holdings</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <BackLink href="/dashboard">← Back to Dashboard</BackLink>
      
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold mb-2">Portfolio Holdings</h1>
          <p className="text-muted-foreground">
            Total Value: {formatCurrency(totalValue)}
          </p>
        </div>
        <Button onClick={() => navigate('/holdings/rebalance')} className="bg-primary text-white">
          <BarChart3 className="w-4 h-4 mr-2" />
          Rebalance Portfolio
        </Button>
      </div>

      {/* View Toggle */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'list' | 'chart')}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {holdings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No holdings yet. Start trading to see your positions here.</p>
                <Button className="mt-4" onClick={() => navigate('/trading/trade')}>
                  Start Trading
                </Button>
              </CardContent>
            </Card>
          ) : (
            holdings.map((holding) => (
              <Card key={holding.symbol} className="hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {holding.symbol}
                      </CardTitle>
                      <CardDescription>
                        {holding.exchange} • {holding.broker}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/holdings/${holding.symbol}`)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="text-lg font-semibold">{holding.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Price</p>
                      <p className="text-lg font-semibold">{formatCurrency(holding.averagePrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-lg font-semibold">{formatCurrency(holding.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Profit/Loss</p>
                      <p className={`text-lg font-semibold ${holding.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {holding.profitLoss >= 0 ? '+' : ''}{formatCurrency(holding.profitLoss)} ({holding.profitLossPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  {/* Note about recent trades */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      📊 Trade history is available on the main dashboard. Recent trades feature coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Allocation</CardTitle>
              <CardDescription>Visual breakdown of your holdings</CardDescription>
            </CardHeader>
            <CardContent>
              {holdings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No holdings to display in chart view.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string, props: any) => {
                            const percentage = ((value / totalValue) * 100).toFixed(1);
                            const details = props.payload.details;
                            return [
                              <div className="space-y-1">
                                <p>{formatCurrency(value)} ({percentage}%)</p>
                                <p className="text-xs text-muted-foreground">
                                  {details.exchange} • {details.broker}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {details.quantity} @ {formatCurrency(details.averagePrice)}
                                </p>
                              </div>,
                              name
                            ];
                          }}
                          contentStyle={{
                            backgroundColor: 'rgba(var(--background), 0.95)',
                            borderRadius: '8px',
                            border: '1px solid rgba(var(--border), 0.1)',
                            padding: '12px'
                          }}
                        />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          formatter={(value, entry) => {
                            const { payload } = entry as any;
                            const percentage = ((payload.value / totalValue) * 100).toFixed(1);
                            return (
                              <span className="text-sm">
                                {value} ({percentage}%)
                              </span>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Holdings Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Holdings Summary</h3>
                    <div className="space-y-2">
                      {chartData.map((holding, index) => (
                        <div key={holding.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: holding.color }}
                            />
                            <span>{holding.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(holding.value)}</p>
                            <p className="text-sm text-muted-foreground">
                              {((holding.value / totalValue) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 