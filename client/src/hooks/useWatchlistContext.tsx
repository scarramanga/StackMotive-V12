import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { validateTradeAgainstVault, Trade } from '../utils/vaultGuard';
import { getSupabaseClient } from '../lib/initSupabase';
import { useAuth } from '../contexts/AuthContext';

interface WatchlistContextType {
  watchlist: string[];
  add: (symbol: string) => void;
  remove: (symbol: string) => void;
  promoteToPortfolio: (symbol: string) => { valid: boolean; reason?: string };
  getAlerts: () => { symbol: string; type: 'signal' | 'vault'; message: string }[];
  getWeight: (symbol: string) => number;
  setWeight: (symbol: string, weight: number) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

const MOCK_SIGNALS = ['BTC', 'ETH'];
const MOCK_VAULT_BELIEFS = [
  { id: 'btc-sov-store', statement: 'BTC as sovereign store-of-value', confidence: 5 },
  { id: 'usd-debase', statement: 'USD debasement', confidence: 4 },
];

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const supabase = getSupabaseClient();
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('watchlist') : null;
    return stored ? JSON.parse(stored) : ['BTC', 'ETH', 'AAPL'];
  });
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('watchlistWeights') : null;
    return stored ? JSON.parse(stored) : {};
  });

  const getWeight = useCallback((symbol: string) => {
    return weights[symbol] ?? 0.5;
  }, [weights]);
  const setWeight = useCallback((symbol: string, weight: number) => {
    setWeights(w => {
      const newWeights = { ...w, [symbol]: Math.max(0, Math.min(1, weight)) };
      // Async update to Supabase
      if (user) {
        (async () => {
          await supabase.from('watchlist_weights').upsert({
            user_id: user.id,
            symbol,
            weight: newWeights[symbol],
            updated_at: new Date().toISOString(),
          });
          // Audit log
          await supabase.from('audit_log').insert({
            user_id: user.id,
            action: 'update_watchlist_weight',
            details: { symbol, weight: newWeights[symbol] },
            timestamp: new Date().toISOString(),
          });
        })();
      }
      return newWeights;
    });
  }, [user, supabase]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist]);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('watchlistWeights', JSON.stringify(weights));
    }
  }, [weights]);

  // On login, fetch weights from Supabase
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('watchlist_weights')
        .select('symbol,weight')
        .eq('user_id', user.id);
      if (!error && data) {
        const dbWeights: Record<string, number> = {};
        data.forEach((row: any) => { dbWeights[row.symbol] = row.weight; });
        setWeights(dbWeights);
      }
    })();
  }, [user]);

  const add = useCallback((symbol: string) => {
    setWatchlist(wl => wl.includes(symbol) ? wl : [...wl, symbol]);
  }, []);

  const remove = useCallback((symbol: string) => {
    setWatchlist(wl => wl.filter(s => s !== symbol));
  }, []);

  const promoteToPortfolio = useCallback((symbol: string) => {
    // Mock trade: always 'buy' 1 unit
    const trade: Trade = { symbol, action: 'buy', amount: 1 };
    const result = validateTradeAgainstVault(trade, MOCK_VAULT_BELIEFS);
    if (result.valid) {
      // eslint-disable-next-line no-console
      console.log(`[Block 43] Promoted ${symbol} to portfolio`);
    }
    return result;
  }, []);

  const getAlerts = useCallback(() => {
    // Mock: alert if symbol matches signal or vault
    return watchlist.flatMap(symbol => {
      const alerts = [] as { symbol: string; type: 'signal' | 'vault'; message: string }[];
      if (MOCK_SIGNALS.includes(symbol)) {
        alerts.push({ symbol, type: 'signal', message: `Signal detected for ${symbol}` });
      }
      if (MOCK_VAULT_BELIEFS.some(b => b.statement.toLowerCase().includes(symbol.toLowerCase()))) {
        alerts.push({ symbol, type: 'vault', message: `Vault alignment for ${symbol}` });
      }
      return alerts;
    });
  }, [watchlist]);

  return (
    <WatchlistContext.Provider value={{ watchlist, add, remove, promoteToPortfolio, getAlerts, getWeight, setWeight }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export function useWatchlistContext() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlistContext must be used within WatchlistProvider');
  return ctx;
} 