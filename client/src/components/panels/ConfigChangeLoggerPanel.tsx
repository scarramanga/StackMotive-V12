import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toast } from '@/components/ui/use-toast';
import { 
  FileText, 
  History, 
  GitBranch, 
  Search, 
  Filter, 
  Download, 
  RotateCcw, 
  Eye, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Archive,
  Diff,
  Tag,
  Settings,
  ChevronRight,
  ChevronDown,
  Calendar,
  Database,
  Zap
} from 'lucide-react';

import {
  useConfigChanges,
  useConfigSnapshots,
  useCreateConfigSnapshot,
  useGenerateConfigDiff,
  useRevertToVersion,
  useLogConfigChange,
  useValidateConfig,
  useConfigChangeLoggerUtils,
  type ConfigChangeEntry,
  type ConfigSnapshot,
  type ConfigDiff,
  type ConfigCategory,
  type ChangeType,
  type ConfigChangeQuery,
  type ConfigRevertRequest,
} from '@/services/configChangeLoggerService';

interface ConfigChangeLoggerPanelProps {
  userId: string;
  className?: string;
}

export function ConfigChangeLoggerPanel({ 
  userId, 
  className = '' 
}: ConfigChangeLoggerPanelProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'changes' | 'snapshots' | 'diff'>('changes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory | 'all'>('all');
  const [selectedChangeType, setSelectedChangeType] = useState<ChangeType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [selectedChange, setSelectedChange] = useState<ConfigChangeEntry | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ConfigSnapshot | null>(null);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [showCreateSnapshot, setShowCreateSnapshot] = useState(false);
  const [snapshotDescription, setSnapshotDescription] = useState('');
  const [snapshotTags, setSnapshotTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [diffFromVersion, setDiffFromVersion] = useState('');
  const [diffToVersion, setDiffToVersion] = useState('');
  const [currentDiff, setCurrentDiff] = useState<ConfigDiff | null>(null);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [revertReason, setRevertReason] = useState('');
  const [isDryRun, setIsDryRun] = useState(true);

  // Build query for changes
  const changeQuery = useMemo((): ConfigChangeQuery => {
    const query: ConfigChangeQuery = {
      userId,
      limit: 50,
      offset: 0,
    };
    
    if (searchTerm) query.search = searchTerm;
    if (selectedCategory !== 'all') query.category = selectedCategory as ConfigCategory;
    if (selectedChangeType !== 'all') query.changeType = selectedChangeType as ChangeType;
    if (dateRange.start && dateRange.end) {
      query.dateRange = dateRange;
    }
    
    return query;
  }, [userId, searchTerm, selectedCategory, selectedChangeType, dateRange]);

  // Service hooks
  const { data: changesData, isLoading: changesLoading, error: changesError } = useConfigChanges(changeQuery);
  const { data: snapshots = [], isLoading: snapshotsLoading, error: snapshotsError } = useConfigSnapshots(userId);
  const createSnapshotMutation = useCreateConfigSnapshot(userId);
  const generateDiffMutation = useGenerateConfigDiff();
  const revertMutation = useRevertToVersion(userId);
  const logChangeMutation = useLogConfigChange(userId);
  const validateConfigMutation = useValidateConfig(userId);
  const utils = useConfigChangeLoggerUtils(userId);

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category as ConfigCategory | 'all');
  }, []);

  const handleChangeTypeChange = useCallback((changeType: string) => {
    setSelectedChangeType(changeType as ChangeType | 'all');
  }, []);

  const handleDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCreateSnapshot = useCallback(async () => {
    if (!snapshotDescription.trim()) {
      Toast({ title: 'Error', description: 'Please provide a description for the snapshot' });
      return;
    }

    try {
      await createSnapshotMutation.mutateAsync({
        description: snapshotDescription,
        tags: snapshotTags,
      });
      
      setShowCreateSnapshot(false);
      setSnapshotDescription('');
      setSnapshotTags([]);
      Toast({ title: 'Success', description: 'Configuration snapshot created successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to create snapshot' });
    }
  }, [snapshotDescription, snapshotTags, createSnapshotMutation]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !snapshotTags.includes(tagInput.trim())) {
      setSnapshotTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, snapshotTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setSnapshotTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleGenerateDiff = useCallback(async () => {
    if (!diffFromVersion || !diffToVersion) {
      Toast({ title: 'Error', description: 'Please select both versions to compare' });
      return;
    }

    try {
      const diff = await generateDiffMutation.mutateAsync({
        fromVersion: diffFromVersion,
        toVersion: diffToVersion,
        userId,
      });
      setCurrentDiff(diff);
      Toast({ title: 'Success', description: 'Configuration diff generated successfully' });
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to generate diff' });
    }
  }, [diffFromVersion, diffToVersion, userId, generateDiffMutation]);

  const handleRevertToVersion = useCallback(async (targetVersion: string) => {
    if (!revertReason.trim()) {
      Toast({ title: 'Error', description: 'Please provide a reason for the revert' });
      return;
    }

    try {
      const request: ConfigRevertRequest = {
        targetVersion,
        preserveFields: [],
        reason: revertReason,
        dryRun: isDryRun,
      };

      const result = await revertMutation.mutateAsync(request);
      
      if (result.success) {
        Toast({ 
          title: 'Success', 
          description: `${isDryRun ? 'Dry run completed' : 'Configuration reverted'} successfully` 
        });
        setShowRevertDialog(false);
        setRevertReason('');
      } else {
        Toast({ title: 'Error', description: result.errors.join(', ') });
      }
    } catch (error) {
      Toast({ title: 'Error', description: 'Failed to revert configuration' });
    }
  }, [revertReason, isDryRun, revertMutation]);

  const handleToggleExpanded = useCallback((changeId: string) => {
    setExpandedChanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(changeId)) {
        newSet.delete(changeId);
      } else {
        newSet.add(changeId);
      }
      return newSet;
    });
  }, []);

  const handleExportChanges = useCallback((format: 'json' | 'csv') => {
    if (!changesData?.changes) return;
    
    const exportData = utils.exportChanges(changesData.changes, format);
    const blob = new Blob([exportData], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-changes-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [changesData, utils]);

  // Render change item
  const renderChangeItem = useCallback((change: ConfigChangeEntry) => {
    const isExpanded = expandedChanges.has(change.id);
    
    return (
      <div key={change.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleExpanded(change.id)}
              className="p-1"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Badge variant="outline" className="text-xs">
              {utils.getCategoryLabel(change.category)}
            </Badge>
            <Badge variant={
              change.changeType === 'create' ? 'default' :
              change.changeType === 'update' ? 'secondary' :
              change.changeType === 'delete' ? 'destructive' :
              'outline'
            }>
              {utils.getChangeTypeLabel(change.changeType)}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={change.metadata.validation.isValid ? 'default' : 'destructive'}>
              {change.metadata.validation.isValid ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {change.metadata.validation.isValid ? 'Valid' : 'Invalid'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {utils.formatTimestamp(change.timestamp)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{change.field}</span>
          </div>
          
          {isExpanded && (
            <div className="space-y-3 pl-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Old Value</label>
                  <div className="mt-1 p-2 bg-muted rounded border">
                    <pre className="text-sm text-red-600">
                      {utils.formatChangeValue(change.oldValue)}
                    </pre>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">New Value</label>
                  <div className="mt-1 p-2 bg-muted rounded border">
                    <pre className="text-sm text-green-600">
                      {utils.formatChangeValue(change.newValue)}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">{change.metadata.source}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <GitBranch className="h-4 w-4" />
                    <span className="text-sm">{change.metadata.version}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Session</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">{change.sessionId}</span>
                  </div>
                </div>
              </div>
              
              {change.metadata.validation.warnings.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-yellow-600">Warnings</label>
                  <div className="mt-1 space-y-1">
                    {change.metadata.validation.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-yellow-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {change.metadata.validation.errors.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-red-600">Errors</label>
                  <div className="mt-1 space-y-1">
                    {change.metadata.validation.errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
                        <XCircle className="h-3 w-3" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [expandedChanges, handleToggleExpanded, utils]);

  // Render snapshot item
  const renderSnapshotItem = useCallback((snapshot: ConfigSnapshot) => {
    return (
      <div key={snapshot.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <div>
              <h4 className="font-medium">{snapshot.description}</h4>
              <p className="text-sm text-muted-foreground">
                Version {snapshot.version} • {utils.formatTimestamp(snapshot.timestamp)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{snapshot.changeCount} changes</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRevertToVersion(snapshot.version)}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Revert
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {snapshot.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Size:</span>
            <span className="ml-2">{(snapshot.metadata.totalSize / 1024).toFixed(1)} KB</span>
          </div>
          <div>
            <span className="text-muted-foreground">Categories:</span>
            <span className="ml-2">{snapshot.metadata.categories.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Performance:</span>
            <span className="ml-2">{snapshot.metadata.performanceScore}/100</span>
          </div>
        </div>
      </div>
    );
  }, [utils, handleRevertToVersion]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Configuration Change Logger</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="changes">
                <History className="h-4 w-4 mr-2" />
                Change History
              </TabsTrigger>
              <TabsTrigger value="snapshots">
                <Archive className="h-4 w-4 mr-2" />
                Snapshots
              </TabsTrigger>
              <TabsTrigger value="diff">
                <Diff className="h-4 w-4 mr-2" />
                Compare
              </TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search changes..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="strategy_weights">Strategy Weights</SelectItem>
                    <SelectItem value="thresholds">Thresholds</SelectItem>
                    <SelectItem value="exclusions">Exclusions</SelectItem>
                    <SelectItem value="display_settings">Display Settings</SelectItem>
                    <SelectItem value="risk_parameters">Risk Parameters</SelectItem>
                    <SelectItem value="execution_rules">Execution Rules</SelectItem>
                    <SelectItem value="overlay_settings">Overlay Settings</SelectItem>
                    <SelectItem value="notification_preferences">Notifications</SelectItem>
                    <SelectItem value="ui_preferences">UI Preferences</SelectItem>
                    <SelectItem value="data_sources">Data Sources</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedChangeType} onValueChange={handleChangeTypeChange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Change Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="create">Created</SelectItem>
                    <SelectItem value="update">Updated</SelectItem>
                    <SelectItem value="delete">Deleted</SelectItem>
                    <SelectItem value="revert">Reverted</SelectItem>
                    <SelectItem value="bulk_update">Bulk Updated</SelectItem>
                    <SelectItem value="import">Imported</SelectItem>
                    <SelectItem value="reset">Reset</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-[140px]"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-[140px]"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleExportChanges('json')}
                  className="ml-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportChanges('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Summary */}
              {changesData?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{changesData.summary.totalChanges}</div>
                      <p className="text-sm text-muted-foreground">Total Changes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{Object.keys(changesData.summary.categoryCounts).length}</div>
                      <p className="text-sm text-muted-foreground">Categories</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{changesData.summary.topFields.length}</div>
                      <p className="text-sm text-muted-foreground">Fields Modified</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {changesData.summary.timeRange.earliest && changesData.summary.timeRange.latest
                          ? Math.ceil((new Date(changesData.summary.timeRange.latest).getTime() - new Date(changesData.summary.timeRange.earliest).getTime()) / (1000 * 60 * 60 * 24))
                          : 0
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">Days Range</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Changes List */}
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {changesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading changes...</p>
                    </div>
                  ) : changesError ? (
                    <div className="text-center py-8">
                      <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Failed to load changes</p>
                    </div>
                  ) : changesData?.changes?.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No changes found</p>
                    </div>
                  ) : (
                    changesData?.changes?.map(renderChangeItem)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="snapshots" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Configuration Snapshots</h3>
                <Button onClick={() => setShowCreateSnapshot(true)}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Snapshot
                </Button>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {snapshotsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading snapshots...</p>
                    </div>
                  ) : snapshotsError ? (
                    <div className="text-center py-8">
                      <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Failed to load snapshots</p>
                    </div>
                  ) : snapshots.length === 0 ? (
                    <div className="text-center py-8">
                      <Archive className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No snapshots found</p>
                    </div>
                  ) : (
                    snapshots.map(renderSnapshotItem)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="diff" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">From Version</label>
                  <Select value={diffFromVersion} onValueChange={setDiffFromVersion}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {snapshots.map((snapshot) => (
                        <SelectItem key={snapshot.id} value={snapshot.version}>
                          {snapshot.version} - {snapshot.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">To Version</label>
                  <Select value={diffToVersion} onValueChange={setDiffToVersion}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {snapshots.map((snapshot) => (
                        <SelectItem key={snapshot.id} value={snapshot.version}>
                          {snapshot.version} - {snapshot.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateDiff}
                disabled={!diffFromVersion || !diffToVersion || generateDiffMutation.isPending}
              >
                <Diff className="h-4 w-4 mr-2" />
                Generate Diff
              </Button>
              
              {currentDiff && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration Diff</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm font-medium">Total Changes:</span>
                          <span className="ml-2">{currentDiff.summary.totalChanges}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Critical Changes:</span>
                          <span className="ml-2">{currentDiff.summary.criticalChanges}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Risk Score:</span>
                          <span className="ml-2">{currentDiff.summary.riskScore}/100</span>
                        </div>
                      </div>
                      
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {currentDiff.changes.map((change, index) => (
                            <div key={index} className="border rounded p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{change.category}</Badge>
                                  <span className="font-medium">{change.field}</span>
                                </div>
                                <Badge variant={
                                  change.severity === 'low' ? 'default' :
                                  change.severity === 'medium' ? 'secondary' :
                                  change.severity === 'high' ? 'destructive' : 
                                  'outline'
                                }>
                                  {change.severity}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-sm text-red-600">- {utils.formatChangeValue(change.oldValue)}</span>
                                </div>
                                <div>
                                  <span className="text-sm text-green-600">+ {utils.formatChangeValue(change.newValue)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Snapshot Dialog */}
      <Dialog open={showCreateSnapshot} onOpenChange={setShowCreateSnapshot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Configuration Snapshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={snapshotDescription}
                onChange={(e) => setSnapshotDescription(e.target.value)}
                placeholder="Enter snapshot description"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {snapshotTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateSnapshot(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSnapshot} disabled={createSnapshotMutation.isPending}>
                {createSnapshotMutation.isPending ? 'Creating...' : 'Create Snapshot'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revert Dialog */}
      <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revert Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Revert</label>
              <Input
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="Enter reason for reverting"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dryRun"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
              />
              <label htmlFor="dryRun" className="text-sm font-medium">
                Dry Run (Preview changes only)
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRevertDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedSnapshot && handleRevertToVersion(selectedSnapshot.version)}
                disabled={revertMutation.isPending}
                variant={isDryRun ? 'outline' : 'destructive'}
              >
                {revertMutation.isPending ? 'Processing...' : isDryRun ? 'Preview Revert' : 'Revert Configuration'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 