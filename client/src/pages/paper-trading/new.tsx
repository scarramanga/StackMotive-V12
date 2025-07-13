import React from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  currency: z.string().min(1, 'Currency is required'),
  initialBalance: z
    .number()
    .min(1000, 'Initial balance must be at least 1000')
    .max(10000000, 'Initial balance cannot exceed 10,000,000'),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_INITIAL_BALANCE = 100000;

const CURRENCIES = {
  USD: { label: 'USD - US Dollar', symbol: '$' },
  EUR: { label: 'EUR - Euro', symbol: '€' },
  GBP: { label: 'GBP - British Pound', symbol: '£' },
  AUD: { label: 'AUD - Australian Dollar', symbol: 'A$' },
  NZD: { label: 'NZD - New Zealand Dollar', symbol: 'NZ$' },
};

export default function CreatePaperTradingAccountPage() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      currency: 'USD',
      initialBalance: DEFAULT_INITIAL_BALANCE,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/user/paper-trading-account', data);
      return response;
    },
    onSuccess: async () => {
      toast({ title: 'Success', description: 'Paper trading account created' });
      
      // Invalidate all relevant queries to refresh auth state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/user/paper-trading-account'] }),
        queryClient.invalidateQueries({ queryKey: ['user'] }),
      ]);
      
      // Small delay to ensure auth context updates before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
      });
    },
  });

  function onSubmit(values: FormData) {
    mutation.mutate(values);
  }

  return (
    <div className='p-4'>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Paper Trading Account</CardTitle>
            <CardDescription>Start practicing with virtual funds in a risk-free environment</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Practice Portfolio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CURRENCIES).map(([code, { label }]) => (
                              <SelectItem key={code} value={code}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Balance</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                            {CURRENCIES[form.watch('currency') as keyof typeof CURRENCIES]?.symbol || '$'}
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="e.g. 150,000"
                            className="pl-7"
                            {...field}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const cleaned = raw.replace(/,/g, '');
                              const numeric = cleaned === '' ? '' : Number(cleaned);
                              field.onChange(numeric);
                            }}
                            value={field.value?.toLocaleString?.('en-NZ') ?? ''}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Start with at least 1,000 virtual currency to practice trading (recommended: 100,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between gap-4">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setLocation('/dashboard')}>
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Creating...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

