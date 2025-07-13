import React from 'react';
import StrategyAssignmentEngine from '../components/strategy/StrategyAssignmentEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Target, CheckCircle } from 'lucide-react';

const TestStrategyAssignmentPage: React.FC = () => {
  const handleAssignmentComplete = (assignments: any[]) => {
    console.log('Strategy assignments completed:', assignments);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Block 2: Strategy Assignment Engine Test
          </h1>
          <p className="text-gray-600">
            Testing auto-assignment of trading strategies to portfolio positions
          </p>
        </div>

        {/* Test Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Target className="w-5 h-5" />
              Block 2 Test Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Features Testing</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Auto-strategy assignment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Strategy configurations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Assignment rules engine
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Manual strategy updates
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Available Strategies</h4>
                <div className="space-y-1">
                  <Badge className="bg-green-100 text-green-800">Conservative Growth</Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">Balanced Portfolio</Badge>
                  <Badge className="bg-red-100 text-red-800">Aggressive Growth</Badge>
                  <Badge className="bg-purple-100 text-purple-800">Crypto Focused</Badge>
                  <Badge className="bg-blue-100 text-blue-800">Income Generation</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Assignment Rules</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Symbol-specific rules (BTC → Crypto)</li>
                  <li>Asset class rules (equity → balanced)</li>
                  <li>Default fallback strategy</li>
                  <li>Confidence scoring</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Test Instructions:</strong> Use the Portfolio Loader (Block 1) to add positions first, 
                then test the auto-assignment feature. All actions are logged to Agent Memory.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Assignment Engine Component */}
        <StrategyAssignmentEngine 
          userId={1} 
          onAssignmentComplete={handleAssignmentComplete}
        />

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints (Block 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Strategy Assignment</h4>
                <div className="space-y-2 text-sm font-mono bg-gray-100 p-3 rounded">
                  <div>POST /api/strategy/assign/{'{user_id}'}</div>
                  <div>GET /api/strategy/assignments/{'{user_id}'}</div>
                  <div>PUT /api/strategy/assign/{'{assignment_id}'}</div>
                  <div>DELETE /api/strategy/assign/{'{assignment_id}'}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Configuration</h4>
                <div className="space-y-2 text-sm font-mono bg-gray-100 p-3 rounded">
                  <div>GET /api/strategy/configs</div>
                  <div>GET /api/strategy/rules</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Schema */}
        <Card>
          <CardHeader>
            <CardTitle>Database Schema (Block 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded font-mono text-sm">
              <div className="text-blue-600 font-semibold mb-2">StrategyAssignment Table:</div>
              <div className="space-y-1 text-gray-700">
                <div>• id (INTEGER PRIMARY KEY)</div>
                <div>• userId (INTEGER, FK to User)</div>
                <div>• positionId (INTEGER, FK to PortfolioPosition)</div>
                <div>• strategyId (TEXT)</div>
                <div>• strategyName (TEXT)</div>
                <div>• confidence (REAL)</div>
                <div>• reason (TEXT)</div>
                <div>• assignedAt (TEXT)</div>
                <div>• metadata (TEXT JSON)</div>
                <div>• createdAt (TEXT)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestStrategyAssignmentPage; 