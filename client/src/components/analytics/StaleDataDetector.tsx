import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const StaleDataDetector: React.FC = () => {
  // TODO: Replace with real asset/timestamp data from backend
  const staleAssets: any[] | null = null; // No mock data
  const isLoading = false;
  const error = false;

  // TODO: Implement hourly check logic (stub)

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Stale Data Detector</CardTitle>
        <CardDescription>
          Flags assets with outdated data and disables dependent agent prompts. Checks run hourly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading data freshness</span>
        ) : !staleAssets ? (
          <span className="text-muted-foreground">Connect data feed to enable stale data detection</span>
        ) : Array.isArray(staleAssets) && staleAssets.length === 0 ? (
          <span className="text-green-600">All data fresh</span>
        ) : Array.isArray(staleAssets) ? (
          <ul className="space-y-2">
            {Array.isArray(staleAssets) && staleAssets.map((asset: any) => (
              <li key={asset.symbol} className="flex items-center gap-3">
                <span className="font-medium">{asset.symbol}</span>
                <Badge variant="secondary">Stale</Badge>
                <span className="text-xs text-muted-foreground">Last update: {asset.lastUpdated}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted-foreground">Connect data feed to enable stale data detection</span>
        )}
      </CardContent>
    </Card>
  );
};

export default StaleDataDetector; 