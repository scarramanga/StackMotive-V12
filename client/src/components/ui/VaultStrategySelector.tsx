import React from 'react';

export interface VaultStrategySelectorProps {
  selectedStrategy: string;
  onSelect: (strategy: string) => void;
  strategies: string[];
}

export const VaultStrategySelector: React.FC<VaultStrategySelectorProps> = ({ selectedStrategy, onSelect, strategies }) => {
  // Use a segmented control on desktop, dropdown on mobile
  // For simplicity, use a responsive flex group of buttons
  return (
    <div className="w-full flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" htmlFor="strategy-select">
        Strategy
      </label>
      <div className="flex flex-wrap gap-2 md:gap-3" role="radiogroup" aria-label="Select strategy">
        {strategies.map(strategy => (
          <button
            key={strategy}
            type="button"
            role="radio"
            aria-checked={selectedStrategy === strategy}
            tabIndex={0}
            className={
              `px-3 py-1 rounded-full border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary ` +
              (selectedStrategy === strategy
                ? 'bg-primary text-white border-primary shadow'
                : 'bg-muted text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-accent')
            }
            onClick={() => onSelect(strategy)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(strategy);
              }
            }}
          >
            {strategy}
          </button>
        ))}
      </div>
    </div>
  );
}; 