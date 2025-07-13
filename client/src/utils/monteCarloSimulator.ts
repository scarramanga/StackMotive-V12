// Block 103 Implementation
import { InterpretedSignal } from '../hooks/useSignalInterpreter';
import { UserStrategy } from '../hooks/useStrategyOverlay';

export interface SimulationConfig {
  startingValue: number;
  interpretedSignals: InterpretedSignal[];
  strategy: UserStrategy;
  periods: number;
  runs: number;
  vaultId?: string;
  seed?: number;
}

export interface MonteCarloResult {
  valuePaths: number[][];
  meanReturn: number;
  stdDev: number;
  percentile5: number;
  percentile95: number;
  timestamp: string;
  vaultId?: string;
  metadata: Record<string, any>;
}

// Deterministic seeded PRNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedReturn(signals: InterpretedSignal[], strategy: UserStrategy): number {
  // Aggregate confidence-weighted return, penalize/exclude by strategy
  let total = 0;
  let weight = 0;
  for (const s of signals) {
    if (strategy.minConfidence && s.confidence < strategy.minConfidence) continue;
    if (strategy.assetFilters && strategy.assetFilters.length > 0 && !strategy.assetFilters.includes(s.asset)) continue;
    if (strategy.exclusions && strategy.exclusions.includes(s.asset)) continue;
    // Macro/news: treat as drift, technical: treat as volatility
    let base = 0;
    if (s.type === 'macro') base = 0.0005 * s.confidence; // macro: small drift
    else if (s.type === 'news') base = 0.001 * s.confidence; // news: medium drift
    else if (s.type === 'technical') base = 0.002 * s.confidence; // technical: higher drift
    total += base;
    weight += s.confidence;
  }
  return weight > 0 ? total / weight : 0;
}

export function runMonteCarloSimulation(config: SimulationConfig): MonteCarloResult {
  // Block 103 Implementation
  const {
    startingValue,
    interpretedSignals,
    strategy,
    periods,
    runs,
    vaultId,
    seed = 42,
  } = config;
  const prng = mulberry32(seed);
  const valuePaths: number[][] = [];
  const drift = weightedReturn(interpretedSignals, strategy); // mean step return
  const volatility = 0.015; // fixed for now, could be signal-driven

  for (let r = 0; r < runs; r++) {
    let path = [startingValue];
    for (let t = 1; t <= periods; t++) {
      // Geometric Brownian Motion: S_t+1 = S_t * exp((mu - 0.5*sigma^2) + sigma*Z)
      const Z = (prng() * 2 - 1); // [-1, 1]
      const mu = drift;
      const sigma = volatility;
      const prev = path[path.length - 1];
      const next = prev * Math.exp(mu - 0.5 * sigma * sigma + sigma * Z);
      path.push(next);
    }
    valuePaths.push(path);
  }

  // Compute summary stats
  const finalValues = valuePaths.map(p => p[p.length - 1]);
  const meanReturn = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
  const stdDev = Math.sqrt(finalValues.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / finalValues.length);
  const sorted = [...finalValues].sort((a, b) => a - b);
  const percentile = (p: number) => {
    const idx = Math.floor(p * sorted.length);
    return sorted[Math.min(idx, sorted.length - 1)];
  };
  const percentile5 = percentile(0.05);
  const percentile95 = percentile(0.95);

  return {
    valuePaths,
    meanReturn,
    stdDev,
    percentile5,
    percentile95,
    timestamp: new Date().toISOString(),
    vaultId,
    metadata: {
      runs,
      periods,
      startingValue,
      drift,
      volatility,
      strategy,
      signalCount: interpretedSignals.length,
    },
  };
} 