import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useSessionStore } from '../store/session';
import type { AdvisorRecommendation } from '../types/advisor';

const STRATEGIES = [
  { name: 'RSI Rebound', tab: 'signals' },
  { name: 'Momentum Buy', tab: 'signals' },
  { name: 'Trend Exit', tab: 'rebalance' },
  { name: 'DCA Weekly', tab: 'dca' },
];

function mapToAdvisorRecommendation(strategy: any, raw: any): AdvisorRecommendation {
  return {
    id: `${strategy.name}-${raw.symbol || ''}`,
    tab: strategy.tab,
    asset: raw.symbol || undefined,
    action: raw.action || '',
    rationale: raw.reason || '',
    markdown: `**${strategy.name}**\n\n${raw.reason || ''}`,
    timestamp: raw.signals?.timestamp || new Date().toISOString(),
    completed: false,
    accepted: false,
    declined: false,
  };
}

export function useAdvisorRecommendations() {
  const token = useSessionStore(s => s.token);
  return useQuery({
    queryKey: ['advisorRecommendations'],
    queryFn: async () => {
      const recs: AdvisorRecommendation[] = [];
      for (const strategy of STRATEGIES) {
        try {
          const raw = await apiRequest('GET', `/api/strategy/recommendation/${encodeURIComponent(strategy.name)}`);
          recs.push(mapToAdvisorRecommendation(strategy, raw));
        } catch (e) {
          // Optionally log or handle error per strategy
        }
      }
      return recs;
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
} 