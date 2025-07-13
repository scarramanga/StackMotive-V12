import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Settings, Save, Zap, RotateCcw, TrendingUp, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { overlayWeightOptimizerService } from '../../services/overlayWeightOptimizerService';

interface OverlayWeight {
  id: string;
  name: string;
  currentWeight: number;
  targetWeight: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  performance: number;
  riskLevel: 'low' | 'medium' | 'high';
  isActive: boolean;
}

export const OverlayWeightOptimizerPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const queryClient = useQueryClient();
  
  // Simplified state using service methods
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // User data for service calls
  const userId = (user as any)?.id || '1';
  const vaultId = activeVaultId || undefined;

  // Fetch overlay data
  const { data: overlayData, isLoading, error } = useQuery({
    queryKey: ['/api/strategy/overlays', activeVaultId],
    queryFn: async () => {
      const url = activeVaultId 
        ? `/api/strategy/overlays?vaultId=${activeVaultId}`
        : '/api/strategy/overlays';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch strategy overlays');
      return res.json();
    },
    enabled: !!user && !!activeVaultId,
    refetchInterval: 30000,
  });

  // Initialize weights using service
  useEffect(() => {
    if (overlayData?.overlays) {
      const initialWeights = overlayWeightOptimizerService.initializeWeights(overlayData);
      setWeights(initialWeights);
      setHasChanges(false);
    }
  }, [overlayData]);

  // Handle weight change using service
  const handleWeightChange = async (overlayId: string, newWeight: number) => {
    const result = await overlayWeightOptimizerService.handleWeightChange(
      overlayId, newWeight, weights, userId, vaultId
    );
    
    if (result.error) {
      setSaveStatus(overlayWeightOptimizerService.createStatusMessage('error', result.error));
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    
    setWeights(result.updatedWeights);
    setHasChanges(result.hasChanges);
  };

  // Handle auto-optimization using service
  const handleOptimize = async () => {
    setIsOptimizing(true);
    const result = await overlayWeightOptimizerService.handleAutoOptimization(activeVaultId, userId, vaultId);
    
    if (result.success && result.suggestions) {
      const newWeights = overlayWeightOptimizerService.applyOptimizationSuggestions(weights, result.suggestions);
      setWeights(newWeights);
      setHasChanges(true);
      setSaveStatus(overlayWeightOptimizerService.createStatusMessage('success', 'Optimization suggestions applied'));
    } else {
      setSaveStatus(overlayWeightOptimizerService.createStatusMessage('error', result.error || 'Failed to optimize weights'));
    }
    
    setTimeout(() => setSaveStatus(null), 3000);
    setIsOptimizing(false);
  };

  // Handle save using service
  const handleSave = async () => {
    setIsSaving(true);
    const result = await overlayWeightOptimizerService.handleSaveWeights(
      weights, overlayData, activeVaultId, userId, vaultId
    );
    
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['/api/strategy/overlays'] });
      setHasChanges(false);
      setSaveStatus(overlayWeightOptimizerService.createStatusMessage('success', 'Weights updated successfully'));
    } else {
      setSaveStatus(overlayWeightOptimizerService.createStatusMessage('error', result.error || 'Failed to save weights'));
    }
    
    setTimeout(() => setSaveStatus(null), 3000);
    setIsSaving(false);
  };

  // Handle reset using service
  const handleReset = async () => {
    const result = await overlayWeightOptimizerService.handleResetWeights(overlayData, userId, vaultId);
    setWeights(result.resetWeights);
    setHasChanges(result.hasChanges);
  };

  // Weight validation using service
  const validation = overlayWeightOptimizerService.validateWeights(weights);
  const isValidTotal = validation.isValid;
  const totalWeight = validation.totalWeight;

  // UI helper functions (kept minimal)
  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'bearish': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'high': return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{riskLevel}</Badge>;
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading overlay data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Overlay Weight Optimizer
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">Unsaved Changes</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-sm ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
              Total: {totalWeight.toFixed(1)}%
            </div>
            {!isValidTotal && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handleOptimize} disabled={isOptimizing} variant="outline">
              {isOptimizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Optimize
                </>
              )}
            </Button>
            
            <Button onClick={handleReset} disabled={!hasChanges} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <Button onClick={handleSave} disabled={!hasChanges || !isValidTotal || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Weights
                </>
              )}
            </Button>
          </div>

          {/* Validation Messages */}
          {!isValidTotal && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{validation.error}</span>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {saveStatus && (
            <div className={`p-3 rounded-lg border ${
              saveStatus.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {saveStatus.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{saveStatus.message}</span>
              </div>
            </div>
          )}

          {/* Overlay Weight Controls */}
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : overlayData?.overlays?.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No overlays available</h3>
              <p className="text-muted-foreground">No strategy overlays found for weight optimization</p>
            </div>
          ) : (
            <div className="space-y-4">
              {overlayData.overlays.map((overlay: OverlayWeight) => (
                <div key={overlay.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getSignalIcon(overlay.signal)}
                      <div>
                        <div className="font-medium">{overlay.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {overlay.currentWeight.toFixed(1)}% • Performance: {overlay.performance >= 0 ? '+' : ''}{overlay.performance.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRiskBadge(overlay.riskLevel)}
                      {overlay.isActive && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium w-20">Weight:</Label>
                      <div className="flex-1">
                        <Slider
                          value={[weights[overlay.id] || 0]}
                          onValueChange={(value) => handleWeightChange(overlay.id, value[0])}
                          max={100}
                          step={0.1}
                          className="flex-1"
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={weights[overlay.id]?.toFixed(1) || '0.0'}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (value >= 0 && value <= 100) {
                              handleWeightChange(overlay.id, value);
                            }
                          }}
                          min={0}
                          max={100}
                          step={0.1}
                          className="text-center"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-4">%</span>
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                    
                    {Math.abs(weights[overlay.id] - overlay.currentWeight) > 0.1 && (
                      <div className="text-xs text-blue-600">
                        Change: {weights[overlay.id] > overlay.currentWeight ? '+' : ''}{(weights[overlay.id] - overlay.currentWeight).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Optimization Summary</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Adjust overlay weights using sliders or direct input</div>
              <div>• Use Auto-Optimize for AI-suggested weight distribution</div>
              <div>• Total allocation must equal 100% to save changes</div>
              <div>• Changes take effect immediately after saving</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverlayWeightOptimizerPanel; 