// Block 10: DCA & Stop-Loss Store
import { create } from 'zustand';
import type { DCAConfig, StopLossConfig, DCAStopLossHistoryEntry } from '../types/dcaStopLoss';

interface DCAStopLossState {
  dcaConfigs: DCAConfig[];
  stopLossConfigs: StopLossConfig[];
  history: DCAStopLossHistoryEntry[];
  lastPrompts: Record<string, string>;
  setDCAConfigs: (c: DCAConfig[]) => void;
  setStopLossConfigs: (c: StopLossConfig[]) => void;
  addHistory: (h: DCAStopLossHistoryEntry) => void;
  setLastPrompt: (asset: string, type: 'dca' | 'stop-loss', ts: string) => void;
  clearHistory: () => void;
}

export const useDCAStopLossStore = create<DCAStopLossState>((set) => ({
  dcaConfigs: [],
  stopLossConfigs: [],
  history: [],
  lastPrompts: {},
  setDCAConfigs: (dcaConfigs) => set({ dcaConfigs }),
  setStopLossConfigs: (stopLossConfigs) => set({ stopLossConfigs }),
  addHistory: (h) => set((state) => ({ history: [...state.history, h] })),
  setLastPrompt: (asset, type, ts) => set((state) => ({ lastPrompts: { ...state.lastPrompts, [`${asset}-${type}`]: ts } })),
  clearHistory: () => set({ history: [] }),
})); 