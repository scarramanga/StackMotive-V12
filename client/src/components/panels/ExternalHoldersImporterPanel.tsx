import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Plus, Edit, Trash2, Database, FileJson, FileSpreadsheet, Upload, 
  Loader2, AlertCircle, CheckCircle, X, Tag, DollarSign, Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  useExternalAssets, useAddExternalAsset, useUpdateExternalAsset, useDeleteExternalAsset,
  externalHoldersImporterService, type ExternalAsset, type ExternalAssetInput, type AssetFilters
} from '../../services/externalHoldersImporterService';

export const ExternalHoldersImporterPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State management using service defaults
  const [assetForm, setAssetForm] = useState<ExternalAssetInput>(externalHoldersImporterService.createDefaultAssetForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [filters, setFilters] = useState<AssetFilters>({ type: 'all', tag: 'all' });
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // User data for logging
  const userId = (user as any)?.id || '1';
  const vaultId = activeVaultId || undefined;

  // API hooks
  const { data: assetsData, isLoading, error } = useExternalAssets(vaultId, user);
  const addAssetMutation = useAddExternalAsset();
  const updateAssetMutation = useUpdateExternalAsset();
  const deleteAssetMutation = useDeleteExternalAsset();

  // Form handlers using service methods
  const handleSubmit = async () => {
    const result = await externalHoldersImporterService.handleAssetSubmit(assetForm, editingId, userId, vaultId);
    if (!result.success) {
      console.error('Asset submission failed:', result.error);
      return;
    }
    
    try {
      if (editingId) {
        await updateAssetMutation.mutateAsync({ id: editingId, asset: assetForm, vaultId });
      } else {
        await addAssetMutation.mutateAsync({ asset: assetForm, vaultId });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Mutation error:', error);
    }
  };

  const handleEdit = (asset: ExternalAsset) => {
    const { form, editingId } = externalHoldersImporterService.prepareAssetForEdit(asset);
    setAssetForm(form);
    setEditingId(editingId);
    setIsAddingAsset(true);
    
    // Log modal opening
    externalHoldersImporterService.logAgentMemory('modal_opened', {
      userId, vaultId,
      metadata: { action: 'edit', assetId: asset.id, assetLabel: asset.label }
    });
  };

  const handleDelete = async (asset: ExternalAsset) => {
    const result = await externalHoldersImporterService.handleAssetDelete(asset.id, asset.label, userId, vaultId);
    if (!result.success) {
      console.error('Asset deletion failed:', result.error);
      return;
    }
    
    try {
      await deleteAssetMutation.mutateAsync({ id: asset.id, vaultId });
    } catch (error) {
      console.error('Delete mutation error:', error);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    const result = await externalHoldersImporterService.handleExport(format, userId, vaultId);
    if (!result.success) {
      console.error('Export failed:', result.error);
    }
    setIsExporting(false);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    const result = await externalHoldersImporterService.handleImport(file, userId, vaultId);
    if (!result.success) {
      console.error('Import failed:', result.error);
    } else {
      // Refresh data after successful import
      window.location.reload();
    }
    setIsImporting(false);
    event.target.value = '';
  };

  const handleFilterChange = async (filterType: 'type' | 'tag', value: string) => {
    const newFilters = await externalHoldersImporterService.handleFilterChange(
      filterType, value, filters, assetsData?.totalAssets || 0, userId, vaultId
    );
    setFilters(newFilters);
  };

  const handleFormChange = (field: keyof ExternalAssetInput, value: any) => {
    setAssetForm(externalHoldersImporterService.updateFormField(assetForm, field, value));
  };

  const handleAddTag = (tag: string) => {
    setAssetForm(externalHoldersImporterService.handleAddTag(assetForm, tag));
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setAssetForm(externalHoldersImporterService.handleRemoveTag(assetForm, tagToRemove));
  };

  const handleOpenModal = () => {
    setIsAddingAsset(true);
    externalHoldersImporterService.logAgentMemory('modal_opened', {
      userId, vaultId,
      metadata: { action: 'create' }
    });
  };

  const handleCloseModal = () => {
    setIsAddingAsset(false);
    setEditingId(null);
    setAssetForm(externalHoldersImporterService.createDefaultAssetForm());
    
    externalHoldersImporterService.logAgentMemory('modal_closed', {
      userId, vaultId,
      metadata: { action: editingId ? 'edit' : 'create' }
    });
  };

  // UI Rendering Methods
  const renderSummaryStats = () => {
    if (!assetsData) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {externalHoldersImporterService.formatCurrency(assetsData.totalValue)}
          </div>
          <div className="text-sm text-blue-700">Total Value</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{assetsData.totalAssets}</div>
          <div className="text-sm text-green-700">Total Assets</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{assetsData.assetTypes.length}</div>
          <div className="text-sm text-purple-700">Asset Types</div>
        </div>
      </div>
    );
  };

  const renderValueChart = () => {
    if (!assetsData?.valueHistory || assetsData.valueHistory.length <= 1) return null;
    
    return (
      <div className="p-4 border border-border rounded-lg">
        <h3 className="font-medium mb-4">Value Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={assetsData.valueHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={externalHoldersImporterService.formatDate} />
              <YAxis tickFormatter={(value) => externalHoldersImporterService.formatCurrency(value)} />
              <Tooltip 
                labelFormatter={(value) => externalHoldersImporterService.formatDate(value as string)}
                formatter={(value) => [externalHoldersImporterService.formatCurrency(value as number), 'Total Value']}
              />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderImportSection = () => (
    <div className="p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Import Assets</span>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleImport}
          disabled={isImporting}
          className="text-sm text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Supported formats: JSON, CSV. Maximum file size: 10MB
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="flex items-center gap-4">
      <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {assetsData?.assetTypes?.map(type => (
            <SelectItem key={type.id} value={type.id}>
              {externalHoldersImporterService.formatTypeDisplayName(type.id as any)} ({type.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={filters.tag} onValueChange={(value) => handleFilterChange('tag', value)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tags</SelectItem>
          {assetsData?.availableTags?.map(tag => (
            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="text-sm text-muted-foreground">
        Showing {externalHoldersImporterService.getFilteredAssetCount(assetsData?.assets || [], filters)} assets
      </div>
    </div>
  );

  const renderAssetCard = (asset: ExternalAsset) => (
    <div key={asset.id} className="p-4 border border-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{asset.label}</span>
          <Badge className={externalHoldersImporterService.getTypeBadgeClass(asset.type)}>
            {externalHoldersImporterService.formatTypeDisplayName(asset.type)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(asset)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDelete(asset)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Value</div>
          <div className="font-medium">{externalHoldersImporterService.formatCurrency(asset.value, asset.currency)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Date</div>
          <div className="font-medium">{externalHoldersImporterService.formatDate(asset.snapshotDate)}</div>
        </div>
      </div>
      
      {asset.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {asset.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
      
      {asset.notes && (
        <div className="mt-2 text-xs text-muted-foreground">{asset.notes}</div>
      )}
    </div>
  );

  const renderModal = () => {
    if (!isAddingAsset) return null;
    const modalState = externalHoldersImporterService.getModalState(isAddingAsset, editingId);
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{modalState.title}</h3>
            <Button size="sm" variant="ghost" onClick={handleCloseModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asset Label</label>
              <Input
                value={assetForm.label}
                onChange={(e) => handleFormChange('label', e.target.value)}
                placeholder="e.g., Bitcoin Holdings"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={assetForm.type} onValueChange={(value) => handleFormChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="bonds">Bonds</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Currency</label>
                <Select value={assetForm.currency} onValueChange={(value) => handleFormChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input
                  type="number"
                  value={assetForm.value}
                  onChange={(e) => handleFormChange('value', Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Snapshot Date</label>
                <Input
                  type="date"
                  value={assetForm.snapshotDate}
                  onChange={(e) => handleFormChange('snapshotDate', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={assetForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(newTag)}
                />
                <Button size="sm" onClick={() => handleAddTag(newTag)} disabled={!newTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {assetForm.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSubmit} disabled={addAssetMutation.isPending || updateAssetMutation.isPending}>
              {(addAssetMutation.isPending || updateAssetMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingId ? 'Update' : 'Add'} Asset
            </Button>
            <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading external assets: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredAssets = externalHoldersImporterService.filterAssets(assetsData?.assets || [], filters);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            External Holdings Importer
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleOpenModal}>
              <Plus className="h-4 w-4 mr-2" />Add Asset
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('csv')} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('json')} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {renderSummaryStats()}
          {renderValueChart()}
          {renderImportSection()}
          {renderFilters()}
          
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
              Loading external assets...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No external assets</h3>
              <p className="text-muted-foreground">
                {filters.type !== 'all' || filters.tag !== 'all' ? 'Try adjusting your filters' : 'Add your first external asset to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssets.map(renderAssetCard)}
            </div>
          )}
        </div>
      </CardContent>
      
      {renderModal()}
    </Card>
  );
};

export default ExternalHoldersImporterPanel; 