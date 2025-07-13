import { useEffect, useState } from 'react';

export interface VaultAssetInput {
  asset: string;
  quantity: number;
}

export interface MacroContextInput {
  market: string;
  trend: string;
}

export interface StrategyResponse {
  summary: string;
  recommendations: { asset: string; action: 'buy' | 'sell' | 'hold'; percentage: number }[];
  confidence: number;
}

export function useStrategyAgent({
  vaultAssets,
  macroContext,
  selectedStrategy,
}: {
  vaultAssets: VaultAssetInput[];
  macroContext: MacroContextInput;
  selectedStrategy: string;
}) {
  const [response, setResponse] = useState<StrategyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    // Simulate async GPT call
    const timeout = setTimeout(() => {
      // Mock logic: generate plausible response
      if (!vaultAssets.length) {
        setError('No assets in vault.');
        setIsLoading(false);
        return;
      }
      setResponse({
        summary: `Based on the ${selectedStrategy} strategy and current ${macroContext.market} (${macroContext.trend}), the portfolio is well positioned. Consider minor rebalancing for optimal risk/reward.`,
        recommendations: vaultAssets.map(a => ({
          asset: a.asset,
          action: a.quantity > 1 ? 'hold' : 'buy',
          percentage: Math.round(100 / vaultAssets.length),
        })),
        confidence: 0.82,
      });
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [vaultAssets, macroContext, selectedStrategy]);

  return { response, isLoading, error };
} 