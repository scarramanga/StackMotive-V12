import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { TradeResponse, TradeFilters } from '@/types/trade';
import { useToast } from './use-toast';

export function useTrades(filters?: TradeFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Convert filters to URLSearchParams
  const queryString = filters ? 
    '?' + new URLSearchParams(
      Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          if (value instanceof Date) {
            return [key, value.toISOString()];
          }
          return [key, String(value)];
        })
    ).toString() : '';

  const { data: trades = [], isLoading, error } = useQuery({
    queryKey: ['trades', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/trades${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      return response.json();
    }
  });

  const closeTrade = useMutation({
    mutationFn: async ({ id, exitPrice }: { id: number; exitPrice: string }) => {
      const response = await apiRequest('PUT', `/api/trades/${id}/close`, { exitPrice });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to close trade');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: 'Trade Closed',
        description: 'Your trade has been closed successfully.'
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

  const cancelTrade = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PUT', `/api/trades/${id}/cancel`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel trade');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: 'Trade Cancelled',
        description: 'Your trade has been cancelled successfully.'
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
    trades,
    isLoading,
    error,
    closeTrade,
    cancelTrade
  };
} 