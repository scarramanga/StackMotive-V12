// Block 72: Manual Override Log
import create from 'zustand';

export interface OverrideLogEntry {
  id: string;
  timestamp: string;
  asset: string;
  overlay?: string;
  source: string; // e.g. DCA, overlay, strategy
  note: string;
  redacted: boolean;
}

interface OverrideLogState {
  entries: OverrideLogEntry[];
  logOverride: (entry: Omit<OverrideLogEntry, 'id' | 'timestamp' | 'redacted'> & { note?: string }) => void;
  redactNote: (id: string) => void;
}

export const useOverrideLogStore = create<OverrideLogState>((set) => ({
  entries: [],
  logOverride: (entry) => {
    const newEntry: OverrideLogEntry = {
      id: `${entry.asset}-${entry.source}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      asset: entry.asset,
      overlay: entry.overlay,
      source: entry.source,
      note: entry.note || '',
      redacted: false,
    };
    set((state) => ({ entries: [newEntry, ...state.entries] }));
    // Post to backend for persistence
    fetch('/api/override-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });
  },
  redactNote: (id) => {
    set((state) => ({
      entries: state.entries.map(e => e.id === id ? { ...e, note: '', redacted: true } : e)
    }));
    // Patch backend for redaction
    fetch('/api/override-log/redact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  },
}));

export function useOverrideLogger() {
  const { logOverride, redactNote, entries } = useOverrideLogStore();
  return { logOverride, redactNote, entries };
} 