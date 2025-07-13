// Block 40: Watchlist AI Evaluation
export interface WatchlistAsset {
  symbol: string;
  name: string;
  signalStrength: number; // 0-1
  sentiment: number; // -1 (bearish) to 1 (bullish)
}

export interface UserStrategyIntent {
  goal: string;
  risk: 'low' | 'medium' | 'high';
  focusAssets?: string[];
}

export interface WatchlistEvaluationResult {
  symbol: string;
  name: string;
  alignmentScore: number; // 0-1
  rationale: string;
  suggestion: 'add' | 'swap' | 'hold' | 'remove';
}

export function evaluateWatchlist(
  assets: WatchlistAsset[],
  userIntent: UserStrategyIntent
): WatchlistEvaluationResult[] {
  // Simple AI logic: score by signal, sentiment, and intent alignment
  return assets.map(asset => {
    let alignment = 0.5 * asset.signalStrength + 0.3 * ((asset.sentiment + 1) / 2);
    if (userIntent.focusAssets && userIntent.focusAssets.includes(asset.symbol)) alignment += 0.2;
    if (userIntent.risk === 'low' && asset.signalStrength > 0.8) alignment += 0.1;
    if (userIntent.risk === 'high' && asset.signalStrength < 0.3) alignment -= 0.1;
    alignment = Math.max(0, Math.min(1, alignment));
    let suggestion: 'add' | 'swap' | 'hold' | 'remove' = 'hold';
    let rationale = '';
    if (alignment > 0.8) {
      suggestion = 'add';
      rationale = 'Strong fit for your strategy and positive signals.';
    } else if (alignment < 0.3) {
      suggestion = 'remove';
      rationale = 'Weak fit or negative signals; consider removing.';
    } else if (alignment < 0.5) {
      suggestion = 'swap';
      rationale = 'Below average fit; consider swapping for a better-aligned asset.';
    } else {
      suggestion = 'hold';
      rationale = 'Moderate fit; hold unless better options arise.';
    }
    return {
      symbol: asset.symbol,
      name: asset.name,
      alignmentScore: alignment,
      rationale,
      suggestion,
    };
  }).sort((a, b) => b.alignmentScore - a.alignmentScore);
} 