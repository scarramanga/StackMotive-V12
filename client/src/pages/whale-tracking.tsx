import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BackLink } from '@/components/ui/back-link';
import { useToast } from '@/hooks/use-toast';
import { WhaleActivityDetails } from '@/components/whale-tracking/WhaleActivityDetails';
import { WhaleActivityFilters } from '@/components/whale-tracking/WhaleActivityFilters';
import { WhaleActivityStats } from '@/components/whale-tracking/WhaleActivityStats';
import { cn } from '@/lib/utils';

/**
 * WhaleTrackingPage - Displays large institutional investor activity tracking
 */
export default function WhaleTrackingPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [showPortfolioOnly, setShowPortfolioOnly] = useState<boolean>(false);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Check if user is authenticated
  const { data: user } = useQuery({
    queryKey: ['/api/user/me'],
  });
  
  const isUserAuthenticated = !!user;

  // Fetch user's watchlist
  const { data: watchlistItems } = useQuery({
    queryKey: ['/api/watchlist'],
    enabled: isUserAuthenticated, // Always fetch if authenticated for badges
    staleTime: 60000
  });
  
  // Fetch user's portfolio (trades)
  const { data: trades } = useQuery({
    queryKey: ['/api/trades'],
    enabled: isUserAuthenticated, // Always fetch if authenticated for badges
    staleTime: 60000
  });
  
  // Extract symbols from watchlist and portfolio for filtering
  const watchlistSymbols = useMemo(() => {
    if (!watchlistItems || !Array.isArray(watchlistItems)) return [];
    return watchlistItems.map((item: any) => item.symbol);
  }, [watchlistItems]);
  
  const portfolioSymbols = useMemo(() => {
    if (!trades || !Array.isArray(trades)) return [];
    return Array.from(new Set(trades.map((trade: any) => trade.symbol)));
  }, [trades]);
  
  // Fetch whale activities
  const { data: whaleActivities, isLoading, error } = useQuery({
    queryKey: ['/api/whale-activities', selectedSymbol, selectedInstitution, timeframe],
    staleTime: 60000,
    refetchInterval: 300000, // Refresh every 5 minutes
    select: (data: any) => {
      if (!data || !Array.isArray(data)) return [];
      return data; // Temporarily return raw data without filtering
    }
  });

  // Apply filtering logic after the query to avoid infinite re-renders
  const filteredWhaleActivities = useMemo(() => {
    if (!whaleActivities || !Array.isArray(whaleActivities)) return [];
    
    let filtered = whaleActivities;
    
    // Apply portfolio filter
    if (showPortfolioOnly && portfolioSymbols.length > 0) {
      filtered = filtered.filter((activity: any) => 
        portfolioSymbols.includes(activity.symbol)
      );
    }
    
    // Apply watchlist filter  
    if (showWatchlistOnly && watchlistSymbols.length > 0) {
      filtered = filtered.filter((activity: any) => 
        watchlistSymbols.includes(activity.symbol)
      );
    }
    
    return filtered;
  }, [whaleActivities, showPortfolioOnly, showWatchlistOnly, portfolioSymbols, watchlistSymbols]);

  // Fetch unique institutions for filter
  const { data: institutions } = useQuery({
    queryKey: ['/api/whale-activities/institutions'],
    staleTime: 3600000 // Cache for 1 hour
  });

  // Format currency values
  const formatCurrency = useCallback((value: string) => {
    const num = parseInt(value);
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toLocaleString()}`;
  }, []);

  // Get action badge color
  const getActionColor = useCallback((action: string) => {
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
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  }, []);

  // Handle error toast in useEffect to prevent infinite re-renders
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading whale activity data",
        description: "There was an error loading the data. Please try again later."
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className='p-4'>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <div className="p-6 space-y-6">
        <BackLink href="/dashboard">← Back to Dashboard</BackLink>
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Whale Activity Tracking</h1>
          <p className="text-muted-foreground">
            Monitor large institutional investors and their market movements
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-full sm:w-44 transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectGroup>
                  <SelectLabel className="dark:text-gray-300">Timeframe</SelectLabel>
                  <SelectItem value="1d" className="dark:hover:bg-gray-700">Last 24 Hours</SelectItem>
                  <SelectItem value="7d" className="dark:hover:bg-gray-700">Last 7 Days</SelectItem>
                  <SelectItem value="30d" className="dark:hover:bg-gray-700">Last 30 Days</SelectItem>
                  <SelectItem value="90d" className="dark:hover:bg-gray-700">Last 90 Days</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <WhaleActivityFilters
              selectedSymbol={selectedSymbol}
              onSymbolChange={setSelectedSymbol}
              selectedInstitution={selectedInstitution}
              onInstitutionChange={setSelectedInstitution}
              institutions={institutions || []}
              showPortfolioOnly={showPortfolioOnly}
              onPortfolioOnlyChange={setShowPortfolioOnly}
              showWatchlistOnly={showWatchlistOnly}
              onWatchlistOnlyChange={setShowWatchlistOnly}
              isAuthenticated={isUserAuthenticated}
            />
          </div>
        </div>

        <WhaleActivityStats activities={filteredWhaleActivities} />

        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="rounded-xl">
            <TabsTrigger 
              value="activity" 
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Recent Activity
            </TabsTrigger>
            <TabsTrigger 
              value="institutions" 
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Top Institutions
            </TabsTrigger>
            <TabsTrigger 
              value="symbols" 
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Most Active Symbols
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg font-medium">Recent Whale Activity</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Latest large institutional trades and movements
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {filteredWhaleActivities.length} activities found
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {filteredWhaleActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Whale Activity Found</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Try adjusting your filters or check back later for new institutional trading activity.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden shadow-sm dark:border-gray-700">
                    <Table>
                      <TableHeader className="bg-muted/30 dark:bg-gray-800/50">
                        <TableRow>
                          <TableHead className="font-medium">Symbol</TableHead>
                          <TableHead className="font-medium">Institution</TableHead>
                          <TableHead className="font-medium">Action</TableHead>
                          <TableHead className="font-medium">Amount</TableHead>
                          <TableHead className="font-medium">Price Impact</TableHead>
                          <TableHead className="font-medium">Date</TableHead>
                          <TableHead className="text-right font-medium">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWhaleActivities.map((activity: any) => (
                          <TableRow 
                            key={activity.id} 
                            className="transition-all hover:bg-muted/50 dark:hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => setSelectedActivity(activity.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{activity.symbol}</span>
                                {watchlistSymbols.includes(activity.symbol) && (
                                  <Badge variant="secondary" className="text-xs">
                                    Watchlist
                                  </Badge>
                                )}
                                {portfolioSymbols.includes(activity.symbol) && (
                                  <Badge variant="default" className="text-xs">
                                    Portfolio
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {activity.institution || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={cn(
                                  "text-xs transition-all",
                                  getActionColor(activity.action)
                                )}
                              >
                                {activity.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(activity.amount)}
                            </TableCell>
                            <TableCell className={cn(
                              "font-medium",
                              parseFloat(activity.priceImpact) > 0 
                                ? "text-green-600 dark:text-green-400" 
                                : "text-red-600 dark:text-red-400"
                            )}>
                              {activity.priceImpact}%
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(activity.timestamp)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="transition-all hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none"
                                  >
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg font-medium">
                                      Whale Activity Details
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-muted-foreground">
                                      Detailed information about this institutional trade
                                    </DialogDescription>
                                  </DialogHeader>
                                  <WhaleActivityDetails activity={activity} />
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="institutions" className="space-y-6">
            <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Top Active Institutions</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Most active institutional traders in the selected timeframe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Institution Analysis</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Detailed institutional analysis and rankings coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="symbols" className="space-y-6">
            <Card className="rounded-xl shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Most Active Symbols</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Assets with the highest whale activity volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Symbol Analysis</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Symbol-specific whale activity analysis and trends coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}