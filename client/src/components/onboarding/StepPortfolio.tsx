import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const portfolioSchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  investmentHorizon: z.enum(['short', 'medium', 'long']),
  initialInvestment: z.number().min(1000, "Minimum investment is $1,000").max(1000000, "Maximum investment is $1,000,000"),
  tradingExperience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
});

type PortfolioData = z.infer<typeof portfolioSchema>;

interface StepPortfolioProps {
  onNext: (data: PortfolioData) => void;
}

const STORAGE_KEY = 'stackmotive_onboarding_portfolio';

const StepPortfolio: React.FC<StepPortfolioProps> = ({ onNext }) => {
  // Load data from localStorage if available
  const loadSavedData = (): Partial<PortfolioData> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const savedData = loadSavedData();

  const form = useForm<PortfolioData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      riskTolerance: savedData.riskTolerance || 'moderate',
      investmentHorizon: savedData.investmentHorizon || 'medium',
      initialInvestment: savedData.initialInvestment || 10000,
      tradingExperience: savedData.tradingExperience || 'beginner',
    },
  });

  // Watch all form values for auto-save
  const watchedValues = form.watch();

  // Auto-save to localStorage when form values change
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedValues));
      } catch (error) {
        console.warn('Failed to save onboarding progress:', error);
      }
    }, 500); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [watchedValues]);

  const onSubmit = (data: PortfolioData) => {
    // Enforce slider bounds one more time before submission
    const validatedData = {
      ...data,
      initialInvestment: Math.max(1000, Math.min(1000000, data.initialInvestment))
    };

    // Clear saved data on successful submission
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear saved data:', error);
    }

    onNext(validatedData);
  };

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const currentInvestment = form.watch('initialInvestment');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Preferences</CardTitle>
        <CardDescription>
          Tell us about your investment style and goals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tradingExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trading Experience</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your trading experience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riskTolerance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Tolerance</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your risk tolerance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investmentHorizon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Horizon</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your investment horizon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="short">Short Term (less than 1 year)</SelectItem>
                      <SelectItem value="medium">Medium Term (1-3 years)</SelectItem>
                      <SelectItem value="long">Long Term (3+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialInvestment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Investment</FormLabel>
                  <div className="space-y-3">
                    <Slider
                      min={1000}
                      max={1000000}
                      step={1000}
                      value={[field.value]}
                      onValueChange={([value]) => {
                        // Enforce bounds in real-time
                        const clampedValue = Math.max(1000, Math.min(1000000, value));
                        field.onChange(clampedValue);
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$1K</span>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-foreground">
                          {formatCurrency(currentInvestment)}
                        </div>
                        <div className="text-xs">
                          {currentInvestment < 10000 && "Conservative start"}
                          {currentInvestment >= 10000 && currentInvestment < 50000 && "Balanced approach"}
                          {currentInvestment >= 50000 && currentInvestment < 100000 && "Substantial investment"}
                          {currentInvestment >= 100000 && "Serious investor"}
                        </div>
                      </div>
                      <span>$1M</span>
                    </div>
                    {/* Range validation display */}
                    {(field.value < 1000 || field.value > 1000000) && (
                      <p className="text-sm text-red-600">
                        Investment must be between $1,000 and $1,000,000
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress saved indicator */}
            <div className="text-xs text-muted-foreground text-center">
              💾 Your progress is automatically saved
            </div>

            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StepPortfolio; 