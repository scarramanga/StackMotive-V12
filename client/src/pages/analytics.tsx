import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BackToDashboard } from "@/components/ui/back-to-dashboard";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PerformanceChart } from "@/components/analytics/performance-chart";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, LineChart, PieChart, BarChart, DollarSign, TrendingUp, Plus, BarChart3, InfoIcon, HelpCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useSessionStore } from '../store/session';
import CategoryAnalyticsPanel from '../components/analytics/CategoryAnalyticsPanel';

// Types for combined portfolio data
type NewsItem = {
  title: string;
  url: string;
  source: string;
};

type EquityItem = {
  Symbol: string;
  shares: number;
  Value: number;
  pnl_pct: string;
  price: number;
  news: NewsItem[];
};

type CryptoItem = {
  Symbol: string;
  amount: number;
  source: string;
  price: number | null;
  Value: number;
  news: NewsItem[];
};

type CombinedPortfolio = {
  equities: EquityItem[];
  crypto: CryptoItem[];
};

interface Trade {
  id: string;
  symbol: string;
  name: string;
  type: string;
  entryPrice: string;
  exitPrice: string;
  profitLoss: string;
  date: string;
}

interface Metric {
  label: string;
  value: string;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
}

const Analytics: React.FC = () => {
  const { user } = useSessionStore();
  const [, navigate] = useLocation();
  const [timeframe, setTimeframe] = useState("1m");
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  // Portfolio Analytics Help Modal handlers
  const handleHelpModalOpen = () => {
    setHelpModalOpen(true);
  };
  
  const handleTooltipHover = (metricName: string) => {
    // Tooltip hover handler - no logging needed for production
  };
  
  // Fetch portfolio data
  const { data: portfolioData, isLoading: isLoadingPortfolio } = useQuery<CombinedPortfolio>({
    queryKey: ['/api/combined-portfolio'],
    staleTime: 60000, // Refresh every minute
  });
  
  // Calculate total portfolio value and other metrics
  const totalEquityValue = portfolioData ? 
    portfolioData.equities.reduce((sum, item) => sum + item.Value, 0) : 0;
  
  const totalCryptoValue = portfolioData ? 
    portfolioData.crypto.reduce((sum, item) => sum + item.Value, 0) : 0;
  
  const totalPortfolioValue = totalEquityValue + totalCryptoValue;
  
  // Check if user has any portfolio data
  const hasPortfolioData = portfolioData && 
    (portfolioData.equities.length > 0 || portfolioData.crypto.length > 0);
  
  // Calculate average PnL percentage
  const averagePnlPct = portfolioData ? 
    portfolioData.equities.reduce((sum, item) => {
      const pnlValue = parseFloat(item.pnl_pct.replace("%", ""));
      return isNaN(pnlValue) ? sum : sum + pnlValue;
    }, 0) / (portfolioData.equities.length || 1) : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Create performance metrics with real data
  const performanceMetrics: Metric[] = [
    {
      label: "Total Portfolio Value",
      value: formatCurrency(totalPortfolioValue),
      change: {
        value: averagePnlPct.toFixed(1) + "%",
        positive: averagePnlPct > 0,
      },
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      label: "Equities Value",
      value: formatCurrency(totalEquityValue),
      change: {
        value: (portfolioData?.equities.length || 0) + " stocks",
        positive: true,
      },
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      label: "Crypto Value",
      value: formatCurrency(totalCryptoValue),
      change: {
        value: (portfolioData?.crypto.length || 0) + " tokens",
        positive: true,
      },
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      label: "Allocation Ratio",
      value: totalPortfolioValue ? (totalEquityValue / totalPortfolioValue * 100).toFixed(0) + ":" + (totalCryptoValue / totalPortfolioValue * 100).toFixed(0) : "0:0",
      change: {
        value: "Stocks:Crypto",
        positive: true,
      },
      icon: <PieChart className="h-5 w-5" />,
    },
  ];
  
  // Generate trade data from portfolio
  const generateTradesFromPortfolio = (): { top: Trade[], worst: Trade[] } => {
    if (!portfolioData) return { top: [], worst: [] };
    
    // Convert equities to trade objects and sort by pnl
    const allTrades = portfolioData.equities.map(item => {
      const pnlValue = parseFloat(item.pnl_pct.replace("%", ""));
      return {
        id: item.Symbol,
        symbol: item.Symbol,
        name: item.Symbol,
        type: "HOLD",
        entryPrice: "$" + ((item.Value / item.shares) - (item.Value / item.shares) * pnlValue / 100).toFixed(2),
        exitPrice: "$" + (item.Value / item.shares).toFixed(2),
        profitLoss: item.pnl_pct.startsWith("-") ? item.pnl_pct : "+" + item.pnl_pct,
        date: "Current Position",
      } as Trade;
    });
    
    // Sort by PnL
    const sortedTrades = [...allTrades].sort((a, b) => {
      const aPnl = parseFloat(a.profitLoss.replace("%", "").replace("+", "").replace("-", "")) * (a.profitLoss.startsWith("-") ? -1 : 1);
      const bPnl = parseFloat(b.profitLoss.replace("%", "").replace("+", "").replace("-", "")) * (b.profitLoss.startsWith("-") ? -1 : 1);
      return bPnl - aPnl;
    });
    
    return {
      top: sortedTrades.slice(0, 3),
      worst: sortedTrades.reverse().slice(0, 3)
    };
  };
  
  const { top: topTrades, worst: worstTrades } = generateTradesFromPortfolio();
  
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };
  
  if (isLoadingPortfolio) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  const TradeList = ({ trades, type }: { trades: Trade[], type: "top" | "worst" }) => {
    // Handle empty trade lists
    if (!trades || trades.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <div className="space-y-2">
            <p className="text-sm">No {type === "top" ? "profitable" : "losing"} positions yet</p>
            <p className="text-xs">
              {type === "top" 
                ? "Your best performing trades will appear here" 
                : "Underperforming positions will be shown here"}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {trades.map((trade) => (
          <div 
            key={trade.id}
            className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                  type === "top" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}>
                  {type === "top" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="font-medium">{trade.symbol}</span>
                    <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{trade.name}</span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{trade.date}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={cn(
                  "font-medium",
                  trade.profitLoss.startsWith("+") ? "text-green-600" : "text-red-600"
                )}>
                  {trade.profitLoss}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {trade.entryPrice} → {trade.exitPrice}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <BackToDashboard />
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Portfolio Analytics</h1>
            <InfoIcon className="w-4 h-4 text-muted-foreground cursor-help" />
          </div>
          <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleHelpModalOpen}
                className="flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                What does this mean?
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Portfolio Analytics Guide</DialogTitle>
                <DialogDescription>
                  Understanding your portfolio performance and how metrics are calculated
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Portfolio Calculation Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">How Portfolio Performance is Calculated</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Portfolio Value:</strong> Current market value of all your holdings (equities + crypto) plus available cash balance.</p>
                    <p><strong>Profit/Loss:</strong> Calculated as (Current Value - Purchase Price) / Purchase Price × 100</p>
                    <p><strong>Allocation Ratio:</strong> Shows the percentage split between stocks and crypto investments.</p>
                  </div>
                </div>
                
                {/* Metrics Explanation */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Key Metrics Explained</h3>
                  <div className="grid gap-3 text-sm">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium">Total Portfolio Value</h4>
                      <p>The sum of all your current holdings at market prices plus cash available for trading.</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium">Equities Value</h4>
                      <p>Market value of all your stock positions. Updates with real-time stock prices during market hours.</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium">Crypto Value</h4>
                      <p>Market value of all cryptocurrency holdings. Updates continuously as crypto markets operate 24/7.</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium">Performance Chart</h4>
                      <p>Shows your portfolio value over time. Select different timeframes to see short-term vs long-term trends.</p>
                    </div>
                  </div>
                </div>
                
                {/* Data Sources */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Data Sources & Accuracy</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Live Data:</strong> {hasPortfolioData ? "Real portfolio data from your actual trades and holdings" : "No live data yet - waiting for your first trades"}</p>
                    <p><strong>Market Prices:</strong> Real-time prices from financial data providers, updated every few seconds during market hours</p>
                    <p><strong>Test Mode:</strong> {!hasPortfolioData ? "Currently showing sample data for UI testing. Your actual portfolio will replace this once you start trading." : "Live trading mode - all data reflects your actual portfolio"}</p>
                  </div>
                </div>
                
                {/* Interpreting Results */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">How to Interpret Your Results</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Green indicators:</strong> Positive performance - your investments are gaining value</p>
                    <p><strong>Red indicators:</strong> Negative performance - investments are losing value (normal market fluctuation)</p>
                    <p><strong>Percentage changes:</strong> Show relative performance - a 5% gain on $1000 is better than a 2% gain on $500</p>
                    <p><strong>Position sizing:</strong> Larger positions have more impact on overall portfolio performance</p>
                  </div>
                </div>
                
                {/* Action Items */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">What Actions Can You Take?</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Rebalancing:</strong> Adjust position sizes to match your target allocation</p>
                    <p><strong>Profit Taking:</strong> Consider selling positions that have significant gains</p>
                    <p><strong>Loss Management:</strong> Review underperforming positions and consider strategy changes</p>
                    <p><strong>Diversification:</strong> Ensure you're not overexposed to any single asset or sector</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground mt-2">Shows analytics once trades have been made.</p>
      </div>
      
      {!hasPortfolioData ? (
        <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Mock Data for UI Testing</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              Portfolio analytics will populate with real data once trades are executed.
            </p>
            <div className="text-center mb-6">
              <p className="text-lg font-semibold text-green-600">Sample Stat: Top Performing Asset</p>
              <p className="text-2xl font-bold">$NVDA +12.4%</p>
              <p className="text-xs text-gray-500">Mock performance data</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/trading')}
                className="transition-all hover:opacity-90 focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start Trading
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/combined-portfolio')}
                className="transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Performance Overview */}
          <TooltipProvider delayDuration={100}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {performanceMetrics.map((metric, index) => {
                const tooltipContent = {
                  "Total Portfolio Value": "Sum of all holdings at current market prices plus available cash. This is your total investment worth right now.",
                  "Equities Value": "Current market value of all your stock positions. Updates during market hours (9:30 AM - 4:00 PM ET).",
                  "Crypto Value": "Current market value of all cryptocurrency holdings. Updates 24/7 as crypto markets never close.",
                  "Allocation Ratio": "Percentage split between stocks and crypto. Helps you understand your risk distribution across asset classes."
                }[metric.label] || "Portfolio performance metric";
                
                return (
                  <Card key={index} className="rounded-xl shadow-sm transition-all hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon 
                                  className="w-3 h-3 text-muted-foreground cursor-help hover:text-foreground transition-colors"
                                  onMouseEnter={() => handleTooltipHover(metric.label)}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs">{tooltipContent}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-2xl font-bold mt-1">{metric.value}</p>
                          {metric.change && (
                            <div className={cn(
                              "flex items-center mt-1 text-sm font-medium",
                              metric.change.positive 
                                ? "text-green-600 dark:text-green-400" 
                                : "text-red-600 dark:text-red-400"
                            )}>
                              {metric.change.positive ? (
                                <ArrowUp className="w-3 h-3 mr-1" />
                              ) : (
                                <ArrowDown className="w-3 h-3 mr-1" />
                              )}
                              {metric.change.value}
                            </div>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {metric.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Performance Chart */}
          <TooltipProvider delayDuration={100}>
            <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-medium">Portfolio Performance</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon 
                            className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors"
                            onMouseEnter={() => handleTooltipHover("Portfolio Performance Chart")}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <p className="text-xs">
                            Shows how your total portfolio value has changed over the selected time period. 
                            Green areas indicate gains, red areas show losses. Use timeframe selector to zoom in/out.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">Your portfolio value over time</CardDescription>
                  </div>
                <Select value={timeframe} onValueChange={handleTimeframeChange}>
                  <SelectTrigger className="w-full sm:w-32 transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="1w" className="dark:hover:bg-gray-700">1 Week</SelectItem>
                    <SelectItem value="1m" className="dark:hover:bg-gray-700">1 Month</SelectItem>
                    <SelectItem value="3m" className="dark:hover:bg-gray-700">3 Months</SelectItem>
                    <SelectItem value="6m" className="dark:hover:bg-gray-700">6 Months</SelectItem>
                    <SelectItem value="1y" className="dark:hover:bg-gray-700">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
                      <CardContent>
                <PerformanceChart timeframe={timeframe} portfolioData={portfolioData} />
              </CardContent>
            </Card>
          </TooltipProvider>

          {/* Trading Performance */}
          <TooltipProvider delayDuration={100}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Trades */}
              <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-medium">Top Performing Positions</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon 
                          className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors"
                          onMouseEnter={() => handleTooltipHover("Top Performing Positions")}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <p className="text-xs">
                          Shows your best performing current holdings ranked by percentage gains. 
                          Green arrows indicate profits. These are unrealized gains until you sell.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">Your best current holdings</CardDescription>
                </CardHeader>
              <CardContent>
                <TradeList trades={topTrades} type="top" />
              </CardContent>
            </Card>

                        {/* Worst Performing Trades */}
              <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-medium">Underperforming Positions</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon 
                          className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors"
                          onMouseEnter={() => handleTooltipHover("Underperforming Positions")}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <p className="text-xs">
                          Shows your worst performing current holdings ranked by percentage losses. 
                          Red arrows indicate losses. Consider reviewing these positions for potential strategy adjustments.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">Holdings that need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <TradeList trades={worstTrades} type="worst" />
                </CardContent>
              </Card>
            </div>
          </TooltipProvider>

          {/* Quick Actions */}
          <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">Manage your portfolio efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/trading')}
                  className="h-20 flex flex-col items-center justify-center space-y-2 transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm">New Trade</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/combined-portfolio')}
                  className="h-20 flex flex-col items-center justify-center space-y-2 transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-sm">Full Portfolio</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/advanced-analytics')}
                  className="h-20 flex flex-col items-center justify-center space-y-2 transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                >
                  <LineChart className="w-5 h-5" />
                  <span className="text-sm">Advanced Analytics</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/technical-analysis')}
                  className="h-20 flex flex-col items-center justify-center space-y-2 transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Technical Analysis</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          <CategoryAnalyticsPanel />
        </>
      )}
    </div>
  );
}

export default Analytics;
