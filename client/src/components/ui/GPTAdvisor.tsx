import React from 'react';
import useUserPreferences from '@/hooks/useUserPreferences';
import { getGPTNarrativeOverlay } from '@/engines/GPTOverlayEngine';
import { useVaultBeliefs } from '@/hooks/useVaultBeliefs';
import { useSignals } from '@/hooks/useSignals';
import { useExecutionMode } from '@/hooks/useExecutionMode';
import ProvenanceTag from './ProvenanceTag';

interface GPTAdvisorProps {
  assetSymbol?: string;
  contextLabel?: string;
  showNarrative?: boolean;
  showHeader?: boolean;
}

const mockNarratives: Record<string, string> = {
  BTC: 'Whale activity elevated. Macro signals suggest increased volatility. Watch for breakout above $70k.',
  AAPL: 'Earnings season approaching. Analyst sentiment neutral. No major insider trades detected.',
};

const GPTAdvisor: React.FC<GPTAdvisorProps> = ({ assetSymbol, contextLabel, showNarrative, showHeader }) => {
  const { preferences } = useUserPreferences();
  const enabled = preferences.showNarrativeOverlay ?? true;
  const vaultBeliefs = useVaultBeliefs();
  const { all: signals } = useSignals(assetSymbol);
  const { executionMode } = useExecutionMode();
  if (!enabled || showNarrative === false || !assetSymbol) return null;
  const overlay = getGPTNarrativeOverlay({
    assetSymbol,
    userPrefs: preferences,
    vaultBeliefs,
    signals,
    executionMode,
  });
  if (!overlay.narrative) return null;

  return (
    <div className="block9-gpt-advisor bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/30 dark:to-teal-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 my-4">
      {showHeader && (
        <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2 text-sm uppercase tracking-wide">Narrative Overlay</div>
      )}
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-700 dark:text-blue-300">{assetSymbol}</span>
        {contextLabel && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{contextLabel}</span>}
        <span className="ml-2 text-sm text-blue-900 dark:text-blue-100">{overlay.narrative}</span>
        <ProvenanceTag source="gpt" confidence={overlay.confidence} />
      </div>
    </div>
  );
};

export default GPTAdvisor; 