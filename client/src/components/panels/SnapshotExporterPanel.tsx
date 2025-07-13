import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Camera,
  Clock,
  Zap,
  Shield,
  File,
  Download,
  Compare,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  useVaultSnapshots, 
  useCreateSnapshot, 
  useDeleteSnapshot,
  useCompareSnapshots,
  vaultSnapshotViewerService,
  type VaultSnapshot 
} from '../../services/vaultSnapshotViewerService';

export const SnapshotExporterPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State for UI controls
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'timestamp' | 'name' | 'value' | 'performance'>('timestamp');
  const [newSnapshot, setNewSnapshot] = useState({
    name: '',
    description: '',
    type: 'manual' as const,
    tags: [] as string[]
  });

  // Fetch snapshots using service
  const { data: snapshotsData, isLoading, error } = useVaultSnapshots(activeVaultId, {
    limit: 50,
    offset: 0
  });

  // Mutations using service
  const createSnapshotMutation = useCreateSnapshot();
  const deleteSnapshotMutation = useDeleteSnapshot();

  // Process snapshots using service
  const processedSnapshots = useMemo(() => {
    if (!snapshotsData?.snapshots) return [];
    
    const filtered = vaultSnapshotViewerService.filterSnapshots(snapshotsData.snapshots, filters);
    return vaultSnapshotViewerService.sortSnapshots(filtered, sortBy, 'desc');
  }, [snapshotsData, filters, sortBy]);

  // Handle create snapshot
  const handleCreateSnapshot = async () => {
    if (!activeVaultId || !newSnapshot.name) return;

    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'snapshot-exporter',
        userId: (user as any)?.id || undefined,
        action: 'snapshot_create',
        timestamp: new Date().toISOString(),
        details: { 
          snapshotName: newSnapshot.name,
          type: newSnapshot.type,
          vaultId: activeVaultId 
        }
      })
    }).catch(console.error);

    try {
      await createSnapshotMutation.mutateAsync({
        vaultId: activeVaultId,
        data: newSnapshot
      });
      setNewSnapshot({ name: '', description: '', type: 'manual', tags: [] });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    }
  };

  // Handle delete snapshot
  const handleDeleteSnapshot = async (id: string) => {
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'snapshot-exporter',
        userId: (user as any)?.id || undefined,
        action: 'snapshot_delete',
        timestamp: new Date().toISOString(),
        details: { snapshotId: id, vaultId: activeVaultId }
      })
    }).catch(console.error);

    try {
      await deleteSnapshotMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
    }
  };

  // Handle export snapshot
  const handleExportSnapshot = async (id: string, format: 'json' | 'csv' | 'pdf') => {
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'snapshot-exporter',
        userId: (user as any)?.id || undefined,
        action: 'snapshot_export',
        timestamp: new Date().toISOString(),
        details: { snapshotId: id, format, vaultId: activeVaultId }
      })
    }).catch(console.error);

    try {
      const blob = await vaultSnapshotViewerService.exportSnapshot(id, format);
      const snapshot = processedSnapshots.find(s => s.id === id);
      const filename = `${snapshot?.name || 'snapshot'}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export snapshot:', error);
    }
  };

  // Handle compare snapshots
  const handleCompareSnapshots = () => {
    if (selectedSnapshots.length !== 2) return;

    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'snapshot-exporter',
        userId: (user as any)?.id || undefined,
        action: 'snapshot_compare',
        timestamp: new Date().toISOString(),
        details: { 
          snapshotIds: selectedSnapshots,
          vaultId: activeVaultId 
        }
      })
    }).catch(console.error);

    // Would open comparison view
    console.log('Comparing snapshots:', selectedSnapshots);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'snapshot-exporter',
        userId: (user as any)?.id || undefined,
        action: 'filter_change',
        timestamp: new Date().toISOString(),
        details: { filterKey: key, filterValue: value, vaultId: activeVaultId }
      })
    }).catch(console.error);

    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle snapshot selection
  const handleSnapshotSelect = (id: string) => {
    setSelectedSnapshots(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'manual': return <Camera className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'trigger-based': return <Zap className="h-4 w-4" />;
      case 'backup': return <Shield className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Snapshot Exporter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Snapshot Exporter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-600 mb-4" />
            <p className="text-red-600">Failed to load snapshots</p>
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
            Snapshot Exporter
            <Badge variant="secondary" className="text-xs">
              {processedSnapshots.length} snapshots
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedSnapshots.length === 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCompareSnapshots}
              >
                <Compare className="h-4 w-4 mr-2" />
                Compare
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Snapshot
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Create Snapshot Form */}
          {showCreateForm && (
            <div className="p-4 border border-border rounded-lg bg-muted/50">
              <h3 className="font-medium mb-4">Create New Snapshot</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newSnapshot.name}
                    onChange={(e) => setNewSnapshot(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Snapshot name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={newSnapshot.type} 
                    onValueChange={(value: any) => setNewSnapshot(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="trigger-based">Trigger-based</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newSnapshot.description}
                    onChange={(e) => setNewSnapshot(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSnapshot}
                  disabled={!newSnapshot.name || createSnapshotMutation.isPending}
                >
                  Create Snapshot
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="trigger-based">Trigger-based</SelectItem>
                <SelectItem value="backup">Backup</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="value">Value</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search snapshots..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-48"
              />
            </div>
          </div>

          {/* Snapshots Grid */}
          {processedSnapshots.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No snapshots found</h3>
              <p className="text-muted-foreground">
                Create your first snapshot to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedSnapshots.map((snapshot) => {
                const healthScore = vaultSnapshotViewerService.calculateHealthScore(snapshot);
                const metrics = vaultSnapshotViewerService.calculatePortfolioMetrics(snapshot);
                
                return (
                  <div
                    key={snapshot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSnapshots.includes(snapshot.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleSnapshotSelect(snapshot.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(snapshot.type)}
                        <div>
                          <div className="font-medium">{snapshot.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {vaultSnapshotViewerService.formatRelativeTime(snapshot.timestamp)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={vaultSnapshotViewerService.getSnapshotStatusColor(snapshot.status)}>
                        {snapshot.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Value:</span>
                        <span className="font-medium">
                          {vaultSnapshotViewerService.formatCurrency(snapshot.totalValue, snapshot.currency)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Performance:</span>
                        <span className={`font-medium ${vaultSnapshotViewerService.getPerformanceColor(snapshot.data.performance.totalReturnPercent)}`}>
                          {vaultSnapshotViewerService.formatPercentage(snapshot.data.performance.totalReturnPercent)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Health Score:</span>
                        <span className="font-medium">{healthScore}/100</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Assets:</span>
                        <span className="font-medium">{snapshot.assetCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportSnapshot(snapshot.id, 'json');
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportSnapshot(snapshot.id, 'csv');
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportSnapshot(snapshot.id, 'pdf');
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 