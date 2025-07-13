// Block 31: Portfolio Health Score (auto-recalc hook)
import { useEffect } from 'react';
import { usePortfolioHealthStore, PortfolioHealthState } from '../store/portfolioHealth';

export function usePortfolioHealthAutoRecalc({ assets, weights, history, volatility, correlationMatrix, overlays, rebalanceData, prevScores }: any) {
  const recalculateHealthScore = usePortfolioHealthStore((s: PortfolioHealthState) => s.recalculateHealthScore);
  useEffect(() => {
    recalculateHealthScore({ assets, weights, history, volatility, correlationMatrix, overlays, rebalanceData, prevScores });
  }, [assets, weights, history, volatility, correlationMatrix, overlays, rebalanceData, prevScores, recalculateHealthScore]);
} 