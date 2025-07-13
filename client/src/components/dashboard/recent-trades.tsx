import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  name?: string;
  type: "BUY" | "SELL";
  entryPrice: string;
  exitPrice: string | null;
  profitLoss: string;
  status: "open" | "canceled" | "executed" | "pending";
  quantity?: number;
  executedAt?: string;
  totalValue?: number;
  strategy?: string;
  isManual?: boolean;
}

interface RecentTradesProps {
  trades?: Trade[];
  className?: string;
  isLoading?: boolean;
}

export const RecentTrades: React.FC<RecentTradesProps> = ({
  trades = [],
  className,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<"all" | "executed" | "pending">("all");

  // 🧪 DIAGNOSTIC: Log total trades and filtering
  React.useEffect(() => {
    const executedCount = trades.filter(trade => trade.status === 'executed').length;
    const pendingCount = trades.filter(trade => trade.status === 'pending' || trade.status === 'open').length;
    
    console.log("🧪 HistoricPanel Loaded:", { 
      totalTrades: trades.length, 
      executed: executedCount, 
      pending: pendingCount,
      filteringFor: 'executed trades only'
    });
  }, [trades]);

  React.useEffect(() => {
    console.log("✅ Historic Trading Activity filter changed:", filter);
  }, [filter]);

  // Filter trades to ONLY show executed trades for Historic Trading Activity
  const executedTrades = React.useMemo(() => {
    const filtered = trades.filter(trade => trade.status === 'executed');
    console.log("✅ Filtered executed trades:", filtered);
    return filtered.slice(0, 10); // Show up to 10 recent executed trades
  }, [trades]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Historic Trading Activity</CardTitle>
          <CardDescription>Your executed trades and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!executedTrades.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Historic Trading Activity</CardTitle>
          <CardDescription>Your executed trades and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No executed trades yet</p>
            <p className="text-sm">Your completed trades will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(isNaN(numValue) ? 0 : numValue);
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Historic Trading Activity</CardTitle>
              <CardDescription>Your executed trades and their performance</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {executedTrades.length} Executed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executedTrades.map((trade) => {
              const isProfit = trade.profitLoss.startsWith('+');
              const tradeValue = trade.totalValue || (trade.quantity || 1) * parseFloat(trade.entryPrice.replace(/[$,]/g, ''));
              
              return (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    {/* Trade Direction Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      trade.type === 'BUY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    )}>
                      {trade.type === 'BUY' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>

                    {/* Trade Details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">{trade.symbol}</span>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          trade.type === 'BUY' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        )}>
                          {trade.type}
                        </Badge>
                        
                        {/* Quantity */}
                        {trade.quantity && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-xs text-gray-500">
                                {trade.quantity} {trade.symbol.includes('BTC') ? 'BTC' : 'shares'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Quantity: {trade.quantity}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {/* Execution Price */}
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{trade.entryPrice}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Execution Price: {trade.entryPrice}</p>
                            {trade.totalValue && <p>Total Value: {formatCurrency(trade.totalValue)}</p>}
                          </TooltipContent>
                        </Tooltip>

                        {/* Timestamp */}
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(trade.executedAt)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Executed: {formatDate(trade.executedAt)}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Trade Origin */}
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {trade.strategy ? 'Strategy' : trade.isManual ? 'Manual' : 'Auto'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Origin: {trade.strategy ? `Strategy: ${trade.strategy}` : trade.isManual ? 'Manual Trade' : 'Automated'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {/* Profit/Loss Display */}
                  <div className="text-right">
                    <div className={cn(
                      "font-semibold text-sm",
                      isProfit ? "text-green-600" : "text-red-600"
                    )}>
                      {trade.profitLoss}
                    </div>
                    {trade.name && (
                      <div className="text-xs text-gray-500 truncate max-w-24">
                        {trade.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        
        {executedTrades.length >= 10 && (
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              View All Executed Trades
            </Button>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  );
};

export default RecentTrades;
