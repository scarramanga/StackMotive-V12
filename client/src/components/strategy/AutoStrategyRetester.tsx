import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const AutoStrategyRetester: React.FC = () => {
  // TODO: Replace with real backtest and trigger data
  const isLoading = false;
  const error = false;
  const lastResult = null; // No mock data
  const currentResult = null; // No mock data
  const delta = null; // No mock data

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Auto Strategy Re-tester</CardTitle>
        <CardDescription>
          Agent automatically reruns strategy backtest after new signals or market shifts. Compares results and notifies if deviation exceeds threshold.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Running backtest...</span>
        ) : error ? (
          <span className="text-red-500">Error running backtest</span>
        ) : !lastResult || !currentResult ? (
          <span className="text-muted-foreground">Awaiting trigger event and backtest data</span>
        ) : (
          <div>
            {/* TODO: Render last/current results and delta summary */}
            <span>Backtest results and delta report go here</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoStrategyRetester; 