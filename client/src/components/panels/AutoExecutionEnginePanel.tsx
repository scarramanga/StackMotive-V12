import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Play,
  Pause,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
  Loader2,
  BarChart3,
  Queue,
  History,
  Target,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  autoExecutionEngineService,
  useExecutionStatus,
  useExecutionConfig,
  useToggleExecutionEngine,
  useUpdateExecutionConfig,
  useAvailableSignals,
  useQueueExecution,
  useExecutionHistory,
  useExecutionSummary,
  useQueueStatus,
  useForceRunEngine,
  ExecutionConfig
} from '../../services/autoExecutionEngineService';

export const AutoExecutionEnginePanel: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [isConfiguringEngine, setIsConfiguringEngine] = useState(false);
  const [configForm, setConfigForm] = useState<ExecutionConfig>(autoExecutionEngineService.createDefaultConfig());
  const [configErrors, setConfigErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mutations
  const toggleEngineMutation = useToggleExecutionEngine();
  const updateConfigMutation = useUpdateExecutionConfig();
  const queueExecutionMutation = useQueueExecution();
  const forceRunMutation = useForceRunEngine();

  // Fetch data
  const { data: status, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useExecutionStatus(user?.id);
  const { data: config, isLoading: configLoading } = useExecutionConfig(user?.id);
  const { data: availableSignals } = useAvailableSignals(user?.id);
  const { data: executionHistory } = useExecutionHistory(user?.id);
  const { data: executionSummary } = useExecutionSummary(user?.id);
  const { data: queueStatus } = useQueueStatus(user?.id);

  // Handle form changes
  const handleConfigFormChange = (field: string, value: any) => {
    if (field.startsWith('notifications.')) {
      const notificationKey = field.replace('notifications.', '');
      setConfigForm(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationKey]: value
        }
      }));
    } else {
      setConfigForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle engine toggle
  const handleToggleEngine = async () => {
    if (!user?.id || !status) return;
    
    try {
      const result = await autoExecutionEngineService.handleToggleEngine(user.id, status.isEnabled);
      if (result.success) {
        refetchStatus();
      }
    } catch (error) {
      console.error('Failed to toggle engine:', error);
    }
  };

  // Handle configuration
  const handleOpenConfig = () => {
    if (config) {
      setConfigForm(config);
    }
    setIsConfiguringEngine(true);
    setConfigErrors([]);
  };

  const handleCloseConfig = () => {
    setIsConfiguringEngine(false);
    setConfigForm(autoExecutionEngineService.createDefaultConfig());
    setConfigErrors([]);
  };

  const handleConfigSubmit = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setConfigErrors([]);
    
    try {
      const result = await autoExecutionEngineService.handleConfigUpdate(user.id, configForm);
      
      if (result.success) {
        setIsConfiguringEngine(false);
        refetchStatus();
      } else {
        setConfigErrors([result.error || 'Failed to update configuration']);
      }
    } catch (error) {
      setConfigErrors(['Failed to update configuration']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle force run
  const handleForceRun = async () => {
    if (!user?.id) return;
    
    try {
      const result = await autoExecutionEngineService.handleForceRun(user.id);
      if (result.success) {
        refetchStatus();
      }
    } catch (error) {
      console.error('Failed to force run:', error);
    }
  };

  // Handle signal execution
  const handleExecuteSignal = async (signalId: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    if (!user?.id) return;
    
    try {
      const result = await autoExecutionEngineService.handleSignalExecution(user.id, signalId, priority);
      if (result.success) {
        refetchStatus();
      }
    } catch (error) {
      console.error('Failed to execute signal:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchStatus();
  };

  // Get status icon
  const getStatusIcon = () => {
    if (statusLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (!status) return <XCircle className="h-5 w-5 text-gray-500" />;
    if (status.isEnabled && status.isRunning) return <Activity className="h-5 w-5 text-green-500" />;
    if (status.isEnabled && !status.isRunning) return <Clock className="h-5 w-5 text-yellow-500" />;
    return <Pause className="h-5 w-5 text-gray-500" />;
  };

  if (statusError) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading auto execution engine: {statusError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (statusLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading auto execution engine...
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
            <Zap className="h-5 w-5" />
            Auto Execution Engine
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleOpenConfig}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant={status?.isEnabled ? "default" : "outline"}
              onClick={handleToggleEngine}
              disabled={toggleEngineMutation.isPending}
            >
              {toggleEngineMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status?.isEnabled ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Engine Status */}
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <div className="font-medium">
                    {status?.isEnabled ? 'Engine Active' : 'Engine Disabled'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {status?.isEnabled 
                      ? `Running ${status.isRunning ? 'now' : 'idle'} • Next run ${autoExecutionEngineService.formatRelativeTime(status.nextRun)}`
                      : 'Enable engine to start automatic execution'
                    }
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleForceRun}
                  disabled={!status?.isEnabled || forceRunMutation.isPending}
                >
                  {forceRunMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Force Run
                </Button>
              </div>
            </div>
            
            {/* Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{status?.signalsMonitored || 0}</div>
                <div className="text-sm text-muted-foreground">Signals Monitored</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{status?.pendingExecutions || 0}</div>
                <div className="text-sm text-muted-foreground">Pending Executions</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {status?.performance.successRate ? `${status.performance.successRate.toFixed(1)}%` : '0%'}
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{status?.performance.totalExecutions || 0}</div>
                <div className="text-sm text-muted-foreground">Total Executions</div>
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          {status?.errors && status.errors.length > 0 && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">Recent Errors</span>
              </div>
              <div className="space-y-2">
                {status.errors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-sm text-red-800">
                    <span className="font-mono">
                      {autoExecutionEngineService.formatRelativeTime(error.timestamp)}
                    </span>
                    : {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="queue">Queue</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {executionSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-3">Execution Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Executions</span>
                        <span className="font-medium">{executionSummary.totalExecutions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Successful</span>
                        <span className="font-medium text-green-600">{executionSummary.successfulExecutions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Failed</span>
                        <span className="font-medium text-red-600">{executionSummary.failedExecutions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Volume</span>
                        <span className="font-medium">{autoExecutionEngineService.formatCurrency(executionSummary.totalVolume)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-3">Top Performing Signals</h4>
                    <div className="space-y-2">
                      {executionSummary.topPerformingSignals.slice(0, 3).map((signal, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{signal.source}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              {signal.successRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {signal.executionCount} executions
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Signals Tab */}
            <TabsContent value="signals" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Available Signals</h4>
                <Badge variant="secondary">
                  {availableSignals?.length || 0} signals
                </Badge>
              </div>
              
              {availableSignals && availableSignals.length > 0 ? (
                <div className="border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Signal</TableHead>
                        <TableHead>Strength</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableSignals.map(signal => (
                        <TableRow key={signal.id}>
                          <TableCell className="font-medium">{signal.ticker}</TableCell>
                          <TableCell>
                            <Badge 
                              className={`${autoExecutionEngineService.getSignalTypeColor(signal.signalType)} bg-transparent`}
                            >
                              {signal.signalType.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${autoExecutionEngineService.getSignalStrengthColor(signal.signalStrength)} bg-transparent`}
                            >
                              {signal.signalStrength}
                            </Badge>
                          </TableCell>
                          <TableCell>{(signal.confidence * 100).toFixed(1)}%</TableCell>
                          <TableCell className="text-sm">{signal.source}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExecuteSignal(signal.id, 'medium')}
                                disabled={!status?.isEnabled}
                              >
                                <Target className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No signals available for execution</p>
                </div>
              )}
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Execution Queue</h4>
                <Badge variant="secondary">
                  {queueStatus?.length || 0} queued
                </Badge>
              </div>
              
              {queueStatus && queueStatus.length > 0 ? (
                <div className="border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Queued</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueStatus.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.ticker}</TableCell>
                          <TableCell>
                            <Badge 
                              className={`${autoExecutionEngineService.getPriorityColor(item.priority)} bg-transparent`}
                            >
                              {item.priority.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {autoExecutionEngineService.formatRelativeTime(item.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => autoExecutionEngineService.handleCancelExecution(user?.id!, item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Queue className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No executions in queue</p>
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Execution History</h4>
                <Badge variant="secondary">
                  {executionHistory?.length || 0} executions
                </Badge>
              </div>
              
              {executionHistory && executionHistory.length > 0 ? (
                <div className="border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executionHistory.slice(0, 10).map(execution => (
                        <TableRow key={execution.id}>
                          <TableCell className="font-medium">{execution.id}</TableCell>
                          <TableCell>
                            <Badge 
                              className={`${autoExecutionEngineService.getStatusColor(execution.status)} bg-transparent`}
                            >
                              {execution.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{execution.executedQuantity}</TableCell>
                          <TableCell>{autoExecutionEngineService.formatCurrency(execution.averagePrice)}</TableCell>
                          <TableCell>{autoExecutionEngineService.formatCurrency(execution.totalValue)}</TableCell>
                          <TableCell className="text-sm">
                            {autoExecutionEngineService.formatRelativeTime(execution.executionTime)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No execution history</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      {/* Configuration Modal */}
      <Dialog open={isConfiguringEngine} onOpenChange={handleCloseConfig}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Engine Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Form Errors */}
            {configErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  {configErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Run Interval (seconds)</label>
                <Input
                  type="number"
                  value={configForm.runInterval}
                  onChange={(e) => handleConfigFormChange('runInterval', parseInt(e.target.value))}
                  min="60"
                  max="3600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Concurrent Executions</label>
                <Input
                  type="number"
                  value={configForm.maxConcurrentExecutions}
                  onChange={(e) => handleConfigFormChange('maxConcurrentExecutions', parseInt(e.target.value))}
                  min="1"
                  max="20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Default Order Type</label>
                <Select 
                  value={configForm.defaultOrderType} 
                  onValueChange={(value) => handleConfigFormChange('defaultOrderType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Slippage (%)</label>
                <Input
                  type="number"
                  value={configForm.maxSlippage}
                  onChange={(e) => handleConfigFormChange('maxSlippage', parseFloat(e.target.value))}
                  min="0"
                  max="10"
                  step="0.1"
                />
              </div>
            </div>

            {/* Risk Mode */}
            <div>
              <label className="block text-sm font-medium mb-1">Risk Mode</label>
              <Select 
                value={configForm.riskMode} 
                onValueChange={(value) => handleConfigFormChange('riskMode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notification Settings */}
            <div className="space-y-3">
              <h4 className="font-medium">Notifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">On Execution</label>
                  <Switch
                    checked={configForm.notifications.onExecution}
                    onCheckedChange={(checked) => handleConfigFormChange('notifications.onExecution', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">On Error</label>
                  <Switch
                    checked={configForm.notifications.onError}
                    onCheckedChange={(checked) => handleConfigFormChange('notifications.onError', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">On Constraint Failure</label>
                  <Switch
                    checked={configForm.notifications.onConstraintFailure}
                    onCheckedChange={(checked) => handleConfigFormChange('notifications.onConstraintFailure', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseConfig}>
                Cancel
              </Button>
              <Button onClick={handleConfigSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 