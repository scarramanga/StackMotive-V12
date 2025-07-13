import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../../store/notifications';

// Block 26: Notification Center
export const Snackbar: React.FC = () => {
  const { notifications, clearNotification } = useNotificationStore();
  const [visible, setVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    // Find the latest error/warning notification
    const critical = notifications.find(n => !n.read && (n.severity === 'error' || n.severity === 'warning'));
    if (critical) {
      setSnackbar({ id: critical.id, message: critical.message });
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        clearNotification(critical.id);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setSnackbar(null);
    }
  }, [notifications, clearNotification]);

  if (!visible || !snackbar) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-destructive text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in cursor-pointer"
      role="alert"
      aria-live="assertive"
      tabIndex={0}
      onClick={() => {
        setVisible(false);
        clearNotification(snackbar.id);
      }}
    >
      <span className="font-bold">Alert:</span>
      <span>{snackbar.message}</span>
      <span className="ml-2 text-xs opacity-70">(Tap to dismiss)</span>
    </div>
  );
}; 