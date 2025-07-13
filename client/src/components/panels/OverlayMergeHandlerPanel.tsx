import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Merge, AlertTriangle, CheckCircle, Settings, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useOverlayConfigurations,
  useOverlayMergePreview,
  useDetectConflicts,
  useResolveConflict,
  useApplyMerge,
  useValidateMergeResult,
  useSaveMergedOverlay,
  useOverlayMergeHandlerUtils,
  type MergeStrategy,
  type MergeRequest,
  type ConflictResolution,
  type DetectedConflict,
  type AppliedResolution,
} from '@/services/overlayMergeHandlerService';

export const OverlayMergeHandlerPanel: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const { data: overlays, isLoading: overlaysLoading } = useOverlayConfigurations();
  const generatePreview = useOverlayMergePreview(userId);
  const detectConflicts = useDetectConflicts(userId);
  const resolveConflict = useResolveConflict(userId);
  const applyMerge = useApplyMerge(userId);
  const validateResult = useValidateMergeResult(userId);
  const saveMergedOverlay = useSaveMergedOverlay(userId);
  const utils = useOverlayMergeHandlerUtils(userId);

  const [selectedOverlays, setSelectedOverlays] = useState<string[]>([]);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>({
    type: 'weighted_average',
    weighting: 'performance',
    aggregation: 'weighted',
    prioritization: 'performance',
    normalization: 'zscore',
    parameters: {
      weightThreshold: 0.1,
      signalThreshold: 0.05,
      confidenceThreshold: 0.7,
      timeAlignment: 'flexible',
      assetAlignment: 'flexible',
      riskLimits: {
        maxWeight: 0.3,
        maxConcentration: 0.5,
        maxVolatility: 0.25,
        maxDrawdown: 0.15,
        maxLeverage: 2.0,
      },
    },
  });
  const [detectedConflicts, setDetectedConflicts] = useState<DetectedConflict[]>([]);
  const [activeTab, setActiveTab] = useState('selection');

  const handleOverlaySelection = (overlayId: string, selected: boolean) => {
    if (selected) {
      setSelectedOverlays(prev => [...prev, overlayId]);
    } else {
      setSelectedOverlays(prev => prev.filter(id => id !== overlayId));
    }
  };

  const handleGeneratePreview = () => {
    if (selectedOverlays.length < 2) return;
    generatePreview.mutate({ overlayIds: selectedOverlays, strategy: mergeStrategy });
  };

  const handleDetectConflicts = () => {
    if (selectedOverlays.length < 2) return;
    detectConflicts.mutate(selectedOverlays, {
      onSuccess: (conflicts) => {
        setDetectedConflicts(conflicts);
        setActiveTab('conflicts');
      },
    });
  };

  const handleResolveConflict = (conflictId: string, resolution: AppliedResolution) => {
    resolveConflict.mutate({ conflictId, resolution });
  };

  const handleApplyMerge = () => {
    if (selectedOverlays.length < 2) return;
    
    const mergeRequest: MergeRequest = {
      id: '',
      name: `Merged Overlay ${new Date().toISOString()}`,
      description: `Merged overlay from ${selectedOverlays.length} sources`,
      userId,
      overlays: selectedOverlays,
      strategy: mergeStrategy,
      resolution: {
        strategy: 'automatic',
        rules: [],
        overrides: [],
        fallback: 'merge_partial',
        validation: {
          required: true,
          strictness: 'standard',
          tolerances: {},
        },
      },
      options: {
        preserveOriginals: true,
        validateOutput: true,
        generateReport: true,
        realTimeUpdates: false,
        backfillHistory: false,
        enableMonitoring: true,
      },
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    applyMerge.mutate(mergeRequest);
  };

  const handleSaveMergedOverlay = (overlay: any) => {
    saveMergedOverlay.mutate(overlay);
  };

  const selectedOverlayData = overlays?.filter(o => selectedOverlays.includes(o.id)) || [];
  const totalSignals = selectedOverlayData.reduce((sum, overlay) => sum + overlay.signals.length, 0);
  const totalRules = selectedOverlayData.reduce((sum, overlay) => sum + overlay.rules.length, 0);
  const averageComplexity = selectedOverlayData.length > 0 
    ? utils.calculateMergeComplexity(selectedOverlayData) / selectedOverlayData.length 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            Overlay Merge Handler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{selectedOverlays.length}</div>
              <div className="text-sm text-muted-foreground">Selected Overlays</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalSignals}</div>
              <div className="text-sm text-muted-foreground">Total Signals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalRules}</div>
              <div className="text-sm text-muted-foreground">Total Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{detectedConflicts.length}</div>
              <div className="text-sm text-muted-foreground">Conflicts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="selection">Selection</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="merge">Merge</TabsTrigger>
        </TabsList>

        <TabsContent value="selection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Overlays to Merge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overlays?.map((overlay) => (
                  <div key={overlay.id} className="flex items-center space-x-2 p-3 border rounded">
                    <Checkbox
                      id={overlay.id}
                      checked={selectedOverlays.includes(overlay.id)}
                      onCheckedChange={(checked) => handleOverlaySelection(overlay.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{overlay.name}</span>
                        <Badge variant={overlay.isActive ? 'default' : 'secondary'}>
                          {utils.formatOverlayType(overlay.type)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {overlay.signals.length} signals • {overlay.rules.length} rules
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  onClick={handleDetectConflicts}
                  disabled={selectedOverlays.length < 2 || detectConflicts.isPending}
                >
                  {detectConflicts.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    'Detect Conflicts'
                  )}
                </Button>
                <Button
                  onClick={handleGeneratePreview}
                  disabled={selectedOverlays.length < 2 || generatePreview.isPending}
                  variant="outline"
                >
                  Generate Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Merge Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {generatePreview.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold">{generatePreview.data.summary.totalSignals}</div>
                      <div className="text-sm text-muted-foreground">Total Signals</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold">{generatePreview.data.summary.activeSignals}</div>
                      <div className="text-sm text-muted-foreground">Active Signals</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold">{generatePreview.data.summary.conflictCount}</div>
                      <div className="text-sm text-muted-foreground">Conflicts</div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded">
                    <h4 className="font-medium mb-2">Performance Projection</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Expected Return: {(generatePreview.data.expectedPerformance.expected_return * 100).toFixed(2)}%</div>
                      <div>Volatility: {(generatePreview.data.expectedPerformance.volatility * 100).toFixed(2)}%</div>
                      <div>Sharpe Ratio: {generatePreview.data.expectedPerformance.sharpe_ratio.toFixed(2)}</div>
                      <div>Tracking Error: {(generatePreview.data.expectedPerformance.tracking_error * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select overlays and generate preview to see merge simulation
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detected Conflicts</CardTitle>
            </CardHeader>
            <CardContent>
              {detectedConflicts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Auto-Resolvable</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detectedConflicts.map((conflict) => (
                      <TableRow key={conflict.id}>
                        <TableCell>
                          <Badge variant="outline">{conflict.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={conflict.severity === 'critical' ? 'destructive' : 'secondary'}
                            style={{ backgroundColor: utils.getConflictSeverityColor(conflict.severity) }}
                          >
                            {utils.formatConflictSeverity(conflict.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>{conflict.description}</TableCell>
                        <TableCell>
                          {conflict.autoResolvable ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleResolveConflict(conflict.id, {
                              id: '',
                              conflictId: conflict.id,
                              method: 'override',
                              parameters: {},
                              result: { success: true, outcome: 'resolved', changes: [], warnings: [], errors: [], metrics: { processingTime: 0, complexity: 0, confidence: 0, stability: 0, performance_impact: 0 } },
                              validation: { passed: true, score: 1, issues: [], recommendations: [] },
                            })}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No conflicts detected. Ready to merge!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Merge Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Merge Type</label>
                  <Select
                    value={mergeStrategy.type}
                    onValueChange={(value) => setMergeStrategy(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="union">Union</SelectItem>
                      <SelectItem value="intersection">Intersection</SelectItem>
                      <SelectItem value="weighted_average">Weighted Average</SelectItem>
                      <SelectItem value="prioritized">Prioritized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Weighting Method</label>
                  <Select
                    value={mergeStrategy.weighting}
                    onValueChange={(value) => setMergeStrategy(prev => ({ ...prev, weighting: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Equal</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="confidence">Confidence</SelectItem>
                      <SelectItem value="reliability">Reliability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleApplyMerge}
                  disabled={selectedOverlays.length < 2 || applyMerge.isPending}
                >
                  {applyMerge.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="w-4 h-4 mr-2" />
                      Apply Merge
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {applyMerge.isSuccess && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            Merge completed successfully! {applyMerge.data?.resolutions.length} conflicts resolved.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 