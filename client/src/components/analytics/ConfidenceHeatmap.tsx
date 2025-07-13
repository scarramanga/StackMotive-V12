import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const ConfidenceHeatmap: React.FC = () => {
  // TODO: Replace with real confidence score data
  const isLoading = false;
  const error = false;
  const heatmapData = null; // No mock data

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Confidence Heatmap</CardTitle>
        <CardDescription>
          Visual heatmap showing confidence scores across assets and overlays. Flags weak spots in strategy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading heatmap data</span>
        ) : !heatmapData ? (
          <span className="text-muted-foreground">Connect confidence score data to view heatmap</span>
        ) : (
          <div>
            {/* TODO: Render heatmap and flag logic */}
            <span>Heatmap UI goes here</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfidenceHeatmap; 