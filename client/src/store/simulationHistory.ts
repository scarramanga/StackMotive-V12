// Block 30: Strategy Simulation Toggle (history)
import create from 'zustand';
import { persist } from 'zustand/middleware';

export interface SimulationHistoryEntry {
  timestamp: string;
  overlayId: string;
  overlayName: string;
  result: any;
}

interface SimulationHistoryState {
  history: SimulationHistoryEntry[];
  addSimulationHistory: (entry: SimulationHistoryEntry) => void;
  getHistory: () => SimulationHistoryEntry[];
}

export const useSimulationHistoryStore = create<SimulationHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      addSimulationHistory: (entry) => set((state) => ({ history: [entry, ...state.history] })),
      getHistory: () => get().history,
    }),
    { name: 'simulation-history' }
  )
); 