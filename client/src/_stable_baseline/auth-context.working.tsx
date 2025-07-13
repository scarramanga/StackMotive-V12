console.log("✅ AuthContext file loaded");

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { setAccessToken, clearAccessToken, getAccessToken } from '@/lib/auth';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';

// Skip initialize flag to prevent race condition after login
let skipInitialize = false;

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/auth-debug'];

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

// Helper function to safely decode JWT token
function decodeToken(token: string): any {
  try {
    // Simple base64 decode of JWT payload (middle part)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = atob(paddedPayload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

// Helper function to check if token is expired
function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);
  const [, navigate] = useLocation();
  const [location] = useLocation();
  
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [paperTradingAccount, setPaperTradingAccount] = useState<PaperTradingAccount | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Start as loading
  const [isLoadingPaperAccount, setIsLoadingPaperAccount] = useState(false);
  const [isUserReady, setIsUserReady] = useState(false); // Start as not ready
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(location);

  // Initial token and user loading effect
  useEffect(() => {
    if (skipInitialize) {
      skipInitialize = false; // reset for next mount
      return;
    }

    const initializeAuth = async () => {
      console.log('🔄 Initializing auth state...');
      setIsLoadingUser(true);
      setIsUserReady(false);
      
      try {
        const token = getAccessToken();
        
        if (!token) {
          console.log('📭 No token found');
          setUser(null);
          setIsAuthenticated(false);
          setIsUserReady(true);
          return;
        }

        if (isTokenExpired(token)) {
          console.log('⏰ Token expired, clearing auth');
          clearAccessToken();
          setUser(null);
          setIsAuthenticated(false);
          setIsUserReady(true);
          return;
        }

        console.log('🔑 Valid token found, fetching user...');
        
        // Fetch user data
        const response = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          console.log('🚨 Token invalid (401), clearing auth');
          clearAccessToken();
          setUser(null);
          setIsAuthenticated(false);
          setIsUserReady(true);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`);
        }

        const userData = await response.json();
        console.log('✅ User loaded:', { email: userData.email, hasCompletedOnboarding: userData.hasCompletedOnboarding });
        
        setUser(userData);
        setIsAuthenticated(true);
        setIsUserReady(true);

      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        clearAccessToken();
        setUser(null);
        setIsAuthenticated(false);
        setError(error instanceof Error ? error : new Error('Authentication failed'));
        setIsUserReady(true);
      } finally {
        setIsLoadingUser(false);
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  // Fetch paper trading account (only if user is loaded and onboarded)
  const { 
    data: paperAccountData, 
    error: paperAccountError,
    isLoading: isLoadingPaperAccountRaw,
    refetch: refetchPaperAccount
  } = useQuery({
    queryKey: ['/api/user/paper-trading-account'],
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
    enabled: !!user?.id && isAuthenticated,
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Update paper trading account state
  useEffect(() => {
    setPaperTradingAccount(paperAccountData || null);
    setIsLoadingPaperAccount(Boolean(isLoadingPaperAccountRaw));
  }, [paperAccountData, isLoadingPaperAccountRaw]);

  // Force refetch paper trading account when user state changes after login
  useEffect(() => {
    if (user && user.hasCompletedOnboarding && isAuthenticated && !isPublicRoute) {
      console.log('🔄 User state changed - refetching paper trading account');
      refetchPaperAccount();
    }
  }, [user?.hasCompletedOnboarding, user?.id, isAuthenticated, refetchPaperAccount]);

  // Handle session expiry
  const handleSessionExpiry = () => {
    console.log('🚨 Session expired, clearing auth state');
    clearAccessToken();
    queryClient.clear();
    setError(null);
    setUser(null);
    setIsAuthenticated(false);
    setPaperTradingAccount(null);
    if (!isPublicRoute) {
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      navigate('/login');
    }
  };

  // Handle auth errors
  useEffect(() => {
    if (paperAccountError) {
      const errorStatus = (paperAccountError as any)?.status;
      
      if (errorStatus === 401) {
        handleSessionExpiry();
      } else {
        console.error('Auth error:', paperAccountError);
        setError(paperAccountError instanceof Error ? paperAccountError : new Error('Authentication error'));
      }
    }
  }, [paperAccountError, isPublicRoute, navigate]);

  // Compute auth state
  const authState: AuthState = {
    user,
    paperTradingAccount,
    isLoadingUser,
    isLoadingPaperAccount,
    isLoading: isLoadingUser || (!!user?.hasCompletedOnboarding && isLoadingPaperAccount),
    isAuthenticated,
    hasCompletedOnboarding: !!user?.hasCompletedOnboarding,
    hasPaperTradingAccount: !!paperTradingAccount,
    isUserReady: isUserReady && (!!user?.hasCompletedOnboarding || !isLoadingPaperAccount),
    error,
  };

  // Debug logging function with detailed state info
  const debugAuthState = () => {
    console.log('🧠 Auth Debug:', {
      user: user?.email,
      onboarded: user?.hasCompletedOnboarding,
      paperTradingAccount,
      hasPaperTradingAccount: !!paperTradingAccount,
      isLoadingPaperAccount,
      redirectTarget: getRedirectPath(),
    });

    console.log('🔍 AUTH STATE DEBUG:', {
      location,
      hasToken: !!getAccessToken(),
      isPublicRoute,
      authState: {
        isAuthenticated: authState.isAuthenticated,
        hasCompletedOnboarding: authState.hasCompletedOnboarding,
        hasPaperTradingAccount: authState.hasPaperTradingAccount,
        isLoading: authState.isLoading,
        isUserReady: authState.isUserReady,
        isLoadingPaperAccount: authState.isLoadingPaperAccount,
      },
      user: user ? {
        id: user.id,
        email: user.email,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      } : null,
      paperTradingAccount: paperTradingAccount ? {
        id: paperTradingAccount.id,
        name: paperTradingAccount.name,
      } : null,
      paperAccountQuery: {
        isLoading: authState.isLoadingPaperAccount,
        error: paperAccountError?.message,
        data: paperTradingAccount ? 'Account exists' : 'No account',
      },
      redirectDecision: {
        targetPath: getRedirectPath(),
        shouldRedirectFromCurrent: shouldRedirect(location),
      }
    });
  };

  // Get redirect path based on user state
  const getRedirectPath = (): string => {
    if (!authState.isAuthenticated) {
      return '/login';
    }
    
    if (!authState.hasCompletedOnboarding) {
      console.log('🧭 User needs onboarding');
      return '/onboarding';
    }
    
    if (!isLoadingUser && !authState.hasPaperTradingAccount) {
      console.log('🧭 User needs paper trading account');
      return '/paper-trading/new';
    }
    
    // User is fully set up - direct them to dashboard as default
    console.log('🧭 User is fully set up - directing to dashboard');
    return '/dashboard';
  };

  // Check if current path requires redirect
  const shouldRedirect = (currentPath: string): boolean => {
    if (isPublicRoute) return false;
    
    // Don't redirect while any required data is loading
    // For onboarded users, we must wait for paper account query to complete
    if (!authState.isUserReady) {
      console.log('⏳ Waiting for user data to be ready before redirecting', {
        isLoadingUser,
        isLoadingPaperAccount: authState.isLoadingPaperAccount,
        hasCompletedOnboarding: authState.hasCompletedOnboarding,
        isUserReady: authState.isUserReady
      });
      return false;
    }
    
    // User state redirect logic
    const needsAuth = !authState.isAuthenticated;
    const needsOnboarding = authState.isAuthenticated && !authState.hasCompletedOnboarding;
    const needsPaperAccount = authState.isAuthenticated && 
                              authState.hasCompletedOnboarding && 
                              !authState.hasPaperTradingAccount && 
                              !authState.isLoadingPaperAccount;
    
    // For fully setup users, only redirect if they're on an inappropriate page
    const isFullySetup = authState.isAuthenticated && 
                         authState.hasCompletedOnboarding && 
                         authState.hasPaperTradingAccount;
    
    const inappropriatePages = ['/login', '/register', '/onboarding', '/paper-trading/new'];
    const needsRedirectFromInappropriatePage = isFullySetup && inappropriatePages.includes(currentPath);
    
    const needsRedirect = needsAuth || needsOnboarding || needsPaperAccount || needsRedirectFromInappropriatePage;
    
    console.log("🔎 shouldRedirect details:", {
      needsAuth,
      needsOnboarding,
      needsPaperAccount,
      needsRedirectFromInappropriatePage,
    });
    
    if (needsRedirect) {
      const targetPath = getRedirectPath();
      console.log(`🔄 Redirect needed: ${currentPath} → ${targetPath}`, {
        needsAuth,
        needsOnboarding,
        needsPaperAccount,
        needsRedirectFromInappropriatePage,
        isFullySetup,
        hasPaperTradingAccount: authState.hasPaperTradingAccount,
        paperAccountExists: !!paperTradingAccount,
        isLoadingPaperAccount: authState.isLoadingPaperAccount
      });
    } else {
      console.log(`✅ User can stay on current page: ${currentPath}`);
    }
    
    return needsRedirect;
  };

  // Auto-redirect based on user state
  useEffect(() => {
    console.log("🔍 Auth redirect check triggered:");
    console.log("location =", location);
    console.log("authState =", authState);
    
    const PUBLIC_ROUTES = ['/login', '/register', '/reset-password'];
    const isPublicRoute = PUBLIC_ROUTES.includes(location);
    
    if (isPublicRoute) return;
    
    if (location === '/onboarding' && authState.isAuthenticated && !authState.hasCompletedOnboarding) {
      // Already on the correct screen, no redirect needed
      return;
    }
    
    console.log("Evaluating shouldRedirect for location:", location);
    console.log("shouldRedirect result =", shouldRedirect(location));
    
    if (shouldRedirect(location)) {
      const targetPath = getRedirectPath();
      console.log(`🔄 Auto-redirecting from ${location} to ${targetPath}`, {
        authState: {
          isUserReady: authState.isUserReady,
          hasCompletedOnboarding: authState.hasCompletedOnboarding,
          hasPaperTradingAccount: authState.hasPaperTradingAccount,
          isLoadingPaperAccount: authState.isLoadingPaperAccount
        }
      });
      navigate(targetPath);
    }
  }, [authState.isUserReady, authState.hasCompletedOnboarding, authState.hasPaperTradingAccount, location, navigate]);

  // Debug on state changes
  useEffect(() => {
    if (!isPublicRoute && !!getAccessToken()) {
      debugAuthState();
    }
  }, [location, authState.isAuthenticated, authState.hasCompletedOnboarding, authState.hasPaperTradingAccount, authState.isLoadingPaperAccount]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setError(null);
      console.log('🔑 Starting login for:', credentials.email);
      
      const data = await apiRequest('POST', '/api/login', credentials);
      
      if (!data?.access_token) {
        throw new Error('No access token received');
      }
      
      console.log("🧠 Post-login user:", data);
      
      // Store token and update state
      setAccessToken(data.access_token);
      skipInitialize = true;
      
      // Fetch user profile from /api/user/me
      const userResponse = await fetch("/api/user/me", {
        headers: {
          Authorization: 'Bearer ' + data.access_token
        }
      });
      const userFromMe = await userResponse.json();
      
      console.log("🧠 Fetched user after login:", userFromMe);
      
      setUser(userFromMe);
      setIsAuthenticated(true);
      setIsUserReady(true); // ✅ This is the missing piece
      console.log("✅ Fetched user after login:", userFromMe);
      
      console.log("✅ Auth ready after login");
      
      console.log('✅ Login successful for:', userFromMe);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      // If user has completed onboarding, immediately fetch paper trading account
      if (userFromMe?.hasCompletedOnboarding) {
        console.log('🔁 Forcing refetch of paper trading account after login...');
        const paperAccountResult = await refetchPaperAccount();
        console.log('✅ Paper trading account refetch completed:', {
          success: !!paperAccountResult.data,
          accountExists: !!paperAccountResult.data,
          error: paperAccountResult.error?.message
        });
      }
      
      // Navigation will be handled by auto-redirect effect
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setError(error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await apiRequest('POST', '/api/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAccessToken();
      queryClient.clear();
      setUser(null);
      setIsAuthenticated(false);
      setPaperTradingAccount(null);
      setError(null);
      navigate('/login');
    }
  };

  // Update preferences function
  const updatePreferences = async (preferences: { preferredCurrency: string }) => {
    try {
      const data = await apiRequest('POST', '/api/user/preferences', preferences);
      // Update user state with new preferences
      if (user) {
        setUser({ ...user, ...preferences });
      }
      return data;
    } catch (err: any) {
      if (err?.status === 401) {
        handleSessionExpiry();
      }
      throw err;
    }
  };

  // Complete onboarding function
  const completeOnboarding = async () => {
    try {
      console.log('🎯 Completing onboarding...');
      const data = await apiRequest('POST', '/api/user/onboarding-complete', {
        hasCompletedOnboarding: true
      });
      
      // Update user state with completed onboarding
      if (user) {
        setUser({ ...user, hasCompletedOnboarding: true, onboardingCompletedAt: new Date().toISOString() });
      }
      
      console.log('✅ Onboarding completed successfully');
      return data;
    } catch (err: any) {
      console.error('❌ Onboarding completion failed:', err);
      if (err?.status === 401) {
        handleSessionExpiry();
      }
      throw err;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updatePreferences,
    completeOnboarding,
    debugAuthState,
    getRedirectPath,
    shouldRedirect,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
