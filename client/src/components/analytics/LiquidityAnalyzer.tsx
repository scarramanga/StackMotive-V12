import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createChart, ColorType, IChartApi, LineStyle } from 'lightweight-charts';

interface LiquidityAnalyzerProps {
  symbol: string;
  accountId: number;
  width?: number;
  height?: number;
}

interface LiquidityMetric {
  time: string;
  bidAskSpread: number;
  effectiveSpread: number;
  marketDepth: number;
  priceImpact10k: number;
  priceImpact100k: number;
  amihudRatio: number;
  turnover: number;
}

interface LiquidityProfile {
  bucketSize: number;
  buckets: {
    price: number;
    buyVolume: number;
    sellVolume: number;
    totalVolume: number;
    tradeCount: number;
    vwap: number;
  }[];
  largeOrders: {
    time: string;
    side: 'buy' | 'sell';
    price: number;
    size: number;
    percentOfAvgSize: number;
  }[];
}

/**
 * LiquidityAnalyzer component for advanced liquidity analysis
 */
export const LiquidityAnalyzer: React.FC<LiquidityAnalyzerProps> = ({
  symbol,
  accountId,
  width = 800,
  height = 400,
}) => {
  const liquidityMetricsRef = useRef<HTMLDivElement>(null);
  const liquidityChartInstance = useRef<IChartApi | null>(null);
  const liquidityProfileRef = useRef<HTMLDivElement>(null);
  const profileChartInstance = useRef<IChartApi | null>(null);

  // Fetch liquidity metrics time series
  const { data: liquidityMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['/api/analytics/liquidity-metrics', symbol],
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/analytics/liquidity-metrics?symbol=${symbol}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch liquidity metrics');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch liquidity profile
  const { data: liquidityProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/analytics/liquidity-profile', symbol],
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/analytics/liquidity-profile?symbol=${symbol}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch liquidity profile');
      }
      return response.json();
    },
    staleTime: 300000, // 5 minutes
  });

  // Helper function to rate liquidity metrics
  const rateLiquidity = (metrics: LiquidityMetric): { score: number; rating: string; color: string } => {
    if (!metrics) return { score: 0, rating: 'Unknown', color: 'bg-gray-500' };
    
    // Calculate a composite score based on multiple metrics
    // Lower values are better for these metrics
    const spreadScore = Math.min(1, metrics.bidAskSpread < 0.001 ? 4 : (metrics.bidAskSpread < 0.005 ? 3 : (metrics.bidAskSpread < 0.01 ? 2 : 1)));
    const impactScore = Math.min(1, metrics.priceImpact10k < 0.1 ? 4 : (metrics.priceImpact10k < 0.2 ? 3 : (metrics.priceImpact10k < 0.5 ? 2 : 1)));
    const amihudScore = Math.min(1, metrics.amihudRatio < 0.00001 ? 4 : (metrics.amihudRatio < 0.0001 ? 3 : (metrics.amihudRatio < 0.001 ? 2 : 1)));
    const depthScore = Math.min(1, metrics.marketDepth > 10000000 ? 4 : (metrics.marketDepth > 1000000 ? 3 : (metrics.marketDepth > 100000 ? 2 : 1)));
    
    // Higher values are better for turnover
    const turnoverScore = Math.min(1, metrics.turnover > 0.2 ? 4 : (metrics.turnover > 0.1 ? 3 : (metrics.turnover > 0.05 ? 2 : 1)));
    
    // Calculate weighted average score
    const compositeScore = (spreadScore * 0.2) + (impactScore * 0.3) + (amihudScore * 0.2) + (depthScore * 0.2) + (turnoverScore * 0.1);
    
    // Map score to rating
    let rating = 'Low';
    let color = 'bg-red-500';
    
    if (compositeScore > 3.5) {
      rating = 'Excellent';
      color = 'bg-green-500';
    } else if (compositeScore > 2.5) {
      rating = 'Good';
      color = 'bg-green-300';
    } else if (compositeScore > 1.5) {
      rating = 'Moderate';
      color = 'bg-yellow-500';
    }
    
    return { score: compositeScore, rating, color };
  };

  // Initialize liquidity metrics chart
  useEffect(() => {
    if (liquidityMetricsRef.current && liquidityMetrics && !isLoadingMetrics) {
      if (liquidityChartInstance.current) {
        liquidityChartInstance.current.remove();
      }

      const chart = createChart(liquidityMetricsRef.current, {
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
      });

      liquidityChartInstance.current = chart;

      // Add bid-ask spread series
      const spreadSeries = chart.addLineSeries({
        color: '#FFD700',
        lineWidth: 2,
        title: 'Bid-Ask Spread (bps)',
      });

      // Add market depth series
      const depthSeries = chart.addLineSeries({
        color: '#2196F3',
        lineWidth: 2,
        title: 'Market Depth ($M)',
        priceScaleId: 'depth',
      });

      // Add price impact series
      const impactSeries = chart.addLineSeries({
        color: '#FF5252',
        lineWidth: 2,
        title: 'Price Impact (10k)',
        priceScaleId: 'impact',
      });

      // Configure separate price scales for different metrics
      chart.priceScale('depth').applyOptions({
        scaleMargins: {
          top: 0.1,
          bottom: 0.4,
        },
        visible: true,
        borderVisible: false,
      });

      chart.priceScale('impact').applyOptions({
        scaleMargins: {
          top: 0.4,
          bottom: 0.1,
        },
        visible: true,
        borderVisible: false,
      });

      // Prepare data for chart
      const spreadData = liquidityMetrics.map((metric: LiquidityMetric) => ({
        time: new Date(metric.time).getTime() / 1000,
        value: metric.bidAskSpread * 10000, // Convert to basis points
      }));

      const depthData = liquidityMetrics.map((metric: LiquidityMetric) => ({
        time: new Date(metric.time).getTime() / 1000,
        value: metric.marketDepth / 1000000, // Convert to millions
      }));

      const impactData = liquidityMetrics.map((metric: LiquidityMetric) => ({
        time: new Date(metric.time).getTime() / 1000,
        value: metric.priceImpact10k,
      }));

      spreadSeries.setData(spreadData);
      depthSeries.setData(depthData);
      impactSeries.setData(impactData);

      chart.timeScale().fitContent();

      return () => {
        if (liquidityChartInstance.current) {
          liquidityChartInstance.current.remove();
          liquidityChartInstance.current = null;
        }
      };
    }
  }, [liquidityMetrics, isLoadingMetrics, width, height]);

  // Initialize liquidity profile chart
  useEffect(() => {
    if (liquidityProfileRef.current && liquidityProfile && !isLoadingProfile) {
      if (profileChartInstance.current) {
        profileChartInstance.current.remove();
      }

      const chart = createChart(liquidityProfileRef.current, {
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
      });

      profileChartInstance.current = chart;

      // Add volume profile histogram
      const buyVolumeHistogram = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
      });

      const sellVolumeHistogram = chart.addHistogramSeries({
        color: '#ef5350',
        priceFormat: {
          type: 'volume',
        },
      });

      // Prepare data for histogram
      const buyVolumeData = liquidityProfile.buckets.map((bucket) => ({
        time: 1, // Fixed time for volume profile
        value: bucket.buyVolume,
        price: bucket.price,
      }));

      const sellVolumeData = liquidityProfile.buckets.map((bucket) => ({
        time: 1, // Fixed time for volume profile
        value: -bucket.sellVolume, // Negative to display on opposite side
        price: bucket.price,
      }));

      buyVolumeHistogram.setData(buyVolumeData);
      sellVolumeHistogram.setData(sellVolumeData);

      chart.timeScale().fitContent();

      return () => {
        if (profileChartInstance.current) {
          profileChartInstance.current.remove();
          profileChartInstance.current = null;
        }
      };
    }
  }, [liquidityProfile, isLoadingProfile, width, height]);

  // Get the latest metrics for the summary cards
  const latestMetrics = liquidityMetrics && liquidityMetrics.length > 0 
    ? liquidityMetrics[liquidityMetrics.length - 1] 
    : null;
    
  const liquidityRating = rateLiquidity(latestMetrics);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Liquidity Analysis - {symbol}</CardTitle>
          <CardDescription>Advanced liquidity metrics and trends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Liquidity Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge className={liquidityRating.color}>
                    {liquidityRating.rating}
                  </Badge>
                  <span className="text-xl font-bold">
                    {latestMetrics ? (liquidityRating.score / 4 * 10).toFixed(1) : "N/A"}/10
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Composite market quality score
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Bid-Ask Spread</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestMetrics ? (latestMetrics.bidAskSpread * 10000).toFixed(2) : "N/A"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Basis points
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Market Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestMetrics ? (latestMetrics.marketDepth / 1000000).toFixed(2) : "N/A"}M
                </div>
                <p className="text-sm text-muted-foreground">
                  Available liquidity ($)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Price Impact (10k)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestMetrics ? latestMetrics.priceImpact10k.toFixed(3) : "N/A"}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Market impact of $10k order
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Amihud Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestMetrics ? (latestMetrics.amihudRatio * 1000000).toFixed(3) : "N/A"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Price impact per million $ (×10⁻⁶)
                </p>
              </CardContent>
            </Card>
          </div>
          
          {isLoadingMetrics ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div ref={liquidityMetricsRef} className="h-[400px] w-full" />
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Volume Profile</CardTitle>
            <CardDescription>Price levels with significant trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProfile ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div ref={liquidityProfileRef} className="h-[300px] w-full" />
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-green-500" />
                <span>Buy Volume</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-red-500" />
                <span>Sell Volume</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Bucket Size: {liquidityProfile?.bucketSize.toFixed(4)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Large Order Activity</CardTitle>
            <CardDescription>Recent institutional-sized orders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProfile ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>% of Avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liquidityProfile?.largeOrders.map((order, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(order.time).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <Badge className={order.side === 'buy' ? 'bg-green-500' : 'bg-red-500'}>
                          {order.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.price.toFixed(2)}</TableCell>
                      <TableCell>{order.size.toLocaleString()}</TableCell>
                      <TableCell>{order.percentOfAvgSize.toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Liquidity Trends</CardTitle>
          <CardDescription>Historical patterns and current market state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Trend Analysis</h3>
              
              {isLoadingMetrics ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span>Spread Trend:</span>
                    <Badge className={
                      liquidityMetrics && liquidityMetrics.length > 1 && 
                      liquidityMetrics[liquidityMetrics.length - 1].bidAskSpread < 
                      liquidityMetrics[0].bidAskSpread
                        ? "bg-green-500"
                        : "bg-red-500"
                    }>
                      {liquidityMetrics && liquidityMetrics.length > 1 && 
                      liquidityMetrics[liquidityMetrics.length - 1].bidAskSpread < 
                      liquidityMetrics[0].bidAskSpread
                        ? "Improving"
                        : "Worsening"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Depth Trend:</span>
                    <Badge className={
                      liquidityMetrics && liquidityMetrics.length > 1 && 
                      liquidityMetrics[liquidityMetrics.length - 1].marketDepth > 
                      liquidityMetrics[0].marketDepth
                        ? "bg-green-500"
                        : "bg-red-500"
                    }>
                      {liquidityMetrics && liquidityMetrics.length > 1 && 
                      liquidityMetrics[liquidityMetrics.length - 1].marketDepth > 
                      liquidityMetrics[0].marketDepth
                        ? "Increasing"
                        : "Decreasing"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Impact Trend:</span>
                    <Badge className={
                      liquidityMetrics && liquidityMetrics.length > 1 && 
                      liquidityMetrics[liquidityMetrics.length - 1].priceImpact10k < 
                      liquidityMetrics[0].priceImpact10k
                        ? "bg-green-500"
                        : "bg-red-500"
                    }>
                      {liquidityMetrics && liquidityMetrics.length > 1 && 
                      liquidityMetrics[liquidityMetrics.length - 1].priceImpact10k < 
                      liquidityMetrics[0].priceImpact10k
                        ? "Improving"
                        : "Worsening"}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span>Overall Liquidity Trend:</span>
                    <Badge className={
                      liquidityMetrics && liquidityMetrics.length > 1 && 
                      rateLiquidity(liquidityMetrics[liquidityMetrics.length - 1]).score > 
                      rateLiquidity(liquidityMetrics[0]).score
                        ? "bg-green-500"
                        : "bg-red-500"
                    }>
                      {liquidityMetrics && liquidityMetrics.length > 1 && 
                      rateLiquidity(liquidityMetrics[liquidityMetrics.length - 1]).score > 
                      rateLiquidity(liquidityMetrics[0]).score
                        ? "Improving"
                        : "Worsening"}
                    </Badge>
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Market Impact Analysis</h3>
              
              {isLoadingMetrics ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Price Impact (10k):</span>
                    <span className="font-medium">
                      {latestMetrics ? latestMetrics.priceImpact10k.toFixed(4) + "%" : "N/A"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Price Impact (100k):</span>
                    <span className="font-medium">
                      {latestMetrics ? latestMetrics.priceImpact100k.toFixed(4) + "%" : "N/A"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Impact Ratio (100k/10k):</span>
                    <span className="font-medium">
                      {latestMetrics ? (latestMetrics.priceImpact100k / latestMetrics.priceImpact10k).toFixed(2) + "x" : "N/A"}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span>Market Resiliency:</span>
                    <Badge className={
                      latestMetrics && (latestMetrics.priceImpact100k / latestMetrics.priceImpact10k) < 5
                        ? "bg-green-500"
                        : ((latestMetrics && (latestMetrics.priceImpact100k / latestMetrics.priceImpact10k) < 10)
                          ? "bg-yellow-500"
                          : "bg-red-500")
                    }>
                      {latestMetrics && (latestMetrics.priceImpact100k / latestMetrics.priceImpact10k) < 5
                        ? "High"
                        : ((latestMetrics && (latestMetrics.priceImpact100k / latestMetrics.priceImpact10k) < 10)
                          ? "Medium"
                          : "Low")}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiquidityAnalyzer;