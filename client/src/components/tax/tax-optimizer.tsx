import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  FileText, 
  DollarSign,
  Filter,
  Scissors,
  RefreshCw,
  Calculator,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Activity,
  BarChart3
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

const taxJurisdictions = [
  { value: "nz", label: "New Zealand", symbol: "NZ$", rate: 0.28 },
  { value: "au", label: "Australia", symbol: "A$", rate: 0.30 },
  { value: "us", label: "United States", symbol: "$", rate: 0.25 }
];

const taxYears = [
  { value: "2025", label: "2025 (Current)" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
];

// Enhanced interfaces
interface TaxLot {
  id: number;
  symbol: string;
  quantity: number;
  costBasis: number;
  acquiredDate: Date;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  taxStatus: "short-term" | "long-term";
  harvestOpportunity: boolean;
  strategy?: string;
}

interface TaxSettings {
  taxJurisdiction: string;
  taxYear: string;
  includeCryptoAssets: boolean;
  includeStocks: boolean;
  includeOptions: boolean;
  dualResidency: boolean;
  secondaryJurisdiction: string | null;
  taxStrategy: "fifo" | "lifo" | "hifo" | "specific-id";
  harvestingEnabled: boolean;
  offsetThreshold: number;
}

interface OptimizationScenario {
  name: string;
  description: string;
  strategy: string;
  estimatedSavings: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: string;
}

interface DisposalStrategy {
  asset: string;
  action: 'sell' | 'hold';
  timing: string;
  taxImpact: number;
  recommendation: string;
  confidence: number;
}

const TaxOptimizer: React.FC = () => {
  const { toast } = useToast();
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxJurisdiction: "nz",
    taxYear: "2025",
    includeCryptoAssets: true,
    includeStocks: true,
    includeOptions: true,
    dualResidency: false,
    secondaryJurisdiction: null,
    taxStrategy: "fifo",
    harvestingEnabled: true,
    offsetThreshold: 5000,
  });

  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  });

  const [showFilingDialog, setShowFilingDialog] = useState(false);
  const [filingStep, setFilingStep] = useState(0);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('conservative');

  // Enhanced mock data for tax lots with strategies
  const taxLots: TaxLot[] = [
    {
      id: 1,
      symbol: "BTC",
      quantity: 0.5,
      costBasis: 35000,
      acquiredDate: new Date(2023, 3, 15),
      currentValue: 42500,
      gainLoss: 3750,
      gainLossPercent: 21.4,
      taxStatus: "long-term",
      harvestOpportunity: false,
      strategy: "Aggressive Growth"
    },
    {
      id: 2,
      symbol: "ETH",
      quantity: 10,
      costBasis: 2800,
      acquiredDate: new Date(2023, 8, 10),
      currentValue: 2400,
      gainLoss: -4000,
      gainLossPercent: -14.3,
      taxStatus: "short-term",
      harvestOpportunity: true,
      strategy: "Balanced Momentum"
    },
    {
      id: 3,
      symbol: "SOL",
      quantity: 100,
      costBasis: 85,
      acquiredDate: new Date(2022, 8, 5),
      currentValue: 125,
      gainLoss: 4000,
      gainLossPercent: 47.1,
      taxStatus: "long-term",
      harvestOpportunity: false,
      strategy: "Conservative DCA"
    },
    {
      id: 4,
      symbol: "ADA",
      quantity: 5000,
      costBasis: 0.65,
      acquiredDate: new Date(2022, 5, 22),
      currentValue: 0.85,
      gainLoss: 1000,
      gainLossPercent: 30.8,
      taxStatus: "long-term",
      harvestOpportunity: false,
      strategy: "Manual"
    },
    {
      id: 5,
      symbol: "DOT",
      quantity: 250,
      costBasis: 12.5,
      acquiredDate: new Date(2023, 7, 8),
      currentValue: 9.8,
      gainLoss: -675,
      gainLossPercent: -21.6,
      taxStatus: "short-term",
      harvestOpportunity: true,
      strategy: "Aggressive Growth"
    }
  ];

  // Tax summary calculation
  const selectedJurisdiction = taxJurisdictions.find(j => j.value === taxSettings.taxJurisdiction)!;
  const taxSummary = {
    totalGainLoss: taxLots.reduce((sum, lot) => sum + lot.gainLoss, 0),
    shortTermGainLoss: taxLots
      .filter(lot => lot.taxStatus === "short-term")
      .reduce((sum, lot) => sum + lot.gainLoss, 0),
    longTermGainLoss: taxLots
      .filter(lot => lot.taxStatus === "long-term")
      .reduce((sum, lot) => sum + lot.gainLoss, 0),
    harvestOpportunities: taxLots.filter(lot => lot.harvestOpportunity).length,
    potentialHarvestAmount: taxLots
      .filter(lot => lot.harvestOpportunity)
      .reduce((sum, lot) => sum + Math.abs(lot.gainLoss), 0),
    estimatedTaxOwed: 0
  };

  // Calculate estimated tax owed
  taxSummary.estimatedTaxOwed = Math.max(0, (
    taxSummary.shortTermGainLoss * selectedJurisdiction.rate +
    taxSummary.longTermGainLoss * (selectedJurisdiction.rate * 0.5)
  ));

  // Generate optimization scenarios
  const optimizationScenarios: OptimizationScenario[] = [
    {
      name: "Tax Loss Harvesting",
      description: "Realize losses to offset gains and reduce tax liability",
      strategy: "Sell losing positions before year-end",
      estimatedSavings: taxSummary.potentialHarvestAmount * selectedJurisdiction.rate,
      riskLevel: 'low',
      timeHorizon: 'Short-term (< 1 year)'
    },
    {
      name: "Long-term Hold Strategy",
      description: "Hold positions over 1 year to qualify for reduced capital gains rates",
      strategy: "Delay sales until long-term status",
      estimatedSavings: taxSummary.shortTermGainLoss * selectedJurisdiction.rate * 0.5,
      riskLevel: 'medium',
      timeHorizon: 'Medium-term (1-2 years)'
    },
    {
      name: "Offsetting Strategy",
      description: "Balance gains and losses within the same tax year",
      strategy: "Strategic timing of buy/sell orders",
      estimatedSavings: Math.abs(taxSummary.shortTermGainLoss) * 0.3,
      riskLevel: 'medium',
      timeHorizon: 'Short-term (< 1 year)'
    },
    {
      name: "FIFO vs LIFO Optimization",
      description: "Choose optimal cost basis method for current market conditions",
      strategy: "Switch between FIFO and LIFO based on market trends",
      estimatedSavings: 850,
      riskLevel: 'low',
      timeHorizon: 'Ongoing'
    }
  ];

  // Generate disposal strategies
  const disposalStrategies: DisposalStrategy[] = [
    {
      asset: "ETH",
      action: "sell",
      timing: "Before year-end",
      taxImpact: -4000 * selectedJurisdiction.rate,
      recommendation: "Harvest loss to offset other gains",
      confidence: 85
    },
    {
      asset: "DOT", 
      action: "sell",
      timing: "Before year-end",
      taxImpact: -675 * selectedJurisdiction.rate,
      recommendation: "Harvest loss for tax benefit",
      confidence: 78
    },
    {
      asset: "BTC",
      action: "hold",
      timing: "Continue holding",
      taxImpact: 0,
      recommendation: "Strong long-term performer, maintain position",
      confidence: 92
    },
    {
      asset: "SOL",
      action: "hold",
      timing: "Consider partial profit-taking",
      taxImpact: 2000 * selectedJurisdiction.rate * 0.5,
      recommendation: "Take some profits while maintaining core position",
      confidence: 76
    }
  ];

  // Chart data
  const ytdDataByMonth = [
    { name: "Jan", realized: 0, unrealized: 500 },
    { name: "Feb", realized: 200, unrealized: 800 },
    { name: "Mar", realized: 150, unrealized: 1200 },
    { name: "Apr", realized: 300, unrealized: 900 },
    { name: "May", realized: 250, unrealized: 1500 },
    { name: "Jun", realized: 400, unrealized: 1100 },
    { name: "Jul", realized: 600, unrealized: 1800 },
    { name: "Aug", realized: 350, unrealized: 1400 },
    { name: "Sep", realized: 500, unrealized: 2000 },
    { name: "Oct", realized: 450, unrealized: 1600 },
    { name: "Nov", realized: 700, unrealized: 2200 },
    { name: "Dec", realized: 800, unrealized: 1900 }
  ];

  const assetCategoryData = [
    { name: "Crypto", shortTerm: taxSummary.shortTermGainLoss, longTerm: taxSummary.longTermGainLoss },
    { name: "Stocks", shortTerm: 500, longTerm: 1200 },
    { name: "Options", shortTerm: -200, longTerm: 300 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value).replace('$', selectedJurisdiction.symbol);
  };

  const handleTaxSettingChange = (setting: string, value: any) => {
    setTaxSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const generateTaxReport = () => {
    toast({
      title: "Generating comprehensive tax report",
      description: "This may take a few moments...",
    });
    
    setTimeout(() => {
      toast({
        title: "Tax report generated successfully",
        description: "Your tax optimization report is ready for download.",
      });
    }, 2000);
  };

  const handleFileTax = () => {
    setShowFilingDialog(true);
    setFilingStep(0);
  };

  const handleSubmitTaxReturn = () => {
    setSubmissionInProgress(true);
    
    setTimeout(() => {
      setSubmissionInProgress(false);
      setShowFilingDialog(false);
      toast({
        title: "Tax return submitted successfully",
        description: "Your tax return has been filed with the relevant authorities.",
      });
    }, 3000);
  };

  const runTaxHarvesting = () => {
    toast({
      title: "Running tax loss harvesting analysis",
      description: "Analyzing your portfolio for optimal tax loss harvesting opportunities...",
    });
    
    setTimeout(() => {
      toast({
        title: "Tax harvesting complete",
        description: `Found ${taxSummary.harvestOpportunities} opportunities with potential savings of ${formatCurrency(taxSummary.potentialHarvestAmount * selectedJurisdiction.rate)}.`,
      });
    }, 2000);
  };

  const executeStrategy = (strategyName: string) => {
    toast({
      title: `Executing ${strategyName}`,
      description: "Implementing your selected tax optimization strategy...",
    });
    
    setTimeout(() => {
      toast({
        title: "Strategy executed successfully",
        description: `${strategyName} has been implemented for your portfolio.`,
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tax Overview</TabsTrigger>
          <TabsTrigger value="scenarios">Planning Scenarios</TabsTrigger>
          <TabsTrigger value="optimization">Disposal Strategy</TabsTrigger>
          <TabsTrigger value="lots">Tax Lots</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* TAX OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Gain/Loss</CardTitle>
                <CardDescription>Year to date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", taxSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(taxSummary.totalGainLoss)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  From {taxLots.length} positions
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Short-Term G/L</CardTitle>
                <CardDescription>Held &lt; 1 year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", taxSummary.shortTermGainLoss >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(taxSummary.shortTermGainLoss)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Higher tax rate ({(selectedJurisdiction.rate * 100).toFixed(0)}%)
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Long-Term G/L</CardTitle>
                <CardDescription>Held ≥ 1 year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", taxSummary.longTermGainLoss >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(taxSummary.longTermGainLoss)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Lower tax rate ({(selectedJurisdiction.rate * 50).toFixed(0)}%)
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Est. Tax Owed</CardTitle>
                <CardDescription>Based on current gains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(taxSummary.estimatedTaxOwed)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {taxSummary.harvestOpportunities} harvest opportunities
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Year-to-Date Performance</CardTitle>
                <CardDescription>Realized and unrealized gains/losses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={ytdDataByMonth}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${selectedJurisdiction.symbol}${(value/1000).toFixed(1)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="unrealized" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                        name="Unrealized"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="realized" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                        name="Realized"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-3">
                <Button variant="outline" className="ml-auto" onClick={generateTaxReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tax Loss Harvesting Opportunities</CardTitle>
                <CardDescription>Potential tax savings from loss harvesting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxLots.filter(lot => lot.harvestOpportunity).map(lot => (
                    <div key={lot.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div>
                        <div className="font-medium">{lot.symbol}</div>
                        <div className="text-sm text-gray-600">
                          {lot.gainLossPercent.toFixed(1)}% loss • {lot.taxStatus}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-red-600">
                          {formatCurrency(lot.gainLoss)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Tax savings: {formatCurrency(Math.abs(lot.gainLoss) * selectedJurisdiction.rate)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={runTaxHarvesting} className="w-full mt-4">
                    <Scissors className="mr-2 h-4 w-4" />
                    Execute Tax Loss Harvesting
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PLANNING SCENARIOS TAB */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Planning Scenarios</CardTitle>
              <CardDescription>Compare different strategies to optimize your tax outcome</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {optimizationScenarios.map((scenario, index) => (
                  <Card key={index} className={cn(
                    "cursor-pointer transition-all",
                    selectedScenario === scenario.name.toLowerCase().replace(/\s+/g, '-') 
                      ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "hover:shadow-md"
                  )}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <Badge variant={
                          scenario.riskLevel === 'low' ? 'default' : 
                          scenario.riskLevel === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {scenario.riskLevel} risk
                        </Badge>
                      </div>
                      <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Strategy:</span>
                          <span className="text-sm font-medium">{scenario.strategy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Time Horizon:</span>
                          <span className="text-sm font-medium">{scenario.timeHorizon}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="font-medium">Estimated Savings:</span>
                          <span className="font-bold text-green-600">{formatCurrency(scenario.estimatedSavings)}</span>
                        </div>
                        <Button 
                          onClick={() => executeStrategy(scenario.name)} 
                          className="w-full mt-3"
                          variant={selectedScenario === scenario.name.toLowerCase().replace(/\s+/g, '-') ? 'default' : 'outline'}
                        >
                          {selectedScenario === scenario.name.toLowerCase().replace(/\s+/g, '-') ? 'Selected Strategy' : 'Select Strategy'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DISPOSAL STRATEGY TAB */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Disposal Strategy</CardTitle>
              <CardDescription>AI-powered recommendations for optimal buy/sell timing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {disposalStrategies.map((strategy, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium text-lg">{strategy.asset}</div>
                        <Badge variant={strategy.action === 'sell' ? 'destructive' : 'default'}>
                          {strategy.action.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-gray-600">{strategy.timing}</div>
                      </div>
                      <div className="text-right">
                        <div className={cn("font-medium", strategy.taxImpact >= 0 ? "text-red-600" : "text-green-600")}>
                          Tax Impact: {formatCurrency(strategy.taxImpact)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Confidence: {strategy.confidence}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{strategy.recommendation}</p>
                        <Progress value={strategy.confidence} className="mt-2 h-2" />
                      </div>
                      <Button size="sm" className="ml-4">
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAX LOTS TAB */}
        <TabsContent value="lots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Lot Analysis</CardTitle>
              <CardDescription>Detailed view of all your positions and their tax implications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Asset</th>
                      <th className="text-right py-3 px-2">Quantity</th>
                      <th className="text-right py-3 px-2">Cost Basis</th>
                      <th className="text-right py-3 px-2">Current Value</th>
                      <th className="text-right py-3 px-2">Gain/Loss</th>
                      <th className="text-right py-3 px-2">%</th>
                      <th className="text-center py-3 px-2">Tax Status</th>
                      <th className="text-center py-3 px-2">Strategy</th>
                      <th className="text-center py-3 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxLots.map((lot) => (
                      <tr key={lot.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-2 font-medium">{lot.symbol}</td>
                        <td className="text-right py-3 px-2">{lot.quantity}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(lot.costBasis)}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(lot.currentValue)}</td>
                        <td className={cn("text-right py-3 px-2 font-medium", lot.gainLoss >= 0 ? "text-green-600" : "text-red-600")}>
                          {lot.gainLoss >= 0 ? '+' : ''}{formatCurrency(lot.gainLoss)}
                        </td>
                        <td className={cn("text-right py-3 px-2", lot.gainLossPercent >= 0 ? "text-green-600" : "text-red-600")}>
                          {lot.gainLossPercent >= 0 ? '+' : ''}{lot.gainLossPercent.toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant={lot.taxStatus === 'long-term' ? 'default' : 'secondary'}>
                            {lot.taxStatus}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant="outline" className="text-xs">
                            {lot.strategy}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          {lot.harvestOpportunity ? (
                            <Badge variant="destructive" className="text-xs">
                              <Scissors className="h-3 w-3 mr-1" />
                              Harvest
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Hold
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure your tax calculation preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tax-jurisdiction">Tax Jurisdiction</Label>
                    <Select 
                      value={taxSettings.taxJurisdiction} 
                      onValueChange={(value) => handleTaxSettingChange('taxJurisdiction', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select jurisdiction" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxJurisdictions.map((jurisdiction) => (
                          <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                            {jurisdiction.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tax-year">Tax Year</Label>
                    <Select 
                      value={taxSettings.taxYear} 
                      onValueChange={(value) => handleTaxSettingChange('taxYear', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select tax year" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxYears.map((year) => (
                          <SelectItem key={year.value} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tax-strategy">Cost Basis Method</Label>
                    <Select 
                      value={taxSettings.taxStrategy} 
                      onValueChange={(value) => handleTaxSettingChange('taxStrategy', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select cost basis method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                        <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                        <SelectItem value="hifo">HIFO (Highest In, First Out)</SelectItem>
                        <SelectItem value="specific-id">Specific ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Asset Types</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="crypto"
                          checked={taxSettings.includeCryptoAssets}
                          onCheckedChange={(checked) => handleTaxSettingChange('includeCryptoAssets', checked)}
                        />
                        <Label htmlFor="crypto">Include Cryptocurrency Assets</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="stocks"
                          checked={taxSettings.includeStocks}
                          onCheckedChange={(checked) => handleTaxSettingChange('includeStocks', checked)}
                        />
                        <Label htmlFor="stocks">Include Stock Assets</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="options"
                          checked={taxSettings.includeOptions}
                          onCheckedChange={(checked) => handleTaxSettingChange('includeOptions', checked)}
                        />
                        <Label htmlFor="options">Include Options Trading</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="harvesting"
                        checked={taxSettings.harvestingEnabled}
                        onCheckedChange={(checked) => handleTaxSettingChange('harvestingEnabled', checked)}
                      />
                      <Label htmlFor="harvesting">Enable Tax Loss Harvesting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="dual-residency"
                        checked={taxSettings.dualResidency}
                        onCheckedChange={(checked) => handleTaxSettingChange('dualResidency', checked)}
                      />
                      <Label htmlFor="dual-residency">Dual Tax Residency</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filing Dialog */}
      <Dialog open={showFilingDialog} onOpenChange={setShowFilingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>File Tax Return</DialogTitle>
            <DialogDescription>
              Submit your tax return directly through StackMotive
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!submissionInProgress ? (
              <div className="space-y-4">
                <div className="text-sm">
                  <strong>Tax Year:</strong> {taxSettings.taxYear}
                </div>
                <div className="text-sm">
                  <strong>Jurisdiction:</strong> {taxJurisdictions.find(j => j.value === taxSettings.taxJurisdiction)?.label}
                </div>
                <div className="text-sm">
                  <strong>Estimated Tax Owed:</strong> {formatCurrency(taxSummary.estimatedTaxOwed)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Submitting your tax return...</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilingDialog(false)} disabled={submissionInProgress}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTaxReturn} disabled={submissionInProgress}>
              {submissionInProgress ? 'Submitting...' : 'Submit Tax Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxOptimizer;