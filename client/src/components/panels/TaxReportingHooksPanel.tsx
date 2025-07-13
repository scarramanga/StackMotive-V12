import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  Zap,
  FileText,
  Download,
  Settings,
  Play,
  Pause,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Plus,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  Info,
  Bell,
  Archive,
  Database,
  Target,
  Webhook
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import {
  taxReportingHooksService,
  useTaxEvents,
  useProcessTaxEvent,
  useCalculateTaxLiability,
  useGenerateTaxReport,
  useTaxReportStatus,
  useHookConfiguration,
  useUpdateHookConfiguration,
  useTriggers,
  useCreateTrigger,
  TaxEvent,
  TaxReportRequest,
  HookConfiguration,
  TaxCalculationTrigger
} from '../../services/taxReportingHooksService';
import { TaxJurisdiction } from '../../services/taxIntelligenceModuleService';

export const TaxReportingHooksPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State management
  const [activeTab, setActiveTab] = useState<string>('events');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<TaxJurisdiction['code']>('NZ');
  const [selectedTaxYear, setSelectedTaxYear] = useState<string>('2024-2025');
  const [eventFilters, setEventFilters] = useState({
    eventType: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [reportRequest, setReportRequest] = useState<TaxReportRequest>(
    taxReportingHooksService.createDefaultReportRequest(
      user?.id || '',
      activeVaultId || '',
      selectedJurisdiction,
      selectedTaxYear
    )
  );
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Mutations
  const processEventMutation = useProcessTaxEvent();
  const calculateLiabilityMutation = useCalculateTaxLiability();
  const generateReportMutation = useGenerateTaxReport();
  const updateConfigMutation = useUpdateHookConfiguration();
  const createTriggerMutation = useCreateTrigger();

  // Fetch data
  const { data: taxEvents, isLoading: loadingEvents } = useTaxEvents(
    user?.id || '', 
    activeVaultId || '', 
    eventFilters
  );
  const { data: hookConfig, isLoading: loadingConfig } = useHookConfiguration(
    user?.id || '', 
    activeVaultId || ''
  );
  const { data: triggers, isLoading: loadingTriggers } = useTriggers();

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!taxEvents) return [];
    
    return taxEvents.filter(event => {
      if (eventFilters.eventType && event.type !== eventFilters.eventType) return false;
      if (eventFilters.status && event.processingStatus !== eventFilters.status) return false;
      if (eventFilters.startDate && event.timestamp < eventFilters.startDate) return false;
      if (eventFilters.endDate && event.timestamp > eventFilters.endDate) return false;
      return true;
    });
  }, [taxEvents, eventFilters]);

  // Handle process event
  const handleProcessEvent = async (eventId: string) => {
    try {
      await processEventMutation.mutateAsync(eventId);
    } catch (error) {
      console.error('Failed to process event:', error);
    }
  };

  // Handle calculate liability
  const handleCalculateLiability = async () => {
    try {
      await calculateLiabilityMutation.mutateAsync({
        userId: user?.id || '',
        vaultId: activeVaultId || '',
        jurisdiction: selectedJurisdiction,
        taxYear: selectedTaxYear,
        eventId: selectedEventId
      });
    } catch (error) {
      console.error('Failed to calculate liability:', error);
    }
  };

  // Handle generate report
  const handleGenerateReport = async () => {
    try {
      const result = await taxReportingHooksService.handleUserTriggeredReport(
        user?.id || '',
        activeVaultId || '',
        selectedJurisdiction,
        selectedTaxYear,
        reportRequest.reportType,
        reportRequest.format
      );
      
      if (!result.success) {
        console.error('Report generation failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  // Handle snapshot event
  const handleSnapshotEvent = async () => {
    try {
      await taxReportingHooksService.handleSnapshotEvent(
        user?.id || '',
        activeVaultId || '',
        { trigger: 'user_initiated', timestamp: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Failed to handle snapshot event:', error);
    }
  };

  // Handle rebalance event
  const handleRebalanceEvent = async () => {
    try {
      await taxReportingHooksService.handleRebalanceEvent(
        user?.id || '',
        activeVaultId || '',
        { trigger: 'user_initiated', timestamp: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Failed to handle rebalance event:', error);
    }
  };

  // Handle trade event
  const handleTradeEvent = async () => {
    try {
      await taxReportingHooksService.handleTradeEvent(
        user?.id || '',
        activeVaultId || '',
        { trigger: 'user_initiated', timestamp: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Failed to handle trade event:', error);
    }
  };

  // Update hook configuration
  const handleUpdateConfig = async (updates: Partial<HookConfiguration>) => {
    try {
      await updateConfigMutation.mutateAsync({
        ...hookConfig,
        ...updates,
        userId: user?.id || '',
        vaultId: activeVaultId || ''
      });
      setShowConfigDialog(false);
    } catch (error) {
      console.error('Failed to update configuration:', error);
    }
  };

  // Get event type icon
  const getEventTypeIcon = (eventType: TaxEvent['type']) => {
    switch (eventType) {
      case 'trade': return <Activity className="h-4 w-4" />;
      case 'rebalance': return <RefreshCw className="h-4 w-4" />;
      case 'snapshot': return <Database className="h-4 w-4" />;
      case 'dividend': return <DollarSign className="h-4 w-4" />;
      case 'user_triggered': return <Target className="h-4 w-4" />;
      default: return <Archive className="h-4 w-4" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: TaxEvent['processingStatus']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loadingEvents || loadingConfig || loadingTriggers) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading tax reporting hooks...
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
              <Zap className="h-5 w-5" />
              Tax & Reporting Hooks
              <Badge className="bg-blue-100 text-blue-800">
                {selectedJurisdiction} {selectedTaxYear}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfigDialog(true)}
              >
                <Settings className="h-4 w-4" />
                Configure
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTriggerDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Trigger
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Jurisdiction and Tax Year Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jurisdiction</Label>
                <Select value={selectedJurisdiction} onValueChange={(value) => setSelectedJurisdiction(value as TaxJurisdiction['code'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NZ">New Zealand</SelectItem>
                    <SelectItem value="AUS">Australia</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tax Year</Label>
                <Select value={selectedTaxYear} onValueChange={setSelectedTaxYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2023-2024">2023-2024</SelectItem>
                    <SelectItem value="2022-2023">2022-2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="events">
                  <Activity className="h-4 w-4 mr-2" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <FileText className="h-4 w-4 mr-2" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="triggers">
                  <Webhook className="h-4 w-4 mr-2" />
                  Triggers
                </TabsTrigger>
                <TabsTrigger value="config">
                  <Settings className="h-4 w-4 mr-2" />
                  Config
                </TabsTrigger>
              </TabsList>

              {/* Events Tab */}
              <TabsContent value="events" className="space-y-6">
                {/* Manual Event Triggers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Manual Event Triggers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={handleSnapshotEvent}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Database className="h-4 w-4" />
                        Trigger Snapshot
                      </Button>
                      <Button
                        onClick={handleRebalanceEvent}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Trigger Rebalance
                      </Button>
                      <Button
                        onClick={handleTradeEvent}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Activity className="h-4 w-4" />
                        Trigger Trade
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Event Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Event Type</Label>
                        <Select 
                          value={eventFilters.eventType} 
                          onValueChange={(value) => setEventFilters(prev => ({ ...prev, eventType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Types</SelectItem>
                            <SelectItem value="trade">Trade</SelectItem>
                            <SelectItem value="rebalance">Rebalance</SelectItem>
                            <SelectItem value="snapshot">Snapshot</SelectItem>
                            <SelectItem value="dividend">Dividend</SelectItem>
                            <SelectItem value="user_triggered">User Triggered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={eventFilters.status} 
                          onValueChange={(value) => setEventFilters(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={eventFilters.startDate}
                          onChange={(e) => setEventFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={eventFilters.endDate}
                          onChange={(e) => setEventFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Events List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tax Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {filteredEvents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No tax events found
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredEvents.map((event) => (
                            <div key={event.id} className="border border-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={taxReportingHooksService.getEventTypeColor(event.type)}>
                                    {getEventTypeIcon(event.type)}
                                  </div>
                                  <span className="font-medium">
                                    {taxReportingHooksService.formatEventType(event.type)}
                                  </span>
                                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                                    {event.id.slice(-8)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(event.processingStatus)}
                                  <span className={`text-sm ${taxReportingHooksService.getStatusColor(event.processingStatus)}`}>
                                    {taxReportingHooksService.formatProcessingStatus(event.processingStatus)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Timestamp:</span>
                                  <br />
                                  {taxReportingHooksService.formatDateTime(event.timestamp)}
                                </div>
                                <div>
                                  <span className="font-medium">Jurisdiction:</span>
                                  <br />
                                  {event.jurisdiction}
                                </div>
                                <div>
                                  <span className="font-medium">Tax Year:</span>
                                  <br />
                                  {event.taxYear}
                                </div>
                                <div>
                                  <span className="font-medium">Actions:</span>
                                  <br />
                                  <div className="flex gap-2 mt-1">
                                    {event.processingStatus === 'pending' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleProcessEvent(event.id)}
                                        disabled={processEventMutation.isPending}
                                      >
                                        <Play className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedEventId(event.id)}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              {event.error && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                  <strong>Error:</strong> {event.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Report Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Generate Tax Report</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Report Type</Label>
                        <Select 
                          value={reportRequest.reportType} 
                          onValueChange={(value) => setReportRequest(prev => ({ ...prev, reportType: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="summary">Summary</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="compliance">Compliance</SelectItem>
                            <SelectItem value="audit_trail">Audit Trail</SelectItem>
                            <SelectItem value="classification_breakdown">Classification Breakdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select 
                          value={reportRequest.format} 
                          onValueChange={(value) => setReportRequest(prev => ({ ...prev, format: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="xml">XML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-attachments"
                          checked={reportRequest.includeAttachments}
                          onChange={(e) => setReportRequest(prev => ({ ...prev, includeAttachments: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="include-attachments" className="text-sm cursor-pointer">
                          Include Attachments
                        </Label>
                      </div>

                      <Button 
                        onClick={handleGenerateReport}
                        disabled={generateReportMutation.isPending}
                        className="w-full"
                      >
                        {generateReportMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Calculate Liability */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Calculate Tax Liability</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Event ID (Optional)</Label>
                        <Input
                          value={selectedEventId}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          placeholder="Leave empty for all events"
                        />
                      </div>

                      <Button 
                        onClick={handleCalculateLiability}
                        disabled={calculateLiabilityMutation.isPending}
                        className="w-full"
                      >
                        {calculateLiabilityMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Calculate Liability
                          </>
                        )}
                      </Button>

                      {calculateLiabilityMutation.data && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Total Liability:</span>
                              <span className="text-blue-600 font-bold">
                                {taxReportingHooksService.formatCurrency(calculateLiabilityMutation.data.totalLiability, selectedJurisdiction)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Transactions:</span>
                              <span>{calculateLiabilityMutation.data.transactions.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Compliance Status:</span>
                              <Badge className={`${taxReportingHooksService.getComplianceStatusColor(calculateLiabilityMutation.data.complianceStatus)}`}>
                                {calculateLiabilityMutation.data.complianceStatus.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Triggers Tab */}
              <TabsContent value="triggers" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Triggers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {triggers && triggers.length > 0 ? (
                        <div className="space-y-3">
                          {triggers.map((trigger) => (
                            <div key={trigger.id} className="border border-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Webhook className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">{trigger.description}</span>
                                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                                    {trigger.eventType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${trigger.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {trigger.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Priority: {trigger.priority}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                <div className="mb-1">
                                  <strong>Conditions:</strong> {trigger.triggerConditions.length}
                                </div>
                                <div>
                                  <strong>Actions:</strong> {trigger.actions.length}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No triggers configured
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Config Tab */}
              <TabsContent value="config" className="space-y-6">
                {hookConfig ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hook Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Jurisdiction</Label>
                          <Select 
                            value={hookConfig.jurisdiction} 
                            onValueChange={(value) => handleUpdateConfig({ jurisdiction: value as TaxJurisdiction['code'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NZ">New Zealand</SelectItem>
                              <SelectItem value="AUS">Australia</SelectItem>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Reporting Frequency</Label>
                          <Select 
                            value={hookConfig.reportingFrequency} 
                            onValueChange={(value) => handleUpdateConfig({ reportingFrequency: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Immediate</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Auto Calculation</Label>
                          <Switch 
                            checked={hookConfig.autoCalculation}
                            onCheckedChange={(checked) => handleUpdateConfig({ autoCalculation: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Auto Reporting</Label>
                          <Switch 
                            checked={hookConfig.autoReporting}
                            onCheckedChange={(checked) => handleUpdateConfig({ autoReporting: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Email Notifications</Label>
                          <Switch 
                            checked={hookConfig.notificationSettings.email}
                            onCheckedChange={(checked) => handleUpdateConfig({ 
                              notificationSettings: { ...hookConfig.notificationSettings, email: checked }
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>In-App Notifications</Label>
                          <Switch 
                            checked={hookConfig.notificationSettings.inApp}
                            onCheckedChange={(checked) => handleUpdateConfig({ 
                              notificationSettings: { ...hookConfig.notificationSettings, inApp: checked }
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Enabled Events</Label>
                        <div className="space-y-2">
                          {['trade', 'rebalance', 'snapshot', 'dividend', 'user_triggered'].map((eventType) => (
                            <div key={eventType} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={eventType}
                                checked={hookConfig.enabledEvents.includes(eventType as any)}
                                onChange={(e) => {
                                  const enabledEvents = e.target.checked 
                                    ? [...hookConfig.enabledEvents, eventType as any]
                                    : hookConfig.enabledEvents.filter(et => et !== eventType);
                                  handleUpdateConfig({ enabledEvents });
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <Label htmlFor={eventType} className="text-sm cursor-pointer">
                                {taxReportingHooksService.formatEventType(eventType as any)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notification Threshold</Label>
                        <Input
                          type="number"
                          value={hookConfig.notificationSettings.threshold}
                          onChange={(e) => handleUpdateConfig({ 
                            notificationSettings: { ...hookConfig.notificationSettings, threshold: Number(e.target.value) }
                          })}
                          placeholder="1000"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Button 
                          onClick={() => handleUpdateConfig(taxReportingHooksService.createDefaultHookConfiguration(
                            user?.id || '', 
                            activeVaultId || '', 
                            selectedJurisdiction
                          ))}
                          disabled={updateConfigMutation.isPending}
                        >
                          {updateConfigMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Configuration
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default TaxReportingHooksPanel; 