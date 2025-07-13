import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { 
  Plus,
  Download,
  Settings,
  Edit,
  Trash2,
  TestTube,
  Folder,
  Link,
  Cloud,
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  History,
  Upload
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  vaultIntegrationService,
  useVaultDashboard,
  useCreateVaultConfiguration,
  useUpdateVaultConfiguration,
  useDeleteVaultConfiguration,
  useTestVaultConnection,
  useExportToVault,
  useExportHistory,
  VaultConfiguration,
  ExportRequest,
  ExportHistory
} from '../../services/vaultIntegrationService';

export const VaultIntegrationPanel: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState(vaultIntegrationService.createDefaultConfiguration());
  const [exportForm, setExportForm] = useState(vaultIntegrationService.createDefaultExportRequest(''));
  const [configErrors, setConfigErrors] = useState<string[]>([]);
  const [exportErrors, setExportErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionTestResults, setConnectionTestResults] = useState<Record<string, any>>({});

  // Mutations
  const createConfigMutation = useCreateVaultConfiguration();
  const updateConfigMutation = useUpdateVaultConfiguration();
  const deleteConfigMutation = useDeleteVaultConfiguration();
  const testConnectionMutation = useTestVaultConnection();
  const exportMutation = useExportToVault();

  // Fetch data
  const { data: dashboardData, isLoading, error, refetch } = useVaultDashboard(user?.id);
  const { data: exportHistory } = useExportHistory(user?.id);

  // Available options
  const exportTypes = vaultIntegrationService.getExportTypes();
  const connectionMethods = vaultIntegrationService.getConnectionMethods();

  // Handle configuration form changes
  const handleConfigFormChange = (field: string, value: any) => {
    if (field.startsWith('settings.')) {
      const settingKey = field.replace('settings.', '');
      setConfigForm(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: value
        }
      }));
    } else {
      setConfigForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle export form changes
  const handleExportFormChange = (field: keyof ExportRequest, value: any) => {
    setExportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle add configuration
  const handleAddConfiguration = () => {
    setConfigForm(vaultIntegrationService.createDefaultConfiguration());
    setEditingConfigId(null);
    setIsConfiguring(true);
    setConfigErrors([]);
  };

  // Handle edit configuration
  const handleEditConfiguration = (config: VaultConfiguration) => {
    setConfigForm({
      name: config.name,
      method: config.method,
      settings: config.settings,
      isActive: config.isActive
    });
    setEditingConfigId(config.id);
    setIsConfiguring(true);
    setConfigErrors([]);
  };

  // Handle configuration submit
  const handleConfigurationSubmit = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setConfigErrors([]);
    
    try {
      const result = await vaultIntegrationService.handleConfigurationSubmit(
        configForm,
        editingConfigId,
        user.id
      );
      
      if (result.success) {
        setIsConfiguring(false);
        setEditingConfigId(null);
        setConfigForm(vaultIntegrationService.createDefaultConfiguration());
        refetch();
      } else {
        setConfigErrors([result.error || 'Unknown error occurred']);
      }
    } catch (error) {
      setConfigErrors(['Failed to save configuration. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle configuration delete
  const handleDeleteConfiguration = async (configId: string) => {
    if (!user?.id) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this vault configuration?');
    if (!confirmed) return;

    try {
      await deleteConfigMutation.mutateAsync({ id: configId, userId: user.id });
    } catch (error) {
      console.error('Failed to delete configuration:', error);
    }
  };

  // Handle connection test
  const handleTestConnection = async (configId: string) => {
    if (!user?.id) return;

    try {
      const result = await vaultIntegrationService.handleConnectionTest(configId, user.id);
      setConnectionTestResults(prev => ({
        ...prev,
        [configId]: result
      }));
    } catch (error) {
      setConnectionTestResults(prev => ({
        ...prev,
        [configId]: { success: false, error: 'Test failed' }
      }));
    }
  };

  // Handle add export
  const handleAddExport = (vaultId: string) => {
    setExportForm(vaultIntegrationService.createDefaultExportRequest(vaultId));
    setIsExporting(true);
    setExportErrors([]);
  };

  // Handle export submit
  const handleExportSubmit = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setExportErrors([]);
    
    try {
      const result = await vaultIntegrationService.handleExportSubmit(exportForm, user.id);
      
      if (result.success) {
        setIsExporting(false);
        setExportForm(vaultIntegrationService.createDefaultExportRequest(''));
        refetch();
      } else {
        setExportErrors([result.error || 'Export failed']);
      }
    } catch (error) {
      setExportErrors(['Failed to export data. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close modals
  const handleCloseConfigModal = () => {
    setIsConfiguring(false);
    setEditingConfigId(null);
    setConfigForm(vaultIntegrationService.createDefaultConfiguration());
    setConfigErrors([]);
  };

  const handleCloseExportModal = () => {
    setIsExporting(false);
    setExportForm(vaultIntegrationService.createDefaultExportRequest(''));
    setExportErrors([]);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Get connection status icon
  const getConnectionStatusIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get method icon
  const getMethodIcon = (method: string) => {
    const iconName = vaultIntegrationService.getMethodIcon(method as any);
    switch (iconName) {
      case 'folder':
        return <Folder className="h-4 w-4" />;
      case 'link':
        return <Link className="h-4 w-4" />;
      case 'cloud':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  // Get export type icon
  const getExportTypeIcon = (type: string) => {
    const iconName = vaultIntegrationService.getExportTypeIcon(type as any);
    switch (iconName) {
      case 'camera':
        return <Camera className="h-4 w-4" />;
      case 'settings':
        return <Settings className="h-4 w-4" />;
      case 'file-text':
        return <FileText className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading vault integration: {error.message}
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
            Loading vault integration...
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
            <Upload className="h-5 w-5" />
            Vault Integration (Obsidian)
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAddConfiguration}>
              <Plus className="h-4 w-4 mr-1" />
              Add Vault
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Sync Status */}
          {dashboardData?.syncStatus && (
            <div className={`p-4 rounded-lg border ${vaultIntegrationService.getConnectionStatusBackground(dashboardData.syncStatus.connectionHealth)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getConnectionStatusIcon(dashboardData.syncStatus.connectionHealth)}
                  <span className="font-medium">Sync Status</span>
                </div>
                <Badge className={`${vaultIntegrationService.getConnectionStatusColor(dashboardData.syncStatus.connectionHealth)} bg-transparent`}>
                  {dashboardData.syncStatus.connectionHealth.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Exports</div>
                  <div className="font-medium">{dashboardData.syncStatus.totalExports}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Failed</div>
                  <div className="font-medium text-red-600">{dashboardData.syncStatus.failedExports}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Storage Used</div>
                  <div className="font-medium">{vaultIntegrationService.formatFileSize(dashboardData.syncStatus.storageUsed)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Sync</div>
                  <div className="font-medium">{vaultIntegrationService.formatRelativeTime(dashboardData.syncStatus.lastSync)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Vault Configurations */}
          <div>
            <h3 className="font-medium mb-4">Vault Configurations</h3>
            {dashboardData?.configurations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No vault configurations found. Add your first vault above.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData?.configurations.map((config) => (
                  <div key={config.id} className="p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted/50 rounded-lg">
                          {getMethodIcon(config.method)}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {config.name}
                            {config.isActive && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {config.method.replace('_', ' ')} • Updated {vaultIntegrationService.formatRelativeTime(config.updatedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestConnection(config.id)}
                          disabled={testConnectionMutation.isPending}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddExport(config.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditConfiguration(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteConfiguration(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Connection test results */}
                    {connectionTestResults[config.id] && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className={`text-sm ${connectionTestResults[config.id].success ? 'text-green-600' : 'text-red-600'}`}>
                          {connectionTestResults[config.id].success ? '✓ Connection successful' : '✗ Connection failed'}
                          {connectionTestResults[config.id].latency && ` (${connectionTestResults[config.id].latency}ms)`}
                          {connectionTestResults[config.id].error && ` - ${connectionTestResults[config.id].error}`}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Exports */}
          {dashboardData?.recentExports && dashboardData.recentExports.length > 0 && (
            <div>
              <h3 className="font-medium mb-4">Recent Exports</h3>
              <div className="space-y-2">
                {dashboardData.recentExports.map((exportItem) => (
                  <div key={exportItem.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getExportTypeIcon(exportItem.exportType)}
                      <div>
                        <div className="font-medium">{exportItem.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          {vaultIntegrationService.formatFileSize(exportItem.fileSize)} • {vaultIntegrationService.formatRelativeTime(exportItem.exportedAt)}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${vaultIntegrationService.getExportStatusColor(exportItem.status)} bg-transparent`}>
                      {exportItem.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Configuration Modal */}
      <Dialog open={isConfiguring} onOpenChange={handleCloseConfigModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingConfigId ? 'Edit' : 'Add'} Vault Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Form Errors */}
            {configErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  {configErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Vault Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Vault Name</label>
              <Input
                value={configForm.name}
                onChange={(e) => handleConfigFormChange('name', e.target.value)}
                placeholder="My Obsidian Vault"
              />
            </div>

            {/* Connection Method */}
            <div>
              <label className="block text-sm font-medium mb-1">Connection Method</label>
              <Select 
                value={configForm.method} 
                onValueChange={(value) => handleConfigFormChange('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {connectionMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(method.id)}
                        <span>{method.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Method-specific settings */}
            {configForm.method === 'local_filesystem' && (
              <div>
                <label className="block text-sm font-medium mb-1">Local Path</label>
                <Input
                  value={configForm.settings.localPath || ''}
                  onChange={(e) => handleConfigFormChange('settings.localPath', e.target.value)}
                  placeholder="/path/to/obsidian/vault"
                />
              </div>
            )}

            {configForm.method === 'obsidian_api' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">API URL</label>
                  <Input
                    value={configForm.settings.apiUrl || ''}
                    onChange={(e) => handleConfigFormChange('settings.apiUrl', e.target.value)}
                    placeholder="http://localhost:27123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <Input
                    type="password"
                    value={configForm.settings.apiKey || ''}
                    onChange={(e) => handleConfigFormChange('settings.apiKey', e.target.value)}
                    placeholder="Your API key"
                  />
                </div>
              </>
            )}

            {configForm.method === 'webdav' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">WebDAV URL</label>
                  <Input
                    value={configForm.settings.webdavUrl || ''}
                    onChange={(e) => handleConfigFormChange('settings.webdavUrl', e.target.value)}
                    placeholder="https://webdav.example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <Input
                      value={configForm.settings.webdavUsername || ''}
                      onChange={(e) => handleConfigFormChange('settings.webdavUsername', e.target.value)}
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <Input
                      type="password"
                      value={configForm.settings.webdavPassword || ''}
                      onChange={(e) => handleConfigFormChange('settings.webdavPassword', e.target.value)}
                      placeholder="password"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Default Folder */}
            <div>
              <label className="block text-sm font-medium mb-1">Default Folder</label>
              <Input
                value={configForm.settings.defaultFolder || ''}
                onChange={(e) => handleConfigFormChange('settings.defaultFolder', e.target.value)}
                placeholder="StackMotive"
              />
            </div>

            {/* Auto Sync */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto Sync</label>
              <Switch
                checked={configForm.settings.autoSync || false}
                onCheckedChange={(checked) => handleConfigFormChange('settings.autoSync', checked)}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active Configuration</label>
              <Switch
                checked={configForm.isActive}
                onCheckedChange={(checked) => handleConfigFormChange('isActive', checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseConfigModal}>
                Cancel
              </Button>
              <Button onClick={handleConfigurationSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingConfigId ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExporting} onOpenChange={handleCloseExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export to Vault</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Form Errors */}
            {exportErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  {exportErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Export Type</label>
              <Select 
                value={exportForm.exportType} 
                onValueChange={(value: any) => handleExportFormChange('exportType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        {getExportTypeIcon(type.id)}
                        <div>
                          <div>{type.name}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Name */}
            <div>
              <label className="block text-sm font-medium mb-1">File Name (Optional)</label>
              <Input
                value={exportForm.fileName || ''}
                onChange={(e) => handleExportFormChange('fileName', e.target.value)}
                placeholder={vaultIntegrationService.generateFileName(exportForm.exportType)}
              />
            </div>

            {/* Custom Path */}
            <div>
              <label className="block text-sm font-medium mb-1">Custom Path (Optional)</label>
              <Input
                value={exportForm.customPath || ''}
                onChange={(e) => handleExportFormChange('customPath', e.target.value)}
                placeholder="subfolder/path"
              />
            </div>

            {/* Include Metadata */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Include Metadata</label>
              <Switch
                checked={exportForm.includeMetadata}
                onCheckedChange={(checked) => handleExportFormChange('includeMetadata', checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseExportModal}>
                Cancel
              </Button>
              <Button onClick={handleExportSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  'Export'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 