import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AgentOverlayPanel: React.FC = () => {
  // TODO: Replace with real overlay config and agent output
  const isLoading = false;
  const error = false;
  const overlayConfig = null; // No mock data
  const agentOutput = null; // No mock data

  const handleEdit = () => {
    // TODO: Implement edit logic
  };
  const handlePreview = () => {
    // TODO: Implement preview logic
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Agent Overlay Panel</CardTitle>
        <CardDescription>
          Configure and view AI overlay output. Edit overlays and preview impact in real time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading overlay data</span>
        ) : !overlayConfig ? (
          <span className="text-muted-foreground">Connect overlay config to begin editing</span>
        ) : (
          <div>
            {/* TODO: Render editable overlay config and live preview */}
            <Button variant="outline" onClick={handleEdit}>Edit Overlay</Button>
            <Button variant="default" onClick={handlePreview} className="ml-2">Preview Impact</Button>
            <div className="mt-4">Live preview goes here</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentOverlayPanel; 