import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const taxSettingsSchema = z.object({
  accountingMethod: z.enum(['FIFO', 'LIFO']),
  includeFees: z.boolean(),
  includeForeignTax: z.boolean(),
  offsetLosses: z.boolean(),
  carryForward: z.boolean()
});

type TaxSettingsFormData = z.infer<typeof taxSettingsSchema>;

export default function TaxSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current tax settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tax/settings');
      return response.json();
    }
  });

  // Fetch tax preview
  const { data: preview } = useQuery({
    queryKey: ['taxPreview'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tax/preview');
      return response.json();
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<TaxSettingsFormData>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: settings?.data
  });

  // Update tax settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: TaxSettingsFormData) => {
      const response = await apiRequest('PUT', '/api/tax/settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxSettings'] });
      queryClient.invalidateQueries({ queryKey: ['taxPreview'] });
      toast({
        title: 'Settings Updated',
        description: 'Your tax settings have been updated and calculations refreshed.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update tax settings',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: TaxSettingsFormData) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tax Settings</h1>
        <p className="text-muted-foreground">
          Configure how your trading activity is calculated for tax purposes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium">Accounting Method</label>
                <Select
                  {...register('accountingMethod')}
                  defaultValue={settings?.data.accountingMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">First In, First Out (FIFO)</SelectItem>
                    <SelectItem value="LIFO">Last In, First Out (LIFO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Include Fees</label>
                  <p className="text-sm text-muted-foreground">
                    Add trading fees to cost basis
                  </p>
                </div>
                <Switch {...register('includeFees')} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Include Foreign Tax</label>
                  <p className="text-sm text-muted-foreground">
                    Account for foreign tax credits
                  </p>
                </div>
                <Switch {...register('includeForeignTax')} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Offset Losses</label>
                  <p className="text-sm text-muted-foreground">
                    Use losses to offset gains
                  </p>
                </div>
                <Switch {...register('offsetLosses')} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Carry Forward Losses</label>
                  <p className="text-sm text-muted-foreground">
                    Apply unused losses to future years
                  </p>
                </div>
                <Switch {...register('carryForward')} />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Save Settings
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Current Tax Year Preview</h2>
            {preview?.data ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Taxable Income</label>
                  <p className="text-2xl font-bold">
                    ${preview.data.taxableIncome.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tax Owed</label>
                  <p className="text-2xl font-bold">
                    ${preview.data.taxOwed.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Foreign Income</label>
                  <p className="text-lg">
                    ${preview.data.foreignIncome.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Fees Paid</label>
                  <p className="text-lg">
                    ${preview.data.feesPaid.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No tax data available</p>
            )}
          </Card>

          <Alert>
            <AlertTitle>Need your tax report?</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                Download a detailed breakdown of your trading activity for tax purposes.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/api/tax/report'}
              >
                Download Tax Report
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
} 