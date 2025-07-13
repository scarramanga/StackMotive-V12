// Block 91b Implementation
import React, { useEffect, useState } from 'react';
import { useSignalAPI, Signal } from '../../hooks/useSignalAPI';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { format } from 'date-fns';

const getConfidenceColor = (confidence: number | undefined) => {
  if (confidence === undefined) return 'bg-gray-300 text-gray-800';
  if (confidence > 0.7) return 'bg-green-100 text-green-800';
  if (confidence > 0.4) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

const VaultGPTInteractionLog: React.FC = () => {
  // Block 91b Implementation
  const { fetchSignalsForSessionVault } = useSignalAPI();
  const { activeVaultId } = usePortfolio();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      if (typeof window === 'undefined' || !activeVaultId) {
        setSignals([]);
        setLoading(false);
        return;
      }
      const data = await fetchSignalsForSessionVault();
      const gptSignals = data
        .filter(s => s.source?.toLowerCase() === 'gpt' || s.signal_type?.toLowerCase() === 'gpt')
        .sort((a, b) => (b.timestamp && a.timestamp ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() : 0));
      if (!ignore) setSignals(gptSignals);
      setLoading(false);
    }
    load();
    return () => { ignore = true; };
  }, [fetchSignalsForSessionVault, activeVaultId]);

  if (typeof window === 'undefined' || !activeVaultId) return null;

  return (
    <section className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">GPT Interaction Log</h2>
      {loading ? (
        <div className="text-gray-500">Loading interactions...</div>
      ) : signals.length === 0 ? (
        <div className="text-gray-400 py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <span className="block text-3xl mb-2">🧠</span>
          <span>No GPT signals for this Vault.</span>
        </div>
      ) : (
        <ol className="relative border-l border-gray-200 dark:border-gray-700">
          {signals.map(signal => (
            <li key={signal.signal_id} className="mb-8 ml-4">
              <div className="absolute w-3 h-3 bg-indigo-500 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900" />
              <div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{signal.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${getConfidenceColor(signal.confidence)}`}>
                    {signal.confidence !== undefined ? `${Math.round(signal.confidence * 100)}%` : 'N/A'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{signal.signal_type}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                  <span>{signal.timestamp ? format(new Date(signal.timestamp), 'PPpp') : ''}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default VaultGPTInteractionLog; 