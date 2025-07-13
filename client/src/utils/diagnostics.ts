// Block 31: Portfolio Health Score
export interface PortfolioHealthBreakdown {
  diversification: number;
  drawdown: number;
  correlation: number;
  risk: number;
}
export interface PortfolioHealthResult {
  score: number; // 0-100
  breakdown: PortfolioHealthBreakdown;
  trend: number[];
}

export function calculatePortfolioHealth({
  assets,
  weights,
  history,
  volatility,
  correlationMatrix,
  overlays,
  rebalanceData,
  prevScores = [],
}: {
  assets: string[];
  weights: number[];
  history: { date: string; value: number }[];
  volatility: number;
  correlationMatrix: number[][];
  overlays: any[];
  rebalanceData: any;
  prevScores?: number[];
}): PortfolioHealthResult {
  // Diversification: higher is better (Shannon entropy of weights)
  const entropy = -weights.reduce((sum, w) => w > 0 ? sum + w * Math.log(w) : sum, 0);
  const maxEntropy = Math.log(weights.length);
  const diversification = maxEntropy > 0 ? Math.min(1, entropy / maxEntropy) : 0;

  // Drawdown: lower is better (max drawdown over history)
  let peak = -Infinity, maxDD = 0;
  history.forEach(h => {
    if (h.value > peak) peak = h.value;
    const dd = (peak - h.value) / (peak || 1);
    if (dd > maxDD) maxDD = dd;
  });
  const drawdown = 1 - Math.min(1, maxDD); // 1 is best, 0 is worst

  // Correlation: lower is better (average off-diagonal abs value)
  let corrSum = 0, corrCount = 0;
  for (let i = 0; i < correlationMatrix.length; i++) {
    for (let j = 0; j < correlationMatrix.length; j++) {
      if (i !== j) {
        corrSum += Math.abs(correlationMatrix[i][j]);
        corrCount++;
      }
    }
  }
  const avgCorr = corrCount ? corrSum / corrCount : 1;
  const correlation = 1 - Math.min(1, avgCorr); // 1 is best, 0 is worst

  // Risk: overlays and volatility (lower is better)
  const overlayRiskAdj = overlays.reduce((sum, o) => sum + (o.riskAdj || 0), 0);
  const risk = 1 - Math.min(1, (volatility + overlayRiskAdj) / 0.5); // assume 0.5 is high vol

  // Weighted sum
  const score = Math.round((diversification * 0.3 + drawdown * 0.3 + correlation * 0.2 + risk * 0.2) * 100);

  // Trend: append to prevScores
  const trend = [...prevScores, score].slice(-30);

  return {
    score,
    breakdown: { diversification, drawdown, correlation, risk },
    trend,
  };
} 