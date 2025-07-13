export interface VaultBelief {
  text: string;
  confidence: number;
}

export interface VaultTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  beliefs: VaultBelief[];
}

export const VAULT_TEMPLATES: VaultTemplate[] = [
  {
    id: 'all-weather',
    name: 'All-Weather Portfolio',
    description: 'Diversified, resilient to all macro regimes.',
    category: 'All-Weather',
    beliefs: [
      { text: 'Diversification is the only free lunch.', confidence: 5 },
      { text: 'Inflation protection is essential.', confidence: 4 },
      { text: 'No single asset should dominate.', confidence: 4 },
    ],
  },
  {
    id: 'btc-sovereign',
    name: 'BTC Sovereign Stack',
    description: 'Bitcoin as the core sovereign store of value.',
    category: 'BTC-Sovereign',
    beliefs: [
      { text: 'BTC is the ultimate sovereign store of value.', confidence: 5 },
      { text: 'Fiat currencies structurally debase.', confidence: 4 },
      { text: 'Self-custody is non-negotiable.', confidence: 5 },
    ],
  },
  {
    id: 'growth-innovation',
    name: 'Growth & Innovation',
    description: 'Focus on tech, AI, and exponential trends.',
    category: 'Growth',
    beliefs: [
      { text: 'AI and tech will drive future returns.', confidence: 4 },
      { text: 'Disruption creates opportunity.', confidence: 4 },
      { text: 'Embrace volatility for growth.', confidence: 3 },
    ],
  },
  {
    id: 'risk-parity',
    name: 'Risk Parity',
    description: 'Balance risk, not capital, across assets.',
    category: 'All-Weather',
    beliefs: [
      { text: 'Risk should be balanced, not capital.', confidence: 5 },
      { text: 'Leverage can be used prudently.', confidence: 3 },
      { text: 'Diversification across regimes is key.', confidence: 4 },
    ],
  },
  {
    id: 'crisis-alpha',
    name: 'Crisis Alpha',
    description: 'Prepared for tail risk and volatility spikes.',
    category: 'Crisis',
    beliefs: [
      { text: 'Tail risk is underpriced.', confidence: 4 },
      { text: 'Volatility is an asset.', confidence: 3 },
      { text: 'Liquidity is king in crisis.', confidence: 5 },
    ],
  },
  {
    id: 'ethical-impact',
    name: 'Ethical Impact',
    description: 'Align capital with values and positive impact.',
    category: 'ESG',
    beliefs: [
      { text: 'Capital should drive positive change.', confidence: 5 },
      { text: 'ESG factors matter for long-term risk.', confidence: 4 },
      { text: 'Transparency and accountability are essential.', confidence: 4 },
    ],
  },
  {
    id: 'custom-hybrid',
    name: 'Custom Hybrid',
    description: 'Mix and match beliefs for a personalized stack.',
    category: 'Hybrid',
    beliefs: [
      { text: 'Personal conviction is the ultimate edge.', confidence: 5 },
      { text: 'Adapt to changing regimes.', confidence: 4 },
      { text: 'Blend quantitative and qualitative signals.', confidence: 3 },
    ],
  },
]; 