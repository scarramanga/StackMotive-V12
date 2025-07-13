import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

// Form validation schema
const strategySchema = z.object({
  name: z.string().min(3, { message: 'Strategy name must be at least 3 characters' }),
  symbol: z.string().min(1, { message: 'Symbol is required' }),
  exchange: z.string().min(1, { message: 'Exchange is required' }),
  description: z.string().optional(),
  indicators: z.any().optional(),
  entryConditions: z.any().optional(),
  exitConditions: z.any().optional(),
  riskPercentage: z.string().optional(),
  accountId: z.any().optional(),
  status: z.string().default('inactive'),
});

type StrategyFormValues = z.infer<typeof strategySchema>;

interface StrategyFormProps {
  onSubmit: (data: StrategyFormValues) => void;
  defaultValues?: Partial<StrategyFormValues>;
}

export function StrategyForm({ onSubmit, defaultValues }: StrategyFormProps) {
  // Initialize the form with default values
  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategySchema),
    defaultValues: defaultValues || {
      name: '',
      symbol: '',
      exchange: '',
      description: '',
      indicators: {},
      entryConditions: {},
      exitConditions: {},
      riskPercentage: '2.0',
      status: 'inactive',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategy Name</FormLabel>
                <FormControl>
                  <Input placeholder="Moving Average Crossover" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <Input placeholder="AAPL, BTC-USD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="exchange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exchange</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exchange" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NYSE">NYSE</SelectItem>
                    <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                    <SelectItem value="Coinbase">Coinbase</SelectItem>
                    <SelectItem value="Binance">Binance</SelectItem>
                    <SelectItem value="Kraken">Kraken</SelectItem>
                    <SelectItem value="KuCoin">KuCoin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your trading strategy" 
                  className="resize-none" 
                  rows={4} 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Brief description of how this strategy works
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="riskPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Risk Percentage (%)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" min="0.1" max="100" {...field} />
              </FormControl>
              <FormDescription>
                Maximum percentage of account to risk per trade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">
            Save Strategy
          </Button>
        </div>
      </form>
    </Form>
  );
}