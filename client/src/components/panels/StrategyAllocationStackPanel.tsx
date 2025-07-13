import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Layers,
  Percent,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import StrategyAllocationStackService, {
  useStrategyOverlays,
  useProcessedAllocationData,
  useAllocationInsights,
  useAllocationStackState,
  formatCurrency,
  formatPercentage,
  formatPerformance,
  formatLastUpdated,
  getSignalColor,
  getAllocationColorClass,
  getSignalStrengthColorClass,
  type StrategyOverlay
} from '../../services/strategyAllocationStackService';

// Signal icon component using service
const SignalIcon: React.FC<{ signal: string }> = ({ signal }) => {
  const signalConfig = StrategyAllocationStackService.getSignalConfig(signal);
  
  switch (signalConfig.icon) {
    case 'trending-up':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'trending-down':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <div className="h-4 w-4 rounded-full bg-gray-400" />;
  }
};

export const StrategyAllocationStackPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // Using service hooks for data fetching
  const { data: allocationData, isLoading, error } = useStrategyOverlays(activeVaultId || undefined, !!user && !!activeVaultId);
  
  // Using service hooks for business logic
  const processedData = useProcessedAllocationData(allocationData as any);
  const allocationInsights = useAllocationInsights(processedData);
  const { state, toggleStrategyDetail } = useAllocationStackState();

  // Event handlers using service
  const handleStrategyToggle = (strategyId: string) => {
    toggleStrategyDetail(strategyId);
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading strategy allocations: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Strategy Allocation Stack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!processedData || processedData.overlays.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Strategy Allocation Stack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No active strategies</h3>
            <p className="text-muted-foreground">
              No strategy overlays are currently active in your portfolio
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Strategy Allocation Stack
              <Badge variant="secondary" className="text-xs">
                {processedData.strategyCount} strategies
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatPercentage(processedData.strategyCoverage)} covered
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{processedData.strategyCount}</div>
                <div className="text-xs text-muted-foreground">Active Strategies</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatPercentage(processedData.strategyCoverage)}</div>
                <div className="text-xs text-blue-600">Portfolio Coverage</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(processedData.totalValue)}</div>
                <div className="text-xs text-green-600">Total Value</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{formatPercentage(processedData.totalWeight)}</div>
                <div className="text-xs text-purple-600">Total Weight</div>
              </div>
            </div>

            {/* Stacked Horizontal Bar Chart */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Allocation Overview</span>
              </div>
              
              <div className="relative">
                <div className="h-8 bg-muted rounded-lg overflow-hidden flex">
                  {processedData.overlays.map((overlay, index) => {
                    const widthPercent = (overlay.weight / 100) * 100;
                    return (
                      <Tooltip key={overlay.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-full ${getAllocationColorClass(index)} transition-opacity hover:opacity-80 cursor-pointer`}
                            style={{ width: `${widthPercent}%` }}
                            onClick={() => handleStrategyToggle(overlay.id)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{overlay.name}</div>
                            <div className="text-sm">Weight: {formatPercentage(overlay.weight)}</div>
                            <div className="text-sm">Signal Strength: {overlay.signalStrength}%</div>
                            <div className="text-sm">Value: {formatCurrency(overlay.totalValue)}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  
                  {/* Uncovered portion */}
                  {processedData.strategyCoverage < 100 && (
                    <div
                      className="h-full bg-gray-200"
                      style={{ width: `${100 - processedData.strategyCoverage}%` }}
                    />
                  )}
                </div>
                
                {/* Percentage markers */}
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Strategy Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Strategy Details</span>
                <span className="text-xs text-muted-foreground">(click to expand)</span>
              </div>
              
              <div className="space-y-2">
                {processedData.overlays.map((overlay: StrategyOverlay, index: number) => {
                  const isExpanded = state.expandedStrategies.has(overlay.id);
                  
                  return (
                    <div key={overlay.id} className="border border-border rounded-lg overflow-hidden">
                      <button
                        className="w-full p-3 hover:bg-muted/50 transition-colors"
                        onClick={() => handleStrategyToggle(overlay.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded ${getAllocationColorClass(index)}`} />
                            <div className="text-left">
                              <div className="font-medium">{overlay.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatPercentage(overlay.weight)} • {formatCurrency(overlay.totalValue)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <SignalIcon signal={overlay.signal} />
                            <Badge variant="secondary" className="text-xs">
                              {overlay.signalStrength}%
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-border p-3 bg-muted/25">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Category</div>
                              <div className="text-sm font-medium">{overlay.category}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Performance</div>
                              <div className={`text-sm font-medium ${
                                overlay.performance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatPerformance(overlay.performance)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Signal Strength</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={getSignalStrengthColorClass(overlay.signalStrength)}
                                    style={{ width: `${overlay.signalStrength}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{overlay.signalStrength}%</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Last Updated</div>
                              <div className="text-sm font-medium">
                                {formatLastUpdated(overlay.lastUpdated)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Panel */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Allocation Info</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• Portfolio coverage represents the percentage of your portfolio managed by active strategies</div>
                <div>• Signal strength indicates the confidence level of each strategy's current signal</div>
                <div>• Click on any strategy bar or row to view detailed information</div>
                <div>• Uncovered portion (gray) represents manual or unmanaged allocations</div>
                {allocationInsights && allocationInsights.recommendations.length > 0 && (
                  <div>• <strong>Insights:</strong> {allocationInsights.recommendations[0]}</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default StrategyAllocationStackPanel; 