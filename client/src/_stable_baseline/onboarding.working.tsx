import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import SimpleOnboardingFlow from '@/components/onboarding/SimpleOnboardingFlow';
import { useToast } from '@/hooks/use-toast';

// Import onboarding steps
import StepWelcome from '@/components/onboarding/StepWelcome';
import StepPortfolio from '@/components/onboarding/StepPortfolio';
import StepPersonalInfo from '@/components/onboarding/StepPersonalInfo';
import StepTaxInfo from '@/components/onboarding/StepTaxInfo';
import StepSummary from '@/components/onboarding/StepSummary';

interface OnboardingData {
  // Portfolio fields (Step 2)
  tradingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon?: 'short' | 'medium' | 'long';
  initialInvestment?: number;
  
  // Personal info fields (Step 3)
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  preferredCurrency?: string;
  
  // Tax info fields (Step 4)
  taxResidency?: string;
  taxNumber?: string;
  employmentStatus?: 'employed' | 'self-employed' | 'student' | 'retired' | 'other';
}

const ONBOARDING_STEPS = [
  { id: 1, name: 'Welcome', component: StepWelcome },
  { id: 2, name: 'Portfolio', component: StepPortfolio },
  { id: 3, name: 'Personal Info', component: StepPersonalInfo },
  { id: 4, name: 'Tax Info', component: StepTaxInfo },
  { id: 5, name: 'Summary', component: StepSummary }
];

export default function OnboardingPage() {
  const [_, navigate] = useLocation();
  const { user, isLoading, updatePreferences, completeOnboarding } = useAuth();
  const { toast } = useToast();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // All redirection logic is now handled by the AuthProvider
  // Onboarding page just renders the UI

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      console.log('Completing onboarding with data:', data);
      
      // Save currency preference
      if (data.preferredCurrency) {
        await updatePreferences({ preferredCurrency: data.preferredCurrency });
      }

      // TODO: Save additional onboarding data to backend
      // This would ideally save trading experience, risk tolerance, etc.
      // await apiRequest('POST', '/api/user/onboarding/complete', data);

      // Mark onboarding as complete
      await completeOnboarding();

      // Show success message
      toast({
        title: "Welcome to StackMotive!",
        description: "Your account is now ready to use.",
      });

      // Navigate to dashboard after successful completion
      // navigate('/dashboard'); // Removed - auth context will handle redirect
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SimpleOnboardingFlow
        steps={ONBOARDING_STEPS}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}