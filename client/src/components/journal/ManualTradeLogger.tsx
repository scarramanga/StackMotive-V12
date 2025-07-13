import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  entryType: string;
  tradeId?: string;
  assetSymbol?: string;
  tradeType?: string;
  entryPrice?: number;
  exitPrice?: number;
  quantity?: number;
  strategyUsed?: string;
  reasoning?: string;
  marketConditions?: string;
  confidenceLevel: number;
  expectedOutcome?: string;
  actualOutcome?: string;
  successRating?: number;
  lessonsLearned?: string;
  tags: string[];
  mood?: string;
  marketPhase?: string;
  isPublic: boolean;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ManualTradeLog {
  id: string;
  journalEntryId?: string;
  symbol: string;
  assetName?: string;
  tradeType: string;
  entryPrice: number;
  quantity: number;
  totalValue: number;
  orderType: string;
  fees: number;
  broker?: string;
  accountType: string;
  targetPrice?: number;
  stopLossPrice?: number;
  riskRewardRatio?: number;
  positionSizePercent?: number;
  strategy?: string;
  timeHorizon: string;
  convictionLevel: number;
  marketConditions?: string;
  economicEvents: string[];
  technicalIndicators: Record<string, any>;
  currentPrice?: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  maxProfit: number;
  maxLoss: number;
  exitPrice?: number;
  exitDate?: string;
  exitReason?: string;
  realizedPnl?: number;
  realizedPnlPercent?: number;
  status: string;
  isActive: boolean;
  tradeDate: string;
  executionTime: string;
  createdAt: string;
  updatedAt: string;
}

export const ManualTradeLogger: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [tradeLogs, setTradeLogs] = useState<ManualTradeLog[]>([]);
  const [activeTab, setActiveTab] = useState<'journal' | 'trades'>('journal');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    entryType: 'general',
    assetSymbol: '',
    tradeType: '',
    entryPrice: '',
    quantity: '',
    strategyUsed: '',
    reasoning: '',
    marketConditions: '',
    confidenceLevel: 5,
    expectedOutcome: '',
    tags: [] as string[],
    mood: '',
    marketPhase: ''
  });

  // New trade form state
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    assetName: '',
    tradeType: 'buy',
    entryPrice: '',
    quantity: '',
    orderType: 'market',
    fees: '',
    broker: '',
    accountType: 'real',
    targetPrice: '',
    stopLossPrice: '',
    strategy: '',
    timeHorizon: 'medium',
    convictionLevel: 5,
    marketConditions: ''
  });

  useEffect(() => {
    fetchJournalEntries();
    fetchTradeLogs();
  }, []);

  const fetchJournalEntries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/journal/entries');
      if (response.ok) {
        const data = await response.json();
        setJournalEntries(data);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch journal entries",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTradeLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trade-logs');
      if (response.ok) {
        const data = await response.json();
        setTradeLogs(data);
      }
    } catch (error) {
      console.error('Error fetching trade logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trade logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createJournalEntry = async () => {
    if (!newEntry.content.trim()) {
      toast({
        title: "Error",
        description: "Content is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newEntry.title || undefined,
          content: newEntry.content,
          entryType: newEntry.entryType,
          assetSymbol: newEntry.assetSymbol || undefined,
          tradeType: newEntry.tradeType || undefined,
          entryPrice: newEntry.entryPrice ? parseFloat(newEntry.entryPrice) : undefined,
          quantity: newEntry.quantity ? parseFloat(newEntry.quantity) : undefined,
          strategyUsed: newEntry.strategyUsed || undefined,
          reasoning: newEntry.reasoning || undefined,
          marketConditions: newEntry.marketConditions || undefined,
          confidenceLevel: newEntry.confidenceLevel,
          expectedOutcome: newEntry.expectedOutcome || undefined,
          tags: newEntry.tags,
          mood: newEntry.mood || undefined,
          marketPhase: newEntry.marketPhase || undefined
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Journal entry created successfully"
        });
        setNewEntry({
          title: '',
          content: '',
          entryType: 'general',
          assetSymbol: '',
          tradeType: '',
          entryPrice: '',
          quantity: '',
          strategyUsed: '',
          reasoning: '',
          marketConditions: '',
          confidenceLevel: 5,
          expectedOutcome: '',
          tags: [],
          mood: '',
          marketPhase: ''
        });
        setIsAddingEntry(false);
        fetchJournalEntries();
      } else {
        throw new Error('Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive"
      });
    }
  };

  const createTradeLog = async () => {
    if (!newTrade.symbol.trim() || !newTrade.entryPrice || !newTrade.quantity) {
      toast({
        title: "Error",
        description: "Symbol, entry price, and quantity are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/trade-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: newTrade.symbol.toUpperCase(),
          assetName: newTrade.assetName || undefined,
          tradeType: newTrade.tradeType,
          entryPrice: parseFloat(newTrade.entryPrice),
          quantity: parseFloat(newTrade.quantity),
          orderType: newTrade.orderType,
          fees: newTrade.fees ? parseFloat(newTrade.fees) : 0,
          broker: newTrade.broker || undefined,
          accountType: newTrade.accountType,
          targetPrice: newTrade.targetPrice ? parseFloat(newTrade.targetPrice) : undefined,
          stopLossPrice: newTrade.stopLossPrice ? parseFloat(newTrade.stopLossPrice) : undefined,
          strategy: newTrade.strategy || undefined,
          timeHorizon: newTrade.timeHorizon,
          convictionLevel: newTrade.convictionLevel,
          marketConditions: newTrade.marketConditions || undefined
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Trade log created successfully"
        });
        setNewTrade({
          symbol: '',
          assetName: '',
          tradeType: 'buy',
          entryPrice: '',
          quantity: '',
          orderType: 'market',
          fees: '',
          broker: '',
          accountType: 'real',
          targetPrice: '',
          stopLossPrice: '',
          strategy: '',
          timeHorizon: 'medium',
          convictionLevel: 5,
          marketConditions: ''
        });
        setIsAddingTrade(false);
        fetchTradeLogs();
      } else {
        throw new Error('Failed to create trade log');
      }
    } catch (error) {
      console.error('Error creating trade log:', error);
      toast({
        title: "Error",
        description: "Failed to create trade log",
        variant: "destructive"
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/journal/export?format=csv');
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Journal data exported successfully"
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const filteredEntries = journalEntries.filter(entry => {
    if (filterType === 'all') return true;
    return entry.entryType === filterType;
  });

  const filteredTrades = tradeLogs.filter(trade => {
    if (filterStatus === 'all') return true;
    return trade.status === filterStatus;
  });

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manual Trade Journal</CardTitle>
            <CardDescription>
              Log external trades and track your trading journey with detailed journal entries
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === 'journal' ? 'default' : 'outline'}
            onClick={() => setActiveTab('journal')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Journal Entries
          </Button>
          <Button
            variant={activeTab === 'trades' ? 'default' : 'outline'}
            onClick={() => setActiveTab('trades')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Trade Logs
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'journal' && (
          <div className="space-y-4">
            {/* Journal Entry Controls */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="general">General</option>
                  <option value="trade">Trade</option>
                  <option value="analysis">Analysis</option>
                  <option value="strategy">Strategy</option>
                </select>
              </div>
              <Button onClick={() => setIsAddingEntry(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {/* Add Entry Form */}
            {isAddingEntry && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Title</label>
                      <Input
                        value={newEntry.title}
                        onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                        placeholder="Entry title (optional)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Type</label>
                      <select
                        value={newEntry.entryType}
                        onChange={(e) => setNewEntry({...newEntry, entryType: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="general">General</option>
                        <option value="trade">Trade</option>
                        <option value="analysis">Analysis</option>
                        <option value="strategy">Strategy</option>
                        <option value="lesson">Lesson</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Asset Symbol</label>
                      <Input
                        value={newEntry.assetSymbol}
                        onChange={(e) => setNewEntry({...newEntry, assetSymbol: e.target.value})}
                        placeholder="AAPL, BTC, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Strategy</label>
                      <Input
                        value={newEntry.strategyUsed}
                        onChange={(e) => setNewEntry({...newEntry, strategyUsed: e.target.value})}
                        placeholder="Swing Trading, DCA, etc."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Content</label>
                      <Textarea
                        value={newEntry.content}
                        onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                        placeholder="Write your journal entry..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Reasoning</label>
                      <Textarea
                        value={newEntry.reasoning}
                        onChange={(e) => setNewEntry({...newEntry, reasoning: e.target.value})}
                        placeholder="Your rationale and reasoning..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Market Conditions</label>
                      <Textarea
                        value={newEntry.marketConditions}
                        onChange={(e) => setNewEntry({...newEntry, marketConditions: e.target.value})}
                        placeholder="Current market conditions..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Confidence Level (1-10)</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newEntry.confidenceLevel}
                        onChange={(e) => setNewEntry({...newEntry, confidenceLevel: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Expected Outcome</label>
                      <Input
                        value={newEntry.expectedOutcome}
                        onChange={(e) => setNewEntry({...newEntry, expectedOutcome: e.target.value})}
                        placeholder="What do you expect to happen?"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createJournalEntry}>
                      Save Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Journal Entries List */}
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {entry.title && (
                          <h4 className="font-medium text-lg">{entry.title}</h4>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline">{entry.entryType}</Badge>
                          {entry.assetSymbol && (
                            <Badge variant="secondary">{entry.assetSymbol}</Badge>
                          )}
                          <span>{entry.entryDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.confidenceLevel && (
                          <span className="text-sm text-gray-600">
                            Confidence: {entry.confidenceLevel}/10
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{entry.content}</p>
                    {entry.reasoning && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Reasoning:</strong> {entry.reasoning}
                      </div>
                    )}
                    {entry.expectedOutcome && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Expected Outcome:</strong> {entry.expectedOutcome}
                      </div>
                    )}
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1">
                        {entry.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="space-y-4">
            {/* Trade Log Controls */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Trades</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <Button onClick={() => setIsAddingTrade(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Log Trade
              </Button>
            </div>

            {/* Add Trade Form */}
            {isAddingTrade && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Symbol *</label>
                      <Input
                        value={newTrade.symbol}
                        onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value})}
                        placeholder="AAPL, BTC, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Asset Name</label>
                      <Input
                        value={newTrade.assetName}
                        onChange={(e) => setNewTrade({...newTrade, assetName: e.target.value})}
                        placeholder="Apple Inc, Bitcoin, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Trade Type</label>
                      <select
                        value={newTrade.tradeType}
                        onChange={(e) => setNewTrade({...newTrade, tradeType: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Entry Price *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTrade.entryPrice}
                        onChange={(e) => setNewTrade({...newTrade, entryPrice: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Quantity *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTrade.quantity}
                        onChange={(e) => setNewTrade({...newTrade, quantity: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Target Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTrade.targetPrice}
                        onChange={(e) => setNewTrade({...newTrade, targetPrice: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Stop Loss Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTrade.stopLossPrice}
                        onChange={(e) => setNewTrade({...newTrade, stopLossPrice: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Strategy</label>
                      <Input
                        value={newTrade.strategy}
                        onChange={(e) => setNewTrade({...newTrade, strategy: e.target.value})}
                        placeholder="Swing Trading, DCA, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Broker</label>
                      <Input
                        value={newTrade.broker}
                        onChange={(e) => setNewTrade({...newTrade, broker: e.target.value})}
                        placeholder="Interactive Brokers, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Conviction Level (1-10)</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newTrade.convictionLevel}
                        onChange={(e) => setNewTrade({...newTrade, convictionLevel: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Market Conditions</label>
                      <Textarea
                        value={newTrade.marketConditions}
                        onChange={(e) => setNewTrade({...newTrade, marketConditions: e.target.value})}
                        placeholder="Current market conditions and context..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingTrade(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTradeLog}>
                      Log Trade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trade Logs List */}
            <div className="space-y-3">
              {filteredTrades.map((trade) => (
                <Card key={trade.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-lg flex items-center gap-2">
                          {trade.symbol}
                          {trade.tradeType === 'buy' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                          <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                            {trade.status}
                          </Badge>
                        </h4>
                        <div className="text-sm text-gray-500">
                          {trade.assetName} • {trade.tradeDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(trade.entryPrice)} × {trade.quantity}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {formatCurrency(trade.totalValue)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {trade.targetPrice && (
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <div className="font-medium">{formatCurrency(trade.targetPrice)}</div>
                        </div>
                      )}
                      {trade.stopLossPrice && (
                        <div>
                          <span className="text-gray-500">Stop Loss:</span>
                          <div className="font-medium">{formatCurrency(trade.stopLossPrice)}</div>
                        </div>
                      )}
                      {trade.strategy && (
                        <div>
                          <span className="text-gray-500">Strategy:</span>
                          <div className="font-medium">{trade.strategy}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Conviction:</span>
                        <div className="font-medium">{trade.convictionLevel}/10</div>
                      </div>
                    </div>

                    {trade.status === 'open' && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Unrealized P&L:</span>
                          <span className={`font-medium ${trade.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.unrealizedPnl)} ({trade.unrealizedPnlPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}

                    {trade.status === 'closed' && trade.realizedPnl !== null && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Realized P&L:</span>
                          <span className={`font-medium ${trade.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.realizedPnl)} ({trade.realizedPnlPercent?.toFixed(2)}%)
                          </span>
                        </div>
                        {trade.exitReason && (
                          <div className="text-sm text-gray-600 mt-1">
                            Exit reason: {trade.exitReason}
                          </div>
                        )}
                      </div>
                    )}

                    {trade.marketConditions && (
                      <div className="mt-3 text-sm text-gray-600">
                        <strong>Market Conditions:</strong> {trade.marketConditions}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'journal' && filteredEntries.length === 0) || 
          (activeTab === 'trades' && filteredTrades.length === 0)) && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {activeTab === 'journal' 
                ? 'No journal entries yet. Start by adding your first entry!'
                : 'No trades logged yet. Start by logging your first trade!'
              }
            </p>
            <Button onClick={() => activeTab === 'journal' ? setIsAddingEntry(true) : setIsAddingTrade(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              {activeTab === 'journal' ? 'Add Entry' : 'Log Trade'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualTradeLogger; 
  isPublic: boolean;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ManualTradeLog {
  id: string;
  journalEntryId?: string;
  symbol: string;
  assetName?: string;
  tradeType: string;
  entryPrice: number;
  quantity: number;
  totalValue: number;
  orderType: string;
  fees: number;
  broker?: string;
  accountType: string;
  targetPrice?: number;
  stopLossPrice?: number;
  riskRewardRatio?: number;
  positionSizePercent?: number;
  strategy?: string;
  timeHorizon: string;
  convictionLevel: number;
  marketConditions?: string;
  economicEvents: string[];
  technicalIndicators: Record<string, any>;
  currentPrice?: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  maxProfit: number;
  maxLoss: number;
  exitPrice?: number;
  exitDate?: string;
  exitReason?: string;
  realizedPnl?: number;
  realizedPnlPercent?: number;
  status: string;
  isActive: boolean;
  tradeDate: string;
  executionTime: string;
  createdAt: string;
  updatedAt: string;
}

export const ManualTradeLogger: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [tradeLogs, setTradeLogs] = useState<ManualTradeLog[]>([]);
  const [activeTab, setActiveTab] = useState<'journal' | 'trades'>('journal');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    entryType: 'general',
    assetSymbol: '',
    tradeType: '',
    entryPrice: '',
    quantity: '',
    strategyUsed: '',
    reasoning: '',
    marketConditions: '',
    confidenceLevel: 5,
    expectedOutcome: '',
    tags: [] as string[],
    mood: '',
    marketPhase: ''
  });

  // New trade form state
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    assetName: '',
    tradeType: 'buy',
    entryPrice: '',
    quantity: '',
    orderType: 'market',
    fees: '',
    broker: '',
    accountType: 'real',
    targetPrice: '',
    stopLossPrice: '',
    strategy: '',
    timeHorizon: 'medium',
    convictionLevel: 5,
    marketConditions: ''
  });

  useEffect(() => {
    fetchJournalEntries();
    fetchTradeLogs();
  }, []);

  const fetchJournalEntries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/journal/entries');
      if (response.ok) {
        const data = await response.json();
        setJournalEntries(data);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch journal entries",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTradeLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trade-logs');
      if (response.ok) {
        const data = await response.json();
        setTradeLogs(data);
      }
    } catch (error) {
      console.error('Error fetching trade logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trade logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createJournalEntry = async () => {
    if (!newEntry.content.trim()) {
      toast({
        title: "Error",
        description: "Content is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newEntry.title || undefined,
          content: newEntry.content,
          entryType: newEntry.entryType,
          assetSymbol: newEntry.assetSymbol || undefined,
          tradeType: newEntry.tradeType || undefined,
          entryPrice: newEntry.entryPrice ? parseFloat(newEntry.entryPrice) : undefined,
          quantity: newEntry.quantity ? parseFloat(newEntry.quantity) : undefined,
          strategyUsed: newEntry.strategyUsed || undefined,
          reasoning: newEntry.reasoning || undefined,
          marketConditions: newEntry.marketConditions || undefined,
          confidenceLevel: newEntry.confidenceLevel,
          expectedOutcome: newEntry.expectedOutcome || undefined,
          tags: newEntry.tags,
          mood: newEntry.mood || undefined,
          marketPhase: newEntry.marketPhase || undefined
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Journal entry created successfully"
        });
        setNewEntry({
          title: '',
          content: '',
          entryType: 'general',
          assetSymbol: '',
          tradeType: '',
          entryPrice: '',
          quantity: '',
          strategyUsed: '',
          reasoning: '',
          marketConditions: '',
          confidenceLevel: 5,
          expectedOutcome: '',
          tags: [],
          mood: '',
          marketPhase: ''
        });
        setIsAddingEntry(false);
        fetchJournalEntries();
      } else {
        throw new Error('Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive"
      });
    }
  };

  const createTradeLog = async () => {
    if (!newTrade.symbol.trim() || !newTrade.entryPrice || !newTrade.quantity) {
      toast({
        title: "Error",
        description: "Symbol, entry price, and quantity are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/trade-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: newTrade.symbol.toUpperCase(),
          assetName: newTrade.assetName || undefined,
          tradeType: newTrade.tradeType,
          entryPrice: parseFloat(newTrade.entryPrice),
          quantity: parseFloat(newTrade.quantity),
          orderType: newTrade.orderType,
          fees: newTrade.fees ? parseFloat(newTrade.fees) : 0,
          broker: newTrade.broker || undefined,
          accountType: newTrade.accountType,
          targetPrice: newTrade.targetPrice ? parseFloat(newTrade.targetPrice) : undefined,
          stopLossPrice: newTrade.stopLossPrice ? parseFloat(newTrade.stopLossPrice) : undefined,
          strategy: newTrade.strategy || undefined,
          timeHorizon: newTrade.timeHorizon,
          convictionLevel: newTrade.convictionLevel,
          marketConditions: newTrade.marketConditions || undefined
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Trade log created successfully"
        });
        setNewTrade({
          symbol: '',
          assetName: '',
          tradeType: 'buy',
          entryPrice: '',
          quantity: '',
          orderType: 'market',
          fees: '',
          broker: '',
          accountType: 'real',
          targetPrice: '',
          stopLossPrice: '',
          strategy: '',
          timeHorizon: 'medium',
          convictionLevel: 5,
          marketConditions: ''
        });
        setIsAddingTrade(false);
        fetchTradeLogs();
      } else {
        throw new Error('Failed to create trade log');
      }
    } catch (error) {
      console.error('Error creating trade log:', error);
      toast({
        title: "Error",
        description: "Failed to create trade log",
        variant: "destructive"
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/journal/export?format=csv');
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Journal data exported successfully"
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const filteredEntries = journalEntries.filter(entry => {
    if (filterType === 'all') return true;
    return entry.entryType === filterType;
  });

  const filteredTrades = tradeLogs.filter(trade => {
    if (filterStatus === 'all') return true;
    return trade.status === filterStatus;
  });

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manual Trade Journal</CardTitle>
            <CardDescription>
              Log external trades and track your trading journey with detailed journal entries
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === 'journal' ? 'default' : 'outline'}
            onClick={() => setActiveTab('journal')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Journal Entries
          </Button>
          <Button
            variant={activeTab === 'trades' ? 'default' : 'outline'}
            onClick={() => setActiveTab('trades')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Trade Logs
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'journal' && (
          <div className="space-y-4">
            {/* Journal Entry Controls */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="general">General</option>
                  <option value="trade">Trade</option>
                  <option value="analysis">Analysis</option>
                  <option value="strategy">Strategy</option>
                </select>
              </div>
              <Button onClick={() => setIsAddingEntry(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {/* Add Entry Form */}
            {isAddingEntry && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Title</label>
                      <Input
                        value={newEntry.title}
                        onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                        placeholder="Entry title (optional)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Type</label>
                      <select
                        value={newEntry.entryType}
                        onChange={(e) => setNewEntry({...newEntry, entryType: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="general">General</option>
                        <option value="trade">Trade</option>
                        <option value="analysis">Analysis</option>
                        <option value="strategy">Strategy</option>
                        <option value="lesson">Lesson</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Asset Symbol</label>
                      <Input
                        value={newEntry.assetSymbol}
                        onChange={(e) => setNewEntry({...newEntry, assetSymbol: e.target.value})}
                        placeholder="AAPL, BTC, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Strategy</label>
                      <Input
                        value={newEntry.strategyUsed}
                        onChange={(e) => setNewEntry({...newEntry, strategyUsed: e.target.value})}
                        placeholder="Swing Trading, DCA, etc."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Content</label>
                      <Textarea
                        value={newEntry.content}
                        onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                        placeholder="Write your journal entry..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Reasoning</label>
                      <Textarea
                        value={newEntry.reasoning}
                        onChange={(e) => setNewEntry({...newEntry, reasoning: e.target.value})}
                        placeholder="Your rationale and reasoning..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Market Conditions</label>
                      <Textarea
                        value={newEntry.marketConditions}
                        onChange={(e) => setNewEntry({...newEntry, marketConditions: e.target.value})}
                        placeholder="Current market conditions..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Confidence Level (1-10)</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newEntry.confidenceLevel}
                        onChange={(e) => setNewEntry({...newEntry, confidenceLevel: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Expected Outcome</label>
                      <Input
                        value={newEntry.expectedOutcome}
                        onChange={(e) => setNewEntry({...newEntry, expectedOutcome: e.target.value})}
                        placeholder="What do you expect to happen?"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createJournalEntry}>
                      Save Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Journal Entries List */}
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {entry.title && (
                          <h4 className="font-medium text-lg">{entry.title}</h4>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline">{entry.entryType}</Badge>
                          {entry.assetSymbol && (
                            <Badge variant="secondary">{entry.assetSymbol}</Badge>
                          )}
                          <span>{entry.entryDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.confidenceLevel && (
                          <span className="text-sm text-gray-600">
                            Confidence: {entry.confidenceLevel}/10
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{entry.content}</p>
                    {entry.reasoning && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Reasoning:</strong> {entry.reasoning}
                      </div>
                    )}
                    {entry.expectedOutcome && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Expected Outcome:</strong> {entry.expectedOutcome}
                      </div>
                    )}
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1">
                        {entry.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="space-y-4">
            {/* Trade Log Controls */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Trades</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <Button onClick={() => setIsAddingTrade(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Log Trade
              </Button>
            </div>

            {/* Add Trade Form */}
            {isAddingTrade && (
              <Card className="border-2 border-dashed">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Symbol *</label>
                      <Input
                        value={newTrade.symbol}
                        onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value})}
                        placeholder="AAPL, BTC, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Asset Name</label>
                      <Input
                        value={newTrade.assetName}
                        onChange={(e) => setNewTrade({...newTrade, assetName: e.target.value})}
                        placeholder="Apple Inc, Bitcoin, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Trade Type</label>
                      <select
                        value={newTrade.tradeType}
                        onChange={(e) => setNewTrade({...newTrade, tradeType: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Entry Price *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTrade.entryPrice}
                        onChange={(e) => setNewTrade({...newTrade, entryPrice: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Quantity *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTrade.quantity}
                        onChange={(e) => setNewTrade({...newTrade, quantity: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Target Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTrade.targetPrice}
                        onChange={(e) => setNewTrade({...newTrade, targetPrice: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Stop Loss Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newTrade.stopLossPrice}
                        onChange={(e) => setNewTrade({...newTrade, stopLossPrice: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Strategy</label>
                      <Input
                        value={newTrade.strategy}
                        onChange={(e) => setNewTrade({...newTrade, strategy: e.target.value})}
                        placeholder="Swing Trading, DCA, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Broker</label>
                      <Input
                        value={newTrade.broker}
                        onChange={(e) => setNewTrade({...newTrade, broker: e.target.value})}
                        placeholder="Interactive Brokers, etc."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Conviction Level (1-10)</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newTrade.convictionLevel}
                        onChange={(e) => setNewTrade({...newTrade, convictionLevel: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Market Conditions</label>
                      <Textarea
                        value={newTrade.marketConditions}
                        onChange={(e) => setNewTrade({...newTrade, marketConditions: e.target.value})}
                        placeholder="Current market conditions and context..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingTrade(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTradeLog}>
                      Log Trade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trade Logs List */}
            <div className="space-y-3">
              {filteredTrades.map((trade) => (
                <Card key={trade.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-lg flex items-center gap-2">
                          {trade.symbol}
                          {trade.tradeType === 'buy' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                          <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                            {trade.status}
                          </Badge>
                        </h4>
                        <div className="text-sm text-gray-500">
                          {trade.assetName} • {trade.tradeDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(trade.entryPrice)} × {trade.quantity}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {formatCurrency(trade.totalValue)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {trade.targetPrice && (
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <div className="font-medium">{formatCurrency(trade.targetPrice)}</div>
                        </div>
                      )}
                      {trade.stopLossPrice && (
                        <div>
                          <span className="text-gray-500">Stop Loss:</span>
                          <div className="font-medium">{formatCurrency(trade.stopLossPrice)}</div>
                        </div>
                      )}
                      {trade.strategy && (
                        <div>
                          <span className="text-gray-500">Strategy:</span>
                          <div className="font-medium">{trade.strategy}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Conviction:</span>
                        <div className="font-medium">{trade.convictionLevel}/10</div>
                      </div>
                    </div>

                    {trade.status === 'open' && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Unrealized P&L:</span>
                          <span className={`font-medium ${trade.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.unrealizedPnl)} ({trade.unrealizedPnlPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}

                    {trade.status === 'closed' && trade.realizedPnl !== null && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Realized P&L:</span>
                          <span className={`font-medium ${trade.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.realizedPnl)} ({trade.realizedPnlPercent?.toFixed(2)}%)
                          </span>
                        </div>
                        {trade.exitReason && (
                          <div className="text-sm text-gray-600 mt-1">
                            Exit reason: {trade.exitReason}
                          </div>
                        )}
                      </div>
                    )}

                    {trade.marketConditions && (
                      <div className="mt-3 text-sm text-gray-600">
                        <strong>Market Conditions:</strong> {trade.marketConditions}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'journal' && filteredEntries.length === 0) || 
          (activeTab === 'trades' && filteredTrades.length === 0)) && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {activeTab === 'journal' 
                ? 'No journal entries yet. Start by adding your first entry!'
                : 'No trades logged yet. Start by logging your first trade!'
              }
            </p>
            <Button onClick={() => activeTab === 'journal' ? setIsAddingEntry(true) : setIsAddingTrade(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              {activeTab === 'journal' ? 'Add Entry' : 'Log Trade'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualTradeLogger; 