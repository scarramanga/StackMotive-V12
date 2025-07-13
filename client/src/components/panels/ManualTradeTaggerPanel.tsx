import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { 
  Tag, Save, Search, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Loader2, Filter, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { manualTradeTaggerService } from '../../services/manualTradeTaggerService';

// Use service interfaces
interface TradeTag {
  strategyMatch: string;
  intent: string;
  marketCondition: string;
  confidenceLevel: string;
}

interface ManualTrade {
  id: string;
  asset: string;
  assetType: 'stock' | 'crypto' | 'commodity' | 'forex';
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  date: string;
  totalValue: number;
  tags: TradeTag;
  description?: string;
  source: 'manual' | 'automatic';
}

interface TradeTagUpdate {
  tradeId: string;
  tags: TradeTag;
}

export const ManualTradeTaggerPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tradeTags, setTradeTags] = useState<Record<string, TradeTag>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User data for logging
  const userId = (user as any)?.id || '1';
  const vaultId = activeVaultId || undefined;

  // Fetch manual trades
  const { data: tradesData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/user/trades', activeVaultId],
    queryFn: async () => {
      const url = activeVaultId 
        ? `/api/user/trades?vaultId=${activeVaultId}&source=manual`
        : '/api/user/trades?source=manual';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch trades');
      return res.json();
    },
    enabled: !!user && !!activeVaultId,
    refetchInterval: 30000,
  });

  // Update trade tags mutation
  const updateTradeTags = useMutation({
    mutationFn: async (updates: TradeTagUpdate[]) => {
      const url = activeVaultId 
        ? `/api/user/trades/tags?vaultId=${activeVaultId}`
        : '/api/user/trades/tags';
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error('Failed to update trade tags');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/trades'] });
      setHasChanges(false);
      setSaveStatus({ type: 'success', message: 'Trade tags updated successfully' });
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: () => {
      setSaveStatus({ type: 'error', message: 'Failed to update trade tags' });
      setTimeout(() => setSaveStatus(null), 3000);
    },
  });

  // Initialize trade tags when data loads
  useEffect(() => {
    if (tradesData?.trades) {
      const initialTags = manualTradeTaggerService.initializeTradeTags(tradesData.trades);
      setTradeTags(initialTags);
    }
  }, [tradesData]);

  // Handler functions with logging
  const handleSearchChange = async (value: string) => {
    setSearchTerm(value);
    if (value.length > 2) {
      await manualTradeTaggerService.logAgentMemory('search_performed', {
        userId, vaultId, metadata: { searchTerm: value }
      });
    }
  };

  const handleAssetFilterChange = async (value: string) => {
    setAssetFilter(value);
    await manualTradeTaggerService.logAgentMemory('filter_changed', {
      userId, vaultId, metadata: { filterType: 'asset', filterValue: value }
    });
  };

  const handleActionFilterChange = async (value: string) => {
    setActionFilter(value);
    await manualTradeTaggerService.logAgentMemory('filter_changed', {
      userId, vaultId, metadata: { filterType: 'action', filterValue: value }
    });
  };

  const handleTagChange = async (tradeId: string, tagType: keyof TradeTag, value: string) => {
    const updatedTags = manualTradeTaggerService.updateTradeTag(tradeTags, tradeId, tagType, value);
    setTradeTags(updatedTags);
    setHasChanges(true);
    
    await manualTradeTaggerService.logAgentMemory('trade_tagged', {
      userId, vaultId, metadata: { tradeId, tagType, value }
    });
  };

  const handleSave = async () => {
    if (!tradesData?.trades || !hasChanges) return;
    
    const updates = manualTradeTaggerService.getChangedTrades(tradesData.trades, tradeTags);
    
    if (updates.length > 0) {
      updateTradeTags.mutate(updates);
      await manualTradeTaggerService.logAgentMemory('tags_saved', {
        userId, vaultId, metadata: { updatedCount: updates.length }
      });
    }
  };

  const handleReset = async () => {
    if (tradesData?.trades) {
      const originalTags = manualTradeTaggerService.resetTradeTags(tradesData.trades);
      setTradeTags(originalTags);
      setHasChanges(false);
      
      await manualTradeTaggerService.logAgentMemory('tags_reset', {
        userId, vaultId, metadata: { tradesCount: tradesData.trades.length }
      });
    }
  };

  const handleRefresh = async () => {
    refetch();
    await manualTradeTaggerService.logAgentMemory('data_refreshed', {
      userId, vaultId, metadata: { refreshType: 'manual' }
    });
  };

  // Use service for filtered trades
  const filteredTrades = tradesData?.trades ? manualTradeTaggerService.filterPanelTrades(
    tradesData.trades,
    { searchTerm, assetFilter, actionFilter }
  ) : [];

  // Use service for summary statistics
  const summaryStats = manualTradeTaggerService.calculateSummaryStats(filteredTrades, tradeTags);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading trades: {error.message}
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
            <Tag className="h-5 w-5" />
            Manual Trade Tagger
            <Badge variant="secondary" className="text-xs">
              {summaryStats.total} trades
            </Badge>
            {hasChanges && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {summaryStats.complete}/{summaryStats.total} complete
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.total}</div>
              <div className="text-xs text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.tagged}</div>
              <div className="text-xs text-blue-600">Tagged</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summaryStats.complete}</div>
              <div className="text-xs text-green-600">Complete</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!hasChanges || updateTradeTags.isPending}>
              {updateTradeTags.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Tags
                </>
              )}
            </Button>
            
            <Button onClick={handleReset} disabled={!hasChanges} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Save Status */}
          {saveStatus && (
            <div className={`p-3 rounded-lg border ${
              saveStatus.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {saveStatus.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{saveStatus.message}</span>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search trades by asset..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={assetFilter} onValueChange={handleAssetFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="commodity">Commodities</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={actionFilter} onValueChange={handleActionFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trades List */}
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No manual trades found</h3>
              <p className="text-muted-foreground">
                {searchTerm || assetFilter !== 'all' || actionFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Manual trades will appear here for tagging'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrades.map((trade: ManualTrade) => {
                const tags = tradeTags[trade.id] || { strategyMatch: '', intent: '', marketCondition: '', confidenceLevel: '' };
                const completeness = manualTradeTaggerService.calculateTagCompleteness(tags);
                const actionBadge = manualTradeTaggerService.getActionBadge(trade.action);
                
                return (
                  <div key={trade.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {trade.action === 'buy' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{trade.asset}</span>
                        </div>
                        <Badge className={actionBadge.className}>{actionBadge.label}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {trade.assetType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {completeness.completed}/{completeness.total} tags
                        </div>
                        <div className={`w-12 h-2 rounded-full ${
                          completeness.percentage === 100 ? 'bg-green-200' : 'bg-gray-200'
                        }`}>
                          <div 
                            className={`h-full rounded-full transition-all ${
                              completeness.percentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${completeness.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-medium">{trade.amount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Price</div>
                        <div className="font-medium">${trade.price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Value</div>
                        <div className="font-medium">${trade.totalValue.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Date</div>
                        <div className="font-medium">{new Date(trade.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Strategy Match
                        </label>
                        <Select 
                          value={tags.strategyMatch} 
                          onValueChange={(value) => handleTagChange(trade.id, 'strategyMatch', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {manualTradeTaggerService.STRATEGY_MATCH_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Intent
                        </label>
                        <Select 
                          value={tags.intent} 
                          onValueChange={(value) => handleTagChange(trade.id, 'intent', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {manualTradeTaggerService.INTENT_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Market Condition
                        </label>
                        <Select 
                          value={tags.marketCondition} 
                          onValueChange={(value) => handleTagChange(trade.id, 'marketCondition', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {manualTradeTaggerService.MARKET_CONDITION_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Confidence Level
                        </label>
                        <Select 
                          value={tags.confidenceLevel} 
                          onValueChange={(value) => handleTagChange(trade.id, 'confidenceLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {manualTradeTaggerService.CONFIDENCE_LEVEL_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {trade.description && (
                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                        <span className="text-muted-foreground">Note: </span>
                        {trade.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tagging Guide */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Tagging Guide</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• <strong>Strategy Match:</strong> Trading strategy used for this trade</div>
              <div>• <strong>Intent:</strong> Primary reason for making this trade</div>
              <div>• <strong>Market Condition:</strong> Overall market sentiment when trade was made</div>
              <div>• <strong>Confidence Level:</strong> How confident you were in this trade</div>
              <div>• Complete tagging helps with trade analysis and strategy optimization</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualTradeTaggerPanel; 