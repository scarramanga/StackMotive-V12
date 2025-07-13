import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  isComplete: boolean;
  completionPercentage: number;
  welcomeViewed: boolean;
  tradingExperience?: string;
  riskTolerance?: string;
  investmentHorizon?: string;
  initialInvestment?: number;
  tradingFrequency?: string;
  preferredMarkets: string[];
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  preferredCurrency: string;
  dateOfBirth?: string;
  taxResidency?: string;
  secondaryTaxResidency?: string;
  taxIdentificationNumber?: string;
  taxFileNumber?: string;
  employmentStatus?: string;
  taxYearPreference: string;
  taxRegisteredBusiness: boolean;
  helpLevel: string;
  notificationPreferences: Record<string, boolean>;
  privacySettings: Record<string, boolean>;
  connectBrokers: boolean;
  selectedBrokers: string[];
  hasExistingPortfolio: boolean;
  existingPortfolioValue?: number;
  termsAccepted: boolean;
  termsAcceptedAt?: string;
  privacyPolicyAccepted: boolean;
  privacyPolicyAcceptedAt?: string;
  startedAt: string;
  completedAt?: string;
  lastActiveAt: string;
}

interface OnboardingStep {
  stepNumber: number;
  stepName: string;
  stepTitle: string;
  stepDescription: string;
  requiredFields: string[];
  optionalFields: string[];
  componentName: string;
  displayOrder: number;
  isSkippable: boolean;
  minTimeSeconds: number;
  helpText?: string;
  tooltipText?: string;
  exampleData: Record<string, any>;
}

export function OnboardingFlow() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<Record<string, any>>({
    // Portfolio preferences (Step 2)
    tradingExperience: '',
    riskTolerance: '',
    investmentHorizon: '',
    initialInvestment: 25000,
    tradingFrequency: 'weekly',
    preferredMarkets: [],
    
    // Personal info (Step 3)
    fullName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    preferredCurrency: 'NZD',
    dateOfBirth: '',
    
    // Tax info (Step 4)
    taxResidency: '',
    secondaryTaxResidency: '',
    taxIdentificationNumber: '',
    taxFileNumber: '',
    employmentStatus: '',
    taxYearPreference: 'calendar',
    taxRegisteredBusiness: false,
    
    // Final step
    termsAccepted: false
  });

  // Load onboarding progress and steps on mount
  useEffect(() => {
    fetchOnboardingData();
  }, []);

  const fetchOnboardingData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch onboarding progress and steps in parallel
      const [progressResponse, stepsResponse] = await Promise.all([
        fetch('/api/onboarding/progress'),
        fetch('/api/onboarding/steps')
      ]);
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgress(progressData);
        setCurrentStep(progressData.currentStep);
        
        // Populate form data with existing progress
        setFormData(prev => ({
          ...prev,
          tradingExperience: progressData.tradingExperience || '',
          riskTolerance: progressData.riskTolerance || '',
          investmentHorizon: progressData.investmentHorizon || '',
          initialInvestment: progressData.initialInvestment || 25000,
          tradingFrequency: progressData.tradingFrequency || 'weekly',
          preferredMarkets: progressData.preferredMarkets || [],
          fullName: progressData.fullName || '',
          firstName: progressData.firstName || '',
          lastName: progressData.lastName || '',
          phoneNumber: progressData.phoneNumber || '',
          preferredCurrency: progressData.preferredCurrency || 'NZD',
          dateOfBirth: progressData.dateOfBirth || '',
          taxResidency: progressData.taxResidency || '',
          secondaryTaxResidency: progressData.secondaryTaxResidency || '',
          taxIdentificationNumber: progressData.taxIdentificationNumber || '',
          taxFileNumber: progressData.taxFileNumber || '',
          employmentStatus: progressData.employmentStatus || '',
          taxYearPreference: progressData.taxYearPreference || 'calendar',
          taxRegisteredBusiness: progressData.taxRegisteredBusiness || false,
          termsAccepted: progressData.termsAccepted || false
        }));
        
        // Show resume prompt if user has started but not completed
        if (progressData.currentStep > 1 && !progressData.isComplete) {
          setShowResumePrompt(true);
        }
        
        // Redirect if already completed
        if (progressData.isComplete) {
          navigate('/dashboard');
          return;
        }
      }
      
      if (stepsResponse.ok) {
        const stepsData = await stepsResponse.json();
        setSteps(stepsData);
      }
      
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
      toast({
        title: "Error",
        description: "Failed to load onboarding data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (stepNumber: number): boolean => {
    const step = steps.find(s => s.stepNumber === stepNumber);
    if (!step) return true;
    
    // Check required fields
    for (const field of step.requiredFields) {
      const value = formData[field];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        toast({
          title: "Validation Error",
          description: `Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const saveStepProgress = async (stepNumber: number) => {
    try {
      setIsSaving(true);
      
      const stepData = {
        stepNumber,
        ...formData
      };
      
      const response = await fetch('/api/onboarding/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stepData)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update progress
        await fetchOnboardingData();
        
        return true;
      } else {
        throw new Error('Failed to save step progress');
      }
      
    } catch (error) {
      console.error('Error saving step progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    // Validate current step
    if (!validateStep(currentStep)) {
      return;
    }
    
    // Save progress
    const saved = await saveStepProgress(currentStep);
    if (!saved) return;
    
    setTransitioning(true);
    
    setTimeout(() => {
      setTransitioning(false);
      
      if (currentStep >= 5) {
        // Complete onboarding
        completeOnboarding();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }, 350);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setTransitioning(true);
      setTimeout(() => {
        setTransitioning(false);
        setCurrentStep(currentStep - 1);
      }, 350);
    }
  };

  const completeOnboarding = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finalData: formData,
          completedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        toast({
          title: "Welcome to StackMotive!",
          description: "Your account setup is complete. Redirecting to dashboard...",
        });
        
        // Brief delay then redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('Failed to complete onboarding');
      }
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResume = () => {
    setShowResumePrompt(false);
  };

  const handleRestart = async () => {
    try {
      const response = await fetch('/api/onboarding/reset', {
        method: 'POST'
      });
      
      if (response.ok) {
        setShowResumePrompt(false);
        setCurrentStep(1);
        setFormData({
          tradingExperience: '',
          riskTolerance: '',
          investmentHorizon: '',
          initialInvestment: 25000,
          tradingFrequency: 'weekly',
          preferredMarkets: [],
          fullName: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          preferredCurrency: 'NZD',
          dateOfBirth: '',
          taxResidency: '',
          secondaryTaxResidency: '',
          taxIdentificationNumber: '',
          taxFileNumber: '',
          employmentStatus: '',
          taxYearPreference: 'calendar',
          taxRegisteredBusiness: false,
          termsAccepted: false
        });
        await fetchOnboardingData();
      }
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Welcome to StackMotive</h3>
              <p className="text-muted-foreground">
                Let's set up your account to provide you with personalized trading insights and portfolio management.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What we'll cover:</h4>
              <ul className="text-sm text-left space-y-1">
                <li>• Trading experience and preferences</li>
                <li>• Personal information for tax reporting</li>
                <li>• Risk tolerance and investment goals</li>
                <li>• Platform configuration</li>
              </ul>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Portfolio Preferences</h3>
              <p className="text-muted-foreground">Tell us about your trading style and investment approach</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Trading Experience *</label>
                <Select value={formData.tradingExperience} onValueChange={(value) => updateFormData('tradingExperience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                    <SelectItem value="expert">Expert (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Risk Tolerance *</label>
                <Select value={formData.riskTolerance} onValueChange={(value) => updateFormData('riskTolerance', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Investment Horizon *</label>
                <Select value={formData.investmentHorizon} onValueChange={(value) => updateFormData('investmentHorizon', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time horizon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short-term (&lt; 1 year)</SelectItem>
                    <SelectItem value="medium">Medium-term (1-3 years)</SelectItem>
                    <SelectItem value="long">Long-term (3+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Trading Frequency</label>
                <Select value={formData.tradingFrequency} onValueChange={(value) => updateFormData('tradingFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How often do you trade?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Initial Investment Amount</label>
              <div className="px-3">
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="1000"
                  value={formData.initialInvestment}
                  onChange={(e) => updateFormData('initialInvestment', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>$1,000</span>
                  <span className="font-medium">${formData.initialInvestment?.toLocaleString()}</span>
                  <span>$1,000,000</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <p className="text-muted-foreground">Help us personalize your experience</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Full Name *</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                  placeholder="+64 21 123 4567"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Preferred Currency *</label>
                <Select value={formData.preferredCurrency} onValueChange={(value) => updateFormData('preferredCurrency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NZD">NZD - New Zealand Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tax Information</h3>
              <p className="text-muted-foreground">Configure tax settings for accurate reporting</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tax Residency *</label>
                <Input
                  value={formData.taxResidency}
                  onChange={(e) => updateFormData('taxResidency', e.target.value)}
                  placeholder="e.g., New Zealand"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Employment Status *</label>
                <Select value={formData.employmentStatus} onValueChange={(value) => updateFormData('employmentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self_employed">Self-employed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Tax Identification Number</label>
                <Input
                  value={formData.taxIdentificationNumber}
                  onChange={(e) => updateFormData('taxIdentificationNumber', e.target.value)}
                  placeholder="e.g., IRD number"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Tax File Number</label>
                <Input
                  value={formData.taxFileNumber}
                  onChange={(e) => updateFormData('taxFileNumber', e.target.value)}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Tax Year Preference</label>
                <Select value={formData.taxYearPreference} onValueChange={(value) => updateFormData('taxYearPreference', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calendar">Calendar Year (Jan-Dec)</SelectItem>
                    <SelectItem value="nz_fiscal">NZ Fiscal Year (Apr-Mar)</SelectItem>
                    <SelectItem value="au_fiscal">AU Fiscal Year (Jul-Jun)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Review & Complete</h3>
              <p className="text-muted-foreground">Review your information and complete setup</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">📊 Portfolio Preferences</h4>
                <div className="text-sm space-y-1">
                  <div>Experience: {formData.tradingExperience}</div>
                  <div>Risk Tolerance: {formData.riskTolerance}</div>
                  <div>Investment Horizon: {formData.investmentHorizon}</div>
                  <div>Initial Investment: ${formData.initialInvestment?.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">👤 Personal Details</h4>
                <div className="text-sm space-y-1">
                  <div>Name: {formData.fullName}</div>
                  <div>Currency: {formData.preferredCurrency}</div>
                  {formData.phoneNumber && <div>Phone: {formData.phoneNumber}</div>}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">📋 Tax Information</h4>
                <div className="text-sm space-y-1">
                  <div>Residency: {formData.taxResidency}</div>
                  <div>Employment: {formData.employmentStatus}</div>
                  <div>Tax Year: {formData.taxYearPreference}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="terms" className="text-sm">
                  I accept the Terms of Service and Privacy Policy
                </label>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading onboarding...</span>
        </div>
      </div>
    );
  }

  // Don't render if onboarding is complete
  if (progress?.isComplete) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Resume prompt */}
      {showResumePrompt && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border border-yellow-400 rounded-lg shadow-lg p-6 z-[101] flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="font-semibold mb-2">Resume your onboarding?</p>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            You're on step {currentStep} of 5. Continue where you left off or start fresh.
          </p>
          <div className="flex gap-2">
            <Button variant="default" onClick={handleResume}>Resume Setup</Button>
            <Button variant="outline" onClick={handleRestart}>Start Over</Button>
          </div>
        </div>
      )}
      
      <Card className={`w-full max-w-2xl transition-opacity duration-300 ${transitioning ? 'opacity-50' : 'opacity-100'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {steps.find(s => s.stepNumber === currentStep)?.stepTitle || `Step ${currentStep}`}
              </CardTitle>
              <CardDescription>
                {steps.find(s => s.stepNumber === currentStep)?.stepDescription || "Complete your onboarding"}
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 5
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? <Check className="w-4 h-4" /> : step}
              </div>
            ))}
          </div>
          
          <Progress value={((currentStep - 1) / 4) * 100} className="mt-2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSaving}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isSaving || transitioning}
              className="flex items-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === 5 ? (
                <>
                  Complete Setup
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Progress info */}
      {progress && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-muted-foreground">
            Progress: {progress.completionPercentage.toFixed(0)}% complete
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {progress.completedSteps.length} of 5 steps finished
          </div>
        </div>
      )}
    </div>
  );
} 