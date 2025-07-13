import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface WatchlistItem {
  id: string;
  symbol: string;
  lastPrice: string;
  change: string;
}

interface WatchlistProps {
  items?: WatchlistItem[];
  className?: string;
  isLoading?: boolean;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  items = [],
  className,
  isLoading = false,
}) => {
  // Sample watchlist data
  const sampleItems: WatchlistItem[] = [
    {
      id: "1",
      symbol: "AAPL",
      lastPrice: "$173.85",
      change: "+0.65%",
    },
    {
      id: "2",
      symbol: "MSFT",
      lastPrice: "$318.23",
      change: "-0.32%",
    },
    {
      id: "3",
      symbol: "BTC/USD",
      lastPrice: "$26,543.12",
      change: "+1.23%",
    },
    {
      id: "4",
      symbol: "ETH/USD",
      lastPrice: "$1,903.56",
      change: "+0.87%",
    },
    {
      id: "5",
      symbol: "AMZN",
      lastPrice: "$126.75",
      change: "+1.45%",
    },
  ];
  
  const displayItems = items.length ? items : sampleItems;
  
  return (
    <Card className={className}>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-between items-center">
          <CardTitle className="font-semibold">Watchlist</CardTitle>
          <Button variant="ghost" className="text-primary text-sm font-medium">
            <i className="ri-add-line mr-1"></i> Add
          </Button>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-50 dark:bg-neutral-750">
            <TableRow>
              <TableHead className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Symbol</TableHead>
              <TableHead className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Last</TableHead>
              <TableHead className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Chg%</TableHead>
              <TableHead className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                <TableCell className="font-medium">{item.symbol}</TableCell>
                <TableCell>{item.lastPrice}</TableCell>
                <TableCell className={cn(
                  item.change.startsWith("+") ? "text-success" : "text-destructive"
                )}>
                  {item.change}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="link" className="text-primary text-sm">Trade</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default Watchlist;
