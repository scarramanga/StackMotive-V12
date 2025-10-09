// Block 31: Portfolio Health Score
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioHealthResult, PortfolioHealthBreakdown } from '../utils/diagnostics';
import { calculatePortfolioHealth } from '../utils/diagnostics';

export interface PortfolioHealthState {
  healthScore: number;
  breakdown: PortfolioHealthBreakdown;
  trend: number[];
  setHealthScore: (result: PortfolioHealthResult, onAutoRebalance?: () => void) => void;
  recalculateHealthScore: (params: Parameters<typeof calculatePortfolioHealth>[0], onAutoRebalance?: () => void) => void;
}

export const usePortfolioHealthStore = create<PortfolioHealthState>()(
  persist(
    (set) => ({
      healthScore: 100,
      breakdown: { diversification: 1, drawdown: 1, correlation: 1, risk: 1 },
      trend: [100],
      setHealthScore: (result: PortfolioHealthResult, onAutoRebalance?: () => void) => {
        set({ healthScore: result.score, breakdown: result.breakdown, trend: result.trend });
        if (result.score < 40 && onAutoRebalance) onAutoRebalance();
      },
      recalculateHealthScore: (params: Parameters<typeof calculatePortfolioHealth>[0], onAutoRebalance?: () => void) => {
        const result = calculatePortfolioHealth(params);
        set({ healthScore: result.score, breakdown: result.breakdown, trend: result.trend });
        if (result.score < 40 && onAutoRebalance) onAutoRebalance();
      },
    }),
    { name: 'portfolio-health' }
  )
);   