import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  CheckCircle, TrendingUp, TrendingDown, Download, FileText, Eye, EyeOff, AlertTriangle, Award, Target, BarChart3, Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  postRebalanceSummaryService,
  useRebalanceSummary,
  useMarkAsReviewed,
  RebalanceResult,
  SummaryState
} from '../../services/postRebalanceSummaryService';

export const PostRebalanceSummaryPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // User data for logging
  const userId = (user as any)?.id || '1';
  const vaultId = activeVaultId || undefined;

  // Summary state using service logic
  const [summaryState, setSummaryState] = useState<SummaryState>(
    () => postRebalanceSummaryService.createInitialState()
  );

  // Use service hooks
  const { data: summaryData, isLoading, error } = useRebalanceSummary(activeVaultId, user);
  const markAsReviewed = useMarkAsReviewed();

  // Handler functions with logging
  const handleToggleExpanded = async () => {
    const newState = postRebalanceSummaryService.toggleExpanded(summaryState);
    setSummaryState(newState);
    
    await postRebalanceSummaryService.logAgentMemory('summary_expanded', {
      userId, vaultId,
      metadata: { 
        expanded: newState.isExpanded,
        rebalanceId: summaryData?.result?.id 
      }
    });
  };

  const handleNotesChange = (value: string) => {
    const newState = postRebalanceSummaryService.updateNotes(summaryState, value);
    setSummaryState(newState);
  };

  const handleExportPDF = async () => {
    if (!summaryData?.result) return;
    
    setSummaryState(postRebalanceSummaryService.setExporting(summaryState, true));
    
    try {
      const blob = await postRebalanceSummaryService.exportToPDF(
        summaryData.result.id, 
        activeVaultId
      );
      
      const filename = postRebalanceSummaryService.createExportFilename(
        summaryData.result.id, 
        'pdf'
      );
      
      await postRebalanceSummaryService.handlePDFDownload(blob, filename);
      
      await postRebalanceSummaryService.logAgentMemory('summary_exported', {
        userId, vaultId,
        metadata: { 
          rebalanceId: summaryData.result.id,
          format: 'pdf',
          filename 
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setSummaryState(postRebalanceSummaryService.setExporting(summaryState, false));
    }
  };

  const handleMarkReviewed = async () => {
    if (!summaryData?.result) return;
    
    const validation = postRebalanceSummaryService.validateReviewNotes(summaryState.notes);
    
    markAsReviewed.mutate({
      rebalanceId: summaryData.result.id,
      userNotes: validation.trimmed,
      vaultId: activeVaultId
    });

    await postRebalanceSummaryService.logAgentMemory('rebalance_reviewed', {
      userId, vaultId,
      metadata: {
        rebalanceId: summaryData.result.id,
        hasNotes: !!validation.trimmed,
        notesLength: validation.trimmed.length
      }
    });
  };

  // Initialize notes from existing data
  useEffect(() => {
    if (summaryData?.result) {
      const newState = postRebalanceSummaryService.updateNotesFromData(
        summaryState, 
        summaryData.result
      );
      setSummaryState(newState);
    }
  }, [summaryData]);

  // Log initial view
  useEffect(() => {
    if (summaryData?.result) {
      postRebalanceSummaryService.logAgentMemory('summary_viewed', {
        userId, vaultId,
        metadata: { 
          rebalanceId: summaryData.result.id,
          status: summaryData.result.status,
          isReviewed: summaryData.result.isReviewed
        }
      });
    }
  }, [summaryData?.result?.id]);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading rebalance summary: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading rebalance summary...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summaryData?.result) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No recent rebalance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const result = summaryData.result;
  
  // Use service methods for UI logic
  const statusBadge = postRebalanceSummaryService.getStatusBadge(result.status);
  const summaryStats = postRebalanceSummaryService.calculateSummaryStats(result);
  const performanceRating = postRebalanceSummaryService.calculatePerformanceRating(result);
  const costEfficiency = postRebalanceSummaryService.calculateCostEfficiency(result.costs, result.summary.totalValue);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Post-Rebalance Summary
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            {result.isReviewed && (
              <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleToggleExpanded}>
              {summaryState.isExpanded ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPDF}
              disabled={summaryState.isExporting}
            >
              {summaryState.isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-blue-600" />
              <div className="font-medium text-blue-800">Rebalance Completed</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-blue-600 mb-1">Duration</div>
                <div className="font-bold">{postRebalanceSummaryService.formatDuration(result.duration)}</div>
              </div>
              <div>
                <div className="text-xs text-blue-600 mb-1">Total Trades</div>
                <div className="font-bold">{result.summary.totalTrades}</div>
              </div>
              <div>
                <div className="text-xs text-blue-600 mb-1">Success Rate</div>
                <div className="font-bold">{result.summary.successRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-blue-600 mb-1">Total Value</div>
                <div className="font-bold">{postRebalanceSummaryService.formatCurrency(result.summary.totalValue)}</div>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.performance.winningOverlays}</div>
              <div className="text-sm text-green-700">Winning Overlays</div>
              <TrendingUp className="h-6 w-6 mx-auto mt-2 text-green-600" />
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{result.performance.losingOverlays}</div>
              <div className="text-sm text-red-700">Losing Overlays</div>
              <TrendingDown className="h-6 w-6 mx-auto mt-2 text-red-600" />
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{result.performance.neutralOverlays}</div>
              <div className="text-sm text-gray-700">Neutral Overlays</div>
              <Target className="h-6 w-6 mx-auto mt-2 text-gray-600" />
            </div>
          </div>

          {/* Risk Delta Analysis */}
          <div className="p-4 border border-border rounded-lg">
            <h3 className="font-medium mb-3">Risk Analysis</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Risk Before</div>
                <div className="font-medium">{result.summary.riskDeltaBefore.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Risk After</div>
                <div className="font-medium">{result.summary.riskDeltaAfter.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Improvement</div>
                <div className={`font-bold ${postRebalanceSummaryService.getRiskImprovementColor(result.summary.riskImprovement)}`}>
                  {postRebalanceSummaryService.formatPercentage(result.summary.riskImprovement)}
                </div>
              </div>
            </div>
          </div>

          {summaryState.isExpanded && (
            <>
              {/* Overlay Changes */}
              <div>
                <h3 className="font-medium mb-4">Overlay Changes</h3>
                <div className="space-y-3">
                  {result.affectedOverlays.map((overlay) => {
                    const overlayStatusBadge = postRebalanceSummaryService.getStatusBadge(overlay.executionStatus);
                    const performanceBadge = postRebalanceSummaryService.getPerformanceBadge(overlay.performance);
                    
                    return (
                      <div key={overlay.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="font-medium">{overlay.name}</div>
                            <Badge className={overlayStatusBadge.className}>{overlayStatusBadge.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={performanceBadge.className}>{performanceBadge.label}</Badge>
                            <div className="text-sm text-muted-foreground">
                              {overlay.trades} trades
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Previous Weight</div>
                            <div className="font-medium">{overlay.previousWeight.toFixed(2)}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">New Weight</div>
                            <div className="font-medium">{overlay.newWeight.toFixed(2)}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Change</div>
                            <div className={`font-bold ${postRebalanceSummaryService.getWeightChangeColor(overlay.weightChange)}`}>
                              {postRebalanceSummaryService.formatPercentage(overlay.weightChange)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Value</div>
                            <div className="font-medium">{postRebalanceSummaryService.formatCurrency(overlay.value)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-3">Cost Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-yellow-600 mb-1">Trading Fees</div>
                    <div className="font-medium text-yellow-800">{postRebalanceSummaryService.formatCurrency(result.costs.tradingFees)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-yellow-600 mb-1">Slippage</div>
                    <div className="font-medium text-yellow-800">{postRebalanceSummaryService.formatCurrency(result.costs.slippage)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-yellow-600 mb-1">Gas Fees (ETH)</div>
                    <div className="font-medium text-yellow-800">{postRebalanceSummaryService.formatCurrency(result.costs.gasFeesEth)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-yellow-600 mb-1">Total Cost</div>
                    <div className="font-bold text-yellow-800">{postRebalanceSummaryService.formatCurrency(result.costs.totalCost)}</div>
                  </div>
                </div>
              </div>

              {/* Performance Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <div className="font-medium text-green-800">Best Performer</div>
                  </div>
                  <div className="text-sm text-green-700">{result.performance.bestPerformer}</div>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div className="font-medium text-red-800">Worst Performer</div>
                  </div>
                  <div className="text-sm text-red-700">{result.performance.worstPerformer}</div>
                </div>
              </div>
            </>
          )}

          {/* Review Section */}
          {!result.isReviewed && (
            <div className="border-t border-border pt-6">
              <h3 className="font-medium mb-4">Mark as Reviewed</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Review Notes (Optional)
                  </label>
                  <textarea
                    value={summaryState.notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add notes about this rebalance's performance..."
                    className="w-full p-3 border border-border rounded-lg resize-none"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleMarkReviewed}
                  disabled={markAsReviewed.isPending}
                >
                  {markAsReviewed.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marking as Reviewed...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Reviewed
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Export Summary */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Export Options</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• <strong>PDF Export:</strong> Includes all summary data, performance metrics, and charts</div>
              <div>• <strong>Review Status:</strong> Track which rebalances have been analyzed</div>
              <div>• <strong>Performance Tracking:</strong> Win/loss ratios and risk improvement metrics</div>
            </div>
          </div>

          {/* Error Display */}
          {markAsReviewed.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">
                Error marking as reviewed: {markAsReviewed.error.message}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostRebalanceSummaryPanel; 