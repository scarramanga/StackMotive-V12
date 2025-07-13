import React, { useEffect, useRef } from 'react';
import { PanelAnimator } from '../animation/PanelAnimator';

export interface VaultNarrativeReportPanelProps {
  vaultName: string;
  isVisible: boolean;
  onClose: () => void;
  reportContent: {
    summary: string;
    macroContext: string[];
    strategyReview: string;
    nextSteps: string;
  };
}

export const VaultNarrativeReportPanel: React.FC<VaultNarrativeReportPanelProps> = ({ vaultName, isVisible, onClose, reportContent }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus panel and handle Escape key
  useEffect(() => {
    if (!isVisible) return;
    panelRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <PanelAnimator isVisible={isVisible} onClose={onClose}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl flex flex-col outline-none"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur z-10">
          <h2 className="text-lg font-semibold truncate">{vaultName} — Quarterly Report</h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
          {/* Executive Summary */}
          <section>
            <h3 className="text-base font-semibold mb-1">Executive Summary</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">{reportContent.summary}</p>
          </section>
          {/* Macro Context */}
          <section>
            <h3 className="text-base font-semibold mb-1">Macro Context</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 text-sm">
              {reportContent.macroContext.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
          {/* Strategy Review */}
          <section>
            <h3 className="text-base font-semibold mb-1">Strategy Review</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">{reportContent.strategyReview}</p>
          </section>
          {/* Next Steps */}
          <section>
            <h3 className="text-base font-semibold mb-1">Recommended Actions</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-2">{reportContent.nextSteps}</p>
          </section>
        </div>
      </div>
    </PanelAnimator>
  );
}; 