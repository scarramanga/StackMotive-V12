// Block 7 Implementation: Scaffold for Journal & Logging Engine
import React, { useState } from 'react';

// Dummy journal entries
const dummyEntries = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    content: 'Opened a new BTC/USD long position. Watching for macro breakout.',
    userMode: 'manual',
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    content: 'GPT Agent: Detected unusual whale activity on ETH. Recommend review.',
    userMode: 'agent',
  },
  {
    id: 3,
    timestamp: new Date().toISOString(),
    content: 'Added macro note: FOMC meeting tomorrow, expect volatility.',
    userMode: 'manual',
  },
];

export type UserMode = 'manual' | 'agent';

interface JournalLogProps {
  // For future: onAdd, onEdit, onDelete, entries, etc.
}

const JournalLog: React.FC<JournalLogProps> = () => {
  const [userMode, setUserMode] = useState<UserMode>('manual');
  const [editorValue, setEditorValue] = useState('');
  // For now, use dummy entries
  const [entries] = useState(dummyEntries);

  // Placeholder for add/edit/delete handlers
  // const handleAdd = () => {};
  // const handleEdit = (id: number) => {};
  // const handleDelete = (id: number) => {};

  return (
    <div className="block7-journal-log grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white dark:bg-neutral-900 rounded-lg shadow border border-border">
      {/* Markdown Editor Stub */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-lg">Journal Entry</span>
          <select
            className="ml-auto border rounded px-2 py-1 text-sm bg-muted"
            value={userMode}
            onChange={e => setUserMode(e.target.value as UserMode)}
          >
            <option value="manual">Manual</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        <textarea
          className="w-full min-h-[120px] p-3 border rounded bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Write a new journal entry in Markdown..."
          value={editorValue}
          onChange={e => setEditorValue(e.target.value)}
        />
        <button
          className="self-end px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
          disabled
        >
          Add Entry (stub)
        </button>
      </div>
      {/* Timeline Pane */}
      <div className="flex flex-col">
        <span className="font-semibold text-lg mb-2">Log Timeline</span>
        <div className="flex-1 overflow-y-auto space-y-4">
          {entries
            .slice()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map(entry => (
              <div
                key={entry.id}
                className={`rounded border p-3 bg-muted flex flex-col ${
                  entry.userMode === 'agent' ? 'border-blue-400' : 'border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${entry.userMode === 'agent' ? 'text-blue-600' : 'text-gray-700'}`}>{entry.userMode === 'agent' ? 'GPT Agent' : 'Manual'}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-sm whitespace-pre-line text-foreground">{entry.content}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default JournalLog; 