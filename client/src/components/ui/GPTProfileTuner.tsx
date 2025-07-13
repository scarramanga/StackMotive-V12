import React from 'react';
import useUserPreferences from '@/hooks/useUserPreferences';

const biasOptions = [
  { value: 'btc_macro', label: 'More BTC/Macro coverage' },
  { value: 'contrarian', label: 'Contrarian' },
  { value: 'mainstream', label: 'Mainstream' },
  { value: 'balanced', label: 'Balanced' },
];

const AndyGPTProfileTuner: React.FC = () => {
  const { preferences, setAIToneBias } = useUserPreferences();

  return (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded shadow border border-border max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">AndyGPT Profile Tuner</h2>
      <p className="mb-4 text-muted-foreground text-sm">Personalize your AI signal tone and coverage preferences.</p>
      <div className="space-y-2">
        {biasOptions.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="aiToneBias"
              value={opt.value}
              checked={preferences.aiToneBias === opt.value}
              onChange={() => setAIToneBias(opt.value as any)}
              className="form-radio text-primary"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default AndyGPTProfileTuner; 