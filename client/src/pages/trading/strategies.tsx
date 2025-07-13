import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Plus, BarChart3, Settings, ArrowUpDown, Trash2, Edit, Zap, TrendingUp, LineChart } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StrategyForm } from '@/components/trading/strategy-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackToDashboard } from '@/components/ui/back-to-dashboard';

interface Strategy {
  id: number | string;
  name: string;
  description: string;
  symbol: string;
  exchange: string;
  status: 'active' | 'inactive' | 'template';
  performance: string | null;
  winRate: number | null;
  type: string;
  risk: string;
  createdAt?: Date;
}

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  type: 'technical' | 'fundamental' | 'hybrid';
  risk: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  indicators?: string[];
}

// Example strategies for new users
const EXAMPLE_STRATEGIES: StrategyTemplate[] = [
  {
    id: 'macd-crossover',
    name: 'MACD Crossover',
    description: 'A technical strategy using MACD crossovers to identify trend changes and momentum.',
    type: 'technical',
    risk: 'medium',
    timeframe: 'short',
    indicators: ['MACD', 'EMA']
  },
  {
    id: 'rsi-oversold',
    name: 'RSI Oversold Bounce',
    description: 'Identifies oversold conditions using RSI and volume confirmation.',
    type: 'technical',
    risk: 'medium',
    timeframe: 'short',
    indicators: ['RSI', 'Volume']
  },
  {
    id: 'trend-following',
    name: 'Trend Following',
    description: 'Uses multiple timeframe analysis to identify and follow strong trends.',
    type: 'technical',
    risk: 'low',
    timeframe: 'long',
    indicators: ['Moving Averages', 'ADX']
  }
];

export default function StrategiesPage() {
  const [_, navigate] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Query for fetching trading strategies
  const { data: strategies = [], isLoading } = useQuery<Strategy[]>({
    queryKey: ['/api/strategies'],
    select: (data: Strategy[]) => data.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
  });

  // Mutation for deleting a strategy
  const deleteStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/strategies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      toast({
        title: 'Strategy deleted',
        description: 'The trading strategy has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete strategy',
        description: 'An error occurred while deleting the strategy. Please try again.',
      });
      console.error('Delete strategy error:', error);
    }
  });

  // Handle form submission
  const handleCreateStrategy = async (data: {
    symbol: string;
    name: string;
    status: string;
    exchange: string;
    description?: string;
    indicators?: any;
    entryConditions?: any;
    exitConditions?: any;
    riskPercentage?: string;
    accountId?: any;
  }) => {
    try {
      await apiRequest('POST', '/api/strategy/strategies', data);
      queryClient.invalidateQueries({ queryKey: ['/api/strategy/strategies'] });
      setIsCreating(false);
      toast({
        title: 'Strategy created',
        description: 'Your new trading strategy has been created successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create strategy',
        description: 'An error occurred while creating the strategy. Please try again.',
      });
      console.error('Create strategy error:', error);
    }
  };

  // Function to handle strategy deletion
  const handleDeleteStrategy = (id: number) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      deleteStrategyMutation.mutate(id);
    }
  };

  const getRiskBadgeColor = (risk: StrategyTemplate['risk']) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return '';
    }
  };

  // Helper function to check if strategy route exists
  const isStrategyImplemented = (strategyId: string) => {
    // Only macd-crossover is currently implemented
    return strategyId === 'macd-crossover';
  };

  // Handle strategy navigation with protection
  const handleStrategyNavigation = (strategyId: string, type: 'details' | 'backtest') => {
    if (isStrategyImplemented(strategyId)) {
      if (type === 'details') {
        navigate(`/trading/strategies/${strategyId}`);
      } else {
        navigate(`/trading/strategies/${strategyId}/backtest`);
      }
    } else {
      toast({
        title: 'Coming Soon',
        description: `The ${type === 'details' ? 'strategy details' : 'backtest feature'} for this strategy is not yet implemented. Only MACD Crossover is currently available.`,
        variant: 'default',
      });
    }
  };

  const renderStrategyCard = (strategy: StrategyTemplate, isExample = false) => (
    <Card key={strategy.id} className="hover:shadow-lg transition-shadow" data-cy={`strategy-card-${strategy.id}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{strategy.name}</span>
          <Badge className={getRiskBadgeColor(strategy.risk)}>
            {strategy.risk.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>{strategy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50">
              {strategy.type.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="bg-purple-50">
              {strategy.timeframe.toUpperCase()}
            </Badge>
            {strategy.indicators?.map((indicator) => (
              <Badge key={indicator} variant="outline" className="bg-gray-50">
                {indicator}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleStrategyNavigation(strategy.id, 'details')}
              disabled={!isStrategyImplemented(strategy.id)}
              data-cy={`view-details-${strategy.id}`}
            >
              <LineChart className="w-4 h-4 mr-2" />
              View Details
              {!isStrategyImplemented(strategy.id) && <span className="ml-1 text-xs">(Coming Soon)</span>}
            </Button>
            <Button 
              className="flex-1"
              onClick={() => handleStrategyNavigation(strategy.id, 'backtest')}
              disabled={!isStrategyImplemented(strategy.id)}
              data-cy={`backtest-${strategy.id}`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Backtest
              {!isStrategyImplemented(strategy.id) && <span className="ml-1 text-xs">(Coming Soon)</span>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4">
      <BackToDashboard />
      
      <div className="flex justify-between items-center mb-6 mt-4">
        <div>
          <h1 className="text-3xl font-bold">Browse Strategies</h1>
          <p className="text-muted-foreground mt-1">
            Browse and customize trading strategies
          </p>
        </div>
        <Button onClick={() => navigate('/trading/strategies/new')} data-cy="create-strategy-button">
          <Plus className="w-4 h-4 mr-2" />
          Create Strategy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXAMPLE_STRATEGIES.map((strategy) => renderStrategyCard(strategy))}
      </div>

      {EXAMPLE_STRATEGIES.length === 0 && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center py-6">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Strategies Yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first trading strategy to start automating your trades.
              You can create a strategy from scratch or use one of our templates.
            </p>
            <Button onClick={() => navigate('/trading/strategies/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Strategy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Strategy Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Strategy</DialogTitle>
            <DialogDescription>
              Set up a new automated trading strategy. You can define entry and exit conditions and choose specific technical indicators.
            </DialogDescription>
          </DialogHeader>
          
          <StrategyForm onSubmit={handleCreateStrategy} />
        </DialogContent>
      </Dialog>
    </div>
  );
}