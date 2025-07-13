import React from 'react';
import { useUserPreferencesStore } from '../../store/userPreferences';

// Block 27: Manual Mode Toggle
export const ModeToggle: React.FC = () => {
  const manualMode = useUserPreferencesStore(s => s.manualMode);
  const setManualMode = useUserPreferencesStore(s => s.setManualMode);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-2 py-0.5 rounded text-xs font-semibold ${manualMode ? 'bg-yellow-200 text-yellow-900' : 'bg-green-200 text-green-900'}`}
        title={manualMode ? 'Manual mode: Edit portfolio manually. Sync is disabled.' : 'Sync mode: Portfolio auto-syncs with broker/API.'}
      >
        {manualMode ? 'Manual' : 'Sync'}
      </span>
      <label className="relative inline-flex items-center cursor-pointer group" title={manualMode ? 'Switch to Sync Mode' : 'Switch to Manual Mode'}>
        <input
          type="checkbox"
          checked={manualMode}
          onChange={e => setManualMode(e.target.checked)}
          className="sr-only peer"
          aria-checked={manualMode}
          aria-label="Toggle manual mode"
        />
        <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:bg-yellow-400 transition-colors" />
        <div className={`absolute left-1 top-1 w-3 h-3 rounded-full bg-white shadow transition-transform ${manualMode ? 'translate-x-5' : ''}`} />
      </label>
      <span className="text-xs text-muted-foreground" title="Manual mode disables all real-time sync and enables manual portfolio editing.">
        {manualMode ? 'Manual entry enabled' : 'Live sync enabled'}
      </span>
    </div>
  );
}; 