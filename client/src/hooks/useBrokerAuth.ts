import { useState } from 'react';

export function useBrokerAuth(brokerName: string) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      if (brokerName === 'fail') {
        setConnected(false);
        setError('Failed to connect (mock)');
      } else {
        setConnected(true);
        setError(null);
      }
      setLoading(false);
    }, 800);
  };

  return { connected, error, loading, connect };
} 