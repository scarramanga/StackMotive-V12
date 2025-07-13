import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Settings, Download, Upload, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useSystemSettings,
  useUpdateSystemSetting,
  useBulkUpdateSettings,
  useValidateSettings,
  useResetSettings,
  useExportSettings,
  useImportSettings,
  useSystemSettingsUtils,
  type SettingUpdate,
  type SettingExport,
  type SettingImport,
  type Setting,
  type SettingCategory,
} from '@/services/systemSettingsPanelService';

export const SystemSettingsPanelPanel: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const { data: systemSettings, isLoading } = useSystemSettings(userId);
  const updateSetting = useUpdateSystemSetting(userId);
  const bulkUpdate = useBulkUpdateSettings(userId);
  const validateSettings = useValidateSettings(userId);
  const resetSettings = useResetSettings(userId);
  const exportSettings = useExportSettings(userId);
  const importSettings = useImportSettings(userId);
  const utils = useSystemSettingsUtils(userId);

  const [changedSettings, setChangedSettings] = useState<Record<string, any>>({});
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml' | 'csv'>('json');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);

  const handleSettingChange = (settingId: string, value: any) => {
    setChangedSettings(prev => ({ ...prev, [settingId]: value }));
  };

  const handleUpdateSetting = (setting: Setting, value: any) => {
    const update: SettingUpdate = {
      settingId: setting.id,
      value,
      validate: true,
      sync: true,
    };

    updateSetting.mutate(update, {
      onSuccess: () => {
        setChangedSettings(prev => {
          const newChanges = { ...prev };
          delete newChanges[setting.id];
          return newChanges;
        });
      },
    });
  };

  const handleBulkUpdate = () => {
    if (Object.keys(changedSettings).length === 0) return;

    const updates: SettingUpdate[] = Object.entries(changedSettings).map(([settingId, value]) => ({
      settingId,
      value,
      validate: true,
      sync: true,
    }));

    bulkUpdate.mutate({
      updates,
      transaction: true,
      rollback_on_error: true,
      validation_mode: 'strict',
    }, {
      onSuccess: () => {
        setChangedSettings({});
      },
    });
  };

  const handleValidateSettings = () => {
    validateSettings.mutate(undefined, {
      onSuccess: (results) => {
        setValidationResults(results);
      },
    });
  };

  const handleResetSettings = (settingIds: string[]) => {
    resetSettings.mutate(settingIds, {
      onSuccess: () => {
        setChangedSettings(prev => {
          const newChanges = { ...prev };
          settingIds.forEach(id => delete newChanges[id]);
          return newChanges;
        });
      },
    });
  };

  const handleExportSettings = () => {
    const exportConfig: SettingExport = {
      format: exportFormat,
      include_metadata: true,
      include_history: false,
      encryption: { enabled: false, algorithm: '', key_source: '', options: {} },
    };

    exportSettings.mutate(exportConfig);
  };

  const handleImportSettings = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      const importConfig: SettingImport = {
        data,
        format: exportFormat,
        merge_strategy: 'merge',
        validation_mode: 'strict',
        backup_before_import: true,
      };

      importSettings.mutate(importConfig);
    };
    reader.readAsText(importFile);
  };

  const renderSettingInput = (setting: Setting, category: SettingCategory) => {
    const currentValue = changedSettings[setting.id] ?? setting.value;
    const hasChanges = changedSettings[setting.id] !== undefined;

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.id}
              checked={currentValue}
              onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
              disabled={setting.isReadOnly}
            />
            <Label htmlFor={setting.id}>{setting.name}</Label>
            {hasChanges && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateSetting(setting, currentValue)}
                disabled={updateSetting.isPending}
              >
                Apply
              </Button>
            )}
          </div>
        );

      case 'string':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.id}>{setting.name}</Label>
            <div className="flex items-center space-x-2">
              <Input
                id={setting.id}
                value={currentValue}
                onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                placeholder={setting.ui.props.placeholder}
                disabled={setting.isReadOnly}
              />
              {hasChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateSetting(setting, currentValue)}
                  disabled={updateSetting.isPending}
                >
                  Apply
                </Button>
              )}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.id}>{setting.name}</Label>
            <div className="flex items-center space-x-2">
              <Input
                id={setting.id}
                type="number"
                value={currentValue}
                onChange={(e) => handleSettingChange(setting.id, parseFloat(e.target.value))}
                min={setting.ui.props.min}
                max={setting.ui.props.max}
                step={setting.ui.props.step}
                disabled={setting.isReadOnly}
              />
              {hasChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateSetting(setting, currentValue)}
                  disabled={updateSetting.isPending}
                >
                  Apply
                </Button>
              )}
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.id}>{setting.name}</Label>
            <div className="flex items-center space-x-2">
              <Select
                value={currentValue}
                onValueChange={(value) => handleSettingChange(setting.id, value)}
                disabled={setting.isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {setting.ui.props.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateSetting(setting, currentValue)}
                  disabled={updateSetting.isPending}
                >
                  Apply
                </Button>
              )}
            </div>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.id}>
              {setting.name}: {currentValue}
            </Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[currentValue]}
                onValueChange={(value) => handleSettingChange(setting.id, value[0])}
                min={setting.ui.props.min}
                max={setting.ui.props.max}
                step={setting.ui.props.step}
                disabled={setting.isReadOnly}
                className="flex-1"
              />
              {hasChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateSetting(setting, currentValue)}
                  disabled={updateSetting.isPending}
                >
                  Apply
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.id}>{setting.name}</Label>
            <div className="flex items-center space-x-2">
              <Textarea
                id={setting.id}
                value={currentValue}
                onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                placeholder={setting.ui.props.placeholder}
                disabled={setting.isReadOnly}
              />
              {hasChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateSetting(setting, currentValue)}
                  disabled={updateSetting.isPending}
                >
                  Apply
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  const pendingChanges = Object.keys(changedSettings).length;
  const healthScore = systemSettings ? utils.calculateSettingsHealth(systemSettings) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{systemSettings?.categories.length || 0}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {systemSettings?.categories.reduce((sum, cat) => sum + cat.settings.length, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Settings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingChanges}</div>
              <div className="text-sm text-muted-foreground">Pending Changes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: healthScore > 0.8 ? '#10B981' : healthScore > 0.6 ? '#F59E0B' : '#EF4444' }}>
                {(healthScore * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Health Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleBulkUpdate}
          disabled={pendingChanges === 0 || bulkUpdate.isPending}
        >
          {bulkUpdate.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply All Changes ({pendingChanges})
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleValidateSettings}>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Validate Settings
        </Button>
        <Button variant="outline" onClick={handleExportSettings}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".json,.yaml,.csv"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="hidden"
            id="import-file"
          />
          <Label htmlFor="import-file">
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {systemSettings?.categories.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span>{category.name}</span>
                  <Badge variant="outline">{category.settings.length} settings</Badge>
                  {category.settings.some(s => changedSettings[s.id] !== undefined) && (
                    <Badge variant="secondary">Changes pending</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.settings.map((setting) => (
                      <div key={setting.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {utils.formatSettingType(setting.type)}
                            </Badge>
                            <Badge
                              variant="outline"
                              style={{ backgroundColor: utils.getImpactColor(setting.impact.performance) }}
                            >
                              {utils.formatImpactLevel(setting.impact.performance)} Impact
                            </Badge>
                          </div>
                          {setting.value !== setting.defaultValue && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResetSettings([setting.id])}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        {renderSettingInput(setting, category)}
                        {setting.description && (
                          <p className="text-xs text-muted-foreground">{setting.description}</p>
                        )}
                        {setting.impact.restart_required && (
                          <Alert>
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                              Changing this setting requires a restart
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {validationResults && (
        <Alert variant={validationResults.valid ? 'default' : 'destructive'}>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            Validation {validationResults.valid ? 'passed' : 'failed'} - 
            {validationResults.errors.length} errors, {validationResults.warnings.length} warnings
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 