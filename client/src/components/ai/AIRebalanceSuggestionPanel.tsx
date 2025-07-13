import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { PanelAnimator } from '../animation/PanelAnimator';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  DollarSign,
  Clock,
  BarChart3,
  Zap
} from 'lucide-react';

// Types
interface AIRebalanceSuggestion {
  id: string;
  type: 'overweight_reduction' | 'underweight_increase' | 'risk_rebalance' | 'opportunity_capture';
  fromAsset: string;
  toAsset: string;
  fromStrategy?: string;
  toStrategy?: string;
  suggestedAmount: number;
  currentAllocation: number;
  targetAllocation: number;
  deviation: number;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  aiRationale: string;
  expectedImpact: {
    riskChange: number;
    returnChange: number;
    diversificationChange: number;
  };
  marketContext: string[];
  estimatedCost: number;
  timeframe: string;
  createdAt: string;
}

interface AIRebalanceSession {
  sessionId: string;
  userId: number;
  suggestions: AIRebalanceSuggestion[];
  totalPortfolioValue: number;
  riskScore: number;
  diversificationScore: number;
  aiSummary: string;
  sessionTimestamp: string;
}

interface SuggestionResponse {
  action: 'accept' | 'decline' | 'modify';
  suggestionId: string;
  userNotes?: string;
  modifiedAmount?: number;
}

interface AIRebalanceSuggestionPanelProps {
  userId: number;
  onSuggestionComplete?: (session: AIRebalanceSession) => void;
}

const AIRebalanceSuggestionPanel: React.FC<AIRebalanceSuggestionPanelProps> = ({ 
  userId, 
  onSuggestionComplete 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSuggestion, setSelectedSuggestion] = useState<AIRebalanceSuggestion | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [modifiedAmount, setModifiedAmount] = useState<number | ''>('');
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');

  // Fetch AI suggestions
  const { data: sessionData, isLoading: isLoadingSuggestions, refetch: refetchSuggestions } = useQuery({
    queryKey: ['ai-rebalance-suggestions', userId],
    queryFn: async () => {
      const response = await fetch(`/api/ai-rebalance/suggestions/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch AI suggestions');
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch suggestion history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['ai-suggestion-history', userId],
    queryFn: async () => {
      const response = await fetch(`/api/ai-rebalance/history/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch suggestion history');
      return response.json();
    },
    enabled: !!userId,
  });

  // Respond to suggestion mutation
  const respondToSuggestionMutation = useMutation({
    mutationFn: async (response: SuggestionResponse) => {
      const res = await fetch(`/api/ai-rebalance/respond/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      if (!res.ok) throw new Error('Failed to respond to suggestion');
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Response Recorded',
        description: data.message,
      });
      queryClient.invalidateQueries(['ai-suggestion-history', userId]);
      setSelectedSuggestion(null);
      setResponseNotes('');
      setModifiedAmount('');
      setShowDetailPanel(false);
    },
    onError: (error) => {
      toast({
        title: 'Response Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Refresh suggestions mutation
  const refreshSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ai-rebalance/refresh/${userId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to refresh suggestions');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Suggestions Refreshed',
        description: data.message,
      });
      queryClient.invalidateQueries(['ai-rebalance-suggestions', userId]);
    },
    onError: (error) => {
      toast({
        title: 'Refresh Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const session: AIRebalanceSession | null = sessionData?.session || null;
  const suggestions = session?.suggestions || [];
  const history = historyData?.responses || [];

  useEffect(() => {
    if (session && onSuggestionComplete) {
      onSuggestionComplete(session);
    }
  }, [session, onSuggestionComplete]);

  const handleSuggestionResponse = (action: 'accept' | 'decline' | 'modify') => {
    if (!selectedSuggestion) return;

    const response: SuggestionResponse = {
      action,
      suggestionId: selectedSuggestion.id,
      userNotes: responseNotes || undefined,
      modifiedAmount: action === 'modify' && modifiedAmount !== '' ? Number(modifiedAmount) : undefined,
    };

    respondToSuggestionMutation.mutate(response);
  };

  const getSuggestionTypeIcon = (type: string) => {
    switch (type) {
      case 'overweight_reduction': return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'underweight_increase': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'risk_rebalance': return <Target className="w-5 h-5 text-orange-500" />;
      case 'opportunity_capture': return <Zap className="w-5 h-5 text-blue-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (isLoadingSuggestions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Brain className="w-8 h-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">AI is analyzing your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Rebalance Suggestions</h2>
            <p className="text-muted-foreground">
              Intelligent portfolio optimization recommendations
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => refreshSuggestionsMutation.mutate()}
          disabled={refreshSuggestionsMutation.isLoading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshSuggestionsMutation.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Portfolio Summary */}
      {session && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-xl font-bold">{formatCurrency(session.totalPortfolioValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <p className="text-xl font-bold">{(session.riskScore * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Diversification</p>
                  <p className="text-xl font-bold">{session.diversificationScore.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Suggestions</p>
                  <p className="text-xl font-bold">{suggestions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Summary */}
      {session && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Brain className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">AI Analysis Summary</h3>
                <p className="text-muted-foreground">{session.aiSummary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suggestions">Current Suggestions</TabsTrigger>
          <TabsTrigger value="history">Response History</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Portfolio Optimally Balanced</h3>
                <p className="text-muted-foreground">
                  Your portfolio is currently within optimal allocation ranges. No rebalancing needed at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {getSuggestionTypeIcon(suggestion.type)}
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </Badge>
                            <Badge variant="outline" className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{suggestion.timeframe}</span>
                            </Badge>
                          </div>
                          
                          <h4 className="font-semibold mb-2">
                            {suggestion.fromAsset} → {suggestion.toAsset}
                          </h4>
                          
                          <p className="text-muted-foreground mb-3">
                            {suggestion.aiRationale}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Suggested Amount</p>
                              <p className="font-medium">{formatCurrency(suggestion.suggestedAmount)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Current → Target</p>
                              <p className="font-medium">
                                {suggestion.currentAllocation.toFixed(1)}% → {suggestion.targetAllocation.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Expected Return Impact</p>
                              <p className={`font-medium ${suggestion.expectedImpact.returnChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(suggestion.expectedImpact.returnChange)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Estimated Cost</p>
                              <p className="font-medium">{formatCurrency(suggestion.estimatedCost)}</p>
                            </div>
                          </div>
                          
                          {suggestion.marketContext.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground mb-1">Market Context:</p>
                              <div className="flex flex-wrap gap-1">
                                {suggestion.marketContext.map((context, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {context}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => {
                          setSelectedSuggestion(suggestion);
                          setShowDetailPanel(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoadingHistory ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Response History</h3>
                <p className="text-muted-foreground">
                  Your responses to AI suggestions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((response: any) => (
                <Card key={response.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {response.action === 'accept' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {response.action === 'decline' && <XCircle className="w-5 h-5 text-red-600" />}
                        {response.action === 'modify' && <Target className="w-5 h-5 text-blue-600" />}
                        
                        <div>
                          <p className="font-medium capitalize">{response.action}ed Suggestion</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(response.responseTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <Badge variant="outline">{response.suggestionId}</Badge>
                    </div>
                    
                    {response.userNotes && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm">{response.userNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Suggestion Detail Panel */}
      {selectedSuggestion && (
        <PanelAnimator isVisible={showDetailPanel} onClose={() => setShowDetailPanel(false)}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getSuggestionTypeIcon(selectedSuggestion.type)}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedSuggestion.fromAsset} → {selectedSuggestion.toAsset}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(selectedSuggestion.suggestedAmount)} rebalance
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailPanel(false)}
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* AI Rationale */}
              <div>
                <h4 className="font-semibold mb-2">AI Analysis</h4>
                <p className="text-muted-foreground">{selectedSuggestion.aiRationale}</p>
              </div>
              
              {/* Impact Analysis */}
              <div>
                <h4 className="font-semibold mb-3">Expected Impact</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Risk Change:</span>
                    <span className={selectedSuggestion.expectedImpact.riskChange >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatPercentage(selectedSuggestion.expectedImpact.riskChange)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Return Change:</span>
                    <span className={selectedSuggestion.expectedImpact.returnChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(selectedSuggestion.expectedImpact.returnChange)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diversification:</span>
                    <span className="text-blue-600">
                      {formatPercentage(selectedSuggestion.expectedImpact.diversificationChange)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Response Form */}
              <div>
                <h4 className="font-semibold mb-3">Your Response</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Notes (optional)</label>
                    <Textarea
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder="Add your thoughts or reasoning..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Modified Amount (for modifications)</label>
                    <Input
                      type="number"
                      value={modifiedAmount}
                      onChange={(e) => setModifiedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={formatCurrency(selectedSuggestion.suggestedAmount)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t">
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleSuggestionResponse('accept')}
                  disabled={respondToSuggestionMutation.isLoading}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleSuggestionResponse('modify')}
                  disabled={respondToSuggestionMutation.isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Modify
                </Button>
                <Button
                  onClick={() => handleSuggestionResponse('decline')}
                  disabled={respondToSuggestionMutation.isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </PanelAnimator>
      )}
    </div>
  );
};

export default AIRebalanceSuggestionPanel; 