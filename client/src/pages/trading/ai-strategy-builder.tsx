import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useSessionStore } from '../../store/session';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ArrowRight, Brain, FlaskConical, LineChart, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BackLink } from "@/components/ui/back-link";

// Define the form schema for creating an AI strategy
const aiStrategyFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  exchange: z.string().min(1, "Exchange is required"),
  timeframe: z.string().min(1, "Timeframe is required"),
  riskLevel: z.string().min(1, "Risk level is required"),
  strategyType: z.string().min(1, "Strategy type is required"),
  investmentAmount: z.coerce.number().min(1, "Investment amount is required"),
  includeOptions: z.boolean().default(false),
  maxPositions: z.coerce.number().optional(),
  tradingHours: z.array(z.string()).optional(),
});

type AIStrategyFormValues = z.infer<typeof aiStrategyFormSchema>;

const exchangeOptions = [
  { value: "NYSE", label: "New York Stock Exchange" },
  { value: "NASDAQ", label: "NASDAQ" },
  { value: "AMEX", label: "American Stock Exchange" },
  { value: "BINANCE", label: "Binance" },
  { value: "KUCOIN", label: "KuCoin" },
  { value: "FTX", label: "FTX" },
  { value: "IBKR", label: "Interactive Brokers" },
  { value: "TIGER", label: "Tiger Brokers" },
];

const timeframeOptions = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
];

const riskLevelOptions = [
  { value: "low", label: "Low Risk" },
  { value: "medium", label: "Medium Risk" },
  { value: "high", label: "High Risk" },
];

const strategyTypeOptions = [
  { value: "trend-following", label: "Trend Following" },
  { value: "mean-reversion", label: "Mean Reversion" },
  { value: "breakout", label: "Breakout" },
  { value: "momentum", label: "Momentum" },
  { value: "swing-trading", label: "Swing Trading" },
  { value: "scalping", label: "Scalping" },
  { value: "position-trading", label: "Position Trading" },
  { value: "pairs-trading", label: "Pairs Trading" },
];

const tradingHoursOptions = [
  { value: "pre-market", label: "Pre-Market (4:00 AM - 9:30 AM ET)" },
  { value: "regular", label: "Regular Market (9:30 AM - 4:00 PM ET)" },
  { value: "after-hours", label: "After-Hours (4:00 PM - 8:00 PM ET)" },
  { value: "overnight", label: "Overnight (8:00 PM - 4:00 AM ET)" },
  { value: "24h", label: "24 Hours (Crypto)" },
];

const AIStrategyBuilder = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const user = useSessionStore(s => s.user);
  const queryClient = useQueryClient();
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState("configure");

  const form = useForm<AIStrategyFormValues>({
    resolver: zodResolver(aiStrategyFormSchema),
    defaultValues: {
      symbol: "",
      exchange: "NYSE",
      timeframe: "1d",
      riskLevel: "medium",
      strategyType: "trend-following",
      investmentAmount: 10000,
      includeOptions: false,
      maxPositions: 5,
      tradingHours: ["regular"],
    },
  });

  // Mutation for generating the AI strategy
  const generateStrategyMutation = useMutation({
    mutationFn: async (data: AIStrategyFormValues) => {
      return await apiRequest("POST", "/api/ai/generate-strategy", data);
    },
    onSuccess: (data) => {
      setGeneratedStrategy(data);
      setCurrentStep("review");
      toast({
        title: "Strategy Generated",
        description: "AI has successfully created a new trading strategy",
      });
      // Invalidate strategies query
      queryClient.invalidateQueries({ queryKey: ["/api/strategy/strategies"] });
    },
    onError: (error: any) => {
      // Handle 404 specifically for unimplemented API
      if (error.status === 404 || error.message?.includes('404')) {
        toast({
          title: "Coming Soon",
          description: "AI Strategy Builder is not yet fully implemented. This feature will be available in a future update.",
          variant: "default",
        });
      } else {
        toast({
          title: "Strategy Generation Failed",
          description: error.message || "An error occurred while generating the strategy. Please try again later.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: AIStrategyFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create an AI strategy",
        variant: "destructive",
      });
      return;
    }
    
    generateStrategyMutation.mutate(data);
  };

  const handleSaveStrategy = () => {
    toast({
      title: "Strategy Saved",
      description: "Your strategy has been saved and is ready to use",
    });
    navigate("/trading/strategies");
  };

  const renderStrategyConfiguration = () => {
    return (
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="AAPL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the stock or cryptocurrency symbol
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exchange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exchange</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an exchange" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exchangeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the exchange where the symbol is traded
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeframe</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeframeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the trading timeframe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="riskLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {riskLevelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select your preferred risk tolerance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strategyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strategy Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select strategy type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {strategyTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of trading strategy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="investmentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the amount you plan to invest
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxPositions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Positions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of positions to hold at once
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeOptions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Include Options Strategies
                      </FormLabel>
                      <FormDescription>
                        Allow the AI to include options in the strategy
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradingHours"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2">
                    <FormLabel>Trading Hours</FormLabel>
                    <FormDescription>
                      Select the trading hours for this strategy
                    </FormDescription>
                    <div className="flex flex-wrap gap-2">
                      {tradingHoursOptions.map((option) => (
                        <Badge
                          key={option.value}
                          variant={
                            field.value?.includes(option.value)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            const updatedHours = field.value?.includes(option.value)
                              ? field.value.filter((hour) => hour !== option.value)
                              : [...(field.value || []), option.value];
                            field.onChange(updatedHours);
                          }}
                        >
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="submit"
                disabled={generateStrategyMutation.isPending}
                className="flex items-center gap-2"
              >
                {generateStrategyMutation.isPending ? (
                  <>
                    <Spinner size="sm" /> Generating Strategy...
                  </>
                ) : (
                  <>
                    Generate AI Strategy <Brain className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  };

  const renderStrategyReview = () => {
    if (!generatedStrategy) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Strategy Generated</AlertTitle>
          <AlertDescription>
            Please generate a strategy first before reviewing.
          </AlertDescription>
        </Alert>
      );
    }

    const { strategy, generated } = generatedStrategy;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{generated.name}</CardTitle>
                <CardDescription>{generated.description}</CardDescription>
              </div>
              <Badge className="ml-2">{strategy.symbol}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="entry-exit">Entry/Exit</TabsTrigger>
                <TabsTrigger value="indicators">Indicators</TabsTrigger>
                <TabsTrigger value="risk">Risk Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Trading Type</h3>
                    <p className="text-sm">{form.getValues().strategyType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Timeframes</h3>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(generated.timeframes) && generated.timeframes.map((timeframe: string) => (
                        <Badge key={timeframe} variant="outline">
                          {timeframe}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Risk Level</h3>
                    <p className="text-sm">{form.getValues().riskLevel}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Investment Amount</h3>
                    <p className="text-sm">${form.getValues().investmentAmount.toLocaleString()}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Expected Performance</h3>
                  {generated.expectedPerformance && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="text-sm font-medium">{generated.expectedPerformance.winRate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Profit Factor</p>
                        <p className="text-sm font-medium">{generated.expectedPerformance.profitFactor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Max Drawdown</p>
                        <p className="text-sm font-medium">{generated.expectedPerformance.maxDrawdown}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Risk-Reward Ratio</p>
                        <p className="text-sm font-medium">{generated.expectedPerformance.averageRRR}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="entry-exit" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Entry Conditions</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Primary</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {Array.isArray(generated.entryConditions?.primary) && 
                            generated.entryConditions.primary.map((condition: string, index: number) => (
                              <li key={index}>{condition}</li>
                            ))}
                        </ul>
                        
                        {generated.entryConditions?.confirmation && (
                          <>
                            <h4 className="text-sm font-medium mt-3">Confirmation</h4>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              {Array.isArray(generated.entryConditions.confirmation) && 
                                generated.entryConditions.confirmation.map((condition: string, index: number) => (
                                  <li key={index}>{condition}</li>
                                ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Exit Conditions</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium">Take Profit</h4>
                          <p className="text-sm">{generated.exitConditions?.takeProfit}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium">Stop Loss</h4>
                          <p className="text-sm">{generated.exitConditions?.stopLoss}</p>
                        </div>
                        
                        {generated.exitConditions?.timeBasedExit && (
                          <div>
                            <h4 className="text-sm font-medium">Time-Based Exit</h4>
                            <p className="text-sm">{generated.exitConditions.timeBasedExit}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="indicators" className="space-y-4">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {generated.indicators && Object.entries(generated.indicators).map(([name, settings]: [string, any]) => (
                      <div key={name} className="pb-3 border-b last:border-0">
                        <h4 className="text-sm font-medium">{name}</h4>
                        <p className="text-sm mt-1">{settings}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="risk" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Position Sizing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{generated.positionSizing}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Stop Loss</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {generated.stopLoss && Object.entries(generated.stopLoss).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm font-medium">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Risk Management Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {generated.riskManagement && Object.entries(generated.riskManagement).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep("configure")}>
              Edit Parameters
            </Button>
            <Button onClick={handleSaveStrategy}>
              Save Strategy
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className='p-4'>
      <div className="space-y-8">
        <BackLink href="/trading">← Back to Trading</BackLink>
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold font-poppins text-neutral-900 dark:text-white">AI Strategy Builder</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Create and optimize trading strategies using artificial intelligence</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">AI Trading Strategy Generator</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI will create a customized trading strategy based on your preferences and risk tolerance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-3">
            <div className="space-y-4 sticky top-4">
              <div 
                className={`flex items-center p-3 rounded-md cursor-pointer ${
                  currentStep === "configure" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
                onClick={() => setCurrentStep("configure")}
              >
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-background">
                  <FlaskConical className={`h-4 w-4 ${currentStep === "configure" ? "text-primary" : ""}`} />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Configure</h4>
                  <p className="text-xs">Set strategy parameters</p>
                </div>
              </div>

              <div 
                className={`flex items-center p-3 rounded-md cursor-pointer ${
                  currentStep === "review" ? "bg-primary text-primary-foreground" : "bg-muted"
                } ${!generatedStrategy ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => generatedStrategy && setCurrentStep("review")}
              >
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-background">
                  <LineChart className={`h-4 w-4 ${currentStep === "review" ? "text-primary" : ""}`} />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Review</h4>
                  <p className="text-xs">Analyze generated strategy</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-9">
            {currentStep === "configure" && renderStrategyConfiguration()}
            {currentStep === "review" && renderStrategyReview()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStrategyBuilder;