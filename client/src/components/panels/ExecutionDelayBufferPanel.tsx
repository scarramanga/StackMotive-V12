import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { executionDelayBufferService } from '../../services/executionDelayBufferService';

interface SignalDelay {
  id: string;
  asset: string;
  overlay: string;
  signalTimestamp: string;
  executionTimestamp: string;
  delayMinutes: number;
  delaySeconds: number;
  signalType: 'buy' | 'sell' | 'hold';
  executionStatus: 'completed' | 'failed' | 'pending';
  value: number;
  isHighDelay: boolean;
}

interface DelayStats {
  averageDelayMinutes: number;
  medianDelayMinutes: number;
  maxDelayMinutes: number;
  minDelayMinutes: number;
  totalSignals: number;
  highDelayCount: number;
  delaysByAsset: Record<string, number>;
  delaysByOverlay: Record<string, number>;
}

export const ExecutionDelayBufferPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State management
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [overlayFilter, setOverlayFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'chart' | 'scatter'>('chart');
  const [timeRange, setTimeRange] = useState<string>('24h');

  // User data for logging
  const userId = (user as any)?.id || '1';
  const vaultId = activeVaultId || undefined;

  // Fetch signal delays
  const { data: delayData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/strategy/signal-delays', activeVaultId, timeRange],
    queryFn: async () => {
      const url = activeVaultId 
        ? `/api/strategy/signal-delays?vaultId=${activeVaultId}&timeRange=${timeRange}`
        : `/api/strategy/signal-delays?timeRange=${timeRange}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch signal delays');
      return res.json();
    },
    enabled: !!user && !!activeVaultId,
    refetchInterval: 30000,
  });

  // Handle time range change with logging
  const handleTimeRangeChange = async (value: string) => {
    setTimeRange(value);
    
    // Log agent memory
    await executionDelayBufferService.logAgentMemory('filter_changed', {
      userId,
      vaultId,
      metadata: {
        filterType: 'timeRange',
        filterValue: value,
        previousValue: timeRange
      }
    });
  };

  // Handle asset filter change with logging
  const handleAssetFilterChange = async (value: string) => {
    setAssetFilter(value);
    
    // Log agent memory
    await executionDelayBufferService.logAgentMemory('filter_changed', {
      userId,
      vaultId,
      metadata: {
        filterType: 'asset',
        filterValue: value,
        previousValue: assetFilter
      }
    });
  };

  // Handle overlay filter change with logging
  const handleOverlayFilterChange = async (value: string) => {
    setOverlayFilter(value);
    
    // Log agent memory
    await executionDelayBufferService.logAgentMemory('filter_changed', {
      userId,
      vaultId,
      metadata: {
        filterType: 'overlay',
        filterValue: value,
        previousValue: overlayFilter
      }
    });
  };

  // Handle view mode change with logging
  const handleViewModeChange = async (value: 'chart' | 'scatter') => {
    setViewMode(value);
    
    // Log agent memory
    await executionDelayBufferService.logAgentMemory('view_mode_changed', {
      userId,
      vaultId,
      metadata: {
        newViewMode: value,
        previousViewMode: viewMode
      }
    });
  };

  // Handle manual refresh with logging
  const handleRefresh = async () => {
    refetch();
    
    // Log agent memory
    await executionDelayBufferService.logAgentMemory('data_refreshed', {
      userId,
      vaultId,
      metadata: {
        refreshType: 'manual',
        timeRange,
        activeFilters: {
          asset: assetFilter,
          overlay: overlayFilter
        }
      }
    });
  };

  // Process and filter delays
  const { filteredDelays, chartData, scatterData } = useMemo(() => {
    if (!delayData?.delays) return { filteredDelays: [], chartData: [], scatterData: [] };
    
    let filtered: SignalDelay[] = delayData.delays;
    
    // Apply filters
    if (assetFilter !== 'all') {
      filtered = filtered.filter(delay => delay.asset === assetFilter);
    }
    if (overlayFilter !== 'all') {
      filtered = filtered.filter(delay => delay.overlay === overlayFilter);
    }
    
    // Sort by timestamp
    filtered.sort((a, b) => new Date(a.signalTimestamp).getTime() - new Date(b.signalTimestamp).getTime());
    
    // Create chart data (grouped by time intervals)
    const chartData = filtered.reduce((acc, delay) => {
      const hour = new Date(delay.signalTimestamp).getHours();
      const timeSlot = `${hour}:00`;
      
      const existing = acc.find(item => item.time === timeSlot);
      if (existing) {
        existing.averageDelay = (existing.averageDelay + delay.delayMinutes) / 2;
        existing.count += 1;
        existing.highDelayCount += delay.isHighDelay ? 1 : 0;
      } else {
        acc.push({
          time: timeSlot,
          averageDelay: delay.delayMinutes,
          count: 1,
          highDelayCount: delay.isHighDelay ? 1 : 0
        });
      }
      
      return acc;
    }, [] as { time: string; averageDelay: number; count: number; highDelayCount: number }[]);
    
    // Create scatter data
    const scatterData = filtered.map((delay, index) => ({
      x: index,
      y: delay.delayMinutes,
      asset: delay.asset,
      overlay: delay.overlay,
      signalTime: delay.signalTimestamp,
      executionTime: delay.executionTimestamp,
      isHighDelay: delay.isHighDelay,
      signalType: delay.signalType
    }));
    
    return { filteredDelays: filtered, chartData, scatterData };
  }, [delayData, assetFilter, overlayFilter]);

  // Calculate statistics
  const stats: DelayStats = useMemo(() => {
    if (!filteredDelays.length) {
      return {
        averageDelayMinutes: 0,
        medianDelayMinutes: 0,
        maxDelayMinutes: 0,
        minDelayMinutes: 0,
        totalSignals: 0,
        highDelayCount: 0,
        delaysByAsset: {},
        delaysByOverlay: {}
      };
    }
    
    const delays = filteredDelays.map(d => d.delayMinutes).sort((a, b) => a - b);
    const total = delays.reduce((sum, delay) => sum + delay, 0);
    
    return {
      averageDelayMinutes: total / delays.length,
      medianDelayMinutes: delays[Math.floor(delays.length / 2)],
      maxDelayMinutes: Math.max(...delays),
      minDelayMinutes: Math.min(...delays),
      totalSignals: filteredDelays.length,
      highDelayCount: filteredDelays.filter(d => d.isHighDelay).length,
      delaysByAsset: filteredDelays.reduce((acc, d) => {
        acc[d.asset] = (acc[d.asset] || 0) + d.delayMinutes;
        return acc;
      }, {} as Record<string, number>),
      delaysByOverlay: filteredDelays.reduce((acc, d) => {
        acc[d.overlay] = (acc[d.overlay] || 0) + d.delayMinutes;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [filteredDelays]);

     // Get unique assets and overlays for filters
   const uniqueAssets = [...new Set(delayData?.delays?.map((d: SignalDelay) => d.asset) || [])] as string[];
   const uniqueOverlays = [...new Set(delayData?.delays?.map((d: SignalDelay) => d.overlay) || [])] as string[];

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Format delay
  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toFixed(0)}m`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Average Delay: {formatDelay(data.averageDelay)}
          </p>
          <p className="text-sm text-muted-foreground">
            Signals: {data.count}
          </p>
          {data.highDelayCount > 0 && (
            <p className="text-sm text-red-600">
              High Delays: {data.highDelayCount}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom scatter tooltip
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium">{data.asset} - {data.overlay}</p>
          <p className="text-sm text-muted-foreground">
            Signal: {formatTime(data.signalTime)}
          </p>
          <p className="text-sm text-muted-foreground">
            Execution: {formatTime(data.executionTime)}
          </p>
          <p className={`text-sm ${data.isHighDelay ? 'text-red-600' : 'text-green-600'}`}>
            Delay: {formatDelay(data.y)}
          </p>
          <p className="text-sm capitalize">
            Type: {data.signalType}
          </p>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading signal delays: {error.message}
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
            Execution Delay Buffer
            <Badge variant="secondary" className="text-xs">
              {stats.totalSignals} signals
            </Badge>
            {stats.highDelayCount > 0 && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                {stats.highDelayCount} high delays
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Avg: {formatDelay(stats.averageDelayMinutes)}
            </div>
            <RefreshCw 
              className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary"
              onClick={handleRefresh}
            />
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{formatDelay(stats.averageDelayMinutes)}</div>
              <div className="text-xs text-muted-foreground">Average</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold">{formatDelay(stats.medianDelayMinutes)}</div>
              <div className="text-xs text-blue-600">Median</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold">{formatDelay(stats.minDelayMinutes)}</div>
              <div className="text-xs text-green-600">Minimum</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold">{formatDelay(stats.maxDelayMinutes)}</div>
              <div className="text-xs text-red-600">Maximum</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold">{stats.totalSignals}</div>
              <div className="text-xs text-yellow-600">Total Signals</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={assetFilter} onValueChange={handleAssetFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {uniqueAssets.map((asset: string) => (
                  <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={overlayFilter} onValueChange={handleOverlayFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Overlays</SelectItem>
                {uniqueOverlays.map(overlay => (
                  <SelectItem key={overlay} value={overlay}>{overlay}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={viewMode} onValueChange={handleViewModeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chart">Bar Chart</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart */}
          {isLoading ? (
            <div className="h-80 animate-pulse bg-muted rounded-lg flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          ) : filteredDelays.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No delay data found</h3>
              <p className="text-muted-foreground">
                {assetFilter !== 'all' || overlayFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Signal execution delays will appear here'}
              </p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'chart' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="averageDelay" 
                      fill="#3b82f6"
                      name="Average Delay (minutes)"
                    />
                  </BarChart>
                ) : (
                  <ScatterChart data={scatterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" type="number" hide />
                    <YAxis dataKey="y" />
                    <Tooltip content={<ScatterTooltip />} />
                                         <Scatter 
                       dataKey="y" 
                       fill="#3b82f6"
                     />
                  </ScatterChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Asset */}
            <div>
              <h4 className="text-sm font-medium mb-3">Delay by Asset</h4>
              <div className="space-y-2">
                {Object.entries(stats.delaysByAsset)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([asset, totalDelay]) => {
                    const count = filteredDelays.filter(d => d.asset === asset).length;
                    const avgDelay = totalDelay / count;
                    return (
                      <div key={asset} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm font-medium">{asset}</span>
                        <div className="text-right">
                          <div className={`text-sm ${avgDelay > 60 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatDelay(avgDelay)}
                          </div>
                          <div className="text-xs text-muted-foreground">{count} signals</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* By Overlay */}
            <div>
              <h4 className="text-sm font-medium mb-3">Delay by Overlay</h4>
              <div className="space-y-2">
                {Object.entries(stats.delaysByOverlay)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([overlay, totalDelay]) => {
                    const count = filteredDelays.filter(d => d.overlay === overlay).length;
                    const avgDelay = totalDelay / count;
                    return (
                      <div key={overlay} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm font-medium">{overlay}</span>
                        <div className="text-right">
                          <div className={`text-sm ${avgDelay > 60 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatDelay(avgDelay)}
                          </div>
                          <div className="text-xs text-muted-foreground">{count} signals</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Recent High Delays */}
          {stats.highDelayCount > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Recent High Delays (&gt; 1hr)
              </h4>
              <div className="space-y-2">
                {filteredDelays
                  .filter(d => d.isHighDelay)
                  .slice(0, 5)
                  .map(delay => (
                    <div key={delay.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded">
                      <div>
                        <div className="font-medium">{delay.asset} - {delay.overlay}</div>
                        <div className="text-sm text-muted-foreground">
                          Signal: {formatTime(delay.signalTimestamp)} → Execution: {formatTime(delay.executionTimestamp)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">
                          {formatDelay(delay.delayMinutes)}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {delay.signalType}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Delay Analysis</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• <strong>High Delays:</strong> Execution delays over 1 hour are highlighted in red</div>
              <div>• <strong>Chart View:</strong> Shows average delays grouped by time periods</div>
              <div>• <strong>Scatter View:</strong> Shows individual signal delays over time</div>
              <div>• <strong>Breakdown:</strong> Identifies which assets/overlays have the highest delays</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionDelayBufferPanel; 