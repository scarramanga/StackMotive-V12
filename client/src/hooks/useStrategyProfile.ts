import { useState } from 'react';

export interface StrategyArchetype {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export const STRATEGY_ARCHETYPES: StrategyArchetype[] = [
  {
    id: 'conviction-stack',
    name: 'Conviction Stack',
    description: 'Vault-enforced decisions for maximum thesis alignment.',
    icon: '🛡️',
    category: 'Vault',
  },
  {
    id: 'signal-driven',
    name: 'Signal-Driven Entry',
    description: 'Entry/exit based on MACD, Whale, and technical signals.',
    icon: '📈',
    category: 'Signal',
  },
  {
    id: 'narrative-simulator',
    name: 'Narrative Simulator',
    description: 'GPT macro prompt overlays for scenario-driven allocation.',
    icon: '🧠',
    category: 'GPT',
  },
  {
    id: 'rebalancer',
    name: 'Rebalancer',
    description: 'Portfolio drift and weight rules for systematic rebalancing.',
    icon: '⚖️',
    category: 'Portfolio',
  },
  {
    id: 'crisis-hedger',
    name: 'Crisis Hedger',
    description: 'Hedge using VIX, DXY, and risk-off triggers.',
    icon: '🛑',
    category: 'Risk',
  },
  {
    id: 'explorer-mode',
    name: 'Explorer Mode',
    description: 'Sandbox mode for non-executable, experimental strategies.',
    icon: '🧪',
    category: 'Sandbox',
  },
  {
    id: 'bias-aware',
    name: 'Bias-Aware',
    description: 'Tone and trust-aware GPT overlays for bias mitigation.',
    icon: '🎭',
    category: 'GPT',
  },
];

export function useStrategyProfile() {
  const [selectedId, setSelectedId] = useState<string>(STRATEGY_ARCHETYPES[0].id);
  const selected = STRATEGY_ARCHETYPES.find(s => s.id === selectedId) || STRATEGY_ARCHETYPES[0];
  return {
    selected,
    setSelectedId,
    archetypes: STRATEGY_ARCHETYPES,
  };
} 