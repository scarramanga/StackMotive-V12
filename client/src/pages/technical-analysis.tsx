import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BackToDashboard } from '@/components/ui/back-to-dashboard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon } from 'lucide-react';

// Safe data access helper function
const safeGet = (obj: any, path: string, defaultValue: any = null) => {
  return get(obj, path, defaultValue);
};

// Format number safely 
const safeFormat = (value: any, precision: number | string = 2) => {
  if (value === undefined || value === null) return '0';
  
  try {
    const num = Number(value);
    if (isNaN(num)) return '0';
    
    const digits = typeof precision === 'number' ? precision : 2;
    return num.toFixed(digits);
  } catch (e) {
    return '0';
  }
};

// Mock technical indicators data
const mockTechnicalIndicators = {
  RSI: {
    value: 67.3,
    signal: 'neutral',
    description: 'RSI at 67.3 shows moderate strength, approaching overbought territory'
  },
  MACD: {
    value: 0.0045,
    signal: 'bullish',
    description: 'MACD showing bullish crossover with increasing momentum'
  },
  BollingerBands: {
    upper: 45200,
    middle: 43800,
    lower: 42400,
    signal: 'neutral',
    description: 'Price trading within Bollinger Bands range'
  },
  SMA: {
    sma20: 43650,
    sma50: 42900,
    signal: 'bullish',
    description: '20-day SMA above 50-day SMA indicating upward trend'
  },
  Volume: {
    current: 15400000,
    average: 12300000,
    signal: 'strong',
    description: 'Volume 25% above average confirming price movement'
  }
};

// Mock trading signals data
const mockTradingSignals = [
  {
    id: '1',
    symbol: 'BTC',
    signal: 'buy',
    strength: 'strong',
    price: 43250.00,
    priceChange: '+2.45%',
    indicators: ['MACD', 'RSI', 'Volume'],
    details: 'MACD bullish crossover with RSI oversold bounce'
  },
  {
    id: '2',
    symbol: 'ETH',
    signal: 'hold',
    strength: 'moderate',
    price: 2650.00,
    priceChange: '+0.85%',
    indicators: ['Bollinger Bands', 'SMA'],
    details: 'Price consolidating near middle Bollinger Band'
  },
  {
    id: '3',
    symbol: 'SOL',
    signal: 'sell',
    strength: 'moderate',
    price: 98.50,
    priceChange: '-1.25%',
    indicators: ['RSI', 'MACD'],
    details: 'RSI overbought with bearish MACD divergence'
  }
];

// Indicator tooltips with clear, concise explanations
const indicatorTooltips = {
  'MACD': 'Moving Average Convergence Divergence - trend momentum',
  'RSI': 'Relative Strength Index - measures overbought/oversold',
  'Bollinger Bands': 'Volatility bands based on standard deviations',
  'SMA': 'Simple Moving Average',
  'Volume': 'Trade volume trend confirmation',
  'EMA': 'Exponential Moving Average - recent price weighting'
};

const TechnicalAnalysisPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1d');

  // Use mock data for trading signals
  const tradingSignals = mockTradingSignals;
  const loadingSignals = false;

  // Fetch individual asset technical analysis when selected
  const { data: assetAnalysis, isLoading: loadingAssetAnalysis } = useQuery({
    queryKey: ['/api/technical-analysis', selectedAsset, timeframe],
    enabled: !!selectedAsset,
  });

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300';
      case 'sell':
        return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300';
      case 'moderate':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300';
      case 'weak':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      case 'neutral':
        return <ArrowRightIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <InfoIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderMACDChart = (macd: any) => {
    const data = [
      {
        name: 'MACD',
        value: macd.value,
        color: macd.value >= 0 ? '#10b981' : '#ef4444',
      },
      {
        name: 'Signal',
        value: macd.signal,
        color: '#6366f1',
      },
      {
        name: 'Histogram',
        value: macd.histogram,
        color: macd.histogram >= 0 ? '#10b981' : '#ef4444',
      },
    ];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <RechartsTooltip
            formatter={(value: any) => [parseFloat(value).toFixed(6), 'Value']}
          />
          <Legend />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderMovingAveragesChart = (ma: any) => {
    const data = [
      {
        name: 'SMA 20',
        value: ma.sma20,
      },
      {
        name: 'SMA 50',
        value: ma.sma50,
      },
      {
        name: 'SMA 200',
        value: ma.sma200,
      },
      {
        name: 'EMA 20',
        value: ma.ema20,
      },
    ];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip
            formatter={(value) => [parseFloat(value).toFixed(3), 'Value']}
          />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderBollingerChart = (bollinger: any, price: number) => {
    const data = [
      {
        name: 'Upper Band',
        value: bollinger.upper,
      },
      {
        name: 'Middle Band',
        value: bollinger.middle,
      },
      {
        name: 'Lower Band',
        value: bollinger.lower,
      },
      {
        name: 'Current Price',
        value: price,
      },
    ];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={['auto', 'auto']} />
          <RechartsTooltip
            formatter={(value: any) => [parseFloat(value).toFixed(3), 'Value']}
          />
          <Legend />
          <Bar dataKey="value" fill="#6366f1">
            <Cell fill="#ef4444" />
            <Cell fill="#6366f1" />
            <Cell fill="#10b981" />
            <Cell fill="#f59e0b" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className='p-4'>
      <BackToDashboard />
      
      {/* DEBUG: Navigation Test Indicator */}
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mx-6 mt-6">
        <div className="flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span className="font-semibold">✅ TECHNICAL ANALYSIS PAGE LOADED SUCCESSFULLY</span>
        </div>
        <p className="text-sm mt-1">Navigation is working! You are on /paper-trading/technical</p>
      </div>
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Technical Analysis</h1>
            <p className="text-muted-foreground">Advanced technical indicators and trading signals</p>
            <p className="text-xs text-orange-600 mt-1">Mock Data for UI Testing</p>
          </div>
        </div>
        <div className="w-full">
          {/* Quick Indicator Summary */}
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">RSI</p>
                          <p className="text-xl font-bold">62 (Neutral)</p>
                          <p className="text-xs text-gray-500">Mock Data</p>
                        </div>
                        <ArrowRightIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">Relative Strength Index, used to detect overbought/oversold signals</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">MACD</p>
                          <p className="text-xl font-bold">Bullish Crossover</p>
                          <p className="text-xs text-gray-500">Mock Data</p>
                        </div>
                        <ArrowUpIcon className="h-6 w-6 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">Moving Average Convergence Divergence trend indicator</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Bollinger Bands</p>
                          <p className="text-xl font-bold">Normal Range</p>
                          <p className="text-xs text-gray-500">Mock Data</p>
                        </div>
                        <ArrowRightIcon className="h-6 w-6 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">Bollinger Bands show price volatility and potential reversal points</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <h1 className="text-2xl font-bold mb-4">Trading Signals</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Trading Signals</CardTitle>
                <CardDescription>
                  Technical analysis-based trading signals for your portfolio and watchlist
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSignals ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Signal</TableHead>
                          <TableHead>Strength</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Indicators</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tradingSignals.map((signal: any) => (
                          <TableRow 
                            key={signal.id}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setSelectedAsset(signal.symbol)}
                          >
                            <TableCell className="font-medium">{signal.symbol}</TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div onClick={(e) => e.stopPropagation()}>
                              <Badge className={getSignalColor(signal.signal)}>
                                {signal.signal.toUpperCase()}
                              </Badge>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm text-muted-foreground max-w-xs">
                                    {signal.signal.toUpperCase() === 'BUY' && 'Recommendation to purchase based on indicators'}
                                    {signal.signal.toUpperCase() === 'SELL' && 'Recommendation to sell based on signal conditions'}
                                    {signal.signal.toUpperCase() === 'HOLD' && 'Hold signal suggests maintaining your position'}
                                    {!['BUY', 'SELL', 'HOLD'].includes(signal.signal.toUpperCase()) && 'Trading signal based on technical analysis'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div onClick={(e) => e.stopPropagation()}>
                              <Badge className={getStrengthColor(signal.strength)}>
                                {signal.strength}
                              </Badge>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-sm text-muted-foreground max-w-xs">
                                    {signal.strength === 'strong' && 'High-confidence trading signal'}
                                    {signal.strength === 'moderate' && 'Medium-confidence signal, watch closely'}
                                    {signal.strength === 'weak' && 'Low-confidence signal, consider additional analysis'}
                                    {!['strong', 'moderate', 'weak'].includes(signal.strength) && 'Signal confidence level'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>${typeof signal.price === 'number' ? signal.price.toFixed(2) : '0.00'}</TableCell>
                            <TableCell className={signal.priceChange && signal.priceChange.startsWith ? (signal.priceChange.startsWith('-') ? 'text-red-600' : 'text-green-600') : 'text-gray-600'}>
                              {signal.priceChange || '0.00%'}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {Array.isArray(signal.indicators) ? signal.indicators.map((indicator: string) => (
                                    <Tooltip key={indicator}>
                                      <TooltipTrigger asChild>
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <Badge variant="outline" className="text-xs cursor-help">
                                          {indicator} <InfoIcon className="w-3 h-3 ml-1" />
                                        </Badge>
                                      </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                      <p className="text-sm text-muted-foreground max-w-xs">
                                          {indicatorTooltips[indicator as keyof typeof indicatorTooltips] || `Learn more about ${indicator}`}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <Badge variant="outline" className="text-xs cursor-help">
                                          MACD <InfoIcon className="w-3 h-3 ml-1" />
                                        </Badge>
                                      </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                      <p className="text-sm text-muted-foreground max-w-xs">
                                          {indicatorTooltips.MACD}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{signal.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </TooltipProvider>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedAsset && assetAnalysis && (
              <>
                <Card className="col-span-full md:col-span-2">
                  <CardHeader>
                    <CardTitle>Technical Analysis for {selectedAsset}</CardTitle>
                    <CardDescription>
                      Comprehensive technical indicators and analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="macd">MACD</TabsTrigger>
                        <TabsTrigger value="rsi">RSI & Bollinger</TabsTrigger>
                        <TabsTrigger value="averages">Moving Averages</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">Price Information</h3>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Current Price</div>
                                <div className="text-lg font-bold">${safeFormat(safeGet(assetAnalysis, 'price.current'))}</div>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Change</div>
                                <div className={`text-lg font-bold ${safeGet(assetAnalysis, 'price.change', 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {safeGet(assetAnalysis, 'price.change', 0) >= 0 ? '+' : ''}{safeFormat(safeGet(assetAnalysis, 'price.change'))} ({safeFormat(safeGet(assetAnalysis, 'price.changePercent'))}%)
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">Signal</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={getSignalColor(safeGet(assetAnalysis, 'signals.overall', 'neutral'))}>
                                {(safeGet(assetAnalysis, 'signals.overall', 'neutral')).toUpperCase()}
                              </Badge>
                              <Badge className={getStrengthColor(safeGet(assetAnalysis, 'signals.strength', 'moderate'))}>
                                {safeGet(assetAnalysis, 'signals.strength', 'moderate')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{safeGet(assetAnalysis, 'signals.details', 'No signal details available')}</p>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">Trend Indicators</h3>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span>MACD Trend</span>
                                <div className="flex items-center space-x-1">
                                  {getTrendIcon(safeGet(assetAnalysis, 'indicators.macd.trend', 'neutral'))}
                                  <span className="text-sm">{safeGet(assetAnalysis, 'indicators.macd.trend', 'neutral')}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>RSI</span>
                                <div className="flex items-center space-x-1">
                                  {getTrendIcon(safeGet(assetAnalysis, 'indicators.rsi.trend', 'neutral'))}
                                  <span className="text-sm">{safeFormat(safeGet(assetAnalysis, 'indicators.rsi.value'))}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Moving Averages</span>
                                <div className="flex items-center space-x-1">
                                  {getTrendIcon(safeGet(assetAnalysis, 'indicators.movingAverages.trend', 'neutral'))}
                                  <span className="text-sm">{safeGet(assetAnalysis, 'indicators.movingAverages.trend', 'neutral')}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Volume</span>
                                <div className="flex items-center space-x-1">
                                  {getTrendIcon(safeGet(assetAnalysis, 'indicators.volume.trend', 'neutral'))}
                                  <span className="text-sm">{safeGet(assetAnalysis, 'indicators.volume.trend', 'neutral')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">Last Updated</h3>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {assetAnalysis?.lastUpdated ? new Date(assetAnalysis.lastUpdated).toLocaleString() : 'Not available'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Timeframe: {assetAnalysis?.timeframe || '1d'}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="macd">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">MACD Indicator</h3>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">MACD Value</div>
                                  <div className="text-lg font-bold">{assetAnalysis?.indicators?.macd?.value?.toFixed(6) || '0.000000'}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Signal Line</div>
                                  <div className="text-lg font-bold">{assetAnalysis?.indicators?.macd?.signal?.toFixed(6) || '0.000000'}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Histogram</div>
                                  <div className={`text-lg font-bold ${(assetAnalysis?.indicators?.macd?.histogram || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {assetAnalysis?.indicators?.macd?.histogram?.toFixed(6) || '0.000000'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Trend</div>
                                  <div className="flex items-center space-x-1">
                                    {getTrendIcon(assetAnalysis?.indicators?.macd?.trend || 'neutral')}
                                    <span className="text-lg font-bold">{assetAnalysis?.indicators?.macd?.trend || 'neutral'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            {assetAnalysis?.indicators?.macd ? renderMACDChart(assetAnalysis.indicators.macd) : 
                              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
                                <p className="text-gray-500 dark:text-gray-400">Chart data unavailable</p>
                              </div>
                            }
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="rsi">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">RSI</h3>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Value</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.rsi.value'))}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Trend</div>
                                  <div className="flex items-center space-x-1">
                                    {getTrendIcon(safeGet(assetAnalysis, 'indicators.rsi.trend', 'neutral'))}
                                    <span className="text-lg font-bold">{safeGet(assetAnalysis, 'indicators.rsi.trend', 'neutral')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <h3 className="text-lg font-medium mt-4">Bollinger Bands</h3>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Upper Band</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.bollinger.upper'), 3)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Middle Band</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.bollinger.middle'), 3)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Lower Band</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.bollinger.lower'), 3)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Width</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.bollinger.width'), 4)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            {safeGet(assetAnalysis, 'indicators.bollinger') && safeGet(assetAnalysis, 'price.current') ?
                              renderBollingerChart(safeGet(assetAnalysis, 'indicators.bollinger'), safeGet(assetAnalysis, 'price.current')) :
                              <div className="p-4 text-center text-gray-500">No Bollinger data available</div>
                            }
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="averages">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">Moving Averages</h3>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">SMA 20</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.movingAverages.sma20'), 3)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">SMA 50</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.movingAverages.sma50'), 3)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">SMA 200</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.movingAverages.sma200'), 3)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">EMA 20</div>
                                  <div className="text-lg font-bold">{safeFormat(safeGet(assetAnalysis, 'indicators.movingAverages.ema20'), 3)}</div>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md mt-2">
                              <div className="text-sm text-gray-500 dark:text-gray-400">Trend</div>
                              <div className="flex items-center space-x-1">
                                {getTrendIcon(safeGet(assetAnalysis, 'indicators.movingAverages.trend', 'neutral'))}
                                <span className="text-lg font-bold">{safeGet(assetAnalysis, 'indicators.movingAverages.trend', 'neutral')}</span>
                              </div>
                              
                              {safeGet(assetAnalysis, 'indicators.movingAverages.crossover') && (
                                <>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">Crossover</div>
                                  <div className="text-lg font-bold">{safeGet(assetAnalysis, 'indicators.movingAverages.crossover', 'None')}</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            {safeGet(assetAnalysis, 'indicators.movingAverages') ?
                              renderMovingAveragesChart(safeGet(assetAnalysis, 'indicators.movingAverages')) :
                              <div className="p-4 text-center text-gray-500">No Moving Averages data available</div>
                            }
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card className="md:col-span-1 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Volume Analysis</CardTitle>
                    <CardDescription>
                      Volume trends and price-volume relationship
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Current Volume</div>
                          <div className="text-lg font-bold">
                            {safeGet(assetAnalysis, 'indicators.volume.current') ? 
                              Number(safeGet(assetAnalysis, 'indicators.volume.current')).toLocaleString() : 
                              'N/A'}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Average Volume</div>
                          <div className="text-lg font-bold">
                            {safeGet(assetAnalysis, 'indicators.volume.average') ? 
                              Number(safeGet(assetAnalysis, 'indicators.volume.average')).toLocaleString() : 
                              'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Volume Trend</div>
                        <div className="text-lg font-bold capitalize">{safeGet(assetAnalysis, 'indicators.volume.trend', 'neutral')}</div>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Price-Volume Relationship</div>
                        <div className="text-lg font-bold capitalize">{safeGet(assetAnalysis, 'indicators.volume.volumePrice', 'neutral')}</div>
                        <div className="text-sm mt-2">
                          {safeGet(assetAnalysis, 'indicators.volume.volumePrice') === 'accumulation' && 
                            'Price increasing on high volume suggests strong buying pressure'
                          }
                          {safeGet(assetAnalysis, 'indicators.volume.volumePrice') === 'distribution' && 
                            'Price decreasing on high volume suggests strong selling pressure'
                          }
                          {(safeGet(assetAnalysis, 'indicators.volume.volumePrice') === 'neutral' || !safeGet(assetAnalysis, 'indicators.volume.volumePrice')) && 
                            'No clear price-volume relationship detected'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAnalysisPage;