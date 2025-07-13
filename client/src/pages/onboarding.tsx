// 🔐 STACKMOTIVE STABLE STATE LOCK (DO NOT EDIT BELOW THIS LINE)
// This file was confirmed stable on: 2025-06-08
// Covered: AuthProvider, Onboarding Redirect, Paper Trading Setup, Dashboard Gate
// Use only Cursor-pinned prompts to modify

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';

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

const OnboardingPage: React.FC = () => {
  const [location, navigate] = useLocation();
  return (
    <OnboardingWizard onComplete={() => navigate('/dashboard')} />
  );
};

export default OnboardingPage;