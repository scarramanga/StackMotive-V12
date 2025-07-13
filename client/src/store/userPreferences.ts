// Block 25: Theme + Mobile Responsiveness
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCoPilotAuditStore } from './coPilotAudit';

type Theme = 'light' | 'dark';

export type CoPilotMode = 'observer' | 'navigator' | 'operator' | 'sovereign';

interface UserPreferencesState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  manualMode: boolean;
  setManualMode: (manual: boolean) => void;
  simulationEnabled: boolean;
  setSimulationEnabled: (enabled: boolean) => void;
  lastSimOverlayId: string | null;
  setLastSimOverlayId: (id: string | null) => void;
  coPilotMode: CoPilotMode;
  setCoPilotMode: (mode: CoPilotMode, allowedTiers?: CoPilotMode[]) => void;
  autoTrimEnabled: boolean;
  setAutoTrimEnabled: (enabled: boolean) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      theme: (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light',
      setTheme: (theme: Theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
      manualMode: false,
      setManualMode: (manual: boolean) => set({ manualMode: manual }),
      simulationEnabled: false,
      setSimulationEnabled: (enabled: boolean) => set({ simulationEnabled: enabled }),
      lastSimOverlayId: null,
      setLastSimOverlayId: (id: string | null) => set({ lastSimOverlayId: id }),
      coPilotMode: 'observer',
      setCoPilotMode: (mode: CoPilotMode, allowedTiers: CoPilotMode[] = ['observer', 'navigator', 'operator']) => {
        const state = get();
        const oldMode = state.coPilotMode;
        if (allowedTiers.includes(mode)) {
          if (mode === 'sovereign' && typeof window !== 'undefined') {
            if (!window.confirm('Enabling Sovereign mode allows the AI to auto-execute actions. Are you sure?')) {
              return;
            }
          }
          set({ coPilotMode: mode });
          // Audit log (frontend)
          const userId = (typeof window !== 'undefined' && window.localStorage.getItem('userId')) || 'unknown';
          useCoPilotAuditStore.getState().addCoPilotAudit({
            timestamp: new Date().toISOString(),
            userId,
            oldMode,
            newMode: mode,
          });
          // Audit log (backend)
          fetch('/api/audit/copilot-mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              userId,
              oldMode,
              newMode: mode,
            }),
          });
        } else {
          set({ coPilotMode: 'observer' });
        }
      },
      autoTrimEnabled: false,
      setAutoTrimEnabled: (enabled: boolean) => set({ autoTrimEnabled: enabled }),
    }),
    { name: 'user-preferences' }
  )
); 