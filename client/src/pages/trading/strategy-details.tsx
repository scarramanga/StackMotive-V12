import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Play, 
  Pause, 
  BarChart3, 
  LineChart, 
  Percent, 
  Trash2, 
  Clock, 
  Calendar,
  DollarSign,
  TrendingUp,
  Settings
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function StrategyDetailsPage() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const strategyId = params.id;

  // Query for fetching strategy details
  const { data: strategy, isLoading } = useQuery({
    queryKey: ['/api/strategy/strategies', strategyId],
    enabled: !!strategyId,
  });

  // Query for fetching strategy trades
  const { data: trades = [] } = useQuery({
    queryKey: ['/api/strategy/strategies', strategyId, 'trades'],
    enabled: !!strategyId,
  });

  // If we're still loading or there's an error, show appropriate UI
  if (isLoading) {
    return (
      <div className='p-4'>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" 
          aria-label="Loading"/>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className='p-4'>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Strategy Not Found</h2>
          <p className="text-muted-foreground mb-6">The strategy you are looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/trading/strategies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Strategies
          </Button>
        </div>
      </div>
    );
  }

  // Build breadcrumb info with the strategy name
  const breadcrumbInfo = {
    [strategyId]: strategy.name
  };

  return (
    <div className='p-4'>
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <Badge 
              variant={strategy.status === 'active' ? 'success' : 'default'} 
              className="mr-4"
            >
              {strategy.status}
            </Badge>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/trading/strategies/${strategy.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant={strategy.status === 'active' ? 'destructive' : 'default'} 
                size="sm"
              >
                {strategy.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/trading/strategies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Strategies
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Performance</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                {strategy.performance || '0.00%'}
                <TrendingUp className="h-4 w-4 ml-2 text-green-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Win Rate</CardDescription>
              <CardTitle className="text-2xl">
                {strategy.winRate ? `${strategy.winRate}%` : 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Profit Factor</CardDescription>
              <CardTitle className="text-2xl">
                {strategy.profitFactor || 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Created</CardDescription>
              <CardTitle className="text-lg">
                {new Date(strategy.createdAt).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Tabs for different strategy views */}
      <Tabs defaultValue="performance">
        <TabsList className="mb-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Chart</CardTitle>
                <CardDescription>
                  Historical performance of this strategy over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Performance metrics visualization will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p>Monthly performance chart</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Max Drawdown</dt>
                      <dd className="font-medium">-8.32%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Sharpe Ratio</dt>
                      <dd className="font-medium">1.24</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Average Trade</dt>
                      <dd className="font-medium">+2.17%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total Trades</dt>
                      <dd className="font-medium">{trades.length}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>
                History of trades executed by this strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-left font-medium">Type</th>
                      <th className="py-3 px-4 text-left font-medium">Price</th>
                      <th className="py-3 px-4 text-left font-medium">Amount</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                      <th className="py-3 px-4 text-right font-medium">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          {new Date(trade.entryTime).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={trade.type === 'buy' ? 'success' : 'destructive'}
                          >
                            {trade.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">${trade.entryPrice}</td>
                        <td className="py-3 px-4">{trade.amount}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{trade.status}</Badge>
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${
                          trade.profitLoss > 0 
                            ? 'text-green-600' 
                            : trade.profitLoss < 0 
                              ? 'text-red-600' 
                              : ''
                        }`}>
                          {trade.profitLoss ? `${trade.profitLoss > 0 ? '+' : ''}${trade.profitLoss}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Settings</CardTitle>
                <CardDescription>
                  Core configuration of this trading strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Symbol</dt>
                    <dd className="font-medium">{strategy.symbol}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Exchange</dt>
                    <dd className="font-medium">{strategy.exchange}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Risk Percentage</dt>
                    <dd className="font-medium">{strategy.riskPercentage || '2.0'}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Account</dt>
                    <dd className="font-medium">{strategy.accountId || 'Default'}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => navigate(`/trading/strategies/${strategy.id}/edit`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Settings
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Indicators</CardTitle>
                <CardDescription>
                  Indicators used by this strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategy.indicators ? (
                    Object.entries(strategy.indicators).map(([key, value]) => (
                      <div key={key} className="border rounded-md p-3">
                        <h4 className="font-medium mb-1">{key}</h4>
                        <p className="text-sm text-muted-foreground">
                          {JSON.stringify(value)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No indicators configured</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Entry Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[200px]">
                  {JSON.stringify(strategy.entryConditions, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exit Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[200px]">
                  {JSON.stringify(strategy.exitConditions, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you want to be notified about this strategy's activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Notification configuration</h3>
                <p className="text-muted-foreground mb-4">
                  Configure notification preferences for trade entries, exits, and performance alerts.
                </p>
                <Button>
                  Configure Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}