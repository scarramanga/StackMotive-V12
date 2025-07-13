import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const VaultAllocationSummaryPanel: React.FC = () => {
  // TODO: Replace with real vault asset and portfolio data
  const isLoading = false;
  const error = false;
  const vaultData = null; // No mock data

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Vault Allocation Summary</CardTitle>
        <CardDescription>
          Summary of portfolio exposure to vault-grade assets like BTC/gold. Aligns with sovereignty goals and supports target scoring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading vault data</span>
        ) : !vaultData ? (
          <span className="text-muted-foreground">Connect vault and portfolio data to view allocation summary</span>
        ) : (
          <div>
            {/* TODO: Render vault % and alignment scoring/visualisation */}
            <span>Vault allocation and scoring go here</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VaultAllocationSummaryPanel; 