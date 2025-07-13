// Block 11: AI Portfolio Advisor Panel Types

export type AdvisorTab = 'rebalance' | 'signals' | 'dca' | 'stoploss' | 'taxloss' | 'macro' | 'custom';

export interface AdvisorRecommendation {
  id: string;
  tab: AdvisorTab;
  asset?: string;
  action: string;
  rationale: string;
  markdown: string;
  timestamp: string;
  completed: boolean;
  accepted: boolean;
  declined: boolean;
}

export interface AdvisorHistoryEntry extends AdvisorRecommendation {} 