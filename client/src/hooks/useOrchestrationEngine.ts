import { useState, useCallback } from 'react';

function mockFetch(url: string, opts?: any) {
  return new Promise<any>((resolve, reject) => {
    setTimeout(() => {
      if (url.includes('/portfolio')) {
        resolve([
          { symbol: 'BTC', name: 'Bitcoin', quantity: 0.5, avgPrice: 60000, currentPrice: 68000 },
          { symbol: 'ETH', name: 'Ethereum', quantity: 2, avgPrice: 3200, currentPrice: 3800 },
          { symbol: 'TSLA', name: 'Tesla', quantity: 10, avgPrice: 150, currentPrice: 180 },
        ]);
      } else if (url.includes('/signals')) {
        resolve([
          { asset: 'BTC', type: 'MACD', strength: 80, context: 'technical' },
          { asset: 'BTC', type: 'RSI', strength: 65, context: 'technical' },
          { asset: 'BTC', type: 'WhaleAlert', strength: 90, context: 'social' },
          { asset: 'ETH', type: 'VolumeSpike', strength: 70, context: 'macro' },
          { asset: 'ETH', type: 'RSI', strength: 55, context: 'technical' },
          { asset: 'TSLA', type: 'MACD', strength: 40, context: 'technical' },
        ]);
      } else if (url.includes('/preferences')) {
        if (opts && opts.method === 'POST') {
          resolve({ ...opts.body });
        } else {
          resolve({
            theme: 'system',
            dashboardLayout: 'default',
            aiToneBias: 'balanced',
            debugMode: false,
          });
        }
      } else {
        reject(new Error('Unknown endpoint'));
      }
    }, 400);
  });
}

export function useOrchestrationEngine() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockFetch('/api/mock/portfolio');
      setPortfolio(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockFetch('/api/mock/signals');
      setSignals(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockFetch('/api/mock/preferences');
      setPreferences(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchPortfolio();
    fetchSignals();
    fetchPreferences();
  }, [fetchPortfolio, fetchSignals, fetchPreferences]);

  return {
    portfolio,
    signals,
    preferences,
    error,
    loading,
    refresh,
    fetchPortfolio,
    fetchSignals,
    fetchPreferences,
  };
} 