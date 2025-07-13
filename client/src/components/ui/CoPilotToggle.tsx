import React from 'react';
import { useCoPilotMode } from '../../hooks/useCoPilotMode';

// Block 33: AI Co-Pilot Toggle
const modeLabels = {
  observer: 'Observer',
  navigator: 'Navigator',
  operator: 'Operator',
  sovereign: 'Sovereign',
};
const modeDescriptions = {
  observer: 'Observes only. No suggestions or actions.',
  navigator: 'Suggests actions, but does not execute.',
  operator: 'Frequent suggestions, no auto-execution.',
  sovereign: 'Full autonomy, auto-executes actions (subscription required).',
};

export const CoPilotToggle: React.FC<{ allowedTiers?: ('observer' | 'navigator' | 'operator' | 'sovereign')[] }> = ({ allowedTiers = ['observer', 'navigator', 'operator'] }) => {
  const { coPilotMode, setCoPilotMode } = useCoPilotMode();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold">AI Co-Pilot</span>
      <select
        className="border rounded p-1 text-xs"
        value={coPilotMode}
        onChange={e => setCoPilotMode(e.target.value as any, allowedTiers)}
        aria-label="Select AI Co-Pilot mode"
      >
        {(['observer', 'navigator', 'operator', 'sovereign'] as const).map(mode => (
          <option key={mode} value={mode} disabled={!allowedTiers.includes(mode)} title={modeDescriptions[mode]}>
            {modeLabels[mode]}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground" title={modeDescriptions[coPilotMode]}>{modeDescriptions[coPilotMode]}</span>
    </div>
  );
}; 