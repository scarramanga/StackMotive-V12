import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const AssetKillSwitch: React.FC = () => {
  // TODO: Replace with real asset metadata and status
  const isLoading = false;
  const error = false;
  const asset = null; // No mock data

  const handleKill = () => {
    // TODO: Implement kill switch logic
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Asset Kill Switch</CardTitle>
        <CardDescription>
          Instantly remove toxic or blacklisted assets. Disables signals and triggers rebalance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading asset data</span>
        ) : !asset ? (
          <span className="text-muted-foreground">Select an asset to enable kill switch</span>
        ) : (
          <Button variant="destructive" onClick={handleKill}>Kill Asset</Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetKillSwitch; 