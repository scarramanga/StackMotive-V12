export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  createdAt: string;
  lastLogin?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionTier: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  role: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  onboardingComplete: boolean;
  onboardingStep: number;
  taxResidency?: string;
  secondaryTaxResidency?: string;
  taxIdentificationNumber?: string;
  taxFileNumber?: string;
  taxRegisteredBusiness: boolean;
  taxYear?: string;
} 