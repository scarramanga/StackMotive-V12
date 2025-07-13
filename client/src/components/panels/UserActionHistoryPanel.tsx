import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  History,
  RotateCcw,
  Tag,
  Settings,
  TrendingUp,
  CheckCircle,
  X,
  Search,
  Clock,
  User,
  Filter,
  Calendar,
  Loader2,
  Info,
  BarChart3,
  Database
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface UserAction {
  id: string;
  timestamp: string;
  actionType: 'rotation' | 'tagging' | 'dca_update' | 'strategy_toggle' | 'strategy_delete' | 'rebalance_confirm' | 'rebalance_cancel' | 'config_change';
  description: string;
  targetAsset?: string;
  targetStrategy?: string;
  previousValue?: string;
  newValue?: string;
  metadata: {
    source: 'manual' | 'api' | 'scheduled';
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
  status: 'completed' | 'pending' | 'failed';
  impact: {
    affectedOverlays: number;
    valueChanged: number;
    riskDelta: number;
  };
}

interface ActionSummary {
  totalActions: number;
  lastActionTimestamp: string;
  actionsByType: Record<string, number>;
  recentActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

interface UserActionHistoryData {
  actions: UserAction[];
  summary: ActionSummary;
  totalCount: number;
  hasMore: boolean;
}

export const UserActionHistoryPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const queryClient = useQueryClient();
  
  // State management
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDetails, setShowDetails] = useState<{[key: string]: boolean}>({});
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Fetch user action history
  const { data: historyData, isLoading, error } = useQuery<UserActionHistoryData>({
    queryKey: ['/api/user/action-history', activeVaultId, filterType, searchTerm, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (activeVaultId) params.append('vaultId', activeVaultId);
      if (filterType !== 'all') params.append('type', filterType);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      
      const res = await fetch(`/api/user/action-history?${params}`);
      if (!res.ok) throw new Error('Failed to fetch action history');
      return res.json();
    },
    enabled: !!user && !!activeVaultId,
    refetchInterval: 30000,
  });

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setPage(1); // Reset to first page when filtering
  };

  // Toggle action details
  const toggleDetails = (actionId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  // Get action icon
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'rotation':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'tagging':
        return <Tag className="h-4 w-4 text-green-600" />;
      case 'dca_update':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case 'strategy_toggle':
        return <Settings className="h-4 w-4 text-orange-600" />;
      case 'strategy_delete':
        return <X className="h-4 w-4 text-red-600" />;
      case 'rebalance_confirm':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rebalance_cancel':
        return <X className="h-4 w-4 text-red-600" />;
      case 'config_change':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get action type badge
  const getActionTypeBadge = (actionType: string) => {
    switch (actionType) {
      case 'rotation':
        return <Badge className="bg-blue-100 text-blue-800">Rotation</Badge>;
      case 'tagging':
        return <Badge className="bg-green-100 text-green-800">Tagging</Badge>;
      case 'dca_update':
        return <Badge className="bg-purple-100 text-purple-800">DCA Update</Badge>;
      case 'strategy_toggle':
        return <Badge className="bg-orange-100 text-orange-800">Strategy Toggle</Badge>;
      case 'strategy_delete':
        return <Badge className="bg-red-100 text-red-800">Strategy Delete</Badge>;
      case 'rebalance_confirm':
        return <Badge className="bg-green-100 text-green-800">Rebalance Confirm</Badge>;
      case 'rebalance_cancel':
        return <Badge className="bg-red-100 text-red-800">Rebalance Cancel</Badge>;
      case 'config_change':
        return <Badge className="bg-gray-100 text-gray-800">Config Change</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{actionType}</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatTime(timestamp);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading action history: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading action history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!historyData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No action history available
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
            <History className="h-5 w-5" />
            User Action History
          </div>
          <div className="text-sm text-muted-foreground">
            {historyData.totalCount} total actions
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {historyData.summary.totalActions}
              </div>
              <div className="text-sm text-blue-700">Total Actions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {historyData.summary.recentActivity.last24h}
              </div>
              <div className="text-sm text-green-700">Last 24h</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {historyData.summary.recentActivity.last7d}
              </div>
              <div className="text-sm text-yellow-700">Last 7 days</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-700">Last Action</div>
              <div className="text-xs text-purple-600">
                {formatRelativeTime(historyData.summary.lastActionTimestamp)}
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by strategy, asset, or description..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={filterType} onValueChange={handleFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="rotation">Rotations</SelectItem>
                  <SelectItem value="tagging">Tagging</SelectItem>
                  <SelectItem value="dca_update">DCA Updates</SelectItem>
                  <SelectItem value="strategy_toggle">Strategy Toggles</SelectItem>
                  <SelectItem value="strategy_delete">Strategy Deletes</SelectItem>
                  <SelectItem value="rebalance_confirm">Rebalance Confirms</SelectItem>
                  <SelectItem value="rebalance_cancel">Rebalance Cancels</SelectItem>
                  <SelectItem value="config_change">Config Changes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Type Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Actions by Type</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(historyData.summary.actionsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getActionIcon(type)}
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{count}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Actions List */}
          <div className="space-y-3">
            {historyData.actions.map((action) => (
              <div key={action.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getActionIcon(action.actionType)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getActionTypeBadge(action.actionType)}
                        {getStatusBadge(action.status)}
                        <div className="text-sm text-muted-foreground">
                          {formatRelativeTime(action.timestamp)}
                        </div>
                      </div>
                      <div className="font-medium mb-2">{action.description}</div>
                      
                      {(action.targetAsset || action.targetStrategy) && (
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {action.targetAsset && (
                            <div>Asset: <span className="font-medium">{action.targetAsset}</span></div>
                          )}
                          {action.targetStrategy && (
                            <div>Strategy: <span className="font-medium">{action.targetStrategy}</span></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleDetails(action.id)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Impact Summary */}
                {action.impact && (
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-muted-foreground mb-1">Affected Overlays</div>
                      <div className="font-medium">{action.impact.affectedOverlays}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Value Change</div>
                      <div className={`font-medium ${action.impact.valueChanged !== 0 ? (action.impact.valueChanged > 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                        {action.impact.valueChanged !== 0 ? formatCurrency(action.impact.valueChanged) : 'No change'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Risk Delta</div>
                      <div className={`font-medium ${action.impact.riskDelta !== 0 ? (action.impact.riskDelta > 0 ? 'text-red-600' : 'text-green-600') : ''}`}>
                        {action.impact.riskDelta !== 0 ? formatPercentage(action.impact.riskDelta) : 'No change'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Value Changes */}
                {(action.previousValue || action.newValue) && (
                  <div className="p-3 bg-muted/30 rounded text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      {action.previousValue && (
                        <div>
                          <div className="text-muted-foreground mb-1">Previous Value</div>
                          <div className="font-mono">{action.previousValue}</div>
                        </div>
                      )}
                      {action.newValue && (
                        <div>
                          <div className="text-muted-foreground mb-1">New Value</div>
                          <div className="font-mono">{action.newValue}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed Information */}
                {showDetails[action.id] && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-blue-600 font-medium mb-1">Timestamp</div>
                          <div>{formatTime(action.timestamp)}</div>
                        </div>
                        <div>
                          <div className="text-blue-600 font-medium mb-1">Source</div>
                          <div className="capitalize">{action.metadata.source}</div>
                        </div>
                      </div>
                      
                      {action.metadata.userAgent && (
                        <div>
                          <div className="text-blue-600 font-medium mb-1">User Agent</div>
                          <div className="font-mono text-xs">{action.metadata.userAgent}</div>
                        </div>
                      )}
                      
                      {action.metadata.sessionId && (
                        <div>
                          <div className="text-blue-600 font-medium mb-1">Session ID</div>
                          <div className="font-mono text-xs">{action.metadata.sessionId}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {historyData.hasMore && (
            <div className="text-center">
              <Button
                onClick={() => setPage(page + 1)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}

          {/* No Results */}
          {historyData.actions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterType !== 'all' 
                ? 'No actions found matching your filters'
                : 'No actions recorded yet'
              }
            </div>
          )}

          {/* Footer Information */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Action History Information</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• <strong>Automatic Tracking:</strong> All user-triggered changes are recorded automatically</div>
              <div>• <strong>Search:</strong> Find actions by strategy name, asset symbol, or description keywords</div>
              <div>• <strong>Impact Metrics:</strong> Track how changes affect portfolio value and risk profile</div>
              <div>• <strong>Data Retention:</strong> Action history is maintained for audit and analysis purposes</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserActionHistoryPanel; 