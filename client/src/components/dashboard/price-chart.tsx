import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createChart, IChartApi, TimeRange } from "lightweight-charts";

interface PriceChartProps {
  className?: string;
  symbol?: string;
  name?: string;
  price?: string;
  change?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  className,
  symbol = "AAPL",
  name = "Apple Inc.",
  price = "$173.85",
  change = "+0.65%",
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<IChartApi | null>(null);
  const [timeframe, setTimeframe] = useState<string>("1D");
  
  const timeframes = ["1D", "1W", "1M", "3M", "1Y", "All"];
  
  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: "#9CA3AF",
        },
        grid: {
          vertLines: { color: "#E5E7EB" },
          horzLines: { color: "#E5E7EB" },
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
      });
      
      // Create a sample candlestick series
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10B981",
        downColor: "#EF4444",
        borderUpColor: "#10B981",
        borderDownColor: "#EF4444",
        wickUpColor: "#10B981",
        wickDownColor: "#EF4444",
      });
      
      // Add volume series
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "",
        color: "#9CA3AF",
      });
      
      // Set the data (this would come from API in real implementation)
      // This is a placeholder to demonstrate functionality
      const candleData = generateSampleCandleData(100);
      candleSeries.setData(candleData);
      
      const volumeData = generateSampleVolumeData(candleData);
      volumeSeries.setData(volumeData);
      
      chart.timeScale().fitContent();
      
      setChartInstance(chart);
      
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };
      
      window.addEventListener("resize", handleResize);
      
      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    }
  }, []);
  
  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    // In real implementation, this would fetch new data based on timeframe
  };
  
  // Sample data generation (would be replaced by real API data)
  function generateSampleCandleData(count: number) {
    const basePrice = 170;
    const volatility = 5;
    const data = [];
    let time = new Date();
    time.setUTCHours(0, 0, 0, 0);
    
    for (let i = 0; i < count; i++) {
      const prev = data[i - 1] ? data[i - 1].close : basePrice;
      const change = (Math.random() - 0.5) * volatility;
      const open = prev;
      const close = Math.max(0.1, open + change);
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      
      data.push({
        time: time.getTime() / 1000 - (count - i) * 86400,
        open,
        high,
        low,
        close,
      });
    }
    
    return data;
  }
  
  function generateSampleVolumeData(candleData: any[]) {
    return candleData.map(candle => ({
      time: candle.time,
      value: Math.floor(Math.random() * 10000000),
      color: candle.open <= candle.close ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"
    }));
  }
  
  return (
    <Card className={className}>
      <CardHeader className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CardTitle className="font-semibold">{symbol} - {name}</CardTitle>
            <span className="ml-2 text-success font-medium">{price}</span>
            <span className="ml-2 text-success text-sm">{change}</span>
          </div>
          <div className="flex space-x-2">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "secondary" : "ghost"}
                size="sm"
                className="px-2 py-1 text-xs font-medium"
                onClick={() => handleTimeframeChange(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <div ref={chartContainerRef} className="chart-container h-80"></div>
      
      <CardContent className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex items-center text-xs">
            <i className="ri-add-line mr-1"></i> Indicator
          </Button>
          <Button variant="outline" size="sm" className="flex items-center text-xs">
            <i className="ri-tools-line mr-1"></i> Drawing Tools
          </Button>
          <Button variant="outline" size="sm" className="flex items-center text-xs">
            <i className="ri-settings-3-line mr-1"></i> Chart Settings
          </Button>
          <div className="ml-auto flex items-center text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">MACD:</span>
            <span className="ml-1 text-success font-medium">Bullish</span>
            <span className="mx-2 text-neutral-400">|</span>
            <span className="text-neutral-500 dark:text-neutral-400">RSI:</span>
            <span className="ml-1 text-warning font-medium">58.3</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceChart;
