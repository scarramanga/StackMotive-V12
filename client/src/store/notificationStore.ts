// Block 33: Notification Center - Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Notification, 
  NotificationState, 
  NotificationSettings,
  NotificationFilter,
  NotificationRule,
  NotificationBulkOperation
} from '../types/notifications';
import { notificationEngine } from '../engines/NotificationEngine';

interface NotificationStore extends NotificationState {
  // Additional state
  unreadCount: number;
  lastCheck: Date | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshNotifications: () => void;
  
  // Notification management
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
  
  // Bulk operations
  bulkMarkAsRead: (ids: string[]) => number;
  bulkDismiss: (ids: string[]) => number;
  bulkArchive: (ids: string[]) => number;
  bulkDelete: (ids: string[]) => number;
  
  // Filtering and search
  setFilter: (filter: NotificationFilter) => void;
  clearFilter: () => void;
  setSort: (sortBy: 'timestamp' | 'priority' | 'type', sortOrder: 'asc' | 'desc') => void;
  searchNotifications: (query: string) => Notification[];
  
  // Selection
  setSelectedNotifications: (ids: string[]) => void;
  selectAll: () => void;
  selectAllVisible: (filtered: Notification[]) => void;
  clearSelection: () => void;
  
  // Settings and rules
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  createRule: (rule: Omit<NotificationRule, 'id' | 'createdAt'>) => NotificationRule;
  
  // Cleanup
  clearAllNotifications: () => number;
  clearOldNotifications: (olderThanDays?: number) => number;
  
  // Utility
  getUnreadCount: () => number;
  updateUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      settings: {
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
      },
      rules: [],
      selectedNotifications: [],
      filter: {},
      sortBy: 'timestamp',
      sortOrder: 'desc',
      isLoading: false,
      error: null,
      unreadCount: 0,
      lastCheck: null,

      // Basic actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      refreshNotifications: () => {
        const notifications = notificationEngine.getAllNotifications();
        const unreadCount = notificationEngine.getUnreadNotifications().length;
        set({ 
          notifications,
          unreadCount,
          lastCheck: new Date()
        });
      },

      // Notification management
      createNotification: (type, title, message, data, priority = 'medium') => {
        try {
          const notification = notificationEngine.createNotification(type, title, message, data, priority);
          get().refreshNotifications();
          set({ error: null });
          return notification;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create notification' });
          throw error;
        }
      },

      markAsRead: (notificationId) => {
        try {
          const success = notificationEngine.markAsRead(notificationId);
          if (success) {
            get().refreshNotifications();
            set({ error: null });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to mark as read' });
          return false;
        }
      },

      markAllAsRead: () => {
        try {
          const count = notificationEngine.markAllAsRead();
          get().refreshNotifications();
          set({ error: null });
          return count;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to mark all as read' });
          return 0;
        }
      },

      dismissNotification: (notificationId) => {
        try {
          const success = notificationEngine.dismissNotification(notificationId);
          if (success) {
            get().refreshNotifications();
            set({ error: null });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to dismiss notification' });
          return false;
        }
      },

      archiveNotification: (notificationId) => {
        try {
          const success = notificationEngine.archiveNotification(notificationId);
          if (success) {
            get().refreshNotifications();
            set({ error: null });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to archive notification' });
          return false;
        }
      },

      deleteNotification: (notificationId) => {
        try {
          const success = notificationEngine.deleteNotification(notificationId);
          if (success) {
            const state = get();
            get().refreshNotifications();
            set({ 
              selectedNotifications: state.selectedNotifications.filter(id => id !== notificationId),
              error: null 
            });
          }
          return success;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete notification' });
          return false;
        }
      },

      // Bulk operations
      bulkMarkAsRead: (ids) => {
        try {
          const count = notificationEngine.bulkMarkAsRead(ids);
          get().refreshNotifications();
          set({ error: null });
          return count;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to bulk mark as read' });
          return 0;
        }
      },

      bulkDismiss: (ids) => {
        try {
          const count = notificationEngine.bulkDismiss(ids);
          get().refreshNotifications();
          set({ error: null });
          return count;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to bulk dismiss' });
          return 0;
        }
      },

      bulkArchive: (ids) => {
        try {
          const count = notificationEngine.bulkArchive(ids);
          get().refreshNotifications();
          set({ error: null });
          return count;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to bulk archive' });
          return 0;
        }
      },

      bulkDelete: (ids) => {
        try {
          const count = notificationEngine.bulkDelete(ids);
          get().refreshNotifications();
          set({ selectedNotifications: [], error: null });
          return count;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to bulk delete' });
          return 0;
        }
      },

      // Filtering and search
      setFilter: (filter) => set({ filter }),
      clearFilter: () => set({ filter: {} }),
      setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
      searchNotifications: (query) => {
        return notificationEngine.searchNotifications(query);
      },

      // Selection
      setSelectedNotifications: (ids) => set({ selectedNotifications: ids }),
      selectAll: () => {
        const notifications = get().notifications;
        set({ selectedNotifications: notifications.map(n => n.id) });
      },
      selectAllVisible: (filtered) => {
        set({ selectedNotifications: filtered.map(n => n.id) });
      },
      clearSelection: () => set({ selectedNotifications: [] }),

      // Settings and rules
      updateSettings: (settings) => {
        try {
          notificationEngine.updateSettings(settings);
          set({ 
            settings: notificationEngine.getSettings(),
            error: null 
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
        }
      },

      createRule: (rule) => {
        try {
          const newRule = notificationEngine.createRule(rule);
          const currentRules = get().rules;
          set({ 
            rules: [...currentRules, newRule],
            error: null 
          });
          return newRule;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create rule' });
          throw error;
        }
      },

      // Cleanup
      clearAllNotifications: () => {
        try {
          const count = notificationEngine.clearAllNotifications();
          set({ 
            notifications: [],
            selectedNotifications: [],
            unreadCount: 0,
            error: null 
          });
          return count;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to clear notifications' });
          return 0;
        }
      },

      clearOldNotifications: (olderThanDays = 30) => {
        try {
          const count = notificationEngine.clearOldNotifications(olderThanDays);
          get().refreshNotifications();
          set({ error: null });
          return count;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to clear old notifications' });
          return 0;
        }
      },

      // Utility
      getUnreadCount: () => {
        return notificationEngine.getUnreadNotifications().length;
      },

      updateUnreadCount: () => {
        const unreadCount = get().getUnreadCount();
        set({ unreadCount });
      }
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        settings: state.settings,
        selectedNotifications: state.selectedNotifications,
        filter: state.filter,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
); 