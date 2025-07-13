import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BackLink } from '@/components/ui/back-link';
import { useStrategies } from '@/hooks/use-strategies';
import { Plus, Zap, Settings, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { StrategyResponse } from '@/types/strategy';

export default function StrategiesPage() {
  const [_, navigate] = useLocation();
  const { strategies, isLoading, error, deleteStrategy } = useStrategies();

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <BackLink href="/dashboard">← Back to Dashboard</BackLink>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <BackLink href="/dashboard">← Back to Dashboard</BackLink>
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Strategies</CardTitle>
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
    <div className="p-4">
      <BackLink href="/dashboard">← Back to Dashboard</BackLink>
      
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold mb-2">Trading Strategies</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automated trading strategies
          </p>
        </div>
        <Button onClick={() => navigate('/strategies/create')} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Strategy
        </Button>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map((strategy: StrategyResponse) => (
          <Card key={strategy.id} className="relative group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {strategy.name}
                  </CardTitle>
                  <CardDescription>
                    {strategy.symbol} • {strategy.exchange}
                  </CardDescription>
                </div>
                <Badge 
                  variant={
                    strategy.status === 'active' ? 'default' :
                    strategy.status === 'testing' ? 'secondary' : 'outline'
                  }
                  className="capitalize"
                >
                  {strategy.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <div className="flex items-center">
                      {strategy.winRate ? (
                        <>
                          <span className="text-lg font-semibold">
                            {strategy.winRate}%
                          </span>
                          {Number(strategy.winRate) >= 50 ? (
                            <TrendingUp className="w-4 h-4 ml-1 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 ml-1 text-red-500" />
                          )}
                        </>
                      ) : (
                        <span className="text-lg text-muted-foreground">--</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Factor</p>
                    <div className="flex items-center">
                      {strategy.profitFactor ? (
                        <>
                          <span className="text-lg font-semibold">
                            {strategy.profitFactor}
                          </span>
                          {Number(strategy.profitFactor) >= 1 ? (
                            <TrendingUp className="w-4 h-4 ml-1 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 ml-1 text-red-500" />
                          )}
                        </>
                      ) : (
                        <span className="text-lg text-muted-foreground">--</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Risk Settings */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Risk per Trade:</span>
                  <span className="font-medium">
                    {strategy.riskPercentage || '0'}%
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/strategies/${strategy.id}/settings`)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button 
                className="w-full"
                onClick={() => navigate(`/strategies/${strategy.id}`)}
              >
                <Zap className="w-4 h-4 mr-2" />
                View
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}