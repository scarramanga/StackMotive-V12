// Block 60: Agent Confidence Meter
export interface AgentConfidenceResult {
  score: number; // 0-100
  rationale: string;
  breakdown: {
    signalStrength: number;
    backtestScore: number;
    marketClarity: number;
  };
}

/**
 * Calculates agent confidence score (0-100) based on signal strength, backtest performance, and market clarity.
 * @param signalStrength (0-1)
 * @param backtestScore (0-1)
 * @param marketClarity (0-1)
 */
export function calculateAgentConfidence({
  signalStrength,
  backtestScore,
  marketClarity,
}: {
  signalStrength: number;
  backtestScore: number;
  marketClarity: number;
}): AgentConfidenceResult {
  // Weighted sum
  const score = Math.round(
    signalStrength * 100 * 0.5 +
    backtestScore * 100 * 0.3 +
    marketClarity * 100 * 0.2
  );
  const rationale = `Signal: ${(signalStrength*100).toFixed(0)}%, Backtest: ${(backtestScore*100).toFixed(0)}%, Market: ${(marketClarity*100).toFixed(0)}%`;
  return {
    score,
    rationale,
    breakdown: {
      signalStrength,
      backtestScore,
      marketClarity,
    },
  };
} 