import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { 
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ManualTradeJournalService, {
  useManualTrades,
  useAddTrade,
  useDeleteTrade,
  useTradeFilters,
  useFilteredTrades,
  useTradeSummary,
  useTradeForm,
  useTradeJournalState,
  ASSET_TYPES,
  TRADE_ACTIONS,
  COMMON_ASSETS,
  formatTradeValue,
  formatTradeAmount,
  formatTradeDate,
  type ManualTrade,
  type NewTradeForm
} from '../../services/manualTradeJournalService';

export const ManualTradeJournalPanel: React.FC = () => {
  const { user } = useAuth();
  
  // React Query hooks
  const { data: tradesData, isLoading: isLoadingTrades } = useManualTrades(!!user);
  const addTrade = useAddTrade();
  const deleteTrade = useDeleteTrade();
  
  // Custom hooks for business logic
  const { filters, updateFilter } = useTradeFilters();
  const trades = (tradesData as { trades: ManualTrade[] } | undefined)?.trades || [];
  const filteredTrades = useFilteredTrades(trades, filters);
  const summaryStats = useTradeSummary(filteredTrades);
  const { formState, updateForm, resetForm, prepareForSubmission } = useTradeForm();
  const { state, openAddDialog, closeAddDialog } = useTradeJournalState();

  // Event handlers using service
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.isValid) return;

    try {
      const tradeData = prepareForSubmission();
      await addTrade.mutateAsync(tradeData);
      resetForm();
      closeAddDialog();
    } catch (error) {
      console.error('Failed to add trade:', error);
    }
  };

  const handleDeleteTrade = (tradeId: string) => {
    deleteTrade.mutate(tradeId);
  };

  const handleAssetSelect = (asset: string) => {
    updateForm({ asset });
  };

  // Badge generation using service
  const getAssetTypeBadge = (assetType: string) => {
    const { label, className } = ManualTradeJournalService.getAssetTypeBadge(assetType);
    return <Badge className={className}>{label}</Badge>;
  };

  const getActionBadge = (action: string) => {
    const { label, className } = ManualTradeJournalService.getActionBadge(action);
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Manual Trade Journal
            {summaryStats && (
              <Badge variant="secondary" className="text-xs">
                {summaryStats.totalTrades} trades
              </Badge>
            )}
          </div>
          <Dialog open={state.isAdding} onOpenChange={(open) => open ? openAddDialog() : closeAddDialog()}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Trade</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="asset">Asset</Label>
                    <div className="flex gap-2">
                      <Input
                        id="asset"
                        value={formState.data.asset}
                        onChange={(e) => updateForm({ asset: e.target.value.toUpperCase() })}
                        placeholder="e.g., BTC, AAPL"
                        required
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {COMMON_ASSETS[formState.data.assetType].map(asset => (
                        <Button
                          key={asset}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => handleAssetSelect(asset)}
                        >
                          {asset}
                        </Button>
                      ))}
                    </div>
                    {formState.errors.asset && (
                      <div className="text-xs text-red-600 mt-1">{formState.errors.asset}</div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="assetType">Asset Type</Label>
                    <Select
                      value={formState.data.assetType}
                      onValueChange={(value: any) => updateForm({ assetType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formState.errors.assetType && (
                      <div className="text-xs text-red-600 mt-1">{formState.errors.assetType}</div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="action">Action</Label>
                    <Select
                      value={formState.data.action}
                      onValueChange={(value: any) => updateForm({ action: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADE_ACTIONS.map(action => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formState.errors.action && (
                      <div className="text-xs text-red-600 mt-1">{formState.errors.action}</div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.00001"
                      value={formState.data.amount}
                      onChange={(e) => updateForm({ amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                    />
                    {formState.errors.amount && (
                      <div className="text-xs text-red-600 mt-1">{formState.errors.amount}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formState.data.price}
                    onChange={(e) => updateForm({ price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                  {formState.data.amount > 0 && formState.data.price > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Value: {formatTradeValue(formState.data.amount * formState.data.price)}
                    </div>
                  )}
                  {formState.errors.price && (
                    <div className="text-xs text-red-600 mt-1">{formState.errors.price}</div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formState.data.notes}
                    onChange={(e) => updateForm({ notes: e.target.value })}
                    placeholder="Trade notes, reasoning, or observations..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeAddDialog}
                    disabled={addTrade.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addTrade.isPending || !formState.isValid}
                  >
                    {addTrade.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Trade
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          {summaryStats && summaryStats.totalTrades > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{summaryStats.totalTrades}</div>
                <div className="text-xs text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summaryStats.buyTrades}</div>
                <div className="text-xs text-green-600">Buy Orders</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summaryStats.sellTrades}</div>
                <div className="text-xs text-red-600">Sell Orders</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatTradeValue(summaryStats.totalValue)}</div>
                <div className="text-xs text-blue-600">Total Value</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trades..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.assetType} onValueChange={(value) => updateFilter('assetType', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ASSET_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.action} onValueChange={(value) => updateFilter('action', value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trade Log Table */}
          {isLoadingTrades ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No trades recorded</h3>
              <p className="text-muted-foreground mb-4">
                Start logging your manual trades to track your investment decisions
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Trade
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrades.map((trade: ManualTrade) => (
                <div key={trade.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{trade.asset}</span>
                        {getAssetTypeBadge(trade.assetType)}
                        {getActionBadge(trade.action)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {formatTradeDate(trade.timestamp)}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this trade? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="font-medium">{formatTradeAmount(trade.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="font-medium">{formatTradeValue(trade.price)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Value</div>
                      <div className="font-medium">{formatTradeValue(trade.totalValue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Action</div>
                      <div className={`font-medium ${trade.action === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.action.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  {trade.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <div className="text-sm">{trade.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualTradeJournalPanel; 