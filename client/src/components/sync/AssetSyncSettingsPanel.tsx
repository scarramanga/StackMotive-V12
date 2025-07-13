import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/use-toast';
import { AlertTriangle, CheckCircle, Clock, Loader2, RefreshCw, Settings, Sync, Wifi, WifiOff } from 'lucide-react';

interface SyncConfig {
  id?: number;
  userId: number;
  syncSource: string;
  enabled: boolean;
  autoSync: boolean;
  frequency: string;
  lastSyncTime?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  hasCredentials?: boolean;
}

interface AssetSyncSettingsPanelProps {
  userId: number;
}

const SYNC_SOURCES = [
  {
    id: 'sharesies',
    name: 'Sharesies',
    description: 'Import holdings from Sharesies account',
    icon: '📊',
    requiresCredentials: true
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers',
    description: 'Import positions from IBKR account',
    icon: '🏦',
    requiresCredentials: true
  },
  {
    id: 'coinstats',
    name: 'CoinStats',
    description: 'Import crypto portfolio from CoinStats',
    icon: '₿',
    requiresCredentials: true
  },
  {
    id: 'csv',
    name: 'CSV Upload',
    description: 'Manual CSV file import',
    icon: '📄',
    requiresCredentials: false
  }
];

const AssetSyncSettingsPanel: React.FC<AssetSyncSettingsPanelProps> = ({ userId }) => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<SyncConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSyncConfigurations();
  }, [userId]);

  const fetchSyncConfigurations = async () => {
    try {
      const response = await fetch(`/api/sync/config/${userId}`);
      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (error) {
      console.error('Error fetching sync configurations:', error);
      toast({
        title: "Error",
        description: "Failed to load sync configurations",
        variant: "destructive"
      });
    }
  };

  const getConfigForSource = (sourceId: string): SyncConfig => {
    return configs.find(c => c.syncSource === sourceId) || {
      userId,
      syncSource: sourceId,
      enabled: false,
      autoSync: false,
      frequency: 'manual',
      syncStatus: 'idle'
    };
  };

  const updateConfig = async (sourceId: string, updates: Partial<SyncConfig>) => {
    setLoading(true);
    
    const existingConfig = getConfigForSource(sourceId);
    const updatedConfig = { ...existingConfig, ...updates };

    try {
      const response = await fetch('/api/sync/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchSyncConfigurations();
        toast({
          title: "Configuration Updated",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (sourceId: string, forceSync = false) => {
    setSyncing(prev => ({ ...prev, [sourceId]: true }));
    
    try {
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, syncSource: sourceId, forceSync })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sync Completed",
          description: result.message,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.message,
          variant: "destructive"
        });
      }
      
      await fetchSyncConfigurations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger sync",
        variant: "destructive"
      });
    } finally {
      setSyncing(prev => ({ ...prev, [sourceId]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastSync = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Sync Settings</h1>
          <p className="text-gray-600 mt-1">Manage external portfolio data sources</p>
        </div>
        <div className="flex items-center space-x-2">
          <Sync className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium">Block 6</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SYNC_SOURCES.map((source) => {
          const config = getConfigForSource(source.id);
          const isSyncing = syncing[source.id];
          
          return (
            <Card key={source.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{source.icon}</span>
                    <div>
                      <h3 className="font-semibold">{source.name}</h3>
                      <p className="text-sm text-gray-600 font-normal">
                        {source.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.enabled ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-gray-400" />
                    )}
                    {getStatusIcon(config.syncStatus)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(config.syncStatus)}>
                    {config.syncStatus.charAt(0).toUpperCase() + config.syncStatus.slice(1)}
                  </Badge>
                  {config.lastSyncTime && (
                    <span className="text-xs text-gray-500">
                      Last sync: {formatLastSync(config.lastSyncTime)}
                    </span>
                  )}
                </div>

                {/* Error Message */}
                {config.errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{config.errorMessage}</p>
                  </div>
                )}

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`enable-${source.id}`}>Enable {source.name}</Label>
                  <Switch
                    id={`enable-${source.id}`}
                    checked={config.enabled}
                    onCheckedChange={(checked) => 
                      updateConfig(source.id, { enabled: checked })
                    }
                    disabled={loading}
                  />
                </div>

                {config.enabled && (
                  <>
                    {/* Auto-sync Toggle */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`auto-${source.id}`}>Automatic Sync</Label>
                      <Switch
                        id={`auto-${source.id}`}
                        checked={config.autoSync}
                        onCheckedChange={(checked) => 
                          updateConfig(source.id, { autoSync: checked })
                        }
                        disabled={loading}
                      />
                    </div>

                    {/* Frequency Selection */}
                    {config.autoSync && (
                      <div className="space-y-2">
                        <Label>Sync Frequency</Label>
                        <Select
                          value={config.frequency}
                          onValueChange={(value) => 
                            updateConfig(source.id, { frequency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Every Hour</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="manual">Manual Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Credentials Status */}
                    {source.requiresCredentials && (
                      <div className="flex items-center justify-between">
                        <Label>Credentials</Label>
                        <Badge variant={config.hasCredentials ? "default" : "outline"}>
                          {config.hasCredentials ? "Configured" : "Not Set"}
                        </Badge>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => triggerSync(source.id)}
                        disabled={isSyncing || config.syncStatus === 'syncing'}
                        className="flex-1"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Sync Now
                          </>
                        )}
                      </Button>

                      {source.requiresCredentials && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Configuration",
                              description: `${source.name} credential configuration coming soon`,
                            });
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sync Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {configs.filter(c => c.enabled).length}
              </div>
              <div className="text-sm text-blue-800">Active Sources</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {configs.filter(c => c.syncStatus === 'success').length}
              </div>
              <div className="text-sm text-green-800">Successful Syncs</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {configs.filter(c => c.autoSync).length}
              </div>
              <div className="text-sm text-orange-800">Auto-Sync Enabled</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {configs.filter(c => c.syncStatus === 'error').length}
              </div>
              <div className="text-sm text-red-800">Sync Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetSyncSettingsPanel; 