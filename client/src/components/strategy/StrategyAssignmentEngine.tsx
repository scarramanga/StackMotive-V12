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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
  PlayCircle, 
  Settings, 
  TrendingUp, 
  Shield, 
  Zap,
  Info,
  CheckCircle,
  AlertCircle,
  Target,
  BarChart3,
  Clock,
  Trash2
} from 'lucide-react';

// Block 2: Strategy Assignment Engine
// Auto-assigns strategies to portfolio positions based on rules and user preferences

interface StrategyAssignment {
  id: number;
  positionId: number;
  strategyId: string;
  strategyName: string;
  confidence: number;
  reason: string;
  assignedAt: string;
  metadata: {
    symbol: string;
    assetClass: string;
    riskLevel: string;
    expectedReturn: number;
  };
  // From joined position data
  symbol: string;
  name: string;
  quantity: number;
  assetClass: string;
}

interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  assetClasses: string[];
  riskLevel: string;
  expectedReturn: number;
  maxDrawdown: number;
  rebalanceFrequency: string;
  isActive: boolean;
}

interface AssignmentRules {
  id: string;
  name: string;
  assetClassRules: Record<string, string>;
  symbolRules: Record<string, string>;
  defaultStrategy: string;
  isActive: boolean;
}

interface StrategyAssignmentEngineProps {
  userId: number;
  onAssignmentComplete?: (assignments: StrategyAssignment[]) => void;
}

const StrategyAssignmentEngine: React.FC<StrategyAssignmentEngineProps> = ({ 
  userId, 
  onAssignmentComplete 
}) => {
  const [assignments, setAssignments] = useState<StrategyAssignment[]>([]);
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [rules, setRules] = useState<AssignmentRules | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoAssignProgress, setAutoAssignProgress] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState<StrategyAssignment | null>(null);
  const [showRulesDialog, setShowRulesDialog] = useState(false);

  // Load initial data
  useEffect(() => {
    loadAssignments();
    loadStrategies();
    loadRules();
  }, [userId]);

  const loadAssignments = async () => {
    try {
      const response = await fetch(`/api/strategy/assignments/${userId}`);
      if (!response.ok) throw new Error('Failed to load assignments');
      
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Failed to load strategy assignments');
    }
  };

  const loadStrategies = async () => {
    try {
      const response = await fetch('/api/strategy/configs');
      if (!response.ok) throw new Error('Failed to load strategies');
      
      const data = await response.json();
      setStrategies(data.strategies || []);
    } catch (err) {
      console.error('Error loading strategies:', err);
      setError('Failed to load strategy configurations');
    }
  };

  const loadRules = async () => {
    try {
      const response = await fetch('/api/strategy/rules');
      if (!response.ok) throw new Error('Failed to load rules');
      
      const data = await response.json();
      setRules(data.rules);
    } catch (err) {
      console.error('Error loading rules:', err);
      setError('Failed to load assignment rules');
    }
  };

  const handleAutoAssign = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setAutoAssignProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAutoAssignProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      const response = await fetch(`/api/strategy/assign/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);
      setAutoAssignProgress(100);

      if (!response.ok) {
        throw new Error('Failed to auto-assign strategies');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        await loadAssignments(); // Refresh assignments
        
        if (onAssignmentComplete) {
          onAssignmentComplete(data.assignments);
        }
      } else {
        throw new Error(data.message || 'Auto-assignment failed');
      }

    } catch (err) {
      console.error('Auto-assignment error:', err);
      setError(err instanceof Error ? err.message : 'Auto-assignment failed');
      setAutoAssignProgress(0);
    } finally {
      setLoading(false);
      setTimeout(() => setAutoAssignProgress(0), 2000);
    }
  };

  const handleUpdateAssignment = async (assignmentId: number, strategyId: string) => {
    try {
      const response = await fetch(`/api/strategy/assign/${assignmentId}?user_id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy_id: strategyId }),
      });

      if (!response.ok) throw new Error('Failed to update assignment');

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        await loadAssignments();
      } else {
        throw new Error(data.message || 'Update failed');
      }

    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`/api/strategy/assign/${assignmentId}?user_id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete assignment');

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        await loadAssignments();
      } else {
        throw new Error(data.message || 'Delete failed');
      }

    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'conservative': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'aggressive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'conservative': return <Shield className="w-4 h-4" />;
      case 'moderate': return <BarChart3 className="w-4 h-4" />;
      case 'aggressive': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatReturn = (returnRate: number) => {
    return `${(returnRate * 100).toFixed(1)}%`;
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Strategy Assignment Engine</h2>
          <p className="text-gray-600 mt-1">
            Auto-assign trading strategies to your portfolio positions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Rules
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assignment Rules</DialogTitle>
              </DialogHeader>
              {rules && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Asset Class Rules</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(rules.assetClassRules).map(([assetClass, strategyId]) => (
                        <div key={assetClass} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="capitalize">{assetClass}</span>
                          <span className="text-blue-600">{strategyId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Symbol-Specific Rules</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(rules.symbolRules).map(([symbol, strategyId]) => (
                        <div key={symbol} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="font-mono">{symbol}</span>
                          <span className="text-blue-600">{strategyId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Default Strategy</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rules.defaultStrategy}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={handleAutoAssign} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {loading ? 'Assigning...' : 'Auto-Assign'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {autoAssignProgress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Auto-assigning strategies...</span>
            <span>{autoAssignProgress}%</span>
          </div>
          <Progress value={autoAssignProgress} className="h-2" />
        </div>
      )}

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments">Current Assignments</TabsTrigger>
          <TabsTrigger value="strategies">Available Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Strategy Assignments
                <Badge variant="secondary">{assignments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No strategy assignments yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Auto-Assign" to automatically assign strategies to your positions
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.symbol}</div>
                            <div className="text-sm text-gray-500">
                              {assignment.quantity} shares
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.strategyName}</div>
                            <div className="text-sm text-gray-500">{assignment.reason}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${getConfidenceColor(assignment.confidence)}`}>
                            {(assignment.confidence * 100).toFixed(0)}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            {formatReturn(assignment.metadata.expectedReturn)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskLevelColor(assignment.metadata.riskLevel)}>
                            {getRiskLevelIcon(assignment.metadata.riskLevel)}
                            <span className="ml-1 capitalize">{assignment.metadata.riskLevel}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={assignment.strategyId}
                              onValueChange={(value) => handleUpdateAssignment(assignment.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {strategies.map((strategy) => (
                                  <SelectItem key={strategy.id} value={strategy.id}>
                                    {strategy.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete assignment</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <Badge className={getRiskLevelColor(strategy.riskLevel)}>
                      {getRiskLevelIcon(strategy.riskLevel)}
                      <span className="ml-1 capitalize">{strategy.riskLevel}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{strategy.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Expected Return</span>
                      <span className="font-medium text-green-600">
                        {formatReturn(strategy.expectedReturn)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Max Drawdown</span>
                      <span className="font-medium text-red-600">
                        {formatReturn(strategy.maxDrawdown)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Rebalance</span>
                      <span className="font-medium">
                        {formatFrequency(strategy.rebalanceFrequency)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex flex-wrap gap-1">
                      {strategy.assetClasses.map((assetClass) => (
                        <Badge key={assetClass} variant="outline" className="text-xs">
                          {assetClass}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyAssignmentEngine; 