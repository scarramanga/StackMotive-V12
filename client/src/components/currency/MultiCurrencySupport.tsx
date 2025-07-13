import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CURRENCIES = [
  { id: 'NZD', label: 'NZD' },
  { id: 'AUD', label: 'AUD' },
  { id: 'USD', label: 'USD' },
  { id: 'BTC', label: 'BTC' },
];

export const MultiCurrencySupport: React.FC = () => {
  // TODO: Replace with real FX and portfolio data
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const isLoading = false;
  const error = false;
  const portfolio = null; // No mock data

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Multi-Currency Support</CardTitle>
        <CardDescription>
          View your portfolio in NZD, AUD, USD, or BTC. All values auto-convert using live FX feeds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          {CURRENCIES.map((c) => (
            <Button key={c.id} variant={baseCurrency === c.id ? 'default' : 'outline'} size="sm" onClick={() => setBaseCurrency(c.id)}>
              {c.label}
            </Button>
          ))}
        </div>
        <div className="mb-4">
          <span className="font-semibold text-sm">Total Portfolio Value:</span>
          <div className="mt-2">
            {isLoading ? (
              <span>Loading...</span>
            ) : error ? (
              <span className="text-red-500">Error loading portfolio data</span>
            ) : !portfolio ? (
              <span className="text-muted-foreground">Connect FX feed and portfolio to view values</span>
            ) : (
              <span>Portfolio value goes here</span>
            )}
          </div>
        </div>
        <div>
          <span className="font-semibold text-sm">Per-Asset Converted Values:</span>
          <div className="mt-2">
            {/* TODO: Render per-asset values */}
            <span className="text-muted-foreground">No asset data available</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiCurrencySupport; 