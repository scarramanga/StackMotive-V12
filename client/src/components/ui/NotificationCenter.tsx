import React, { useState } from 'react';
import type { Notification } from '../../hooks/useNotificationCenter';

interface NotificationCenterProps {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, markAsRead, clearAll }) => {
  const [expanded, setExpanded] = useState(false);

  // Show up to 3 toasts if not expanded
  const visible = expanded ? notifications : notifications.slice(0, 3);

  return (
    <div className="fixed z-50 top-4 right-4 flex flex-col items-end gap-2">
      {visible.map(n => (
        <div
          key={n.id}
          className={`w-80 max-w-full rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 bg-white dark:bg-gray-900 border-l-4 transition-all ${
            n.type === 'macro' ? 'border-blue-500' : n.type === 'rebalance' ? 'border-green-500' : n.type === 'performance' ? 'border-yellow-500' : 'border-gray-400'
          } ${n.read ? 'opacity-60' : 'opacity-100'}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">
              {n.type.charAt(0).toUpperCase() + n.type.slice(1)} Alert
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-200 mb-1">{n.message}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <button
            className="ml-2 text-xs px-2 py-1 rounded bg-muted hover:bg-accent focus:outline-none focus:ring"
            onClick={() => markAsRead(n.id)}
            aria-label="Mark as read"
          >
            ✓
          </button>
        </div>
      ))}
      {notifications.length > 3 && !expanded && (
        <button
          className="mt-1 text-xs px-3 py-1 rounded bg-muted hover:bg-accent focus:outline-none focus:ring"
          onClick={() => setExpanded(true)}
        >
          Show all ({notifications.length})
        </button>
      )}
      {expanded && notifications.length > 0 && (
        <button
          className="mt-1 text-xs px-3 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/80 focus:outline-none focus:ring"
          onClick={clearAll}
        >
          Clear all
        </button>
      )}
    </div>
  );
}; 