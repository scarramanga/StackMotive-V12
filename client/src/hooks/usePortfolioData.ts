import { useState, useEffect, useRef } from 'react';
import { getAccessToken } from '@/lib/auth';

interface Position {
  symbol: string;
  name?: string;
  assetclass?: string;
  quantity: number;
  price: number;
  market_value: number;
  cost_basis?: number;
  unrealized_pl?: number;
  unrealized_pl_pct?: number;
}

interface Totals {
  total_value: number;
  positions_count: number;
  unrealized_pl_pct: number;
  day_pl?: number;
}

interface PortfolioData {
  data: {
    positions: Position[];
  };
  totals: Totals;
  loading: boolean;
  error: string | null;
}

// In-memory cache
let cachedData: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export function usePortfolioData(): PortfolioData {
  const [data, setData] = useState<Position[]>([]);
  const [totals, setTotals] = useState<Totals>({
    total_value: 0,
    positions_count: 0,
    unrealized_pl_pct: 0,
    day_pl: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    async function fetchPortfolio() {
      // Check cache first
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        const normalized = normalizePortfolioData(cachedData.data);
        if (isMounted.current) {
          setData(normalized.positions);
          setTotals(normalized.totals);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = getAccessToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/portfolio', {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio: ${response.status} ${response.statusText}`);
        }

        const rawData = await response.json();
        
        // Cache the response
        cachedData = {
          data: rawData,
          timestamp: Date.now(),
        };

        const normalized = normalizePortfolioData(rawData);

        if (isMounted.current) {
          setData(normalized.positions);
          setTotals(normalized.totals);
          setError(null);
        }
      } catch (err) {
        console.error('Portfolio fetch error:', err);
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
          setData([]);
          setTotals({
            total_value: 0,
            positions_count: 0,
            unrealized_pl_pct: 0,
            day_pl: 0,
          });
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    fetchPortfolio();

    return () => {
      isMounted.current = false;
    };
  }, []);

  return { data: { positions: data }, totals, loading, error };
}

// Defensive mapping function to normalize backend response
function normalizePortfolioData(rawData: any): { positions: Position[]; totals: Totals } {
  // Handle different possible response structures
  let holdings: any[] = [];
  
  // Try different possible paths in the response
  if (Array.isArray(rawData)) {
    holdings = rawData;
  } else if (rawData.holdings && Array.isArray(rawData.holdings)) {
    holdings = rawData.holdings;
  } else if (rawData.positions && Array.isArray(rawData.positions)) {
    holdings = rawData.positions;
  } else if (rawData.data && Array.isArray(rawData.data)) {
    holdings = rawData.data;
  }

  // Map holdings to normalized Position format
  const positions: Position[] = holdings.map((holding: any) => {
    // Handle both camelCase (backend) and snake_case
    const symbol = holding.symbol || holding.Symbol || '';
    const name = holding.assetName || holding.asset_name || holding.name || '';
    const assetclass = holding.assetClass || holding.asset_class || holding.assetclass || '';
    const quantity = parseFloat(holding.quantity || holding.Quantity || 0);
    const price = parseFloat(holding.currentPrice || holding.current_price || holding.price || 0);
    const marketValue = parseFloat(holding.marketValue || holding.market_value || 0);
    const costBasis = parseFloat(holding.costBasis || holding.cost_basis || holding.averageCost || holding.average_cost || 0);
    const unrealizedPnl = parseFloat(holding.unrealizedPnl || holding.unrealized_pnl || holding.unrealized_pl || 0);
    const unrealizedPnlPercent = parseFloat(holding.unrealizedPnlPercent || holding.unrealized_pnl_percent || holding.unrealized_pl_pct || 0);

    return {
      symbol,
      name,
      assetclass,
      quantity,
      price,
      market_value: marketValue || (quantity * price),
      cost_basis: costBasis,
      unrealized_pl: unrealizedPnl,
      unrealized_pl_pct: unrealizedPnlPercent,
    };
  });

  // Calculate totals
  const total_value = positions.reduce((sum, p) => sum + p.market_value, 0);
  const positions_count = positions.length;
  
  // Calculate overall unrealized P&L %
  const total_cost = positions.reduce((sum, p) => sum + (p.cost_basis || 0), 0);
  const unrealized_pl_pct = total_cost > 0 
    ? ((total_value - total_cost) / total_cost) * 100 
    : 0;
  
  // Try to extract day P&L from response if available
  const day_pl = rawData.dayChangeValue || rawData.day_change_value || rawData.day_pl || 0;

  return {
    positions,
    totals: {
      total_value,
      positions_count,
      unrealized_pl_pct,
      day_pl: parseFloat(day_pl),
    },
  };
}

