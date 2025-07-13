// Block 5: AI Signal Engine Types

export type SignalSource = 'gpt' | 'indicator' | 'macro' | 'manual';
export type SignalAction = 'buy' | 'sell' | 'hold';

export interface Signal {
  id: string;
  asset: string;
  action: SignalAction;
  confidence: number; // 0-1
  rationale: string;
  triggeredBy: string[]; // e.g., ['RSI', 'GPT', 'Macro']
  timestamp: string;
  expiry: string;
  riskWeight: number; // 0-1
  source: SignalSource;
  promptVersion?: string; // For GPT signals
  inputHash?: string; // For traceability
} 