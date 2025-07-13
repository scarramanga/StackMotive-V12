import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus,
  Edit,
  Trash2,
  Settings,
  Clock,
  Percent,
  Ban,
  Calendar,
  Shield,
  BarChart,
  PieChart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  X,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  executionRulesConfiguratorService,
  useExecutionRules,
  useRuleTemplates,
  useCreateRule,
  useUpdateRule,
  useDeleteRule,
  useValidateRule,
  useCheckConflicts,
  useRuleStatistics,
  useApplyRulesToAsset,
  useBulkImportRules,
  ExecutionRule,
  RuleTemplate
} from '../../services/executionRulesConfiguratorService';

export const ExecutionRulesConfiguratorPanel: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<Omit<ExecutionRule, 'id' | 'createdAt' | 'updatedAt'>>(
    executionRulesConfiguratorService.createDefaultRule(user?.id || '', 'delay')
  );
  const [ruleErrors, setRuleErrors] = useState<string[]>([]);
  const [ruleWarnings, setRuleWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterRuleType, setFilterRuleType] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState('rules');
  const [showValidation, setShowValidation] = useState(false);
  const [testAsset, setTestAsset] = useState('');

  // Mutations
  const createRuleMutation = useCreateRule();
  const updateRuleMutation = useUpdateRule();
  const deleteRuleMutation = useDeleteRule();
  const validateRuleMutation = useValidateRule();
  const applyRulesMutation = useApplyRulesToAsset();
  const bulkImportMutation = useBulkImportRules();

  // Fetch data
  const { data: rules, isLoading: rulesLoading, error: rulesError, refetch: refetchRules } = useExecutionRules(user?.id);
  const { data: templates } = useRuleTemplates();
  const { data: conflicts } = useCheckConflicts(user?.id);
  const { data: statistics } = useRuleStatistics(user?.id);

  // Filtered rules
  const filteredRules = useMemo(() => {
    if (!rules) return [];
    
    return rules.filter(rule => {
      const matchesSearch = !searchTerm || 
        rule.assetTicker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !filterCategory || rule.category === filterCategory;
      const matchesRuleType = !filterRuleType || rule.ruleType === filterRuleType;
      const matchesActive = !filterActive || (filterActive === 'active' ? rule.isActive : !rule.isActive);
      
      return matchesSearch && matchesCategory && matchesRuleType && matchesActive;
    });
  }, [rules, searchTerm, filterCategory, filterRuleType, filterActive]);

  // Handle form changes
  const handleRuleFormChange = (field: string, value: any) => {
    if (field.startsWith('metadata.')) {
      const metadataKey = field.replace('metadata.', '');
      setRuleForm(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataKey]: value
        }
      }));
    } else {
      setRuleForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle rule type change
  const handleRuleTypeChange = (ruleType: ExecutionRule['ruleType']) => {
    const defaultRule = executionRulesConfiguratorService.createDefaultRule(user?.id || '', ruleType);
    setRuleForm(prev => ({
      ...prev,
      ruleType,
      value: defaultRule.value,
      unit: defaultRule.unit,
      description: defaultRule.description
    }));
  };

  // Handle create rule
  const handleCreateRule = () => {
    setRuleForm(executionRulesConfiguratorService.createDefaultRule(user?.id || '', 'delay'));
    setIsCreating(true);
    setEditingRuleId(null);
    setRuleErrors([]);
    setRuleWarnings([]);
  };

  // Handle edit rule
  const handleEditRule = (rule: ExecutionRule) => {
    setRuleForm({
      userId: rule.userId,
      assetTicker: rule.assetTicker,
      assetName: rule.assetName,
      category: rule.category,
      ruleType: rule.ruleType,
      value: rule.value,
      unit: rule.unit,
      description: rule.description,
      isActive: rule.isActive,
      priority: rule.priority,
      metadata: rule.metadata
    });
    setEditingRuleId(rule.id);
    setIsEditing(true);
    setRuleErrors([]);
    setRuleWarnings([]);
  };

  // Handle rule submit
  const handleRuleSubmit = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    setRuleErrors([]);
    setRuleWarnings([]);
    
    try {
      const result = await executionRulesConfiguratorService.handleRuleSubmit(
        ruleForm,
        editingRuleId
      );
      
      if (result.success) {
        setIsCreating(false);
        setIsEditing(false);
        setEditingRuleId(null);
        setRuleForm(executionRulesConfiguratorService.createDefaultRule(user.id, 'delay'));
        refetchRules();
      } else {
        setRuleErrors([result.error || 'Failed to save rule']);
      }
    } catch (error) {
      setRuleErrors(['Failed to save rule']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rule delete
  const handleDeleteRule = async (ruleId: string) => {
    if (!user?.id) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this rule?');
    if (!confirmed) return;

    try {
      const result = await executionRulesConfiguratorService.handleRuleDelete(ruleId, user.id);
      if (result.success) {
        refetchRules();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  // Handle validate rule
  const handleValidateRule = async () => {
    try {
      const result = await validateRuleMutation.mutateAsync(ruleForm);
      setRuleErrors(result.errors);
      setRuleWarnings(result.warnings);
      setShowValidation(true);
    } catch (error) {
      setRuleErrors(['Failed to validate rule']);
    }
  };

  // Handle test rule application
  const handleTestRuleApplication = async () => {
    if (!user?.id || !testAsset) return;
    
    try {
      const result = await applyRulesMutation.mutateAsync({
        userId: user.id,
        assetTicker: testAsset.toUpperCase()
      });
      
      // Show results in a dialog or notification
      console.log('Rule application result:', result);
    } catch (error) {
      console.error('Failed to test rule application:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchRules();
  };

  // Handle close modals
  const handleCloseCreateModal = () => {
    setIsCreating(false);
    setRuleForm(executionRulesConfiguratorService.createDefaultRule(user?.id || '', 'delay'));
    setRuleErrors([]);
    setRuleWarnings([]);
  };

  const handleCloseEditModal = () => {
    setIsEditing(false);
    setEditingRuleId(null);
    setRuleForm(executionRulesConfiguratorService.createDefaultRule(user?.id || '', 'delay'));
    setRuleErrors([]);
    setRuleWarnings([]);
  };

  // Get rule type icon
  const getRuleTypeIcon = (ruleType: string) => {
    const iconName = executionRulesConfiguratorService.getRuleTypeIcon(ruleType as any);
    switch (iconName) {
      case 'clock':
        return <Clock className="h-4 w-4" />;
      case 'percent':
        return <Percent className="h-4 w-4" />;
      case 'ban':
        return <Ban className="h-4 w-4" />;
      case 'calendar':
        return <Calendar className="h-4 w-4" />;
      case 'shield':
        return <Shield className="h-4 w-4" />;
      case 'bar-chart':
        return <BarChart className="h-4 w-4" />;
      case 'pie-chart':
        return <PieChart className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (rulesError) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading execution rules: {rulesError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rulesLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading execution rules...
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
            Execution Rules Configurator
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleCreateRule}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Rules</div>
                <div className="text-2xl font-bold">{statistics.totalRules}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold text-green-600">{statistics.activeRules}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Conflicts</div>
                <div className="text-2xl font-bold text-red-600">{conflicts?.length || 0}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Restrictive Assets</div>
                <div className="text-2xl font-bold text-yellow-600">{statistics.mostRestrictiveAssets.length}</div>
              </div>
            </div>
          )}

          {/* Conflicts Alert */}
          {conflicts && conflicts.length > 0 && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">Rule Conflicts Detected</span>
              </div>
              <div className="text-sm text-red-800">
                {conflicts.length} rule conflicts found. Review and resolve conflicts to ensure proper execution.
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="bonds">Bonds</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="indices">Indices</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterRuleType} onValueChange={setFilterRuleType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Rule Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="delay">Delay</SelectItem>
                    <SelectItem value="max_trade_percentage">Max Trade %</SelectItem>
                    <SelectItem value="excluded_asset">Excluded Asset</SelectItem>
                    <SelectItem value="execution_window">Execution Window</SelectItem>
                    <SelectItem value="stop_loss_required">Stop Loss Required</SelectItem>
                    <SelectItem value="min_volume">Min Volume</SelectItem>
                    <SelectItem value="max_position_size">Max Position Size</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterRuleType('');
                    setFilterActive('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>

              {/* Rules Table */}
              <div className="border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Rule Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {rules?.length === 0 ? (
                            <div>
                              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No execution rules configured. Add your first rule above.</p>
                            </div>
                          ) : (
                            <div>
                              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No rules match the current filters.</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRules.map(rule => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`${executionRulesConfiguratorService.getCategoryColor(rule.category)}`}>
                                {rule.category === 'global' ? (
                                  <Settings className="h-4 w-4" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-current opacity-20" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {rule.category === 'global' ? 'Global' : rule.assetTicker}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {rule.category === 'global' ? 'All Assets' : rule.assetName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRuleTypeIcon(rule.ruleType)}
                              <span className="text-sm">{rule.ruleType.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {executionRulesConfiguratorService.formatRuleValue(rule)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${executionRulesConfiguratorService.getPriorityColor(rule.priority)} bg-transparent`}>
                              {rule.priority.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {executionRulesConfiguratorService.formatRelativeTime(rule.updatedAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRule(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Conflicts Tab */}
            <TabsContent value="conflicts" className="space-y-4">
              {conflicts && conflicts.length > 0 ? (
                <div className="space-y-3">
                  {conflicts.map((conflict, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${executionRulesConfiguratorService.getConflictSeverityColor(conflict.severity)} bg-opacity-5`}>
                      <div className="flex items-start gap-3">
                        <div className="p-1 rounded-full bg-current opacity-20">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{conflict.description}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Resolution: {conflict.resolution}
                          </div>
                        </div>
                        <Badge className={`${executionRulesConfiguratorService.getConflictSeverityColor(conflict.severity)} bg-transparent`}>
                          {conflict.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>No rule conflicts detected. Your configuration is clean!</p>
                </div>
              )}
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-4">Test Rule Application</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter asset ticker (e.g., AAPL, BTC)"
                      value={testAsset}
                      onChange={(e) => setTestAsset(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleTestRuleApplication}
                    disabled={!testAsset || applyRulesMutation.isPending}
                  >
                    {applyRulesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test Rules'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      {/* Create Rule Modal */}
      <Dialog open={isCreating} onOpenChange={handleCloseCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Execution Rule</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Form Errors */}
            {ruleErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  {ruleErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Warnings */}
            {ruleWarnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  {ruleWarnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asset Ticker</label>
                <Input
                  value={ruleForm.assetTicker}
                  onChange={(e) => handleRuleFormChange('assetTicker', e.target.value.toUpperCase())}
                  placeholder="AAPL, BTC, or leave empty for global"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Asset Name</label>
                <Input
                  value={ruleForm.assetName}
                  onChange={(e) => handleRuleFormChange('assetName', e.target.value)}
                  placeholder="Apple Inc., Bitcoin, etc."
                />
              </div>
            </div>

            {/* Rule Type and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Type</label>
                <Select 
                  value={ruleForm.ruleType} 
                  onValueChange={handleRuleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delay">Execution Delay</SelectItem>
                    <SelectItem value="max_trade_percentage">Max Trade Percentage</SelectItem>
                    <SelectItem value="excluded_asset">Excluded Asset</SelectItem>
                    <SelectItem value="execution_window">Execution Window</SelectItem>
                    <SelectItem value="stop_loss_required">Stop Loss Required</SelectItem>
                    <SelectItem value="min_volume">Min Volume</SelectItem>
                    <SelectItem value="max_position_size">Max Position Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select 
                  value={ruleForm.category} 
                  onValueChange={(value) => handleRuleFormChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="bonds">Bonds</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="indices">Indices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rule Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                {ruleForm.ruleType === 'execution_window' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={ruleForm.value?.startTime || '09:00'}
                      onChange={(e) => handleRuleFormChange('value', { 
                        ...ruleForm.value, 
                        startTime: e.target.value 
                      })}
                    />
                    <Input
                      type="time"
                      value={ruleForm.value?.endTime || '16:00'}
                      onChange={(e) => handleRuleFormChange('value', { 
                        ...ruleForm.value, 
                        endTime: e.target.value 
                      })}
                    />
                  </div>
                ) : ruleForm.ruleType === 'excluded_asset' || ruleForm.ruleType === 'stop_loss_required' ? (
                  <Switch
                    checked={ruleForm.value || false}
                    onCheckedChange={(checked) => handleRuleFormChange('value', checked)}
                  />
                ) : (
                  <Input
                    type="number"
                    value={ruleForm.value || 0}
                    onChange={(e) => handleRuleFormChange('value', parseFloat(e.target.value))}
                    placeholder="Enter value"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <Select 
                  value={ruleForm.priority} 
                  onValueChange={(value) => handleRuleFormChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={ruleForm.description}
                onChange={(e) => handleRuleFormChange('description', e.target.value)}
                placeholder="Describe what this rule does..."
                rows={2}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active Rule</label>
              <Switch
                checked={ruleForm.isActive}
                onCheckedChange={(checked) => handleRuleFormChange('isActive', checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleValidateRule}
                disabled={validateRuleMutation.isPending}
              >
                {validateRuleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Validate'
                )}
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCloseCreateModal}>
                  Cancel
                </Button>
                <Button onClick={handleRuleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Rule'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Modal */}
      <Dialog open={isEditing} onOpenChange={handleCloseEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Execution Rule</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Form Errors */}
            {ruleErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  {ruleErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Warnings */}
            {ruleWarnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  {ruleWarnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asset Ticker</label>
                <Input
                  value={ruleForm.assetTicker}
                  onChange={(e) => handleRuleFormChange('assetTicker', e.target.value.toUpperCase())}
                  placeholder="AAPL, BTC, or leave empty for global"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Asset Name</label>
                <Input
                  value={ruleForm.assetName}
                  onChange={(e) => handleRuleFormChange('assetName', e.target.value)}
                  placeholder="Apple Inc., Bitcoin, etc."
                />
              </div>
            </div>

            {/* Rule Type and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Type</label>
                <Select 
                  value={ruleForm.ruleType} 
                  onValueChange={handleRuleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delay">Execution Delay</SelectItem>
                    <SelectItem value="max_trade_percentage">Max Trade Percentage</SelectItem>
                    <SelectItem value="excluded_asset">Excluded Asset</SelectItem>
                    <SelectItem value="execution_window">Execution Window</SelectItem>
                    <SelectItem value="stop_loss_required">Stop Loss Required</SelectItem>
                    <SelectItem value="min_volume">Min Volume</SelectItem>
                    <SelectItem value="max_position_size">Max Position Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select 
                  value={ruleForm.category} 
                  onValueChange={(value) => handleRuleFormChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="bonds">Bonds</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="indices">Indices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rule Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                {ruleForm.ruleType === 'execution_window' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="time"
                      value={ruleForm.value?.startTime || '09:00'}
                      onChange={(e) => handleRuleFormChange('value', { 
                        ...ruleForm.value, 
                        startTime: e.target.value 
                      })}
                    />
                    <Input
                      type="time"
                      value={ruleForm.value?.endTime || '16:00'}
                      onChange={(e) => handleRuleFormChange('value', { 
                        ...ruleForm.value, 
                        endTime: e.target.value 
                      })}
                    />
                  </div>
                ) : ruleForm.ruleType === 'excluded_asset' || ruleForm.ruleType === 'stop_loss_required' ? (
                  <Switch
                    checked={ruleForm.value || false}
                    onCheckedChange={(checked) => handleRuleFormChange('value', checked)}
                  />
                ) : (
                  <Input
                    type="number"
                    value={ruleForm.value || 0}
                    onChange={(e) => handleRuleFormChange('value', parseFloat(e.target.value))}
                    placeholder="Enter value"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <Select 
                  value={ruleForm.priority} 
                  onValueChange={(value) => handleRuleFormChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={ruleForm.description}
                onChange={(e) => handleRuleFormChange('description', e.target.value)}
                placeholder="Describe what this rule does..."
                rows={2}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active Rule</label>
              <Switch
                checked={ruleForm.isActive}
                onCheckedChange={(checked) => handleRuleFormChange('isActive', checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleValidateRule}
                disabled={validateRuleMutation.isPending}
              >
                {validateRuleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Validate'
                )}
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCloseEditModal}>
                  Cancel
                </Button>
                <Button onClick={handleRuleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Rule'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 