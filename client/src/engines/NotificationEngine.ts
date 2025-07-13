// Block 33: Notification Center - Engine
import { 
  Notification, 
  NotificationSettings, 
  NotificationRule,
  NotificationTemplate,
  NotificationStats
} from '../types/notifications';

export class NotificationEngine {
  private notifications: Map<string, Notification> = new Map();
  private rules: Map<string, NotificationRule> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private settings: NotificationSettings = {
    enabled: true,
    maxStoredNotifications: 1000,
    autoMarkRead: false,
    soundEnabled: true,
    browserNotifications: true,
    emailNotifications: false,
    digestFrequency: 'daily',
    categories: {
      alerts: true,
      signals: true,
      gpt: true,
      system: true,
      trading: true
    }
  };

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultRules();
  }

  /**
   * Create a new notification
   */
  createNotification(
    type: Notification['type'],
    title: string,
    message: string,
    data?: any,
    priority: Notification['priority'] = 'medium'
  ): Notification {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      priority,
      timestamp: new Date(),
      read: false,
      archived: false,
      dismissed: false,
      data,
      actions: this.getActionsForType(type),
      expiresAt: this.calculateExpiry(type, priority)
    };

    this.notifications.set(notification.id, notification);
    this.processNotification(notification);
    this.cleanupExpiredNotifications();

    return notification;
  }

  /**
   * Get all notifications
   */
  getAllNotifications(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.getAllNotifications()
      .filter(n => !n.read && !n.dismissed);
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type: Notification['type']): Notification[] {
    return this.getAllNotifications()
      .filter(n => n.type === type);
  }

  /**
   * Get notifications by priority
   */
  getNotificationsByPriority(priority: Notification['priority']): Notification[] {
    return this.getAllNotifications()
      .filter(n => n.priority === priority);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.read = true;
    return true;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): number {
    let count = 0;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        count++;
      }
    });
    return count;
  }

  /**
   * Dismiss notification
   */
  dismissNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.dismissed = true;
    return true;
  }

  /**
   * Archive notification
   */
  archiveNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.archived = true;
    notification.read = true;
    return true;
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): boolean {
    return this.notifications.delete(notificationId);
  }

  /**
   * Bulk operations
   */
  bulkMarkAsRead(notificationIds: string[]): number {
    let count = 0;
    notificationIds.forEach(id => {
      if (this.markAsRead(id)) count++;
    });
    return count;
  }

  bulkDismiss(notificationIds: string[]): number {
    let count = 0;
    notificationIds.forEach(id => {
      if (this.dismissNotification(id)) count++;
    });
    return count;
  }

  bulkArchive(notificationIds: string[]): number {
    let count = 0;
    notificationIds.forEach(id => {
      if (this.archiveNotification(id)) count++;
    });
    return count;
  }

  bulkDelete(notificationIds: string[]): number {
    let count = 0;
    notificationIds.forEach(id => {
      if (this.deleteNotification(id)) count++;
    });
    return count;
  }

  /**
   * Search notifications
   */
  searchNotifications(query: string): Notification[] {
    const searchTerm = query.toLowerCase();
    return this.getAllNotifications()
      .filter(n => 
        n.title.toLowerCase().includes(searchTerm) ||
        n.message.toLowerCase().includes(searchTerm)
      );
  }

  /**
   * Filter notifications
   */
  filterNotifications(filters: {
    types?: Notification['type'][];
    priorities?: Notification['priority'][];
    read?: boolean;
    archived?: boolean;
    dismissed?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }): Notification[] {
    let filtered = this.getAllNotifications();

    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(n => filters.types!.includes(n.type));
    }

    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter(n => filters.priorities!.includes(n.priority));
    }

    if (filters.read !== undefined) {
      filtered = filtered.filter(n => n.read === filters.read);
    }

    if (filters.archived !== undefined) {
      filtered = filtered.filter(n => n.archived === filters.archived);
    }

    if (filters.dismissed !== undefined) {
      filtered = filtered.filter(n => n.dismissed === filters.dismissed);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(n => n.timestamp >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(n => n.timestamp <= filters.dateTo!);
    }

    return filtered;
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): NotificationStats {
    const all = this.getAllNotifications();
    const unread = this.getUnreadNotifications();
    
    const byType = all.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = all.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: all.length,
      unread: unread.length,
      archived: all.filter(n => n.archived).length,
      dismissed: all.filter(n => n.dismissed).length,
      byType,
      byPriority,
      oldestUnread: unread.length > 0 ? Math.min(...unread.map(n => n.timestamp.getTime())) : null,
      newestUnread: unread.length > 0 ? Math.max(...unread.map(n => n.timestamp.getTime())) : null
    };
  }

  /**
   * Create notification rule
   */
  createRule(rule: Omit<NotificationRule, 'id' | 'createdAt'>): NotificationRule {
    const fullRule: NotificationRule = {
      ...rule,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    this.rules.set(fullRule.id, fullRule);
    return fullRule;
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Export notifications
   */
  exportNotifications(): { notifications: Notification[], settings: NotificationSettings } {
    return {
      notifications: this.getAllNotifications(),
      settings: this.settings
    };
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): number {
    const count = this.notifications.size;
    this.notifications.clear();
    return count;
  }

  /**
   * Clear old notifications
   */
  clearOldNotifications(olderThanDays: number = 30): number {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let cleared = 0;
    
    this.notifications.forEach((notification, id) => {
      if (notification.timestamp < cutoffDate) {
        this.notifications.delete(id);
        cleared++;
      }
    });
    
    return cleared;
  }

  /**
   * Process notification (apply rules, trigger actions)
   */
  private processNotification(notification: Notification): void {
    // Apply notification rules
    this.rules.forEach(rule => {
      if (this.matchesRule(notification, rule)) {
        this.applyRule(notification, rule);
      }
    });

    // Trigger system actions
    if (this.settings.enabled && this.settings.categories[notification.type]) {
      this.triggerSystemNotification(notification);
    }
  }

  /**
   * Check if notification matches rule
   */
  private matchesRule(notification: Notification, rule: NotificationRule): boolean {
    if (!rule.enabled) return false;
    
    if (rule.conditions.types && !rule.conditions.types.includes(notification.type)) {
      return false;
    }
    
    if (rule.conditions.priorities && !rule.conditions.priorities.includes(notification.priority)) {
      return false;
    }
    
    if (rule.conditions.keywords && rule.conditions.keywords.length > 0) {
      const content = `${notification.title} ${notification.message}`.toLowerCase();
      const hasKeyword = rule.conditions.keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    return true;
  }

  /**
   * Apply rule actions to notification
   */
  private applyRule(notification: Notification, rule: NotificationRule): void {
    rule.actions.forEach(action => {
      switch (action.type) {
        case 'auto_read':
          notification.read = true;
          break;
        case 'auto_archive':
          notification.archived = true;
          notification.read = true;
          break;
        case 'auto_dismiss':
          notification.dismissed = true;
          break;
        case 'email':
          // Would trigger email notification
          console.log(`[NotificationEngine] Email action for: ${notification.title}`);
          break;
        case 'webhook':
          // Would trigger webhook
          console.log(`[NotificationEngine] Webhook action for: ${notification.title}`);
          break;
      }
    });
  }

  /**
   * Trigger system notification (browser, sound, etc.)
   */
  private triggerSystemNotification(notification: Notification): void {
    // Browser notification
    if (this.settings.browserNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    }

    // Sound notification
    if (this.settings.soundEnabled) {
      // Would play notification sound
      console.log(`[NotificationEngine] Sound for: ${notification.title}`);
    }
  }

  /**
   * Get actions for notification type
   */
  private getActionsForType(type: Notification['type']): Array<{id: string, label: string, action: string}> {
    const commonActions = [
      { id: 'mark_read', label: 'Mark as Read', action: 'mark_read' },
      { id: 'dismiss', label: 'Dismiss', action: 'dismiss' },
      { id: 'archive', label: 'Archive', action: 'archive' }
    ];

    switch (type) {
      case 'alerts':
        return [
          ...commonActions,
          { id: 'view_asset', label: 'View Asset', action: 'view_asset' },
          { id: 'update_alert', label: 'Update Alert', action: 'update_alert' }
        ];
      case 'trading':
        return [
          ...commonActions,
          { id: 'view_trade', label: 'View Trade', action: 'view_trade' },
          { id: 'execute_trade', label: 'Execute', action: 'execute_trade' }
        ];
      case 'gpt':
        return [
          ...commonActions,
          { id: 'view_explanation', label: 'View Full Explanation', action: 'view_explanation' },
          { id: 'ask_followup', label: 'Ask Follow-up', action: 'ask_followup' }
        ];
      default:
        return commonActions;
    }
  }

  /**
   * Calculate expiry date for notification
   */
  private calculateExpiry(type: Notification['type'], priority: Notification['priority']): Date | null {
    const now = new Date();
    
    // High priority notifications don't expire
    if (priority === 'high') return null;
    
    // Different expiry times based on type
    switch (type) {
      case 'alerts':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      case 'trading':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      case 'gpt':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      case 'system':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  }

  /**
   * Clean up expired notifications
   */
  private cleanupExpiredNotifications(): void {
    const now = new Date();
    this.notifications.forEach((notification, id) => {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
      }
    });

    // Also enforce max storage limit
    if (this.notifications.size > this.settings.maxStoredNotifications) {
      const sorted = this.getAllNotifications();
      const toDelete = sorted.slice(this.settings.maxStoredNotifications);
      toDelete.forEach(n => this.notifications.delete(n.id));
    }
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'price_alert',
        name: 'Price Alert',
        type: 'alerts',
        title: '{{symbol}} Price Alert',
        message: '{{symbol}} has {{direction}} {{trigger_price}}. Current price: {{current_price}}',
        priority: 'medium'
      },
      {
        id: 'signal_generated',
        name: 'Signal Generated',
        type: 'signals',
        title: 'New {{signal_type}} Signal',
        message: '{{signal_description}} for {{symbol}}. Confidence: {{confidence}}%',
        priority: 'medium'
      },
      {
        id: 'gpt_suggestion',
        name: 'GPT Suggestion',
        type: 'gpt',
        title: 'AI Suggestion',
        message: '{{gpt_message}}',
        priority: 'low'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Initialize default rules
   */
  private initializeDefaultRules(): void {
    // Auto-archive old notifications
    this.createRule({
      name: 'Auto-archive old notifications',
      enabled: true,
      conditions: {
        types: ['system'],
        olderThanDays: 7
      },
      actions: [{ type: 'auto_archive' }]
    });

    // Auto-read low priority notifications
    this.createRule({
      name: 'Auto-read low priority',
      enabled: false,
      conditions: {
        priorities: ['low']
      },
      actions: [{ type: 'auto_read' }]
    });
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const notificationEngine = new NotificationEngine(); 