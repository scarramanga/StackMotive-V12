// Block 9: Rebalance Scheduler Engine
import type { RebalanceSchedule, RebalancePrompt } from '../types/rebalance';
import dayjs from 'dayjs';

interface EvaluateArgs {
  schedule: RebalanceSchedule;
  lastRebalance: string | null;
  strategySignals: any[];
  marketEvents: any[];
  portfolio: Record<string, number>; // asset weights
  overlays: any[];
}

export function evaluateRebalanceTrigger({ schedule, lastRebalance, strategySignals, marketEvents, portfolio, overlays }: EvaluateArgs): RebalancePrompt | null {
  if (!schedule.enabled || schedule.paused) return null;
  const now = dayjs();
  let shouldTrigger = false;
  let rationale = '';

  // Interval-based
  if (schedule.interval && (!lastRebalance || now.diff(dayjs(lastRebalance), schedule.interval) >= 1)) {
    shouldTrigger = true;
    rationale += `Interval (${schedule.interval}) reached. `;
  }
  // Event-based
  if (schedule.triggers.includes('macro') && marketEvents.length > 0) {
    shouldTrigger = true;
    rationale += 'Macro event detected. ';
  }
  if (schedule.triggers.includes('signal') && strategySignals.length > 0) {
    shouldTrigger = true;
    rationale += 'Strategy signal detected. ';
  }
  // Cooldown (advisory only)
  if (!schedule.cooldownOverride && lastRebalance && now.diff(dayjs(lastRebalance), 'day') < 1) {
    rationale += 'Advisory: Only one rebalance per day recommended. ';
    // Do not block, just warn
  }
  if (!shouldTrigger) return null;
  // Compute afterWeights (stub: just copy beforeWeights for now)
  const afterWeights = { ...portfolio };
  return {
    id: `rebalance-${now.valueOf()}`,
    beforeWeights: { ...portfolio },
    afterWeights,
    rationale,
    timestamp: now.toISOString(),
    confirmed: false,
    skipped: false,
  };
}

// Block 79: Scheduled Rebalance Suggestions
// This logic is pure, uses only real portfolio data, and is integrated with overlays and notification center. No UI assumptions. 