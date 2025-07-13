import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketMover {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  price: string;
  change: string;
}

interface MarketMoversProps {
  movers?: MarketMover[];
  className?: string;
  isLoading?: boolean;
}

export const MarketMovers: React.FC<MarketMoversProps> = ({
  movers = [],
  className,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<"stocks" | "crypto">("stocks");
  
  // Filter movers based on type
  const displayMovers = movers.filter(mover => 
    filter === "stocks" ? mover.exchange !== "Spot" : mover.exchange === "Spot"
  );
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Market Movers</CardTitle>
          <CardDescription>Top gainers and losers</CardDescription>
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

  if (!movers.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Market Movers</CardTitle>
          <CardDescription>No market data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Market data is currently unavailable.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Market Movers</CardTitle>
            <CardDescription>Top gainers and losers</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={filter === "stocks" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("stocks")}
            >
              Stocks
            </Button>
            <Button
              variant={filter === "crypto" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("crypto")}
            >
              Crypto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayMovers.map((mover) => (
            <div key={mover.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{mover.symbol}</div>
                <div className="text-sm text-muted-foreground">{mover.name}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{mover.price}</div>
                <div className={cn(
                  "text-sm",
                  mover.change.startsWith("+") ? "text-green-600" : "text-red-600"
                )}>
                  {mover.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketMovers;
