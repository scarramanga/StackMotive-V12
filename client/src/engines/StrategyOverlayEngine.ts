// Block 2: Strategy Overlay Engine
// Pure, composable overlay engine for user portfolios
import type { VaultBelief } from '@/utils/vault';
import type { Signal } from '@/utils/scoreSignals';
import { useSentimentOverlay } from '../hooks/useSentimentOverlay';
import { useUserPreferencesStore } from '../store/userPreferences';

export type UserIntent = 'growth' | 'stability' | 'autonomy';
export interface MarketSentiment {
  [symbol: string]: number; // -1 (bearish) to 1 (bullish)
}

export interface OverlaySuggestion {
  asset: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-1
  rationale: string;
  discrepancy: boolean;
}

interface GenerateStrategyOverlayArgs {
  signals: Signal[];
  userIntent: UserIntent;
  marketSentiment: MarketSentiment;
  vaultBeliefs: VaultBelief[];
}

export function generateStrategyOverlay({ signals, userIntent, marketSentiment, vaultBeliefs }: GenerateStrategyOverlayArgs): OverlaySuggestion[] {
  // Group signals by asset
  const byAsset: Record<string, Signal[]> = {};
  for (const s of signals) {
    if (!byAsset[s.symbol]) byAsset[s.symbol] = [];
    byAsset[s.symbol].push(s);
  }
  // Get autoTrimEnabled from Zustand
  const autoTrimEnabled = typeof window !== 'undefined' ? useUserPreferencesStore.getState().autoTrimEnabled : false;
  // Example target allocations (in real app, fetch from user config or portfolio)
  const targetAllocations: Record<string, number> = {
    BTC: 0.25, // 25%
    ETH: 0.15,
    SOL: 0.10,
    // ...
  };
  // Example current allocations (in real app, fetch from portfolio state)
  const currentAllocations: Record<string, number> = {
    BTC: 0.32, // 32%
    ETH: 0.14,
    SOL: 0.13,
    // ...
  };
  return Object.keys(byAsset).map(asset => {
    const assetSignals = byAsset[asset];
    // Aggregate confidence
    const avgConfidence = assetSignals.reduce((sum, s) => sum + s.confidence, 0) / assetSignals.length;
    // Cross-validation: count unique actions
    const actionCounts = assetSignals.reduce((acc, s) => { acc[s.action] = (acc[s.action] || 0) + 1; return acc; }, {} as Record<string, number>);
    const mostCommonAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'hold';
    const disagreeCount = assetSignals.length - (actionCounts[mostCommonAction] || 0);
    let crossValidatedConfidence = avgConfidence;
    let discrepancy = false;
    if (disagreeCount >= 2) {
      crossValidatedConfidence = avgConfidence * 0.6; // reduce by 40%
      discrepancy = true;
    }
    // Market sentiment adjustment
    const sentiment = marketSentiment[asset] ?? 0;
    // Vault belief adjustment (mock: +0.1 if strong belief)
    const strongBelief = vaultBeliefs.find(b => b.statement.toLowerCase().includes(asset.toLowerCase()) && b.confidence >= 4);
    let confidence = crossValidatedConfidence;
    if (sentiment) confidence += 0.1 * sentiment;
    if (strongBelief) confidence += 0.1;
    confidence = Math.max(0, Math.min(1, confidence));
    // User intent adjustment
    let action: 'buy' | 'sell' | 'hold' = mostCommonAction as any;
    if (confidence > 0.7) action = 'buy';
    else if (confidence < 0.3) action = 'sell';
    // Auto-trim logic
    let rationale = `Avg signal confidence: ${avgConfidence.toFixed(2)}`;
    if (discrepancy) rationale += ', Discrepancy: overlays disagree';
    if (sentiment) rationale += `, Market sentiment: ${sentiment > 0 ? 'bullish' : 'bearish'}`;
    if (strongBelief) rationale += ', Strong vault conviction';
    rationale += `, User intent: ${userIntent}`;
    if (autoTrimEnabled && targetAllocations[asset] && currentAllocations[asset] > targetAllocations[asset] * 1.1) {
      action = 'sell';
      rationale += `, Auto-Trim: ${asset} exceeds target allocation (${(currentAllocations[asset]*100).toFixed(1)}% > ${(targetAllocations[asset]*100).toFixed(1)}%)`;
    }
    // Use sentiment overlay
    const { refinedSentiment, overlayWeights, logs } = useSentimentOverlay({ symbol: asset, overlays: [asset] });
    // Adjust overlay weights using overlayWeights
    // Log logs for audit
    return { asset, action, confidence, rationale, discrepancy };
  });
} 