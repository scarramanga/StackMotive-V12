import React from 'react';
import { useExecutionMode } from '@/hooks/useExecutionMode';

const MODES = [
  { value: 'simulate', label: 'Simulate' },
  { value: 'broker', label: 'Broker' },
  { value: 'backtest', label: 'Backtest' },
];

export const OrchestrationToggle: React.FC = () => {
  const { executionMode, setExecutionMode } = useExecutionMode();

  return (
    <div className="hidden sm:flex items-center gap-2 ml-2">
      {MODES.map(opt => (
        <button
          key={opt.value}
          className={`px-3 py-1 rounded transition text-sm font-medium border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 ${executionMode === opt.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-primary/10'}`}
          onClick={() => setExecutionMode(opt.value as any)}
          aria-pressed={executionMode === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
export default OrchestrationToggle; 