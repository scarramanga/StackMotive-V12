import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedMetric {
  id: string;
  name: string;
  value: string;
  change: {
    value: string;
    positive: boolean;
  };
  description: string;
  category: 'performance' | 'risk' | 'efficiency' | 'prediction';
}

interface RiskMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'low' | 'medium' | 'high';
  description: string;
}

interface PredictionModel {
  id: string;
  name: string;
  accuracy: number;
  confidence: number;
  prediction: string;
  timeframe: string;
  status: 'active' | 'training' | 'inactive';
}

export default function AdvancedAnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock advanced metrics data
  const advancedMetrics: AdvancedMetric[] = [
    {
      id: '1',
      name: 'Sharpe Ratio',
      value: '1.85',
      change: { value: '+0.12', positive: true },
      description: 'Risk-adjusted return measure',
      category: 'performance'
    },
    {
      id: '2',
      name: 'Maximum Drawdown',
      value: '8.3%',
      change: { value: '-1.2%', positive: true },
      description: 'Largest peak-to-trough decline',
      category: 'risk'
    },
    {
      id: '3',
      name: 'Win Rate',
      value: '68.5%',
      change: { value: '+2.1%', positive: true },
      description: 'Percentage of profitable trades',
      category: 'efficiency'
    },
    {
      id: '4',
      name: 'Alpha',
      value: '0.15',
      change: { value: '+0.03', positive: true },
      description: 'Excess return vs benchmark',
      category: 'performance'
    },
    {
      id: '5',
      name: 'Beta',
      value: '0.92',
      change: { value: '-0.05', positive: true },
      description: 'Market correlation coefficient',
      category: 'risk'
    },
    {
      id: '6',
      name: 'Calmar Ratio',
      value: '2.1',
      change: { value: '+0.3', positive: true },
      description: 'Annual return / max drawdown',
      category: 'efficiency'
    }
  ];

  const riskMetrics: RiskMetric[] = [
    {
      name: 'Value at Risk (95%)',
      value: 4.2,
      threshold: 5.0,
      status: 'low',
      description: 'Maximum expected loss over 1 day'
    },
    {
      name: 'Portfolio Concentration',
      value: 15.8,
      threshold: 20.0,
      status: 'medium',
      description: 'Percentage in top 3 positions'
    },
    {
      name: 'Correlation Risk',
      value: 0.65,
      threshold: 0.8,
      status: 'low',
      description: 'Average correlation between holdings'
    },
    {
      name: 'Volatility (30d)',
      value: 18.5,
      threshold: 25.0,
      status: 'low',
      description: 'Annualized portfolio volatility'
    }
  ];

  const predictionModels: PredictionModel[] = [
    {
      id: '1',
      name: 'LSTM Price Predictor',
      accuracy: 73.2,
      confidence: 85.6,
      prediction: 'Bullish trend continuation',
      timeframe: '7 days',
      status: 'active'
    },
    {
      id: '2',
      name: 'Sentiment Analysis Model',
      accuracy: 68.9,
      confidence: 78.3,
      prediction: 'Market uncertainty ahead',
      timeframe: '3 days',
      status: 'active'
    },
    {
      id: '3',
      name: 'Technical Pattern Recognition',
      accuracy: 71.5,
      confidence: 82.1,
      prediction: 'Breakout pattern forming',
      timeframe: '5 days',
      status: 'training'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'training': return 'text-blue-600 bg-blue-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'efficiency': return <Target className="h-4 w-4" />;
      case 'prediction': return <Brain className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? advancedMetrics 
    : advancedMetrics.filter(metric => metric.category === selectedCategory);

  return (
    <div className='p-4'>
      <div className="container mx-auto py-6 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground">Deep insights and predictive analytics for your portfolio</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1W">1W</SelectItem>
                <SelectItem value="1M">1M</SelectItem>
                <SelectItem value="3M">3M</SelectItem>
                <SelectItem value="6M">6M</SelectItem>
                <SelectItem value="1Y">1Y</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Metrics</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="risk">Risk</SelectItem>
                <SelectItem value="efficiency">Efficiency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Analytics Dashboard</CardTitle>
            <CardDescription>
              Advanced metrics and AI-powered insights for {selectedTimeframe} timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
                <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
                <TabsTrigger value="optimization">Optimization</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* Advanced Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMetrics.map((metric) => (
                      <Card key={metric.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(metric.category)}
                              <span className="text-sm font-medium">{metric.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {metric.category}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold">{metric.value}</span>
                              <span className={cn(
                                "text-sm font-medium",
                                metric.change.positive ? "text-green-600" : "text-red-600"
                              )}>
                                {metric.change.value}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Performance Chart Placeholder */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <LineChart className="h-5 w-5" />
                        <span>Performance Trends</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Advanced charting visualization</p>
                          <p className="text-sm text-muted-foreground">Interactive performance analytics</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="risk">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {riskMetrics.map((risk, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">{risk.name}</h3>
                            <Badge className={getStatusColor(risk.status)}>
                              {risk.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Current:</span>
                              <span className="font-medium">{risk.value}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Threshold:</span>
                              <span className="text-muted-foreground">{risk.threshold}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={cn(
                                  "h-2 rounded-full",
                                  risk.status === 'low' ? "bg-green-500" :
                                  risk.status === 'medium' ? "bg-yellow-500" : "bg-red-500"
                                )}
                                style={{ width: `${Math.min((risk.value / risk.threshold) * 100, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{risk.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="predictions">
                <div className="space-y-4">
                  {predictionModels.map((model) => (
                    <Card key={model.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Brain className="h-5 w-5 text-blue-600" />
                            <div>
                              <h3 className="font-medium">{model.name}</h3>
                              <p className="text-sm text-muted-foreground">{model.timeframe} forecast</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(model.status)}>
                            {model.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Accuracy</p>
                            <p className="text-lg font-bold text-green-600">{model.accuracy}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Confidence</p>
                            <p className="text-lg font-bold text-blue-600">{model.confidence}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="flex items-center justify-center space-x-1">
                              {model.status === 'active' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : model.status === 'training' ? (
                                <Clock className="h-4 w-4 text-blue-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="text-sm font-medium">{model.status}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Prediction:</p>
                          <p className="text-sm">{model.prediction}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="optimization">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Portfolio Optimization Suggestions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <h3 className="font-medium text-blue-900">Rebalancing Opportunity</h3>
                              <p className="text-sm text-blue-700 mt-1">
                                Consider reducing exposure to tech sector (currently 35%) to improve diversification.
                                Target allocation: 25-30%.
                              </p>
                              <Button size="sm" className="mt-2">Apply Suggestion</Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <Target className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <h3 className="font-medium text-green-900">Risk Optimization</h3>
                              <p className="text-sm text-green-700 mt-1">
                                Adding defensive positions could reduce portfolio volatility by 12% while maintaining 
                                similar expected returns.
                              </p>
                              <Button size="sm" className="mt-2">View Details</Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <DollarSign className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                              <h3 className="font-medium text-yellow-900">Cost Optimization</h3>
                              <p className="text-sm text-yellow-700 mt-1">
                                Switching to lower-cost ETF alternatives could save $240 annually in fees 
                                without changing your investment strategy.
                              </p>
                              <Button size="sm" className="mt-2">Explore Options</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 