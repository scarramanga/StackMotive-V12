import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Navigation } from 'lucide-react';
import { NavigationTester } from '@/components/test-navigation';

export default function NavigationTestPage() {
  const [location] = useLocation();
  
  return (
    <div className='p-4'>
      <div className="container mx-auto py-6 space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-6 w-6" />
              Navigation Test - SUCCESS!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-green-700">
              <p className="text-lg font-semibold">✅ Navigation is working correctly!</p>
              <p className="mt-2">You successfully navigated to this test page.</p>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-4 w-4" />
                <span className="font-medium">Current Location:</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {location}
              </Badge>
            </div>
            
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>If you can see this page, sidebar navigation is working</li>
                <li>Try navigating back to dashboard using the sidebar</li>
                <li>Test other routes like Analysis → Technical Analysis</li>
                <li>Verify dropdowns stay open after clicking child items</li>
              </ol>
            </div>
          </CardContent>
        </Card>
        
        {/* Comprehensive Testing Suite */}
        <NavigationTester />
      </div>
    </div>
  );
} 