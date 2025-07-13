// Block 33: AI Co-Pilot Toggle
import { useUserPreferencesStore, CoPilotMode } from '../store/userPreferences';

export function useCoPilotMode() {
  const coPilotMode = useUserPreferencesStore(s => s.coPilotMode);
  const setCoPilotMode = useUserPreferencesStore(s => s.setCoPilotMode);

  // Logic mapping for each mode
  const modeLogic: Record<CoPilotMode, {
    promptFrequency: 'low' | 'medium' | 'high' | 'auto';
    scope: 'observe' | 'suggest' | 'execute';
    autoExecution: boolean;
  }> = {
    observer: { promptFrequency: 'low', scope: 'observe', autoExecution: false },
    navigator: { promptFrequency: 'medium', scope: 'suggest', autoExecution: false },
    operator: { promptFrequency: 'high', scope: 'suggest', autoExecution: false },
    sovereign: { promptFrequency: 'auto', scope: 'execute', autoExecution: true },
  };

  return { coPilotMode, setCoPilotMode, modeLogic };
} 