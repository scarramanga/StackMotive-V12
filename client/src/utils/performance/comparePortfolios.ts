// Block 36: Portfolio Comparison Tool
// Accepts two portfolio states with equityCurve: number[]

export interface PortfolioComparisonResult {
  cagrDelta: number;
  stdevDelta: number;
  trackingError: number;
  current: {
    cagr: number;
    stdev: number;
  };
  baseline: {
    cagr: number;
    stdev: number;
  };
}

function annualizedReturn(values: number[]): number {
  if (values.length < 2) return 0;
  const start = values[0];
  const end = values[values.length - 1];
  const years = (values.length - 1) / 252; // Assume daily data, 252 trading days/year
  return Math.pow(end / start, 1 / years) - 1;
}

function stdev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
}

function trackingError(current: number[], baseline: number[]): number {
  if (current.length !== baseline.length) return NaN;
  const diffs = current.map((v, i) => v - baseline[i]);
  return stdev(diffs);
}

export function comparePortfolios(
  current: { equityCurve: number[] },
  baseline: { equityCurve: number[] }
): PortfolioComparisonResult {
  const curCurve = current.equityCurve;
  const baseCurve = baseline.equityCurve;
  const curCAGR = annualizedReturn(curCurve);
  const baseCAGR = annualizedReturn(baseCurve);
  const curStdev = stdev(curCurve);
  const baseStdev = stdev(baseCurve);
  const tError = trackingError(curCurve, baseCurve);
  return {
    cagrDelta: curCAGR - baseCAGR,
    stdevDelta: curStdev - baseStdev,
    trackingError: tError,
    current: { cagr: curCAGR, stdev: curStdev },
    baseline: { cagr: baseCAGR, stdev: baseStdev },
  };
} 