import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const RebalanceIntentLogger: React.FC = () => {
  // TODO: Replace with real rebalance prompt and log data
  const isLoading = false;
  const error = false;
  const intentLog = null; // No mock data

  const handleExport = () => {
    // TODO: Implement export logic
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Rebalance Intent Logging</CardTitle>
        <CardDescription>
          Logs when a rebalance was considered but not actioned. Captures user/agent reasoning and appears in journal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading intent log</span>
        ) : !intentLog ? (
          <span className="text-muted-foreground">No rebalance intent events logged yet</span>
        ) : (
          <div>
            {/* TODO: Render intent log, journal view, and export */}
            <Button variant="outline" onClick={handleExport}>Export Log</Button>
            <div className="mt-4">Intent log entries go here</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RebalanceIntentLogger; 