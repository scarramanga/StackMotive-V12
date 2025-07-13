// Block 20 Implementation: ThemeToggle component
import React from 'react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export const ThemeToggle: React.FC = () => {
  const { preferences, setPreference } = useUserSettingsContext();
  const current = preferences.theme || 'system';

  const handleChange = (value: string) => {
    setPreference('theme', value);
  };

  return (
    <div className="hidden sm:flex items-center gap-2 ml-2">
      {THEME_OPTIONS.map(opt => (
        <button
          key={opt.value}
          className={`px-3 py-1 rounded transition text-sm font-medium border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 ${current === opt.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-primary/10'}`}
          onClick={() => handleChange(opt.value)}
          aria-pressed={current === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
export default ThemeToggle; 