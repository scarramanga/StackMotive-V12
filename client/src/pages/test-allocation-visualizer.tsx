import React from 'react';
import AllocationVisualizer from '../components/analytics/AllocationVisualizer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { PieChart, CheckCircle } from 'lucide-react';

const TestAllocationVisualizerPage: React.FC = () => {
  const handleAnalysisComplete = (analysis: any) => {
    console.log('Allocation analysis completed:', analysis);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Block 3: Allocation Visualizer Test
          </h1>
          <p className="text-gray-600">
            Testing interactive portfolio allocation analysis and visualization
          </p>
        </div>

        {/* Test Info */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <PieChart className="w-5 h-5" />
              Block 3 Test Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-900">Features Testing</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Portfolio breakdown analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Interactive pie & bar charts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Allocation targets vs current
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Rebalancing recommendations
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-900">Visualization Types</h4>
                <div className="space-y-1">
                  <Badge className="bg-blue-100 text-blue-800">Asset Class</Badge>
                  <Badge className="bg-green-100 text-green-800">Strategy</Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">Sector</Badge>
                  <Badge className="bg-red-100 text-red-800">Geographic</Badge>
                  <Badge className="bg-purple-100 text-purple-800">Risk Level</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-900">Analysis Metrics</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>Diversification score</li>
                  <li>Concentration risk</li>
                  <li>Top holdings analysis</li>
                  <li>Target vs current allocation</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t border-purple-200">
              <p className="text-sm text-purple-700">
                <strong>Test Instructions:</strong> Ensure you have portfolio positions loaded (Block 1) 
                and strategies assigned (Block 2) for comprehensive visualization. All analysis is logged to Agent Memory.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Allocation Visualizer Component */}
        <AllocationVisualizer 
          userId={1} 
          onAnalysisComplete={handleAnalysisComplete}
        />

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints (Block 3)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Analysis & Visualization</h4>
                <div className="space-y-2 text-sm font-mono bg-gray-100 p-3 rounded">
                  <div>GET /api/allocation/analysis/{'{user_id}'}</div>
                  <div>POST /api/allocation/refresh/{'{user_id}'}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Targets & Rebalancing</h4>
                <div className="space-y-2 text-sm font-mono bg-gray-100 p-3 rounded">
                  <div>GET /api/allocation/targets/{'{user_id}'}</div>
                  <div>GET /api/allocation/rebalance/{'{user_id}'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Features */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Features (Block 3)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Portfolio Breakdown</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Asset class distribution</li>
                  <li>• Strategy allocation</li>
                  <li>• Sector diversification</li>
                  <li>• Geographic spread</li>
                  <li>• Risk level analysis</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">Visualization</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Interactive pie charts</li>
                  <li>• Responsive bar charts</li>
                  <li>• Color-coded categories</li>
                  <li>• Detailed tooltips</li>
                  <li>• Tabular breakdowns</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-600">Smart Analysis</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Diversification scoring</li>
                  <li>• Concentration risk alerts</li>
                  <li>• Target vs actual comparison</li>
                  <li>• Rebalancing suggestions</li>
                  <li>• Top holdings insights</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Block Integration Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded font-mono text-sm">
              <div className="text-blue-600 font-semibold mb-2">Data Flow:</div>
              <div className="space-y-1 text-gray-700">
                <div>1. Block 1 (Portfolio Loader) → Portfolio positions</div>
                <div>2. Block 2 (Strategy Assignment) → Strategy assignments</div>
                <div>3. Block 3 (Allocation Visualizer) → Analysis & visualization</div>
                <div>4. All actions logged to Agent Memory</div>
              </div>
              
              <div className="text-green-600 font-semibold mt-4 mb-2">Analysis Calculations:</div>
              <div className="space-y-1 text-gray-700">
                <div>• Diversification Score = (1 - Herfindahl Index) × 100</div>
                <div>• Concentration Risk = Top 3 holdings / Total value</div>
                <div>• Target Deviation = Current % - Target %</div>
                <div>• Rebalance Amount = (Deviation / 2) × Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAllocationVisualizerPage; 