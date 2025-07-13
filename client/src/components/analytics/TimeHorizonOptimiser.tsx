import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const TimeHorizonOptimiser: React.FC = () => {
  // TODO: Replace with real backtest and overlay data
  const isLoading = false;
  const error = false;
  const optimisation = null; // No mock data

  const handleExport = () => {
    // TODO: Implement export logic
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Time Horizon Optimiser</CardTitle>
        <CardDescription>
          Agent evaluates strategy performance over varying holding periods and suggests optimal DCA/rebalance schedule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {/* TODO: Integrate real input controls for data window and overlay selection */}
        </div>
        <div className="mb-4">
          {isLoading ? (
            <span>Optimising...</span>
          ) : error ? (
            <span className="text-red-500">Error running optimisation</span>
          ) : !optimisation ? (
            <span className="text-muted-foreground">Configure parameters and run optimisation</span>
          ) : (
            <span>Optimisation results go here</span>
          )}
        </div>
        <Button variant="outline" onClick={handleExport}>Export Analysis</Button>
      </CardContent>
    </Card>
  );
};

export default TimeHorizonOptimiser; 