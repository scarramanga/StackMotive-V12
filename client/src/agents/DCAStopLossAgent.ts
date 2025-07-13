// Block 10: DCA & Stop-Loss Agent
import type { DCAConfig, StopLossConfig, DCAStopLossPrompt } from '../types/dcaStopLoss';

interface EvaluateArgs {
  dcaConfigs: DCAConfig[];
  stopLossConfigs: StopLossConfig[];
  priceData: Record<string, number>; // asset -> price
  volatility: Record<string, number>; // asset -> volatility index
  aiMomentum: Record<string, number>; // asset -> AI-predicted movement
  lastPrompts: Record<string, string>; // asset -> last prompt timestamp
  debounce: { dca: number; stopLoss: number }; // ms
}

export function evaluateDCAStopLoss({ dcaConfigs, stopLossConfigs, priceData, volatility, aiMomentum, lastPrompts, debounce }: EvaluateArgs): DCAStopLossPrompt[] {
  const now = Date.now();
  const prompts: DCAStopLossPrompt[] = [];
  // DCA
  for (const dca of dcaConfigs) {
    if (!dca.enabled || dca.paused) continue;
    const last = lastPrompts[`${dca.asset}-dca`] ? Number(lastPrompts[`${dca.asset}-dca`]) : 0;
    if (now - last < debounce.dca) continue;
    if (new Date(dca.nextBuy).getTime() > now) continue;
    prompts.push({
      id: `${dca.asset}-dca-${now}`,
      asset: dca.asset,
      type: 'dca',
      action: 'buy',
      rationale: `Scheduled DCA buy for ${dca.asset}.`,
      timestamp: new Date().toISOString(),
      snoozed: false,
      dismissed: false,
    });
  }
  // Stop-Loss
  for (const sl of stopLossConfigs) {
    if (!sl.enabled || sl.paused) continue;
    const last = lastPrompts[`${sl.asset}-stop-loss`] ? Number(lastPrompts[`${sl.asset}-stop-loss`]) : 0;
    if (now - last < debounce.stopLoss) continue;
    const price = priceData[sl.asset];
    if (price === undefined) continue;
    // Volatility/momentum filter
    const vol = volatility[sl.asset] || 0;
    const momentum = aiMomentum[sl.asset] || 0;
    if (vol > 2 && momentum > 0.5) continue; // avoid false triggers
    // Fixed or trailing
    // (For MVP, treat both as fixed; trailing logic can be added later)
    if (sl.global && price < (1 + sl.threshold / 100)) {
      prompts.push({
        id: `${sl.asset}-stop-loss-${now}`,
        asset: sl.asset,
        type: 'stop-loss',
        action: 'sell',
        rationale: `Stop-loss triggered for ${sl.asset} at threshold ${sl.threshold}%.`,
        timestamp: new Date().toISOString(),
        snoozed: false,
        dismissed: false,
      });
    } else if (!sl.global && price < (1 + sl.threshold / 100)) {
      prompts.push({
        id: `${sl.asset}-stop-loss-${now}`,
        asset: sl.asset,
        type: 'stop-loss',
        action: 'sell',
        rationale: `Stop-loss triggered for ${sl.asset} at threshold ${sl.threshold}%.`,
        timestamp: new Date().toISOString(),
        snoozed: false,
        dismissed: false,
      });
    }
  }
  return prompts;
} 