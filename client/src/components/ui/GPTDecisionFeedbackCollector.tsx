// Block 95 Implementation
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useAuth } from '../../hooks/useAuth';
import { useGPTFeedbackAPI } from '../../hooks/useGPTFeedbackAPI';

export interface GPTDecision {
  id: string;
  action: 'buy' | 'sell' | 'hold' | 'alert';
  asset: string;
  confidence: number;
  rationale?: string;
}

interface GPTDecisionFeedbackCollectorProps {
  decisions: GPTDecision[];
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

const GPTDecisionFeedbackCollector: React.FC<GPTDecisionFeedbackCollectorProps> = ({ decisions }) => {
  // Block 95 Implementation
  const { activeVaultId } = usePortfolio();
  const { user } = useAuth();
  const { submitFeedbackForDecision } = useGPTFeedbackAPI();
  const [feedback, setFeedback] = useState<Record<string, 'approve' | 'reject' | undefined>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | undefined>>({});

  if (typeof window === 'undefined' || !activeVaultId || !user) return null;

  const handleFeedback = async (decisionId: string, value: 'approve' | 'reject') => {
    setLoading(l => ({ ...l, [decisionId]: true }));
    setError(e => ({ ...e, [decisionId]: undefined }));
    try {
      await submitFeedbackForDecision(decisionId, value);
      setFeedback(f => ({ ...f, [decisionId]: value }));
    } catch (err) {
      setError(e => ({ ...e, [decisionId]: 'Failed to submit feedback.' }));
    } finally {
      setLoading(l => ({ ...l, [decisionId]: false }));
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">GPT Decision Feedback</h2>
      <div className="flex flex-col gap-4">
        {decisions.length === 0 ? (
          <div className="text-gray-400 py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <span className="block text-2xl mb-2">🤖</span>
            <span>No GPT decisions to review for this Vault.</span>
          </div>
        ) : (
          decisions.map((d) => (
            <div
              key={d.id}
              className={`rounded-lg border p-4 flex flex-col gap-2 shadow-sm ${getActionBadge(d.action)}`}
              aria-label={`Decision for ${d.asset}`}
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getActionBadge(d.action)}`}>{d.action}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">{d.asset}</span>
                <span className="ml-auto text-xs text-gray-500">Confidence:</span>
                <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{Math.round(d.confidence * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded">
                <div
                  className={`h-2 rounded ${d.confidence > 0.7 ? 'bg-green-400' : d.confidence > 0.4 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.round(d.confidence * 100)}%` }}
                  aria-label={`Confidence bar: ${Math.round(d.confidence * 100)}%`}
                />
              </div>
              {d.rationale && (
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">GPT rationale:</span> {d.rationale}
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  className={`btn btn-success px-4 py-1 rounded font-semibold flex items-center gap-1 disabled:opacity-50 ${feedback[d.id] === 'approve' ? 'ring-2 ring-green-400' : ''}`}
                  onClick={() => handleFeedback(d.id, 'approve')}
                  disabled={loading[d.id] || feedback[d.id] === 'approve'}
                  aria-label="Approve decision"
                >
                  ✅ Approve
                </button>
                <button
                  type="button"
                  className={`btn btn-error px-4 py-1 rounded font-semibold flex items-center gap-1 disabled:opacity-50 ${feedback[d.id] === 'reject' ? 'ring-2 ring-red-400' : ''}`}
                  onClick={() => handleFeedback(d.id, 'reject')}
                  disabled={loading[d.id] || feedback[d.id] === 'reject'}
                  aria-label="Reject decision"
                >
                  ❌ Reject
                </button>
                {error[d.id] && <span className="text-red-600 text-xs ml-2">{error[d.id]}</span>}
                {feedback[d.id] && !error[d.id] && (
                  <span className={`text-xs ml-2 ${feedback[d.id] === 'approve' ? 'text-green-600' : 'text-red-600'}`}>{feedback[d.id] === 'approve' ? 'Approved' : 'Rejected'}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default GPTDecisionFeedbackCollector; 