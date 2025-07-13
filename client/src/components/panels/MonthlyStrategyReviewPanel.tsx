import React from 'react';
import { useMonthlyReview } from '../../hooks/useMonthlyReview';
import { OverlayPerformance, RotationLog, SignalTrigger, UserPreferences } from '../../types/strategyReview';

interface MonthlyStrategyReviewPanelProps {
  overlays: OverlayPerformance[];
  rotationLogs: RotationLog[];
  signalTriggers: SignalTrigger[];
  userPreferences: UserPreferences;
  month: string;
  onExport?: (report: string) => void;
}

// Block 37: Monthly Strategy Review
export const MonthlyStrategyReviewPanel: React.FC<MonthlyStrategyReviewPanelProps> = ({ overlays, rotationLogs, signalTriggers, userPreferences, month, onExport }) => {
  const report = useMonthlyReview(overlays, rotationLogs, signalTriggers, userPreferences, month);

  return (
    <section className="rounded-xl bg-card dark:bg-card/80 p-4 shadow-lg border border-border max-w-2xl mx-auto my-6 transition-colors" aria-labelledby="monthly-strategy-review-title">
      <h2 id="monthly-strategy-review-title" className="text-lg font-semibold mb-2">Monthly Strategy Review</h2>
      <div className="prose prose-sm dark:prose-invert mb-4 whitespace-pre-line">
        {report}
      </div>
      {onExport && (
        <button
          className="btn btn-secondary mt-2"
          onClick={() => onExport(report)}
        >
          Export Report
        </button>
      )}
    </section>
  );
}; 