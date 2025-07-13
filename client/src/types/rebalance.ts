// Block 9: Rebalance Scheduler Types

export type RebalanceInterval = 'daily' | 'weekly' | 'monthly';
export type RebalanceTriggerType = 'interval' | 'macro' | 'signal';

export interface RebalanceSchedule {
  enabled: boolean;
  interval: RebalanceInterval | null;
  triggers: RebalanceTriggerType[];
  paused: boolean;
  lastRebalance: string | null;
  cooldownOverride: boolean;
}

export interface RebalancePrompt {
  id: string;
  beforeWeights: Record<string, number>;
  afterWeights: Record<string, number>;
  rationale: string;
  timestamp: string;
  confirmed: boolean;
  skipped: boolean;
}

export interface RebalanceHistoryEntry extends RebalancePrompt {} 