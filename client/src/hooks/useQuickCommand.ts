import { useState, useCallback } from 'react';

export interface QuickCommand {
  id: string;
  label: string;
  description: string;
  action: () => void;
}

const COMMANDS: QuickCommand[] = [
  {
    id: 'portfolio-scan',
    label: 'Run Portfolio Scan',
    description: 'Scan portfolio for risk and integrity issues',
    action: () => alert('Portfolio scan triggered (mock)'),
  },
  {
    id: 'export-vault',
    label: 'Export Vault',
    description: 'Export your Vault beliefs and settings',
    action: () => alert('Vault export triggered (mock)'),
  },
  {
    id: 'open-broker-settings',
    label: 'Open Broker Settings',
    description: 'Go to broker integration settings',
    action: () => alert('Broker settings opened (mock)'),
  },
  {
    id: 'jump-watchlist',
    label: 'Jump to Watchlist',
    description: 'Go to your asset watchlist',
    action: () => alert('Watchlist opened (mock)'),
  },
  {
    id: 'toggle-diagnostics',
    label: 'Toggle Diagnostic Overlay',
    description: 'Show or hide the diagnostic overlay',
    action: () => alert('Diagnostic overlay toggled (mock)'),
  },
];

export function useQuickCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const toggleLauncher = useCallback(() => setIsOpen(v => !v), []);

  const executeCommand = useCallback((id: string) => {
    const cmd = COMMANDS.find(c => c.id === id);
    if (cmd) cmd.action();
    setIsOpen(false);
  }, []);

  // Fuzzy filter (simple: includes)
  const filtered = query
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  return {
    commands: filtered,
    isOpen,
    query,
    setQuery,
    toggleLauncher,
    executeCommand,
    allCommands: COMMANDS,
  };
} 