import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose
}) => {
  const handleGotIt = () => {
    // Set localStorage flag to prevent auto-triggering again
    localStorage.setItem('onboardingSeen', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Welcome to StackMotive
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Your paper trading and portfolio simulation platform
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-gray-700 leading-relaxed">
            Welcome to StackMotive — your paper trading and portfolio simulation platform. Here's a quick guide:
          </p>
          
          <div className="space-y-3 pl-4">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <span className="text-gray-700">Use the sidebar to navigate: Dashboard, Trading, Analytics, Reports</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <span className="text-gray-700">Build your portfolio by placing trades (with virtual funds)</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <span className="text-gray-700">Reports and Tax tabs simulate real-world summaries</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <span className="text-gray-700">You can buy and sell assets via the Trade Panel</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <span className="text-gray-700">Test data simulates 3 days of market activity — log in daily!</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <span className="text-gray-700">Platform works on both desktop and mobile</span>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button 
            onClick={handleGotIt} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Got it — let's trade!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal; 