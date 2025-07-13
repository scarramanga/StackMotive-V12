// Block 42: Asset Replacement Suggestion
export interface AssetPerformanceLog {
  symbol: string;
  cagr: number;
  drawdown: number;
  volatility: number;
  period: string;
}

export interface WatchlistCandidate {
  symbol: string;
  name: string;
  signalScore: number;
  alignmentScore: number;
}

export interface AllocationRule {
  min: number;
  max: number;
  preferred: number;
}

export interface StrategyOverlay {
  symbol: string;
  weight: number;
}

export interface AssetSwapSuggestion {
  replace: string;
  with: string;
  confidence: number;
  rationale: {
    keep: string;
    replace: string;
  };
  allocationPreview: {
    old: StrategyOverlay[];
    new: StrategyOverlay[];
  };
}

export function suggestAssetSwap(
  underperforming: AssetPerformanceLog,
  watchlist: WatchlistCandidate[],
  allocationRules: Record<string, AllocationRule>,
  overlays: StrategyOverlay[]
): AssetSwapSuggestion | null {
  // Find best candidate
  const candidates = watchlist.filter(c => c.signalScore > 0.6 && c.alignmentScore > 0.6);
  if (candidates.length === 0) return null;
  const best = candidates.reduce((a, b) => (a.signalScore + a.alignmentScore > b.signalScore + b.alignmentScore ? a : b));
  // Confidence: weighted by candidate scores and underperformance severity
  const underperfSeverity = Math.max(0, (0.1 - underperforming.cagr) + underperforming.drawdown);
  const confidence = Math.min(1, 0.5 * (best.signalScore + best.alignmentScore) + 0.5 * underperfSeverity);
  // Rationale
  const keepRationale = `Current asset (${underperforming.symbol}) has CAGR ${(underperforming.cagr*100).toFixed(2)}%, drawdown ${(underperforming.drawdown*100).toFixed(2)}%.`;
  const replaceRationale = `Candidate (${best.symbol}) has higher signal (${(best.signalScore*100).toFixed(1)}%) and alignment (${(best.alignmentScore*100).toFixed(1)}%).`;
  // Allocation preview
  const oldAlloc = overlays;
  const newAlloc = overlays.map(o =>
    o.symbol === underperforming.symbol
      ? { ...o, symbol: best.symbol, weight: allocationRules[best.symbol]?.preferred || o.weight }
      : o
  );
  return {
    replace: underperforming.symbol,
    with: best.symbol,
    confidence,
    rationale: { keep: keepRationale, replace: replaceRationale },
    allocationPreview: { old: oldAlloc, new: newAlloc },
  };
} 