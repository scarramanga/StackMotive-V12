// Block 26: Notification Center
import create from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'macro' | 'rebalance' | 'performance' | 'custom' | 'signal' | 'watchlist';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: string;
  read: boolean;
  severity: NotificationSeverity;
  source?: string;
}

interface NotificationState {
  notifications: Notification[];
  pushNotification: (n: Notification) => void;
  clearNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  digestMode: boolean;
  setDigestMode: (digest: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      pushNotification: (n) => set((state) => ({ notifications: [n, ...state.notifications] })),
      clearNotification: (id) => set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) })),
      markAsRead: (id) => set((state) => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
      digestMode: false,
      setDigestMode: (digest) => set({ digestMode: digest }),
    }),
    { name: 'notification-store', partialize: (state) => ({ notifications: state.notifications, digestMode: state.digestMode }) }
  )
); 