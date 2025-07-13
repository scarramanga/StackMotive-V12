import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useSessionStore } from '../store/session';
import type { AdvisorRecommendation } from '../types/advisor';

export function useAdvisorStopLoss() {
  const token = useSessionStore(s => s.token);
  return useQuery<AdvisorRecommendation[]>({
    queryKey: ['advisorStopLoss'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/advisor/stoploss');
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
} 