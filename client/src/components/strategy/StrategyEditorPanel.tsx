import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useToast } from '../ui/use-toast';
import { Slider } from '../ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Edit, Save, X, Plus, Trash2, History, Target, TrendingUp } from 'lucide-react';

interface StrategyAssignment {
  id: number;
  userId: number;
  positionId?: number;
  strategyName: string;
  confidence: number;
  metadata?: string;
  assignedAt: string;
  symbol?: string;
  positionName?: string;
  assetClass?: string;
}

interface StrategyEditData {
  strategyId: number;
  userId: number;
  assetClassWeights: Record<string, number>;
  rebalanceFrequency: string;
  riskTolerance: string;
  excludedAssets: string[];
  notes?: string;
}

interface StrategyEditorPanelProps {
  userId: number;
  onStrategyUpdated?: (strategyId: number) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const StrategyEditorPanel: React.FC<StrategyEditorPanelProps> = ({ 
  userId, 
  onStrategyUpdated 
}) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<StrategyAssignment[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyAssignment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  
  // Edit form state
  const [assetClassWeights, setAssetClassWeights] = useState<Record<string, number>>({
    equity: 60,
    bond: 25,
    crypto: 10,
    commodity: 5
  });
  const [rebalanceFrequency, setRebalanceFrequency] = useState('monthly');
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [excludedAssets, setExcludedAssets] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [newExcludedAsset, setNewExcludedAsset] = useState('');

  useEffect(() => {
    fetchStrategyAssignments();
  }, [userId]);

  const fetchStrategyAssignments = async () => {
    try {
      const response = await fetch(`/api/strategy/assignments/${userId}`);
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error fetching strategy assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load strategy assignments",
        variant: "destructive"
      });
    }
  };

  const fetchEditHistory = async (strategyId: number) => {
    try {
      const response = await fetch(`/api/strategy/edit/history/${strategyId}`);
      const data = await response.json();
      setEditHistory(data.edits || []);
    } catch (error) {
      console.error('Error fetching edit history:', error);
    }
  };

  const handleStrategySelect = (assignment: StrategyAssignment) => {
    setSelectedStrategy(assignment);
    
    // Load existing metadata if available
    if (assignment.metadata) {
      try {
        const metadata = JSON.parse(assignment.metadata);
        if (metadata.customWeights) setAssetClassWeights(metadata.customWeights);
        if (metadata.rebalanceFrequency) setRebalanceFrequency(metadata.rebalanceFrequency);
        if (metadata.riskTolerance) setRiskTolerance(metadata.riskTolerance);
        if (metadata.excludedAssets) setExcludedAssets(metadata.excludedAssets);
      } catch (e) {
        console.warn('Could not parse strategy metadata');
      }
    }
    
    fetchEditHistory(assignment.id);
  };

  const handleWeightChange = (assetClass: string, value: number[]) => {
    setAssetClassWeights(prev => ({
      ...prev,
      [assetClass]: value[0]
    }));
  };

  const addExcludedAsset = () => {
    if (newExcludedAsset && !excludedAssets.includes(newExcludedAsset)) {
      setExcludedAssets(prev => [...prev, newExcludedAsset]);
      setNewExcludedAsset('');
    }
  };

  const removeExcludedAsset = (asset: string) => {
    setExcludedAssets(prev => prev.filter(a => a !== asset));
  };

  const validateWeights = () => {
    const total = Object.values(assetClassWeights).reduce((sum, weight) => sum + weight, 0);
    return Math.abs(total - 100) <= 5; // Allow 5% tolerance
  };

  const handleSave = async () => {
    if (!selectedStrategy) return;
    
    if (!validateWeights()) {
      toast({
        title: "Invalid Weights",
        description: "Asset class weights must sum to approximately 100%",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    const editData: StrategyEditData = {
      strategyId: selectedStrategy.id,
      userId,
      assetClassWeights,
      rebalanceFrequency,
      riskTolerance,
      excludedAssets,
      notes
    };

    try {
      const response = await fetch(`/api/strategy/edit/${selectedStrategy.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Strategy Updated",
          description: result.message,
        });
        setIsEditing(false);
        fetchEditHistory(selectedStrategy.id);
        onStrategyUpdated?.(selectedStrategy.id);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update strategy",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pieChartData = Object.entries(assetClassWeights).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    percentage: value
  }));

  const barChartData = Object.entries(assetClassWeights).map(([key, value]) => ({
    assetClass: key.charAt(0).toUpperCase() + key.slice(1),
    weight: value
  }));

  const totalWeight = Object.values(assetClassWeights).reduce((sum, weight) => sum + weight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) <= 5;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategy Editor</h1>
          <p className="text-gray-600 mt-1">Edit and customize your portfolio strategies</p>
        </div>
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium">Block 5</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Strategy Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No strategies assigned</p>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStrategy?.id === assignment.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleStrategySelect(assignment)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{assignment.strategyName}</h4>
                        {assignment.symbol && (
                          <p className="text-sm text-gray-600">{assignment.symbol}</p>
                        )}
                        <Badge variant="outline" className="mt-1">
                          {Math.round(assignment.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      {selectedStrategy?.id === assignment.id && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(!isEditing);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Strategy Editor */}
        {selectedStrategy && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Edit Strategy: {selectedStrategy.strategyName}</span>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading || !isWeightValid}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <>
                  {/* Asset Class Weights */}
                  <div>
                    <Label className="text-base font-medium">Asset Class Allocation</Label>
                    <div className="mt-3 space-y-4">
                      {Object.entries(assetClassWeights).map(([assetClass, weight]) => (
                        <div key={assetClass} className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="capitalize">{assetClass}</Label>
                            <span className="text-sm font-medium">{weight}%</span>
                          </div>
                          <Slider
                            value={[weight]}
                            onValueChange={(value) => handleWeightChange(assetClass, value)}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">Total:</span>
                        <span className={`font-bold ${isWeightValid ? 'text-green-600' : 'text-red-600'}`}>
                          {totalWeight.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Configuration Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rebalanceFrequency">Rebalance Frequency</Label>
                      <Select value={rebalanceFrequency} onValueChange={setRebalanceFrequency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                      <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">Conservative</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Excluded Assets */}
                  <div>
                    <Label>Excluded Assets</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Asset symbol (e.g., TSLA)"
                          value={newExcludedAsset}
                          onChange={(e) => setNewExcludedAsset(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && addExcludedAsset()}
                        />
                        <Button onClick={addExcludedAsset} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {excludedAssets.map((asset) => (
                          <Badge
                            key={asset}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {asset}
                            <button
                              onClick={() => removeExcludedAsset(asset)}
                              className="hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes about this strategy..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Strategy Visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Asset Allocation</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Weight Distribution</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barChartData}>
                          <XAxis dataKey="assetClass" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="weight" fill="#0088FE" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Strategy Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm text-gray-600">Rebalance Frequency</h4>
                      <p className="capitalize">{rebalanceFrequency}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-600">Risk Tolerance</h4>
                      <p className="capitalize">{riskTolerance}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-600">Excluded Assets</h4>
                      <p>{excludedAssets.length || 'None'}</p>
                    </div>
                  </div>

                  {/* Edit History */}
                  {editHistory.length > 0 && (
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Recent Changes
                      </h4>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {editHistory.slice(0, 5).map((edit, index) => (
                          <div key={edit.id} className="text-sm p-2 bg-gray-50 rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">Version {edit.version}</span>
                              <span className="text-gray-500">
                                {new Date(edit.editedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-600">
                              {edit.riskTolerance} risk, {edit.rebalanceFrequency} rebalancing
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StrategyEditorPanel; 