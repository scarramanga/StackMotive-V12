import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bell, Send, Settings, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNotifications,
  useNotificationConfig,
  useDispatchEvent,
  useUpdateNotificationConfig,
  useQueueStatus,
  useNotificationDispatcherUtils,
  type NotificationEvent,
  type NotificationConfig,
  type NotificationType,
  type NotificationChannel,
  type NotificationPriority,
} from '@/services/notificationDispatcherService';

export const NotificationDispatcherPanel: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const { data: notifications, isLoading: notificationsLoading } = useNotifications(userId);
  const { data: config, isLoading: configLoading } = useNotificationConfig(userId);
  const { data: queueStatus, isLoading: queueLoading } = useQueueStatus();
  const dispatchEvent = useDispatchEvent(userId);
  const updateConfig = useUpdateNotificationConfig(userId);
  const utils = useNotificationDispatcherUtils(userId);

  const [activeTab, setActiveTab] = useState('notifications');
  const [newNotification, setNewNotification] = useState({
    type: 'user_message' as NotificationType,
    title: '',
    message: '',
    priority: 'normal' as NotificationPriority,
    channels: ['email'] as NotificationChannel[],
    recipient: '',
  });

  const handleDispatchNotification = () => {
    if (!newNotification.title || !newNotification.message) return;

    const notification: NotificationEvent = {
      id: '',
      type: newNotification.type,
      title: newNotification.title,
      message: newNotification.message,
      priority: newNotification.priority,
      channels: newNotification.channels,
      recipients: [
        {
          id: userId,
          type: 'user',
          address: newNotification.recipient || user?.email || '',
          preferences: {
            channels: newNotification.channels,
            frequency: 'immediate',
            format: 'html',
          },
        },
      ],
      data: {
        payload: {},
        attachments: [],
        links: [],
        actions: [],
      },
      triggers: [],
      scheduling: {
        immediate: true,
        delayed: 0,
        recurring: { enabled: false, pattern: '', endDate: '', maxOccurrences: 0 },
        timezone: 'UTC',
      },
      delivery: {
        retries: 3,
        timeout: 30000,
        fallback: ['email'],
        confirmation: false,
      },
      status: 'pending',
      metadata: {
        source: 'manual',
        category: 'user_action',
        tags: [],
        tracking: {
          opened: false,
          clicked: false,
          delivered: false,
          bounced: false,
        },
      },
      created: new Date().toISOString(),
      sent: '',
      acknowledged: '',
    };

    dispatchEvent.mutate(notification, {
      onSuccess: () => {
        setNewNotification({
          type: 'user_message',
          title: '',
          message: '',
          priority: 'normal',
          channels: ['email'],
          recipient: '',
        });
      },
    });
  };

  const handleUpdateConfig = (updates: Partial<NotificationConfig>) => {
    if (!config) return;

    updateConfig.mutate({
      ...config,
      ...updates,
    });
  };

  const handleChannelToggle = (channel: NotificationChannel, enabled: boolean) => {
    setNewNotification(prev => ({
      ...prev,
      channels: enabled
        ? [...prev.channels, channel]
        : prev.channels.filter(c => c !== channel),
    }));
  };

  const recentNotifications = notifications?.slice(0, 10) || [];
  const totalNotifications = notifications?.length || 0;
  const sentNotifications = notifications?.filter(n => n.status === 'sent').length || 0;
  const failedNotifications = notifications?.filter(n => n.status === 'failed').length || 0;
  const pendingNotifications = notifications?.filter(n => n.status === 'pending').length || 0;

  const isLoading = notificationsLoading || configLoading || queueLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Dispatcher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalNotifications}</div>
              <div className="text-sm text-muted-foreground">Total Notifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sentNotifications}</div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingNotifications}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedNotifications}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading notifications...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {utils.formatNotificationType(notification.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{notification.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={notification.priority === 'critical' ? 'destructive' : 'secondary'}
                            style={{ backgroundColor: utils.getPriorityColor(notification.priority) }}
                          >
                            {notification.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {notification.channels.map((channel) => (
                              <Badge key={channel} variant="outline" className="text-xs">
                                {utils.formatNotificationChannel(channel)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              notification.status === 'sent' ? 'default' :
                              notification.status === 'failed' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {notification.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(notification.created).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch New Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newNotification.type}
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value as NotificationType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signal_alert">Signal Alert</SelectItem>
                      <SelectItem value="rebalance_event">Rebalance Event</SelectItem>
                      <SelectItem value="execution_alert">Execution Alert</SelectItem>
                      <SelectItem value="system_alert">System Alert</SelectItem>
                      <SelectItem value="user_message">User Message</SelectItem>
                      <SelectItem value="compliance_alert">Compliance Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newNotification.priority}
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, priority: value as NotificationPriority }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter notification message"
                  rows={4}
                />
              </div>

              <div>
                <Label>Recipient</Label>
                <Input
                  value={newNotification.recipient}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="Enter recipient email"
                />
              </div>

              <div>
                <Label>Channels</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(['email', 'sms', 'push', 'in_app', 'webhook', 'slack'] as NotificationChannel[]).map((channel) => (
                    <div key={channel} className="flex items-center space-x-2">
                      <Switch
                        id={channel}
                        checked={newNotification.channels.includes(channel)}
                        onCheckedChange={(checked) => handleChannelToggle(channel, checked)}
                      />
                      <Label htmlFor={channel} className="text-sm">
                        {utils.formatNotificationChannel(channel)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleDispatchNotification}
                disabled={!newNotification.title || !newNotification.message || dispatchEvent.isPending}
                className="w-full"
              >
                {dispatchEvent.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Dispatch Notification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {config ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Global Notifications</Label>
                    <Switch
                      checked={config.preferences.globalEnabled}
                      onCheckedChange={(checked) => handleUpdateConfig({
                        preferences: { ...config.preferences, globalEnabled: checked }
                      })}
                    />
                  </div>

                  <div>
                    <Label>Default Channels</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(['email', 'sms', 'push', 'in_app'] as NotificationChannel[]).map((channel) => (
                        <div key={channel} className="flex items-center space-x-2">
                          <Switch
                            id={`default-${channel}`}
                            checked={config.preferences.defaultChannels.includes(channel)}
                            onCheckedChange={(checked) => {
                              const newChannels = checked
                                ? [...config.preferences.defaultChannels, channel]
                                : config.preferences.defaultChannels.filter(c => c !== channel);
                              handleUpdateConfig({
                                preferences: { ...config.preferences, defaultChannels: newChannels }
                              });
                            }}
                          />
                          <Label htmlFor={`default-${channel}`} className="text-sm">
                            {utils.formatNotificationChannel(channel)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Quiet Hours Start</Label>
                      <Input
                        type="time"
                        value={config.preferences.quietHours.start}
                        onChange={(e) => handleUpdateConfig({
                          preferences: {
                            ...config.preferences,
                            quietHours: { ...config.preferences.quietHours, start: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Quiet Hours End</Label>
                      <Input
                        type="time"
                        value={config.preferences.quietHours.end}
                        onChange={(e) => handleUpdateConfig({
                          preferences: {
                            ...config.preferences,
                            quietHours: { ...config.preferences.quietHours, end: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Loading configuration...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queueStatus ? (
                <div className="space-y-4">
                  {queueStatus.map((queue) => (
                    <div key={queue.id} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{queue.name}</h4>
                        <Badge variant={queue.status === 'active' ? 'default' : 'secondary'}>
                          {queue.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Queue Size</div>
                          <div className="font-medium">{queue.events.length}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Processed</div>
                          <div className="font-medium">{queue.metrics.totalProcessed}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Success Rate</div>
                          <div className="font-medium">{(queue.metrics.successRate * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg. Delivery</div>
                          <div className="font-medium">{queue.metrics.averageDeliveryTime}ms</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Loading queue status...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dispatchEvent.isSuccess && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            Notification dispatched successfully!
          </AlertDescription>
        </Alert>
      )}

      {dispatchEvent.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Failed to dispatch notification. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 