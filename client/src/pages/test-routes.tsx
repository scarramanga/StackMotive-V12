import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Navigation } from 'lucide-react';

const TestRoutesPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    console.log("🧪 TEST ROUTES PAGE LOADED");
  }, []);

  const criticalRoutes = [
    { path: '/', label: 'Dashboard' },
    { path: '/paper-trading/dashboard', label: 'Paper Trading Dashboard' },
    { path: '/analysis/technical', label: 'Technical Analysis' },
    { path: '/analysis/portfolio', label: 'Portfolio Analytics' },
    { path: '/reports', label: 'Reports' },
    { path: '/reports/tax', label: 'Tax Reports' },
    { path: '/tax-calculator', label: 'Tax Calculator' },
    { path: '/trading/strategies', label: 'Trading Strategies' },
    { path: '/journal', label: 'Trading Journal' }
  ];

  const testRoute = (path: string) => {
    console.log(`🔍 Testing route: ${path}`);
    navigate(path);
    
    // Mark as tested after a short delay
    setTimeout(() => {
      setTestResults(prev => ({ ...prev, [path]: true }));
    }, 100);
  };

  const getStatusIcon = (path: string) => {
    const tested = testResults[path];
    const isCurrent = location === path;
    
    if (isCurrent) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (tested) return <CheckCircle className="h-4 w-4 text-blue-500" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className='p-4'>
      {/* DEBUG INDICATOR */}
      <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded mb-4 mx-6 mt-6">
        <h1 className="font-bold">✅ ROUTE TESTING PAGE - WORKING</h1>
        <p className="text-sm">Route: /test-routes | Current: {location}</p>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-6 w-6" />
              Critical Route Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {criticalRoutes.map((route) => (
                <Button
                  key={route.path}
                  variant="outline"
                  className="flex items-center justify-between p-4 h-auto"
                  onClick={() => testRoute(route.path)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(route.path)}
                    <span className="font-medium">{route.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {location === route.path ? 'Current' : 'Test'}
                  </Badge>
                </Button>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Testing Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click any route button to test navigation</li>
                <li>Watch the browser console for debug logs</li>
                <li>Verify the page loads and shows debug indicators</li>
                <li>Check if dropdowns in sidebar stay open</li>
                <li>Confirm "Current" location updates correctly</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestRoutesPage; 