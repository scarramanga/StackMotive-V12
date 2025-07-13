import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  RotateCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  Activity,
  Pause,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  useRotationOverlays, 
  useUpdateOverlayStatus, 
  useTriggerRotation,
  rotationOverlayService,
  type RotationOverlay
} from '../../services/rotationOverlayService';

export const RotationOverlaySummaryPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State management
  const [selectedOverlay, setSelectedOverlay] = useState<RotationOverlay | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'trust' | 'performance' | 'status'>('trust');

  // API hooks
  const { 
    data: overlayData, 
    isLoading, 
    error, 
    refetch 
  } = useRotationOverlays((user as any)?.id || '1', activeVaultId || undefined);

  const updateStatusMutation = useUpdateOverlayStatus();
  const triggerRotationMutation = useTriggerRotation();

  // Filter and sort overlays
  const filteredOverlays = React.useMemo(() => {
    if (!overlayData?.overlays) return [];
    
    let filtered = overlayData.overlays;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(overlay => overlay.status === filterStatus);
    }
    
    // Sort overlays
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'trust':
          return b.trustScore - a.trustScore;
        case 'performance':
          return b.performance.totalReturn - a.performance.totalReturn;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [overlayData?.overlays, filterStatus, sortBy]);

  // Handle overlay status toggle
  const handleStatusToggle = async (overlay: RotationOverlay) => {
    const newStatus = overlay.status === 'paused' ? 'active' : 'paused';
    try {
      await updateStatusMutation.mutateAsync({ 
        overlayId: overlay.id, 
        status: newStatus 
      });
      
      // Log agent memory
      await rotationOverlayService.logAgentMemory('overlay_status_changed', {
        overlayId: overlay.id,
        overlayName: overlay.name,
        userId: (user as any)?.id || '1',
        vaultId: activeVaultId || undefined,
        metadata: { oldStatus: overlay.status, newStatus }
      });
    } catch (error) {
      console.error('Failed to update overlay status:', error);
    }
  };

  // Handle manual rotation trigger
  const handleTriggerRotation = async (overlay: RotationOverlay, force: boolean = false) => {
    try {
      await triggerRotationMutation.mutateAsync({ 
        overlayId: overlay.id, 
        force 
      });
      
      // Log agent memory
      await rotationOverlayService.logAgentMemory('rotation_triggered', {
        overlayId: overlay.id,
        overlayName: overlay.name,
        userId: (user as any)?.id || '1',
        vaultId: activeVaultId || undefined,
        metadata: { force, trigger: 'manual' }
      });
    } catch (error) {
      console.error('Failed to trigger rotation:', error);
    }
  };

  // Open overlay details modal
  const openDetailsModal = (overlay: RotationOverlay) => {
    setSelectedOverlay(overlay);
    setShowDetailsModal(true);
    
    // Log agent memory
    rotationOverlayService.logAgentMemory('overlay_details_viewed', {
      overlayId: overlay.id,
      overlayName: overlay.name,
      userId: (user as any)?.id || '1',
      vaultId: activeVaultId || undefined,
      metadata: { trustScore: overlay.trustScore, status: overlay.status }
    });
  };

  // Handle filter changes with logging
  const handleFilterStatusChange = (value: string) => {
    setFilterStatus(value);
    
    // Log agent memory
    rotationOverlayService.logAgentMemory('overlays_filtered', {
      userId: (user as any)?.id || '1',
      vaultId: activeVaultId || undefined,
      metadata: { filterType: 'status', filterValue: value, totalOverlays: overlayData?.overlays?.length || 0 }
    });
  };

  const handleSortByChange = (value: 'trust' | 'performance' | 'status') => {
    setSortBy(value);
    
    // Log agent memory
    rotationOverlayService.logAgentMemory('overlays_filtered', {
      userId: (user as any)?.id || '1',
      vaultId: activeVaultId || undefined,
      metadata: { filterType: 'sort', filterValue: value, totalOverlays: overlayData?.overlays?.length || 0 }
    });
  };

  // Handle manual refresh with logging
  const handleRefresh = async () => {
    try {
      await refetch();
      
      // Log agent memory
      await rotationOverlayService.logAgentMemory('overlays_refreshed', {
        userId: (user as any)?.id || '1',
        vaultId: activeVaultId || undefined,
        metadata: { totalOverlays: overlayData?.overlays?.length || 0, activeOverlays: overlayData?.summary?.activeOverlays || 0 }
      });
    } catch (error) {
      console.error('Failed to refresh overlays:', error);
    }
  };

  // Get overlay status icon
  const getStatusIcon = (status: RotationOverlay['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'triggered':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'cooling_down':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get trust score color
  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading rotation overlays: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = overlayData?.summary;
  const comparison = overlayData?.comparison;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="h-5 w-5" />
              Rotation Overlay Summary
              {summary && (
                <Badge variant="secondary" className="text-xs">
                  {summary.activeOverlays}/{summary.totalOverlays} active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Last updated: {overlayData?.lastUpdated ? new Date(overlayData.lastUpdated).toLocaleTimeString() : 'Never'}
              </div>
              <Button size="sm" variant="outline" onClick={() => handleRefresh()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{summary.totalOverlays}</div>
              <div className="text-xs text-muted-foreground">Total Overlays</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.activeOverlays}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${getTrustScoreColor(summary.avgTrustScore)}`}>
                {summary.avgTrustScore.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Trust Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.pendingRotations}</div>
              <div className="text-xs text-muted-foreground">Pending Rotations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${summary.totalPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.totalPerformance >= 0 ? '+' : ''}{summary.totalPerformance.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Total Performance</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio vs Overlay Comparison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfolio vs Overlay Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  ${comparison.portfolioValue.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Current Portfolio</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  ${comparison.overlayValue.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Overlay Target</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${comparison.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comparison.difference >= 0 ? '+' : ''}${comparison.difference.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Difference</div>
              </div>
              <div className="text-center">
                <Badge className={`${
                  comparison.recommendation === 'rotate' ? 'bg-blue-100 text-blue-800' :
                  comparison.recommendation === 'hold' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {comparison.recommendation.toUpperCase()}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Recommendation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Controls */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={handleFilterStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="triggered">Triggered</SelectItem>
            <SelectItem value="cooling_down">Cooling Down</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={handleSortByChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trust">Trust Score</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredOverlays.length} overlay{filteredOverlays.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Overlay List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOverlays.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RotateCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No overlays found</h3>
            <p className="text-muted-foreground">
              {filterStatus !== 'all' ? 'Try adjusting your filters' : 'No rotation overlays configured'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOverlays.map((overlay) => {
            const statusBadge = rotationOverlayService.getStatusBadge(overlay.status);
            
            return (
              <Card key={overlay.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(overlay.status)}
                      <span className="truncate">{overlay.name}</span>
                    </div>
                    <Badge className={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{overlay.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Trust Score and Performance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Trust Score</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={overlay.trustScore} className="flex-1" />
                        <span className={`text-sm font-bold ${getTrustScoreColor(overlay.trustScore)}`}>
                          {overlay.trustScore}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Performance</span>
                      </div>
                      <div className={`text-lg font-bold ${overlay.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {overlay.performance.totalReturn >= 0 ? '+' : ''}{overlay.performance.totalReturn.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Weight Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Weight</div>
                      <div className="text-lg font-semibold">{overlay.currentWeight.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Target Weight</div>
                      <div className="text-lg font-semibold">{overlay.targetWeight.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Rotation Timing */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Rotation Timing</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>Last: {new Date(overlay.rotationTiming.lastRotation).toLocaleDateString()}</div>
                      {overlay.rotationTiming.nextRotation && (
                        <div>
                          Next: {rotationOverlayService.formatTimeRemaining(overlay.rotationTiming.nextRotation)}
                        </div>
                      )}
                      {overlay.rotationTiming.cooldownEnds && (
                        <div>
                          Cooldown: {rotationOverlayService.formatTimeRemaining(overlay.rotationTiming.cooldownEnds)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusToggle(overlay)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {overlay.status === 'paused' ? (
                        <><Play className="h-4 w-4 mr-1" /> Resume</>
                      ) : (
                        <><Pause className="h-4 w-4 mr-1" /> Pause</>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTriggerRotation(overlay)}
                      disabled={triggerRotationMutation.isPending || overlay.status === 'paused'}
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Rotate
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDetailsModal(overlay)}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Overlay Details Modal */}
      {selectedOverlay && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedOverlay.status)}
                {selectedOverlay.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Asset Allocations */}
              <div>
                <h4 className="font-medium mb-2">Asset Allocations</h4>
                <div className="space-y-2">
                  {selectedOverlay.assets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.symbol}</span>
                        <Badge className={`text-xs ${
                          asset.signal === 'buy' ? 'bg-green-100 text-green-800' :
                          asset.signal === 'sell' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {asset.signal.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{asset.allocation.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {asset.confidence.toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-medium mb-2">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                    <div className="text-lg font-semibold">{selectedOverlay.performance.winRate.toFixed(1)}%</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="text-sm text-muted-foreground">Avg Rotation Return</div>
                    <div className="text-lg font-semibold">
                      {selectedOverlay.performance.avgRotationReturn.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    <div className="text-lg font-semibold text-red-600">
                      -{selectedOverlay.performance.maxDrawdown.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="text-sm text-muted-foreground">Total Rotations</div>
                    <div className="text-lg font-semibold">{selectedOverlay.metadata.rotationCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RotationOverlaySummaryPanel; 