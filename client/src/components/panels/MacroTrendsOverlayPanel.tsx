import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  ArrowUpCircle,
  Package,
  Heart,
  BarChart3,
  LineChart,
  AreaChart,
  ScatterChart,
  Settings,
  Calendar,
  Filter,
  Download,
  Upload,
  Save,
  Loader2,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Pause
} from 'lucide-react';
import {
  macroTrendsOverlayService,
  useMacroIndicators,
  useNormalizedTimeSeries,
  useMacroEvents,
  useMacroDashboard,
  useSaveChartConfiguration,
  useLoadChartConfiguration,
  useMacroAnalysis,
  MacroIndicator,
  ChartConfiguration,
  MacroEvent
} from '../../services/macroTrendsOverlayService';

// Mock chart component (would be replaced with actual charting library)
const MacroChart: React.FC<{
  data: any[];
  events: MacroEvent[];
  config: Partial<ChartConfiguration>;
  onRender: () => void;
}> = ({ data, events, config, onRender }) => {
  React.useEffect(() => {
    onRender();
  }, [data, events, config, onRender]);

  return (
    <div className="w-full h-96 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <LineChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Macro Trends Chart</p>
        <p className="text-sm">
          {data.length > 0 ? `${data.length} indicators plotted` : 'Select indicators to display chart'}
        </p>
        {events.length > 0 && (
          <p className="text-xs mt-2">
            {events.length} events annotated
          </p>
        )}
      </div>
    </div>
  );
};

export const MacroTrendsOverlayPanel: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfiguration>(
    macroTrendsOverlayService.createDefaultChartConfiguration() as ChartConfiguration
  );
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('chart');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mutations
  const saveConfigMutation = useSaveChartConfiguration();
  const loadConfigMutation = useLoadChartConfiguration();

  // Fetch data
  const { data: indicators, isLoading: indicatorsLoading } = useMacroIndicators();
  const { data: dashboard } = useMacroDashboard();
  
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useNormalizedTimeSeries(
    selectedIndicators,
    chartConfig.timeRange.start,
    chartConfig.timeRange.end,
    chartConfig.normalization.method
  );
  
  const { data: events } = useMacroEvents(
    chartConfig.timeRange.start,
    chartConfig.timeRange.end,
    chartConfig.visualization.showEvents ? undefined : []
  );
  
  const { data: analysis } = useMacroAnalysis(
    selectedIndicators,
    chartConfig.timeRange.start,
    chartConfig.timeRange.end
  );

  // Computed values
  const timeRangeOptions = useMemo(() => 
    macroTrendsOverlayService.generateTimeRangeOptions(),
    []
  );

  const filteredIndicators = useMemo(() => {
    if (!indicators) return [];
    
    return indicators.filter(indicator => {
      const matchesSearch = !searchTerm || 
        indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !filterCategory || indicator.category === filterCategory;
      const matchesCountry = !filterCountry || indicator.country === filterCountry;
      
      return matchesSearch && matchesCategory && matchesCountry && indicator.isAvailable;
    });
  }, [indicators, searchTerm, filterCategory, filterCountry]);

  const availableCategories = useMemo(() => {
    if (!indicators) return [];
    return [...new Set(indicators.map(i => i.category))];
  }, [indicators]);

  const availableCountries = useMemo(() => {
    if (!indicators) return [];
    return [...new Set(indicators.map(i => i.country))];
  }, [indicators]);

  // Handle chart configuration changes
  const handleConfigChange = (field: string, value: any) => {
    if (field.startsWith('timeRange.')) {
      const rangeField = field.replace('timeRange.', '');
      if (rangeField === 'preset' && value !== 'custom') {
        const range = timeRangeOptions.find(option => option.value === value);
        if (range) {
          setChartConfig(prev => ({
            ...prev,
            timeRange: {
              start: range.start,
              end: range.end,
              preset: value
            }
          }));
        }
      } else {
        setChartConfig(prev => ({
          ...prev,
          timeRange: {
            ...prev.timeRange,
            [rangeField]: value
          }
        }));
      }
    } else if (field.startsWith('normalization.')) {
      const normField = field.replace('normalization.', '');
      setChartConfig(prev => ({
        ...prev,
        normalization: {
          ...prev.normalization,
          [normField]: value
        }
      }));
    } else if (field.startsWith('visualization.')) {
      const vizField = field.replace('visualization.', '');
      setChartConfig(prev => ({
        ...prev,
        visualization: {
          ...prev.visualization,
          [vizField]: value
        }
      }));
    } else {
      setChartConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle indicator selection
  const handleIndicatorToggle = async (indicatorId: string) => {
    const newSelection = selectedIndicators.includes(indicatorId)
      ? selectedIndicators.filter(id => id !== indicatorId)
      : [...selectedIndicators, indicatorId];
    
    setSelectedIndicators(newSelection);
    
    // Log selection change
    await macroTrendsOverlayService.handleIndicatorSelection(newSelection);
  };

  // Handle chart render
  const handleChartRender = async () => {
    if (selectedIndicators.length === 0) return;
    
    await macroTrendsOverlayService.handleChartRender(
      selectedIndicators,
      chartConfig.timeRange,
      chartConfig
    );
  };

  // Handle save configuration
  const handleSaveConfiguration = async () => {
    if (!chartConfig.name.trim()) {
      setChartConfig(prev => ({ ...prev, name: `Chart ${Date.now()}` }));
    }
    
    setIsSaving(true);
    try {
      await saveConfigMutation.mutateAsync({
        ...chartConfig,
        selectedIndicators
      });
      setIsConfiguring(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle load configuration
  const handleLoadConfiguration = async (configId: string) => {
    setIsLoading(true);
    try {
      const config = await loadConfigMutation.mutateAsync(configId);
      setChartConfig(config);
      setSelectedIndicators(config.selectedIndicators);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/macro/indicators'] });
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const iconName = macroTrendsOverlayService.getCategoryIcon(category as any);
    switch (iconName) {
      case 'dollar-sign':
        return <DollarSign className="h-4 w-4" />;
      case 'receipt':
        return <Receipt className="h-4 w-4" />;
      case 'trending-up':
        return <TrendingUp className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'arrow-up-circle':
        return <ArrowUpCircle className="h-4 w-4" />;
      case 'package':
        return <Package className="h-4 w-4" />;
      case 'heart':
        return <Heart className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  if (indicatorsLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading macro indicators...
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
            <TrendingUp className="h-5 w-5" />
            Macro Trends Overlay
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsConfiguring(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSaveConfiguration} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Dashboard Summary */}
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Indicators</div>
                <div className="text-2xl font-bold">{dashboard.summary.totalIndicators}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold text-green-600">{dashboard.summary.activeIndicators}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Data Quality</div>
                <div className="text-2xl font-bold text-blue-600">{(dashboard.summary.dataQuality * 100).toFixed(0)}%</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Recent Events</div>
                <div className="text-2xl font-bold text-purple-600">{dashboard.recentEvents.length}</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="indicators">Indicators</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            {/* Chart Tab */}
            <TabsContent value="chart" className="space-y-4">
              {/* Chart Controls */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Time Range:</label>
                  <Select 
                    value={chartConfig.timeRange.preset} 
                    onValueChange={(value) => handleConfigChange('timeRange.preset', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeRangeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {chartConfig.timeRange.preset === 'custom' && (
                  <>
                    <Input
                      type="date"
                      value={chartConfig.timeRange.start}
                      onChange={(e) => handleConfigChange('timeRange.start', e.target.value)}
                      className="w-36"
                    />
                    <Input
                      type="date"
                      value={chartConfig.timeRange.end}
                      onChange={(e) => handleConfigChange('timeRange.end', e.target.value)}
                      className="w-36"
                    />
                  </>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Normalization:</label>
                  <Select 
                    value={chartConfig.normalization.method} 
                    onValueChange={(value) => handleConfigChange('normalization.method', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="z-score">Z-Score</SelectItem>
                      <SelectItem value="min-max">Min-Max</SelectItem>
                      <SelectItem value="percentage-change">% Change</SelectItem>
                      <SelectItem value="log-transform">Log Transform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={chartConfig.visualization.showEvents}
                    onCheckedChange={(checked) => handleConfigChange('visualization.showEvents', checked)}
                  />
                  <label className="text-sm font-medium">Show Events</label>
                </div>
              </div>

              {/* Selected Indicators */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Selected:</span>
                {selectedIndicators.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No indicators selected</span>
                ) : (
                  selectedIndicators.map(id => {
                    const indicator = indicators?.find(i => i.id === id);
                    return indicator ? (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        {indicator.name}
                        <button
                          onClick={() => handleIndicatorToggle(id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })
                )}
              </div>

              {/* Chart */}
              <MacroChart
                data={timeSeriesData || []}
                events={events || []}
                config={chartConfig}
                onRender={handleChartRender}
              />

              {/* Loading Indicator */}
              {timeSeriesLoading && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Loading chart data...</p>
                </div>
              )}
            </TabsContent>

            {/* Indicators Tab */}
            <TabsContent value="indicators" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search indicators..."
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
                    {availableCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {availableCountries.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterCountry('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>

              {/* Indicators Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredIndicators.map(indicator => (
                  <div
                    key={indicator.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedIndicators.includes(indicator.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleIndicatorToggle(indicator.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded ${macroTrendsOverlayService.getCategoryColor(indicator.category)} bg-current bg-opacity-20`}>
                        {getCategoryIcon(indicator.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{indicator.name}</div>
                        <div className="text-xs text-muted-foreground">{indicator.code}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {indicator.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {indicator.country}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {macroTrendsOverlayService.getFrequencyLabel(indicator.frequency)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Updated {macroTrendsOverlayService.formatRelativeTime(indicator.lastUpdated)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredIndicators.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No indicators match the current filters.</p>
                </div>
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              {events && events.length > 0 ? (
                <div className="space-y-3">
                  {events.slice(0, 20).map(event => (
                    <div key={event.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${macroTrendsOverlayService.getEventSeverityColor(event.severity)} bg-transparent`}
                          >
                            {event.severity.toUpperCase()}
                          </Badge>
                          <Badge 
                            className={`${macroTrendsOverlayService.getEventImpactColor(event.impact)} bg-transparent`}
                          >
                            {event.impact.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()} • {event.category}
                        </div>
                        <div className="text-muted-foreground">
                          Affects {event.affectedIndicators.length} indicators
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events in the selected time range.</p>
                </div>
              )}
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              {analysis ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-3">Summary</h4>
                    <div className="space-y-2 text-sm">
                      <p>{analysis.summary.trendAnalysis}</p>
                      {analysis.summary.keyInsights.length > 0 && (
                        <div>
                          <span className="font-medium">Key Insights:</span>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {analysis.summary.keyInsights.map((insight, index) => (
                              <li key={index}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Correlations */}
                  {analysis.correlations.length > 0 && (
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-3">Correlations</h4>
                      <div className="space-y-2">
                        {analysis.correlations.slice(0, 5).map((corr, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{corr.indicator1} × {corr.indicator2}</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                Math.abs(corr.correlation) > 0.7 ? 'text-red-600' :
                                Math.abs(corr.correlation) > 0.3 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {corr.correlation.toFixed(2)}
                              </span>
                              <span className="text-muted-foreground">
                                ({corr.period})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anomalies */}
                  {analysis.anomalies.length > 0 && (
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-3">Anomalies</h4>
                      <div className="space-y-2">
                        {analysis.anomalies.slice(0, 5).map((anomaly, index) => (
                          <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            <div className="font-medium">{anomaly.indicatorId}</div>
                            <div className="text-muted-foreground">{anomaly.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(anomaly.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedIndicators.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select indicators to view analysis.</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Generating analysis...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      {/* Configuration Modal */}
      <Dialog open={isConfiguring} onOpenChange={setIsConfiguring}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chart Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Configuration Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Configuration Name</label>
              <Input
                value={chartConfig.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="My Chart Configuration"
              />
            </div>

            {/* Visualization Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chart Type</label>
                <Select 
                  value={chartConfig.visualization.chartType} 
                  onValueChange={(value) => handleConfigChange('visualization.chartType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Y-Axis Scale</label>
                <Select 
                  value={chartConfig.visualization.yAxisScale} 
                  onValueChange={(value) => handleConfigChange('visualization.yAxisScale', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="logarithmic">Logarithmic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <h4 className="font-medium">Display Options</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Events</label>
                  <Switch
                    checked={chartConfig.visualization.showEvents}
                    onCheckedChange={(checked) => handleConfigChange('visualization.showEvents', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Annotations</label>
                  <Switch
                    checked={chartConfig.visualization.showAnnotations}
                    onCheckedChange={(checked) => handleConfigChange('visualization.showAnnotations', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Correlations</label>
                  <Switch
                    checked={chartConfig.visualization.showCorrelations}
                    onCheckedChange={(checked) => handleConfigChange('visualization.showCorrelations', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Enable Normalization</label>
                  <Switch
                    checked={chartConfig.normalization.enabled}
                    onCheckedChange={(checked) => handleConfigChange('normalization.enabled', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsConfiguring(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfiguration} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 