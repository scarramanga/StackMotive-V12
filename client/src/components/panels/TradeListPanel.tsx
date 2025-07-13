import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  List,
  Search,
  Filter,
  Download,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  useTrades, 
  tradeListService,
  type Trade,
  type TradeFilters 
} from '../../services/tradeListService';

type SortField = 'symbol' | 'side' | 'quantity' | 'price' | 'timestamp' | 'total';
type SortDirection = 'asc' | 'desc';

export const TradeListPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TradeFilters>({});
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Build complete filters
  const completeFilters = useMemo(() => {
    const searchFilters: TradeFilters = {};
    
    if (searchTerm) {
      searchFilters.symbol = searchTerm;
    }
    
    return { ...filters, ...searchFilters };
  }, [filters, searchTerm]);

  // Fetch trades data using service
  const { data: tradesData, isLoading, error } = useTrades(activeVaultId, user, page, completeFilters);

  // Process and sort trades using service
  const processedTrades = useMemo(() => {
    if (!tradesData?.trades) return [];
    
    let sorted = [...tradesData.trades];
    
    // Apply sorting using service methods
    switch (sortField) {
      case 'timestamp':
        sorted = tradeListService.sortTradesByDate(sorted, sortDirection);
        break;
      case 'total':
        sorted = tradeListService.sortTradesBySize(sorted, sortDirection);
        break;
      default:
        sorted.sort((a, b) => {
          let aValue: any = a[sortField];
          let bValue: any = b[sortField];
          
          if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }
          
          if (sortDirection === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
    }
    
    return sorted;
  }, [tradesData, sortField, sortDirection]);

  // Calculate summary statistics using service
  const summaryStats = useMemo(() => {
    if (!tradesData?.trades) return tradesData?.summary || {
      totalTrades: 0,
      totalVolume: 0,
      totalFees: 0,
      totalPnL: 0,
      winRate: 0,
      avgTradeSize: 0
    };
    
    return tradeListService.calculateTradeStats(tradesData.trades);
  }, [tradesData]);

  // Handle filter changes
  const handleFilterChange = (key: keyof TradeFilters, value: any) => {
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'trade-list',
        userId: user?.id || undefined,
        action: 'filter_change',
        timestamp: new Date().toISOString(),
        details: { filterKey: key, filterValue: value, vaultId: activeVaultId }
      })
    }).catch(console.error);
    
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
    setPage(1); // Reset to first page when filtering
  };

  // Handle search
  const handleSearch = (value: string) => {
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'trade-list',
        userId: user?.id || undefined,
        action: 'search',
        timestamp: new Date().toISOString(),
        details: { searchTerm: value, vaultId: activeVaultId }
      })
    }).catch(console.error);
    
    setSearchTerm(value);
    setPage(1);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'trade-list',
        userId: user?.id || undefined,
        action: 'sort_change',
        timestamp: new Date().toISOString(),
        details: { sortField: field, sortDirection, vaultId: activeVaultId }
      })
    }).catch(console.error);
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Export using service
  const handleExportCSV = () => {
    if (!processedTrades.length) return;
    
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'trade-list',
        userId: user?.id || undefined,
        action: 'export_csv',
        timestamp: new Date().toISOString(),
        details: { tradeCount: processedTrades.length, vaultId: activeVaultId }
      })
    }).catch(console.error);
    
    const headers = ['Symbol', 'Side', 'Quantity', 'Price', 'Total', 'Fee', 'Status', 'Date', 'Strategy', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...processedTrades.map(trade => [
        trade.symbol,
        trade.side,
        trade.quantity,
        trade.price,
        trade.total,
        trade.fee,
        trade.status,
        new Date(trade.timestamp).toISOString(),
        trade.strategy || '',
        `"${trade.notes || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  // Get action badge using service
  const getActionBadge = (side: Trade['side']) => {
    const color = tradeListService.getTradeSideColor(side);
    return side === 'buy' ? (
      <Badge className="bg-green-100 text-green-800">Buy</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Sell</Badge>
    );
  };

  // Get status badge using service
  const getStatusBadge = (status: Trade['status']) => {
    const color = tradeListService.getTradeStatusColor(status);
    const bgColor = tradeListService.getTradeStatusBackground(status);
    return <Badge className={`${bgColor} ${color}`}>{status}</Badge>;
  };

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
            <List className="h-5 w-5" />
            Trade List
            <Badge variant="secondary" className="text-xs">
              {summaryStats.totalTrades} trades
            </Badge>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            disabled={processedTrades.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Bar using service formatting */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.totalTrades}</div>
              <div className="text-xs text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {tradeListService.formatCurrency(summaryStats.totalVolume)}
              </div>
              <div className="text-xs text-blue-600">Total Volume</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {tradeListService.formatPercentage(summaryStats.winRate)}
              </div>
              <div className="text-xs text-green-600">Win Rate</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className={`text-2xl font-bold ${tradeListService.getPnLColor(summaryStats.totalPnL)}`}>
                {tradeListService.formatCurrency(summaryStats.totalPnL)}
              </div>
              <div className="text-xs text-purple-600">Total P&L</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select 
                value={filters.side || 'all'} 
                onValueChange={(value) => handleFilterChange('side', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trade Table */}
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : processedTrades.length === 0 ? (
            <div className="text-center py-8">
              <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No trades found</h3>
              <p className="text-muted-foreground">
                {searchTerm || Object.keys(filters).some(key => filters[key as keyof TradeFilters])
                  ? 'Try adjusting your filters' 
                  : 'No trades have been recorded yet'}
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-muted/50 border-b border-border">
                <div className="grid grid-cols-8 gap-4 p-3 text-sm font-medium">
                  <button
                    className="flex items-center gap-1 text-left hover:text-primary"
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol
                    {getSortIcon('symbol')}
                  </button>
                  <button
                    className="flex items-center gap-1 text-left hover:text-primary"
                    onClick={() => handleSort('side')}
                  >
                    Side
                    {getSortIcon('side')}
                  </button>
                  <button
                    className="flex items-center gap-1 text-left hover:text-primary"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity
                    {getSortIcon('quantity')}
                  </button>
                  <button
                    className="flex items-center gap-1 text-left hover:text-primary"
                    onClick={() => handleSort('price')}
                  >
                    Price
                    {getSortIcon('price')}
                  </button>
                  <button
                    className="flex items-center gap-1 text-left hover:text-primary"
                    onClick={() => handleSort('total')}
                  >
                    Total
                    {getSortIcon('total')}
                  </button>
                  <div>P&L</div>
                  <div>Status</div>
                  <button
                    className="flex items-center gap-1 text-left hover:text-primary"
                    onClick={() => handleSort('timestamp')}
                  >
                    Date
                    {getSortIcon('timestamp')}
                  </button>
                </div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-border">
                {processedTrades.map((trade) => (
                  <div key={trade.id} className="grid grid-cols-8 gap-4 p-3 hover:bg-muted/50 transition-colors">
                    <div className="font-medium">{trade.symbol}</div>
                    <div>{getActionBadge(trade.side)}</div>
                    <div className="font-mono text-sm">
                      {tradeListService.formatTradeSize(trade.quantity, trade.symbol)}
                    </div>
                    <div className="font-mono text-sm">
                      {tradeListService.formatCurrency(trade.price)}
                    </div>
                    <div className="font-mono text-sm">
                      {tradeListService.formatCurrency(trade.total)}
                    </div>
                    <div className={`font-mono text-sm ${tradeListService.getPnLColor(trade.pnl || 0)}`}>
                      {trade.pnl ? tradeListService.formatCurrency(trade.pnl) : '-'}
                    </div>
                    <div>{getStatusBadge(trade.status)}</div>
                    <div className="text-sm text-muted-foreground">
                      {tradeListService.formatRelativeTime(trade.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {tradesData && tradesData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {tradesData.page} of {tradesData.totalPages} ({tradesData.total} total trades)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tradesData.page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tradesData.page >= tradesData.totalPages}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeListPanel; 