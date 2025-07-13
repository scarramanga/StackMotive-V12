// Block 94 Implementation
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { Decision } from '../../agents/SignalGPTAgent';
import { ConfidenceBadge } from './ConfidenceBadge';

interface GPTActionFeedbackPanelProps {
  decisions: Decision[];
}

const getActionBadge = (action: string) => {
  switch (action) {
    case 'buy':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'sell':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'hold':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'alert':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
};

const GPTActionFeedbackPanel: React.FC<GPTActionFeedbackPanelProps> = ({ decisions }) => {
  // Block 94 Implementation
  const { activeVaultId } = usePortfolio();
  const [overrideModal, setOverrideModal] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null });
  const [overrideNote, setOverrideNote] = useState('');
  const [snoozed, setSnoozed] = useState<{ [idx: number]: number }>({}); // idx: snoozeUntil timestamp

  if (typeof window === 'undefined' || !activeVaultId || !decisions || decisions.length === 0) return null;

  const handleSnooze = (idx: number) => {
    const snoozeUntil = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
    setSnoozed(prev => ({ ...prev, [idx]: snoozeUntil }));
  };

  const handleOverride = (idx: number) => {
    setOverrideModal({ open: true, idx });
    setOverrideNote('');
  };

  const handleOverrideSubmit = () => {
    // For now, just close modal and mark as overridden in UI
    setOverrideModal({ open: false, idx: null });
    // Optionally, you could add an 'overridden' state here
  };

  return (
    <section className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">GPT Action Feedback</h2>
      <div className="flex flex-col gap-4">
        {decisions.map((d, i) => {
          const isSnoozed = snoozed[i] && snoozed[i] > Date.now();
          return (
            <div
              key={i}
              className={`rounded-lg border p-4 flex flex-col gap-2 shadow-sm ${getActionBadge(d.action)} ${isSnoozed ? 'opacity-50 pointer-events-none' : ''}`}
              aria-label={`Decision for ${d.asset}`}
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getActionBadge(d.action)}`}>{d.action}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">{d.asset}</span>
                <span className="ml-auto text-xs text-gray-500">Confidence:</span>
                <ConfidenceBadge score={Math.round(d.confidence * 100)} rationale={d.rationale} />
              </div>
              {d.rationale && (
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">GPT rationale:</span> {d.rationale}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => handleSnooze(i)}
                  disabled={isSnoozed}
                  aria-label="Snooze alert for 48 hours"
                >
                  Snooze
                </button>
                <button
                  className="px-3 py-1 rounded bg-blue-200 dark:bg-blue-700 text-xs font-semibold hover:bg-blue-300 dark:hover:bg-blue-600"
                  onClick={() => handleOverride(i)}
                  aria-label="Override alert and provide justification"
                >
                  Override
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Override Modal */}
      {overrideModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Override Alert</h3>
            <label className="block text-sm mb-2">Justification (required):</label>
            <textarea
              className="w-full border rounded p-2 mb-4 dark:bg-gray-800 dark:text-white"
              value={overrideNote}
              onChange={e => setOverrideNote(e.target.value)}
              rows={3}
              required
              aria-required="true"
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => setOverrideModal({ open: false, idx: null })}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600"
                onClick={handleOverrideSubmit}
                disabled={!overrideNote.trim()}
                aria-disabled={!overrideNote.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GPTActionFeedbackPanel; 