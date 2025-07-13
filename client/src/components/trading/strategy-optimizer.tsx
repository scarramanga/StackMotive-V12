import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Brain, FlaskConical, MoveHorizontal, Zap } from "lucide-react";

// Define the form schema for strategy optimization
const strategyOptimizationSchema = z.object({
  optimizationTarget: z.string().min(1, "Optimization target is required"),
  iterations: z.coerce.number().min(1, "Number of iterations is required").max(100, "Maximum 100 iterations allowed"),
  timeframe: z.string().min(1, "Timeframe is required"),
  dataRange: z.enum(["1m", "3m", "6m", "1y", "2y", "5y", "max"]),
});

type StrategyOptimizationValues = z.infer<typeof strategyOptimizationSchema>;

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

const optimizationTargetOptions = [
  { value: "maxProfit", label: "Maximum Profit" },
  { value: "sharpeRatio", label: "Sharpe Ratio" },
  { value: "minDrawdown", label: "Minimum Drawdown" },
  { value: "winRate", label: "Win Rate" },
  { value: "profitFactor", label: "Profit Factor" },
  { value: "balance", label: "Balanced (Multiple Factors)" },
];

const dataRangeOptions = [
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" },
  { value: "5y", label: "5 Years" },
  { value: "max", label: "Maximum Available" },
];

interface StrategyOptimizerProps {
  strategy: any;
  onOptimized?: (optimizedStrategy: any) => void;
}

const StrategyOptimizer: React.FC<StrategyOptimizerProps> = ({ 
  strategy, 
  onOptimized 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [optimizedStrategy, setOptimizedStrategy] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<StrategyOptimizationValues>({
    resolver: zodResolver(strategyOptimizationSchema),
    defaultValues: {
      optimizationTarget: "sharpeRatio",
      iterations: 20,
      timeframe: "1d",
      dataRange: "1y",
    },
  });

  // Mock historical data generator (replace with actual data fetch in production)
  const generateHistoricalData = (symbol: string, timeframe: string, dataRange: string) => {
    // This would be replaced by a real API call to fetch historical data
    const dataPoints = dataRange === "1m" ? 30 : 
                     dataRange === "3m" ? 90 : 
                     dataRange === "6m" ? 180 : 
                     dataRange === "1y" ? 365 : 
                     dataRange === "2y" ? 730 : 
                     dataRange === "5y" ? 1825 : 2000;
    
    const data = [];
    let date = new Date();
    let price = 100;
    
    for (let i = 0; i < dataPoints; i++) {
      // Create a random price movement
      const change = (Math.random() - 0.49) * 2;
      price = price * (1 + change / 100);
      
      // Create a slightly random volume
      const volume = Math.floor(10000 + Math.random() * 5000);
      
      // Adjust date based on timeframe
      const newDate = new Date(date);
      if (timeframe === "1m") newDate.setMinutes(date.getMinutes() - 1);
      else if (timeframe === "5m") newDate.setMinutes(date.getMinutes() - 5);
      else if (timeframe === "15m") newDate.setMinutes(date.getMinutes() - 15);
      else if (timeframe === "30m") newDate.setMinutes(date.getMinutes() - 30);
      else if (timeframe === "1h") newDate.setHours(date.getHours() - 1);
      else if (timeframe === "4h") newDate.setHours(date.getHours() - 4);
      else if (timeframe === "1d") newDate.setDate(date.getDate() - 1);
      else if (timeframe === "1w") newDate.setDate(date.getDate() - 7);
      
      date = newDate;
      
      // Calculate high and low prices
      const high = price * (1 + Math.random() / 100);
      const low = price * (1 - Math.random() / 100);
      const open = price * (1 + (Math.random() - 0.5) / 100);
      
      data.push({
        date: date.toISOString(),
        open,
        high,
        low,
        close: price,
        volume,
      });
    }
    
    // Reverse array to get chronological order
    return data.reverse();
  };

  // Mutation for optimizing the strategy
  const optimizeStrategyMutation = useMutation({
    mutationFn: async (formData: StrategyOptimizationValues) => {
      // Generate historical data for optimization
      const historicalData = generateHistoricalData(
        strategy.symbol,
        formData.timeframe,
        formData.dataRange
      );
      
      const payload = {
        historicalData,
        optimizationParams: {
          optimizationTarget: formData.optimizationTarget,
          iterations: formData.iterations,
          timeframe: formData.timeframe,
        },
      };
      
      const response = await apiRequest(
        "POST", 
        `/api/ai/optimize-strategy/${strategy.id}`, 
        payload
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to optimize strategy");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizedStrategy(data);
      setShowResults(true);
      toast({
        title: "Strategy Optimized",
        description: "ML optimization has improved your trading strategy",
      });
      // Invalidate strategies query
      queryClient.invalidateQueries({ queryKey: ["/api/strategy/strategies"] });
      
      if (onOptimized) {
        onOptimized(data.optimized);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StrategyOptimizationValues) => {
    optimizeStrategyMutation.mutate(data);
  };

  const renderOptimizationForm = () => {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="optimizationTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optimization Target</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select optimization target" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {optimizationTargetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select what you want to optimize for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iterations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Iterations</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of optimization iterations (higher = more thorough but slower)
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
                    Select the trading timeframe for optimization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Historical Data Range</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-2"
                  >
                    {dataRangeOptions.map((option) => (
                      <FormItem key={option.value} className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value={option.value} />
                        </FormControl>
                        <FormLabel className="text-sm cursor-pointer">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                  <FormDescription>
                    Amount of historical data to use
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={optimizeStrategyMutation.isPending}
              className="flex items-center gap-2"
            >
              {optimizeStrategyMutation.isPending ? (
                <>
                  <Spinner size="sm" /> Optimizing...
                </>
              ) : (
                <>
                  Optimize Strategy <FlaskConical className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  const renderOptimizationResults = () => {
    if (!optimizedStrategy) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            No optimization results available yet.
          </AlertDescription>
        </Alert>
      );
    }

    const { strategy: updatedStrategy, optimized } = optimizedStrategy;
    
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2">Optimization Summary</h3>
          <p className="text-sm">{optimized.description || "Strategy optimized successfully."}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Before Optimization</h3>
            {strategy.expectedPerformance && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Win Rate:</span>
                  <span className="text-sm font-medium">{strategy.expectedPerformance.winRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Profit Factor:</span>
                  <span className="text-sm font-medium">{strategy.expectedPerformance.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Max Drawdown:</span>
                  <span className="text-sm font-medium">{strategy.expectedPerformance.maxDrawdown}</span>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">After Optimization</h3>
            {optimized.expectedPerformance && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Win Rate:</span>
                  <span className="text-sm font-medium">{optimized.expectedPerformance.winRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Profit Factor:</span>
                  <span className="text-sm font-medium">{optimized.expectedPerformance.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Max Drawdown:</span>
                  <span className="text-sm font-medium">{optimized.expectedPerformance.maxDrawdown}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-4">
          <h3 className="text-sm font-medium mb-2">Major Changes</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {/* These would be dynamically generated from the actual optimization results */}
            <li>Adjusted RSI thresholds for better entry timing</li>
            <li>Modified stop-loss placement to reduce drawdowns</li>
            <li>Optimized moving average periods for current market conditions</li>
            <li>Refined profit-taking levels for improved risk/reward</li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowResults(false)}>
            Back to Optimizer
          </Button>
          <Button onClick={() => setOpen(false)}>
            Apply Optimizations
          </Button>
        </DialogFooter>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Brain className="h-4 w-4" /> ML Optimize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Machine Learning Strategy Optimizer
          </DialogTitle>
          <DialogDescription>
            Optimize "{strategy.name}" using machine learning to improve performance
          </DialogDescription>
        </DialogHeader>
        
        {showResults ? renderOptimizationResults() : renderOptimizationForm()}
      </DialogContent>
    </Dialog>
  );
};

export default StrategyOptimizer;