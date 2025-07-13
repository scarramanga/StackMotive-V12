import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DebugNavigationPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const { user, hasPaperTradingAccount, hasCompletedOnboarding, getRedirectPath } = useAuth();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  useEffect(() => {
    console.log("🐛 DEBUG NAVIGATION PAGE LOADED");
    console.log("📍 Current location:", location);
    setNavigationHistory(prev => [...prev, `${new Date().toLocaleTimeString()}: ${location}`]);
  }, [location]);

  const testRoutes = [
    '/analysis/technical',
    '/reports/tax', 
    '/tax-calculator',
    '/trading/strategies',
    '/paper-trading/dashboard',
    '/'
  ];

  return (
    <div className='p-4'>
      {/* DEBUG INDICATOR */}
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 mx-6 mt-6">
        <h1 className="font-bold">🐛 DEBUG NAVIGATION PAGE - TESTING AUTH REDIRECTS</h1>
        <p className="text-sm">Route: /debug-navigation | Current: {location}</p>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        
        {/* Current State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Auth State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">User: {user?.email || 'Not logged in'}</Badge>
              </div>
              <div>
                <Badge variant={hasCompletedOnboarding ? "default" : "destructive"}>
                  Onboarding: {hasCompletedOnboarding ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
              <div>
                <Badge variant={hasPaperTradingAccount ? "default" : "destructive"}>
                  Paper Account: {hasPaperTradingAccount ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <Badge variant="secondary">
                  Expected Redirect: {getRedirectPath()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Test Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {testRoutes.map((route) => (
                <Button
                  key={route}
                  variant={location === route ? "default" : "outline"}
                  onClick={() => {
                    console.log(`🧪 Testing navigation to: ${route}`);
                    navigate(route);
                  }}
                  className="text-left"
                >
                  {route === '/' ? 'Dashboard' : route.split('/').pop()}
                  {location === route && <Badge className="ml-2">Current</Badge>}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation History */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {navigationHistory.map((entry, index) => (
                <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {entry}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click any route button above</li>
              <li>Watch if the page actually changes</li>
              <li>Check navigation history for successful transitions</li>
              <li>Console should show navigation attempts</li>
              <li>If auth redirect is fixed, you should stay on the clicked route</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugNavigationPage; 