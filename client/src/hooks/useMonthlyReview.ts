import { useState, useEffect } from 'react';
import { generateMonthlyStrategyReport, MonthlyStrategyReportInput } from '../agents/generateMonthlyStrategyReport';
import { OverlayPerformance, RotationLog, SignalTrigger, UserPreferences } from '../types/strategyReview';

// Block 37: Monthly Strategy Review
export function useMonthlyReview(
  overlays: OverlayPerformance[],
  rotationLogs: RotationLog[],
  signalTriggers: SignalTrigger[],
  userPreferences: UserPreferences,
  month: string
) {
  const [report, setReport] = useState<string>('');

  useEffect(() => {
    // Trigger on month-end (or when any input changes)
    const input: MonthlyStrategyReportInput = {
      overlays,
      rotationLogs,
      signalTriggers,
      userPreferences,
      month,
    };
    setReport(generateMonthlyStrategyReport(input));
  }, [overlays, rotationLogs, signalTriggers, userPreferences, month]);

  return report;
} 