import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePaperTradingAccount } from '@/hooks/use-paper-trading';
import CandlestickChart, { CandlestickChart as TradingChart } from '@/components/trading/candlestick-chart';
import TechnicalIndicators from '@/components/trading/technical-indicators';
import OrderEntryForm from '@/components/trading/order-entry-form';
import { Plus } from 'lucide-react';
import { BackLink } from '@/components/ui/back-link';
import { useSessionStore } from '../../store/session';

/**
 * Trading view page that integrates all trading components
 */
export default function TradeView() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('chart');
  
  // Fetch paper trading account
  const { 
    data: paperAccount,
    isLoading: isLoadingPaper,
    error: paperError
  } = usePaperTradingAccount();
  
  // Use useSessionStore for user/session checks
  const sessionStore = useSessionStore();
  
  // Note: Price fetching now handled by Signal Engine through unified backend
  // Remove direct market price API calls to use consistent price source
  useEffect(() => {
    if (paperAccount && selectedSymbol) {
      // TODO: Integrate with Signal Engine pricing through unified dashboard endpoint
      // For now, use a placeholder price until Signal Engine integration is complete
      console.log(`📊 Trade View: Using Signal Engine pricing for ${selectedSymbol}`);
      setLastPrice(100); // Placeholder - should come from Signal Engine
    }
  }, [paperAccount, selectedSymbol]);
  
  // Handle symbol change
  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
  };
  
  // Handle order placed
  const handleOrderPlaced = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/user/paper-trading-account'] });
    toast({
      title: 'Order Placed',
      description: 'Your trade has been executed successfully',
    });
  };
  
  // Common symbols - crypto and equities
  const commonSymbols = [
    // Cryptocurrencies
    { value: 'BTC', label: 'Bitcoin (BTC)' },
    { value: 'ETH', label: 'Ethereum (ETH)' },
    { value: 'SOL', label: 'Solana (SOL)' },
    { value: 'ADA', label: 'Cardano (ADA)' },
    { value: 'DOT', label: 'Polkadot (DOT)' },
    { value: 'MATIC', label: 'Polygon (MATIC)' },
    { value: 'AVAX', label: 'Avalanche (AVAX)' },
    { value: 'LINK', label: 'Chainlink (LINK)' },
    // Popular Equities
    { value: 'AAPL', label: 'Apple Inc. (AAPL)' },
    { value: 'META', label: 'Meta Platforms (META)' },
    { value: 'GOOGL', label: 'Alphabet Inc. (GOOGL)' },
    { value: 'MSFT', label: 'Microsoft Corp. (MSFT)' },
    { value: 'AMZN', label: 'Amazon.com Inc. (AMZN)' },
    { value: 'TSLA', label: 'Tesla Inc. (TSLA)' },
    { value: 'NVDA', label: 'NVIDIA Corp. (NVDA)' },
    { value: 'NFLX', label: 'Netflix Inc. (NFLX)' },
  ];
  
  const accountBalance = paperAccount?.currentBalance || 0;

  if (accountBalance === 0) {
    console.warn("⚠️ Account balance is 0 — check paperAccount:", paperAccount);
  }

  return (
    <div className="p-4">
      {/* Loading state */}
      {isLoadingPaper ? (
        <div className="container mx-auto py-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : !sessionStore.user ? (
        // Authentication error only
        <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">Please log in to access the trading platform.</p>
          <Button onClick={() => setLocation('/login')}>Go to Login</Button>
        </div>
      ) : !isLoadingPaper && !paperAccount ? (
        // No paper trading account
        <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Welcome to Trading</CardTitle>
              <CardDescription>Get started with paper trading</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <p className="text-center text-muted-foreground">
                To start trading, you'll need to create a paper trading account first.
                You'll receive $100,000 in virtual funds to practice without risk.
              </p>
              <Button 
                onClick={() => setLocation('/paper-trading/new')}
                className="w-full max-w-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Paper Trading Account
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : paperError ? (
        // Error loading paper trading account
        <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Error Loading Trading View</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <p className="text-center text-muted-foreground">
                Unable to load paper trading account. Please try again later.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full max-w-sm"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : !paperAccount ? (
        // Safety guard - should not happen but prevents crashes
        <div className="container mx-auto py-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        // Main trading interface
        <div className="p-6 space-y-6">
          <BackLink href="/trading">← Back to Trading</BackLink>
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">Trading Platform</h1>
            <p className="text-muted-foreground">Paper Trading Account: {paperAccount.name}</p>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            {/* Account Balance Display */}
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-xl font-bold">${paperAccount.currentBalance?.toLocaleString()}</p>
            </div>
            
            {/* Symbol Selector */}
            <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                {commonSymbols.map((symbol) => (
                  <SelectItem key={symbol.value} value={symbol.value}>
                    {symbol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Current Price Display */}
          {lastPrice && (
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold">{selectedSymbol}</span>
              <span className="text-2xl">${lastPrice.toLocaleString()}</span>
            </div>
          )}
          
          <Separator className="my-4" />
          
          {/* Main Trading Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Chart & Indicators */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                  <TabsTrigger value="indicators">Indicators</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chart">
                  <Card>
                    <CardHeader>
                      <CardTitle>Price Chart</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TradingChart 
                        symbol={selectedSymbol}
                        accountId={paperAccount.id}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="indicators">
                  <Card>
                    <CardHeader>
                      <CardTitle>Technical Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TechnicalIndicators 
                        symbol={selectedSymbol}
                        accountId={paperAccount.id}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Column - Order Entry */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Place Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderEntryForm 
                    symbol={selectedSymbol}
                    accountId={paperAccount.id}
                    lastPrice={lastPrice || undefined}
                    accountBalance={accountBalance}
                    onOrderPlaced={handleOrderPlaced}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}