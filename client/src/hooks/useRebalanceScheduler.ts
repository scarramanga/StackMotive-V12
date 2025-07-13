// Block 9: useRebalanceScheduler Hook
import { useEffect, useState } from 'react';
import { useRebalanceStore } from '../store/rebalance';
import { evaluateRebalanceTrigger } from '../engines/rebalanceScheduler';
import type { RebalancePrompt } from '../types/rebalance';

export function useRebalanceScheduler({ strategySignals, marketEvents, portfolio, overlays }: any) {
  const { schedule, setSchedule, history, addHistory } = useRebalanceStore();
  const [prompt, setPrompt] = useState<RebalancePrompt | null>(null);

  useEffect(() => {
    if (!schedule.enabled || schedule.paused) return;
    const check = () => {
      const result = evaluateRebalanceTrigger({
        schedule,
        lastRebalance: schedule.lastRebalance,
        strategySignals,
        marketEvents,
        portfolio,
        overlays,
      });
      if (result) setPrompt(result);
    };
    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [schedule, strategySignals, marketEvents, portfolio, overlays]);

  function confirmRebalance() {
    if (!prompt) return;
    addHistory({ ...prompt, confirmed: true, skipped: false });
    setPrompt(null);
    setSchedule({ ...schedule, lastRebalance: new Date().toISOString() });
  }
  function skipRebalance() {
    if (!prompt) return;
    addHistory({ ...prompt, confirmed: false, skipped: true });
    setPrompt(null);
  }

  return { prompt, confirmRebalance, skipRebalance, history, schedule, setSchedule };
} 