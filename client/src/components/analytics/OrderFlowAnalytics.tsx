import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { createChart, ColorType, CrosshairMode, IChartApi } from 'lightweight-charts';

// Types for order flow data
interface OrderFlowData {
  time: string;
  price: number;
  volume: number;
  buySellRatio: number;
  isAggressor: 'buy' | 'sell' | 'neutral';
}

interface MarketDepthLevel {
  price: number;
  volume: number;
  side: 'bid' | 'ask';
}

interface MarketDepthData {
  bids: MarketDepthLevel[];
  asks: MarketDepthLevel[];
  timestamp: string;
  spread: number;
  imbalanceRatio: number;
}

interface LiquidityMetrics {
  symbol: string;
  timestamp: string;
  bidAskSpread: number;
  marketImpact10k: number;
  marketImpact100k: number;
  marketImpact1m: number;
  volumeProfile: {
    price: number;
    volume: number;
    delta: number;
  }[];
  tradingActivity: {
    time: string;
    largeOrders: number;
    totalVolume: number;
  }[];
  effectiveSpread: number;
  amihudRatio: number;
}

interface OrderFlowAnalyticsProps {
  symbol: string;
  accountId: number;
  timeframe?: string;
  width?: number;
  height?: number;
}

/**
 * OrderFlowAnalytics component for institutional-grade order flow analysis
 */
export const OrderFlowAnalytics: React.FC<OrderFlowAnalyticsProps> = ({
  symbol,
  accountId,
  timeframe = '1h',
  width = 800,
  height = 500,
}) => {
  const [activeTab, setActiveTab] = useState('orderFlow');
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const orderFlowChartRef = useRef<HTMLDivElement>(null);
  const depthChartRef = useRef<HTMLDivElement>(null);
  const volumeProfileRef = useRef<HTMLDivElement>(null);
  const orderFlowChartInstance = useRef<IChartApi | null>(null);
  const depthChartInstance = useRef<IChartApi | null>(null);
  const volumeProfileChartInstance = useRef<IChartApi | null>(null);

  // Fetch order flow data
  const { data: orderFlowData, isLoading: isLoadingOrderFlow } = useQuery({
    queryKey: ['/api/analytics/order-flow', symbol, selectedTimeframe],
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/analytics/order-flow?symbol=${symbol}&timeframe=${selectedTimeframe}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch order flow data');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // Fetch market depth data
  const { data: marketDepthData, isLoading: isLoadingMarketDepth } = useQuery({
    queryKey: ['/api/analytics/market-depth', symbol],
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/analytics/market-depth?symbol=${symbol}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch market depth data');
      }
      return response.json();
    },
    staleTime: 5000, // 5 seconds
    enabled: activeTab === 'marketDepth',
  });

  // Fetch liquidity analysis data
  const { data: liquidityData, isLoading: isLoadingLiquidity } = useQuery({
    queryKey: ['/api/analytics/liquidity', symbol],
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/analytics/liquidity?symbol=${symbol}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch liquidity analysis data');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
    enabled: activeTab === 'liquidity',
  });

  // Initialize order flow chart
  useEffect(() => {
    if (orderFlowChartRef.current && orderFlowData && activeTab === 'orderFlow') {
      if (orderFlowChartInstance.current) {
        orderFlowChartInstance.current.remove();
      }

      const chart = createChart(orderFlowChartRef.current, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#D9D9D9',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
      });

      orderFlowChartInstance.current = chart;

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Add volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // Prepare data for chart
      const candleData = orderFlowData.map((item: OrderFlowData) => ({
        time: item.time,
        open: item.price - Math.random() * 2, // Simulated OHLC data based on price
        high: item.price + Math.random() * 2,
        low: item.price - Math.random() * 2,
        close: item.price,
      }));

      const volumeData = orderFlowData.map((item: OrderFlowData) => ({
        time: item.time,
        value: item.volume,
        color: item.isAggressor === 'buy' ? '#26a69a' : (item.isAggressor === 'sell' ? '#ef5350' : '#95a5a6'),
      }));

      candlestickSeries.setData(candleData);
      volumeSeries.setData(volumeData);

      chart.timeScale().fitContent();

      return () => {
        if (orderFlowChartInstance.current) {
          orderFlowChartInstance.current.remove();
          orderFlowChartInstance.current = null;
        }
      };
    }
  }, [orderFlowData, activeTab, width, height]);

  // Initialize market depth chart
  useEffect(() => {
    if (depthChartRef.current && marketDepthData && activeTab === 'marketDepth') {
      if (depthChartInstance.current) {
        depthChartInstance.current.remove();
      }

      const chart = createChart(depthChartRef.current, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#D9D9D9',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
      });

      depthChartInstance.current = chart;

      // Add depth series for bids
      const bidsSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'price',
          precision: 2,
        },
        lineWidth: 2,
      });

      // Add depth series for asks
      const asksSeries = chart.addHistogramSeries({
        color: '#ef5350',
        priceFormat: {
          type: 'price',
          precision: 2,
        },
        lineWidth: 2,
      });

      // Prepare data for chart
      const bidsData = marketDepthData.bids.map((item: MarketDepthLevel) => ({
        time: marketDepthData.timestamp,
        value: item.volume,
        price: item.price,
      }));

      const asksData = marketDepthData.asks.map((item: MarketDepthLevel) => ({
        time: marketDepthData.timestamp,
        value: item.volume,
        price: item.price,
      }));

      bidsSeries.setData(bidsData);
      asksSeries.setData(asksData);

      chart.timeScale().fitContent();

      return () => {
        if (depthChartInstance.current) {
          depthChartInstance.current.remove();
          depthChartInstance.current = null;
        }
      };
    }
  }, [marketDepthData, activeTab, width, height]);

  // Initialize volume profile chart
  useEffect(() => {
    if (volumeProfileRef.current && liquidityData && activeTab === 'liquidity') {
      if (volumeProfileChartInstance.current) {
        volumeProfileChartInstance.current.remove();
      }

      const chart = createChart(volumeProfileRef.current, {
        width,
        height: 300,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#D9D9D9',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
      });

      volumeProfileChartInstance.current = chart;

      // Add volume profile series
      const volumeProfileSeries = chart.addHistogramSeries({
        priceFormat: {
          type: 'volume',
        },
      });

      // Prepare data for chart
      const volumeProfileData = liquidityData.volumeProfile.map((item) => ({
        time: liquidityData.timestamp,
        value: item.volume,
        color: item.delta > 0 ? '#26a69a' : '#ef5350',
      }));

      volumeProfileSeries.setData(volumeProfileData);

      chart.timeScale().fitContent();

      return () => {
        if (volumeProfileChartInstance.current) {
          volumeProfileChartInstance.current.remove();
          volumeProfileChartInstance.current = null;
        }
      };
    }
  }, [liquidityData, activeTab, width, height]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Institutional Analytics - {symbol}</CardTitle>
        <CardDescription>Advanced order flow and liquidity analysis tools</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="orderFlow" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="orderFlow">Order Flow</TabsTrigger>
              <TabsTrigger value="marketDepth">Market Depth</TabsTrigger>
              <TabsTrigger value="liquidity">Liquidity Analysis</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
          
          <TabsContent value="orderFlow" className="space-y-4">
            {isLoadingOrderFlow ? (
              <div className="flex flex-col space-y-4">
                <Skeleton className="h-[500px] w-full" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div ref={orderFlowChartRef} className="h-[500px] w-full" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Buy/Sell Pressure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {orderFlowData ? orderFlowData[orderFlowData.length - 1].buySellRatio.toFixed(2) : "0.00"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ratio: {orderFlowData && orderFlowData[orderFlowData.length - 1].buySellRatio > 1 
                          ? "Buying Pressure" 
                          : "Selling Pressure"}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Aggressive Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 rounded-full bg-green-500" />
                        <span>Buy: {orderFlowData 
                          ? orderFlowData.filter((d: OrderFlowData) => d.isAggressor === 'buy').length 
                          : 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="h-4 w-4 rounded-full bg-red-500" />
                        <span>Sell: {orderFlowData 
                          ? orderFlowData.filter((d: OrderFlowData) => d.isAggressor === 'sell').length 
                          : 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Institutional Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {orderFlowData ? Math.round(orderFlowData.reduce((acc: number, curr: OrderFlowData) => 
                          acc + (curr.volume > 10000 ? 1 : 0), 0) / orderFlowData.length * 100) : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Large orders (&gt;10k) percentage
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="marketDepth" className="space-y-4">
            {isLoadingMarketDepth ? (
              <div className="flex flex-col space-y-4">
                <Skeleton className="h-[500px] w-full" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div ref={depthChartRef} className="h-[500px] w-full" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Current Spread</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {marketDepthData ? marketDepthData.spread.toFixed(4) : "0.0000"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Bid/Ask Difference
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Depth Imbalance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {marketDepthData ? marketDepthData.imbalanceRatio.toFixed(2) : "0.00"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {marketDepthData && marketDepthData.imbalanceRatio > 1 
                          ? "More bids than asks" 
                          : "More asks than bids"}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Order Book Levels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 rounded-full bg-green-500" />
                        <span>Bids: {marketDepthData 
                          ? marketDepthData.bids.length 
                          : 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="h-4 w-4 rounded-full bg-red-500" />
                        <span>Asks: {marketDepthData 
                          ? marketDepthData.asks.length 
                          : 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="liquidity" className="space-y-4">
            {isLoadingLiquidity ? (
              <div className="flex flex-col space-y-4">
                <Skeleton className="h-[300px] w-full" />
                <div className="grid grid-cols-4 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Bid-Ask Spread</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {liquidityData ? liquidityData.bidAskSpread.toFixed(4) : "0.0000"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average spread
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Market Impact (10k)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {liquidityData ? liquidityData.marketImpact10k.toFixed(2) + "%" : "0.00%"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Price impact for $10,000 order
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Market Impact (100k)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {liquidityData ? liquidityData.marketImpact100k.toFixed(2) + "%" : "0.00%"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Price impact for $100,000 order
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Market Impact (1M)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {liquidityData ? liquidityData.marketImpact1m.toFixed(2) + "%" : "0.00%"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Price impact for $1,000,000 order
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Volume Profile</CardTitle>
                    <CardDescription>Price levels with highest traded volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div ref={volumeProfileRef} className="h-[300px] w-full" />
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Liquidity Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Effective Spread:</span>
                          <span className="font-medium">
                            {liquidityData ? liquidityData.effectiveSpread.toFixed(4) : "0.0000"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amihud Ratio:</span>
                          <span className="font-medium">
                            {liquidityData ? liquidityData.amihudRatio.toFixed(6) : "0.000000"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Liquidity Rating:</span>
                          <Badge className="bg-green-500">
                            {liquidityData && liquidityData.amihudRatio < 0.00001 ? "Excellent" : 
                              (liquidityData && liquidityData.amihudRatio < 0.0001 ? "Good" : 
                                (liquidityData && liquidityData.amihudRatio < 0.001 ? "Moderate" : "Low"))}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Large Order Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {liquidityData && liquidityData.tradingActivity.map((activity, index) => (
                        <div key={index} className="flex justify-between py-2 border-b last:border-0">
                          <span>{new Date(activity.time).toLocaleTimeString()}</span>
                          <span>{activity.largeOrders} orders</span>
                          <span className="font-medium">{activity.totalVolume.toLocaleString()} units</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrderFlowAnalytics;