// Block 70: Strategy Preset Marketplace (vFuture)
// JSON schema/type for a shareable strategy preset

export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  overlays: any[]; // Array of overlay configs (can be typed more strictly if needed)
  weights: Record<string, number>; // Asset/overlay weights
  parameters: Record<string, any>; // Additional strategy parameters
  createdBy: string; // User or AI
  createdAt: string;
  auditTrail: string[]; // Array of source/audit notes
  aiNotes?: string;
  backtestSummary?: string;
} 