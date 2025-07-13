// Block 33: Notification Center - Hook
import { useState, useEffect, useCallback } from 'react';
import { 
  Notification, 
  NotificationState, 
  NotificationSettings, 
  NotificationFilter,
  NotificationStats,
  NotificationRule,
  NotificationBulkOperation
} from '../types/notifications';
import { notificationEngine } from '../engines/NotificationEngine';

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    settings: notificationEngine.getSettings(),
    rules: [],
    selectedNotifications: [],
    filter: {},
    sortBy: 'timestamp',
    sortOrder: 'desc',
    isLoading: false,
    error: null
  });

  // Initialize notifications
  useEffect(() => {
    setState(prev => ({
      ...prev,
      notifications: notificationEngine.getAllNotifications()
    }));
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Create notification
  const createNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    data?: any,
    priority: Notification['priority'] = 'medium'
  ) => {
    try {
      const notification = notificationEngine.createNotification(type, title, message, data, priority);
      setState(prev => ({
        ...prev,
        notifications: notificationEngine.getAllNotifications(),
        error: null
      }));
      return notification;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create notification'
      }));
      throw error;
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback((notificationId: string) => {
    try {
      const success = notificationEngine.markAsRead(notificationId);
      if (success) {
        setState(prev => ({
          ...prev,
          notifications: notificationEngine.getAllNotifications(),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark as read'
      }));
      return false;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    try {
      const count = notificationEngine.markAllAsRead();
      setState(prev => ({
        ...prev,
        notifications: notificationEngine.getAllNotifications(),
        error: null
      }));
      return count;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark all as read'
      }));
      return 0;
    }
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    try {
      const success = notificationEngine.dismissNotification(notificationId);
      if (success) {
        setState(prev => ({
          ...prev,
          notifications: notificationEngine.getAllNotifications(),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to dismiss notification'
      }));
      return false;
    }
  }, []);

  // Archive notification
  const archiveNotification = useCallback((notificationId: string) => {
    try {
      const success = notificationEngine.archiveNotification(notificationId);
      if (success) {
        setState(prev => ({
          ...prev,
          notifications: notificationEngine.getAllNotifications(),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to archive notification'
      }));
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    try {
      const success = notificationEngine.deleteNotification(notificationId);
      if (success) {
        setState(prev => ({
          ...prev,
          notifications: notificationEngine.getAllNotifications(),
          selectedNotifications: prev.selectedNotifications.filter(id => id !== notificationId),
          error: null
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete notification'
      }));
      return false;
    }
  }, []);

  // Bulk operations
  const bulkOperation = useCallback((operation: NotificationBulkOperation) => {
    try {
      let count = 0;
      
      switch (operation.type) {
        case 'read':
          count = notificationEngine.bulkMarkAsRead(operation.notificationIds);
          break;
        case 'dismiss':
          count = notificationEngine.bulkDismiss(operation.notificationIds);
          break;
        case 'archive':
          count = notificationEngine.bulkArchive(operation.notificationIds);
          break;
        case 'delete':
          count = notificationEngine.bulkDelete(operation.notificationIds);
          break;
      }

      setState(prev => ({
        ...prev,
        notifications: notificationEngine.getAllNotifications(),
        selectedNotifications: operation.type === 'delete' ? [] : prev.selectedNotifications,
        error: null
      }));

      return count;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to perform bulk operation'
      }));
      return 0;
    }
  }, []);

  // Search notifications
  const searchNotifications = useCallback((query: string) => {
    return notificationEngine.searchNotifications(query);
  }, []);

  // Get filtered notifications
  const getFilteredNotifications = useCallback(() => {
    let filtered = notificationEngine.filterNotifications(state.filter);

    // Apply search if present
    if (state.filter.searchQuery) {
      filtered = notificationEngine.searchNotifications(state.filter.searchQuery);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (state.sortBy) {
        case 'timestamp':
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return state.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return state.sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [state.filter, state.sortBy, state.sortOrder]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notificationEngine.getUnreadNotifications();
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notificationEngine.getNotificationsByType(type);
  }, []);

  // Get notification stats
  const getNotificationStats = useCallback((): NotificationStats => {
    return notificationEngine.getNotificationStats();
  }, []);

  // Update settings
  const updateSettings = useCallback((settings: Partial<NotificationSettings>) => {
    try {
      notificationEngine.updateSettings(settings);
      setState(prev => ({
        ...prev,
        settings: notificationEngine.getSettings(),
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update settings'
      }));
    }
  }, []);

  // Create rule
  const createRule = useCallback((rule: Omit<NotificationRule, 'id' | 'createdAt'>) => {
    try {
      const newRule = notificationEngine.createRule(rule);
      setState(prev => ({
        ...prev,
        error: null
      }));
      return newRule;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create rule'
      }));
      throw error;
    }
  }, []);

  // Export notifications
  const exportNotifications = useCallback(() => {
    return notificationEngine.exportNotifications();
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    try {
      const count = notificationEngine.clearAllNotifications();
      setState(prev => ({
        ...prev,
        notifications: [],
        selectedNotifications: [],
        error: null
      }));
      return count;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear notifications'
      }));
      return 0;
    }
  }, []);

  // Clear old notifications
  const clearOldNotifications = useCallback((olderThanDays: number = 30) => {
    try {
      const count = notificationEngine.clearOldNotifications(olderThanDays);
      setState(prev => ({
        ...prev,
        notifications: notificationEngine.getAllNotifications(),
        error: null
      }));
      return count;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear old notifications'
      }));
      return 0;
    }
  }, []);

  // Set filter
  const setFilter = useCallback((filter: NotificationFilter) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  // Set sort
  const setSort = useCallback((sortBy: 'timestamp' | 'priority' | 'type', sortOrder: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  // Set selected notifications
  const setSelectedNotifications = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, selectedNotifications: ids }));
  }, []);

  // Select all visible notifications
  const selectAllVisible = useCallback(() => {
    const visible = getFilteredNotifications();
    setState(prev => ({ 
      ...prev, 
      selectedNotifications: visible.map(n => n.id) 
    }));
  }, [getFilteredNotifications]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedNotifications: [] }));
  }, []);

  // Helper functions for quick access
  const createAlert = useCallback((title: string, message: string, data?: any) => {
    return createNotification('alerts', title, message, data, 'medium');
  }, [createNotification]);

  const createSignal = useCallback((title: string, message: string, data?: any) => {
    return createNotification('signals', title, message, data, 'medium');
  }, [createNotification]);

  const createGPTNotification = useCallback((title: string, message: string, data?: any) => {
    return createNotification('gpt', title, message, data, 'low');
  }, [createNotification]);

  const createSystemNotification = useCallback((title: string, message: string, data?: any) => {
    return createNotification('system', title, message, data, 'low');
  }, [createNotification]);

  const createTradingNotification = useCallback((title: string, message: string, data?: any) => {
    return createNotification('trading', title, message, data, 'high');
  }, [createNotification]);

  return {
    // State
    notifications: state.notifications,
    filteredNotifications: getFilteredNotifications(),
    unreadNotifications: getUnreadNotifications(),
    settings: state.settings,
    selectedNotifications: state.selectedNotifications,
    filter: state.filter,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    createNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    archiveNotification,
    deleteNotification,
    bulkOperation,
    searchNotifications,
    getNotificationsByType,
    getNotificationStats,
    updateSettings,
    createRule,
    exportNotifications,
    clearAllNotifications,
    clearOldNotifications,
    setFilter,
    setSort,
    setSelectedNotifications,
    selectAllVisible,
    clearSelection,

    // Helper functions
    createAlert,
    createSignal,
    createGPTNotification,
    createSystemNotification,
    createTradingNotification
  };
} 