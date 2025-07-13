// Block 8: Macro Monitor Agent Types

export interface MacroEvent {
  id: string;
  type: string; // e.g., 'CPI', 'Fed', 'War', etc.
  date: string;
  headline: string;
  sources: string[];
  sourceCount: number;
  impactEstimate?: number; // -1 (bearish) to 1 (bullish)
}

export interface MacroAssessment {
  eventId: string;
  gptPromptVersion: string;
  impactSummary: string;
  assetImpacts: { asset: string; estimate: number; rationale: string }[];
}

export interface MacroAlert {
  id: string;
  event: MacroEvent;
  assessment: MacroAssessment;
  timestamp: string;
  dismissed: boolean;
  snoozed: boolean;
} 