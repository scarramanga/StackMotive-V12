import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar, Clock, Play, Pause, Edit, Trash2, Plus, History, AlertTriangle, CheckCircle, Timer, Activity, BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  useRebalanceSchedules, 
  useCreateSchedule, 
  useUpdateSchedule, 
  useDeleteSchedule,
  useTriggerExecution,
  useExecutionHistory,
  rebalanceSchedulerService,
  type RebalanceSchedule,
  type RebalanceExecution
} from '../../services/rebalanceSchedulerService';

export const RebalanceSchedulerPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RebalanceSchedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<RebalanceSchedule | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('schedules');
  
  // Form state
  const [formData, setFormData] = useState<Partial<RebalanceSchedule>>(rebalanceSchedulerService.createDefaultFormData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formWarnings, setFormWarnings] = useState<string[]>([]);

  // API hooks
  const { data: schedulerData, isLoading, error } = useRebalanceSchedules((user as any)?.id || '1', activeVaultId || undefined);
  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();
  const triggerExecutionMutation = useTriggerExecution();
  const { data: executionHistory } = useExecutionHistory(selectedSchedule?.id || '', 20);

  // Handlers
  const handleInputChange = (field: string, value: any) => {
    const updatedData = rebalanceSchedulerService.updateFormField(formData, field, value);
    setFormData(updatedData);
    const validation = rebalanceSchedulerService.validateFormData(updatedData);
    setFormErrors(validation.errors);
    setFormWarnings(validation.warnings);
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    const updatedData = rebalanceSchedulerService.updateNestedFormField(formData, parent, field, value);
    setFormData(updatedData);
    const validation = rebalanceSchedulerService.validateFormData(updatedData);
    setFormErrors(validation.errors);
    setFormWarnings(validation.warnings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = rebalanceSchedulerService.validateFormData(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setFormWarnings(validation.warnings);
      return;
    }

    try {
      const userId = (user as any)?.id || '1';
      const scheduleData = rebalanceSchedulerService.prepareFormDataForSubmission(formData, userId, activeVaultId || undefined, editingSchedule || undefined);

      if (editingSchedule) {
        await updateScheduleMutation.mutateAsync({ scheduleId: editingSchedule.id, updates: scheduleData });
        await rebalanceSchedulerService.logAgentMemory('schedule_updated', {
          scheduleId: editingSchedule.id, scheduleName: formData.name, scheduleType: formData.scheduleType,
          userId, vaultId: activeVaultId || undefined, metadata: { changes: Object.keys(scheduleData) }
        });
      } else {
        const newSchedule = await createScheduleMutation.mutateAsync(scheduleData as any);
        await rebalanceSchedulerService.logAgentMemory('schedule_created', {
          scheduleId: newSchedule.id, scheduleName: formData.name, scheduleType: formData.scheduleType,
          userId, vaultId: activeVaultId || undefined, metadata: { method: formData.rebalanceConfig?.method }
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingSchedule(null);
    setFormData(rebalanceSchedulerService.createDefaultFormData());
    setFormErrors({});
    setFormWarnings([]);
  };

  const handleEdit = (schedule: RebalanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData(schedule);
    setFormErrors({});
    setFormWarnings([]);
    setShowCreateModal(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteScheduleMutation.mutateAsync(scheduleId);
        await rebalanceSchedulerService.logAgentMemory('schedule_deleted', {
          scheduleId, userId: (user as any)?.id || '1', vaultId: activeVaultId || undefined
        });
      } catch (error) {
        console.error('Failed to delete schedule:', error);
      }
    }
  };

  const handleToggleStatus = async (schedule: RebalanceSchedule) => {
    const newStatus = schedule.status === 'active' ? 'paused' : 'active';
    try {
      await updateScheduleMutation.mutateAsync({ scheduleId: schedule.id, updates: { status: newStatus } });
      await rebalanceSchedulerService.logAgentMemory('status_changed', {
        scheduleId: schedule.id, scheduleName: schedule.name, userId: (user as any)?.id || '1',
        vaultId: activeVaultId || undefined, metadata: { oldStatus: schedule.status, newStatus }
      });
    } catch (error) {
      console.error('Failed to update schedule status:', error);
    }
  };

  const handleTriggerExecution = async (scheduleId: string) => {
    try {
      await triggerExecutionMutation.mutateAsync({ scheduleId });
      await rebalanceSchedulerService.logAgentMemory('execution_triggered', {
        scheduleId, userId: (user as any)?.id || '1', vaultId: activeVaultId || undefined, metadata: { trigger: 'manual' }
      });
    } catch (error) {
      console.error('Failed to trigger execution:', error);
    }
  };

  const getExecutionStatusIcon = (status: RebalanceExecution['status']) => {
    const icons = {
      completed: <CheckCircle className="h-4 w-4 text-green-600" />,
      failed: <AlertTriangle className="h-4 w-4 text-red-600" />,
      executing: <Activity className="h-4 w-4 text-blue-600" />,
      pending: <Timer className="h-4 w-4 text-yellow-600" />,
      cancelled: <Clock className="h-4 w-4 text-gray-600" />,
    };
    return icons[status] || <Clock className="h-4 w-4 text-gray-600" />;
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error loading rebalance schedules: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  const summary = schedulerData?.summary;
  const schedules = schedulerData?.schedules || [];
  const executions = schedulerData?.executions || [];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rebalance Scheduler
              {summary && <Badge variant="secondary" className="text-xs">{summary.activeSchedules} active</Badge>}
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />New Schedule
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Schedules', value: summary.totalSchedules, color: '' },
            { label: 'Active', value: summary.activeSchedules, color: 'text-green-600' },
            { label: 'Pending', value: summary.pendingExecutions, color: 'text-blue-600' },
            { label: 'Completed', value: summary.completedExecutions, color: 'text-purple-600' },
            { label: 'Avg Execution', value: `${summary.avgExecutionTime.toFixed(1)}s`, color: '' }
          ].map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6"><div className="h-24 bg-muted rounded"></div></CardContent>
                </Card>
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No schedules configured</h3>
                <p className="text-muted-foreground mb-4">Create your first rebalance schedule to get started</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Create Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((schedule) => {
                const statusBadge = rebalanceSchedulerService.getStatusBadge(schedule.status);
                return (
                  <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="truncate">{schedule.name}</span>
                        </div>
                        <Badge className={statusBadge.variant}>{statusBadge.label}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{schedule.description}</p>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Schedule Type</div>
                          <div className="text-sm font-medium capitalize">{schedule.scheduleType.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Method</div>
                          <div className="text-sm font-medium capitalize">{schedule.rebalanceConfig.method.replace('_', ' ')}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Next Execution</div>
                          <div className="text-sm font-medium">{rebalanceSchedulerService.formatNextExecution(schedule)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Executions</div>
                          <div className="text-sm font-medium">{schedule.executionCount}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${schedule.executionSettings.autoExecute ? 'bg-green-500' : 'bg-gray-400'}`} />
                          Auto Execute
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${schedule.executionSettings.dryRun ? 'bg-blue-500' : 'bg-gray-400'}`} />
                          Dry Run
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button size="sm" variant="outline" onClick={() => handleToggleStatus(schedule)} disabled={updateScheduleMutation.isPending}>
                          {schedule.status === 'active' ? <><Pause className="h-4 w-4 mr-1" /> Pause</> : <><Play className="h-4 w-4 mr-1" /> Resume</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleTriggerExecution(schedule.id)} disabled={triggerExecutionMutation.isPending || schedule.status !== 'active'}>
                          <Activity className="h-4 w-4 mr-1" />Execute
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedSchedule(schedule); setShowHistoryModal(true); }}>
                          <History className="h-4 w-4 mr-1" />History
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(schedule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(schedule.id)} disabled={deleteScheduleMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {executions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent executions</h3>
                <p className="text-muted-foreground">Execution history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {executions.map((execution) => (
                <Card key={execution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getExecutionStatusIcon(execution.status)}
                        <div>
                          <div className="font-medium">{execution.triggerReason}</div>
                          <div className="text-sm text-muted-foreground">{new Date(execution.executionTime).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{execution.results?.totalTrades || 0} trades</div>
                        <div className="text-xs text-muted-foreground">{execution.results?.executionTime.toFixed(1)}s</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Global Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Default Trading Hours</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="09:00" />
                    <Input placeholder="16:00" />
                  </div>
                </div>
                <div>
                  <Label>Default Timezone</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications">Enable execution notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="confirmations" />
                <Label htmlFor="confirmations">Require confirmation for all executions</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Schedule Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {formWarnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Warnings</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {formWarnings.map((warning, idx) => <li key={idx}>• {warning}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Schedule Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
                {formErrors.name && <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <Label htmlFor="scheduleType">Schedule Type</Label>
                <Select value={formData.scheduleType} onValueChange={(value) => handleInputChange('scheduleType', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_based">Time Based</SelectItem>
                    <SelectItem value="signal_based">Signal Based</SelectItem>
                    <SelectItem value="event_based">Event Based</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.scheduleType && <p className="text-sm text-red-600 mt-1">{formErrors.scheduleType}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={2} />
            </div>

            {formData.scheduleType === 'time_based' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interval">Interval</Label>
                  <Select value={formData.interval} onValueChange={(value) => handleInputChange('interval', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.interval && <p className="text-sm text-red-600 mt-1">{formErrors.interval}</p>}
                </div>
                <div>
                  <Label htmlFor="timeOfDay">Time of Day</Label>
                  <Input id="timeOfDay" type="time" value={formData.timeOfDay} onChange={(e) => handleInputChange('timeOfDay', e.target.value)} />
                  {formErrors.timeOfDay && <p className="text-sm text-red-600 mt-1">{formErrors.timeOfDay}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rebalanceMethod">Rebalance Method</Label>
                <Select value={formData.rebalanceConfig?.method} onValueChange={(value) => handleNestedChange('rebalanceConfig', 'method', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proportional">Proportional</SelectItem>
                    <SelectItem value="equal_weight">Equal Weight</SelectItem>
                    <SelectItem value="target_allocation">Target Allocation</SelectItem>
                    <SelectItem value="risk_parity">Risk Parity</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.rebalanceMethod && <p className="text-sm text-red-600 mt-1">{formErrors.rebalanceMethod}</p>}
              </div>
              <div>
                <Label htmlFor="maxChange">Max Allocation Change (%)</Label>
                <Input id="maxChange" type="number" value={formData.rebalanceConfig?.maxAllocationChange} onChange={(e) => handleNestedChange('rebalanceConfig', 'maxAllocationChange', Number(e.target.value))} />
                {formErrors.maxAllocationChange && <p className="text-sm text-red-600 mt-1">{formErrors.maxAllocationChange}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="autoExecute" checked={formData.executionSettings?.autoExecute} onCheckedChange={(checked) => handleNestedChange('executionSettings', 'autoExecute', checked)} />
                <Label htmlFor="autoExecute">Auto Execute</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="dryRun" checked={formData.executionSettings?.dryRun} onCheckedChange={(checked) => handleNestedChange('executionSettings', 'dryRun', checked)} />
                <Label htmlFor="dryRun">Dry Run Mode</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending || Object.keys(formErrors).length > 0}>
                {editingSchedule ? 'Update' : 'Create'} Schedule
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Execution History Modal */}
      {selectedSchedule && (
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Execution History - {selectedSchedule.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {executionHistory?.map((execution) => (
                <Card key={execution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getExecutionStatusIcon(execution.status)}
                        <span className="font-medium">{execution.triggerReason}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{new Date(execution.executionTime).toLocaleString()}</div>
                    </div>
                    {execution.results && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Trades</div>
                          <div className="font-medium">{execution.results.totalTrades}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Value</div>
                          <div className="font-medium">${execution.results.totalValue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Execution Time</div>
                          <div className="font-medium">{execution.results.executionTime.toFixed(1)}s</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Fees</div>
                          <div className="font-medium">${execution.results.fees.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RebalanceSchedulerPanel; 