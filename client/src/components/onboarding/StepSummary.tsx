import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingData {
  // Portfolio data
  tradingExperience?: string;
  riskTolerance?: string;
  investmentHorizon?: string;
  initialInvestment?: number;
  
  // Personal data
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  preferredCurrency?: string;
  
  // Tax data
  taxResidency?: string;
  taxNumber?: string;
  employmentStatus?: string;
}

interface StepSummaryProps {
  data: OnboardingData;
  onComplete: () => Promise<void>;
  onEditStep: (stepNumber: number) => void;
}

const StepSummary: React.FC<StepSummaryProps> = ({ data, onComplete, onEditStep }) => {
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [completionError, setCompletionError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const formatCurrency = (value?: number): string => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatExperience = (experience?: string): string => {
    if (!experience) return 'Not specified';
    return experience.charAt(0).toUpperCase() + experience.slice(1);
  };

  const formatHorizon = (horizon?: string): string => {
    const mapping = {
      short: 'Short Term (< 1 year)',
      medium: 'Medium Term (1-3 years)',
      long: 'Long Term (3+ years)'
    };
    return mapping[horizon as keyof typeof mapping] || horizon || 'Not specified';
  };

  const formatRiskTolerance = (risk?: string): string => {
    if (!risk) return 'Not specified';
    return risk.charAt(0).toUpperCase() + risk.slice(1);
  };

  const formatEmploymentStatus = (status?: string): string => {
    const mapping = {
      'employed': 'Employed',
      'self-employed': 'Self-employed',
      'student': 'Student', 
      'retired': 'Retired',
      'other': 'Other'
    };
    return mapping[status as keyof typeof mapping] || status || 'Not specified';
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    setCompletionError(null);

    try {
      await onComplete();
      
      toast({
        title: "Setup Complete! 🎉",
        description: "Welcome to StackMotive! You're all set to start trading.",
        variant: 'default',
      });

    } catch (error: any) {
      console.error('Onboarding completion error:', error);
      
      const errorMessage = error?.message || error?.detail || 'Failed to complete setup. Please try again.';
      setCompletionError(errorMessage);
      
      toast({
        title: "Setup Error",
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Setup Complete
        </CardTitle>
        <CardDescription>
          Review your information before completing setup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Preferences Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">📊 Portfolio Preferences</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditStep(2)}
              className="flex items-center gap-1"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Trading Experience</p>
              <p className="font-medium">{formatExperience(data.tradingExperience)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Risk Tolerance</p>
              <p className="font-medium">{formatRiskTolerance(data.riskTolerance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Investment Horizon</p>
              <p className="font-medium">{formatHorizon(data.investmentHorizon)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Initial Investment</p>
              <p className="font-medium text-green-600">{formatCurrency(data.initialInvestment)}</p>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">👤 Personal Information</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditStep(3)}
              className="flex items-center gap-1"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{data.fullName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium">{data.phone || 'Not provided'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Preferred Currency</p>
              <Badge variant="secondary" className="mt-1">
                {data.preferredCurrency || 'NZD'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tax Information Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">📋 Tax Information</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditStep(4)}
              className="flex items-center gap-1"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Tax Residency</p>
              <p className="font-medium">{data.taxResidency || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax Number</p>
              <p className="font-medium">{data.taxNumber || 'Not provided'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Employment Status</p>
              <p className="font-medium">{formatEmploymentStatus(data.employmentStatus)}</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {completionError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800">Setup Error</h4>
              <p className="text-sm text-red-700 mt-1">{completionError}</p>
              <p className="text-xs text-red-600 mt-2">
                Please check your internet connection and try again. If the problem persists, contact support.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onEditStep(4)}
            disabled={isCompleting}
            className="flex-1"
          >
            Back to Tax Info
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="flex-1"
          >
            {isCompleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                Completing Setup...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </div>

        {/* Privacy Notice */}
        <div className="text-xs text-muted-foreground text-center p-3 bg-muted/20 rounded">
          🔒 Your information is encrypted and secure. By completing setup, you agree to our{' '}
          <span className="underline cursor-pointer">Terms of Service</span> and{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </div>
      </CardContent>
    </Card>
  );
};

export default StepSummary; 