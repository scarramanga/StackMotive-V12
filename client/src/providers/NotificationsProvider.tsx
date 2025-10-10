import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { connectSocket } from "@/lib/socket";
import { getAccessToken } from "@/lib/auth";
import { useNotifications, NotificationMessage } from "@/state/notifications";

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const messages = useNotifications((state) => state.messages);
  const push = useNotifications((state) => state.push);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    const newSocket = connectSocket(token);
    
    newSocket.on("notification", (msg: NotificationMessage) => {
      console.log("[NotificationsProvider] Received notification:", msg);
      push(msg);
    });

    newSocket.on("connect", () => {
      console.log("[NotificationsProvider] Socket.IO connected");
    });

    newSocket.on("disconnect", () => {
      console.log("[NotificationsProvider] Socket.IO disconnected");
    });

    newSocket.on("connect_error", (error: Error) => {
      console.error("[NotificationsProvider] Socket.IO connection error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [push]);

  return (
    <>
      {children}
      {messages[0] && (
        <div 
          data-testid="notification-toast" 
          className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="rounded-xl shadow-lg px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-sm">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{messages[0].title}</div>
            {messages[0].body && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{messages[0].body}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
