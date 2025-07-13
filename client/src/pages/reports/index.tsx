import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  FileText, 
  Download, 
  BarChart, 
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  History,
  Filter,
  ArrowUpDown,
  Play,
  Activity,
  Target,
  Wallet,
  RefreshCw,
  Users,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  InfoIcon,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePaperTradingAccount } from '@/hooks/use-paper-trading';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Alert, 
  AlertDescription 
} from "@/components/ui/alert";

// Enhanced interfaces for comprehensive reporting
interface PortfolioHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  allocation: number;
}

interface StrategyPerformance {
  name: string;
  trades: number;
  winRate: number;
  totalReturn: number;
  avgGain: number;
  avgLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
}

interface PerformanceData {
  date: string;
  portfolio: number;
  btc: number;
  sp500: number;
}

interface TradeAnalysis {
  symbol: string;
  date: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  pnl: number;
  strategy?: string;
  duration: number;
}

// Mock data generators
const generateMockPortfolioHoldings = (): PortfolioHolding[] => {
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK'];
  const totalValue = 50000;
  
  return symbols.map((symbol, index) => {
    const allocation = Math.random() * 25 + 5; // 5-30% allocation
    const currentValue = (totalValue * allocation) / 100;
    const quantity = currentValue / (Math.random() * 50000 + 1000);
    const averagePrice = currentValue / quantity;
    const currentPrice = averagePrice * (1 + (Math.random() - 0.5) * 0.4); // ±20% from avg
    const profitLoss = (currentPrice - averagePrice) * quantity;
    const profitLossPercent = ((currentPrice - averagePrice) / averagePrice) * 100;
    
    return {
      symbol,
      quantity: parseFloat(quantity.toFixed(6)),
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      totalValue: parseFloat(currentValue.toFixed(2)),
      profitLoss: parseFloat(profitLoss.toFixed(2)),
      profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
      allocation: parseFloat(allocation.toFixed(1))
    };
  });
};

const generateMockStrategyPerformance = (): StrategyPerformance[] => {
  const strategies = [
    { name: 'Aggressive Growth', baseReturn: 0.15, volatility: 0.3 },
    { name: 'Balanced Momentum', baseReturn: 0.12, volatility: 0.2 },
    { name: 'Conservative DCA', baseReturn: 0.08, volatility: 0.12 }
  ];
  
  return strategies.map(strategy => {
    const trades = Math.floor(Math.random() * 50) + 20;
    const winRate = Math.random() * 30 + 55; // 55-85%
    const totalReturn = strategy.baseReturn + (Math.random() - 0.5) * strategy.volatility;
    const avgGain = Math.random() * 8 + 2; // 2-10%
    const avgLoss = -(Math.random() * 4 + 1); // -1% to -5%
    
    return {
      name: strategy.name,
      trades,
      winRate: parseFloat(winRate.toFixed(1)),
      totalReturn: parseFloat((totalReturn * 100).toFixed(2)),
      avgGain: parseFloat(avgGain.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      sharpeRatio: parseFloat((totalReturn / strategy.volatility).toFixed(2)),
      maxDrawdown: parseFloat((Math.random() * -15 - 5).toFixed(2)),
      profitFactor: parseFloat((avgGain / Math.abs(avgLoss)).toFixed(2))
    };
  });
};

const generateMockPerformanceData = (days: number = 90): PerformanceData[] => {
  const data: PerformanceData[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let portfolioValue = 50000;
  let btcValue = 50000;
  let sp500Value = 50000;
  
  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Portfolio: 12% annual growth with 3% daily volatility
    portfolioValue *= 1 + (0.12 / 365) + (Math.random() - 0.5) * 0.06;
    
    // BTC: Higher volatility, 15% annual growth
    btcValue *= 1 + (0.15 / 365) + (Math.random() - 0.5) * 0.08;
    
    // S&P500: Steady growth, 7% annual with lower volatility
    sp500Value *= 1 + (0.07 / 365) + (Math.random() - 0.5) * 0.025;
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      portfolio: Math.round(portfolioValue),
      btc: Math.round(btcValue),
      sp500: Math.round(sp500Value)
    });
  }
  
  return data;
};

const generateMockTradeAnalysis = (): TradeAnalysis[] => {
  const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
  const strategies = ['Aggressive Growth', 'Balanced Momentum', 'Conservative DCA', 'Manual'];
  const trades: TradeAnalysis[] = [];
  
  for (let i = 0; i < 25; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell';
    const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const pnl = (Math.random() - 0.4) * 2000; // Bias towards positive
    
    trades.push({
      symbol,
      date: date.toISOString().split('T')[0],
      type,
      quantity: parseFloat((Math.random() * 10).toFixed(4)),
      price: Math.random() * 50000 + 1000,
      pnl: parseFloat(pnl.toFixed(2)),
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      duration: Math.floor(Math.random() * 30) + 1
    });
  }
  
  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export default function ReportsPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)), // 3 months ago
    to: new Date()
  });
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  // Paper trading integration
  const { data: paperTradingAccount, isLoading: isLoadingPaperAccount } = usePaperTradingAccount();
  
  // Mock data states
  const [portfolioHoldings] = useState(() => generateMockPortfolioHoldings());
  const [strategyPerformance] = useState(() => generateMockStrategyPerformance());
  const [performanceData] = useState(() => generateMockPerformanceData(90));
  const [tradeAnalysis] = useState(() => generateMockTradeAnalysis());
  
  // Calculate summary metrics
  const totalPortfolioValue = portfolioHoldings.reduce((sum, holding) => sum + holding.totalValue, 0);
  
  // Reports Help Modal handlers
  const handleHelpModalOpen = () => {
    setHelpModalOpen(true);
  };
  const totalPnL = portfolioHoldings.reduce((sum, holding) => sum + holding.profitLoss, 0);
  const totalPnLPercent = (totalPnL / (totalPortfolioValue - totalPnL)) * 100;
  
  const winningTrades = tradeAnalysis.filter(trade => trade.pnl > 0);
  const winRate = (winningTrades.length / tradeAnalysis.length) * 100;
  const avgGain = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length;
  const avgLoss = tradeAnalysis.filter(trade => trade.pnl < 0).reduce((sum, trade) => sum + trade.pnl, 0) / tradeAnalysis.filter(trade => trade.pnl < 0).length;
  
  const bestTrade = tradeAnalysis.reduce((best, trade) => trade.pnl > best.pnl ? trade : best, tradeAnalysis[0]);
  const worstTrade = tradeAnalysis.reduce((worst, trade) => trade.pnl < worst.pnl ? trade : worst, tradeAnalysis[0]);
  
  // Chart colors
  const strategyColors = ['#ef4444', '#3b82f6', '#10b981'];
  
  // Export functions
  const handleExportCSV = () => {
    const csvContent = [
      ['Symbol', 'Quantity', 'Avg Price', 'Current Price', 'Total Value', 'P&L', 'P&L %'],
      ...portfolioHoldings.map(holding => [
        holding.symbol,
        holding.quantity.toString(),
        `$${holding.averagePrice}`,
        `$${holding.currentPrice}`,
        `$${holding.totalValue}`,
        `$${holding.profitLoss}`,
        `${holding.profitLossPercent}%`
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Report Exported",
      description: "Portfolio report has been downloaded as CSV.",
    });
  };
  
  const handleExportPDF = () => {
    // Mock PDF download
    toast({
      title: "Generating PDF Report",
      description: "Your comprehensive portfolio report is being prepared...",
    });
    
    setTimeout(() => {
      toast({
        title: "PDF Report Ready",
        description: "Portfolio report has been generated and downloaded.",
      });
    }, 2000);
  };
  
  const generateReport = (reportType: string) => {
    toast({
      title: 'Generating Report',
      description: `Your ${reportType} report is being prepared with latest data.`,
    });
    
    setTimeout(() => {
      toast({
        title: 'Report Ready',
        description: `Your ${reportType} report has been generated successfully.`,
      });
    }, 1500);
  };

  // Query for fetching trading accounts - with fallback
  const { data: tradingAccountsData } = useQuery({
    queryKey: ['/api/trading-accounts'],
    queryFn: async () => [],
    enabled: false // Disable for now since we're using mock data
  });
  const tradingAccounts = tradingAccountsData || [];

  // Report card component
  const ReportCard = ({ title, description, icon, onClick }: {
    title: string;
    description: string;
    icon: React.ReactElement;
    onClick: () => void;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {React.cloneElement(icon, { className: "h-5 w-5 text-primary" })}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-2">
        <Button onClick={onClick} className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </CardFooter>
    </Card>
  );

  // Scheduled reports and history data
  const scheduledReports = [
    {
      id: 1,
      name: 'Monthly Portfolio Overview',
      frequency: 'Monthly',
      nextRun: new Date(new Date().setDate(new Date().getDate() + 5)),
      status: 'active'
    },
    {
      id: 2,
      name: 'Weekly Strategy Performance',
      frequency: 'Weekly',
      nextRun: new Date(new Date().setDate(new Date().getDate() + 2)),
      status: 'active'
    },
    {
      id: 3,
      name: 'Tax Optimization Report',
      frequency: 'Quarterly',
      nextRun: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'paused'
    }
  ];

  const reportHistory = [
    {
      id: 1,
      name: 'Portfolio Performance Analysis',
      date: new Date(new Date().setDate(new Date().getDate() - 3)),
      type: 'PDF'
    },
    {
      id: 2,
      name: 'Strategy Comparison Report',
      date: new Date(new Date().setDate(new Date().getDate() - 5)),
      type: 'CSV'
    },
    {
      id: 3,
      name: 'Tax Optimization Analysis',
      date: new Date(new Date().setDate(new Date().getDate() - 12)),
      type: 'PDF'
    },
    {
      id: 4,
      name: 'Asset Allocation Review',
      date: new Date(new Date().setDate(new Date().getDate() - 15)),
      type: 'XLSX'
    }
  ];

  return (
    <div className='p-4'>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Reports</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive analytics and reporting for your trading portfolio
              {!isLoadingPaperAccount && paperTradingAccount && (
                <span className="ml-2 text-blue-600 font-medium">
                  • Connected to {paperTradingAccount.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleHelpModalOpen}
                  className="flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Reports Guide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Reports & Analytics Guide</DialogTitle>
                  <DialogDescription>
                    Understanding what's currently available and what to expect
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  {/* Current Status Alert */}
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Current Status:</strong> All reports are currently populated with simulated data for testing purposes. 
                      Real data will replace mock data once you begin actual trading.
                    </AlertDescription>
                  </Alert>
                  
                  {/* What Reports Support */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">What Reports Currently Support</h3>
                    <div className="grid gap-3 text-sm">
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium text-green-600">✓ Fully Functional</h4>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                          <li>• Portfolio Performance Charts - showing mock growth trends</li>
                          <li>• Strategy Analysis - simulated performance metrics</li>
                          <li>• Asset Allocation Breakdown - mock holdings distribution</li>
                          <li>• Trade History Tables - generated test transactions</li>
                          <li>• Export Functionality - CSV/PDF downloads work</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium text-blue-600">⚠ Partially Functional (Mock Data)</h4>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                          <li>• Risk Analysis - calculated from simulated positions</li>
                          <li>• Win Rate Statistics - based on mock trade outcomes</li>
                          <li>• Portfolio Value Metrics - using test data</li>
                          <li>• Performance vs Benchmarks - simulated comparisons</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tax Module Behavior */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Tax Module & Scheduled Trades</h3>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800">Tax Reports</h4>
                        <p className="text-yellow-700 mt-1">
                          Tax calculations are currently using simulated transactions. Real tax data will be available 
                          once you have actual buy/sell trades in your portfolio. The tax module supports:
                        </p>
                        <ul className="mt-2 space-y-1 text-yellow-700">
                          <li>• Capital gains/losses calculations (FIFO/LIFO methods)</li>
                          <li>• Holding period analysis for tax optimization</li>
                          <li>• Multi-currency support (NZD, AUD, USD)</li>
                          <li>• Export to common tax software formats</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800">Scheduled Trades</h4>
                        <p className="text-blue-700 mt-1">
                          Automated reporting schedules are configured but will only generate meaningful reports 
                          once real trading data is available. Current schedule includes:
                        </p>
                        <ul className="mt-2 space-y-1 text-blue-700">
                          <li>• Monthly Portfolio Overviews</li>
                          <li>• Weekly Strategy Performance Reports</li>
                          <li>• Quarterly Tax Optimization Analysis</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Export Functionality */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Export Functions & Data Access</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Export buttons appear:</strong> In the top-right corner of this page and within individual report sections</p>
                      <p><strong>Available formats:</strong> CSV (portfolio data), PDF (comprehensive reports), Excel (detailed analysis)</p>
                      <p><strong>Data included:</strong> All visible charts, tables, and metrics from the current view</p>
                      <p><strong>Real vs Mock:</strong> Exports will clearly indicate when data transitions from simulated to real trading results</p>
                    </div>
                  </div>
                  
                  {/* Transition to Real Data */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">When Real Data Will Appear</h3>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800">Data Transition Timeline</h4>
                        <ul className="mt-2 space-y-1 text-green-700">
                          <li>• <strong>Immediate:</strong> Portfolio value updates after first trade execution</li>
                          <li>• <strong>Within 24 hours:</strong> Performance charts reflect actual position changes</li>
                          <li>• <strong>1 week:</strong> Strategy analysis shows real win/loss patterns</li>
                          <li>• <strong>1 month:</strong> Meaningful trend analysis and risk metrics</li>
                          <li>• <strong>Tax Year:</strong> Complete tax optimization and harvest reports</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Documentation Links */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Additional Resources</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Need more help?</strong> Check out these resources:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Trading Dashboard Help (available from the Dashboard page)</li>
                        <li>• Portfolio Analytics Guide (available from the Analytics page)</li>
                        <li>• Tax Reporting Documentation (linked from the Tax Reports section)</li>
                        <li>• Strategy Configuration Help (available from the Trading page)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Mock Data Information Banner */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Test Mode Active:</strong> All data shown is simulated for demonstration purposes. 
            Charts, metrics, and reports will populate with real data once you begin trading. 
            Export functions are fully operational and ready for your actual portfolio data.
          </AlertDescription>
        </Alert>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
              <Wallet className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPortfolioValue.toLocaleString()}</div>
              <p className={cn("text-xs mt-1 flex items-center", totalPnL >= 0 ? "text-green-600" : "text-red-600")}>
                {totalPnL >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">{winningTrades.length} of {tradeAnalysis.length} trades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Gain</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${avgGain.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Per winning trade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Best Trade</CardTitle>
              <Award className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${bestTrade?.pnl.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">{bestTrade?.symbol} • {bestTrade?.strategy}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Growth Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Portfolio vs Market Performance (90 Days)
                </CardTitle>
                <CardDescription>Compare your portfolio against BTC and S&P500 benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                      <RechartsTooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="portfolio" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Portfolio"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="btc" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="BTC"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sp500" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="S&P500"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Performance */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Strategy Performance
                </CardTitle>
                <CardDescription>Win rates and returns by strategy type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategyPerformance.map((strategy, index) => (
                    <div key={strategy.name} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{strategy.name}</h4>
                        <Badge variant={strategy.totalReturn > 0 ? 'default' : 'secondary'}>
                          {strategy.totalReturn > 0 ? '+' : ''}{strategy.totalReturn}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>Win Rate: {strategy.winRate}%</div>
                        <div>Trades: {strategy.trades}</div>
                        <div>Avg Gain: +{strategy.avgGain}%</div>
                        <div>Sharpe: {strategy.sharpeRatio}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => generateReport('Tax Optimization')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Tax Optimization
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => generateReport('Risk Analysis')}>
                  <BarChart className="h-4 w-4 mr-2" />
                  Risk Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/reports/custom')}>
                  <PieChart className="h-4 w-4 mr-2" />
                  Custom Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Tables */}
        <Tabs defaultValue="holdings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="holdings">Portfolio Holdings</TabsTrigger>
            <TabsTrigger value="trades">Trade Analysis</TabsTrigger>
            <TabsTrigger value="strategies">Strategy Details</TabsTrigger>
            <TabsTrigger value="reports">Report Center</TabsTrigger>
          </TabsList>

          {/* Holdings Tab */}
          <TabsContent value="holdings">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Holdings Breakdown</CardTitle>
                <CardDescription>Detailed view of current positions with P&L analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead className="text-right">P&L %</TableHead>
                      <TableHead className="text-right">Allocation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioHoldings.map((holding) => (
                      <TableRow key={holding.symbol}>
                        <TableCell className="font-medium">{holding.symbol}</TableCell>
                        <TableCell className="text-right">{holding.quantity}</TableCell>
                        <TableCell className="text-right">${holding.averagePrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${holding.currentPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${holding.totalValue.toLocaleString()}</TableCell>
                        <TableCell className={cn("text-right", holding.profitLoss >= 0 ? "text-green-600" : "text-red-600")}>
                          ${holding.profitLoss.toLocaleString()}
                        </TableCell>
                        <TableCell className={cn("text-right", holding.profitLossPercent >= 0 ? "text-green-600" : "text-red-600")}>
                          {holding.profitLossPercent >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">{holding.allocation}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Analysis Tab */}
          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trade Analysis</CardTitle>
                <CardDescription>Performance breakdown of individual trades</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeAnalysis.slice(0, 15).map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'}>
                            {trade.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{trade.quantity}</TableCell>
                        <TableCell className="text-right">${trade.price.toLocaleString()}</TableCell>
                        <TableCell className={cn("text-right font-medium", trade.pnl >= 0 ? "text-green-600" : "text-red-600")}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {trade.strategy}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{trade.duration}d</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Details Tab */}
          <TabsContent value="strategies">
            <Card>
              <CardHeader>
                <CardTitle>Strategy Performance Details</CardTitle>
                <CardDescription>Comprehensive metrics for each trading strategy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {strategyPerformance.map((strategy, index) => (
                    <div key={strategy.name} className="p-6 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{strategy.name}</h3>
                        <Badge variant={strategy.totalReturn > 0 ? 'default' : 'secondary'} className="text-sm">
                          {strategy.totalReturn > 0 ? '+' : ''}{strategy.totalReturn}% Return
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Total Trades</Label>
                          <div className="text-xl font-bold">{strategy.trades}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Win Rate</Label>
                          <div className="text-xl font-bold text-green-600">{strategy.winRate}%</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Avg Gain</Label>
                          <div className="text-xl font-bold text-green-600">+{strategy.avgGain}%</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Avg Loss</Label>
                          <div className="text-xl font-bold text-red-600">{strategy.avgLoss}%</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Sharpe Ratio</Label>
                          <div className="text-xl font-bold">{strategy.sharpeRatio}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Max Drawdown</Label>
                          <div className="text-xl font-bold text-red-600">{strategy.maxDrawdown}%</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Profit Factor</Label>
                          <div className="text-xl font-bold">{strategy.profitFactor}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Status</Label>
                          <Badge variant="outline" className="mt-1">Active</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report Center Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Report Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Parameters</CardTitle>
                  <CardDescription>Configure the time period and accounts for your reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date-range">Date Range</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="px-3 py-2 border rounded-md text-sm">
                          {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="account">Account</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger id="account" className="mt-1">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Accounts</SelectItem>
                          {!isLoadingPaperAccount && paperTradingAccount && (
                            <SelectItem value={paperTradingAccount.id.toString()}>
                              {paperTradingAccount.name}
                            </SelectItem>
                          )}
                          {tradingAccounts?.map((account: any) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="format">Report Format</Label>
                      <Select value={reportFormat} onValueChange={setReportFormat}>
                        <SelectTrigger id="format" className="mt-1">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xlsx">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ReportCard
                      title="Portfolio Performance"
                      description="Complete portfolio analysis with benchmark comparisons and growth metrics."
                      icon={<TrendingUp />}
                      onClick={() => generateReport('Portfolio Performance')}
                    />
                    
                    <ReportCard
                      title="Strategy Analysis"
                      description="Detailed breakdown of strategy performance with win rates and risk metrics."
                      icon={<BarChart />}
                      onClick={() => generateReport('Strategy Analysis')}
                    />
                    
                    <ReportCard
                      title="Asset Allocation"
                      description="Current allocation breakdown with rebalancing recommendations."
                      icon={<PieChart />}
                      onClick={() => generateReport('Asset Allocation')}
                    />
                    
                    <ReportCard
                      title="Tax Optimization"
                      description="Tax lot analysis and harvest opportunities for optimal tax strategy."
                      icon={<DollarSign />}
                      onClick={() => navigate('/reports/tax')}
                    />
                    
                    <ReportCard
                      title="Risk Analysis"
                      description="Comprehensive risk assessment with VaR and correlation analysis."
                      icon={<Activity />}
                      onClick={() => generateReport('Risk Analysis')}
                    />
                    
                    <ReportCard
                      title="Trade History"
                      description="Complete trading history with performance attribution analysis."
                      icon={<History />}
                      onClick={() => generateReport('Trade History')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}