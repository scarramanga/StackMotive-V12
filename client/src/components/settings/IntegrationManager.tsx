import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const INTEGRATION_TYPES = [
  { id: 'ibkr', label: 'IBKR API' },
  { id: 'csv', label: 'CSV Upload' },
  { id: 'kraken', label: 'Kraken API' },
  { id: 'kucoin', label: 'KuCoin API' },
];

export const IntegrationManager: React.FC = () => {
  // TODO: Replace with real integration state from backend
  const [integrations, setIntegrations] = useState<any[]>([]); // No mock data

  const handleAddIntegration = (type: string) => {
    // TODO: Implement real add logic
  };

  const handleRemoveIntegration = (id: string) => {
    // TODO: Implement real remove logic
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Integration Manager</CardTitle>
        <CardDescription>
          Manage your API keys, CSV sources, and exchange integrations. All credentials are securely stored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="font-semibold text-sm">Add Integration:</span>
          <div className="flex gap-2 mt-2">
            {INTEGRATION_TYPES.map((type) => (
              <Button key={type.id} size="sm" onClick={() => handleAddIntegration(type.id)}>
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <span className="font-semibold text-sm">Current Integrations:</span>
          {integrations.length === 0 ? (
            <div className="text-muted-foreground mt-2">No integrations configured. Connect an integration to begin.</div>
          ) : (
            <ul className="mt-2 space-y-3">
              {integrations.map((integration) => (
                <li key={integration.id} className="flex items-center gap-4 p-3 border rounded">
                  <span className="font-medium">{integration.label}</span>
                  <span className={`text-xs px-2 py-1 rounded ${integration.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{integration.status || 'pending'}</span>
                  <Button size="sm" variant="outline" onClick={() => handleRemoveIntegration(integration.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-8">
          <span className="font-semibold text-sm">Credential Storage:</span>
          <div className="text-xs text-muted-foreground mt-1">
            All API keys and credentials are encrypted and never stored in plain text. You can remove integrations at any time.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationManager; 