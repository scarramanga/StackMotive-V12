import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

interface TaxSettings {
  id: number;
  userId: number;
  country: string;
  taxYear: number;
  accountingMethod: 'FIFO' | 'LIFO' | 'HIFO' | 'ACB';
  includeFees: boolean;
  includeForeignIncome: boolean;
  capitalGainsRate?: number;
  carryForwardLosses: boolean;
  maxLossCarryForward?: number;
  reportingCurrency: string;
  exchangeRateSource: 'DAILY_CLOSE' | 'TRANSACTION_TIME' | 'PERIOD_AVERAGE';
  customExchangeRates?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  lastCalculated: Date | null;
}

type TaxSettingsInput = Omit<TaxSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastCalculated'>;

export function useTaxSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: taxSettings, isLoading, error } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tax-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch tax settings');
      }
      return response.json() as Promise<TaxSettings>;
    }
  });

  const updateTaxSettings = useMutation({
    mutationFn: async (data: Partial<TaxSettingsInput>) => {
      const response = await apiRequest('PUT', '/api/tax-settings', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update tax settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxSettings'] });
      toast({
        title: 'Settings Updated',
        description: 'Your tax settings have been updated successfully.'
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

  const recalculateTaxes = useMutation({
    mutationFn: async (year: number) => {
      const response = await apiRequest('POST', `/api/tax-settings/recalculate/${year}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to recalculate taxes');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxSettings'] });
      toast({
        title: 'Taxes Recalculated',
        description: 'Your tax calculations have been updated.'
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
    taxSettings,
    isLoading,
    error,
    updateTaxSettings,
    recalculateTaxes
  };
} 