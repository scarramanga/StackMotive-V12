import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { 
  FileText,
  Download,
  Calendar,
  Mail,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  Shield,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  FileType,
  Globe,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { PDFGenerationService, ReportGeneratorData, DateRange, ReportGenerationRequest } from '../../services/PDFGenerationService';

const pdfService = PDFGenerationService.getInstance();

export const PerformanceReportGeneratorPanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const queryClient = useQueryClient();
  
  // State management
  const [reportType, setReportType] = useState<'pdf' | 'html'>('pdf');
  const [includeSections, setIncludeSections] = useState<string[]>([]);
  const [selectedRange, setSelectedRange] = useState<DateRange>(pdfService.getDefaultDateRange());
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Fetch report generator data
  const { data: reportData, isLoading, error, refetch } = useQuery<ReportGeneratorData>({
    queryKey: ['/api/user/performance-summary', activeVaultId],
    queryFn: () => pdfService.getPerformanceSummary(activeVaultId),
    enabled: !!user && !!activeVaultId,
    refetchInterval: 60000,
  });

  // Initialize default sections
  useEffect(() => {
    if (reportData?.availableSections && includeSections.length === 0) {
      const defaultSections = reportData.availableSections
        .filter(section => section.enabled)
        .map(section => section.id);
      setIncludeSections(defaultSections);
    }
  }, [reportData, includeSections.length]);

  // Handle section toggle
  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    setIncludeSections(prev => 
      checked 
        ? [...prev, sectionId]
        : prev.filter(id => id !== sectionId)
    );
  };

  // Handle generate report
  const handleGenerateReport = async () => {
    // Validate form
    const validation = pdfService.validateReportForm({
      reportType,
      includeSections,
      dateRange: selectedRange,
      sendEmail,
      emailAddress
    });
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setFormErrors([]);
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      const request: ReportGenerationRequest = {
        reportType,
        includeSections,
        dateRange: {
          start: selectedRange.start.toISOString(),
          end: selectedRange.end.toISOString(),
        },
        emailTo: sendEmail ? emailAddress : undefined,
        vaultId: activeVaultId,
      };
      
      const response = await pdfService.generatePerformanceReport(request);
      setCurrentJobId(response.jobId);
      
      // Track progress
      const finalResult = await pdfService.trackGenerationProgress(
        response.jobId,
        activeVaultId,
        setGenerationProgress
      );
      
      if (finalResult.downloadUrl) {
        pdfService.downloadReport(finalResult.downloadUrl, `performance-report-${reportType}.${reportType}`);
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user/performance-summary'] });
      
    } catch (error) {
      console.error('Report generation failed:', error);
      setFormErrors(['Report generation failed. Please try again.']);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentJobId(null);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await pdfService.exportReportData(activeVaultId, 'csv');
      pdfService.createDownloadLink(blob, `performance-data-${reportType}.csv`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle date change
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setSelectedRange(prev => pdfService.handleDateChange(field, value, prev));
  };

  // Get section icon
  const getSectionIcon = (sectionId: string) => {
    const iconName = pdfService.getSectionIcon(sectionId);
    switch (iconName) {
      case 'bar-chart-3':
        return <BarChart3 className="h-4 w-4" />;
      case 'trending-up':
        return <TrendingUp className="h-4 w-4" />;
      case 'pie-chart':
        return <PieChart className="h-4 w-4" />;
      case 'target':
        return <Target className="h-4 w-4" />;
      case 'trending-down':
        return <TrendingDown className="h-4 w-4" />;
      case 'shield':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading performance data: {error.message}
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
            Loading performance data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No performance data available
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
            <FileText className="h-5 w-5" />
            Performance Report Generator
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        {reportData.lastGeneratedReport && (
          <Badge className="bg-green-100 text-green-800 self-start">
            Last generated: {pdfService.formatTime(reportData.lastGeneratedReport.timestamp)}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Current Performance Overview</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  reportData.performanceSummary.totalReturn > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {pdfService.formatPercentage(reportData.performanceSummary.totalReturn)}
                </div>
                <div className="text-sm text-blue-700">Total Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.performanceSummary.totalTrades}
                </div>
                <div className="text-sm text-blue-700">Total Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reportData.performanceSummary.winRate.toFixed(1)}%
                </div>
                <div className="text-sm text-blue-700">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {reportData.performanceSummary.maxDrawdown.toFixed(1)}%
                </div>
                <div className="text-sm text-blue-700">Max Drawdown</div>
              </div>
            </div>
          </div>

          {/* Form Errors */}
          {formErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Please correct the following errors:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Report Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Report Type & Date Range */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Report Type</label>
                <Select value={reportType} onValueChange={(value: 'pdf' | 'html') => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileType className="h-4 w-4" />
                        PDF Report
                      </div>
                    </SelectItem>
                    <SelectItem value="html">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        HTML Report
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={pdfService.formatDateForInput(selectedRange.start)}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                  />
                  <Input
                    type="date"
                    value={pdfService.formatDateForInput(selectedRange.end)}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Email Option */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-email"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                  />
                  <label htmlFor="send-email" className="text-sm font-medium">
                    Email report when ready
                  </label>
                </div>
                
                {sendEmail && (
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Sections to Include */}
            <div>
              <label className="block text-sm font-medium mb-2">Sections to Include</label>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {reportData.availableSections.map((section) => (
                  <div key={section.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                    <Checkbox
                      id={section.id}
                      checked={includeSections.includes(section.id)}
                      onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSectionIcon(section.id)}
                        <label htmlFor={section.id} className="font-medium cursor-pointer">
                          {section.name}
                        </label>
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          {section.dataSize}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {section.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                <span className="font-medium text-yellow-800">Generating Report...</span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="text-sm text-yellow-700">
                Progress: {generationProgress}% - Estimated size: {pdfService.calculateEstimatedSize(includeSections)}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || includeSections.length === 0}
              className="w-full md:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate {reportType.toUpperCase()} Report
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 