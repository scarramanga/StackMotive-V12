import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { 
  Settings,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Shield,
  Target
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserPreferencesService, {
  useUserPreferences,
  useAvailableAssets,
  useUpdatePreferences,
  useResetPreferences,
  usePreferencesForm,
  ROTATION_OPTIONS,
  getRotationOptionByValue,
  formatExcludedAssetsText,
  calculatePortfolioImpact,
  type AssetOption,
  type UserPreferences
} from '../../services/userPreferencesService';

export const UserPreferencesPanel: React.FC = () => {
  const { user } = useAuth();
  
  // React Query hooks
  const { data: preferences, isLoading } = useUserPreferences(!!user);
  const { data: availableAssets = [] } = useAvailableAssets(!!user);
  const updatePreferences = useUpdatePreferences();
  const resetPreferences = useResetPreferences();
  
  // Form management hook
  const {
    formState,
    toggleAutoTrim,
    setRotationAggressiveness,
    toggleAssetExclusion,
    resetForm,
    toast,
    showToast,
    clearToast
  } = usePreferencesForm(preferences as UserPreferences);

  // Event handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.hasChanges || !formState.isValid) return;
    
    try {
      await updatePreferences.mutateAsync(formState.data);
      showToast('success', 'Preferences updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update preferences');
    }
  };

  const handleReset = () => {
    resetForm();
    showToast('info', 'Changes reset');
  };

  const handleResetToDefaults = async () => {
    try {
      await resetPreferences.mutateAsync();
      showToast('success', 'Preferences reset to defaults');
    } catch (error) {
      showToast('error', 'Failed to reset preferences');
    }
  };

  // Calculate portfolio impact
  const portfolioImpact = calculatePortfolioImpact(formState.data, availableAssets as AssetOption[]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-40 bg-muted rounded-lg"></div>
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
            User Preferences
            {formState.hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            User Settings
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Auto-Trim Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-trim" className="text-base font-medium">
                  Auto-Trim Mode
                </Label>
                <div className="text-sm text-muted-foreground">
                  Automatically trim positions that fall below minimum thresholds
                </div>
              </div>
              <Switch
                id="auto-trim"
                checked={formState.data.autoTrimMode}
                onCheckedChange={toggleAutoTrim}
              />
            </div>
            
            {formState.data.autoTrimMode && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Auto-trim enabled</span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Positions below 1% allocation will be automatically trimmed during rebalancing
                </div>
              </div>
            )}
          </div>

          {/* Rotation Aggressiveness */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-medium">Rotation Aggressiveness</Label>
              <div className="text-sm text-muted-foreground">
                Controls how frequently and aggressively the portfolio rebalances
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ROTATION_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formState.data.rotationAggressiveness === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setRotationAggressiveness(option.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{option.label}</div>
                    {formState.data.rotationAggressiveness === option.value && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {option.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.rebalanceFrequency} • {(option.toleranceThreshold * 100).toFixed(0)}% threshold
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Excluded Assets */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-medium">Exclude from Rotation</Label>
              <div className="text-sm text-muted-foreground">
                Select assets to exclude from automatic overlay rotation
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(availableAssets as AssetOption[]).map((asset: AssetOption) => {
                const isExcluded = formState.data.excludedAssets.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isExcluded
                        ? 'border-red-200 bg-red-50'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => toggleAssetExclusion(asset.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">{asset.name}</div>
                      </div>
                      <div className="text-right">
                        {asset.currentAllocation && (
                          <div className="text-sm font-medium">
                            {asset.currentAllocation.toFixed(1)}%
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {isExcluded ? 'Excluded' : 'Included'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {formState.data.excludedAssets.length > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {formatExcludedAssetsText(formState.data.excludedAssets.length)}
                  </span>
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Excluded assets will maintain their current allocation during rebalancing
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Active allocation: {portfolioImpact.activeAllocation.toFixed(1)}% • 
                  Excluded allocation: {portfolioImpact.excludedAllocation.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Form Errors */}
          {Object.keys(formState.errors).length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Please fix the following errors:</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {Object.entries(formState.errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={!formState.hasChanges || !formState.isValid || updatePreferences.isPending}
              className="flex-1 md:flex-none"
            >
              {updatePreferences.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!formState.hasChanges || updatePreferences.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleResetToDefaults}
              disabled={resetPreferences.isPending}
            >
              Reset to Defaults
            </Button>
          </div>
        </form>

        {/* Toast Notification */}
        {toast && (
          <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : toast.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : toast.type === 'warning'
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : toast.type === 'error' ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <div className="text-sm">{toast.message}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserPreferencesPanel; 