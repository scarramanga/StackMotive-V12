import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { StrategyInput, StrategyResponse } from '@/types/strategy';
import { useToast } from './use-toast';

export function useStrategies() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: strategies = [], isLoading, error } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/strategy/strategies');
    }
  });

  const createStrategy = useMutation({
    mutationFn: async (data: StrategyInput) => {
      return await apiRequest('POST', '/api/strategy/strategies', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      toast({
        title: 'Strategy Created',
        description: 'Your strategy has been created successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateStrategy = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<StrategyInput> }) => {
      return await apiRequest('PUT', `/api/strategy/strategies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      toast({
        title: 'Strategy Updated',
        description: 'Your strategy has been updated successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteStrategy = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/strategy/strategies/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete strategy');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      toast({
        title: 'Strategy Deleted',
        description: 'Your strategy has been deleted successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    strategies,
    isLoading,
    error,
    createStrategy,
    updateStrategy,
    deleteStrategy
  };
} 