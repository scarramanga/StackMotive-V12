import React, { useEffect, useRef, useState } from 'react';
import { useQuickCommand } from '../../hooks/useQuickCommand';

const QuickCommandLauncher: React.FC = () => {
  const { commands, isOpen, query, setQuery, toggleLauncher, executeCommand, allCommands } = useQuickCommand();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleLauncher();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleLauncher]);

  // Focus input when open
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
    setSelectedIdx(0);
  }, [isOpen, commands]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setSelectedIdx(idx => Math.min(idx + 1, commands.length - 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setSelectedIdx(idx => Math.max(idx - 1, 0));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (commands[selectedIdx]) executeCommand(commands[selectedIdx].id);
      } else if (e.key === 'Escape') {
        toggleLauncher();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, commands, selectedIdx, executeCommand, toggleLauncher]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
        <input
          ref={inputRef}
          className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-4 focus:outline-none"
          placeholder="Type a command..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <ul className="max-h-64 overflow-y-auto">
          {commands.length === 0 && (
            <li className="text-gray-400 px-4 py-2">No commands found.</li>
          )}
          {commands.map((cmd, i) => (
            <li
              key={cmd.id}
              className={`px-4 py-2 rounded cursor-pointer flex flex-col gap-0.5 ${i === selectedIdx ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onMouseEnter={() => setSelectedIdx(i)}
              onClick={() => executeCommand(cmd.id)}
            >
              <span className="font-semibold">{cmd.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-300">{cmd.description}</span>
            </li>
          ))}
        </ul>
        <button
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={toggleLauncher}
          aria-label="Close"
        >
          ×
        </button>
        <div className="mt-4 text-xs text-gray-400 text-center">Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+K</kbd> to open/close</div>
      </div>
    </div>
  );
};

export default QuickCommandLauncher; 