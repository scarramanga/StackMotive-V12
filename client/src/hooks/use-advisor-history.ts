import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useSessionStore } from '../store/session';
import type { AdvisorHistoryEntry } from '../types/advisor';

export function useAdvisorHistory() {
  const token = useSessionStore(s => s.token);
  return useQuery<AdvisorHistoryEntry[]>({
    queryKey: ['advisorHistory'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/advisor/history');
    },
    enabled: !!token,
    refetchInterval: 60000,
  });
} 