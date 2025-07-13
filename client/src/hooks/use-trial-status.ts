import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
}

export function useTrialStatus() {
  return useQuery({
    queryKey: ['trialStatus'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/user/trial-status');
        const data = response;
        
        // Calculate days remaining with more precision
        const now = new Date();
        const endsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
        
        let daysRemaining = 0;
        if (endsAt) {
          const timeDiff = endsAt.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
        }

        // If server doesn't provide trial end date, calculate based on typical 30-day trial
        // This is a fallback to ensure countdown works even if server data is missing
        if (!endsAt && data.trialStartedAt) {
          const startedAt = new Date(data.trialStartedAt);
          const thirtyDaysLater = new Date(startedAt.getTime() + (30 * 24 * 60 * 60 * 1000));
          const timeDiff = thirtyDaysLater.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
        }

        return {
          isActive: daysRemaining > 0,
          daysRemaining,
          trialStartedAt: data.trialStartedAt ? new Date(data.trialStartedAt) : null,
          trialEndsAt: endsAt
        } as TrialStatus;
      } catch (error) {
        console.error('Failed to fetch trial status:', error);
        // Return a fallback status to prevent app crashes
        return {
          isActive: true,
          daysRemaining: 30, // Default fallback
          trialStartedAt: null,
          trialEndsAt: null
        } as TrialStatus;
      }
    },
    refetchInterval: 1000 * 60 * 1, // Refetch every 1 minute for more responsive updates
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
  });
} 