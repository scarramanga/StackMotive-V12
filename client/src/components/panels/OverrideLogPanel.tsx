// Block 72: Manual Override Log Panel
import React from 'react';
import { useOverrideLogger } from '../../hooks/useOverrideLogger';

const OverrideLogPanel: React.FC = () => {
  const { entries, redactNote } = useOverrideLogger();
  if (!entries.length) return <div className="p-4 text-gray-500">No override log entries yet.</div>;
  return (
    <section className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-8">
      <h2 className="text-xl font-bold mb-4">Manual Override Log</h2>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {entries.map(entry => (
          <li key={entry.id} className="py-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800 dark:text-gray-100">{entry.asset}{entry.overlay ? ` (${entry.overlay})` : ''}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{new Date(entry.timestamp).toLocaleString()}</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">{entry.source}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              {entry.redacted ? <i>Note redacted</i> : entry.note}
              {!entry.redacted && entry.note && (
                <button
                  className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  onClick={() => redactNote(entry.id)}
                  aria-label="Redact note"
                >
                  Redact
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OverrideLogPanel; 