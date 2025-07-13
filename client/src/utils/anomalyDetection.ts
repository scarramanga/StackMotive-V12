import type { SignalLogEntry } from '../store/signalLog';

// Simple anomaly detection: highlight bursts (many signals in short time), repeated triggers, or outlier signalStrength
export function detectAnomalies(entries: SignalLogEntry[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  const bySymbol: Record<string, SignalLogEntry[]> = {};
  entries.forEach(e => {
    if (!bySymbol[e.symbol]) bySymbol[e.symbol] = [];
    bySymbol[e.symbol].push(e);
  });
  // Burst: >3 signals for same symbol in 10min
  for (const symbol in bySymbol) {
    const sorted = bySymbol[symbol].sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
    for (let i = 0; i < sorted.length; i++) {
      let burst = 0;
      for (let j = i - 2; j <= i; j++) {
        if (j >= 0 && new Date(sorted[i].generatedAt).getTime() - new Date(sorted[j].generatedAt).getTime() <= 10 * 60 * 1000) burst++;
      }
      if (burst >= 3) result[sorted[i].id] = true;
    }
  }
  // Repeated triggers: same trigger in <1hr
  const triggerMap: Record<string, number[]> = {};
  entries.forEach(e => {
    const trig = e.technicalIndicators?.trigger;
    if (!trig) return;
    if (!triggerMap[trig]) triggerMap[trig] = [];
    triggerMap[trig].push(new Date(e.generatedAt).getTime());
  });
  for (const trig in triggerMap) {
    const times = triggerMap[trig].sort();
    for (let i = 1; i < times.length; i++) {
      if (times[i] - times[i - 1] < 60 * 60 * 1000) {
        const entry = entries.find(e => e.technicalIndicators?.trigger === trig && new Date(e.generatedAt).getTime() === times[i]);
        if (entry) result[entry.id] = true;
      }
    }
  }
  // Outlier signalStrength: >2 std dev from mean
  const strengths = entries.map(e => e.signalStrength).filter(x => typeof x === 'number') as number[];
  if (strengths.length > 2) {
    const mean = strengths.reduce((a, b) => a + b, 0) / strengths.length;
    const std = Math.sqrt(strengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / strengths.length);
    entries.forEach(e => {
      if (typeof e.signalStrength === 'number' && Math.abs(e.signalStrength - mean) > 2 * std) {
        result[e.id] = true;
      }
    });
  }
  return result;
} 