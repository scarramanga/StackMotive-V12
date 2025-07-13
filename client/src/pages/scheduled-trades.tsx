import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { BackToDashboard } from '@/components/ui/back-to-dashboard';
import { usePaperTradingAccount } from '@/hooks/use-paper-trading';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Trash2,
  Plus,
  Edit,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduledTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit';
  price?: number;
  scheduledTime: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: string;
  strategy?: string;
}

export default function ScheduledTradesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');
  const { data: paperTradingAccount } = usePaperTradingAccount();

  // Fetch scheduled trades from backend
  const { data: scheduledTrades = [], isLoading } = useQuery<ScheduledTrade[]>({
    queryKey: [`/api/user/paper-trading-account/${paperTradingAccount?.id}/scheduled-trades`],
    enabled: !!paperTradingAccount?.id,
    staleTime: 30000,
  });

  const filterTrades = (trades: ScheduledTrade[]) => {
    switch (activeTab) {
      case 'active':
        return trades.filter(t => t.status === 'active');
      case 'completed':
        return trades.filter(t => t.status === 'completed');
      case 'cancelled':
        return trades.filter(t => t.status === 'cancelled' || t.status === 'paused');
      default:
        return trades;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getStatusBadge = (status: ScheduledTrade['status']) => {
    const variants = {
      active: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredTrades = filterTrades(scheduledTrades);

  if (isLoading) {
    return (
      <div className='p-4'>
        <BackToDashboard />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading scheduled trades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="container mx-auto py-6 space-y-6">
        <BackToDashboard />
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Scheduled Trades</h1>
            <p className="text-muted-foreground">Automate your trading with scheduled orders</p>
            {scheduledTrades.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">Mock Data for UI Testing</p>
            )}
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Trade
          </Button>
        </div>
        {/* Show empty state if no trades */}
        {scheduledTrades.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">You haven't scheduled any trades yet.</h3>
              <p className="text-muted-foreground mb-4">
                Schedule your first trade to automate your trading strategy.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Your First Trade
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Trades</p>
                      <p className="text-xl font-bold">{scheduledTrades.filter(t => t.status === 'active').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Today</p>
                      <p className="text-xl font-bold">{scheduledTrades.filter(t => t.status === 'completed').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Pause className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Paused</p>
                      <p className="text-xl font-bold">{scheduledTrades.filter(t => t.status === 'paused').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="text-xl font-bold">{scheduledTrades.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Tabs and Trade List */}
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Trades</CardTitle>
                <CardDescription>Manage your upcoming and completed trades</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="active">Active ({scheduledTrades.filter(t => t.status === 'active').length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({scheduledTrades.filter(t => t.status === 'completed').length})</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled ({scheduledTrades.filter(t => t.status === 'cancelled' || t.status === 'paused').length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value={activeTab}>
                    {filteredTrades.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No {activeTab} trades</h3>
                        <p className="text-muted-foreground mb-4">
                          {activeTab === 'active' 
                            ? 'You don\'t have any active scheduled trades.'
                            : `You don\'t have any ${activeTab} trades.`}
                        </p>
                        {activeTab === 'active' && (
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Schedule Your First Trade
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredTrades.map((trade) => (
                          <div key={trade.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  {trade.side === 'buy' ? (
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                  )}
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{trade.symbol}</span>
                                      <span className={cn(
                                        "text-sm font-medium",
                                        trade.side === 'buy' ? 'text-green-600' : 'text-red-600'
                                      )}>
                                        {trade.side.toUpperCase()}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {trade.quantity} shares
                                      </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {trade.orderType === 'limit' && trade.price ? 
                                        `Limit ${formatCurrency(trade.price)}` : 
                                        'Market Order'
                                      }
                                      {trade.strategy && (
                                        <span className="ml-2">• {trade.strategy}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium">
                                    {formatDateTime(trade.scheduledTime)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Scheduled time
                                  </div>
                                </div>
                                
                                {getStatusBadge(trade.status)}
                                
                                {trade.status === 'active' && (
                                  <div className="flex space-x-1">
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Pause className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
} 