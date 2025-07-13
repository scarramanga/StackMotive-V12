// Block 79 Implementation
import React, { useEffect, useState } from 'react';
import { useJournalAPI, JournalEntry } from '../../hooks/useJournalAPI';
import { usePortfolio } from '../../contexts/PortfolioContext';

const JournalPanel: React.FC = () => {
  // Block 79 Implementation
  const { fetchJournalForSessionVault, deleteJournalEntryForSessionVault } = useJournalAPI();
  const { activeVaultId } = usePortfolio();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      if (typeof window === 'undefined' || !activeVaultId) {
        setEntries([]);
        setLoading(false);
        return;
      }
      const data = await fetchJournalForSessionVault();
      if (!ignore) setEntries(data);
      setLoading(false);
    }
    load();
    return () => { ignore = true; };
  }, [fetchJournalForSessionVault, activeVaultId]);

  if (typeof window === 'undefined' || !activeVaultId) return null;

  const handleDelete = async (entryId: string) => {
    await deleteJournalEntryForSessionVault(entryId);
    setEntries(entries => entries.filter(e => e.entry_id !== entryId));
  };

  return (
    <section className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Journal Entries</h2>
      {loading ? (
        <div className="text-gray-500">Loading journal...</div>
      ) : entries.length === 0 ? (
        <div className="text-gray-400 py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <span className="block text-3xl mb-2">📓</span>
          <span>No journal entries for this Vault.</span>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map(entry => (
            <li key={entry.entry_id} className="py-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {entry.text.length > 32 ? entry.text.slice(0, 32) + '…' : entry.text}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <button
                  className="ml-4 px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                  onClick={() => handleDelete(entry.entry_id)}
                  aria-label="Delete entry"
                >
                  Delete
                </button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                {entry.text.length > 64 ? entry.text.slice(0, 64) + '…' : entry.text}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default JournalPanel; 