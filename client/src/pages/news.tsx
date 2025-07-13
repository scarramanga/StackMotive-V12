import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bell,
  ChevronDown,
  Clock,
  ExternalLink,
  Filter,
  Info,
  LineChart,
  MoreHorizontal,
  RefreshCcw,
  SearchIcon,
  Share2,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  MinusCircle
} from 'lucide-react';
import AutomationPreferences from '@/components/news/automation-preferences';
import { useToast } from '@/hooks/use-toast';
import { useNewsRelevance } from '@/hooks/useNewsRelevance';

/**
 * News page that displays market news with sentiment analysis and automation options
 */
export default function NewsPage() {
  const { toast } = useToast();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<string>('market');
  const [aiCurated, setAiCurated] = useState(true);
  
  // Fetch news articles
  const { data: newsArticles = [], isLoading: isLoadingNews, refetch: refetchNews } = useQuery({
    queryKey: ['/api/news', selectedSymbol, sentimentFilter],
    queryFn: async () => {
      let endpoint = '/api/news';
      const params = new URLSearchParams();
      
      if (selectedSymbol && selectedSymbol !== 'all') {
        params.append('symbol', selectedSymbol);
      }
      
      if (sentimentFilter && sentimentFilter !== 'all') {
        params.append('sentiment', sentimentFilter);
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return response.json();
    }
  });
  
  // Fetch trading signals for current user
  const { data: tradingSignals = [], isLoading: isLoadingSignals } = useQuery({
    queryKey: ['trading-signals'],
    queryFn: async () => {
      const response = await fetch('/api/trading-signals');
      if (!response.ok) return [];
      return response.json();
    },
  });
  
  // Fetch watchlist items to populate dropdown
  const { data: watchlistItems = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const response = await fetch('/api/watchlist');
      if (!response.ok) return [];
      return response.json();
    },
  });
  
  // Fetch portfolio holdings (symbols)
  const holdings = watchlistItems.map((item: any) => item.symbol);
  // Score news relevance
  const newsWithRelevance = useNewsRelevance(newsArticles, holdings);
  // Filter for AI-curated feed if enabled
  const displayedNews = aiCurated ? newsWithRelevance.filter(n => n.relevance > 50) : newsWithRelevance;
  
  // Filter news based on search query
  const filteredNews = searchQuery ? 
    displayedNews.filter((article: any) => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : 
    displayedNews;
  
  // Helper to render sentiment badge
  const renderSentimentBadge = (sentiment: string, score?: number) => {
    switch (sentiment) {
      case 'positive':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <TrendingUp className="w-3 h-3 mr-1" />
            Bullish {score ? `(${(score * 100).toFixed(0)}%)` : ''}
          </Badge>
        );
      case 'negative':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <TrendingDown className="w-3 h-3 mr-1" />
            Bearish {score ? `(${(score * 100).toFixed(0)}%)` : ''}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <LineChart className="w-3 h-3 mr-1" />
            Neutral
          </Badge>
        );
    }
  };
  
  // Handle creating trading signal from news
  const handleCreateSignal = (article: any) => {
    // Here you would typically open a modal to configure the signal
    // For simplicity, we'll just show a toast
    toast({
      title: "Signal Created",
      description: "Trading signal has been created based on this news.",
    });
  };
  
  return (
    <div className='p-4'>
      <div className="container mx-auto py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </button>
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">News & Events</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Stay updated with market news and create trading signals
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <AutomationPreferences userId={1} />
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => refetchNews()}
            >
              <RefreshCcw size={16} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="market" onValueChange={setCurrentTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="market">Market News</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist News</TabsTrigger>
              <TabsTrigger value="signals">Trading Signals</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search news..."
                  className="pl-8 w-[200px] md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Filter size={16} />
                    <span>Filter</span>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Sentiment</p>
                    <Select 
                      value={sentimentFilter} 
                      onValueChange={setSentimentFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by sentiment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sentiments</SelectItem>
                        <SelectItem value="positive">Bullish</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Bearish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Symbol</p>
                    <Select 
                      value={selectedSymbol} 
                      onValueChange={setSelectedSymbol}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select symbol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Symbols</SelectItem>
                        {(watchlistItems as any[]).map((item: any) => (
                          <SelectItem key={item.id} value={item.symbol}>
                            {item.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <TabsContent value="market" className="space-y-4">
            {isLoadingNews ? (
              // Skeleton loading state
              Array(5).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-6 w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-24" />
                  </CardFooter>
                </Card>
              ))
            ) : filteredNews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No news articles found. Try adjusting your filters or check back later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNews.map((article: any) => (
                <NewsCard 
                  key={article.id}
                  article={article}
                  renderSentimentBadge={renderSentimentBadge}
                  onCreateSignal={handleCreateSignal}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="watchlist" className="space-y-4">
            {!selectedSymbol || selectedSymbol === 'all' ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Please select a symbol from your watchlist to view related news.
                  </p>
                </CardContent>
              </Card>
            ) : isLoadingNews ? (
              // Skeleton loading state
              Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-6 w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-24" />
                  </CardFooter>
                </Card>
              ))
            ) : filteredNews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No news articles found for {selectedSymbol}. Try another symbol or check back later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNews.map((article: any) => (
                <NewsCard 
                  key={article.id}
                  article={article}
                  renderSentimentBadge={renderSentimentBadge}
                  onCreateSignal={handleCreateSignal}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="signals" className="space-y-4">
            {isLoadingSignals ? (
              // Skeleton loading state
              Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-6 w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : (tradingSignals as any[]).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No trading signals generated yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              (tradingSignals as any[]).map((signal: any) => (
                <SignalCard 
                  key={signal.id}
                  signal={signal}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={aiCurated} onChange={e => setAiCurated(e.target.checked)} />
            AI-curated feed (relevance {'>'}  50)
          </label>
        </div>
        <div className="grid gap-4">
          {filteredNews.map((article, idx) => (
            <div key={idx} className="p-4 rounded border bg-white dark:bg-gray-900 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{article.title}</span>
                <Badge className="ml-2">Relevance: {article.relevance}</Badge>
                {article.riskFlag === 'on' && (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="w-3 h-3 mr-1" /> Risk: ON
                  </Badge>
                )}
                {article.riskFlag === 'off' && (
                  <Badge className="bg-green-100 text-green-800">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Risk: OFF
                  </Badge>
                )}
                {article.riskFlag === 'neutral' && (
                  <Badge className="bg-gray-100 text-gray-800">
                    <MinusCircle className="w-3 h-3 mr-1" /> Neutral
                  </Badge>
                )}
              </div>
              {article.description && (
                <div className="text-sm text-gray-600 dark:text-gray-300">{article.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface NewsCardProps {
  article: any;
  renderSentimentBadge: (sentiment: string, score?: number) => React.ReactNode;
  onCreateSignal: (article: any) => void;
}

function NewsCard({ article, renderSentimentBadge, onCreateSignal }: NewsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>{article.source}</span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {article.publishedAt ? format(new Date(article.publishedAt), 'MMM d, yyyy') : 'N/A'}
              </span>
              {article.symbol && (
                <>
                  <span>•</span>
                  <Badge variant="outline">{article.symbol}</Badge>
                </>
              )}
            </div>
            <CardTitle className="text-xl">{article.title}</CardTitle>
          </div>
          
          {article.sentiment && (
            <div>{renderSentimentBadge(article.sentiment, article.sentimentScore)}</div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground">
          {article.description || 'No description available.'}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(article.url, '_blank')}
            className="flex items-center gap-1"
          >
            <ExternalLink size={14} />
            <span>Read More</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => onCreateSignal(article)}
          >
            <LineChart size={14} />
            <span>Create Signal</span>
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(article.url);
              }}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Copy Link</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}

interface SignalCardProps {
  signal: any;
}

function SignalCard({ signal }: SignalCardProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'sell':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'buy':
        return 'Buy';
      case 'sell':
        return 'Sell';
      case 'dca':
        return 'DCA';
      case 'stop_loss':
        return 'Stop Loss';
      default:
        return action;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'executed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Executed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="bg-muted p-2 rounded-full">
              {getActionIcon(signal.action)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {getActionLabel(signal.action)} Signal: {signal.symbol}
              </CardTitle>
              <CardDescription>
                {signal.price ? `Price: $${signal.price}` : 'Market Price'} • {signal.quantity ? `Quantity: ${signal.quantity}` : 'Quantity: N/A'}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(signal.status)}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Signal Source</p>
            <p>{signal.source || 'Combined Analysis'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Generated At</p>
            <p>{signal.generatedAt ? format(new Date(signal.generatedAt), 'MMM d, yyyy HH:mm') : 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Reason</p>
            <p>{signal.reason || 'No reason provided'}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {signal.status === 'pending' && (
          <div className="flex gap-2">
            <Button variant="default" size="sm">Execute Now</Button>
            <Button variant="outline" size="sm">Modify</Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">Reject</Button>
          </div>
        )}
        {signal.status === 'executed' && (
          <Button variant="outline" size="sm">View Trade</Button>
        )}
        {signal.status === 'rejected' && (
          <Button variant="ghost" size="sm">Reactivate</Button>
        )}
      </CardFooter>
    </Card>
  );
}