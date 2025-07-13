import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Camera,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Calendar,
  DollarSign,
  Target,
  Shield,
  ArrowUpDown,
  Loader2,
  Eye,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface OverlaySnapshot {
  id: string;
  name: string;
  weight: number;
  previousWeight?: number;
  signalState: 'bullish' | 'bearish' | 'neutral';
  trustScore: number;
  strategyTags: string[];
  value: number;
  assetCount: number;
}

interface VaultSnapshot {
  id: string;
  timestamp: string;
  totalValue: number;
  overlayCount: number;
  avgTrustScore: number;
  triggerSource: 'manual' | 'auto' | 'dca' | 'rebalance';
  overlays: OverlaySnapshot[];
  metadata: {
    riskLevel: number;
    diversificationScore: number;
    volatility: number;
    performanceSinceLastSnapshot: number;
  };
  notes?: string;
}

interface VaultSnapshotData {
  snapshots: Array<{
    id: string;
    timestamp: string;
    totalValue: number;
    triggerSource: string;
  }>;
  currentSnapshot?: VaultSnapshot;
}

export const VaultSnapshotViewerPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [sortField, setSortField] = useState<string>('weight');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [hoveredOverlay, setHoveredOverlay] = useState<string | null>(null);

  // Fetch vault snapshots list
  const { data: snapshotsData, isLoading: snapshotsLoading, error: snapshotsError } = useQuery<VaultSnapshotData>({
    queryKey: ['/api/vault/snapshots', activeVaultId],
    queryFn: async () => {
      const url = activeVaultId 
        ? `/api/vault/snapshots?vaultId=${activeVaultId}`
        : '/api/vault/snapshots';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch vault snapshots');
      return res.json();
    },
    enabled: !!user && !!activeVaultId,
    refetchInterval: 60000,
  });

  // Fetch specific snapshot details
  const { data: snapshotData, isLoading: snapshotLoading, error: snapshotError } = useQuery<VaultSnapshot>({
    queryKey: ['/api/vault/snapshot', selectedSnapshotId, activeVaultId],
    queryFn: async () => {
      const url = activeVaultId 
        ? `/api/vault/snapshot/${selectedSnapshotId}?vaultId=${activeVaultId}`
        : `/api/vault/snapshot/${selectedSnapshotId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch snapshot details');
      return res.json();
    },
    enabled: !!selectedSnapshotId && !!user && !!activeVaultId,
  });

  // Auto-select latest snapshot
  React.useEffect(() => {
    if (snapshotsData?.snapshots.length && !selectedSnapshotId) {
      setSelectedSnapshotId(snapshotsData.snapshots[0].id);
    }
  }, [snapshotsData, selectedSnapshotId]);

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!snapshotData) return;
    
    setIsExporting(true);
    try {
      const url = activeVaultId 
        ? `/api/vault/snapshot/${selectedSnapshotId}/export?format=${format}&vaultId=${activeVaultId}`
        : `/api/vault/snapshot/${selectedSnapshotId}/export?format=${format}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to export ${format.toUpperCase()}`);
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `vault-snapshot-${selectedSnapshotId}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort overlays
  const sortedOverlays = React.useMemo(() => {
    if (!snapshotData?.overlays) return [];
    
    return [...snapshotData.overlays].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'weight':
          aVal = a.weight;
          bVal = b.weight;
          break;
        case 'trustScore':
          aVal = a.trustScore;
          bVal = b.trustScore;
          break;
        case 'value':
          aVal = a.value;
          bVal = b.value;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [snapshotData?.overlays, sortField, sortDirection]);

  // Get signal badge
  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case 'bullish':
        return <Badge className="bg-green-100 text-green-800">Bullish</Badge>;
      case 'bearish':
        return <Badge className="bg-red-100 text-red-800">Bearish</Badge>;
      case 'neutral':
        return <Badge className="bg-gray-100 text-gray-800">Neutral</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{signal}</Badge>;
    }
  };

  // Get signal icon
  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get trigger source badge
  const getTriggerSourceBadge = (source: string) => {
    switch (source) {
      case 'manual':
        return <Badge className="bg-blue-100 text-blue-800">Manual</Badge>;
      case 'auto':
        return <Badge className="bg-purple-100 text-purple-800">Auto</Badge>;
      case 'dca':
        return <Badge className="bg-yellow-100 text-yellow-800">DCA</Badge>;
      case 'rebalance':
        return <Badge className="bg-orange-100 text-orange-800">Rebalance</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{source}</Badge>;
    }
  };

  // Get trust score color
  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />;
  };

  if (snapshotsError || snapshotError) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading vault snapshots: {snapshotsError?.message || snapshotError?.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (snapshotsLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading vault snapshots...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!snapshotsData?.snapshots.length) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No vault snapshots available
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
            <Camera className="h-5 w-5" />
            Vault Snapshot Viewer
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={isExporting || !snapshotData}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={isExporting || !snapshotData}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Snapshot Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Snapshot
            </label>
            <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a snapshot to view" />
              </SelectTrigger>
              <SelectContent>
                {snapshotsData.snapshots.map((snapshot) => (
                  <SelectItem key={snapshot.id} value={snapshot.id}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatTime(snapshot.timestamp)}</span>
                      <span className="text-muted-foreground">
                        ({formatCurrency(snapshot.totalValue)})
                      </span>
                      {getTriggerSourceBadge(snapshot.triggerSource)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {snapshotLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
              Loading snapshot details...
            </div>
          )}

          {snapshotData && (
            <>
              {/* Snapshot Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(snapshotData.totalValue)}
                  </div>
                  <div className="text-sm text-blue-700">Total Value</div>
                  {snapshotData.metadata.performanceSinceLastSnapshot !== 0 && (
                    <div className={`text-xs ${
                      snapshotData.metadata.performanceSinceLastSnapshot > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {snapshotData.metadata.performanceSinceLastSnapshot > 0 ? '+' : ''}
                      {snapshotData.metadata.performanceSinceLastSnapshot.toFixed(2)}%
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {snapshotData.overlayCount}
                  </div>
                  <div className="text-sm text-green-700">Active Overlays</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {snapshotData.avgTrustScore.toFixed(1)}%
                  </div>
                  <div className="text-sm text-yellow-700">Avg Trust Score</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-700">Trigger Source</div>
                  <div className="mt-1">
                    {getTriggerSourceBadge(snapshotData.triggerSource)}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Risk Level</div>
                    <div className="font-medium">{snapshotData.metadata.riskLevel.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Diversification</div>
                    <div className="font-medium">{snapshotData.metadata.diversificationScore.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Volatility</div>
                    <div className="font-medium">{snapshotData.metadata.volatility.toFixed(2)}%</div>
                  </div>
                </div>
                {snapshotData.notes && (
                  <div className="mt-3 text-sm">
                    <div className="text-muted-foreground mb-1">Notes</div>
                    <div>{snapshotData.notes}</div>
                  </div>
                )}
              </div>

              {/* Overlays Table */}
              <div>
                <h3 className="font-medium mb-4">Overlay Breakdown</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th 
                            className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-2">
                              Overlay
                              {getSortIcon('name')}
                            </div>
                          </th>
                          <th 
                            className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70"
                            onClick={() => handleSort('weight')}
                          >
                            <div className="flex items-center gap-2">
                              Weight
                              {getSortIcon('weight')}
                            </div>
                          </th>
                          <th className="text-left p-3 font-medium">Signal</th>
                          <th 
                            className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70"
                            onClick={() => handleSort('trustScore')}
                          >
                            <div className="flex items-center gap-2">
                              Trust Score
                              {getSortIcon('trustScore')}
                            </div>
                          </th>
                          <th className="text-left p-3 font-medium">Strategy Tags</th>
                          <th 
                            className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70"
                            onClick={() => handleSort('value')}
                          >
                            <div className="flex items-center gap-2">
                              Value
                              {getSortIcon('value')}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedOverlays.map((overlay) => (
                          <tr 
                            key={overlay.id} 
                            className="border-t border-border hover:bg-muted/30"
                            onMouseEnter={() => setHoveredOverlay(overlay.id)}
                            onMouseLeave={() => setHoveredOverlay(null)}
                          >
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{overlay.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {overlay.assetCount} assets
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{formatPercentage(overlay.weight)}</div>
                                {overlay.previousWeight && (
                                  <div className={`text-xs ${
                                    overlay.weight > overlay.previousWeight 
                                      ? 'text-green-600' 
                                      : 'text-red-600'
                                  }`}>
                                    ({overlay.weight > overlay.previousWeight ? '+' : ''}
                                    {(overlay.weight - overlay.previousWeight).toFixed(2)}%)
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {getSignalIcon(overlay.signalState)}
                                {getSignalBadge(overlay.signalState)}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className={`font-medium ${getTrustScoreColor(overlay.trustScore)}`}>
                                {overlay.trustScore.toFixed(1)}%
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1 flex-wrap">
                                {overlay.strategyTags.map((tag, index) => (
                                  <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{formatCurrency(overlay.value)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Tooltip Information */}
              {hoveredOverlay && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Signal & Trust Score Logic</span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• <strong>Bullish:</strong> AI signals indicate upward price momentum</div>
                    <div>• <strong>Bearish:</strong> AI signals indicate downward price pressure</div>
                    <div>• <strong>Neutral:</strong> Mixed or unclear signals from AI analysis</div>
                    <div>• <strong>Trust Score:</strong> Confidence level based on signal strength, historical accuracy, and market conditions</div>
                  </div>
                </div>
              )}

              {/* Export Information */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Export Options</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• <strong>CSV Export:</strong> Tabular data for analysis in spreadsheet applications</div>
                  <div>• <strong>PDF Export:</strong> Formatted report with charts and summary information</div>
                  <div>• <strong>Data Included:</strong> All overlay details, weights, trust scores, and metadata</div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VaultSnapshotViewerPanel; 