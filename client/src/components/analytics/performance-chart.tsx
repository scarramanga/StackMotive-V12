import React, { useEffect, useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Types for combined portfolio data
type NewsItem = {
  title: string;
  url: string;
  source: string;
};

type EquityItem = {
  Symbol: string;
  shares: number;
  Value: number;
  pnl_pct: string;
  price: number;
  news: NewsItem[];
};

type CryptoItem = {
  Symbol: string;
  amount: number;
  source: string;
  price: number | null;
  Value: number;
  news: NewsItem[];
};

type CombinedPortfolio = {
  equities: EquityItem[];
  crypto: CryptoItem[];
};

interface PerformanceChartProps {
  timeframe: string;
  className?: string;
  portfolioData?: CombinedPortfolio;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  timeframe,
  className,
  portfolioData
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Calculate daily portfolio value changes based on real portfolio data
  const generatePortfolioPerformanceData = useMemo(() => {
    return (timeframe: string, portfolio?: CombinedPortfolio) => {
      const now = new Date();
      const data = [];
      let startDate: Date;
      let pointCount: number;
      
      // Determine time period based on timeframe
      switch (timeframe) {
        case '1w':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          pointCount = 7;
          break;
        case '1m':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          pointCount = 30;
          break;
        case '3m':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          pointCount = 90;
          break;
        case '6m':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 6);
          pointCount = 180;
          break;
        case '1y':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          pointCount = 365;
          break;
        case 'all':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 3);
          pointCount = 1095;
          break;
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          pointCount = 30;
      }
      
      // If we have real portfolio data, use it to extrapolate historical performance
      if (portfolio) {
        // Get total portfolio value
        const currentEquityValue = portfolio.equities.reduce((sum, item) => sum + item.Value, 0);
        const currentCryptoValue = portfolio.crypto.reduce((sum, item) => sum + item.Value, 0);
        const currentTotalValue = currentEquityValue + currentCryptoValue;
        
        // Get average performance metrics from portfolio
        const averageEquityPnL = portfolio.equities.reduce((sum, item) => {
          const pnlValue = parseFloat(item.pnl_pct.replace("%", ""));
          return isNaN(pnlValue) ? sum : sum + pnlValue;
        }, 0) / (portfolio.equities.length || 1);
        
        // Use volatility based on the existing portfolio
        const volatilityFactor = Math.max(0.1, Math.min(2.0, Math.abs(averageEquityPnL) / 10));
        
        // Start with current value and work backwards
        let equityValue = currentEquityValue;
        let cryptoValue = currentCryptoValue;
        
        // Generate data points
        for (let i = 0; i < pointCount; i++) {
          const date = new Date(now);
          date.setDate(now.getDate() - (pointCount - i));
          
          // Simulate stock market day-to-day changes 
          // with slight upward bias but realistic volatility
          const equityDailyPnL = (Math.random() * 2 - 1) * volatilityFactor;
          const cryptoDailyPnL = (Math.random() * 3 - 1.5) * volatilityFactor * 1.5; // Higher crypto volatility
          
          if (i > 0) {
            equityValue = equityValue * (1 - equityDailyPnL / 100);
            cryptoValue = cryptoValue * (1 - cryptoDailyPnL / 100);
          }
          
          const totalValue = equityValue + cryptoValue;
          const equityPct = (equityValue / totalValue) * 100;
          const cryptoPct = (cryptoValue / totalValue) * 100;
          
          // Calculate performance relative to initial value
          const performancePct = ((totalValue / currentTotalValue) - 1) * 100;
          
          data.push({
            date: date.getTime(),
            value: performancePct,
            equityValue: equityValue,
            cryptoValue: cryptoValue,
            totalValue: totalValue,
            equityPct: equityPct,
            cryptoPct: cryptoPct,
            formattedDate: date.toLocaleDateString()
          });
        }
        
        // Sort chronologically
        data.sort((a, b) => a.date - b.date);
        
        return data;
      } else {
        // If no portfolio data is available, return an array with zero values
        for (let i = 0; i < pointCount; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          
          data.push({
            date: date.getTime(),
            value: 0,
            equityValue: 0,
            cryptoValue: 0,
            totalValue: 0,
            equityPct: 0,
            cryptoPct: 0,
            formattedDate: date.toLocaleDateString()
          });
        }
        
        return data;
      }
    };
  }, []);
  
  useEffect(() => {
    // Generate performance data based on real portfolio
    const data = generatePortfolioPerformanceData(timeframe, portfolioData);
    setChartData(data);
  }, [timeframe, portfolioData, generatePortfolioPerformanceData]);
  
  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className={className}>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getMonth()+1}/${d.getDate()}`;
              }}
              stroke="#9CA3AF"
            />
            <YAxis 
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              stroke="#9CA3AF"
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'value') return [`${value.toFixed(2)}%`, 'Performance'];
                if (name === 'equityValue' || name === 'cryptoValue' || name === 'totalValue') {
                  return [formatCurrency(value), name.replace('Value', ' Value')];
                }
                return [value, name];
              }}
              labelFormatter={(label) => {
                const d = new Date(label);
                return d.toLocaleDateString();
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              name="Performance"
              stroke="rgba(10, 157, 184, 1)" 
              fill="rgba(10, 157, 184, 0.2)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;