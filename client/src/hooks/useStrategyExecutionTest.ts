// Block 103b Implementation
import { usePortfolio } from '../contexts/PortfolioContext';
import { useMemo } from 'react';

export interface Signal {
  asset: string;
  indicator?: string;
  value?: number;
  confidence: number;
  sentiment?: number;
  timestamp: string;
}

export interface StrategyConfig {
  stopLossPct?: number; // default -8%
  takeProfitPct?: number; // default +12%
  rebalanceThreshold?: number; // default 0.15 (15%)
}

export interface StrategyExecutionResult {
  asset: string;
  actionType: 'DCA' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'REBALANCE';
  confidence: number;
  reason: string;
  triggeredAt: string;
}

// Mocked portfolio balances for test (not persisted)
const MOCK_BALANCES: Record<string, number> = {
  BTC: 1.2,
  ETH: 10,
  TSLA: 50,
  AAPL: 30,
};
const MOCK_TARGET_ALLOC: Record<string, number> = {
  BTC: 0.4,
  ETH: 0.3,
  TSLA: 0.2,
  AAPL: 0.1,
};

export function useStrategyExecutionTest() {
  const { activeVaultId } = usePortfolio();

  function simulateStrategyExecution(
    signalSet: Signal[],
    config?: StrategyConfig
  ): StrategyExecutionResult[] {
    if (!activeVaultId) return [];
    const stopLossPct = config?.stopLossPct ?? -0.08;
    const takeProfitPct = config?.takeProfitPct ?? 0.12;
    const rebalanceThreshold = config?.rebalanceThreshold ?? 0.15;
    const results: StrategyExecutionResult[] = [];
    // DCA triggers
    for (const s of signalSet) {
      if (
        (s.indicator === 'MACD' && s.value !== undefined && s.value < 0) ||
        (s.indicator === 'RSI' && s.value !== undefined && s.value < 30) ||
        (s.indicator === 'NEWS' && s.sentiment !== undefined && s.sentiment < 0.3)
      ) {
        results.push({
          asset: s.asset,
          actionType: 'DCA',
          confidence: s.confidence,
          reason: `DCA triggered by ${s.indicator}`,
          triggeredAt: s.timestamp,
        });
      }
    }
    // Stop Loss / Take Profit
    for (const asset in MOCK_BALANCES) {
      const priceSignal = signalSet.find(s => s.asset === asset && s.indicator === 'PRICE');
      if (!priceSignal || priceSignal.value === undefined) continue;
      const entryPrice = 100; // Assume entry price for test
      const change = (priceSignal.value - entryPrice) / entryPrice;
      if (change <= stopLossPct) {
        results.push({
          asset,
          actionType: 'STOP_LOSS',
          confidence: priceSignal.confidence,
          reason: `Stop loss triggered at ${Math.round(change * 100)}%`,
          triggeredAt: priceSignal.timestamp,
        });
      } else if (change >= takeProfitPct) {
        results.push({
          asset,
          actionType: 'TAKE_PROFIT',
          confidence: priceSignal.confidence,
          reason: `Take profit triggered at ${Math.round(change * 100)}%`,
          triggeredAt: priceSignal.timestamp,
        });
      }
    }
    // Rebalancing
    const totalValue = Object.values(MOCK_BALANCES).reduce((a, b) => a + b, 0);
    for (const asset in MOCK_TARGET_ALLOC) {
      const target = MOCK_TARGET_ALLOC[asset];
      const actual = (MOCK_BALANCES[asset] ?? 0) / totalValue;
      if (Math.abs(actual - target) > rebalanceThreshold) {
        results.push({
          asset,
          actionType: 'REBALANCE',
          confidence: 1,
          reason: `Rebalance triggered: actual ${Math.round(actual * 100)}% vs target ${Math.round(target * 100)}%`,
          triggeredAt: new Date().toISOString(),
        });
      }
    }
    return results;
  }

  return useMemo(() => ({ simulateStrategyExecution }), [activeVaultId]);
}
// End Block 103b Implementation 