import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useSessionStore } from '../store/session';
import type { AdvisorRecommendation } from '../types/advisor';

export function useAdvisorRebalancing() {
  const token = useSessionStore(s => s.token);
  return useQuery<AdvisorRecommendation[]>({
    queryKey: ['advisorRebalancing'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/advisor/rebalancing');
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
} 