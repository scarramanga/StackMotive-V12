import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AllocationChangeSummary: React.FC = () => {
  // TODO: Replace with real allocation diff and rationale from overlay engine
  const changes = null; // No mock data
  const isLoading = false;
  const error = false;

  const handleExport = (type: 'pdf' | 'csv') => {
    // TODO: Implement real export logic
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Allocation Change Summary</CardTitle>
        <CardDescription>
          Review and export a summary of recent allocation changes, rationale, and projected impact.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading allocation changes</span>
        ) : !changes ? (
          <span className="text-muted-foreground">Connect overlay engine to view allocation change summary</span>
        ) : (
          <div>
            {/* TODO: Render allocation change table and rationale */}
            <span>Change log goes here</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => handleExport('pdf')}>Export PDF</Button>
        <Button variant="outline" onClick={() => handleExport('csv')}>Export CSV</Button>
      </CardFooter>
    </Card>
  );
};

export default AllocationChangeSummary; 