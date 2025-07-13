import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Folder, RefreshCw, Settings, FileText, Database, Tag, BarChart3, Clock, 
  AlertCircle, CheckCircle, Loader2, FolderOpen, Link, Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  obsidianSyncSettingsService,
  useObsidianSyncSettings,
  useUpdateSyncSettings,
  useManualSync,
  useAddVault,
  SyncSettingsState,
  SyncSettings
} from '../../services/obsidianSyncSettingsService';

export const ObsidianSyncSettingsPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // User data for logging
  const userId = (user as any)?.id || '1';
  const vaultId = activeVaultId || undefined;

  // Settings state using service logic
  const [settingsState, setSettingsState] = useState<SyncSettingsState>(
    () => obsidianSyncSettingsService.createInitialState()
  );

  // Use service hooks
  const { data: syncData, isLoading, error } = useObsidianSyncSettings(activeVaultId, user);
  const updateSettings = useUpdateSyncSettings();
  const manualSync = useManualSync();
  const addVault = useAddVault();

  // Handler functions with logging
  const handleSettingsChange = async (key: keyof SyncSettings, value: any) => {
    const newState = obsidianSyncSettingsService.updateTempSettings(
      settingsState, 
      key, 
      value
    );
    setSettingsState(newState);
    
    await obsidianSyncSettingsService.logAgentMemory('settings_updated', {
      userId, vaultId,
      metadata: { 
        settingKey: key,
        settingValue: value,
        hasUnsavedChanges: obsidianSyncSettingsService.hasUnsavedChanges(newState.tempSettings)
      }
    });
  };

  const handleDataTypeToggle = async (dataTypeId: string, enabled: boolean) => {
    if (!syncData) return;
    
    const newState = obsidianSyncSettingsService.handleDataTypeToggle(
      settingsState,
      syncData,
      dataTypeId,
      enabled
    );
    setSettingsState(newState);
    
    await obsidianSyncSettingsService.logAgentMemory('data_type_toggled', {
      userId, vaultId,
      metadata: { 
        dataTypeId,
        enabled,
        totalEnabledTypes: syncData.settings.dataTypes.filter(dt => dt.enabled).length
      }
    });
  };

  const handleSaveSettings = async () => {
    updateSettings.mutate(
      { settings: settingsState.tempSettings, vaultId: activeVaultId },
      {
        onSuccess: () => {
          setSettingsState(obsidianSyncSettingsService.clearTempSettings(settingsState));
        }
      }
    );

    await obsidianSyncSettingsService.logAgentMemory('settings_updated', {
      userId, vaultId,
      metadata: { 
        settingsKeys: Object.keys(settingsState.tempSettings),
        settingsCount: Object.keys(settingsState.tempSettings).length
      }
    });
  };

  const handleManualSync = async () => {
    setSettingsState(obsidianSyncSettingsService.setManualSyncing(settingsState, true));
    
    manualSync.mutate(
      { vaultId: activeVaultId },
      {
        onSuccess: () => {
          setSettingsState(obsidianSyncSettingsService.setManualSyncing(settingsState, false));
        },
        onError: () => {
          setSettingsState(obsidianSyncSettingsService.setManualSyncing(settingsState, false));
        }
      }
    );

    await obsidianSyncSettingsService.logAgentMemory('manual_sync_triggered', {
      userId, vaultId,
      metadata: { 
        syncType: 'full',
        selectedVaultId: syncData?.settings.selectedVaultId
      }
    });
  };

  const handleSyncDataType = async (dataTypeId: string) => {
    setSettingsState(obsidianSyncSettingsService.setManualSyncing(settingsState, true));
    
    manualSync.mutate(
      { vaultId: activeVaultId, dataTypes: [dataTypeId] },
      {
        onSuccess: () => {
          setSettingsState(obsidianSyncSettingsService.setManualSyncing(settingsState, false));
        },
        onError: () => {
          setSettingsState(obsidianSyncSettingsService.setManualSyncing(settingsState, false));
        }
      }
    );

    await obsidianSyncSettingsService.logAgentMemory('manual_sync_triggered', {
      userId, vaultId,
      metadata: { 
        syncType: 'partial',
        dataTypeId
      }
    });
  };

  const handleVaultPathChange = (value: string) => {
    const newState = obsidianSyncSettingsService.updateNewVaultPath(settingsState, value);
    setSettingsState(newState);
  };

  const handleAddVault = async () => {
    const validation = obsidianSyncSettingsService.validateVaultPath(settingsState.newVaultPath);
    
    if (!validation.isValid) {
      console.error('Invalid vault path:', validation.error);
      return;
    }
    
    addVault.mutate(
      { path: settingsState.newVaultPath.trim(), vaultId: activeVaultId },
      {
        onSuccess: () => {
          setSettingsState(obsidianSyncSettingsService.clearNewVaultPath(settingsState));
        }
      }
    );

    await obsidianSyncSettingsService.logAgentMemory('vault_added', {
      userId, vaultId,
      metadata: { 
        vaultPath: settingsState.newVaultPath.trim()
      }
    });
  };

  const handleVaultSelection = async (selectedVaultId: string) => {
    await handleSettingsChange('selectedVaultId', selectedVaultId);
    
    await obsidianSyncSettingsService.logAgentMemory('vault_selected', {
      userId, vaultId,
      metadata: { 
        selectedVaultId,
        vaultName: syncData?.vaults.find(v => v.id === selectedVaultId)?.name
      }
    });
  };

  // Log initial view
  useEffect(() => {
    if (syncData) {
      obsidianSyncSettingsService.logAgentMemory('settings_viewed', {
        userId, vaultId,
        metadata: { 
          vaultCount: syncData.vaults.length,
          selectedVaultId: syncData.settings.selectedVaultId,
          autoSyncEnabled: syncData.settings.autoSync
        }
      });
    }
  }, [syncData?.settings.selectedVaultId]);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading Obsidian sync settings: {error.message}
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
            Loading Obsidian sync settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!syncData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No Obsidian sync data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use service methods for UI logic
  const currentSettings = obsidianSyncSettingsService.getCurrentSettings(syncData, settingsState.tempSettings);
  const selectedVault = obsidianSyncSettingsService.getSelectedVault(syncData.vaults, currentSettings.selectedVaultId);
  const hasUnsavedChanges = obsidianSyncSettingsService.hasUnsavedChanges(settingsState.tempSettings);
  const syncStats = obsidianSyncSettingsService.calculateSyncStats(currentSettings.dataTypes);
  const pathPreviews = selectedVault ? obsidianSyncSettingsService.generateFilePathPreview(
    selectedVault.path, 
    currentSettings.fileNameFormat
  ) : {};

  // Icon mapping for data types
  const getDataTypeIconComponent = (dataType: any) => {
    const iconName = obsidianSyncSettingsService.getDataTypeIcon(dataType);
    switch (iconName) {
      case 'BarChart3': return <BarChart3 className="h-4 w-4" />;
      case 'Tag': return <Tag className="h-4 w-4" />;
      case 'Database': return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Obsidian Sync Settings
            {selectedVault && (
              <Badge className={obsidianSyncSettingsService.getStatusBadge(selectedVault.status).className}>
                {obsidianSyncSettingsService.getStatusBadge(selectedVault.status).label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={settingsState.isManualSyncing || !selectedVault}
            >
              {settingsState.isManualSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={!hasUnsavedChanges || updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Vault Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Obsidian Vault
            </label>
            <div className="space-y-3">
              <Select
                value={currentSettings.selectedVaultId}
                onValueChange={handleVaultSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an Obsidian vault" />
                </SelectTrigger>
                <SelectContent>
                  {syncData.vaults.map((vault) => (
                    <SelectItem key={vault.id} value={vault.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span>{vault.name}</span>
                        {vault.isDefault && (
                          <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Add New Vault */}
              <div className="flex gap-2">
                <Input
                  placeholder="Path to new Obsidian vault..."
                  value={settingsState.newVaultPath}
                  onChange={(e) => handleVaultPathChange(e.target.value)}
                />
                <Button
                  onClick={handleAddVault}
                  disabled={!settingsState.newVaultPath.trim() || addVault.isPending}
                >
                  {addVault.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add Vault'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Sync Status */}
          {selectedVault && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Last Sync Status</span>
              </div>
              <div className="text-sm space-y-1">
                <div>Path: <code className="bg-background px-1 rounded">{selectedVault.path}</code></div>
                <div>Last Sync: {obsidianSyncSettingsService.formatTime(selectedVault.lastSync)}</div>
                {syncData.lastSyncStatus.success ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Success - {syncData.lastSyncStatus.filesProcessed} files processed
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Failed - {syncData.lastSyncStatus.errors.length} errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Types Configuration */}
          <div>
            <h3 className="font-medium mb-4">Data Types to Sync</h3>
            <div className="space-y-3">
              {currentSettings.dataTypes.map((dataType) => (
                <div key={dataType.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getDataTypeIconComponent(dataType)}
                      <div>
                        <div className="font-medium">{dataType.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {dataType.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={dataType.enabled}
                        onCheckedChange={(enabled) => handleDataTypeToggle(dataType.id, enabled)}
                      />
                      {dataType.enabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncDataType(dataType.id)}
                          disabled={settingsState.isManualSyncing}
                        >
                          {settingsState.isManualSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {dataType.enabled && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Files</div>
                        <div className="font-medium">{dataType.fileCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Last Sync</div>
                        <div className="font-medium">
                          {dataType.lastSync ? obsidianSyncSettingsService.formatTime(dataType.lastSync) : 'Never'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Conflicts</div>
                        <div className={`font-medium ${dataType.conflictCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {dataType.conflictCount}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dataType.enabled && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <strong>Path:</strong> <code className="bg-background px-1 rounded">{dataType.path}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sync Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-4">Sync Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Sync</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically sync when changes are detected
                    </div>
                  </div>
                  <Switch
                    checked={currentSettings.autoSync}
                    onCheckedChange={(value) => handleSettingsChange('autoSync', value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sync Interval (minutes)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={currentSettings.syncInterval}
                    onChange={(e) => handleSettingsChange('syncInterval', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Conflict Resolution
                  </label>
                  <Select
                    value={currentSettings.conflictResolution}
                    onValueChange={(value) => handleSettingsChange('conflictResolution', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Review</SelectItem>
                      <SelectItem value="local">Prefer Local</SelectItem>
                      <SelectItem value="remote">Prefer Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">File Options</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    File Name Format
                  </label>
                  <Input
                    placeholder="e.g., SM_{type}_{date}"
                    value={currentSettings.fileNameFormat}
                    onChange={(e) => handleSettingsChange('fileNameFormat', e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Include Metadata</div>
                    <div className="text-sm text-muted-foreground">
                      Add YAML frontmatter to files
                    </div>
                  </div>
                  <Switch
                    checked={currentSettings.includeMetadata}
                    onCheckedChange={(value) => handleSettingsChange('includeMetadata', value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Path Preview */}
          {selectedVault && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">File Path Preview</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                {Object.entries(pathPreviews).map(([type, path]) => (
                  <div key={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}: <code className="bg-white px-1 rounded">{path}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {(updateSettings.error || addVault.error || manualSync.error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">
                Error: {updateSettings.error?.message || addVault.error?.message || manualSync.error?.message}
              </div>
            </div>
          )}

          {/* Unsaved Changes Warning */}
          {hasUnsavedChanges && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-700">
                You have unsaved changes. Click "Save Settings" to apply them.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ObsidianSyncSettingsPanel; 