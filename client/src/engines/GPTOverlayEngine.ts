import type { VaultBelief } from '@/utils/vault';

interface GetGPTNarrativeOverlayArgs {
  assetSymbol: string;
  userPrefs: any;
  vaultBeliefs: readonly VaultBelief[];
  signals: any[];
  executionMode: 'simulate' | 'broker' | 'backtest';
}

export function getGPTNarrativeOverlay({ assetSymbol, userPrefs, vaultBeliefs, signals, executionMode }: GetGPTNarrativeOverlayArgs) {
  // Block 29 Implementation: Weigh beliefs and user prefs
  const relevantBeliefs = vaultBeliefs.filter(b => assetSymbol && b.statement.toLowerCase().includes(assetSymbol.toLowerCase()));
  const beliefConfidence = relevantBeliefs.reduce((sum, b) => sum + b.confidence, 0) / (relevantBeliefs.length || 1);
  const tone = userPrefs.toneBias || 'balanced';
  const focus = userPrefs.assetFocus || assetSymbol;
  const mode = executionMode;
  // Mock narrative logic
  let narrative = '';
  if (beliefConfidence >= 4) {
    narrative = `Strategic conviction: ${assetSymbol} is a core holding. ${mode === 'broker' ? 'Broker mode: Real trades will respect this.' : 'Sim mode: No real capital at risk.'}`;
  } else if (signals.some(s => s.strength > 80)) {
    narrative = `Elevated signal detected for ${assetSymbol}. ${tone === 'contrarian' ? 'Consider the opposite crowd.' : 'Momentum may persist.'}`;
  } else {
    narrative = `No strong conviction for ${assetSymbol}. Maintain neutral stance.`;
  }
  if (focus && focus !== assetSymbol) {
    narrative += ` (User focus: ${focus})`;
  }
  return {
    narrative,
    confidence: Math.min(1, (beliefConfidence / 5) + (signals.length ? 0.2 : 0)),
    origin: 'gpt',
  };
} 