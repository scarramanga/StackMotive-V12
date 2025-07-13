import { useEffect, useRef, useState } from 'react';

// Get port from environment variable or use default
const WS_PORT = import.meta.env.VITE_WS_PORT || '5174';

export function useWebSocket(token: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Use environment variable port or fallback to window.location.port
    const port = WS_PORT || window.location.port;
    if (!port) {
      setError('WebSocket port not configured');
      return;
    }

    const wsUrl = `ws://${window.location.hostname}:${port}?token=${token}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection failed');
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setError('Failed to create WebSocket connection');
      setIsConnected(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    error,
    sendMessage
  };
} 