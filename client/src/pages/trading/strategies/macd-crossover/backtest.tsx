import React, { useState } from 'react';
import { BackLink } from '@/components/ui/back-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Play, BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';

export default function MACDCrossoverBacktest() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRunBacktest = () => {
    setIsRunning(true);
    setProgress(0);
    
    // Simulate backtest progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className='p-4'>
      <div className="space-y-6">
        <BackLink href="/trading/strategies/macd-crossover">← Back to MACD Strategy</BackLink>
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">MACD Crossover Backtest</h1>
          <p className="text-muted-foreground">
            Test the MACD crossover strategy against historical market data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backtest Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Backtest Configuration</CardTitle>
              <CardDescription>Set parameters for the backtest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input id="symbol" placeholder="BTC" defaultValue="BTC" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" defaultValue="2023-01-01" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" defaultValue="2024-01-01" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="initialCapital">Initial Capital</Label>
                <Input id="initialCapital" placeholder="10000" defaultValue="10000" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select defaultValue="1d">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="1w">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleRunBacktest}
                disabled={isRunning}
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Running Backtest...' : 'Run Backtest'}
              </Button>
              
              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Backtest Results</CardTitle>
                <CardDescription>
                  {progress === 100 ? 'Backtest completed successfully' : 'Run a backtest to see results'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {progress === 100 ? (
                  <Tabs defaultValue="summary">
                    <TabsList>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="trades">Trades</TabsTrigger>
                      <TabsTrigger value="chart">Chart</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">+24.7%</div>
                          <div className="text-sm text-muted-foreground">Total Return</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold">67%</div>
                          <div className="text-sm text-muted-foreground">Win Rate</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold">1.8</div>
                          <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold">-8.2%</div>
                          <div className="text-sm text-muted-foreground">Max Drawdown</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Trades</span>
                            <span className="text-sm font-medium">89</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Winning Trades</span>
                            <span className="text-sm font-medium text-green-600">60</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Losing Trades</span>
                            <span className="text-sm font-medium text-red-600">29</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Average Win</span>
                            <span className="text-sm font-medium text-green-600">+$478</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Average Loss</span>
                            <span className="text-sm font-medium text-red-600">-$287</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Profit Factor</span>
                            <span className="text-sm font-medium">1.89</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="trades">
                      <div className="text-center py-8 text-muted-foreground">
                        Trade history would be displayed here
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="chart">
                      <div className="text-center py-8 text-muted-foreground">
                        Performance chart would be displayed here
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure your backtest parameters and click "Run Backtest" to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 