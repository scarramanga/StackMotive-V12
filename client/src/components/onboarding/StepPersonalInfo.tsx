import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const ALLOWED_CURRENCIES = ['NZD', 'AUD', 'USD'] as const;

// Phone validation function
const validatePhone = (phone: string | undefined): boolean => {
  if (!phone) return true; // Optional field
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if it has 7-15 digits
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  preferredCurrency: z.enum(ALLOWED_CURRENCIES),
  phone: z.string().optional().refine(validatePhone, {
    message: 'Phone number must contain 7-15 digits'
  }),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;

interface StepPersonalInfoProps {
  onNext: (data: PersonalInfoData) => void;
}

const STORAGE_KEY = 'stackmotive_onboarding_personal';

// Phone number formatting function
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digitsOnly = value.replace(/\D/g, '');
  
  // Apply basic formatting
  if (digitsOnly.length <= 3) {
    return digitsOnly;
  } else if (digitsOnly.length <= 6) {
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
  } else if (digitsOnly.length <= 10) {
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  } else {
    // For international numbers, just add spaces every 3-4 digits
    return `+${digitsOnly.slice(0, -10)} ${digitsOnly.slice(-10, -7)} ${digitsOnly.slice(-7, -4)} ${digitsOnly.slice(-4)}`;
  }
};

const StepPersonalInfo: React.FC<StepPersonalInfoProps> = ({ onNext }) => {
  // Load data from localStorage if available
  const loadSavedData = (): Partial<PersonalInfoData> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const savedData = loadSavedData();

  const form = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: savedData.firstName || "",
      lastName: savedData.lastName || "",
      fullName: savedData.fullName || "",
      preferredCurrency: savedData.preferredCurrency || 'NZD',
      phone: savedData.phone || "",
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

  // Auto-populate and lock fullName when firstName or lastName change
  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  
  React.useEffect(() => {
    const newFullName = `${firstName} ${lastName}`.trim();
    if (newFullName && newFullName !== form.getValues('fullName')) {
      form.setValue('fullName', newFullName);
    }
  }, [firstName, lastName, form]);

  const onSubmit = (data: PersonalInfoData) => {
    // Clear saved data on successful submission
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear saved data:', error);
    }

    onNext(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Tell us a bit about yourself and your trading preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (Display Name)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      {...field}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      title="This field is automatically generated from your first and last name"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    ✨ Auto-generated from first and last name
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+64 123 456 789" 
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                      maxLength={20}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Enter 7-15 digits (formatting applied automatically)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your preferred currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALLOWED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency} {currency === 'NZD' && '(New Zealand Dollar)'}
                          {currency === 'AUD' && '(Australian Dollar)'}
                          {currency === 'USD' && '(US Dollar)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

export default StepPersonalInfo; 