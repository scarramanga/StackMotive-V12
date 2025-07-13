# File Contents for Inspection

## 1. client/src/context/auth-context.tsx

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { setAccessToken, clearAccessToken, getAccessToken } from '@/lib/auth';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

interface User {
  id: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  hasCompletedOnboarding: boolean;
  preferredCurrency: string;
  onboardingCompletedAt?: string;
}

interface PaperTradingAccount {
  id: number;
  userId: string;
  name: string;
  isActive: boolean;
  initialBalance: number;
  currentBalance: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  // Core data
  user: User | null;
  paperTradingAccount: PaperTradingAccount | null;
  
  // Loading states
  isLoadingUser: boolean;
  isLoadingPaperAccount: boolean;
  isLoading: boolean; // Combined loading state
  
  // Computed states
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasPaperTradingAccount: boolean;
  isUserReady: boolean; // All required data is loaded
  
  // Error state
  error: Error | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: { preferredCurrency: string }) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  debugAuthState: () => void;
  getRedirectPath: () => string;
  shouldRedirect: (currentPath: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);
  const [, navigate] = useLocation();
  const [location] = useLocation();

  const isPublicRoute = PUBLIC_ROUTES.includes(location);
  const hasToken = !!getAccessToken();

  // Fetch user data
  const { 
    data: user, 
    error: userError, 
    isLoading: isLoadingUser,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<User> => {
      console.log('🔍 Fetching user data...');
      const data = await apiRequest('GET', '/api/user/me');
      console.log('✅ User data received:', { 
        email: data.email, 
        hasCompletedOnboarding: data.hasCompletedOnboarding 
      });
      return data as User;
    },
    enabled: hasToken && !isPublicRoute,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch paper trading account (only if user is loaded and onboarded)
  const { 
    data: paperTradingAccount, 
    error: paperAccountError,
    isLoading: isLoadingPaperAccountRaw,
    refetch: refetchPaperAccount
  } = useQuery({
    queryKey: ['paper-trading-account'],
    queryFn: async (): Promise<PaperTradingAccount | null> => {
      try {
        console.log('🔍 Fetching paper trading account...');
        const data = await apiRequest('GET', '/api/user/paper-trading-account');
        console.log('✅ Paper trading account found:', { id: data?.id, name: data?.name });
        return data || null;
      } catch (error: any) {
        if (error?.status === 404) {
          console.log('ℹ️ No paper trading account found (404)');
          return null;
        }
        throw error;
      }
    },
    enabled: !!user?.id && !!hasToken,
    staleTime: 0, // Don't cache - always fetch fresh
    refetchOnMount: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // [... rest of auth context implementation ...]
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## 2. client/src/pages/paper-trading/new.tsx

```typescript
import React from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLayout } from '@/components/layout/page-layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { usePaperTradingAccount } from '@/hooks/use-paper-trading';

const formSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  currency: z.string().min(1, 'Currency is required'),
  initialBalance: z.number().min(1000, 'Initial balance must be at least 1000').max(10000000, 'Initial balance cannot exceed 10,000,000'),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_INITIAL_BALANCE = 100000;

export default function NewPaperTradingAccount() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [balanceDisplay, setBalanceDisplay] = React.useState(DEFAULT_INITIAL_BALANCE.toLocaleString());

  // Check if user already has an account and redirect if they do using the consistent hook
  const { data: existingAccount, isLoading: isCheckingAccount } = usePaperTradingAccount();

  // Redirect if user already has an account
  React.useEffect(() => {
    if (existingAccount && !isCheckingAccount) {
      console.log('🔍 User already has account, redirecting to dashboard:', existingAccount);
      toast({
        title: 'Account Already Exists',
        description: 'You already have a paper trading account. Redirecting to dashboard...',
      });
      navigate('/dashboard');
    }
  }, [existingAccount, isCheckingAccount, navigate, toast]);

  const createAccount = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('🔍 Creating account with data:', data);
      
      try {
        const result = await apiRequest('POST', '/api/user/paper-trading-account', {
          name: data.name.trim(),
          currency: data.currency,
          initialBalance: data.initialBalance,
        });
        
        console.log('🔍 Account creation successful:', result);
        return result;
      } catch (error) {
        console.error('🔍 Account creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Redirecting after paper account creation...');
      
      toast({
        title: 'Account Created',
        description: 'Your paper trading account has been created successfully.',
      });
      
      // Invalidate all paper trading account queries to refresh the auth state
      queryClient.invalidateQueries({ queryKey: ['paper-trading-account'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/paper-trading-account'] });
      // Also invalidate the user query to refresh auth state
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      console.error('🔍 Account creation mutation error:', error);
      toast({
        variant: 'destructive',
        title: 'Error Creating Account',
        description: error.message,
      });
    },
  });

  // [... rest of component implementation ...]
}
```

## Current Issue Analysis

From the server logs, I can see:

1. **Backend is working** - Account creation API calls are successful (returning existing account ID 85)
2. **Frontend is running** - Vite dev server on port 5173
3. **The redirect logic is in place** but there may be cache invalidation timing issues

The key issue is likely that the query cache invalidation after account creation isn't happening quickly enough for the auth context to pick up the new account state before the redirect occurs. 