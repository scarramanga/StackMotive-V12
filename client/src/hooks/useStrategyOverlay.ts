// Block 100 Implementation

// Types from useSignalInterpreter
export type SignalType = 'macro' | 'news' | 'technical';

export interface InterpretedSignal {
  id: string;
  type: SignalType;
  asset: string;
  confidence: number; // 0-1, normalized and weighted
  timestamp: string;
  tags: string[];
  original: any;
}

export interface UserStrategy {
  riskPreference: 'low' | 'medium' | 'high';
  diversification: 'none' | 'basic' | 'broad';
  assetFilters?: string[]; // Only include these assets
  exclusions?: string[];   // Exclude these assets
  minConfidence?: number;  // Minimum confidence to consider
  maxAssetWeight?: number; // Max weight per asset (0-1)
}

export interface OverlayDecision {
  asset: string;
  action: 'buy' | 'sell' | 'hold';
  signalScore: number; // 0-1
  strategyAlignmentScore: number; // 0-1
  confidence: number; // 0-1
}

function getActionFromSignals(signals: InterpretedSignal[]): 'buy' | 'sell' | 'hold' {
  // Simple: majority vote by tags, fallback to hold
  let buy = 0, sell = 0, hold = 0;
  for (const s of signals) {
    if (s.tags.includes('buy')) buy++;
    else if (s.tags.includes('sell')) sell++;
    else if (s.tags.includes('hold')) hold++;
  }
  if (buy > sell && buy > hold) return 'buy';
  if (sell > buy && sell > hold) return 'sell';
  if (hold > buy && hold > sell) return 'hold';
  return 'hold';
}

function scoreStrategyAlignment(asset: string, strategy: UserStrategy): number {
  // Score 1.0 if asset is in filters and not in exclusions, else 0.5, else 0
  if (strategy.exclusions && strategy.exclusions.includes(asset)) return 0;
  if (strategy.assetFilters && strategy.assetFilters.length > 0) {
    return strategy.assetFilters.includes(asset) ? 1.0 : 0.5;
  }
  return 1.0;
}

function riskWeight(confidence: number, risk: UserStrategy['riskPreference']): number {
  // Low risk: penalize low confidence, high risk: boost high confidence
  if (risk === 'low') return confidence * 0.8;
  if (risk === 'high') return Math.min(1, confidence * 1.2);
  return confidence;
}

function diversificationWeight(asset: string, assetCount: number, strat: UserStrategy): number {
  // Penalize overweighting a single asset if diversification is broad
  if (strat.diversification === 'broad' && assetCount > 1) return 0.8;
  if (strat.diversification === 'basic' && assetCount > 2) return 0.9;
  return 1.0;
}

import { generateStrategyOverlay, UserIntent, MarketSentiment } from '../engines/StrategyOverlayEngine';
import type { VaultBelief } from '@/utils/vault';
import type { Signal } from '@/utils/scoreSignals';

export function useStrategyOverlay() {
  function getOverlaySuggestions(
    signals: Signal[],
    userIntent: UserIntent,
    marketSentiment: MarketSentiment,
    vaultBeliefs: VaultBelief[]
  ) {
    return generateStrategyOverlay({ signals, userIntent, marketSentiment, vaultBeliefs });
  }
  return { getOverlaySuggestions };
} 