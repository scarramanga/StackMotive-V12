// Block 33: Notification Center - Types
export interface Notification {
  id: string;
  type: 'alerts' | 'signals' | 'gpt' | 'system' | 'trading';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
  archived: boolean;
  dismissed: boolean;
  data?: any; // Additional data specific to notification type
  actions: NotificationAction[];
  expiresAt: Date | null;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
}

export interface NotificationSettings {
  enabled: boolean;
  maxStoredNotifications: number;
  autoMarkRead: boolean;
  soundEnabled: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
  digestFrequency: 'never' | 'daily' | 'weekly';
  categories: {
    alerts: boolean;
    signals: boolean;
    gpt: boolean;
    system: boolean;
    trading: boolean;
  };
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: NotificationRuleConditions;
  actions: NotificationRuleAction[];
  createdAt: Date;
}

export interface NotificationRuleConditions {
  types?: Notification['type'][];
  priorities?: Notification['priority'][];
  keywords?: string[];
  olderThanDays?: number;
}

export interface NotificationRuleAction {
  type: 'auto_read' | 'auto_archive' | 'auto_dismiss' | 'email' | 'webhook';
  value?: any;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: Notification['type'];
  title: string; // Template with {{variables}}
  message: string; // Template with {{variables}}
  priority: Notification['priority'];
}

export interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  dismissed: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  oldestUnread: number | null;
  newestUnread: number | null;
}

export interface NotificationState {
  notifications: Notification[];
  settings: NotificationSettings;
  rules: NotificationRule[];
  selectedNotifications: string[];
  filter: NotificationFilter;
  sortBy: 'timestamp' | 'priority' | 'type';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}

export interface NotificationFilter {
  types?: Notification['type'][];
  priorities?: Notification['priority'][];
  read?: boolean;
  archived?: boolean;
  dismissed?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface NotificationActions {
  createNotification: (
    type: Notification['type'],
    title: string,
    message: string,
    data?: any,
    priority?: Notification['priority']
  ) => Notification;
  markAsRead: (notificationId: string) => boolean;
  markAllAsRead: () => number;
  dismissNotification: (notificationId: string) => boolean;
  archiveNotification: (notificationId: string) => boolean;
  deleteNotification: (notificationId: string) => boolean;
  bulkOperation: (operation: 'read' | 'dismiss' | 'archive' | 'delete', ids: string[]) => number;
  searchNotifications: (query: string) => Notification[];
  filterNotifications: (filter: NotificationFilter) => Notification[];
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  createRule: (rule: Omit<NotificationRule, 'id' | 'createdAt'>) => NotificationRule;
  exportNotifications: () => { notifications: Notification[], settings: NotificationSettings };
  clearAllNotifications: () => number;
  clearOldNotifications: (olderThanDays?: number) => number;
}

export interface NotificationBulkOperation {
  type: 'read' | 'dismiss' | 'archive' | 'delete';
  notificationIds: string[];
}

export interface NotificationDigest {
  id: string;
  period: 'daily' | 'weekly';
  startDate: Date;
  endDate: Date;
  notifications: Notification[];
  summary: {
    totalCount: number;
    highPriorityCount: number;
    alertsCount: number;
    signalsCount: number;
    gptCount: number;
    tradingCount: number;
  };
  generatedAt: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'browser' | 'email' | 'webhook' | 'sms';
  enabled: boolean;
  config: any; // Channel-specific configuration
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  channel: NotificationChannel;
  types: Notification['type'][];
  priorities: Notification['priority'][];
  enabled: boolean;
  createdAt: Date;
} 