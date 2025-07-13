import React, { useState, useEffect } from 'react';
// import { PanelAnimator } from '@/components/ui/panel-animator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Tag, Filter, TrendingUp, TrendingDown } from 'lucide-react';

interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  tags: string[];
  sector: string;
  lastUpdated: string;
}

interface HoldingsReviewPanelProps {
  userId: string;
}

export const HoldingsReviewPanel: React.FC<HoldingsReviewPanelProps> = ({ userId }) => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof Holding>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchHoldings();
  }, [userId]);

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/holdings/all/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch holdings');
      const data = await response.json();
      setHoldings(data.holdings || []);
      
      // Log to Agent Memory
      await fetch('/api/agent-memory/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'VIEW_HOLDINGS_REVIEW',
          blockId: 7,
          data: { holdingsCount: data.holdings?.length || 0 }
        })
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load holdings');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: keyof Holding) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleTagHolding = async (holdingId: string, tag: string) => {
    try {
      await fetch(`/api/holdings/tag/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdingId, tag })
      });
      
      // Update local state
      setHoldings(prev => prev.map(h => 
        h.id === holdingId 
          ? { ...h, tags: [...h.tags, tag] }
          : h
      ));
      
      // Log to Agent Memory
      await fetch('/api/agent-memory/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'TAG_HOLDING',
          blockId: 7,
          data: { holdingId, tag }
        })
      });
    } catch (err) {
      console.error('Failed to tag holding:', err);
    }
  };

  const filteredAndSortedHoldings = holdings
    .filter(h => {
      const matchesSearch = h.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           h.sector.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = filterSector === 'all' || h.sector === filterSector;
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => h.tags.includes(tag));
      return matchesSearch && matchesSector && matchesTags;
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }
      return String(aVal).localeCompare(String(bVal)) * multiplier;
    });

  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalGainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0);
  const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

  const sectors = Array.from(new Set(holdings.map(h => h.sector)));
  const allTags = Array.from(new Set(holdings.flatMap(h => h.tags)));

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Holdings Review Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-gray-600">Total Portfolio Value</div>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Total Gain/Loss</div>
              <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Total Return %</div>
              <div className={`text-2xl font-bold ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Input
              placeholder="Search holdings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="max-w-xs"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (tagInput && !selectedTags.includes(tagInput)) {
                    setSelectedTags([...selectedTags, tagInput]);
                    setTagInput('');
                  }
                }}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}

          {/* Holdings Table */}
          {loading ? (
            <div className="text-center py-8">Loading holdings...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error: {error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('symbol')}
                    >
                      Symbol <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-right"
                      onClick={() => handleSort('quantity')}
                    >
                      Quantity <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-right"
                      onClick={() => handleSort('avgPrice')}
                    >
                      Avg Price <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-right"
                      onClick={() => handleSort('currentPrice')}
                    >
                      Current Price <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-right"
                      onClick={() => handleSort('totalValue')}
                    >
                      Total Value <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-right"
                      onClick={() => handleSort('gainLossPercent')}
                    >
                      Gain/Loss % <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedHoldings.map((holding) => (
                    <TableRow key={holding.id}>
                      <TableCell className="font-medium">{holding.symbol}</TableCell>
                      <TableCell className="text-right">{holding.quantity.toFixed(4)}</TableCell>
                      <TableCell className="text-right">${holding.avgPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${holding.currentPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${holding.totalValue.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-medium ${holding.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {holding.gainLossPercent >= 0 ? (
                          <TrendingUp className="h-4 w-4 inline mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 inline mr-1" />
                        )}
                        {holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{holding.sector}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {holding.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const tag = prompt('Enter tag:');
                            if (tag) handleTagHolding(holding.id, tag);
                          }}
                        >
                          <Tag className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HoldingsReviewPanel; 