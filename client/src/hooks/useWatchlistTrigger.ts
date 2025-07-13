// Block 6: useWatchlistTrigger Hook
import { useEffect, useState } from 'react';
import { useSessionStore } from '../store/session';
import { checkWatchlistTriggers } from '../engines/WatchlistTriggerEngine';
import type { WatchlistConfig, WatchlistAlert } from '../types/watchlist';

async function fetchWatchlist(): Promise<WatchlistConfig[]> {
  // TODO: Replace with real backend call
  return [];
}

async function fetchLiveData(symbols: string[]): Promise<Record<string, any>> {
  // TODO: Replace with real backend call
  return {};
}

export function useWatchlistTrigger() {
  const user = useSessionStore(s => s.user);
  const [configs, setConfigs] = useState<WatchlistConfig[]>([]);
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const isPremium = user?.isPremium;

  useEffect(() => {
    if (!isPremium) return;
    setLoading(true);
    fetchWatchlist().then(setConfigs).finally(() => setLoading(false));
  }, [isPremium]);

  useEffect(() => {
    if (!isPremium || configs.length === 0) return;
    const poll = async () => {
      const symbols = configs.map(c => c.asset.symbol);
      const liveData = await fetchLiveData(symbols);
      const newAlerts = checkWatchlistTriggers({ configs, liveData });
      setAlerts(newAlerts);
    };
    poll();
    const interval = setInterval(poll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [configs, isPremium]);

  return { configs, alerts, loading };
} 