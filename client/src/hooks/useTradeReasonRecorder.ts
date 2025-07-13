import { useState } from 'react';
import { useJournalAPI } from './useJournalAPI';

export interface TradeReasonContext {
  overlays: string[];
  agentSignals: Record<string, any>; // e.g., { RSI: 45, MACD: 'bullish', GPT: 'Buy rationale' }
}

export interface TradeReasonEntry {
  asset: string;
  action: 'buy' | 'sell' | 'hold';
  reason: string;
  timestamp: string;
  context: TradeReasonContext;
  tags: string[];
}

export function useTradeReasonRecorder() {
  const { addJournalEntryForSessionVault } = useJournalAPI();
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<TradeReasonEntry | null>(null);

  function triggerRecorder({ asset, action, overlays, agentSignals, defaultReason = '' }: {
    asset: string;
    action: 'buy' | 'sell' | 'hold';
    overlays: string[];
    agentSignals: Record<string, any>;
    defaultReason?: string;
  }) {
    setPending({
      asset,
      action,
      reason: defaultReason,
      timestamp: new Date().toISOString(),
      context: { overlays, agentSignals },
      tags: [action, ...overlays],
    });
    setModalOpen(true);
  }

  async function confirm(reason: string) {
    if (!pending) return;
    const entry: TradeReasonEntry = { ...pending, reason };
    await addJournalEntryForSessionVault({
      text: JSON.stringify(entry),
      tags: entry.tags,
      timestamp: entry.timestamp,
    });
    setModalOpen(false);
    setPending(null);
  }

  function cancel() {
    setModalOpen(false);
    setPending(null);
  }

  return {
    modalOpen,
    pending,
    triggerRecorder,
    confirm,
    cancel,
  };
} 