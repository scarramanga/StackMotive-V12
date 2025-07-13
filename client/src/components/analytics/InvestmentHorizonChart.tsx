import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const InvestmentHorizonChart: React.FC = () => {
  // TODO: Replace with real asset metadata and user goal data
  const isLoading = false;
  const error = false;
  const horizonData = null; // No mock data

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Investment Horizon Visual</CardTitle>
        <CardDescription>
          Map your short/mid/long term holdings and align strategy goals. Flags misaligned assets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading horizon data</span>
        ) : !horizonData ? (
          <span className="text-muted-foreground">Connect asset and goal data to view investment horizon</span>
        ) : (
          <div>
            {/* TODO: Render horizon chart/heatmap and misalignment flags */}
            <span>Horizon chart and flags go here</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvestmentHorizonChart; 