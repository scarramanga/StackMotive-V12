// Block 38: Real Asset Tracker
import { useState, useEffect } from 'react';
import { getMarketPriceHistory } from '../api/marketData';

export interface RealAsset {
  symbol: string;
  name: string;
  type: 'commodity' | 'property' | 'etf' | 'other';
  allocation: number; // percent of portfolio
  userIntent?: string;
}

export interface RealAssetPerformance {
  symbol: string;
  name: string;
  prices: number[];
  dates: string[];
  returns: number[];
}

export function useRealAssetTracker(assets: RealAsset[]) {
  const [performance, setPerformance] = useState<RealAssetPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      try {
        const results: RealAssetPerformance[] = [];
        for (const asset of assets) {
          const { prices, dates } = await getMarketPriceHistory(asset.symbol);
          const returns = prices.map((p: number, i: number, arr: number[]) => i === 0 ? 0 : (p - arr[i - 1]) / arr[i - 1]);
          results.push({ symbol: asset.symbol, name: asset.name, prices, dates, returns });
        }
        if (!ignore) setPerformance(results);
      } catch (e: any) {
        if (!ignore) setError(e.message || 'Failed to fetch real asset data');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [assets]);

  return { performance, loading, error };
} 