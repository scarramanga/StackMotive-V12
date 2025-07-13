import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  isComplete: boolean;
  steps: OnboardingStep[];
}

const ONBOARDING_STEPS: Omit<OnboardingStep, 'isComplete'>[] = [
  {
    id: 1,
    title: 'Welcome to StackMotive',
    description: 'Let\'s get you set up with your testing account.'
  },
  {
    id: 2,
    title: 'Trading Preferences',
    description: 'Configure your trading style and risk tolerance.'
  },
  {
    id: 3,
    title: 'Paper Trading Account',
    description: 'Set up your mock portfolio with $100,000 in virtual funds.'
  },
  {
    id: 4,
    title: 'Tax Settings',
    description: 'Configure your tax residency and accounting method.'
  }
];

export function useOnboardingProgress() {
  const queryClient = useQueryClient();

  // Get progress from API only
  const { data: progress, isLoading, error } = useQuery({
    queryKey: ['onboardingProgress'],
    queryFn: async () => {
      try {
        const apiResponse = await apiRequest('GET', '/api/user/onboarding');
        if (!apiResponse.ok) {
          throw new Error('Failed to fetch onboarding progress');
        }
        const data = await apiResponse.json();

        const steps = ONBOARDING_STEPS.map(step => ({
          ...step,
          isComplete: step.id < data.onboardingStep
        }));

        return {
          currentStep: data.onboardingStep,
          isComplete: data.onboardingComplete,
          steps
        } as OnboardingProgress;
      } catch (error) {
        console.error('Onboarding progress fetch error:', error);
        throw error;
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Prevent refetching on window focus
    refetchInterval: false // Disable periodic refetching
  });

  const updateProgress = useMutation({
    mutationFn: async (stepId: number) => {
      const response = await apiRequest('POST', '/api/user/onboarding/progress', {
        step: stepId
      });
      if (!response.ok) {
        throw new Error('Failed to update onboarding progress');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
    }
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/onboarding/complete');
      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
    }
  });

  return {
    progress,
    isLoading,
    error,
    updateProgress,
    completeOnboarding
  };
} 