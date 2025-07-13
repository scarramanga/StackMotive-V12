import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const StrategyRotationVisualiser: React.FC = () => {
  // TODO: Replace with real rotation event data
  const rotationEvents = null; // No mock data
  const isLoading = false;
  const error = false;

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Strategy Rotation Visualiser</CardTitle>
        <CardDescription>
          Animated timeline of overlay shifts by category. Hover for rationale and event date. Fully responsive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full flex items-center justify-center bg-muted/20 rounded">
          {isLoading ? (
            <span>Loading...</span>
          ) : error ? (
            <span className="text-red-500">Error loading rotation data</span>
          ) : !rotationEvents ? (
            <span className="text-muted-foreground">Connect rotation tracker to view strategy rotation history</span>
          ) : (
            <span>Timeline visual goes here</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyRotationVisualiser; 