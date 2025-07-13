// Block 37: Monthly Strategy Review Types
export interface OverlayPerformance {
  name: string;
  return: number; // e.g. 0.12 for 12%
  volatility: number; // e.g. 0.18 for 18%
  maxDrawdown: number; // e.g. 0.10 for 10%
}

export interface RotationLog {
  date: string; // ISO date
  preset: string; // e.g. 'Aggressive Growth'
  reason: string;
}

export interface SignalTrigger {
  date: string; // ISO date
  asset: string;
  type: string; // e.g. 'macro', 'technical', 'news'
  justification: string;
}

export interface UserPreferences {
  rotationPresetName?: string;
  riskLevel?: string;
} 