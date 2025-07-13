import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StepWelcomeProps {
  onNext: () => void;
}

const StepWelcome: React.FC<StepWelcomeProps> = ({ onNext }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to StackMotive</CardTitle>
        <CardDescription>
          Let's get you set up with your trading account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            In the next few steps, we'll help you:
          </p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Set up your portfolio preferences</li>
            <li>Configure your personal information</li>
            <li>Set up tax reporting details</li>
            <li>Get ready to start trading</li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">Why this matters:</p>
          <ul className="mt-2 list-disc list-inside text-sm space-y-1">
            <li>Personalized trading experience</li>
            <li>Accurate tax reporting</li>
            <li>Better portfolio tracking</li>
            <li>Tailored market insights</li>
          </ul>
        </div>

        <Button onClick={onNext} className="w-full">
          Let's Get Started
        </Button>
      </CardContent>
    </Card>
  );
};

export default StepWelcome; 