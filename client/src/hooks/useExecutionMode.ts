import useUserPreferences from '@/hooks/useUserPreferences';

export function useExecutionMode() {
  const { preferences, setPreference } = useUserPreferences();
  const executionMode = preferences.executionMode || 'simulate';
  const setExecutionMode = (mode: 'simulate' | 'broker' | 'backtest') => setPreference('executionMode', mode);
  return { executionMode, setExecutionMode };
} 