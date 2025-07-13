import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'macro' | 'rebalance' | 'performance' | 'custom';
  message: string;
  timestamp: string;
  read: boolean;
}

export function useNotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'read' | 'timestamp'> & { id?: string; timestamp?: string; read?: boolean }) => {
    setNotifications(prev => [
      {
        id: notif.id || Math.random().toString(36).slice(2),
        type: notif.type,
        message: notif.message,
        timestamp: notif.timestamp || new Date().toISOString(),
        read: notif.read ?? false,
      },
      ...prev,
    ]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, addNotification, markAsRead, clearAll };
} 