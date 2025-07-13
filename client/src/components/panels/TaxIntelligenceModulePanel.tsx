import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  Calculator,
  FileText,
  Download,
  Globe,
  MapPin,
  Flag,
  Crown,
  Building,
  TrendingUp,
  PieChart,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Calendar,
  DollarSign,
  Scale,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortfolio } from '../../contexts/PortfolioContext';
import {
  taxIntelligenceModuleService,
  useJurisdictions,
  useTaxYears,
  useTaxRules,
  useAssetClasses,
  useTradingStyles,
  useClassifyTaxTreatment,
  useTaxSummary,
  useExportTaxData,
  TaxJurisdiction,
  TaxClassificationRequest,
  TaxClassificationResult
} from '../../services/taxIntelligenceModuleService';

export const TaxIntelligenceModulePanel: React.FC = () => {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  
  // State management
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<TaxJurisdiction['code']>('NZ');
  const [selectedTaxYear, setSelectedTaxYear] = useState<string>('2024-2025');
  const [activeTab, setActiveTab] = useState<string>('classify');
  const [classificationRequest, setClassificationRequest] = useState<TaxClassificationRequest>(
    taxIntelligenceModuleService.createDefaultClassificationRequest()
  );
  const [showResults, setShowResults] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);

  // Mutations
  const classifyTaxTreatmentMutation = useClassifyTaxTreatment();
  const exportTaxDataMutation = useExportTaxData();

  // Fetch data
  const { data: jurisdictions, isLoading: loadingJurisdictions } = useJurisdictions();
  const { data: taxYears, isLoading: loadingTaxYears } = useTaxYears(selectedJurisdiction);
  const { data: taxRules, isLoading: loadingTaxRules } = useTaxRules(selectedJurisdiction, selectedTaxYear);
  const { data: assetClasses, isLoading: loadingAssetClasses } = useAssetClasses();
  const { data: tradingStyles, isLoading: loadingTradingStyles } = useTradingStyles();
  const { data: taxSummary, isLoading: loadingTaxSummary } = useTaxSummary(
    selectedJurisdiction, 
    selectedTaxYear, 
    user?.id || ''
  );

  // Get jurisdiction icon
  const getJurisdictionIcon = (jurisdiction: TaxJurisdiction['code']) => {
    const iconName = taxIntelligenceModuleService.getJurisdictionIcon(jurisdiction);
    switch (iconName) {
      case 'map-pin':
        return <MapPin className="h-4 w-4" />;
      case 'globe':
        return <Globe className="h-4 w-4" />;
      case 'flag':
        return <Flag className="h-4 w-4" />;
      case 'crown':
        return <Crown className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  // Handle classification
  const handleClassifyTaxTreatment = async () => {
    try {
      const result = await taxIntelligenceModuleService.handleTaxClassification(classificationRequest);
      if (result.success) {
        setShowResults(true);
      }
    } catch (error) {
      console.error('Classification failed:', error);
    }
  };

  // Handle export
  const handleExportTaxData = async (format: 'pdf' | 'csv' | 'json' = 'pdf') => {
    try {
      await taxIntelligenceModuleService.handleReportGeneration(
        selectedJurisdiction,
        selectedTaxYear,
        user?.id || '',
        format
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Update classification request
  const updateClassificationRequest = (updates: Partial<TaxClassificationRequest>) => {
    setClassificationRequest(prev => ({
      ...prev,
      ...updates,
      jurisdiction: selectedJurisdiction,
      taxYear: selectedTaxYear
    }));
  };

  // Update transaction data
  const updateTransactionData = (updates: Partial<TaxClassificationRequest['transaction']>) => {
    setClassificationRequest(prev => ({
      ...prev,
      transaction: {
        ...prev.transaction,
        ...updates
      }
    }));
  };

  // Update user profile
  const updateUserProfile = (updates: Partial<TaxClassificationRequest['userProfile']>) => {
    setClassificationRequest(prev => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        ...updates
      }
    }));
  };

  // Update additional factors
  const updateAdditionalFactors = (updates: Partial<TaxClassificationRequest['additionalFactors']>) => {
    setClassificationRequest(prev => ({
      ...prev,
      additionalFactors: {
        ...prev.additionalFactors,
        ...updates
      }
    }));
  };

  // Calculate holding period
  const calculateHoldingPeriod = () => {
    if (classificationRequest.transaction.purchaseDate && classificationRequest.transaction.saleDate) {
      const purchaseDate = new Date(classificationRequest.transaction.purchaseDate);
      const saleDate = new Date(classificationRequest.transaction.saleDate);
      const diffTime = saleDate.getTime() - purchaseDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      updateTransactionData({ holdingPeriod: diffDays });
    }
  };

  // Calculate gain/loss
  const calculateGainLoss = () => {
    const { purchasePrice, salePrice, quantity, transactionCosts } = classificationRequest.transaction;
    const totalPurchase = purchasePrice * quantity;
    const totalSale = salePrice * quantity;
    const netGain = totalSale - totalPurchase - transactionCosts;
    return netGain;
  };

  if (loadingJurisdictions || loadingAssetClasses || loadingTradingStyles) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Loading tax intelligence module...
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
              <Calculator className="h-5 w-5" />
              Tax Intelligence Module
              <Badge className="bg-blue-100 text-blue-800">
                {taxIntelligenceModuleService.formatTaxYear(selectedJurisdiction, selectedTaxYear)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRulesDialog(true)}
                disabled={loadingTaxRules}
              >
                <Scale className="h-4 w-4" />
                Rules
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportTaxData('pdf')}
                disabled={exportTaxDataMutation.isPending}
              >
                {exportTaxDataMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
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
                    {jurisdictions?.map((jurisdiction) => (
                      <SelectItem key={jurisdiction.code} value={jurisdiction.code}>
                        <div className="flex items-center gap-2">
                          {getJurisdictionIcon(jurisdiction.code)}
                          <span>{jurisdiction.name}</span>
                        </div>
                      </SelectItem>
                    ))}
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
                    {taxYears?.map((taxYear) => (
                      <SelectItem key={taxYear.taxYear} value={taxYear.taxYear}>
                        <div className="flex items-center justify-between w-full">
                          <span>{taxYear.taxYear}</span>
                          {taxYear.isActive && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="classify">
                  <Calculator className="h-4 w-4 mr-2" />
                  Classify
                </TabsTrigger>
                <TabsTrigger value="summary">
                  <PieChart className="h-4 w-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="rules">
                  <FileText className="h-4 w-4 mr-2" />
                  Rules
                </TabsTrigger>
              </TabsList>

              {/* Tax Classification Tab */}
              <TabsContent value="classify" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transaction Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Asset Class</Label>
                          <Select 
                            value={classificationRequest.transaction.assetClass} 
                            onValueChange={(value) => updateTransactionData({ assetClass: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {assetClasses?.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                  {asset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Asset Type</Label>
                          <Input
                            value={classificationRequest.transaction.assetType}
                            onChange={(e) => updateTransactionData({ assetType: e.target.value })}
                            placeholder="e.g., Common Stock"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={classificationRequest.transaction.quantity}
                            onChange={(e) => updateTransactionData({ quantity: Number(e.target.value) })}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Purchase Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={classificationRequest.transaction.purchasePrice}
                            onChange={(e) => updateTransactionData({ purchasePrice: Number(e.target.value) })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sale Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={classificationRequest.transaction.salePrice}
                            onChange={(e) => updateTransactionData({ salePrice: Number(e.target.value) })}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Transaction Costs</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={classificationRequest.transaction.transactionCosts}
                            onChange={(e) => updateTransactionData({ transactionCosts: Number(e.target.value) })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Purchase Date</Label>
                          <Input
                            type="date"
                            value={classificationRequest.transaction.purchaseDate}
                            onChange={(e) => {
                              updateTransactionData({ purchaseDate: e.target.value });
                              calculateHoldingPeriod();
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Sale Date</Label>
                          <Input
                            type="date"
                            value={classificationRequest.transaction.saleDate}
                            onChange={(e) => {
                              updateTransactionData({ saleDate: e.target.value });
                              calculateHoldingPeriod();
                            }}
                          />
                        </div>
                      </div>

                      {/* Calculated Values */}
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Holding Period:</span>
                            <span className="font-medium">
                              {classificationRequest.transaction.holdingPeriod} days
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gain/Loss:</span>
                            <span className={`font-medium ${
                              calculateGainLoss() >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {taxIntelligenceModuleService.formatCurrency(calculateGainLoss(), selectedJurisdiction)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* User Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">User Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Residency Status</Label>
                          <Select 
                            value={classificationRequest.userProfile.residencyStatus} 
                            onValueChange={(value) => updateUserProfile({ residencyStatus: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="resident">Resident</SelectItem>
                              <SelectItem value="non_resident">Non-Resident</SelectItem>
                              <SelectItem value="temporary">Temporary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Trading Experience</Label>
                          <Select 
                            value={classificationRequest.userProfile.tradingExperience} 
                            onValueChange={(value) => updateUserProfile({ tradingExperience: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Trading Intent</Label>
                          <Select 
                            value={classificationRequest.userProfile.tradingIntent} 
                            onValueChange={(value) => updateUserProfile({ tradingIntent: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="investment">Investment</SelectItem>
                              <SelectItem value="speculation">Speculation</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Trading Frequency</Label>
                          <Select 
                            value={classificationRequest.userProfile.tradingFrequency} 
                            onValueChange={(value) => updateUserProfile({ tradingFrequency: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="occasional">Occasional</SelectItem>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="frequent">Frequent</SelectItem>
                              <SelectItem value="day_trading">Day Trading</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Occupation</Label>
                        <Input
                          value={classificationRequest.userProfile.occupation}
                          onChange={(e) => updateUserProfile({ occupation: e.target.value })}
                          placeholder="e.g., Software Engineer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Average Holding Period (days)</Label>
                        <Input
                          type="number"
                          value={classificationRequest.userProfile.averageHoldingPeriod}
                          onChange={(e) => updateUserProfile({ averageHoldingPeriod: Number(e.target.value) })}
                          placeholder="365"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(classificationRequest.additionalFactors).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={key}
                            checked={value}
                            onChange={(e) => updateAdditionalFactors({ [key]: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <Label htmlFor={key} className="text-sm cursor-pointer">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Classification Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={handleClassifyTaxTreatment}
                    disabled={classifyTaxTreatmentMutation.isPending}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    {classifyTaxTreatmentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Classifying...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Classify Tax Treatment
                      </>
                    )}
                  </Button>
                </div>

                {/* Results */}
                {classifyTaxTreatmentMutation.data && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Classification Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {classifyTaxTreatmentMutation.data.classification.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className="text-sm text-muted-foreground">Classification</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {taxIntelligenceModuleService.formatCurrency(classifyTaxTreatmentMutation.data.taxableAmount, selectedJurisdiction)}
                            </div>
                            <div className="text-sm text-muted-foreground">Taxable Amount</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {taxIntelligenceModuleService.formatPercentage(classifyTaxTreatmentMutation.data.taxRate)}
                            </div>
                            <div className="text-sm text-muted-foreground">Tax Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {taxIntelligenceModuleService.formatCurrency(classifyTaxTreatmentMutation.data.taxLiability, selectedJurisdiction)}
                            </div>
                            <div className="text-sm text-muted-foreground">Tax Liability</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <div className="text-sm text-muted-foreground">Confidence Level:</div>
                          <Badge className={`${taxIntelligenceModuleService.getConfidenceLevel(classifyTaxTreatmentMutation.data.confidence).color}`}>
                            {taxIntelligenceModuleService.getConfidenceLevel(classifyTaxTreatmentMutation.data.confidence).level}
                          </Badge>
                        </div>

                        {classifyTaxTreatmentMutation.data.reasoning.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Reasoning:</Label>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {classifyTaxTreatmentMutation.data.reasoning.map((reason, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {classifyTaxTreatmentMutation.data.warnings.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Warnings:</Label>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {classifyTaxTreatmentMutation.data.warnings.map((warning, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-6">
                {loadingTaxSummary ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                    Loading tax summary...
                  </div>
                ) : taxSummary ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.totalGains, selectedJurisdiction)}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Gains</div>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-red-600">
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.totalLosses, selectedJurisdiction)}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Losses</div>
                            </div>
                            <BarChart3 className="h-8 w-8 text-red-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.totalTaxLiability, selectedJurisdiction)}
                              </div>
                              <div className="text-sm text-muted-foreground">Tax Liability</div>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Classification Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span>Capital Gains</span>
                              <span className="font-medium">
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.classifications.capitalGains, selectedJurisdiction)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Business Income</span>
                              <span className="font-medium">
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.classifications.businessIncome, selectedJurisdiction)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Trading Income</span>
                              <span className="font-medium">
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.classifications.tradingIncome, selectedJurisdiction)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Exempt</span>
                              <span className="font-medium">
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.classifications.exempt, selectedJurisdiction)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Summary Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span>Total Transactions</span>
                              <span className="font-medium">{taxSummary.totalTransactions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Net Position</span>
                              <span className={`font-medium ${taxSummary.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.netPosition, selectedJurisdiction)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Effective Rate</span>
                              <span className="font-medium">
                                {taxIntelligenceModuleService.formatPercentage(taxSummary.effectiveRate)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Total Deductions</span>
                              <span className="font-medium">
                                {taxIntelligenceModuleService.formatCurrency(taxSummary.deductionsSummary.totalDeductions, selectedJurisdiction)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tax summary available
                  </div>
                )}
              </TabsContent>

              {/* Rules Tab */}
              <TabsContent value="rules" className="space-y-6">
                {loadingTaxRules ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                    Loading tax rules...
                  </div>
                ) : taxRules && taxRules.length > 0 ? (
                  <div className="space-y-4">
                    {taxRules.map((rule) => (
                      <Card key={rule.id}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span>{rule.title}</span>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-gray-100 text-gray-800">
                                {rule.category.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                {rule.ruleType.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {rule.description}
                          </p>
                          
                          {rule.conditions.length > 0 && (
                            <div className="mb-4">
                              <Label className="text-sm font-medium mb-2 block">Conditions:</Label>
                              <ul className="text-sm space-y-1">
                                {rule.conditions.map((condition) => (
                                  <li key={condition.id} className="flex items-start gap-2">
                                    <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    {condition.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {rule.consequences.length > 0 && (
                            <div className="mb-4">
                              <Label className="text-sm font-medium mb-2 block">Consequences:</Label>
                              <ul className="text-sm space-y-1">
                                {rule.consequences.map((consequence) => (
                                  <li key={consequence.id} className="flex items-start gap-2">
                                    <Zap className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                    {consequence.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Version: {rule.version}</span>
                            <span>Updated: {new Date(rule.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tax rules available for this jurisdiction and tax year
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>

        {/* Tax Rules Dialog */}
        <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Tax Rules - {selectedJurisdiction} {selectedTaxYear}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96">
              {taxRules && taxRules.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {taxRules.map((rule) => (
                    <Card key={rule.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{rule.title}</h3>
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            {rule.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description}
                        </p>
                        {rule.references.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            References: {rule.references.join(', ')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tax rules available
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
};

export default TaxIntelligenceModulePanel; 