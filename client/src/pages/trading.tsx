import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradingForm } from "@/components/trading/trading-form";
import { BackLink } from "@/components/ui/back-link";
import { useSessionStore } from '../store/session';
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, TrendingUp, DollarSign, AlertTriangle, BarChart3 } from "lucide-react";

const tradingPairs = [
  { symbol: "AAPL", name: "Apple Inc.", price: "$173.85", change: "+0.65%", category: "stock" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: "$318.23", change: "-0.32%", category: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: "$125.33", change: "+1.12%", category: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: "$126.75", change: "+1.45%", category: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", price: "$238.45", change: "+5.6%", category: "stock" },
  { symbol: "BTC/USD", name: "Bitcoin", price: "$26,543.12", change: "+1.23%", category: "crypto" },
  { symbol: "ETH/USD", name: "Ethereum", price: "$1,903.56", change: "+0.87%", category: "crypto" },
  { symbol: "SOL/USD", name: "Solana", price: "$28.76", change: "+7.4%", category: "crypto" },
  { symbol: "XRP/USD", name: "Ripple", price: "$0.5123", change: "-0.54%", category: "crypto" },
  { symbol: "ADA/USD", name: "Cardano", price: "$0.3687", change: "+2.1%", category: "crypto" },
];

const openPositions = [
  {
    id: "1",
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "BUY",
    openDate: "May 10, 2023",
    entryPrice: "$165.23",
    currentPrice: "$173.85",
    quantity: "10",
    value: "$1,738.50",
    profitLoss: "+5.2%",
    status: "open",
  },
  {
    id: "2",
    symbol: "BTC/USD",
    name: "Bitcoin",
    type: "BUY",
    openDate: "May 12, 2023",
    entryPrice: "$26,543.12",
    currentPrice: "$26,215.45",
    quantity: "0.5",
    value: "$13,107.73",
    profitLoss: "-1.2%",
    status: "open",
  },
  {
    id: "3",
    symbol: "MSFT",
    name: "Microsoft",
    type: "SELL",
    openDate: "May 15, 2023",
    entryPrice: "$325.67",
    currentPrice: "$318.23",
    quantity: "5",
    value: "$1,591.15",
    profitLoss: "+2.3%",
    status: "open",
  },
];

const orderHistory = [
  {
    id: "1",
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "BUY",
    openDate: "Apr 28, 2023",
    closeDate: "May 5, 2023",
    entryPrice: "$165.23",
    exitPrice: "$173.85",
    quantity: "10",
    value: "$1,738.50",
    profitLoss: "+5.2%",
    status: "closed",
  },
  {
    id: "2",
    symbol: "ETH/USD",
    name: "Ethereum",
    type: "BUY",
    openDate: "Apr 25, 2023",
    closeDate: "May 2, 2023",
    entryPrice: "$1,845.32",
    exitPrice: "$1,903.56",
    quantity: "2.5",
    value: "$4,758.90",
    profitLoss: "+3.2%",
    status: "closed",
  },
  {
    id: "3",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    type: "BUY",
    openDate: "Apr 20, 2023",
    closeDate: "Apr 28, 2023",
    entryPrice: "$410.12",
    exitPrice: "$437.53",
    quantity: "5",
    value: "$2,187.65",
    profitLoss: "+6.7%",
    status: "closed",
  },
  {
    id: "4",
    symbol: "TSLA",
    name: "Tesla Inc.",
    type: "SELL",
    openDate: "Apr 15, 2023",
    closeDate: "Apr 22, 2023",
    entryPrice: "$238.45",
    exitPrice: "$234.12",
    quantity: "8",
    value: "$1,872.96",
    profitLoss: "+1.8%",
    status: "closed",
  },
];

const Trading: React.FC = () => {
  const sessionStore = useSessionStore();
  const [, navigate] = useLocation();
  const [currentTab, setCurrentTab] = useState("market");
  const [showTradingForm, setShowTradingForm] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "stock" | "crypto">("all");
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const handleTrade = (symbol: string) => {
    setSelectedSymbol(symbol);
    setShowTradingForm(true);
  };
  
  const handleSubmitTrade = (tradeData: any) => {
    setShowTradingForm(false);
    // Trade submission handled by form component
  };
  
  const handleOpenHelp = () => {
    setShowHelpModal(true);
  };

  const logHelpSectionView = (section: string) => {
    // Help section view tracking - no logging needed for production
  };

  const getSelectedAssetName = () => {
    if (!selectedSymbol) return "selected asset";
    const pair = tradingPairs.find(p => p.symbol === selectedSymbol);
    return pair ? `${pair.symbol} (${pair.name})` : selectedSymbol;
  };
  
  const filteredPairs = filterCategory === "all" 
    ? tradingPairs 
    : tradingPairs.filter(pair => pair.category === filterCategory);
  
  return (
    <div className="p-4">
      {!sessionStore.user ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to access trading.</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <BackLink href="/dashboard">← Back to Dashboard</BackLink>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenHelp}
                    className="transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                  >
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Trading Help</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">Trading</h1>
            <p className="text-sm text-muted-foreground">Execute trades and monitor your positions</p>
          </div>
          
          {showTradingForm ? (
            <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">
                    New Trade: {selectedSymbol}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowTradingForm(false)}
                    className="transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TradingForm 
                  symbol={selectedSymbol} 
                  onSubmit={handleSubmitTrade}
                  onCancel={() => setShowTradingForm(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-3 rounded-xl">
                <TabsTrigger 
                  value="market" 
                  className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Market
                </TabsTrigger>
                <TabsTrigger 
                  value="positions"
                  className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Positions
                </TabsTrigger>
                <TabsTrigger 
                  value="history"
                  className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="market" className="space-y-6">
                <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-lg font-medium">Available Markets</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Browse and trade available assets</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant={filterCategory === "all" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setFilterCategory("all")}
                          className="transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                        >
                          All
                        </Button>
                        <Button 
                          variant={filterCategory === "stock" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setFilterCategory("stock")}
                          className="transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                        >
                          Stocks
                        </Button>
                        <Button 
                          variant={filterCategory === "crypto" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setFilterCategory("crypto")}
                          className="transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                        >
                          Crypto
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-xl overflow-hidden shadow-sm dark:border-gray-700">
                      <Table>
                        <TableHeader className="bg-muted/30 dark:bg-gray-800/50">
                          <TableRow>
                            <TableHead className="font-medium">Symbol</TableHead>
                            <TableHead className="font-medium">Price</TableHead>
                            <TableHead className="font-medium">Change</TableHead>
                            <TableHead className="text-right font-medium">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPairs.map((pair) => (
                            <TableRow 
                              key={pair.symbol} 
                              className="transition-all hover:bg-muted/50 dark:hover:bg-gray-800/50"
                            >
                              <TableCell>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <div className="font-medium">{pair.symbol}</div>
                                  <div className="text-sm text-muted-foreground">{pair.name}</div>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{pair.price}</TableCell>
                              <TableCell className={cn(
                                "font-medium",
                                pair.change.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {pair.change}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  onClick={() => handleTrade(pair.symbol)}
                                  variant="outline"
                                  size="sm"
                                  className="transition-all hover:bg-primary hover:text-primary-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                                >
                                  Trade
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="positions" className="space-y-6">
                <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Open Positions</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Your currently active trades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-xl overflow-hidden shadow-sm dark:border-gray-700">
                      <Table>
                        <TableHeader className="bg-muted/30 dark:bg-gray-800/50">
                          <TableRow>
                            <TableHead className="font-medium">Symbol</TableHead>
                            <TableHead className="font-medium">Type</TableHead>
                            <TableHead className="font-medium">Entry Price</TableHead>
                            <TableHead className="font-medium">Current Price</TableHead>
                            <TableHead className="font-medium">Quantity</TableHead>
                            <TableHead className="font-medium">Value</TableHead>
                            <TableHead className="font-medium">P&L</TableHead>
                            <TableHead className="text-right font-medium">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {openPositions.map((position) => (
                            <TableRow 
                              key={position.id} 
                              className="transition-all hover:bg-muted/50 dark:hover:bg-gray-800/50"
                            >
                              <TableCell>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <div className="font-medium">{position.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{position.name}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "px-2 py-1 text-xs rounded-full transition-all",
                                    position.type === "BUY" 
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700" 
                                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
                                  )}
                                >
                                  {position.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{position.entryPrice}</TableCell>
                              <TableCell className="font-medium">{position.currentPrice}</TableCell>
                              <TableCell>{position.quantity}</TableCell>
                              <TableCell className="font-medium">{position.value}</TableCell>
                              <TableCell className={cn(
                                "font-medium",
                                position.profitLoss.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {position.profitLoss}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleTrade(position.symbol)}
                                  className="transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:text-red-400 dark:hover:border-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 outline-none"
                                >
                                  Close
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-6">
                <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Order History</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Your past trades and their performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-xl overflow-hidden shadow-sm dark:border-gray-700">
                      <Table>
                        <TableHeader className="bg-muted/30 dark:bg-gray-800/50">
                          <TableRow>
                            <TableHead className="font-medium">Symbol</TableHead>
                            <TableHead className="font-medium">Type</TableHead>
                            <TableHead className="font-medium">Entry Price</TableHead>
                            <TableHead className="font-medium">Exit Price</TableHead>
                            <TableHead className="font-medium">Quantity</TableHead>
                            <TableHead className="font-medium">P&L</TableHead>
                            <TableHead className="font-medium">Date</TableHead>
                            <TableHead className="font-medium">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderHistory.map((order) => (
                            <TableRow 
                              key={order.id} 
                              className="transition-all hover:bg-muted/50 dark:hover:bg-gray-800/50"
                            >
                              <TableCell>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <div className="font-medium">{order.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{order.name}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "px-2 py-1 text-xs rounded-full transition-all",
                                    order.type === "BUY" 
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700" 
                                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
                                  )}
                                >
                                  {order.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{order.entryPrice}</TableCell>
                              <TableCell className="font-medium">{order.exitPrice}</TableCell>
                              <TableCell>{order.quantity}</TableCell>
                              <TableCell className={cn(
                                "font-medium",
                                order.profitLoss.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {order.profitLoss}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{order.openDate}</div>
                                <div className="text-xs text-muted-foreground">to {order.closeDate}</div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 transition-all"
                                >
                                  {order.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          {/* Trading Help Modal */}
          <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Trading Help & Guide</DialogTitle>
                <DialogDescription>
                  Learn how to place trades, understand pricing, and navigate the trading platform
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* How to Place a Trade Section */}
                <div 
                  className="space-y-3"
                  onMouseEnter={() => logHelpSectionView("How to Place a Trade")}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-medium">How to Place a Trade (Buy/Sell)</h3>
                  </div>
                  <div className="pl-7 space-y-2 text-sm text-muted-foreground">
                    <p><strong>Buying {getSelectedAssetName()}:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Select the asset from the Market tab</li>
                      <li>Click the "Trade" button next to your chosen symbol</li>
                      <li>Choose "BUY" in the trade form</li>
                      <li>Enter the quantity you want to purchase</li>
                      <li>Review the estimated cost and confirm your trade</li>
                    </ol>
                    <p><strong>Selling positions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Go to the "Positions" tab to see your open trades</li>
                      <li>Click "Close" next to the position you want to sell</li>
                      <li>Choose "SELL" and specify the quantity</li>
                      <li>Confirm the sale to realize your profits or losses</li>
                    </ol>
                  </div>
                </div>

                {/* Price Chart Section */}
                <div 
                  className="space-y-3"
                  onMouseEnter={() => logHelpSectionView("Price Chart & Updates")}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium">Understanding Price Charts & Updates</h3>
                  </div>
                  <div className="pl-7 space-y-2 text-sm text-muted-foreground">
                    <p><strong>Real-time Pricing:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Prices update automatically every 5 minutes using cached market data</li>
                      <li>Green numbers indicate price increases, red indicates decreases</li>
                      <li>Percentage changes show daily performance relative to previous close</li>
                    </ul>
                    <p><strong>Price Chart Features:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Current price reflects the latest market value for immediate trades</li>
                      <li>Price history helps identify trends and optimal entry/exit points</li>
                    </ul>
                  </div>
                </div>

                {/* Estimated Cost Section */}
                <div 
                  className="space-y-3"
                  onMouseEnter={() => logHelpSectionView("Estimated Cost")}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-medium">What "Estimated Cost" Includes</h3>
                  </div>
                  <div className="pl-7 space-y-2 text-sm text-muted-foreground">
                    <p><strong>Cost Calculation:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Base Cost:</strong> Current market price × Quantity</li>
                      <li><strong>Dynamic Pricing:</strong> Uses latest available market data from historical API</li>
                      <li><strong>Real-time Updates:</strong> Cost updates automatically as you change quantity</li>
                    </ul>
                    <p><strong>Example for {getSelectedAssetName()}:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>If current price is $150.00 and you buy 10 shares</li>
                      <li>Estimated cost = $150.00 × 10 = $1,500.00</li>
                      <li>This represents the paper trading amount that will be deducted from your account</li>
                    </ul>
                  </div>
                </div>

                {/* Test Mode Explanation */}
                <div 
                  className="space-y-3"
                  onMouseEnter={() => logHelpSectionView("Test Mode & Mock Prices")}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h3 className="text-lg font-medium">Test Mode & Mock Pricing</h3>
                  </div>
                  <div className="pl-7 space-y-2 text-sm text-muted-foreground">
                    <p><strong>Paper Trading Environment:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>All trades are simulated - no real money is involved</li>
                      <li>Prices may appear flat or show mock volatility for testing purposes</li>
                      <li>BTC, Tesla, and other assets use historical data with reduced volatility (±0.5%)</li>
                    </ul>
                    <p><strong>Why some prices appear static:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Test environment uses cached prices updated every 5 minutes</li>
                      <li>Mock volatility is intentionally reduced to prevent unrealistic portfolio swings</li>
                      <li>This allows you to practice trading strategies without extreme price fluctuations</li>
                    </ul>
                    <p><strong>Transitioning to live trading:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Your paper trading experience prepares you for real market conditions</li>
                      <li>Live trading will use real-time market prices with full volatility</li>
                    </ul>
                  </div>
                </div>

                {/* Tips & Best Practices */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-medium">Trading Tips & Best Practices</h3>
                  </div>
                  <div className="pl-7 space-y-2 text-sm text-muted-foreground">
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Start with small quantities to test your trading strategies</li>
                      <li>Monitor your positions regularly in the "Positions" tab</li>
                      <li>Review your trading history to learn from past decisions</li>
                      <li>Use the reduced volatility in test mode to practice risk management</li>
                      <li>Take advantage of the paper trading environment to experiment with different assets</li>
                    </ul>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default Trading;