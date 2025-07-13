import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Calendar, TrendingUp, Target, Edit, Trash2, Plus, Clock, DollarSign, Activity,
  AlertCircle, CheckCircle, Play, Pause
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { scheduledTradeTriggerService } from '../../services/scheduledTradeTriggerService';

interface ScheduledTrade {
  id: string;
  asset: string;
  assetType: 'stock' | 'crypto' | 'commodity' | 'forex';
  action: 'buy' | 'sell';
  triggerType: 'price' | 'indicator' | 'date';
  targetPrice?: number;
  currentPrice?: number;
  condition?: string;
  indicator?: string;
  indicatorValue?: number;
  amount: number;
  status: 'active' | 'paused' | 'triggered' | 'cancelled' | 'expired';
  createdAt: string;
  scheduledFor?: string;
  triggeredAt?: string;
  description: string;
  isActive: boolean;
}

export const ScheduledTradeTriggerPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const queryClient = useQueryClient();
  
  // Simplified state using service methods
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [editingTrade, setEditingTrade] = useState<ScheduledTrade | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // User data for service calls
  const userId = (user as any)?.id || '1';
  const vaultId = activeVaultId || undefined;

  // Fetch scheduled trades
  const { data: tradesData, isLoading, error } = useQuery({
    queryKey: ['/api/user/scheduled-trades', activeVaultId],
    queryFn: async () => {
      const url = activeVaultId 
        ? `/api/user/scheduled-trades?vaultId=${activeVaultId}`
        : '/api/user/scheduled-trades';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch scheduled trades');
      return res.json();
    },
    enabled: !!user && !!activeVaultId,
    refetchInterval: 15000,
  });

  // Update trade mutation using service
  const updateTrade = useMutation({
    mutationFn: async (update: any) => {
      const result = await scheduledTradeTriggerService.handleTradeUpdate(update, activeVaultId, userId, vaultId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/scheduled-trades'] });
      setEditingTrade(null);
    },
  });

  // Delete trade mutation using service
  const deleteTrade = useMutation({
    mutationFn: async (tradeId: string) => {
      const result = await scheduledTradeTriggerService.handleTradeDelete(tradeId, activeVaultId, userId, vaultId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/scheduled-trades'] });
      setDeleteConfirm(null);
    },
  });

  // Calculate summary using service
  const summaryStats = scheduledTradeTriggerService.calculateSummaryStats(tradesData?.trades || []);

  // Apply filters using service
  const filteredTrades = scheduledTradeTriggerService.applyFilters(
    tradesData?.trades || [], 
    statusFilter, 
    actionFilter
  );

  // Handle status filter change using service
  const handleStatusFilterChange = async (value: string) => {
    setStatusFilter(value);
    
    const filteredCount = value === 'all' 
      ? summaryStats.total 
      : tradesData?.trades?.filter((t: ScheduledTrade) => t.status === value).length || 0;
    
    await scheduledTradeTriggerService.handleFilterChange(
      'status', value, summaryStats.total, filteredCount, userId, vaultId
    );
  };

  // Handle action filter change using service
  const handleActionFilterChange = async (value: string) => {
    setActionFilter(value);
    
    const filteredCount = value === 'all' 
      ? summaryStats.total 
      : tradesData?.trades?.filter((t: ScheduledTrade) => t.action === value).length || 0;
    
    await scheduledTradeTriggerService.handleFilterChange(
      'action', value, summaryStats.total, filteredCount, userId, vaultId
    );
  };

  // Handle status toggle using service
  const handleStatusToggle = async (tradeId: string, currentStatus: string) => {
    const result = await scheduledTradeTriggerService.handleStatusToggle(
      tradeId, currentStatus, activeVaultId, userId, vaultId
    );
    
    if (result.success) {
      // Optimistically update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/user/scheduled-trades'] });
    } else {
      console.error('Failed to toggle status:', result.error);
    }
  };

  // Handle edit using service
  const handleEdit = (trade: ScheduledTrade) => {
    const editForm = scheduledTradeTriggerService.prepareTradeForEdit(trade);
    setEditingTrade({ ...trade, ...editForm });
  };

  // Handle delete using service
  const handleDelete = (trade: ScheduledTrade) => {
    const confirmation = scheduledTradeTriggerService.handleDeleteConfirmation(trade.id, trade.asset);
    
    if (confirmation.confirmed) {
      deleteTrade.mutate(trade.id);
    }
  };

  // Handle edit submit
  const handleEditSubmit = () => {
    if (!editingTrade) return;
    
    const validation = scheduledTradeTriggerService.validateTradeForm(editingTrade);
    if (!validation.isValid) {
      alert(`Please fix the following errors:\n${validation.errors.join('\n')}`);
      return;
    }
    
    const update = scheduledTradeTriggerService.prepareTradeForEdit(editingTrade);
    updateTrade.mutate(update);
  };

  // UI helper functions using service
  const getStatusBadge = (status: string) => (
    <Badge className={scheduledTradeTriggerService.getStatusBadgeClass(status)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );

  const getActionBadge = (action: string) => (
    <Badge className={scheduledTradeTriggerService.getActionBadgeClass(action)}>
      {action.charAt(0).toUpperCase() + action.slice(1)}
    </Badge>
  );

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'price': return <DollarSign className="h-4 w-4" />;
      case 'indicator': return <Activity className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading scheduled trades: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Trade Triggers
            <Badge variant="secondary" className="text-xs">{summaryStats.total} trades</Badge>
            {summaryStats.active > 0 && (
              <Badge className="bg-green-100 text-green-800 text-xs">{summaryStats.active} active</Badge>
            )}
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />Add Trade
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.total}</div>
              <div className="text-xs text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summaryStats.active}</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.triggered}</div>
              <div className="text-xs text-blue-600">Triggered</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{summaryStats.paused}</div>
              <div className="text-xs text-yellow-600">Paused</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="triggered">Triggered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={actionFilter} onValueChange={handleActionFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="buy">Buy Orders</SelectItem>
                <SelectItem value="sell">Sell Orders</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredTrades.length} of {summaryStats.total} trades
            </div>
          </div>

          {/* Trades Table */}
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No scheduled trades</h3>
              <p className="text-muted-foreground">
                {statusFilter !== 'all' || actionFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first scheduled trade to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrades.map((trade: ScheduledTrade) => {
                const priceComparison = scheduledTradeTriggerService.getPriceComparison(trade);
                return (
                  <div key={trade.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getTriggerIcon(trade.triggerType)}
                          <span className="font-medium">{trade.asset}</span>
                        </div>
                        {getActionBadge(trade.action)}
                        {getStatusBadge(trade.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusToggle(trade.id, trade.status)}
                          disabled={trade.status === 'triggered' || trade.status === 'cancelled'}
                        >
                          {trade.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(trade)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(trade)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-medium">{trade.amount} {trade.asset}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Trigger Condition</div>
                        <div className="font-medium">{scheduledTradeTriggerService.formatCondition(trade)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current Price</div>
                        <div className="font-medium">{scheduledTradeTriggerService.formatPrice(trade.currentPrice)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Created</div>
                        <div className="font-medium">{new Date(trade.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    {priceComparison && (
                      <div className="mt-3 p-2 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-1">Price Analysis</div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`${parseFloat(priceComparison.diff) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(priceComparison.diff) > 0 ? '+' : ''}${priceComparison.diff} ({priceComparison.percentDiff}%)
                          </span>
                          {priceComparison.isClose && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Near trigger</Badge>
                          )}
                          {priceComparison.willTrigger && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Will trigger</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-muted-foreground">{trade.description}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit Modal */}
          {editingTrade && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium mb-4">Edit Scheduled Trade</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Trigger Type</Label>
                    <Select 
                      value={editingTrade.triggerType} 
                      onValueChange={(value: 'price' | 'indicator' | 'date') => 
                        setEditingTrade({...editingTrade, triggerType: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="indicator">Indicator</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {editingTrade.triggerType === 'price' && (
                    <div>
                      <Label>Target Price</Label>
                      <Input
                        type="number"
                        value={editingTrade.targetPrice || ''}
                        onChange={(e) => setEditingTrade({
                          ...editingTrade, 
                          targetPrice: Number(e.target.value)
                        })}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={editingTrade.amount}
                      onChange={(e) => setEditingTrade({
                        ...editingTrade, 
                        amount: Number(e.target.value)
                      })}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={handleEditSubmit}
                    disabled={updateTrade.isPending}
                  >
                    {updateTrade.isPending ? 'Updating...' : 'Update'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingTrade(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledTradeTriggerPanel; 