import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackLink } from '@/components/ui/back-link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  FileText,
  Download,
  Calculator,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  RefreshCw,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePaperTradingAccount } from '@/hooks/use-paper-trading';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { useSessionStore } from '../../store/session';
import { getFinancialYears, getTaxRules } from '../../utils/taxSchema';
import { transformTaxData } from '../../utils/taxTransform';
import { exportTaxReportToCSV } from '../../utils/taxExport';
import type { TaxJurisdiction, CostBasisMethod, TaxableEvent } from '../../types/tax';
import jsPDF from 'jspdf';
import { fetchTaxReport } from '../../api/tax';

// Enhanced interfaces for comprehensive tax reporting
interface TaxTransaction {
  id: string;
  date: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  totalValue: number;
  costBasis?: number;
  capitalGain?: number;
  gainType?: 'short' | 'long';
  holdingPeriod: number;
  strategy?: string;
  currency: string;
}

interface UnrealizedPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  holdingPeriod: number;
  currency: string;
}

interface TaxSummary {
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netCapitalGains: number;
  shortTermGains: number;
  longTermGains: number;
  totalFees: number;
  totalDividends: number;
  estimatedTaxOwed: number;
  taxableEvents: number;
  carryForwardLoss: number;
}

interface CostBasisDemo {
  date: string;
  fifoValue: number;
  lifoValue: number;
  fifoCostBasis: number;
  lifoCostBasis: number;
}

// Currency exchange rates (mock)
const currencyRates = {
  NZD: { symbol: '$', rate: 1, name: 'New Zealand' },
  AUD: { symbol: 'A$', rate: 0.93, name: 'Australia' },
  USD: { symbol: '$', rate: 0.64, name: 'United States' }
} as const;

type Currency = keyof typeof currencyRates;

const TaxReportsPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>(`${new Date().getFullYear()}`);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('NZD');
  const [costBasisMethod, setCostBasisMethod] = useState<'fifo' | 'lifo'>('fifo');
  const [activeTab, setActiveTab] = useState('realized');
  const user = useSessionStore(s => s.user);
  const jurisdiction: TaxJurisdiction = user?.jurisdiction || 'NZ';
  const isPremium = user?.isPremium;
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Paper trading integration
  const { data: paperTradingAccount, isLoading: isLoadingPaperAccount } = usePaperTradingAccount();
  
  // Mock data states
  // const [realizedTransactions] = useState(() => generateMockRealizedTransactions(selectedCurrency));
  // const [unrealizedPositions] = useState(() => generateMockUnrealizedPositions(selectedCurrency));
  // const [costBasisDemo] = useState(() => generateCostBasisDemo());
  
  // Calculate tax summary
  const { data: taxReport, isLoading, error } = useQuery([
    'taxReport',
    selectedYear,
    selectedCurrency
  ], () => fetchTaxReport(selectedYear, selectedCurrency));

  if (isLoading) return <div>Loading tax report...</div>;
  if (error) return <div>Error loading tax report.</div>;
  if (!taxReport || !taxReport.transactions || taxReport.transactions.length === 0) {
    return <div className="p-4 bg-yellow-100 text-yellow-900 rounded">No real transaction data available for this tax year. Please sync your portfolio or import your trade history to generate a compliant tax report. Export is disabled.</div>;
  }

  // All calculations and exports now use taxReport.transactions and taxReport.summary
  const sellTransactions = taxReport.transactions.filter((t: any) => t.type === 'sell');
  const taxSummary = taxReport.summary;
  
  // Calculate estimated tax (simplified)
  const taxRate = selectedCurrency === 'NZD' ? 0.28 : selectedCurrency === 'AUD' ? 0.30 : 0.25;
  taxSummary.estimatedTaxOwed = Math.max(0, taxSummary.netCapitalGains * taxRate);
  
  const formatCurrency = (value: number) => {
    const currencyInfo = currencyRates[selectedCurrency as Currency];
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
    }).format(value * currencyInfo.rate).replace(/\$/, currencyInfo.symbol);
  };

  const getTaxYear = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  };

  // Export functions
  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Symbol', 'Type', 'Quantity', 'Price', 'Total Value', 'Capital Gain', 'Holding Period', 'Gain Type'],
      ...sellTransactions.map(t => [
        t.date,
        t.symbol,
        t.type,
        t.quantity.toString(),
        formatCurrency(t.price),
        formatCurrency(t.totalValue),
        formatCurrency(t.capitalGain || 0),
        `${t.holdingPeriod} days`,
        t.gainType || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax_report_${selectedYear}_${selectedCurrency}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Tax Report Exported",
      description: `Tax report for ${selectedYear} has been downloaded as CSV.`,
    });
  };

  const handleExportIR3 = () => {
    // Mock IR3 export
    const ir3Content = [
      ['Field', 'Value'],
      ['Tax Year', selectedYear],
      ['Currency', selectedCurrency],
      ['Total Capital Gains', formatCurrency(taxSummary.totalRealizedGains)],
      ['Total Capital Losses', formatCurrency(taxSummary.totalRealizedLosses)],
      ['Net Capital Gains', formatCurrency(taxSummary.netCapitalGains)],
      ['Short-term Gains', formatCurrency(taxSummary.shortTermGains)],
      ['Long-term Gains', formatCurrency(taxSummary.longTermGains)],
      ['Estimated Tax Owed', formatCurrency(taxSummary.estimatedTaxOwed)]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([ir3Content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IR3_${selectedYear}_${selectedCurrency}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "IR3 Export Complete",
      description: `IR3 form data for ${selectedYear} has been exported.`,
    });
  };

  const handleGeneratePDF = () => {
    if (!taxReport || !taxReport.transactions || taxReport.transactions.length === 0) {
      toast({
        title: "PDF Export Blocked",
        description: "No real transaction data available. Please sync your portfolio or import your trade history.",
        variant: "destructive",
      });
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Annual Tax Filing Report', 14, 18);
    doc.setFontSize(12);
    doc.text(`Jurisdiction: ${taxReport.country}`, 14, 28);
    doc.text(`Tax Year: ${taxReport.taxYear}`, 14, 36);
    doc.text(`Report Type: ${taxReport.reportType}`, 14, 44);
    doc.text(`Generated: ${new Date(taxReport.generatedAt).toLocaleString()}`, 14, 52);
    doc.text('Summary:', 14, 62);
    doc.text(`  - Net Capital Gains: ${taxSummary.net_capital_gains}`, 14, 70);
    doc.text(`  - Short-term Gains: ${taxSummary.short_term_gains}`, 14, 78);
    doc.text(`  - Long-term Gains: ${taxSummary.long_term_gains}`, 14, 86);
    doc.text(`  - Dividends: ${taxSummary.total_dividends}`, 14, 94);
    doc.text(`  - Interest Income: ${taxSummary.total_interest || 0}`, 14, 102);
    doc.text(`  - FX Gains: ${taxSummary.total_fx_gains || 0}`, 14, 110);
    doc.text(`  - Estimated Tax Owed: ${taxSummary.estimated_tax_owed}`, 14, 118);
    doc.text('Breakdown:', 14, 130);
    let y = 138;
    doc.setFontSize(10);
    doc.text('Date      Symbol   Type   Qty   Price   Gain   Term', 14, y);
    y += 8;
    taxReport.transactions.slice(0, 30).forEach((t: any) => {
      const date = t.date || '';
      const symbol = t.symbol || '';
      const type = t.type || '';
      const quantity = t.quantity !== undefined ? t.quantity.toString() : '';
      const price = t.price !== undefined ? t.price.toString() : '';
      const gain = t.capital_gain !== undefined ? t.capital_gain.toString() : '';
      const term = t.gain_type || '';
      // Pad fields for alignment
      const row = `${date.padEnd(10)} ${symbol.padEnd(8)} ${type.padEnd(6)} ${quantity.padEnd(6)} ${price.padEnd(8)} ${gain.padEnd(8)} ${term}`;
      doc.text(row, 14, y);
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`tax_report_${taxReport.taxYear}_${taxReport.country}.pdf`);
    toast({
      title: "PDF Report Exported",
      description: `Tax report for ${taxReport.taxYear} has been downloaded as PDF.",
    });
  };

  const formatYAxisTick = (value: number) => {
    const symbol = currencyRates[selectedCurrency as Currency].symbol;
    const displayValue = (value / 1000).toFixed(0);
    return symbol + displayValue + 'k';
  };

  // Add debug logging
  useEffect(() => {
    console.log("💰 TAX REPORTS PAGE LOADED");
  }, []);

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Tax Reporting (Premium Only)</h1>
        <p className="mb-4">Upgrade to unlock end-of-year tax reports for your jurisdiction.</p>
        <button className="btn btn-primary" onClick={() => setShowUpgrade(true)}>Upgrade Now</button>
        {showUpgrade && <div className="mt-4 p-4 bg-yellow-100 rounded">Upgrade flow goes here.</div>}
      </div>
    );
  }

  return (
    <div className='p-4'>
      <BackLink href="/reports">← Back to Reports</BackLink>
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Tax Reports & Optimization</h1>
          <p className="text-muted-foreground">
            Comprehensive tax analysis and capital gains tracking
            {!isLoadingPaperAccount && paperTradingAccount && (
              <span className="ml-2 text-blue-600 font-medium">
                • Connected to {paperTradingAccount.name}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCurrency} onValueChange={(value: Currency) => setSelectedCurrency(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NZD">🇳🇿 NZD</SelectItem>
              <SelectItem value="AUD">🇦🇺 AUD</SelectItem>
              <SelectItem value="USD">🇺🇸 USD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getTaxYear().map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportIR3}>
            <Download className="h-4 w-4 mr-2" />
            Export IR3
          </Button>
        </div>
      </div>

      {/* Currency Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                {currencyRates[selectedCurrency as Currency].name} Tax Information
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Tax Year: {selectedYear} • 
                Capital Gains Rate: {(taxRate * 100).toFixed(0)}% • 
                Currency: {selectedCurrency} • 
                Method: {costBasisMethod.toUpperCase()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxable Gain</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", taxSummary.netCapitalGains >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(taxSummary.netCapitalGains)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {taxSummary.taxableEvents} taxable events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Est. Tax Due</CardTitle>
            <Calculator className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(taxSummary.estimatedTaxOwed)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(taxRate * 100).toFixed(0)}% rate applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Long-term Gains</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(taxSummary.longTermGains)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              &gt;365 day holdings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Year Selected</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedYear}</div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedCurrency} currency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Basis Method Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cost Basis Method
          </CardTitle>
          <CardDescription>Choose your cost basis calculation method for tax optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={costBasisMethod === 'fifo'}
                onCheckedChange={(checked) => setCostBasisMethod(checked ? 'fifo' : 'lifo')}
              />
              <Label>FIFO (First In, First Out)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={costBasisMethod === 'lifo'}
                onCheckedChange={(checked) => setCostBasisMethod(checked ? 'lifo' : 'fifo')}
              />
              <Label>LIFO (Last In, First Out)</Label>
            </div>
            <div className="text-sm text-gray-600">
              Current method: <span className="font-medium">{costBasisMethod.toUpperCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realized">Realized Gains</TabsTrigger>
          <TabsTrigger value="unrealized">Unrealized Gains</TabsTrigger>
          <TabsTrigger value="demo">Cost Basis Demo</TabsTrigger>
          <TabsTrigger value="summary">Tax Summary</TabsTrigger>
        </TabsList>

        {/* Realized Gains Tab */}
        <TabsContent value="realized">
          <Card>
            <CardHeader>
              <CardTitle>Realized Capital Gains & Losses</CardTitle>
              <CardDescription>Closed trades with tax implications for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">Cost Basis</TableHead>
                    <TableHead className="text-right">Capital Gain</TableHead>
                    <TableHead className="text-right">Holding Period</TableHead>
                    <TableHead>Gain Type</TableHead>
                    <TableHead>Strategy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellTransactions.slice(0, 15).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.symbol}</TableCell>
                      <TableCell className="text-right">{transaction.quantity.toFixed(6)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.costBasis || 0)}</TableCell>
                      <TableCell className={cn("text-right font-medium", (transaction.capitalGain || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                        {(transaction.capitalGain || 0) >= 0 ? '+' : ''}{formatCurrency(transaction.capitalGain || 0)}
                      </TableCell>
                      <TableCell className="text-right">{transaction.holdingPeriod} days</TableCell>
                      <TableCell>
                        <Badge variant={transaction.gainType === 'long' ? 'default' : 'secondary'}>
                          {transaction.gainType?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.strategy}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unrealized Gains Tab */}
        <TabsContent value="unrealized">
          <Card>
            <CardHeader>
              <CardTitle>Unrealized Capital Gains & Losses</CardTitle>
              <CardDescription>Open positions with current market values</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Cost Basis</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Unrealized Gain</TableHead>
                    <TableHead className="text-right">Gain %</TableHead>
                    <TableHead className="text-right">Holding Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxReport.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.symbol}</TableCell>
                      <TableCell className="text-right">{transaction.quantity.toFixed(6)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.costBasis || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.price)}</TableCell>
                      <TableCell className={cn("text-right font-medium", transaction.capitalGain >= 0 ? "text-green-600" : "text-red-600")}>
                        {transaction.capitalGain >= 0 ? '+' : ''}{formatCurrency(transaction.capitalGain || 0)}
                      </TableCell>
                      <TableCell className={cn("text-right", transaction.capitalGain >= 0 ? "text-green-600" : "text-red-600")}>
                        {transaction.capitalGain >= 0 ? '+' : ''}{transaction.capitalGainPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">{transaction.holdingPeriod} days</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Basis Demo Tab */}
        <TabsContent value="demo">
          <Card>
            <CardHeader>
              <CardTitle>FIFO vs LIFO Cost Basis Visualization</CardTitle>
              <CardDescription>Compare cost basis methods and their impact on tax efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={taxReport.transactions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tickFormatter={formatYAxisTick} />
                    <RechartsTooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="costBasis" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Cost Basis"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="marketValue" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Market Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium text-blue-600 mb-2">FIFO (First In, First Out)</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Uses the cost of the earliest purchased assets when calculating gains/losses.
                  </p>
                  <div className="text-sm">
                    <div>Tax Efficiency: <span className="font-medium">Lower in bull markets</span></div>
                    <div>Best For: <span className="font-medium">Stable/bear markets</span></div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-red-600 mb-2">LIFO (Last In, First Out)</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Uses the cost of the most recently purchased assets when calculating gains/losses.
                  </p>
                  <div className="text-sm">
                    <div>Tax Efficiency: <span className="font-medium">Higher in bull markets</span></div>
                    <div>Best For: <span className="font-medium">Rising markets</span></div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Summary Tab */}
        <TabsContent value="summary">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capital Gains Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Realized Gains:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(taxSummary.totalRealizedGains)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Realized Losses:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(taxSummary.totalRealizedLosses)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Capital Gains:</span>
                    <span className={cn("font-bold", taxSummary.netCapitalGains >= 0 ? "text-green-600" : "text-red-600")}>
                      {formatCurrency(taxSummary.netCapitalGains)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tax Calculations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Short-term Gains:</span>
                    <span className="font-medium">{formatCurrency(taxSummary.shortTermGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long-term Gains:</span>
                    <span className="font-medium">{formatCurrency(taxSummary.longTermGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fees:</span>
                    <span className="font-medium">{formatCurrency(taxSummary.totalFees)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Estimated Tax Owed:</span>
                    <span className="font-bold text-yellow-600">
                      {formatCurrency(taxSummary.estimatedTaxOwed)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download your tax reports in various formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportIR3} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Export IR3 Data
                  </Button>
                  <Button onClick={handleGeneratePDF} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxReportsPage; 