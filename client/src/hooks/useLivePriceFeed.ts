// Block 28 Implementation: useLivePriceFeed hook
import { useEffect, useRef, useState } from 'react';

interface PriceFeed {
  price: number;
  change: number;
  percentChange: number;
  timestamp: string;
}

const INITIAL_PRICES: Record<string, number> = {
  BTC: 68000,
  ETH: 3800,
  TSLA: 180,
  NVDA: 120,
  AAPL: 190,
};

export function useLivePriceFeed(assetSymbol: string, intervalMs: number = 5000): PriceFeed {
  const [state, setState] = useState<PriceFeed>(() => {
    const price = INITIAL_PRICES[assetSymbol] || 100;
    return {
      price,
      change: 0,
      percentChange: 0,
      timestamp: new Date().toISOString(),
    };
  });
  const lastPrice = useRef(state.price);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      // Random walk
      const base = lastPrice.current;
      const delta = (Math.random() - 0.5) * (base * 0.01); // ±1%
      const newPrice = Math.max(0.01, base + delta);
      const change = newPrice - base;
      const percentChange = (change / base) * 100;
      if (mounted) {
        setState({
          price: newPrice,
          change,
          percentChange,
          timestamp: new Date().toISOString(),
        });
        lastPrice.current = newPrice;
      }
    }, intervalMs);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [assetSymbol, intervalMs]);

  return state;
}

