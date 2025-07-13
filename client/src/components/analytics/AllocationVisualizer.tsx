import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { 
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Globe,
  Building,
  Shield,
  Zap,
  DollarSign
} from 'lucide-react';

// Block 3: Allocation Visualizer
// Provides interactive portfolio allocation analysis and visualization

interface AllocationBreakdown {
  type: string;
  name: string;
  value: number;
  percentage: number;
  count: number;
  color: string;
}

interface AllocationAnalysis {
  totalValue: number;
  totalPositions: number;
  assetClassBreakdown: AllocationBreakdown[];
  strategyBreakdown: AllocationBreakdown[];
  sectorBreakdown: AllocationBreakdown[];
  geographicBreakdown: AllocationBreakdown[];
  riskLevelBreakdown: AllocationBreakdown[];
  topHoldings: Array<{
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    quantity: number;
    assetClass: string;
    strategy: string;
  }>;
  diversificationScore: number;
  concentrationRisk: number;
  analysisTimestamp: string;
}

interface AllocationTarget {
  assetClass: string;
  targetPercentage: number;
  currentPercentage: number;
  deviation: number;
  status: string;
}

interface RebalanceRecommendation {
  fromSymbol: string;
  toSymbol: string;
  fromStrategy: string;
  toStrategy: string;
  amount: number;
  reason: string;
  priority: string;
  expectedImpact: number;
}

interface AllocationVisualizerProps {
  userId: number;
  onAnalysisComplete?: (analysis: AllocationAnalysis) => void;
}

const AllocationVisualizer: React.FC<AllocationVisualizerProps> = ({ 
  userId, 
  onAnalysisComplete 
}) => {
  const [analysis, setAnalysis] = useState<AllocationAnalysis | null>(null);
  const [targets, setTargets] = useState<AllocationTarget[]>([]);
  const [recommendations, setRecommendations] = useState<RebalanceRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>('asset_class');
  const [showRebalanceDialog, setShowRebalanceDialog] = useState(false);

  // Load initial data
  useEffect(() => {
    loadAnalysis();
    loadTargets();
    loadRecommendations();
  }, [userId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/allocation/analysis/${userId}`);
      if (!response.ok) throw new Error('Failed to load allocation analysis');
      
      const data = await response.json();
      setAnalysis(data.analysis);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError('Failed to load allocation analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadTargets = async () => {
    try {
      const response = await fetch(`/api/allocation/targets/${userId}`);
      if (!response.ok) throw new Error('Failed to load allocation targets');
      
      const data = await response.json();
      setTargets(data.targets || []);
    } catch (err) {
      console.error('Error loading targets:', err);
      setError('Failed to load allocation targets');
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`/api/allocation/rebalance/${userId}`);
      if (!response.ok) throw new Error('Failed to load rebalance recommendations');
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load rebalance recommendations');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/allocation/refresh/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to refresh allocation data');

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        setAnalysis(data.analysis);
        await loadTargets();
        await loadRecommendations();
      } else {
        throw new Error(data.message || 'Refresh failed');
      }

    } catch (err) {
      console.error('Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'balanced': return 'bg-green-100 text-green-800';
      case 'overweight': return 'bg-red-100 text-red-800';
      case 'underweight': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'balanced': return <CheckCircle className="w-4 h-4" />;
      case 'overweight': return <TrendingUp className="w-4 h-4" />;
      case 'underweight': return <TrendingDown className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
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
    return `${value.toFixed(1)}%`;
  };

  const getCurrentBreakdown = () => {
    if (!analysis) return [];
    
    switch (activeView) {
      case 'asset_class': return analysis.assetClassBreakdown;
      case 'strategy': return analysis.strategyBreakdown;
      case 'sector': return analysis.sectorBreakdown;
      case 'geographic': return analysis.geographicBreakdown;
      case 'risk_level': return analysis.riskLevelBreakdown;
      default: return analysis.assetClassBreakdown;
    }
  };

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'asset_class': return <PieChartIcon className="w-4 h-4" />;
      case 'strategy': return <Target className="w-4 h-4" />;
      case 'sector': return <Building className="w-4 h-4" />;
      case 'geographic': return <Globe className="w-4 h-4" />;
      case 'risk_level': return <Shield className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {formatPercentage(data.percentage)}
          </p>
          <p className="text-sm text-gray-600">
            Positions: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading && !analysis) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading allocation analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Allocation Visualizer</h2>
          <p className="text-gray-600 mt-1">
            Interactive portfolio allocation analysis and visualization
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={showRebalanceDialog} onOpenChange={setShowRebalanceDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Target className="w-4 h-4 mr-2" />
                Rebalance ({recommendations.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Rebalancing Recommendations</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-500">No rebalancing needed</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your portfolio allocation is well balanced
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority.toUpperCase()}
                              </Badge>
                              <span className="font-medium">
                                {formatCurrency(rec.amount)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                            <div className="text-xs text-gray-500">
                              From: {rec.fromSymbol} → To: {rec.toSymbol}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Impact: {formatPercentage(rec.expectedImpact)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {analysis && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analysis.totalValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Positions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysis.totalPositions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Diversification</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(analysis.diversificationScore)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Concentration Risk</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(analysis.concentrationRisk)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="visualization" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="targets">Targets</TabsTrigger>
              <TabsTrigger value="holdings">Top Holdings</TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Portfolio Breakdown</CardTitle>
                    <div className="flex items-center gap-2">
                      {[
                        { key: 'asset_class', label: 'Asset Class' },
                        { key: 'strategy', label: 'Strategy' },
                        { key: 'sector', label: 'Sector' },
                        { key: 'geographic', label: 'Geographic' },
                        { key: 'risk_level', label: 'Risk Level' }
                      ].map((view) => (
                        <Button
                          key={view.key}
                          variant={activeView === view.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveView(view.key)}
                        >
                          {getViewIcon(view.key)}
                          <span className="ml-2 hidden sm:inline">{view.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCurrentBreakdown()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name} ${formatPercentage(percentage)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getCurrentBreakdown().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getCurrentBreakdown()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="percentage" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="mt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Positions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCurrentBreakdown().map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="font-medium">{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(item.value)}</TableCell>
                            <TableCell>{formatPercentage(item.percentage)}</TableCell>
                            <TableCell>{item.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="targets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Allocation Targets vs Current
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {targets.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No allocation targets set</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Class</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Deviation</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {targets.map((target, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {target.assetClass}
                            </TableCell>
                            <TableCell>{formatPercentage(target.targetPercentage)}</TableCell>
                            <TableCell>{formatPercentage(target.currentPercentage)}</TableCell>
                            <TableCell>
                              <span className={target.deviation > 0 ? 'text-red-600' : target.deviation < 0 ? 'text-yellow-600' : 'text-green-600'}>
                                {target.deviation > 0 ? '+' : ''}{formatPercentage(target.deviation)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(target.status)}>
                                {getStatusIcon(target.status)}
                                <span className="ml-1 capitalize">{target.status}</span>
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="holdings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Top Holdings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.topHoldings.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No holdings found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Asset Class</TableHead>
                          <TableHead>Strategy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.topHoldings.map((holding, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono font-medium">
                              {holding.symbol}
                            </TableCell>
                            <TableCell>{holding.name}</TableCell>
                            <TableCell>{formatCurrency(holding.value)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min(holding.percentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">
                                  {formatPercentage(holding.percentage)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{holding.quantity.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{holding.assetClass}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{holding.strategy}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AllocationVisualizer; 