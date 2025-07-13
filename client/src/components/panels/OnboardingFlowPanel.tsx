import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  User,
  Target,
  Layers,
  Brain,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  ArrowDown,
  Shield,
  TrendingUp,
  Eye,
  Settings,
  Zap
} from 'lucide-react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useAuth } from '../../hooks/useAuth';
import OnboardingFlowService, {
  useOnboardingState,
  useStrategyOverlays,
  useRebalanceRecommendations,
  useOnboardingProgress,
  useCompleteOnboarding,
  PERSONAS,
  INTENTS,
  TOTAL_STEPS,
  getPersonaById,
  getIntentById,
  type OnboardingState,
  type StrategyOverlay,
  type PersonaOption,
  type IntentOption
} from '../../services/onboardingFlowService';

// Add icons to personas and intents
const PERSONAS_WITH_ICONS: PersonaOption[] = PERSONAS.map(persona => ({
  ...persona,
  icon: persona.id === 'observer' ? <Eye className="h-6 w-6" /> :
        persona.id === 'operator' ? <Settings className="h-6 w-6" /> :
        <Zap className="h-6 w-6" />
}));

const INTENTS_WITH_ICONS: IntentOption[] = INTENTS.map(intent => ({
  ...intent,
  icon: intent.id === 'growth' ? <TrendingUp className="h-6 w-6" /> :
        intent.id === 'stability' ? <Shield className="h-6 w-6" /> :
        <Brain className="h-6 w-6" />
}));

export const OnboardingFlowPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const { state, updateState } = useOnboardingState();
  
  // React Query hooks
  const { data: overlayData } = useStrategyOverlays(
    activeVaultId, 
    !!user && !!activeVaultId && state.currentStep === 3
  );
  
  const { data: rebalanceData } = useRebalanceRecommendations(
    activeVaultId, 
    !!user && !!activeVaultId && state.currentStep === 5
  );
  
  const onboardingProgressMutation = useOnboardingProgress(user?.id || 0);
  const completeOnboardingMutation = useCompleteOnboarding(user?.id || 0);

  // Event handlers using service
  const handlePersonaSelection = (persona: 'observer' | 'operator' | 'sovereign') => {
    const newState = OnboardingFlowService.selectPersona(state, persona);
    updateState(newState);
    if (user) {
      onboardingProgressMutation.mutate(newState);
    }
  };

  const handleIntentSelection = (intent: 'growth' | 'stability' | 'autonomy') => {
    const newState = OnboardingFlowService.selectIntent(state, intent);
    updateState(newState);
    if (user) {
      onboardingProgressMutation.mutate(newState);
    }
  };

  const handleOverlayToggle = (overlayId: string) => {
    const newState = OnboardingFlowService.toggleOverlay(state, overlayId);
    updateState(newState);
  };

  const handleConfirmOverlays = () => {
    const newState = OnboardingFlowService.confirmOverlays(state);
    updateState(newState);
    if (user) {
      onboardingProgressMutation.mutate(newState);
    }
  };

  const handleCompleteGPTWizard = () => {
    const newState = OnboardingFlowService.completeGPTWizard(state);
    updateState(newState);
    if (user) {
      onboardingProgressMutation.mutate(newState);
    }
  };

  const handleCompleteOnboarding = () => {
    const newState = OnboardingFlowService.completeOnboarding(state);
    updateState(newState);
    if (user) {
      completeOnboardingMutation.mutate();
    }
  };

  const handleStepNavigation = (stepNumber: number) => {
    const newState = OnboardingFlowService.navigateToStep(state, stepNumber);
    updateState(newState);
  };

  // Calculate progress
  const progressPercentage = OnboardingFlowService.calculateProgress(state.completedSteps);

  // Helper functions for safe access
  const getSelectedPersonaTitle = () => {
    if (!state.persona) return 'None';
    return getPersonaById(state.persona)?.title || 'Unknown';
  };

  const getSelectedIntentTitle = () => {
    if (!state.intent) return 'None';
    return getIntentById(state.intent)?.title || 'Unknown';
  };

  // Step 1: Persona Selection
  const renderStep1 = () => (
    <div className={`space-y-4 ${state.completedSteps.includes(1) && state.currentStep !== 1 ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium">Choose Your Persona</h3>
          <p className="text-sm text-muted-foreground">How do you want to interact with StackMotive?</p>
        </div>
        {state.completedSteps.includes(1) && (
          <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
        )}
      </div>
      
      {(state.currentStep === 1 || !state.completedSteps.includes(1)) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PERSONAS_WITH_ICONS.map((persona) => (
            <div
              key={persona.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                state.persona === persona.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handlePersonaSelection(persona.id)}
            >
              <div className={`p-2 rounded-lg ${persona.color} mb-3 w-fit`}>
                {persona.icon}
              </div>
              <h4 className="font-medium mb-2">{persona.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{persona.description}</p>
              <ul className="text-xs space-y-1">
                {persona.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      
      {state.completedSteps.includes(1) && state.currentStep !== 1 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium">
            Selected: {getSelectedPersonaTitle()}
          </div>
        </div>
      )}
    </div>
  );

  // Step 2: Intent Selection
  const renderStep2 = () => (
    <div className={`space-y-4 ${state.completedSteps.includes(2) && state.currentStep !== 2 ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Target className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-medium">Define Your Intent</h3>
          <p className="text-sm text-muted-foreground">What's your primary investment goal?</p>
        </div>
        {state.completedSteps.includes(2) && (
          <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
        )}
      </div>
      
      {(state.currentStep === 2 || !state.completedSteps.includes(2)) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {INTENTS_WITH_ICONS.map((intent) => (
            <div
              key={intent.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                state.intent === intent.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handleIntentSelection(intent.id)}
            >
              <div className={`p-2 rounded-lg ${intent.color} mb-3 w-fit`}>
                {intent.icon}
              </div>
              <h4 className="font-medium mb-2">{intent.title}</h4>
              <p className="text-sm text-muted-foreground">{intent.description}</p>
            </div>
          ))}
        </div>
      )}
      
      {state.completedSteps.includes(2) && state.currentStep !== 2 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium">
            Selected: {getSelectedIntentTitle()}
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Overlay Preview
  const renderStep3 = () => (
    <div className={`space-y-4 ${state.completedSteps.includes(3) && state.currentStep !== 3 ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Layers className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-medium">Preview Strategy Overlays</h3>
          <p className="text-sm text-muted-foreground">Select overlays that match your intent</p>
        </div>
        {state.completedSteps.includes(3) && (
          <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
        )}
      </div>
      
      {(state.currentStep === 3 || !state.completedSteps.includes(3)) && (
        <div className="space-y-3">
          {overlayData?.overlays && overlayData.overlays.length > 0 ? (
            overlayData.overlays.map((overlay: StrategyOverlay) => (
              <div
                key={overlay.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  state.selectedOverlays.includes(overlay.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => handleOverlayToggle(overlay.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{overlay.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Performance: {overlay.performance >= 0 ? '+' : ''}{overlay.performance?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${overlay.totalValue?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {state.selectedOverlays.includes(overlay.id) ? 'Selected' : 'Available'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Loading strategy overlays...
            </div>
          )}
          
          {state.selectedOverlays.length > 0 && (
            <Button onClick={handleConfirmOverlays} className="w-full">
              Continue with {state.selectedOverlays.length} overlay{state.selectedOverlays.length > 1 ? 's' : ''}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
      
      {state.completedSteps.includes(3) && state.currentStep !== 3 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium">{state.selectedOverlays.length} overlays selected</div>
        </div>
      )}
    </div>
  );

  // Step 4: GPT Onboarding Wizard
  const renderStep4 = () => (
    <div className={`space-y-4 ${state.completedSteps.includes(4) && state.currentStep !== 4 ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Brain className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-medium">AI Portfolio Setup</h3>
          <p className="text-sm text-muted-foreground">Let AI configure your portfolio based on your preferences</p>
        </div>
        {state.completedSteps.includes(4) && (
          <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
        )}
      </div>
      
      {(state.currentStep === 4 || !state.completedSteps.includes(4)) && (
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-6 w-6 text-blue-600" />
              <div>
                <div className="font-medium">GPT Portfolio Wizard</div>
                <div className="text-sm text-muted-foreground">AI-powered portfolio optimization</div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>Based on your selections:</div>
              <ul className="space-y-1 ml-4">
                <li>• Persona: {getSelectedPersonaTitle()}</li>
                <li>• Intent: {getSelectedIntentTitle()}</li>
                <li>• Overlays: {state.selectedOverlays.length} selected</li>
              </ul>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-700">
                  AI will analyze your preferences and optimize your portfolio allocation to match your risk tolerance and investment goals.
                </div>
              </div>
            </div>
            
            <Button onClick={handleCompleteGPTWizard} className="w-full mt-4">
              Configure Portfolio with AI
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
      
      {state.completedSteps.includes(4) && state.currentStep !== 4 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium">AI configuration completed</div>
        </div>
      )}
    </div>
  );

  // Step 5: First Rebalance Alert
  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-medium">Portfolio Ready</h3>
          <p className="text-sm text-muted-foreground">Your portfolio is configured and ready for monitoring</p>
        </div>
      </div>
      
      {rebalanceData && (
        <div className="p-4 border border-border rounded-lg">
          <div className="font-medium mb-2">Rebalance Recommendation</div>
          <div className="text-sm text-muted-foreground mb-3">
            {rebalanceData.hasRecommendation 
              ? `${rebalanceData.reason} - Priority: ${rebalanceData.urgency}`
              : 'Portfolio is well balanced'}
          </div>
          
          {rebalanceData.hasRecommendation && (
            <Badge variant={rebalanceData.urgency === 'high' ? 'destructive' : 'secondary'}>
              {rebalanceData.urgency} priority
            </Badge>
          )}
        </div>
      )}
      
      {!state.isComplete && (
        <Button onClick={handleCompleteOnboarding} className="w-full">
          Complete Setup
          <CheckCircle className="h-4 w-4 ml-2" />
        </Button>
      )}
      
      {state.isComplete && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Onboarding Complete!</span>
          </div>
          <div className="text-sm text-green-600 mt-1">
            Your StackMotive portfolio is now active and ready for trading.
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Portfolio Setup
            {state.isComplete && (
              <Badge variant="default" className="text-xs">
                Complete
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {state.currentStep} of {TOTAL_STEPS}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{state.completedSteps.length}/{TOTAL_STEPS} complete</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Step Navigation */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((step) => (
            <Button
              key={step}
              variant={state.currentStep === step ? 'default' : state.completedSteps.includes(step) ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => handleStepNavigation(step)}
              disabled={step > Math.max(...state.completedSteps, state.currentStep)}
              className="flex-shrink-0"
            >
              {state.completedSteps.includes(step) && <CheckCircle className="h-3 w-3 mr-1" />}
              {step}
            </Button>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {renderStep1()}
          {state.currentStep >= 2 && (
            <>
              {state.currentStep > 2 && <ArrowDown className="h-4 w-4 mx-auto text-muted-foreground" />}
              {renderStep2()}
            </>
          )}
          {state.currentStep >= 3 && (
            <>
              {state.currentStep > 3 && <ArrowDown className="h-4 w-4 mx-auto text-muted-foreground" />}
              {renderStep3()}
            </>
          )}
          {state.currentStep >= 4 && (
            <>
              {state.currentStep > 4 && <ArrowDown className="h-4 w-4 mx-auto text-muted-foreground" />}
              {renderStep4()}
            </>
          )}
          {state.currentStep >= 5 && (
            <>
              <ArrowDown className="h-4 w-4 mx-auto text-muted-foreground" />
              {renderStep5()}
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        {state.currentStep > 1 && !state.isComplete && (
          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => handleStepNavigation(state.currentStep - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-sm text-muted-foreground flex items-center">
              Step {state.currentStep} of {TOTAL_STEPS}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingFlowPanel; 