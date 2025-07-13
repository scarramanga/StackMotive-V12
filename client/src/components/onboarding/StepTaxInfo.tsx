import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const taxInfoSchema = z.object({
  taxResidency: z.string().min(2, 'Please select your tax residency'),
  taxNumber: z.string().optional(),
  employmentStatus: z.enum(['employed', 'self-employed', 'student', 'retired', 'other']),
});

type TaxInfoData = z.infer<typeof taxInfoSchema>;

interface StepTaxInfoProps {
  onNext: (data: TaxInfoData) => void;
}

const StepTaxInfo: React.FC<StepTaxInfoProps> = ({ onNext }) => {
  const form = useForm<TaxInfoData>({
    resolver: zodResolver(taxInfoSchema),
    defaultValues: {
      employmentStatus: 'employed',
    },
  });

  const onSubmit = (data: TaxInfoData) => {
    onNext(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Information</CardTitle>
        <CardDescription>
          Help us understand your tax situation for better reporting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="taxResidency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Residency</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New Zealand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., IRD number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employmentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your employment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self-employed">Self-employed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StepTaxInfo; 