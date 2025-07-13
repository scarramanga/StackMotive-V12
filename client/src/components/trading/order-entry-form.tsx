import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

// Define enums for order types (matching server-side definitions)
enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  TRAILING_STOP = 'TRAILING_STOP',
}

enum TimeInForce {
  GTC = 'GTC', // Good Till Cancelled
  IOC = 'IOC', // Immediate or Cancel
  FOK = 'FOK', // Fill or Kill
  DAY = 'DAY', // Day only
}

interface OrderEntryFormProps {
  symbol: string;
  accountId: number;
  lastPrice?: number;
  accountBalance?: number;
  onOrderPlaced?: () => void;
}

// Enhanced symbol validation
const validateSymbol = async (symbol: string): Promise<boolean> => {
  if (!symbol || symbol.length < 1) return false;
  
  try {
    const response = await apiRequest('GET', `/api/market/validate-symbol/${symbol.toUpperCase()}`);
    return response.valid === true;
  } catch (error) {
    // If validation endpoint doesn't exist, allow common symbols
    const commonSymbols = /^(BTC|ETH|AAPL|MSFT|GOOGL|AMZN|TSLA|NVDA|META|NFLX|ADA|SOL|DOT|MATIC|AVAX|LINK|UNI|LTC|XRP|DOGE|AMD|JPM|V|JNJ|WMT|PG|HD|BAC|DIS|KO|PFE|XOM)$/i;
    return commonSymbols.test(symbol) || /^[A-Z0-9]{1,10}$/.test(symbol.toUpperCase());
  }
};

// Form schema with enhanced validation
const orderFormSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 10 characters or less")
    .regex(/^[A-Z0-9]+$/i, "Symbol must contain only letters and numbers")
    .transform(val => val.toUpperCase()),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT", "STOP", "STOP_LIMIT", "TRAILING_STOP"]),
  quantity: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().positive("Quantity must be greater than 0")
  ),
  price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : parseFloat(val as string),
    z.number().positive("Price must be greater than 0").optional()
  ),
  stopPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : parseFloat(val as string),
    z.number().positive("Stop price must be greater than 0").optional()
  ),
  timeInForce: z.enum(["GTC", "IOC", "FOK", "DAY"]).default("GTC"),
  strategyId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : parseInt(val as string),
    z.number().optional()
  ),
  isAutomated: z.boolean().default(false)
}).superRefine((data, ctx) => {
  // Only enforce price requirements for non-market orders
  if (data.type === 'LIMIT' && !data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Price is required for limit orders",
      path: ["price"]
    });
  }
  
  if (data.type === 'STOP_LIMIT' && !data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Price is required for stop limit orders",
      path: ["price"]
    });
  }
  
  if ((data.type === 'STOP' || data.type === 'STOP_LIMIT' || data.type === 'TRAILING_STOP') && !data.stopPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Stop price is required for stop orders",
      path: ["stopPrice"]
    });
  }
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

// Confirmation modal component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderData: OrderFormValues;
  estimatedCost: number;
  currentBalance: number;
  isLoading: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  estimatedCost,
  currentBalance,
  isLoading
}) => {
  const hasInsufficientFunds = estimatedCost > currentBalance;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasInsufficientFunds ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            Confirm Order
          </DialogTitle>
          <DialogDescription>
            Please review your order details before confirming.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Symbol</p>
              <p className="font-semibold">{orderData.symbol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Action</p>
              <Badge variant={orderData.side === 'BUY' ? 'default' : 'destructive'}>
                {orderData.side}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Type</p>
              <p className="font-semibold">{orderData.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="font-semibold">{orderData.quantity}</p>
            </div>
            {orderData.price && (
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-semibold">${orderData.price.toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Estimated Cost</p>
              <p className="font-semibold text-lg">${estimatedCost.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Balance Check */}
          <div className={`p-4 rounded-lg border-2 ${
            hasInsufficientFunds 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`h-4 w-4 ${
                hasInsufficientFunds ? 'text-red-600' : 'text-green-600'
              }`} />
              <span className={`font-medium ${
                hasInsufficientFunds ? 'text-red-800' : 'text-green-800'
              }`}>
                Account Balance
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Current Balance</p>
                <p className="font-semibold">${currentBalance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">After Trade</p>
                <p className={`font-semibold ${
                  hasInsufficientFunds ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${(currentBalance - estimatedCost).toFixed(2)}
                </p>
              </div>
            </div>
            
            {hasInsufficientFunds && (
              <p className="text-sm text-red-700 mt-2">
                ⚠️ Insufficient funds for this trade. Please reduce quantity or add funds.
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={hasInsufficientFunds || isLoading}
            className={hasInsufficientFunds ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                Placing Order...
              </>
            ) : (
              'Confirm Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Order entry form component for placing trades
 */
export const OrderEntryForm: React.FC<OrderEntryFormProps> = ({
  symbol,
  accountId,
  lastPrice,
  accountBalance = 0,
  onOrderPlaced
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingSymbol, setIsValidatingSymbol] = useState(false);
  const [symbolValid, setSymbolValid] = useState<boolean | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderFormValues | null>(null);
  const { toast } = useToast();
  
  // State for dynamic price fetching
  const [currentPrice, setCurrentPrice] = useState<number>(lastPrice || 0);
  const [priceLoading, setPriceLoading] = useState(false);
  
  // Initialize form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      symbol,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: 1,
      price: lastPrice,
      stopPrice: undefined,
      timeInForce: 'GTC',
      strategyId: undefined,
      isAutomated: false
    }
  });
  
  // Sync symbol with parent when it changes
  React.useEffect(() => {
    if (symbol && symbol !== form.getValues('symbol')) {
      form.setValue('symbol', symbol.toUpperCase());
    }
  }, [symbol, form]);
  
  // Watch form values for conditional fields and calculations
  const selectedOrderType = form.watch('type');
  const selectedOrderSide = form.watch('side');
  const watchedSymbol = form.watch('symbol');
  const watchedQuantity = form.watch('quantity');
  const watchedPrice = form.watch('price');
  
  // Function to fetch current price from historical data (latest close price)
  const fetchCurrentPrice = async (symbol: string): Promise<number> => {
    try {
      setPriceLoading(true);
      // Use historical data endpoint to get latest price
      const response = await apiRequest('GET', `/api/broker/historical/${accountId}/${symbol.toUpperCase()}?interval=1d`);
      
      if (response && response.data && response.data.length > 0) {
        // Get the most recent close price
        const latestData = response.data[response.data.length - 1];
        return latestData.close;
      }
      
      // Fallback to lastPrice or demo prices
      return lastPrice || getStaticPrice(symbol);
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      // Fallback to static demo prices
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
           symbol === "NVDA" ? 128.65 :
           lastPrice || 100.00;
  };
  
  // Symbol validation effect
  React.useEffect(() => {
    const validateSymbolAsync = async () => {
      if (watchedSymbol && watchedSymbol.length > 0) {
        setIsValidatingSymbol(true);
        try {
          const isValid = await validateSymbol(watchedSymbol);
          setSymbolValid(isValid);
        } catch (error) {
          setSymbolValid(false);
        } finally {
          setIsValidatingSymbol(false);
        }
      } else {
        setSymbolValid(null);
      }
    };

    const timeoutId = setTimeout(validateSymbolAsync, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchedSymbol]);
  
  // Fetch current price when symbol changes
  React.useEffect(() => {
    const fetchPriceForSymbol = async () => {
      if (watchedSymbol && watchedSymbol.length > 0 && symbolValid === true) {
        const price = await fetchCurrentPrice(watchedSymbol);
        setCurrentPrice(price);
        // Also update form price field for limit orders
        if (selectedOrderType === 'LIMIT' || selectedOrderType === 'STOP_LIMIT') {
          form.setValue('price', price);
        }
      }
    };

    fetchPriceForSymbol();
  }, [watchedSymbol, symbolValid, selectedOrderType, form]);
  
  // Calculate estimated cost
  const calculateEstimatedCost = (values: OrderFormValues): number => {
    const price = values.type === 'MARKET' ? currentPrice : values.price;
    if (!price || !values.quantity) return 0;
    return price * values.quantity;
  };
  
  // Handle form submission (show confirmation modal)
  const handleFormSubmit = (values: OrderFormValues) => {
    console.log('🔍 Form submitted with values:', values);
    console.log('🔍 Form validation passed, setting pending order and showing confirmation modal');
    setPendingOrder(values);
    setShowConfirmation(true);
  };
  
  // Add form validation error handler
  const handleFormError = (errors: any) => {
    console.log('❌ Form validation failed:', errors);
    console.log('❌ Detailed error breakdown:', JSON.stringify(errors, null, 2));
    console.log('❌ Current form values:', form.getValues());
    toast({
      title: 'Form validation failed',
      description: 'Please check all required fields',
      variant: 'destructive',
    });
  };
  
  // Handle confirmed order submission
  const handleConfirmedSubmit = async () => {
    if (!pendingOrder) return;
    
    setIsSubmitting(true);
    
    try {
      // For market orders, we need to get the current price
      let tradePrice = pendingOrder.price;
      if (pendingOrder.type === 'MARKET') {
        if (currentPrice > 0) {
          tradePrice = currentPrice;
        } else {
          // Fetch fresh price if not available
          console.log(`📊 Order Entry: Fetching fresh price for ${pendingOrder.symbol}`);
          tradePrice = await fetchCurrentPrice(pendingOrder.symbol);
        }
      }
      
      // Final balance check
      const estimatedCost = calculateEstimatedCost(pendingOrder);
      if (estimatedCost > accountBalance) {
        throw new Error('Insufficient funds for this trade');
      }
      
      // Create trade request that matches the backend TradeCreate schema
      const tradeRequest = {
        symbol: pendingOrder.symbol,
        tradeType: pendingOrder.side.toLowerCase(), // Convert "BUY" to "buy", "SELL" to "sell"
        quantity: pendingOrder.quantity,
        price: tradePrice
      };
      
      // Send trade to the correct API endpoint
      const result = await apiRequest(
        'POST',
        `/api/user/paper-trading-account/${accountId}/trades`,
        tradeRequest
      );
      
      toast({
        title: 'Trade placed successfully! 🎉',
        description: `${pendingOrder.side} ${pendingOrder.quantity} ${pendingOrder.symbol} at $${tradePrice?.toFixed(2)}`,
      });
      
      // Reset form
      form.reset({
        symbol,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: 1,
        price: lastPrice,
        stopPrice: undefined,
        timeInForce: 'GTC',
        strategyId: undefined,
        isAutomated: false
      });
      
      // Close modal
      setShowConfirmation(false);
      setPendingOrder(null);
      
      // Callback if provided
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error placing order',
        description: error.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle clicking on price buttons (convenience)
  const handlePriceClick = (priceType: 'ask' | 'bid' | 'last') => {
    // Use the current dynamic price
    if (currentPrice > 0) {
      form.setValue('price', currentPrice);
    }
  };

  // Calculate real-time estimated cost
  const estimatedCost = React.useMemo(() => {
    if (pendingOrder) {
      return calculateEstimatedCost(pendingOrder);
    }
    // Calculate for current form values
    const quantity = watchedQuantity || 0;
    const price = selectedOrderType === 'MARKET' ? currentPrice : watchedPrice;
    return quantity && price ? quantity * price : 0;
  }, [pendingOrder, watchedQuantity, currentPrice, watchedPrice, selectedOrderType]);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Place Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="market">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit, handleFormError)} className="space-y-6 mt-6">
                {/* Symbol Field with Validation */}
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="e.g., AAPL, BTC"
                            {...field}
                            value={field.value.toUpperCase()}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            {isValidatingSymbol && (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            )}
                            {symbolValid === true && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {symbolValid === false && (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      {symbolValid === false && (
                        <p className="text-sm text-red-600">
                          Invalid ticker symbol. Please check and try again.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Side and Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="side"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BUY">Buy</SelectItem>
                            <SelectItem value="SELL">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cost Estimation */}
                {watchedQuantity && (currentPrice || watchedPrice) && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Estimated Cost</p>
                      {priceLoading && (
                        <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      )}
                    </div>
                    <p className="text-lg font-semibold">
                      ${(((selectedOrderType === 'MARKET' ? currentPrice : watchedPrice) || 0) * watchedQuantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available Balance: ${accountBalance.toFixed(2)}
                    </p>
                    {currentPrice > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Current Price: ${currentPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}

                <TabsContent value="market" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue="MARKET">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MARKET">Market Order</SelectItem>
                            <SelectItem value="LIMIT">Limit Order</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedOrderType === 'LIMIT' && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limit Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue="MARKET">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MARKET">Market Order</SelectItem>
                            <SelectItem value="LIMIT">Limit Order</SelectItem>
                            <SelectItem value="STOP">Stop Order</SelectItem>
                            <SelectItem value="STOP_LIMIT">Stop Limit Order</SelectItem>
                            <SelectItem value="TRAILING_STOP">Trailing Stop</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(selectedOrderType === 'LIMIT' || selectedOrderType === 'STOP_LIMIT') && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limit Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(selectedOrderType === 'STOP' || selectedOrderType === 'STOP_LIMIT' || selectedOrderType === 'TRAILING_STOP') && (
                    <FormField
                      control={form.control}
                      name="stopPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="timeInForce"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time in Force</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue="GTC">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GTC">Good Till Cancelled</SelectItem>
                            <SelectItem value="DAY">Day Only</SelectItem>
                            <SelectItem value="IOC">Immediate or Cancel</SelectItem>
                            <SelectItem value="FOK">Fill or Kill</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <Separator />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || (symbolValid === false && !symbol) || isValidatingSymbol}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                      Placing Order...
                    </>
                  ) : (
                    `Preview ${selectedOrderSide} Order`
                  )}
                </Button>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {pendingOrder && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmedSubmit}
          orderData={pendingOrder}
          estimatedCost={estimatedCost}
          currentBalance={accountBalance}
          isLoading={isSubmitting}
        />
      )}
    </>
  );
};

export default OrderEntryForm;