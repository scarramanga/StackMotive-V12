import React, { useState, useEffect } from 'react';
// import { PanelAnimator } from '@/components/ui/panel-animator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Calendar, Clock, Play, Pause, Settings, History, Target } from 'lucide-react';

interface RebalanceSchedule {
  id: string;
  userId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  enabled: boolean;
  nextRun: string;
  lastRun: string | null;
  thresholdPercent: number;
  autoExecute: boolean;
  notifications: boolean;
  createdAt: string;
}

interface RebalanceExecution {
  id: string;
  scheduleId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  triggeredBy: 'schedule' | 'threshold' | 'manual';
  executedAt: string;
  allocationsAdjusted: number;
  totalValue: number;
  summary: string;
}

interface RebalanceSchedulerProps {
  userId: string;
}

export const RebalanceScheduler: React.FC<RebalanceSchedulerProps> = ({ userId }) => {
  const [schedule, setSchedule] = useState<RebalanceSchedule | null>(null);
  const [executions, setExecutions] = useState<RebalanceExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [enabled, setEnabled] = useState(true);
  const [thresholdPercent, setThresholdPercent] = useState([5]);
  const [autoExecute, setAutoExecute] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    fetchScheduleData();
  }, [userId]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/rebalance/schedule/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch schedule data');
      const data = await response.json();
      
      if (data.schedule) {
        setSchedule(data.schedule);
        setFrequency(data.schedule.frequency);
        setEnabled(data.schedule.enabled);
        setThresholdPercent([data.schedule.thresholdPercent]);
        setAutoExecute(data.schedule.autoExecute);
        setNotifications(data.schedule.notifications);
      }
      
      setExecutions(data.executions || []);
      
      // Log to Agent Memory
      await fetch('/api/agent-memory/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'VIEW_REBALANCE_SCHEDULER',
          blockId: 9,
          data: { 
            hasSchedule: !!data.schedule,
            executionsCount: data.executions?.length || 0
          }
        })
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      
      const scheduleData = {
        frequency,
        enabled,
        thresholdPercent: thresholdPercent[0],
        autoExecute,
        notifications
      };
      
      const response = await fetch(`/api/rebalance/schedule/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) throw new Error('Failed to save schedule');
      
      // Log to Agent Memory
      await fetch('/api/agent-memory/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'UPDATE_REBALANCE_SCHEDULE',
          blockId: 9,
          data: scheduleData
        })
      });
      
      await fetchScheduleData();
    } catch (err) {
      console.error('Failed to save schedule:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerRebalance = async () => {
    try {
      const response = await fetch(`/api/rebalance/trigger/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: 'manual' })
      });
      
      if (!response.ok) throw new Error('Failed to trigger rebalance');
      
      // Log to Agent Memory
      await fetch('/api/agent-memory/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'TRIGGER_MANUAL_REBALANCE',
          blockId: 9,
          data: { timestamp: new Date().toISOString() }
        })
      });
      
      await fetchScheduleData();
    } catch (err) {
      console.error('Failed to trigger rebalance:', err);
    }
  };

  const getFrequencyDisplay = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      default: return freq;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'executing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggeredByIcon = (triggeredBy: string) => {
    switch (triggeredBy) {
      case 'schedule': return <Calendar className="h-4 w-4" />;
      case 'threshold': return <Target className="h-4 w-4" />;
      case 'manual': return <Play className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rebalance Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading schedule data...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error: {error}</div>
          ) : (
            <div className="space-y-6">
              {/* Current Schedule Status */}
              {schedule && (
                <Card className="p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-800">Current Schedule</h3>
                      <p className="text-sm text-blue-700">
                        {getFrequencyDisplay(schedule.frequency)} rebalancing 
                        {schedule.enabled ? ' (Active)' : ' (Inactive)'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Next run: {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'Not scheduled'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                        {schedule.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={handleTriggerRebalance}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run Now
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Schedule Configuration */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Schedule Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="frequency">Rebalance Frequency</Label>
                      <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="threshold">Deviation Threshold: {thresholdPercent[0]}%</Label>
                      <Slider
                        value={thresholdPercent}
                        onValueChange={setThresholdPercent}
                        max={25}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Trigger rebalance when any allocation deviates by this percentage
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enabled">Schedule Enabled</Label>
                      <Switch
                        id="enabled"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoExecute">Auto-Execute</Label>
                      <Switch
                        id="autoExecute"
                        checked={autoExecute}
                        onCheckedChange={setAutoExecute}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Email Notifications</Label>
                      <Switch
                        id="notifications"
                        checked={notifications}
                        onCheckedChange={setNotifications}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? 'Saving...' : 'Save Schedule'}
                  </Button>
                </div>
              </Card>

              {/* Execution History */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Execution History
                </h3>
                {executions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No rebalance executions yet</p>
                ) : (
                  <div className="space-y-3">
                    {executions.map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTriggeredByIcon(execution.triggeredBy)}
                          <div>
                            <div className="font-medium">
                              {execution.triggeredBy === 'manual' ? 'Manual Trigger' :
                               execution.triggeredBy === 'schedule' ? 'Scheduled Run' :
                               'Threshold Trigger'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(execution.executedAt).toLocaleString()}
                            </div>
                            {execution.summary && (
                              <div className="text-xs text-gray-500 mt-1">
                                {execution.summary}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                          {execution.totalValue > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              ${execution.totalValue.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Risk Settings */}
              <Card className="p-4 bg-yellow-50">
                <h3 className="font-semibold mb-2 text-yellow-800">Risk Management</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• Rebalancing will respect your risk tolerance settings</p>
                  <p>• Maximum single trade size is limited to 10% of portfolio value</p>
                  <p>• Minimum holding period of 7 days is enforced for tax efficiency</p>
                  <p>• All rebalances are logged and can be reviewed in detail</p>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RebalanceScheduler; 