import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  FileText, 
  ArrowLeft, 
  Plus, 
  Trash2,
  MoveVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function CustomReportPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [reportName, setReportName] = useState('');
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [description, setDescription] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  
  // Available data sources to include in the report
  const dataSources = [
    { id: 'trades', name: 'Trading Activity' },
    { id: 'portfolio', name: 'Portfolio Holdings' },
    { id: 'strategies', name: 'Trading Strategies' },
    { id: 'performance', name: 'Performance Metrics' },
    { id: 'allocation', name: 'Asset Allocation' },
    { id: 'tax', name: 'Tax Lots' },
    { id: 'news', name: 'News & Events' },
    { id: 'sentiment', name: 'Market Sentiment' },
    { id: 'whale', name: 'Whale Activities' }
  ];
  
  // Available metrics based on the selected data sources
  const getAvailableMetrics = () => {
    const allMetrics = {
      trades: [
        { id: 'trade_count', name: 'Trade Count' },
        { id: 'win_rate', name: 'Win Rate' },
        { id: 'avg_return', name: 'Average Return' },
        { id: 'profit_factor', name: 'Profit Factor' },
        { id: 'max_drawdown', name: 'Maximum Drawdown' }
      ],
      portfolio: [
        { id: 'total_value', name: 'Total Value' },
        { id: 'gain_loss', name: 'Gain/Loss' },
        { id: 'dividend_yield', name: 'Dividend Yield' },
        { id: 'beta', name: 'Portfolio Beta' }
      ],
      strategies: [
        { id: 'strategy_performance', name: 'Strategy Performance' },
        { id: 'strategy_comparison', name: 'Strategy Comparison' },
        { id: 'signal_accuracy', name: 'Signal Accuracy' }
      ],
      performance: [
        { id: 'sharpe_ratio', name: 'Sharpe Ratio' },
        { id: 'alpha', name: 'Alpha' },
        { id: 'volatility', name: 'Volatility' },
        { id: 'benchmark_comparison', name: 'Benchmark Comparison' }
      ],
      allocation: [
        { id: 'asset_class_allocation', name: 'Asset Class Allocation' },
        { id: 'sector_allocation', name: 'Sector Allocation' },
        { id: 'geographic_allocation', name: 'Geographic Allocation' },
        { id: 'currency_allocation', name: 'Currency Allocation' }
      ],
      tax: [
        { id: 'tax_lots', name: 'Tax Lots' },
        { id: 'realized_gains', name: 'Realized Gains' },
        { id: 'harvest_opportunities', name: 'Harvest Opportunities' }
      ],
      news: [
        { id: 'news_impact', name: 'News Impact Analysis' },
        { id: 'event_correlation', name: 'Event Correlation' }
      ],
      sentiment: [
        { id: 'sentiment_analysis', name: 'Sentiment Analysis' },
        { id: 'sentiment_trend', name: 'Sentiment Trend' }
      ],
      whale: [
        { id: 'whale_activity', name: 'Whale Activity' },
        { id: 'institutional_flows', name: 'Institutional Flows' }
      ]
    };
    
    let metrics = [];
    for (const source of selectedDataSources) {
      // @ts-ignore - dynamic access
      metrics = [...metrics, ...allMetrics[source]];
    }
    return metrics;
  };
  
  // Grouping options
  const groupByOptions = [
    { id: 'none', name: 'No Grouping' },
    { id: 'date', name: 'Date (Daily/Weekly/Monthly)' },
    { id: 'symbol', name: 'Symbol' },
    { id: 'strategy', name: 'Strategy' },
    { id: 'asset_class', name: 'Asset Class' },
    { id: 'sector', name: 'Sector' },
    { id: 'account', name: 'Trading Account' }
  ];
  
  const handleGenerateReport = () => {
    if (!reportName) {
      toast({
        title: 'Report name required',
        description: 'Please provide a name for your report.',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedDataSources.length === 0) {
      toast({
        title: 'Data sources required',
        description: 'Please select at least one data source for your report.',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedMetrics.length === 0) {
      toast({
        title: 'Metrics required',
        description: 'Please select at least one metric to include in your report.',
        variant: 'destructive',
      });
      return;
    }
    
    if (previewMode) {
      // Toggle back to edit mode
      setPreviewMode(false);
      return;
    }
    
    // Show preview mode
    setPreviewMode(true);
    
    toast({
      title: 'Report preview generated',
      description: 'You can now review your custom report configuration.',
    });
  };
  
  const handleSaveReport = () => {
    toast({
      title: 'Report configuration saved',
      description: 'Your custom report has been saved and is now available in your reports list.',
    });
    
    navigate('/reports');
  };
  
  return (
    <div className='p-4'>
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
      </div>
      
      {!previewMode ? (
        // Report Builder UI
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Configuration</CardTitle>
                <CardDescription>Configure the basic settings for your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input 
                      id="report-name" 
                      placeholder="e.g., Monthly Performance Analysis"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date-range">Date Range</Label>
                    <div className="mt-1">
                      <DatePicker 
                        value={dateRange}
                        onChange={setDateRange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Report Description (Optional)</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe the purpose of this report"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Sources</CardTitle>
                  <CardDescription>Select the data to include in your report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dataSources.map((source) => (
                      <div key={source.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`source-${source.id}`}
                          checked={selectedDataSources.includes(source.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDataSources([...selectedDataSources, source.id]);
                            } else {
                              setSelectedDataSources(
                                selectedDataSources.filter((id) => id !== source.id)
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`source-${source.id}`}
                          className="cursor-pointer"
                        >
                          {source.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metrics</CardTitle>
                  <CardDescription>Select the metrics to display</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDataSources.length > 0 ? (
                    <div className="space-y-4">
                      {getAvailableMetrics().map((metric) => (
                        <div key={metric.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`metric-${metric.id}`}
                            checked={selectedMetrics.includes(metric.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMetrics([...selectedMetrics, metric.id]);
                              } else {
                                setSelectedMetrics(
                                  selectedMetrics.filter((id) => id !== metric.id)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`metric-${metric.id}`}
                            className="cursor-pointer"
                          >
                            {metric.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-4">
                      Select data sources to see available metrics
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Format Options</CardTitle>
                <CardDescription>Configure additional display options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="group-by">Group Data By</Label>
                  <Select 
                    value={selectedGroupBy} 
                    onValueChange={setSelectedGroupBy}
                  >
                    <SelectTrigger id="group-by" className="mt-1">
                      <SelectValue placeholder="Select grouping option" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupByOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                  />
                  <Label
                    htmlFor="include-charts"
                    className="cursor-pointer"
                  >
                    Include visualization charts
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Report Summary</CardTitle>
                <CardDescription>Review your selections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Report Name</h4>
                  <p className="text-muted-foreground">
                    {reportName || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Date Range</h4>
                  <p className="text-muted-foreground">
                    {dateRange.from && dateRange.to
                      ? `${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`
                      : 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Selected Data Sources</h4>
                  {selectedDataSources.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDataSources.map((id) => (
                        <Badge key={id} variant="outline">
                          {dataSources.find(source => source.id === id)?.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">None selected</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Selected Metrics</h4>
                  {selectedMetrics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedMetrics.map((id) => (
                        <Badge key={id} variant="outline">
                          {getAvailableMetrics().find(metric => metric.id === id)?.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">None selected</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Group By</h4>
                  <p className="text-muted-foreground">
                    {selectedGroupBy
                      ? groupByOptions.find(option => option.id === selectedGroupBy)?.name
                      : 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Include Charts</h4>
                  <p className="text-muted-foreground">
                    {includeCharts ? 'Yes' : 'No'}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-col gap-2">
                <Button 
                  onClick={handleGenerateReport} 
                  className="w-full"
                  disabled={!reportName || selectedDataSources.length === 0 || selectedMetrics.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Preview
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        // Report Preview
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{reportName}</CardTitle>
                  <CardDescription>
                    Date Range: {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setPreviewMode(false)}>
                    Edit Report
                  </Button>
                  <Button onClick={handleSaveReport}>
                    Save Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview">
                <TabsList>
                  <TabsTrigger value="preview">Report Preview</TabsTrigger>
                  <TabsTrigger value="configuration">Configuration</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Report Sample</h3>
                    
                    <div className="bg-muted/50 rounded-md p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h4 className="text-lg font-medium mb-2">Report Preview</h4>
                      <p className="text-muted-foreground max-w-lg mx-auto">
                        This is a configuration preview. The actual report will be generated
                        with real data from your account based on the selected metrics and parameters.
                      </p>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Included Data</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {selectedDataSources.map((id) => (
                          <li key={id}>
                            {dataSources.find(source => source.id === id)?.name} with{' '}
                            {selectedMetrics.filter(metricId => 
                              getAvailableMetrics().find(m => m.id === metricId)?.id.startsWith(id)
                            ).length} metrics
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="configuration">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">Report Name</h4>
                      <p className="text-muted-foreground">{reportName}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Description</h4>
                      <p className="text-muted-foreground">{description || 'Not provided'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Date Range</h4>
                        <p className="text-muted-foreground">
                          {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Group By</h4>
                        <p className="text-muted-foreground">
                          {groupByOptions.find(option => option.id === selectedGroupBy)?.name || 'None'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Include Charts</h4>
                        <p className="text-muted-foreground">{includeCharts ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Selected Data Sources</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDataSources.map((id) => (
                          <Badge key={id}>
                            {dataSources.find(source => source.id === id)?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Selected Metrics</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMetrics.map((id) => (
                          <Badge key={id} variant="outline">
                            {getAvailableMetrics().find(metric => metric.id === id)?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              Edit Report
            </Button>
            <Button onClick={handleSaveReport}>
              Save Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}