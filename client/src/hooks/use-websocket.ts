import { useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '@/lib/socket';
import { getAccessToken } from '@/lib/auth';

export function useNotificationsSocket(onNotification?: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef(false); // Track if we initiated connection

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('No authentication token available');
      return;
    }

    // Connect socket
    const socket = connectSocket(token);
    socketRef.current = true;

    // Setup event handlers
    const handleConnect = () => {
      console.log('Socket.IO connected');
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
    };

    const handleError = (err: any) => {
      console.error('Socket.IO error:', err);
      setError('Socket connection failed');
      setIsConnected(false);
    };

    const handleNotification = (data: any) => {
      console.log('Received notification:', data);
      if (onNotification) {
        onNotification(data);
      }
    };

    // Register listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);
    socket.on('notification', handleNotification);

    // If already connected, update state
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      // Remove listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      socket.off('notification', handleNotification);
      
      // Only disconnect if we initiated the connection
      if (socketRef.current) {
        // Don't disconnect here - let the socket persist for other uses
        // disconnectSocket();
      }
    };
  }, [onNotification]);

  return {
    isConnected,
    error,
  };
}

// Backward compatibility - export the original hook signature if needed
export function useWebSocket(token: string) {
  return useNotificationsSocket();
}
