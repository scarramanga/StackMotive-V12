// Block 6: Watchlist Trigger Engine
import type { WatchlistConfig, WatchlistAlert } from '../types/watchlist';

interface CheckTriggersArgs {
  configs: WatchlistConfig[];
  liveData: Record<string, any>; // symbol -> data
}

export function checkWatchlistTriggers({ configs, liveData }: CheckTriggersArgs): WatchlistAlert[] {
  const alerts: WatchlistAlert[] = [];
  const now = new Date().toISOString();
  for (const config of configs) {
    const data = liveData[config.asset.symbol];
    if (!data) continue;
    for (const threshold of config.thresholds) {
      const value = data[threshold.type];
      if (value === undefined) continue;
      const triggered = threshold.direction === 'above' ? value > threshold.value : value < threshold.value;
      if (triggered) {
        alerts.push({
          id: `${config.asset.symbol}-${threshold.type}-${now}`,
          asset: config.asset.symbol,
          triggerType: threshold.type,
          signalStrength: Math.abs(value - threshold.value),
          suggestion: `Consider action: ${threshold.type} ${threshold.direction} ${threshold.value}`,
          timestamp: now,
          rationale: `Threshold ${threshold.type} ${threshold.direction} ${threshold.value} met (actual: ${value})`,
          dismissed: false,
          snoozed: false,
          notes: config.asset.notes,
        });
      }
    }
  }
  return alerts;
} 