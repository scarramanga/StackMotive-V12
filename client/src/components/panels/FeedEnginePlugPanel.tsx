import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Plug,
  Settings,
  TestTube,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  Clock,
  Activity,
  BarChart3,
  Zap,
  Filter,
  Info,
  Play,
  Loader2,
  Database,
  Cloud,
  Webhook,
  Monitor,
  Server,
  Calendar,
  TrendingUp,
  AlertTriangle,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface Plugin {
  id: string;
  name: string;
  description: string;
  type: 'data_source' | 'signal_processor' | 'execution_engine' | 'notification' | 'webhook' | 'analytics' | 'other';
  version: string;
  author: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  enabled: boolean;
  configuration: Record<string, any>;
  permissions: string[];
  dependencies: string[];
  lastUpdated: string;
  metadata: {
    signalTypes: string[];
    dataFormats: string[];
    endpoints: string[];
    rateLimit: number;
    timeout: number;
  };
  statistics: {
    totalSignals: number;
    successRate: number;
    avgResponseTime: number;
    errorCount: number;
    lastSignal?: string;
    lastError?: string;
  };
}

interface PluginTest {
  id: string;
  pluginId: string;
  testType: 'connection' | 'signal' | 'configuration' | 'performance';
  payload: any;
  results: {
    success: boolean;
    message: string;
    data?: any;
    responseTime: number;
    timestamp: string;
  };
}

interface PluginData {
  plugins: Plugin[];
  summary: {
    total: number;
    active: number;
    inactive: number;
    error: number;
    byType: Record<string, number>;
    totalSignals: number;
    avgSuccessRate: number;
  };
  lastUpdated: string;
}

export const FeedEnginePlugPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPayload, setTestPayload] = useState('{}');
  const [testType, setTestType] = useState<'connection' | 'signal' | 'configuration' | 'performance'>('connection');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive' | 'error'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'status' | 'lastUsed'>('name');

  // Fetch plugins data
  const { data: pluginData, isLoading, error } = useQuery<PluginData>({
    queryKey: ['/api/feeds/plugins', activeVaultId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeVaultId) params.append('vaultId', activeVaultId);
      
      const res = await fetch(`/api/feeds/plugins?${params}`);
      if (!res.ok) throw new Error('Failed to fetch plugins');
      return res.json();
    },
    enabled: !!user && !!activeVaultId,
    refetchInterval: 30000,
  });

  // Toggle plugin mutation
  const togglePluginMutation = useMutation({
    mutationFn: async ({ pluginId, enabled }: { pluginId: string; enabled: boolean }) => {
      const res = await fetch('/api/feeds/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          enabled,
          vaultId: activeVaultId,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to toggle plugin');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feeds/plugins'] });
    },
  });

  // Test plugin mutation
  const testPluginMutation = useMutation({
    mutationFn: async ({ pluginId, testType, payload }: { pluginId: string; testType: string; payload: any }) => {
      const res = await fetch('/api/feeds/plugins/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          testType,
          payload,
          vaultId: activeVaultId,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to test plugin');
      return res.json();
    },
  });

  // Handle plugin toggle
  const handleTogglePlugin = (plugin: Plugin) => {
    togglePluginMutation.mutate({
      pluginId: plugin.id,
      enabled: !plugin.enabled,
    });
  };

  // Handle test plugin
  const handleTestPlugin = () => {
    if (!selectedPlugin) return;
    
    try {
      const payload = JSON.parse(testPayload);
      testPluginMutation.mutate({
        pluginId: selectedPlugin.id,
        testType,
        payload,
      });
    } catch (error) {
      console.error('Invalid JSON payload:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/feeds/plugins'] });
  };

  // Filter and sort plugins
  const filteredAndSortedPlugins = React.useMemo(() => {
    if (!pluginData?.plugins) return [];

    let filtered = pluginData.plugins.filter(plugin => {
      switch (filterType) {
        case 'active':
          return plugin.enabled && plugin.status === 'active';
        case 'inactive':
          return !plugin.enabled || plugin.status === 'inactive';
        case 'error':
          return plugin.status === 'error';
        default:
          return true;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'lastUsed':
          if (!a.statistics.lastSignal && !b.statistics.lastSignal) return 0;
          if (!a.statistics.lastSignal) return 1;
          if (!b.statistics.lastSignal) return -1;
          return new Date(b.statistics.lastSignal).getTime() - new Date(a.statistics.lastSignal).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [pluginData?.plugins, filterType, sortBy]);

  // Get plugin type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'data_source':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'signal_processor':
        return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'execution_engine':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'notification':
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
      case 'webhook':
        return <Webhook className="h-4 w-4 text-orange-600" />;
      case 'analytics':
        return <BarChart3 className="h-4 w-4 text-indigo-600" />;
      default:
        return <Code className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get plugin type badge
  const getTypeBadge = (type: string) => {
    const typeColors = {
      data_source: 'bg-blue-100 text-blue-800',
      signal_processor: 'bg-yellow-100 text-yellow-800',
      execution_engine: 'bg-green-100 text-green-800',
      notification: 'bg-purple-100 text-purple-800',
      webhook: 'bg-orange-100 text-orange-800',
      analytics: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || typeColors.other}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading plugins: {error.message}
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
            Loading plugins...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pluginData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No plugin data available
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
            <Plug className="h-5 w-5" />
            Feed Engine Plug
            <Badge className="bg-blue-100 text-blue-800">
              {pluginData.summary.active} of {pluginData.summary.total}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {pluginData.summary.active}
              </div>
              <div className="text-sm text-green-700">Active Plugins</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {pluginData.summary.inactive}
              </div>
              <div className="text-sm text-gray-700">Inactive</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {pluginData.summary.error}
              </div>
              <div className="text-sm text-red-700">Errors</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {pluginData.summary.avgSuccessRate.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-700">Success Rate</div>
            </div>
          </div>

          {/* Plugin Type Distribution */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-800 mb-3">Plugin Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(pluginData.summary.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <span className="text-purple-700 capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">{count}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Filter:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Plugins</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="error">Errors Only</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
                <option value="lastUsed">Last Used</option>
              </select>
            </div>
          </div>

          {/* Plugins List */}
          <div className="space-y-4">
            {filteredAndSortedPlugins.map((plugin) => (
              <div key={plugin.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(plugin.type)}
                      <h3 className="font-semibold">{plugin.name}</h3>
                      {getTypeBadge(plugin.type)}
                      {getStatusBadge(plugin.status)}
                      <span className="text-sm text-muted-foreground">v{plugin.version}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{plugin.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div>by {plugin.author}</div>
                      <div>Updated: {formatTime(plugin.lastUpdated)}</div>
                      {plugin.statistics.lastSignal && (
                        <div>Last signal: {formatTime(plugin.statistics.lastSignal)}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`plugin-${plugin.id}`}
                        checked={plugin.enabled}
                        onCheckedChange={() => handleTogglePlugin(plugin)}
                        disabled={togglePluginMutation.isPending}
                      />
                      <Label htmlFor={`plugin-${plugin.id}`} className="text-sm">
                        {plugin.enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                    
                    <Dialog open={testModalOpen && selectedPlugin?.id === plugin.id} onOpenChange={setTestModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPlugin(plugin)}
                          disabled={!plugin.enabled}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Test Plugin - {plugin.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="test-type">Test Type</Label>
                            <select 
                              id="test-type"
                              value={testType} 
                              onChange={(e) => setTestType(e.target.value as any)}
                              className="w-full border rounded px-3 py-2 mt-1"
                            >
                              <option value="connection">Connection Test</option>
                              <option value="signal">Signal Test</option>
                              <option value="configuration">Configuration Test</option>
                              <option value="performance">Performance Test</option>
                            </select>
                          </div>
                          
                          <div>
                            <Label htmlFor="test-payload">Test Payload (JSON)</Label>
                            <Textarea
                              id="test-payload"
                              value={testPayload}
                              onChange={(e) => setTestPayload(e.target.value)}
                              placeholder='{"key": "value"}'
                              className="mt-1"
                              rows={5}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setTestModalOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleTestPlugin}
                              disabled={testPluginMutation.isPending}
                            >
                              {testPluginMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Testing...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Run Test
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {testPluginMutation.data && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <h4 className="font-medium mb-2">Test Results:</h4>
                              <div className="text-sm space-y-1">
                                <div>
                                  Status: {testPluginMutation.data.results.success ? 
                                    <span className="text-green-600">Success</span> : 
                                    <span className="text-red-600">Failed</span>
                                  }
                                </div>
                                <div>Message: {testPluginMutation.data.results.message}</div>
                                <div>Response Time: {testPluginMutation.data.results.responseTime}ms</div>
                                {testPluginMutation.data.results.data && (
                                  <div>
                                    <div>Data:</div>
                                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                      {JSON.stringify(testPluginMutation.data.results.data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {/* Plugin Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {plugin.statistics.totalSignals}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Signals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {plugin.statistics.successRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatDuration(plugin.statistics.avgResponseTime)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {plugin.statistics.errorCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <div>
                    <strong>Signal Types:</strong> {plugin.metadata.signalTypes.join(', ')}
                  </div>
                  <div>
                    <strong>Data Formats:</strong> {plugin.metadata.dataFormats.join(', ')}
                  </div>
                  <div>
                    <strong>Rate Limit:</strong> {plugin.metadata.rateLimit}/min | 
                    <strong> Timeout:</strong> {plugin.metadata.timeout}ms
                  </div>
                  {plugin.statistics.lastError && (
                    <div className="text-red-600">
                      <strong>Last Error:</strong> {plugin.statistics.lastError}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredAndSortedPlugins.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No plugins found matching your filter
            </div>
          )}

          {/* Information */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Plugin Management Information</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• <strong>Enable/Disable:</strong> Toggle plugin activation without uninstalling</div>
              <div>• <strong>Test Function:</strong> Validate plugin functionality with custom payloads</div>
              <div>• <strong>Statistics:</strong> Real-time performance metrics and error tracking</div>
              <div>• <strong>Auto-refresh:</strong> Plugin status updates every 30 seconds</div>
              <div>• <strong>Last Updated:</strong> {formatTime(pluginData.lastUpdated)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedEnginePlugPanel; 