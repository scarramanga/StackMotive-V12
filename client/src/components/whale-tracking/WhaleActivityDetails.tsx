import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PlusCircle, Eye, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface WhaleActivityDetailsProps {
  activity: any;
  formatCurrency: (value: string) => string;
  formatDate: (date: string) => string;
  isUserAuthenticated?: boolean;
  watchlistSymbols?: string[];
}

export const WhaleActivityDetails: React.FC<WhaleActivityDetailsProps> = ({
  activity,
  formatCurrency,
  formatDate,
  isUserAuthenticated,
  watchlistSymbols = []
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inWatchlist = watchlistSymbols.includes(activity.symbol);

  // Mutation to add to watchlist
  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/watchlist', {
        symbol: activity.symbol,
        exchange: activity.exchange || 'Unknown',
        notes: `Added from Whale Activity tracking: ${activity.institution} ${activity.action.toLowerCase()} ${formatCurrency(activity.valueUsd)}`
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Watchlist",
        description: `${activity.symbol} has been added to your watchlist`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add to watchlist. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to add to watchlist:", error);
    }
  });
  if (!activity) return null;

  // Get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
      case 'ACCUMULATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'SELL':
      case 'DISTRIBUTE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{activity.symbol} - {activity.institution}</h2>
        {isUserAuthenticated && (
          <div>
            {inWatchlist ? (
              <Button variant="outline" size="sm" disabled>
                <Check className="mr-2 h-4 w-4" />
                In Watchlist
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addToWatchlistMutation.mutate()}
                disabled={addToWatchlistMutation.isPending}
              >
                {addToWatchlistMutation.isPending ? (
                  <div className="animate-spin mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent"></div>
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Add to Watchlist
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Symbol</h3>
          <p className="text-lg font-semibold">{activity.symbol}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Institution</h3>
          <p className="text-lg font-semibold">{activity.institution}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Action</h3>
          <Badge className={getActionColor(activity.action)}>
            {activity.action}
          </Badge>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Transaction Date</h3>
          <p className="text-lg">{formatDate(activity.transactionDate)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
          <p className="text-lg font-semibold">{parseInt(activity.amount).toLocaleString()}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Value (USD)</h3>
          <p className="text-lg font-semibold">{formatCurrency(activity.valueUsd)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Source</h3>
          <p className="text-lg">{activity.source}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Confidence</h3>
          <p className="text-lg">{(activity.confidence * 100).toFixed(0)}%</p>
        </div>
        {activity.filingType && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Filing Type</h3>
            <p className="text-lg">{activity.filingType}</p>
          </div>
        )}
        {activity.transactionType && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Transaction Type</h3>
            <p className="text-lg">{activity.transactionType}</p>
          </div>
        )}
      </div>

      {activity.notes && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
            <p className="text-md">{activity.notes}</p>
          </div>
        </>
      )}

      {activity.networkDetails && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Network Details</h3>
            <div className="bg-muted p-4 rounded-md">
              <div className="grid grid-cols-1 gap-2">
                {activity.networkDetails.blockchain && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Blockchain:</span>{' '}
                    <span>{activity.networkDetails.blockchain}</span>
                  </div>
                )}
                {activity.networkDetails.txHash && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Transaction Hash:</span>{' '}
                    <span className="font-mono text-xs break-all">{activity.networkDetails.txHash}</span>
                  </div>
                )}
                {activity.networkDetails.fromAddress && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">From Address:</span>{' '}
                    <span className="font-mono text-xs break-all">{activity.networkDetails.fromAddress}</span>
                  </div>
                )}
                {activity.networkDetails.toAddress && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">To Address:</span>{' '}
                    <span className="font-mono text-xs break-all">{activity.networkDetails.toAddress}</span>
                  </div>
                )}
                {activity.networkDetails.toAddresses && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">To Addresses:</span>{' '}
                    <div className="pl-4">
                      {activity.networkDetails.toAddresses.map((address: string, index: number) => (
                        <p key={index} className="font-mono text-xs break-all">{address}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};