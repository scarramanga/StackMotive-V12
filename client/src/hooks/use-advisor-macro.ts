import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useSessionStore } from '../store/session';
import type { AdvisorRecommendation } from '../types/advisor';

export function useAdvisorMacro() {
  const token = useSessionStore(s => s.token);
  return useQuery<AdvisorRecommendation[]>({
    queryKey: ['advisorMacro'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/advisor/macro');
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
} 