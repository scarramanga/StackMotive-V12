import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Strategy {
  id: string;
  name: string;
  description: string;
  status: "active" | "pending" | "paused" | "stopped";
  performance?: string;
  timeframe?: string;
  icon?: string;
}

interface ActiveStrategiesProps {
  strategies?: Strategy[];
  className?: string;
  isLoading?: boolean;
}

export const ActiveStrategies: React.FC<ActiveStrategiesProps> = ({
  strategies = [],
  className,
  isLoading = false,
}) => {
  // Sample strategies data
  const sampleStrategies: Strategy[] = [
    {
      id: "1",
      name: "Golden Cross Strategy",
      description: "50 EMA crosses above 200 EMA on AAPL",
      status: "active",
      performance: "+12.3%",
      timeframe: "Last 30 days",
      icon: "ri-robot-line",
    },
    {
      id: "2",
      name: "RSI Reversal",
      description: "Buy when RSI(14) < 30 on BTC/USD",
      status: "active",
      performance: "+8.7%",
      timeframe: "Last 30 days",
      icon: "ri-robot-line",
    },
    {
      id: "3",
      name: "MACD Momentum",
      description: "MACD crossover on ETH/USD",
      status: "pending",
      timeframe: "Awaiting signal",
      icon: "ri-robot-line",
    },
  ];
  
  const displayStrategies = strategies.length ? strategies : sampleStrategies;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-success bg-opacity-10 text-success">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-warning bg-opacity-10 text-warning">Pending</Badge>;
      case "paused":
        return <Badge variant="outline" className="bg-info bg-opacity-10 text-info">Paused</Badge>;
      case "stopped":
        return <Badge variant="outline" className="bg-destructive bg-opacity-10 text-destructive">Stopped</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-between items-center">
          <CardTitle className="font-semibold">Active Trading Strategies</CardTitle>
          <Button variant="ghost" className="text-primary text-sm font-medium">
            <i className="ri-add-line mr-1"></i> New Strategy
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 divide-y divide-neutral-200 dark:divide-neutral-700">
        {displayStrategies.map((strategy) => (
          <div key={strategy.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-750">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`h-8 w-8 rounded-full ${strategy.status === 'pending' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-success bg-opacity-10 text-success'} flex items-center justify-center mr-3`}>
                  <i className={strategy.icon || "ri-robot-line"}></i>
                </div>
                <div>
                  <h4 className="font-medium">{strategy.name}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{strategy.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(strategy.status)}
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "font-medium",
                    strategy.performance?.startsWith("+") ? "text-success" : 
                    strategy.performance?.startsWith("-") ? "text-destructive" : 
                    "text-neutral-500 dark:text-neutral-400"
                  )}>
                    {strategy.performance || "--"}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{strategy.timeframe}</span>
                </div>
                <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                  <i className="ri-more-2-fill"></i>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="p-3 text-center border-t border-neutral-200 dark:border-neutral-700">
        <Button variant="link" className="text-primary text-sm font-medium mx-auto">
          View All Strategies
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ActiveStrategies;
