// Block 10: DCA & Stop-Loss Assistant Types

export type DCAFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface DCAConfig {
  asset: string;
  enabled: boolean;
  frequency: DCAFrequency;
  amount: number;
  nextBuy: string;
  paused: boolean;
}

export interface StopLossConfig {
  asset: string;
  enabled: boolean;
  threshold: number; // e.g., -10 for -10%
  trailing: boolean;
  global: boolean;
  paused: boolean;
}

export interface DCAStopLossPrompt {
  id: string;
  asset: string;
  type: 'dca' | 'stop-loss';
  action: 'buy' | 'sell';
  rationale: string;
  timestamp: string;
  snoozed: boolean;
  dismissed: boolean;
}

export interface DCAStopLossHistoryEntry extends DCAStopLossPrompt {} 