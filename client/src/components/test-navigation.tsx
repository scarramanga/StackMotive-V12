import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Navigation, Clock } from 'lucide-react';

interface RouteTest {
  path: string;
  label: string;
  category: string;
  status: 'pending' | 'success' | 'error';
  tested: boolean;
}

export const NavigationTester: React.FC = () => {
  const [location, navigate] = useLocation();
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // All routes to test
  const [routes, setRoutes] = useState<RouteTest[]>([
    // Trading routes
    { path: '/', label: 'Dashboard', category: 'Trading', status: 'pending', tested: false },
    { path: '/trading/trade', label: 'Active Trades', category: 'Trading', status: 'pending', tested: false },
    { path: '/trading/strategies', label: 'Browse Strategies', category: 'Trading', status: 'pending', tested: false },
    { path: '/trading/ai-strategy-builder', label: 'AI Strategy Builder', category: 'Trading', status: 'pending', tested: false },
    { path: '/scheduled-trades', label: 'Scheduled Trades', category: 'Trading', status: 'pending', tested: false },
    
    // Analysis routes
    { path: '/analysis/technical', label: 'Technical Analysis', category: 'Analysis', status: 'pending', tested: false },
    { path: '/analysis/portfolio', label: 'Portfolio Analytics', category: 'Analysis', status: 'pending', tested: false },
    { path: '/combined-portfolio', label: 'Combined Portfolio', category: 'Analysis', status: 'pending', tested: false },
    { path: '/analysis/sentiment', label: 'Market Sentiment', category: 'Analysis', status: 'pending', tested: false },
    { path: '/whale-tracking', label: 'Whale Tracking', category: 'Analysis', status: 'pending', tested: false },
    
    // Tax & Reporting routes
    { path: '/reports/tax', label: 'Tax Reports', category: 'Tax & Reporting', status: 'pending', tested: false },
    { path: '/tax-calculator', label: 'Tax Calculator', category: 'Tax & Reporting', status: 'pending', tested: false },
    { path: '/reports', label: 'Reports Center', category: 'Tax & Reporting', status: 'pending', tested: false },
    { path: '/reports/custom', label: 'Custom Reports', category: 'Tax & Reporting', status: 'pending', tested: false },
    
    // Utilities routes
    { path: '/journal', label: 'Trading Journal', category: 'Utilities', status: 'pending', tested: false },
    { path: '/news', label: 'News & Events', category: 'Utilities', status: 'pending', tested: false },
    
    // Test routes
    { path: '/navigation-test', label: 'Navigation Test', category: 'Test', status: 'pending', tested: false }
  ]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Update current route status when location changes
  useEffect(() => {
    setRoutes(prev => prev.map(route => ({
      ...route,
      status: route.path === location ? 'success' : route.status,
      tested: route.path === location ? true : route.tested
    })));
  }, [location]);
  
  const handleTestRoute = (path: string) => {
    console.log(`Testing navigation to: ${path}`);
    navigate(path);
  };
  
  const testAllRoutes = async () => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      console.log(`Testing ${route.label} at ${route.path}`);
      navigate(route.path);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }
  };
  
  const getStatusIcon = (status: string, tested: boolean) => {
    if (!tested) return <Clock className="h-4 w-4 text-gray-400" />;
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  const getStatusColor = (status: string, tested: boolean) => {
    if (!tested) return 'bg-gray-100 text-gray-600';
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  const getStats = () => {
    const tested = routes.filter(r => r.tested).length;
    const successful = routes.filter(r => r.status === 'success').length;
    const total = routes.length;
    return { tested, successful, total };
  };
  
  const stats = getStats();
  const groupedRoutes = routes.reduce((groups, route) => {
    const category = route.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(route);
    return groups;
  }, {} as Record<string, RouteTest[]>);
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Navigation className="h-6 w-6" />
            Navigation System Test Suite
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="font-mono">
                Current: {location}
              </Badge>
              <Badge variant="outline">
                Time: {currentTime}
              </Badge>
            </div>
            <Button onClick={testAllRoutes} variant="outline">
              Test All Routes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-gray-800">{stats.tested}/{stats.total}</div>
              <div className="text-sm text-gray-600">Routes Tested</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category} Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryRoutes.map((route) => (
                <div
                  key={route.path}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleTestRoute(route.path)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(route.status, route.tested)}
                    <span className="font-medium">{route.label}</span>
                  </div>
                  <Badge className={getStatusColor(route.status, route.tested)}>
                    {route.tested ? route.status : 'pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>Click individual route cards to test navigation manually</li>
            <li>Use "Test All Routes" to automatically cycle through all routes</li>
            <li>Watch the sidebar dropdowns - they should stay open after clicking</li>
            <li>Verify the "Tax & Reporting" section exists with both tax routes</li>
            <li>Check that all pages load without 404 errors</li>
            <li>Confirm sidebar layout doesn't overflow or cut off content</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}; 