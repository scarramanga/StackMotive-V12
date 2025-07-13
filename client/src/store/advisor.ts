// Block 11: Advisor Panel Store
import { create } from 'zustand';
import type { AdvisorTab, AdvisorRecommendation, AdvisorHistoryEntry } from '../types/advisor';

interface AdvisorState {
  recommendations: AdvisorRecommendation[];
  history: AdvisorHistoryEntry[];
  activeTab: AdvisorTab;
  setRecommendations: (r: AdvisorRecommendation[]) => void;
  addHistory: (h: AdvisorHistoryEntry) => void;
  setActiveTab: (t: AdvisorTab) => void;
}

export const useAdvisorStore = create<AdvisorState>((set) => ({
  recommendations: [],
  history: [],
  activeTab: 'rebalance',
  setRecommendations: (recommendations) => set({ recommendations }),
  addHistory: (h) => set((state) => ({ history: [...state.history, h] })),
  setActiveTab: (activeTab) => set({ activeTab }),
})); 