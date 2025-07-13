import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { 
  RotateCcw,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  TrendingUp,
  TrendingDown,
  Info,
  Loader2
} from 'lucide-react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useAuth } from '../../hooks/useAuth';
import { 
  useRotationSchedule, 
  useTriggerRotation,
  rotationEngineService,
  type RotationSchedule,
  type RotationTrigger
} from '../../services/rotationEngineService';
import { useStrategyOverlays } from '../../services/strategyStackService';

// Signal icon helper
const getSignalIcon = (signal: string) => {
  switch (signal) {
    case 'bullish': return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'bearish': return <TrendingDown className="h-4 w-4 text-red-600" />;
    default: return <div className="h-4 w-4 rounded-full bg-gray-400" />;
  }
};

// Overlay selection card component
const OverlayCard: React.FC<{
  overlay: any;
  isSelected: boolean;
  onToggle: (id: string) => void;
}> = ({ overlay, isSelected, onToggle }) => (
  <div
    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
      isSelected
        ? 'border-primary bg-primary/5'
        : 'border-border hover:bg-muted/50'
    }`}
    onClick={() => onToggle(overlay.id)}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {getSignalIcon(overlay.signal)}
        <span className="font-medium">{overlay.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">
          {overlay.weight}%
        </span>
        {overlay.isActive && (
          <CheckCircle className="h-3 w-3 text-green-600" />
        )}
      </div>
    </div>
    
    <div className="flex items-center justify-between text-sm">
      <div className="text-muted-foreground">
        Performance: {overlay.performance >= 0 ? '+' : ''}{overlay.performance.toFixed(1)}%
      </div>
      <div className="text-muted-foreground">
        {overlay.lastRotation ? new Date(overlay.lastRotation).toLocaleString() : 'Never'}
      </div>
    </div>
  </div>
);

// Rotation timeline component
const RotationTimeline: React.FC<{
  overlays: any[];
  scheduledOverlays: string[];
}> = ({ overlays, scheduledOverlays }) => (
  <div className="space-y-3">
    <Label className="text-base font-medium">Rotation Timeline</Label>
    <div className="p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span>Inactive</span>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        {overlays.slice(0, 3).map((overlay) => (
          <div key={overlay.id} className="flex items-center justify-between p-2 bg-background rounded">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                overlay.isActive ? 'bg-green-500' : 
                scheduledOverlays.includes(overlay.id) ? 'bg-blue-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm">{overlay.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {overlay.isActive ? 'Active' : 
               scheduledOverlays.includes(overlay.id) ? 'Scheduled' : 'Inactive'}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const RotationEnginePanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State management
  const [selectedOverlayIds, setSelectedOverlayIds] = useState<string[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Fetch data using services
  const { data: rotationData, isLoading: isLoadingRotation } = useRotationSchedule(activeVaultId, user);
  const { data: overlayData, isLoading: isLoadingOverlays } = useStrategyOverlays(activeVaultId, user);

  // Trigger rotation mutation
  const triggerRotation = useTriggerRotation();

  // Extract first schedule for display (could be enhanced to handle multiple schedules)
  const currentSchedule = rotationData?.schedules?.[0];
  const rotationStatus = rotationData?.status;

  // Calculate time until next rotation using service
  const timeUntilRotation = useMemo(() => {
    if (!currentSchedule?.nextExecution) return null;
    return rotationEngineService.formatTimeRemaining(currentSchedule.nextExecution);
  }, [currentSchedule?.nextExecution]);

  // Calculate cooldown status using service
  const cooldownStatus = useMemo(() => {
    if (!currentSchedule?.cooldownEnds) return null;
    return rotationEngineService.formatCooldownRemaining(currentSchedule.cooldownEnds || undefined);
  }, [currentSchedule?.cooldownEnds]);

  // Check if manual trigger is available
  const canTriggerManually = currentSchedule?.isActive && !cooldownStatus;

  // Get schedule status badge using service
  const scheduleStatus = currentSchedule 
    ? rotationEngineService.getScheduleStatusBadge(currentSchedule)
    : null;

  // Handle overlay selection
  const handleOverlayToggle = (overlayId: string) => {
    const newSelectedOverlayIds = selectedOverlayIds.includes(overlayId) 
      ? selectedOverlayIds.filter(id => id !== overlayId)
      : [...selectedOverlayIds, overlayId];
    
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'rotation-engine',
        userId: user?.id || undefined,
        action: 'overlay_selection_toggle',
        timestamp: new Date().toISOString(),
        details: { 
          overlayId,
          isSelected: !selectedOverlayIds.includes(overlayId),
          totalSelected: newSelectedOverlayIds.length,
          vaultId: activeVaultId 
        }
      })
    }).catch(console.error);
    
    setSelectedOverlayIds(newSelectedOverlayIds);
  };

  // Handle manual rotation trigger
  const handleTriggerRotation = () => {
    if (selectedOverlayIds.length === 0) return;
    
    // Calculate rotation impact using service
    const impact = rotationEngineService.calculateRotationImpact(
      selectedOverlayIds, 
      overlayData?.overlays || []
    );
    
    // Log agent action
    fetch('/api/agent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: 'rotation-engine',
        userId: user?.id || undefined,
        action: 'manual_rotation_trigger',
        timestamp: new Date().toISOString(),
        details: { 
          selectedOverlayIds,
          estimatedImpact: impact,
          vaultId: activeVaultId 
        }
      })
    }).catch(console.error);
    
    const rotationTrigger: RotationTrigger = {
      overlayIds: selectedOverlayIds,
      force: true,
      reason: 'Manual trigger from dashboard',
      estimatedImpact: impact
    };
    
    triggerRotation.mutate(rotationTrigger, {
      onSuccess: () => {
        setIsConfirmModalOpen(false);
        setSelectedOverlayIds([]);
        
        // Log successful rotation
        fetch('/api/agent/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockId: 'rotation-engine',
            userId: user?.id || undefined,
            action: 'rotation_completed',
            timestamp: new Date().toISOString(),
            details: { 
              overlayIds: selectedOverlayIds,
              vaultId: activeVaultId 
            }
          })
        }).catch(console.error);
      }
    });
  };

  const overlays = overlayData?.overlays || [];
  const isLoading = isLoadingOverlays || isLoadingRotation;
  const scheduledOverlays = currentSchedule?.overlayIds || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Rotation Engine
            {currentSchedule?.isActive && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentSchedule?.frequency && (
              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {rotationEngineService.getFrequencyDisplayText(currentSchedule.frequency)}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-40 bg-muted rounded-lg"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Next Rotation Card */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Next Scheduled Rotation</span>
                </div>
                {timeUntilRotation && (
                  <Badge variant={timeUntilRotation === 'Ready to execute' ? 'destructive' : 'secondary'}>
                    {timeUntilRotation}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Scheduled: {currentSchedule?.nextExecution 
                    ? new Date(currentSchedule.nextExecution).toLocaleString() 
                    : 'Not scheduled'}
                </div>
                {currentSchedule?.lastExecution && (
                  <div className="text-sm text-muted-foreground">
                    Last rotation: {new Date(currentSchedule.lastExecution).toLocaleString()}
                  </div>
                )}
                {scheduledOverlays.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Scheduled overlays: {scheduledOverlays.length}
                  </div>
                )}
              </div>
            </div>

            {/* Cooldown Status */}
            {cooldownStatus && cooldownStatus !== 'Cooldown complete' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Rotation Cooldown Active</span>
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Manual rotation available in {cooldownStatus}
                </div>
              </div>
            )}

            {/* Rotation Status */}
            {rotationStatus?.isInProgress && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Rotation in Progress</span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {rotationStatus.currentStep && `Step: ${rotationStatus.currentStep}`}
                  {rotationStatus.progress && ` (${rotationStatus.progress}%)`}
                </div>
              </div>
            )}

            {/* Overlay Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Active Overlays</Label>
                <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={!canTriggerManually || selectedOverlayIds.length === 0}
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Trigger Rotation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Manual Rotation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-blue-700">
                          You are about to trigger a manual rotation for {selectedOverlayIds.length} overlay{selectedOverlayIds.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Selected Overlays:</div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {selectedOverlayIds.map(id => {
                            const overlay = overlays.find(o => o.id === id);
                            return overlay ? (
                              <li key={id} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                {overlay.name}
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                      
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <div className="text-sm">
                          This will trigger immediate portfolio rebalancing and may incur transaction fees.
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsConfirmModalOpen(false)}
                          disabled={triggerRotation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleTriggerRotation}
                          disabled={triggerRotation.isPending}
                        >
                          {triggerRotation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Triggering...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Confirm Rotation
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overlays.map((overlay) => (
                  <OverlayCard
                    key={overlay.id}
                    overlay={overlay}
                    isSelected={selectedOverlayIds.includes(overlay.id)}
                    onToggle={handleOverlayToggle}
                  />
                ))}
              </div>
              
              {selectedOverlayIds.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700">
                    {selectedOverlayIds.length} overlay{selectedOverlayIds.length > 1 ? 's' : ''} selected for rotation
                  </div>
                </div>
              )}
            </div>

            {/* Rotation Timeline */}
            <RotationTimeline overlays={overlays} scheduledOverlays={scheduledOverlays} />

            {/* Status Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">System Status</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• Rotation Engine: {currentSchedule?.isActive ? 'Active' : 'Inactive'}</div>
                <div>• Next Rotation: {timeUntilRotation || 'Not scheduled'}</div>
                <div>• Active Overlays: {overlays.filter(o => o.isActive).length}</div>
                <div>• Manual Trigger: {canTriggerManually ? 'Available' : 'Blocked'}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RotationEnginePanel; 