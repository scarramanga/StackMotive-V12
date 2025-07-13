import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createChart, ColorType, IChartApi, LineStyle, SeriesMarkerPosition } from 'lightweight-charts';

interface MarketDepthAnalyzerProps {
  symbol: string;
  accountId: number;
  width?: number;
  height?: number;
}

interface OrderBookLevel {
  price: number;
  volume: number;
  cumulativeVolume: number;
  orders: number;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: string;
  spread: number;
  spreadPercentage: number;
  midPrice: number;
  bookImbalance: number;
}

interface MarketByPrice {
  time: string;
  bidLevels: { price: number; volume: number }[];
  askLevels: { price: number; volume: number }[];
}

/**
 * MarketDepthAnalyzer component for advanced market depth analysis and visualization
 */
export const MarketDepthAnalyzer: React.FC<MarketDepthAnalyzerProps> = ({
  symbol,
  accountId,
  width = 800,
  height = 400,
}) => {
  const bookVisRef = useRef<HTMLDivElement>(null);
  const bookChartInstance = useRef<IChartApi | null>(null);
  const timeSeriesRef = useRef<HTMLDivElement>(null);
  const timeSeriesChartInstance = useRef<IChartApi | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds

  // Fetch order book data
  const { data: orderBookData, isLoading: isLoadingOrderBook } = useQuery({
    queryKey: ['/api/analytics/order-book', symbol],
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/analytics/order-book?symbol=${symbol}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch order book data');
      }
      return response.json();
    },
    refetchInterval: refreshInterval,
  });

  // Fetch market by price historical data
  const { data: marketByPriceData, isLoading: isLoadingMarketByPrice } = useQuery({
    queryKey: ['/api/analytics/market-by-price', symbol],
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/analytics/market-by-price?symbol=${symbol}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch market by price data');
      }
      return response.json();
    },
    refetchInterval: 60000, // 1 minute
  });

  // Calculate additional metrics
  const calculateMarketImpact = (orderBook: OrderBook, orderSize: number, side: 'buy' | 'sell'): number => {
    if (!orderBook) return 0;
    
    const levels = side === 'buy' ? orderBook.asks : orderBook.bids;
    if (!levels || levels.length === 0) return 0;
    
    let remainingSize = orderSize;
    let totalCost = 0;
    let i = 0;
    
    while (remainingSize > 0 && i < levels.length) {
      const levelSize = Math.min(remainingSize, levels[i].volume);
      totalCost += levelSize * levels[i].price;
      remainingSize -= levelSize;
      i++;
    }
    
    if (remainingSize > 0) {
      // Could not fill the entire order
      return side === 'buy' ? 999.99 : -999.99;
    }
    
    const avgPrice = totalCost / orderSize;
    const midPrice = orderBook.midPrice;
    const impact = side === 'buy' 
      ? ((avgPrice / midPrice) - 1) * 100 
      : (1 - (avgPrice / midPrice)) * 100;
    
    return parseFloat(impact.toFixed(4));
  };

  // Initialize order book visualization
  useEffect(() => {
    if (bookVisRef.current && orderBookData && !isLoadingOrderBook) {
      if (bookChartInstance.current) {
        bookChartInstance.current.remove();
      }

      const chart = createChart(bookVisRef.current, {
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
        rightPriceScale: {
          visible: true,
        },
        timeScale: {
          visible: false,
        },
      });

      bookChartInstance.current = chart;

      // Add histogram series for bids
      const bidsSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
      });

      // Add histogram series for asks
      const asksSeries = chart.addHistogramSeries({
        color: '#ef5350',
        priceFormat: {
          type: 'volume',
        },
      });

      // Prepare data for chart
      const bidsData = orderBookData.bids.map((level: OrderBookLevel) => ({
        time: 1, // fixed time for all levels
        value: level.volume,
        color: '#26a69a',
        price: level.price,
      }));

      const asksData = orderBookData.asks.map((level: OrderBookLevel) => ({
        time: 1, // fixed time for all levels
        value: level.volume,
        color: '#ef5350',
        price: level.price,
      }));

      bidsSeries.setData(bidsData);
      asksSeries.setData(asksData);

      // Add line for mid price
      const midPriceSeries = chart.addLineSeries({
        color: '#FFD700',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        title: 'Mid Price',
      });

      midPriceSeries.setData([
        { time: 1, value: orderBookData.midPrice },
      ]);

      midPriceSeries.setMarkers([
        {
          time: 1,
          position: SeriesMarkerPosition.AboveBar,
          color: '#FFD700',
          shape: 'circle',
          text: `Mid: ${orderBookData.midPrice.toFixed(2)}`,
        }
      ]);

      chart.timeScale().fitContent();

      return () => {
        if (bookChartInstance.current) {
          bookChartInstance.current.remove();
          bookChartInstance.current = null;
        }
      };
    }
  }, [orderBookData, isLoadingOrderBook, width, height]);

  // Initialize time series chart for market depth
  useEffect(() => {
    if (timeSeriesRef.current && marketByPriceData && !isLoadingMarketByPrice) {
      if (timeSeriesChartInstance.current) {
        timeSeriesChartInstance.current.remove();
      }

      const chart = createChart(timeSeriesRef.current, {
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
        rightPriceScale: {
          visible: true,
        },
        timeScale: {
          visible: true,
          timeVisible: true,
        },
      });

      timeSeriesChartInstance.current = chart;

      // Add area series for bid depth
      const bidDepthSeries = chart.addAreaSeries({
        topColor: 'rgba(38, 166, 154, 0.56)',
        bottomColor: 'rgba(38, 166, 154, 0.04)',
        lineColor: 'rgba(38, 166, 154, 1)',
        lineWidth: 2,
      });

      // Add area series for ask depth
      const askDepthSeries = chart.addAreaSeries({
        topColor: 'rgba(239, 83, 80, 0.56)',
        bottomColor: 'rgba(239, 83, 80, 0.04)',
        lineColor: 'rgba(239, 83, 80, 1)',
        lineWidth: 2,
      });

      // Prepare data for charts
      const bidDepthData = marketByPriceData.map((item: MarketByPrice) => ({
        time: new Date(item.time).getTime() / 1000,
        value: item.bidLevels.reduce((sum, level) => sum + level.volume, 0),
      }));

      const askDepthData = marketByPriceData.map((item: MarketByPrice) => ({
        time: new Date(item.time).getTime() / 1000,
        value: item.askLevels.reduce((sum, level) => sum + level.volume, 0),
      }));

      bidDepthSeries.setData(bidDepthData);
      askDepthSeries.setData(askDepthData);

      chart.timeScale().fitContent();

      return () => {
        if (timeSeriesChartInstance.current) {
          timeSeriesChartInstance.current.remove();
          timeSeriesChartInstance.current = null;
        }
      };
    }
  }, [marketByPriceData, isLoadingMarketByPrice, width, height]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Book Visualization - {symbol}</CardTitle>
          <CardDescription>Real-time market depth analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingOrderBook ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div ref={bookVisRef} className="h-[400px] w-full" />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Current Spread</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderBookData ? orderBookData.spread.toFixed(4) : "0.0000"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {orderBookData ? orderBookData.spreadPercentage.toFixed(4) : "0.0000"}% of price
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Book Imbalance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderBookData ? orderBookData.bookImbalance.toFixed(2) : "0.00"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {orderBookData && orderBookData.bookImbalance > 0 
                    ? "Bid dominance" 
                    : (orderBookData && orderBookData.bookImbalance < 0 
                      ? "Ask dominance" 
                      : "Neutral")}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Order Book Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                  <span>Bids: {orderBookData 
                    ? orderBookData.bids.reduce((sum, level) => sum + level.volume, 0).toLocaleString()
                    : 0}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="h-4 w-4 rounded-full bg-red-500" />
                  <span>Asks: {orderBookData 
                    ? orderBookData.asks.reduce((sum, level) => sum + level.volume, 0).toLocaleString()
                    : 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Market Impact Analysis</CardTitle>
          <CardDescription>Price impact analysis for different order sizes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Market Impact (1k)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderBookData 
                    ? `${calculateMarketImpact(orderBookData, 1000, 'buy').toFixed(4)}%`
                    : "0.0000%"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Buy 1,000 units
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Market Impact (10k)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderBookData 
                    ? `${calculateMarketImpact(orderBookData, 10000, 'buy').toFixed(4)}%`
                    : "0.0000%"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Buy 10,000 units
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Market Impact (100k)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderBookData 
                    ? `${calculateMarketImpact(orderBookData, 100000, 'buy').toFixed(4)}%`
                    : "0.0000%"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Buy 100,000 units
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Market Absorption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold flex items-center">
                  {orderBookData ? (
                    <>
                      <Badge className={
                        calculateMarketImpact(orderBookData, 100000, 'buy') < 0.5
                          ? "bg-green-500 mr-2"
                          : (calculateMarketImpact(orderBookData, 100000, 'buy') < 1
                            ? "bg-yellow-500 mr-2" 
                            : "bg-red-500 mr-2")
                      }>
                        {calculateMarketImpact(orderBookData, 100000, 'buy') < 0.5
                          ? "High"
                          : (calculateMarketImpact(orderBookData, 100000, 'buy') < 1
                            ? "Medium" 
                            : "Low")}
                      </Badge>
                    </>
                  ) : "Unknown"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Liquidity absorption rating
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historical Market Depth</CardTitle>
          <CardDescription>Time series analysis of market depth</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMarketByPrice ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div ref={timeSeriesRef} className="h-[400px] w-full" />
          )}
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Depth Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Bids Trend:</span>
                    <Badge className={
                      marketByPriceData && marketByPriceData.length > 1 && 
                      marketByPriceData[marketByPriceData.length - 1].bidLevels.reduce((sum, level) => sum + level.volume, 0) >
                      marketByPriceData[0].bidLevels.reduce((sum, level) => sum + level.volume, 0)
                        ? "bg-green-500"
                        : "bg-red-500"
                    }>
                      {marketByPriceData && marketByPriceData.length > 1 && 
                      marketByPriceData[marketByPriceData.length - 1].bidLevels.reduce((sum, level) => sum + level.volume, 0) >
                      marketByPriceData[0].bidLevels.reduce((sum, level) => sum + level.volume, 0)
                        ? "Increasing"
                        : "Decreasing"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Asks Trend:</span>
                    <Badge className={
                      marketByPriceData && marketByPriceData.length > 1 && 
                      marketByPriceData[marketByPriceData.length - 1].askLevels.reduce((sum, level) => sum + level.volume, 0) >
                      marketByPriceData[0].askLevels.reduce((sum, level) => sum + level.volume, 0)
                        ? "bg-red-500"
                        : "bg-green-500"
                    }>
                      {marketByPriceData && marketByPriceData.length > 1 && 
                      marketByPriceData[marketByPriceData.length - 1].askLevels.reduce((sum, level) => sum + level.volume, 0) >
                      marketByPriceData[0].askLevels.reduce((sum, level) => sum + level.volume, 0)
                        ? "Increasing"
                        : "Decreasing"}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span>Liquidity Trend:</span>
                    <Badge className={
                      marketByPriceData && marketByPriceData.length > 1 && 
                      (marketByPriceData[marketByPriceData.length - 1].bidLevels.reduce((sum, level) => sum + level.volume, 0) +
                      marketByPriceData[marketByPriceData.length - 1].askLevels.reduce((sum, level) => sum + level.volume, 0)) >
                      (marketByPriceData[0].bidLevels.reduce((sum, level) => sum + level.volume, 0) +
                      marketByPriceData[0].askLevels.reduce((sum, level) => sum + level.volume, 0))
                        ? "bg-green-500"
                        : "bg-red-500"
                    }>
                      {marketByPriceData && marketByPriceData.length > 1 && 
                      (marketByPriceData[marketByPriceData.length - 1].bidLevels.reduce((sum, level) => sum + level.volume, 0) +
                      marketByPriceData[marketByPriceData.length - 1].askLevels.reduce((sum, level) => sum + level.volume, 0)) >
                      (marketByPriceData[0].bidLevels.reduce((sum, level) => sum + level.volume, 0) +
                      marketByPriceData[0].askLevels.reduce((sum, level) => sum + level.volume, 0))
                        ? "Improving"
                        : "Worsening"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Average Depth Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Bid Size:</span>
                    <span className="font-medium">
                      {marketByPriceData 
                        ? Math.round(marketByPriceData.reduce((sum, item) => 
                            sum + (item.bidLevels.reduce((levelSum, level) => levelSum + level.volume, 0) / item.bidLevels.length), 
                            0) / marketByPriceData.length).toLocaleString()
                        : 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Average Ask Size:</span>
                    <span className="font-medium">
                      {marketByPriceData 
                        ? Math.round(marketByPriceData.reduce((sum, item) => 
                            sum + (item.askLevels.reduce((levelSum, level) => levelSum + level.volume, 0) / item.askLevels.length), 
                            0) / marketByPriceData.length).toLocaleString()
                        : 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Max Bid Size:</span>
                    <span className="font-medium">
                      {marketByPriceData 
                        ? Math.max(...marketByPriceData.map(item => 
                            item.bidLevels.reduce((sum, level) => sum + level.volume, 0))).toLocaleString()
                        : 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Max Ask Size:</span>
                    <span className="font-medium">
                      {marketByPriceData 
                        ? Math.max(...marketByPriceData.map(item => 
                            item.askLevels.reduce((sum, level) => sum + level.volume, 0))).toLocaleString()
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketDepthAnalyzer;