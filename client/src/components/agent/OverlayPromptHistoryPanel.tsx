import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const OverlayPromptHistoryPanel: React.FC = () => {
  // TODO: Replace with real overlay prompt log data
  const isLoading = false;
  const error = false;
  const prompts = null; // No mock data

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Overlay Prompt History</CardTitle>
        <CardDescription>
          View all past overlay prompts and user decisions. Filter by asset, overlay, or outcome.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading prompt history</span>
        ) : !prompts ? (
          <span className="text-muted-foreground">No overlay prompts logged yet</span>
        ) : (
          <div>
            {/* TODO: Render prompt list and summary chart */}
            <span>Prompt history and chart go here</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OverlayPromptHistoryPanel; 