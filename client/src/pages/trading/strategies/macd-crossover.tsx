import React from 'react';
import { BackLink } from '@/components/ui/back-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { TrendingUp, ArrowRight, BarChart3, Target } from 'lucide-react';

export default function MACDCrossoverStrategy() {
  const [, navigate] = useLocation();

  return (
    <div className='p-4'>
      <BackLink href="/trading/strategies">← Back to Strategies</BackLink>
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">MACD Crossover Strategy</h1>
        <p className="text-muted-foreground">
          A technical analysis strategy based on Moving Average Convergence Divergence signals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Strategy Overview
              </CardTitle>
              <CardDescription>
                MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">How it works:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Calculates the difference between two exponential moving averages (12-day and 26-day)</li>
                  <li>• Uses a 9-day EMA of the MACD line as a signal line</li>
                  <li>• Generates buy signals when MACD crosses above the signal line</li>
                  <li>• Generates sell signals when MACD crosses below the signal line</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Best suited for:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Trending Markets</Badge>
                  <Badge variant="secondary">Medium-term Trading</Badge>
                  <Badge variant="secondary">Momentum Confirmation</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historical Performance</CardTitle>
              <CardDescription>Backtesting results over the past 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+24.7%</div>
                  <div className="text-sm text-muted-foreground">Total Return</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">67%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1.8</div>
                  <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate('/trading/strategies/macd-crossover/backtest')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Run Backtest
              </Button>
              
              <Button variant="outline" className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Deploy Strategy
              </Button>
              
              <Button variant="ghost" className="w-full">
                Export Configuration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strategy Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fast EMA</span>
                <span className="text-sm font-medium">12 periods</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Slow EMA</span>
                <span className="text-sm font-medium">26 periods</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Signal EMA</span>
                <span className="text-sm font-medium">9 periods</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Timeframe</span>
                <span className="text-sm font-medium">Daily</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 