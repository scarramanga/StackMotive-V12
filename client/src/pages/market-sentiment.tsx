import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BackToDashboard } from '@/components/ui/back-to-dashboard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ArrowRightIcon, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  BookOpenCheck,
  InfoIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MarketSentimentPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('7d');

  // Fetch all sentiment analyses
  const { data: sentimentAnalyses, isLoading: loadingSentiment } = useQuery({
    queryKey: ['/api/sentiment-analysis', timeframe],
  });

  // Fetch individual asset sentiment when selected
  const { data: assetSentiment, isLoading: loadingAssetSentiment } = useQuery({
    queryKey: ['/api/sentiment-analysis', selectedAsset, timeframe],
    enabled: !!selectedAsset,
  });

  // Fetch sentiment trends for selected asset
  const { data: sentimentTrends, isLoading: loadingTrends } = useQuery({
    queryKey: ['/api/sentiment-trends', selectedAsset],
    enabled: !!selectedAsset,
  });

  // Fetch sentiment by source breakdown
  const { data: sentimentBySource } = useQuery({
    queryKey: ['/api/sentiment-by-source'],
  });

  const getSentimentIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRightIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 60) return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300';
    if (score <= 40) return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300';
    return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300';
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Earnings':
        return <BookOpenCheck className="h-4 w-4" />;
      case 'News':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Product Launch':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const renderSentimentTrendChart = (trends: any[]) => {
    if (!trends || trends.length === 0) return null;

    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={trends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${value}%`, 'Sentiment']} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderSourceBreakdownChart = (sources: any) => {
    if (!sources || !sources.news) return null;

    const data = [
      { name: 'News', value: sources.news.score },
      { name: 'Social Media', value: sources.social.score },
      { name: 'Analyst', value: sources.analyst.score },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value.toFixed(1)}%`, 'Sentiment Score']}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderKeywordAnalysis = (keywords: any[]) => {
    if (!keywords || keywords.length === 0) return null;

    const data = keywords.map(kw => ({
      keyword: kw.keyword,
      positive: kw.sentiment.positive,
      neutral: kw.sentiment.neutral,
      negative: kw.sentiment.negative,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis dataKey="keyword" type="category" width={70} />
          <Tooltip formatter={(value) => [`${value}%`, 'Sentiment']} />
          <Legend />
          <Bar dataKey="positive" stackId="a" fill="#10b981" />
          <Bar dataKey="neutral" stackId="a" fill="#6b7280" />
          <Bar dataKey="negative" stackId="a" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderSourceBreakdownByType = (sourceData: any[]) => {
    if (!sourceData || sourceData.length === 0) return null;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={sourceData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value}%`, 'Sentiment']} />
          <Legend />
          <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
          <Bar dataKey="neutral" stackId="a" fill="#6b7280" name="Neutral" />
          <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <BackToDashboard />
      
      <div>
        <h1 className="text-2xl font-semibold mb-2">Market Sentiment Analysis</h1>
        <p className="text-muted-foreground mb-1">Real-time sentiment analysis from news, social media, and analyst reports</p>
        <p className="text-xs text-orange-600 mb-4">Mock Data for UI Testing</p>
        
        {/* Mock Sentiment Summary */}
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fear & Greed Index</p>
                        <p className="text-xl font-bold text-orange-600">65 (Greed)</p>
                        <p className="text-xs text-gray-500">Mock Data</p>
                      </div>
                      <TrendingUpIcon className="h-6 w-6 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">Composite index measuring market emotion</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Trending Tickers</p>
                        <p className="text-xl font-bold">$AAPL, $NVDA, $BTC</p>
                        <p className="text-xs text-gray-500">Mock Data</p>
                      </div>
                      <ArrowRightIcon className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm max-w-xs">Most mentioned assets in financial media</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Market Sentiment Overview</CardTitle>
              <CardDescription>
                Sentiment analysis of your portfolio and watchlist assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSentiment ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Sentiment Score</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead>News Articles</TableHead>
                        <TableHead>Social Media</TableHead>
                        <TableHead>Analyst Consensus</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sentimentAnalyses?.map((analysis: any) => (
                        <TableRow 
                          key={analysis.symbol}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => setSelectedAsset(analysis.symbol)}
                        >
                          <TableCell className="font-medium">{analysis.symbol}</TableCell>
                          <TableCell>
                            <Badge className={getSentimentColor(analysis.overallScore.value)}>
                              {Math.round(analysis.overallScore.value)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="flex items-center space-x-1">
                            {getSentimentIcon(analysis.overallScore.trend)}
                            <span className="capitalize">{analysis.overallScore.trend}</span>
                            <span className="text-sm text-gray-500">
                              ({analysis.overallScore.change > 0 ? '+' : ''}{analysis.overallScore.change.toFixed(1)}%)
                            </span>
                          </TableCell>
                          <TableCell>{analysis.sources.news.count}</TableCell>
                          <TableCell>{analysis.sources.social.count}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {analysis.sources.analyst.consensus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {new Date(analysis.lastUpdated).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedAsset && assetSentiment && (
            <>
              <Card className="col-span-full md:col-span-2">
                <CardHeader>
                  <CardTitle>Sentiment Analysis for {selectedAsset}</CardTitle>
                  <CardDescription>
                    Detailed sentiment breakdown from various sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="news">News</TabsTrigger>
                      <TabsTrigger value="social">Social Media</TabsTrigger>
                      <TabsTrigger value="keywords">Keywords</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className="text-sm text-gray-500 dark:text-gray-400">Sentiment Score</div>
                              <div className="text-2xl font-bold">
                                {Math.round(assetSentiment.overallScore.value)}%
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className="text-sm text-gray-500 dark:text-gray-400">Trend</div>
                              <div className="flex items-center space-x-1">
                                {getSentimentIcon(assetSentiment.overallScore.trend)}
                                <span className="capitalize text-lg font-bold">
                                  {assetSentiment.overallScore.trend}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({assetSentiment.overallScore.change > 0 ? '+' : ''}{assetSentiment.overallScore.change.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="text-sm text-gray-500 dark:text-gray-400">News Coverage</div>
                            <div className="text-lg">
                              {assetSentiment.sources.news.count} articles
                              {assetSentiment.sources.news.count > 0 && (
                                <span className="ml-2 text-sm">
                                  (Score: {Math.round(assetSentiment.sources.news.score)}%)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Social Media Mentions</div>
                            <div className="text-lg">
                              {assetSentiment.sources.social.count} posts
                              {assetSentiment.sources.social.count > 0 && (
                                <span className="ml-2 text-sm">
                                  (Score: {Math.round(assetSentiment.sources.social.score)}%)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Analyst Coverage</div>
                            <div className="text-lg flex items-center space-x-2">
                              <span>{assetSentiment.sources.analyst.count} analysts following</span>
                              <Badge variant="outline" className="capitalize">
                                {assetSentiment.sources.analyst.consensus}
                              </Badge>
                            </div>
                            {assetSentiment.sources.analyst.priceTargets && (
                              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Low:</span> ${assetSentiment.sources.analyst.priceTargets.low}
                                </div>
                                <div>
                                  <span className="text-gray-500">Avg:</span> ${assetSentiment.sources.analyst.priceTargets.average}
                                </div>
                                <div>
                                  <span className="text-gray-500">High:</span> ${assetSentiment.sources.analyst.priceTargets.high}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Sentiment Trend</h3>
                          {loadingTrends ? (
                            <div className="flex justify-center items-center h-48">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : (
                            renderSentimentTrendChart(sentimentTrends)
                          )}

                          <h3 className="text-lg font-medium">Upcoming Events</h3>
                          <div className="space-y-2">
                            {assetSentiment.events?.slice(0, 3).map((event: any, i: number) => (
                              <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md flex items-start space-x-2">
                                <div className="mt-1">{getEventIcon(event.type)}</div>
                                <div>
                                  <div className="font-medium">{event.title}</div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-gray-500">{event.date}</span>
                                    <Badge className={getImportanceColor(event.importance)}>
                                      {event.importance}
                                    </Badge>
                                  </div>
                                  {event.description && (
                                    <div className="text-sm text-gray-500 mt-1">{event.description}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="news">
                      <div className="grid grid-cols-1 gap-4 mt-4">
                        <h3 className="text-lg font-medium">News Articles</h3>
                        {assetSentiment.sources.news.articles.length === 0 ? (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
                            No news articles found for {selectedAsset}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {assetSentiment.sources.news.articles.map((article: any, i: number) => (
                              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{article.title}</h4>
                                  <Badge className={getSentimentColor(article.score * 100)}>
                                    {article.sentiment}
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500 mt-1">
                                  <div>{article.source}</div>
                                  <div>{article.timestamp}</div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {article.keywords?.map((keyword: string) => (
                                    <Badge key={keyword} variant="outline" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                                {article.summary && (
                                  <div className="mt-2 text-sm">{article.summary}</div>
                                )}
                                <div className="mt-2">
                                  <a 
                                    href={article.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    Read more
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="social">
                      <div className="grid grid-cols-1 gap-4 mt-4">
                        <h3 className="text-lg font-medium">Social Media Posts</h3>
                        {assetSentiment.sources.social.posts.length === 0 ? (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
                            No social media posts found for {selectedAsset}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {assetSentiment.sources.social.posts.map((post: any) => (
                              <div key={post.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <div className="flex justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{post.author}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {post.platform}
                                    </Badge>
                                  </div>
                                  <Badge className={getSentimentColor(post.score * 100)}>
                                    {post.sentiment}
                                  </Badge>
                                </div>
                                <div className="mt-2">
                                  {post.content}
                                </div>
                                <div className="flex justify-between text-sm text-gray-500 mt-2">
                                  <div>{post.timestamp}</div>
                                  {post.metrics && (
                                    <div className="flex space-x-3">
                                      <span>Likes: {post.metrics.likes}</span>
                                      <span>Shares: {post.metrics.shares}</span>
                                      <span>Comments: {post.metrics.comments}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="keywords">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Keyword Sentiment Analysis</h3>
                          {assetSentiment.keywordAnalysis.length === 0 ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
                              No keyword analysis available for {selectedAsset}
                            </div>
                          ) : (
                            renderKeywordAnalysis(assetSentiment.keywordAnalysis)
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium mb-4">Source Sentiment Breakdown</h3>
                          {renderSourceBreakdownChart(assetSentiment.sources)}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="col-span-full md:col-span-1">
                <CardHeader>
                  <CardTitle>Market Events</CardTitle>
                  <CardDescription>
                    Upcoming events that may impact {selectedAsset}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assetSentiment.events.length === 0 ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
                        No upcoming events for {selectedAsset}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assetSentiment.events.map((event: any, i: number) => (
                          <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-start space-x-2">
                            <div className="mt-1">{getEventIcon(event.type)}</div>
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-500">{event.date}</span>
                                <Badge className={getImportanceColor(event.importance)}>
                                  {event.importance}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {event.sentiment}
                                </Badge>
                              </div>
                              {event.description && (
                                <div className="text-sm text-gray-500 mt-1">{event.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!selectedAsset && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Sentiment by Source</CardTitle>
                <CardDescription>
                  Sentiment distribution across different data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sentimentBySource ? (
                  renderSourceBreakdownByType(sentimentBySource)
                ) : (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentPage;