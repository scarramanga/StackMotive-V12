import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AIRebalanceSuggestionPanel from '../components/ai/AIRebalanceSuggestionPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Brain, CheckCircle, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Toaster } from '../components/ui/toaster';

const queryClient = new QueryClient();

const TestAIRebalanceSuggestionsPage: React.FC = () => {
  const handleSuggestionComplete = (session: any) => {
    console.log('AI rebalance session completed:', session);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Block 4: AI Rebalance Suggestion Panel Test
            </h1>
            <p className="text-gray-600">
              Testing AI-driven portfolio rebalancing suggestions with intelligent analysis
            </p>
          </div>

          {/* Test Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Brain className="w-5 h-5" />
                <span>Block 4 Implementation Status</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  COMPLETE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">AI Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Portfolio deviation analysis</li>
                    <li>• Intelligent rebalancing suggestions</li>
                    <li>• AI rationale and market context</li>
                    <li>• Risk-return impact analysis</li>
                    <li>• Confidence scoring system</li>
                    <li>• User response tracking</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Suggestion Types</h4>
                  <div className="space-y-1">
                    <Badge className="bg-red-100 text-red-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Overweight Reduction
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Underweight Increase
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-800">
                      <Target className="w-3 h-3 mr-1" />
                      Risk Rebalance
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Opportunity Capture
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Test Instructions:</strong> Use Portfolio Loader (Block 1) to load positions, 
                  then test AI suggestion generation. All user responses are tracked in Agent Memory.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Rebalance Panel */}
          <AIRebalanceSuggestionPanel 
            userId={1} 
            onSuggestionComplete={handleSuggestionComplete}
          />

          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints (Block 4)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">AI Suggestion Generation</h4>
                  <div className="space-y-2 text-sm font-mono bg-gray-100 p-3 rounded">
                    <div>GET /api/ai-rebalance/suggestions/{'{user_id}'}</div>
                    <div>POST /api/ai-rebalance/refresh/{'{user_id}'}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">User Response & History</h4>
                  <div className="space-y-2 text-sm font-mono bg-gray-100 p-3 rounded">
                    <div>POST /api/ai-rebalance/respond/{'{user_id}'}</div>
                    <div>GET /api/ai-rebalance/history/{'{user_id}'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Features */}
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span>Portfolio Analysis</span>
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Current vs target allocation analysis</li>
                    <li>• Asset class deviation detection</li>
                    <li>• Risk score calculation</li>
                    <li>• Diversification scoring (Herfindahl index)</li>
                    <li>• Total portfolio value tracking</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Smart Suggestions</span>
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Priority-based ranking (high/medium/low)</li>
                    <li>• Confidence scoring (0-100%)</li>
                    <li>• Impact analysis (risk, return, diversification)</li>
                    <li>• Transaction cost estimation</li>
                    <li>• Market context integration</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>User Experience</span>
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Accept/Decline/Modify responses</li>
                    <li>• User notes and custom amounts</li>
                    <li>• Response history tracking</li>
                    <li>• Real-time suggestion refresh</li>
                    <li>• Agent Memory logging</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Flow */}
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
                  <div>3. Block 3 (Allocation Visualizer) → Current allocations</div>
                  <div>4. Block 4 (AI Rebalance) → Intelligent suggestions</div>
                  <div>5. All responses logged to Agent Memory</div>
                </div>
                
                <div className="text-green-600 font-semibold mt-4 mb-2">AI Logic:</div>
                <div className="space-y-1 text-gray-700">
                  <div>• Target Allocations: equity(60%), crypto(15%), bond(15%), fund(5%), cash(5%)</div>
                  <div>• Deviation Threshold: ±3% triggers suggestion</div>
                  <div>• Suggestion Amount: (Deviation / 2) × Total Value</div>
                  <div>• Priority: High(&gt;10%), Medium(5-10%), Low(&lt;5%)</div>
                  <div>• Confidence: 0.6 + (deviation / 100), max 0.95</div>
                </div>
                
                <div className="text-orange-600 font-semibold mt-4 mb-2">Market Context Integration:</div>
                <div className="space-y-1 text-gray-700">
                  <div>• Recent volatility spike detection</div>
                  <div>• Sector rotation analysis</div>
                  <div>• Fed policy shift monitoring</div>
                  <div>• Real-time market factor integration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
};

export default TestAIRebalanceSuggestionsPage; 