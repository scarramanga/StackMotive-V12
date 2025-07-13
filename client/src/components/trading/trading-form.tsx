import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePaperTradingAccount } from "@/hooks/use-paper-trading";
import { AlertTriangle, InfoIcon } from "lucide-react";

interface TradingFormProps {
  symbol: string;
  onSubmit: (tradeData: any) => void;
  onCancel: () => void;
}

interface UserHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export const TradingForm: React.FC<TradingFormProps> = ({
  symbol,
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  const { data: paperTradingAccount } = usePaperTradingAccount();
  
  // Fetch user holdings for sell validation
  const { data: userHoldings = [], isLoading: isLoadingHoldings, error: holdingsError } = useQuery({
    queryKey: ['user-holdings', paperTradingAccount?.id],
    queryFn: async () => {
      if (!paperTradingAccount?.id) {
        throw new Error('No paper trading account ID available');
      }
      
      console.log(`🔍 HOLDINGS DEBUG - Fetching holdings for account ${paperTradingAccount.id}`);
      const holdings = await apiRequest('GET', `/api/user/paper-trading-account/${paperTradingAccount.id}/holdings`);
      console.log(`🔍 HOLDINGS DEBUG - Received data:`, holdings);
      
      if (!holdings) {
        throw new Error('Holdings API returned null/undefined');
      }
      
      return holdings;
    },
    enabled: !!paperTradingAccount?.id,
    staleTime: 30000, // 30 seconds
    retry: 1, // Only retry once
  });
  
  // Debug holdings state
  useEffect(() => {
    console.log(`🔍 HOLDINGS STATE - userHoldings:`, userHoldings);
    console.log(`🔍 HOLDINGS STATE - isLoading:`, isLoadingHoldings);
    console.log(`🔍 HOLDINGS STATE - paperTradingAccount:`, paperTradingAccount);
    console.log(`🔍 HOLDINGS STATE - query enabled:`, !!paperTradingAccount?.id);
  }, [userHoldings, isLoadingHoldings, paperTradingAccount]);
  
  // Debug on component mount
  useEffect(() => {
    console.log(`🔍 TRADING FORM MOUNTED - Symbol: ${symbol}`);
  }, []);
  
  const [tradeType, setTradeType] = useState<"market" | "limit" | "stop">("market");
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  
  // Debug side changes
  useEffect(() => {
    console.log(`🔍 ORDER SIDE CHANGED - orderSide: ${orderSide}`);
  }, [orderSide]);
  const [quantity, setQuantity] = useState<string>("1");
  const [price, setPrice] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [stopPrice, setStopPrice] = useState<string>("");
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<boolean>(false);
  const [stopLoss, setStopLoss] = useState<boolean>(false);
  const [trailingStop, setTrailingStop] = useState<boolean>(false);
  const [trailingStopPercent, setTrailingStopPercent] = useState<number>(2);
  const [orderExpiry, setOrderExpiry] = useState<string>("gtc");
  
  // State for dynamic price fetching
  const [marketPrice, setMarketPrice] = useState<number>(100);
  const [priceLoading, setPriceLoading] = useState(false);
  
  // Function to fetch current price from historical data
  const fetchCurrentPrice = async (symbol: string): Promise<number> => {
    try {
      setPriceLoading(true);
      // We need an account ID for the historical endpoint - using a default for now
      const response = await fetch(`/api/broker/historical/86/${symbol.toUpperCase()}?interval=1d`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      const data = await response.json();
      
      if (data && data.data && data.data.length > 0) {
        // Get the most recent close price
        const latestData = data.data[data.data.length - 1];
        return latestData.close;
      }
      
      // Fallback to static prices for demo
      return getStaticPrice(symbol);
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      // Fallback to static prices for demo
      return getStaticPrice(symbol);
    } finally {
      setPriceLoading(false);
    }
  };

  // Static price fallback for demo purposes
  const getStaticPrice = (symbol: string): number => {
    return symbol.includes("BTC") ? 97085.77 :
           symbol.includes("ETH") ? 3245.67 :
           symbol === "AAPL" ? 200.53 :
           symbol === "MSFT" ? 423.15 :
           symbol === "GOOGL" ? 176.21 :
           symbol === "AMZN" ? 185.43 :
           symbol === "TSLA" ? 256.78 :
           symbol === "NVDA" ? 128.65 : 100.00;
  };
  
  // Fetch price when symbol changes
  useEffect(() => {
    const loadPrice = async () => {
      const price = await fetchCurrentPrice(symbol);
      setMarketPrice(price);
    };
    loadPrice();
  }, [symbol]);
  
  useEffect(() => {
    // Set initial price based on market price
    setPrice(marketPrice.toString());
    
    // Set initial take profit and stop loss prices
    const takeProfitValue = orderSide === "buy" 
      ? marketPrice * 1.05 
      : marketPrice * 0.95;
    const stopLossValue = orderSide === "buy" 
      ? marketPrice * 0.95 
      : marketPrice * 1.05;
    
    setTakeProfitPrice(takeProfitValue.toFixed(2));
    setStopLossPrice(stopLossValue.toFixed(2));
    
    // For stop orders, set initial stop price
    if (tradeType === "stop") {
      const stopPriceValue = orderSide === "buy" 
        ? marketPrice * 1.02 
        : marketPrice * 0.98;
      setStopPrice(stopPriceValue.toFixed(2));
    }
  }, [symbol, tradeType, orderSide, marketPrice]);
  
  // Update total whenever quantity or price changes
  useEffect(() => {
    const quantityNum = parseFloat(quantity) || 0;
    const priceNum = parseFloat(price) || 0;
    setTotal((quantityNum * priceNum).toFixed(2));
  }, [quantity, price]);
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
    }
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };
  
  const handleStopPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setStopPrice(value);
    }
  };
  
  const handleTakeProfitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTakeProfitPrice(value);
    }
  };
  
  const handleStopLossPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setStopLossPrice(value);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log(`🚨 FORM SUBMIT TRIGGERED - Symbol: ${symbol}, Side: ${orderSide}, Quantity: ${quantity}`);
    console.log(`🚨 VALIDATION STATE - userHoldings:`, userHoldings);
    console.log(`🚨 VALIDATION STATE - isLoadingHoldings:`, isLoadingHoldings);
    console.log(`🚨 VALIDATION STATE - paperTradingAccount:`, paperTradingAccount);
    
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }
    
    // 🛡️ TRIPLE SHIELD FIX 1: Validate holdings for sell orders
    if (orderSide === "sell") {
      console.log(`🛡️ SELL ORDER VALIDATION - Symbol: ${symbol}, Requested Quantity: ${quantity}`);
      console.log(`🛡️ SELL ORDER VALIDATION - userHoldings:`, userHoldings);
      console.log(`🛡️ SELL ORDER VALIDATION - userHoldings length:`, userHoldings.length);
      console.log(`🛡️ SELL ORDER VALIDATION - isLoadingHoldings:`, isLoadingHoldings);
      console.log(`🛡️ SELL ORDER VALIDATION - holdingsError:`, holdingsError);
      console.log(`🛡️ SELL ORDER VALIDATION - paperTradingAccount?.id:`, paperTradingAccount?.id);
      
      // 🚨 CRITICAL: Block if holdings query failed
      if (holdingsError) {
        console.log(`❌ SELL BLOCKED - Holdings query failed:`, holdingsError);
        toast({
          title: "Cannot Verify Holdings",
          description: "Unable to verify your holdings. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Block if holdings are still loading
      if (isLoadingHoldings) {
        console.log(`❌ SELL BLOCKED - Holdings still loading`);
        toast({
          title: "Please Wait",
          description: "Holdings data is still loading. Please try again in a moment.",
          variant: "destructive",
        });
        return;
      }
      
      // Block if no paper trading account
      if (!paperTradingAccount?.id) {
        console.log(`❌ SELL BLOCKED - No paper trading account found`);
        toast({
          title: "Account Error",
          description: "Paper trading account not found. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      
      // 🚨 CRITICAL: Block if holdings is null/undefined (should never happen with new query logic)
      if (!userHoldings) {
        console.log(`❌ SELL BLOCKED - Holdings data is null/undefined`);
        toast({
          title: "Holdings Data Error",
          description: "Holdings data is unavailable. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      
      const currentHolding = userHoldings.find((h: UserHolding) => h.symbol === symbol);
      console.log(`🛡️ SELL ORDER VALIDATION - currentHolding for ${symbol}:`, currentHolding);
      
      if (!currentHolding || currentHolding.quantity <= 0) {
        console.log(`❌ SELL BLOCKED - No holdings found for ${symbol}. Available holdings:`, userHoldings.map((h: UserHolding) => `${h.symbol}: ${h.quantity}`));
        
        toast({
          title: "Cannot Sell Asset",
          description: `You don't currently hold any ${symbol}. Available holdings: ${userHoldings.length > 0 ? userHoldings.map((h: UserHolding) => `${h.symbol} (${h.quantity})`).join(', ') : 'None'}`,
          variant: "destructive",
        });
        return;
      }
      
      const requestedQuantity = parseFloat(quantity);
      if (requestedQuantity > currentHolding.quantity) {
        console.log(`❌ SELL BLOCKED - Insufficient holdings for ${symbol}. Requested: ${requestedQuantity}, Available: ${currentHolding.quantity}`);
        
        toast({
          title: "Insufficient Holdings",
          description: `You only have ${currentHolding.quantity} ${symbol}. Cannot sell ${requestedQuantity}.`,
          variant: "destructive",
        });
        return;
      }
      
      console.log(`✅ SELL VALIDATED - ${symbol}: Selling ${requestedQuantity} out of ${currentHolding.quantity} available`);
    }
    
    if (tradeType !== "market" && (!price || parseFloat(price) <= 0)) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }
    
    if (tradeType === "stop" && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      toast({
        title: "Invalid Stop Price",
        description: "Please enter a valid stop price.",
        variant: "destructive",
      });
      return;
    }
    
    if (takeProfit && (!takeProfitPrice || parseFloat(takeProfitPrice) <= 0)) {
      toast({
        title: "Invalid Take Profit",
        description: "Please enter a valid take profit price.",
        variant: "destructive",
      });
      return;
    }
    
    if (stopLoss && (!stopLossPrice || parseFloat(stopLossPrice) <= 0)) {
      toast({
        title: "Invalid Stop Loss",
        description: "Please enter a valid stop loss price.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate price relationships
    if (orderSide === "buy") {
      if (takeProfit && parseFloat(takeProfitPrice) <= parseFloat(price)) {
        toast({
          title: "Invalid Take Profit",
          description: "Take profit must be higher than entry price for buy orders.",
          variant: "destructive",
        });
        return;
      }
      
      if (stopLoss && parseFloat(stopLossPrice) >= parseFloat(price)) {
        toast({
          title: "Invalid Stop Loss",
          description: "Stop loss must be lower than entry price for buy orders.",
          variant: "destructive",
        });
        return;
      }
    } else { // sell order
      if (takeProfit && parseFloat(takeProfitPrice) >= parseFloat(price)) {
        toast({
          title: "Invalid Take Profit",
          description: "Take profit must be lower than entry price for sell orders.",
          variant: "destructive",
        });
        return;
      }
      
      if (stopLoss && parseFloat(stopLossPrice) <= parseFloat(price)) {
        toast({
          title: "Invalid Stop Loss",
          description: "Stop loss must be higher than entry price for sell orders.",
          variant: "destructive",
        });
        return;
      }
    }
    
    const tradeData = {
      symbol,
      tradeType,
      orderSide,
      quantity: parseFloat(quantity),
      price: tradeType === "market" ? marketPrice : parseFloat(price),
      stopPrice: tradeType === "stop" ? parseFloat(stopPrice) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfitPrice) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLossPrice) : undefined,
      trailingStop: trailingStop ? trailingStopPercent : undefined,
      orderExpiry,
      total: parseFloat(total),
      timestamp: new Date().toISOString(),
    };
    
    onSubmit(tradeData);
    
    toast({
      title: "Order Submitted",
      description: `Your ${orderSide} order for ${quantity} ${symbol} has been submitted.`,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Order Type</Label>
          <Tabs value={tradeType} onValueChange={(value) => setTradeType(value as any)} className="mt-2">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="limit">Limit</TabsTrigger>
              <TabsTrigger value="stop">Stop</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div>
          <Label>Side</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Button
              type="button"
              variant={orderSide === "buy" ? "default" : "outline"}
              className={orderSide === "buy" ? "bg-success hover:bg-success/90" : ""}
              onClick={() => setOrderSide("buy")}
            >
              <i className="ri-arrow-up-line mr-2"></i>
              Buy
            </Button>
            <Button
              type="button"
              variant={orderSide === "sell" ? "default" : "outline"}
              className={orderSide === "sell" ? "bg-destructive hover:bg-destructive/90" : ""}
              onClick={() => setOrderSide("sell")}
            >
              <i className="ri-arrow-down-line mr-2"></i>
              Sell
            </Button>
          </div>
        </div>
        
        {/* 🛡️ TRIPLE SHIELD FIX 2: Holdings context for sell orders */}
        {orderSide === "sell" && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Label className="text-blue-800 dark:text-blue-200 font-medium">Current Holdings</Label>
            </div>
            
            {holdingsError ? (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Error loading holdings. Please refresh the page.
              </div>
            ) : isLoadingHoldings ? (
              <div className="text-sm text-blue-600 dark:text-blue-400">Loading your holdings...</div>
            ) : !userHoldings ? (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Holdings data unavailable. Cannot verify ownership.
              </div>
            ) : userHoldings.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4" />
                No holdings found. You need to buy assets before you can sell them.
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  You currently hold:{" "}
                  {userHoldings.map((holding: UserHolding, index: number) => (
                    <span key={holding.symbol} className="font-mono">
                      {holding.symbol} ({holding.quantity.toFixed(holding.quantity < 1 ? 6 : 2)})
                      {index < userHoldings.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
                
                {/* Show specific holding for selected symbol if available */}
                {(() => {
                  const currentSymbolHolding = userHoldings.find((h: UserHolding) => h.symbol === symbol);
                  if (currentSymbolHolding) {
                    return (
                      <div className="text-sm text-green-700 dark:text-green-300 font-medium">
                        ✓ Available to sell: {currentSymbolHolding.quantity.toFixed(currentSymbolHolding.quantity < 1 ? 6 : 2)} {symbol}
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        You don't hold any {symbol} to sell
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              value={quantity}
              onChange={handleQuantityChange}
              className="mt-1"
            />
          </div>
          
          {tradeType !== "market" && (
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={price}
                onChange={handlePriceChange}
                className="mt-1"
              />
            </div>
          )}
          
          {tradeType === "stop" && (
            <div>
              <Label htmlFor="stop-price">Stop Price</Label>
              <Input
                id="stop-price"
                value={stopPrice}
                onChange={handleStopPriceChange}
                className="mt-1"
              />
            </div>
          )}
          
          <div>
            <Label>Total</Label>
            <Input
              value={`$${total}`}
              readOnly
              className="mt-1 bg-neutral-50 dark:bg-neutral-800"
            />
          </div>
        </div>
        
        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="take-profit" className="cursor-pointer">Take Profit</Label>
            </div>
            <Switch
              id="take-profit"
              checked={takeProfit}
              onCheckedChange={setTakeProfit}
            />
          </div>
          
          {takeProfit && (
            <div className="mt-2">
              <Input
                value={takeProfitPrice}
                onChange={handleTakeProfitPriceChange}
                className="bg-white dark:bg-neutral-700"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Current Price: ${marketPrice.toFixed(2)}</span>
                <span>{orderSide === "buy" ? "+" : "-"}5%</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <Label htmlFor="stop-loss" className="cursor-pointer">Stop Loss</Label>
            </div>
            <Switch
              id="stop-loss"
              checked={stopLoss}
              onCheckedChange={setStopLoss}
            />
          </div>
          
          {stopLoss && (
            <div className="mt-2">
              <Input
                value={stopLossPrice}
                onChange={handleStopLossPriceChange}
                className="bg-white dark:bg-neutral-700"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Current Price: ${marketPrice.toFixed(2)}</span>
                <span>{orderSide === "buy" ? "-" : "+"}5%</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <Label htmlFor="trailing-stop" className="cursor-pointer">Trailing Stop</Label>
            </div>
            <Switch
              id="trailing-stop"
              checked={trailingStop}
              onCheckedChange={setTrailingStop}
            />
          </div>
          
          {trailingStop && (
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <Label>Distance: {trailingStopPercent}%</Label>
              </div>
              <Slider
                value={[trailingStopPercent]}
                min={0.5}
                max={10}
                step={0.5}
                onValueChange={(values) => setTrailingStopPercent(values[0])}
              />
            </div>
          )}
        </div>
        
        {tradeType !== "market" && (
          <div>
            <Label>Order Expiry</Label>
            <RadioGroup value={orderExpiry} onValueChange={setOrderExpiry} className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gtc" id="gtc" />
                <Label htmlFor="gtc">GTC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="day" id="day" />
                <Label htmlFor="day">Day</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hour" id="hour" />
                <Label htmlFor="hour">1 Hour</Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
      
      <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className={orderSide === "buy" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}
        >
          {orderSide === "buy" ? "Buy" : "Sell"} {symbol}
        </Button>
      </div>
    </form>
  );
};
