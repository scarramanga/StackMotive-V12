import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  Filter,
  Search,
  FileText,
  DollarSign,
  TrendingUp,
  Home,
  Package,
  Folder,
  Bitcoin,
  X,
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  ExternalHoldersImporterService, 
  ExternalAsset, 
  ExternalAssetInput, 
  AssetFilters,
  useExternalAssets
} from '../../services/externalHoldersImporterService';

const externalAssetsService = new ExternalHoldersImporterService();

export const ExternalHoldingsImporterPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExternalAssetInput>(externalAssetsService.createDefaultAssetForm());
  const [filters, setFilters] = useState<AssetFilters>({ type: 'all', tag: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'label' | 'value' | 'date' | 'type'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newTag, setNewTag] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch external assets data
  const { data: assetsData, isLoading, error, refetch } = useExternalAssets(activeVaultId, user);

  // Handle modal state
  const modalState = externalAssetsService.getModalState(isAddingAsset, editingId);

  // Handle form field updates
  const handleFormFieldChange = (field: keyof ExternalAssetInput, value: any) => {
    setForm(prev => externalAssetsService.updateFormField(prev, field, value));
  };

  // Handle add asset
  const handleAddAsset = () => {
    setForm(externalAssetsService.createDefaultAssetForm());
    setEditingId(null);
    setIsAddingAsset(true);
    setFormErrors([]);
  };

  // Handle edit asset
  const handleEditAsset = (asset: ExternalAsset) => {
    const { form: editForm, editingId: assetId } = externalAssetsService.prepareAssetForEdit(asset);
    setForm(editForm);
    setEditingId(assetId);
    setIsAddingAsset(true);
    setFormErrors([]);
  };

  // Handle asset submit (create/update)
  const handleAssetSubmit = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setFormErrors([]);
    
    try {
      const result = await externalAssetsService.handleAssetSubmit(
        form,
        editingId,
        user.id,
        activeVaultId
      );
      
      if (result.success) {
        setIsAddingAsset(false);
        setEditingId(null);
        setForm(externalAssetsService.createDefaultAssetForm());
        refetch();
      } else {
        setFormErrors([result.error || 'Unknown error occurred']);
      }
    } catch (error) {
      setFormErrors(['Failed to save asset. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle asset delete
  const handleDeleteAsset = async (assetId: string, assetLabel: string) => {
    if (!user?.id) return;
    
    try {
      const result = await externalAssetsService.handleAssetDelete(
        assetId,
        assetLabel,
        user.id,
        activeVaultId
      );
      
      if (result.success) {
        refetch();
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  // Handle export
  const handleExport = async (format: 'json' | 'csv') => {
    if (!user?.id) return;
    
    try {
      await externalAssetsService.handleExport(format, user.id, activeVaultId);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Handle import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    
    try {
      const result = await externalAssetsService.handleImport(file, user.id, activeVaultId);
      if (result.success) {
        refetch();
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle filter change
  const handleFilterChange = async (filterType: 'type' | 'tag', value: string) => {
    if (!user?.id || !assetsData) return;
    
    const newFilters = await externalAssetsService.handleFilterChange(
      filterType,
      value,
      filters,
      assetsData.totalAssets,
      user.id,
      activeVaultId
    );
    
    setFilters(newFilters);
  };

  // Handle add tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    setForm(prev => externalAssetsService.handleAddTag(prev, newTag.trim()));
    setNewTag('');
  };

  // Handle remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setForm(prev => externalAssetsService.handleRemoveTag(prev, tagToRemove));
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsAddingAsset(false);
    setEditingId(null);
    setForm(externalAssetsService.createDefaultAssetForm());
    setFormErrors([]);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Get asset icon
  const getAssetIcon = (type: ExternalAsset['type']) => {
    switch (type) {
      case 'crypto':
        return <Bitcoin className="h-4 w-4" />;
      case 'stocks':
        return <TrendingUp className="h-4 w-4" />;
      case 'bonds':
        return <FileText className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'real_estate':
        return <Home className="h-4 w-4" />;
      case 'commodities':
        return <Package className="h-4 w-4" />;
      default:
        return <Folder className="h-4 w-4" />;
    }
  };

  // Process and filter assets
  const processedAssets = React.useMemo(() => {
    if (!assetsData?.assets) return [];
    
    let filtered = externalAssetsService.filterAssets(assetsData.assets, filters);
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return externalAssetsService.sortAssets(filtered, sortBy, sortOrder);
  }, [assetsData?.assets, filters, searchTerm, sortBy, sortOrder]);

  // Generate summary stats
  const summaryStats = React.useMemo(() => {
    if (!assetsData?.assets) return null;
    return externalAssetsService.generateSummaryStats(assetsData.assets);
  }, [assetsData?.assets]);

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

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading external assets...
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
            <BarChart3 className="h-5 w-5" />
            External Holdings Importer
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAddAsset}>
              <Plus className="h-4 w-4 mr-1" />
              Add Asset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Statistics */}
          {summaryStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {externalAssetsService.formatCurrency(summaryStats.totalValue)}
                </div>
                <div className="text-sm text-blue-700">Total Value</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {summaryStats.totalAssets}
                </div>
                <div className="text-sm text-green-700">Total Assets</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {summaryStats.diversificationScore}%
                </div>
                <div className="text-sm text-purple-700">Diversification</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {externalAssetsService.formatCurrency(summaryStats.avgAssetValue)}
                </div>
                <div className="text-sm text-orange-700">Avg Asset Value</div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-40">
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
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
            <div className="sm:w-32">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="label">Name</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Import Section */}
          <div className="p-4 border border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".csv,.json"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mr-2"
              >
                <Upload className="h-4 w-4 mr-1" />
                Import Assets
              </Button>
              <span className="text-sm text-muted-foreground">
                Supports CSV and JSON files
              </span>
            </div>
          </div>

          {/* Assets List */}
          <div className="space-y-3">
            {processedAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filters.type !== 'all' ? 'No assets match your filters' : 'No external assets found. Add your first asset above.'}
              </div>
            ) : (
              processedAssets.map((asset) => (
                <div key={asset.id} className="p-4 border border-border rounded-lg bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted/50 rounded-lg">
                        {getAssetIcon(asset.type)}
                      </div>
                      <div>
                        <div className="font-medium">{asset.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {externalAssetsService.formatDate(asset.snapshotDate)} • {externalAssetsService.formatRelativeDate(asset.snapshotDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {externalAssetsService.formatCurrency(asset.value, asset.currency)}
                        </div>
                        <Badge className={externalAssetsService.getTypeBadgeClass(asset.type)}>
                          {externalAssetsService.formatTypeDisplayName(asset.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAsset(asset)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAsset(asset.id, asset.label)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {asset.notes && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-sm text-muted-foreground">{asset.notes}</div>
                    </div>
                  )}
                  {asset.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {asset.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>

      {/* Add/Edit Asset Modal */}
      <Dialog open={modalState.isOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modalState.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Form Errors */}
            {formErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  {formErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Asset Label */}
            <div>
              <label className="block text-sm font-medium mb-1">Asset Label</label>
              <Input
                value={form.label}
                onChange={(e) => handleFormFieldChange('label', e.target.value)}
                placeholder="e.g., Bitcoin Holdings"
              />
            </div>

            {/* Asset Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Asset Type</label>
              <Select value={form.type} onValueChange={(value: any) => handleFormFieldChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="bonds">Bonds</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="commodities">Commodities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Value and Currency */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => handleFormFieldChange('value', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <Select value={form.currency} onValueChange={(value) => handleFormFieldChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Snapshot Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Snapshot Date</label>
              <Input
                type="date"
                value={form.snapshotDate}
                onChange={(e) => handleFormFieldChange('snapshotDate', e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <Textarea
                value={form.notes}
                onChange={(e) => handleFormFieldChange('notes', e.target.value)}
                placeholder="Additional notes about this asset..."
                rows={3}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
                  Add
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleAssetSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  modalState.mode === 'create' ? 'Add Asset' : 'Update Asset'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 