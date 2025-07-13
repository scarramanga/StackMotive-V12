// Block 10: useDCAStopLossAgent Hook
import { useEffect, useState } from 'react';
import { useDCAStopLossStore } from '../store/dcaStopLoss';
import { evaluateDCAStopLoss } from '../agents/DCAStopLossAgent';
import type { DCAStopLossPrompt } from '../types/dcaStopLoss';

export function useDCAStopLossAgent({ priceData, volatility, aiMomentum }: any) {
  const { dcaConfigs, stopLossConfigs, history, lastPrompts, addHistory, setLastPrompt } = useDCAStopLossStore();
  const [prompts, setPrompts] = useState<DCAStopLossPrompt[]>([]);
  // Debounce: 1 day for DCA, 1 hour for stop-loss
  const debounce = { dca: 24 * 60 * 60 * 1000, stopLoss: 60 * 60 * 1000 };

  useEffect(() => {
    const check = () => {
      const newPrompts = evaluateDCAStopLoss({
        dcaConfigs,
        stopLossConfigs,
        priceData,
        volatility,
        aiMomentum,
        lastPrompts,
        debounce,
      });
      setPrompts(newPrompts);
      newPrompts.forEach(p => {
        addHistory(p);
        setLastPrompt(p.asset, p.type, Date.now().toString());
      });
    };
    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dcaConfigs, stopLossConfigs, priceData, volatility, aiMomentum, lastPrompts]);

  return { prompts, history };
} 