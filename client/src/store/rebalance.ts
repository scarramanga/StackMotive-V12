// Block 9: Rebalance Scheduler Store
import { create } from 'zustand';
import type { RebalanceSchedule, RebalanceHistoryEntry } from '../types/rebalance';

interface RebalanceState {
  schedule: RebalanceSchedule;
  history: RebalanceHistoryEntry[];
  setSchedule: (s: RebalanceSchedule) => void;
  addHistory: (h: RebalanceHistoryEntry) => void;
  clearHistory: () => void;
}

export const useRebalanceStore = create<RebalanceState>((set) => ({
  schedule: {
    enabled: false,
    interval: null,
    triggers: ['interval', 'macro', 'signal'],
    paused: false,
    lastRebalance: null,
    cooldownOverride: false,
  },
  history: [],
  setSchedule: (schedule) => set({ schedule }),
  addHistory: (h) => set((state) => ({ history: [...state.history, h] })),
  clearHistory: () => set({ history: [] }),
})); 