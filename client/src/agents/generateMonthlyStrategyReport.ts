// Block 37: Monthly Strategy Review
import { OverlayPerformance, RotationLog, SignalTrigger, UserPreferences } from '../types/strategyReview';

export interface MonthlyStrategyReportInput {
  overlays: OverlayPerformance[];
  rotationLogs: RotationLog[];
  signalTriggers: SignalTrigger[];
  userPreferences: UserPreferences;
  month: string; // e.g. '2025-06'
}

export function generateMonthlyStrategyReport(input: MonthlyStrategyReportInput): string {
  const { overlays, rotationLogs, signalTriggers, userPreferences, month } = input;
  // Aggregate overlay performance
  const overlaySummary = overlays.map(o =>
    `- **${o.name}**: Return: ${(o.return * 100).toFixed(2)}%, Volatility: ${(o.volatility * 100).toFixed(2)}%, Max Drawdown: ${(o.maxDrawdown * 100).toFixed(2)}%`
  ).join('\n');
  // Aggregate rotation moves
  const rotationSummary = rotationLogs.map(r =>
    `- ${r.date}: Rotated to **${r.preset}** (${r.reason})`
  ).join('\n');
  // Key signals
  const signalSummary = signalTriggers.map(s =>
    `- ${s.date}: **${s.asset}** — ${s.type} (${s.justification})`
  ).join('\n');
  // User prefs
  const prefSummary = `- Preferred style: **${userPreferences.rotationPresetName || 'N/A'}**\n- Risk: **${userPreferences.riskLevel || 'N/A'}**`;
  // Compose report
  return `# Monthly Strategy Review — ${month}

## Overlay Performance
${overlaySummary || 'No overlay data.'}

## Rotation Moves
${rotationSummary || 'No rotation moves.'}

## Key Signal Triggers
${signalSummary || 'No key signals.'}

## User Preferences
${prefSummary}
`;
} 