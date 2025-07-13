import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StrategyPerformanceChartProps {
  strategyName: string;
}

export const StrategyPerformanceChart: React.FC<StrategyPerformanceChartProps> = ({ 
  strategyName 
}) => {
  // TODO: Replace mock strategy data with:
  // GET /api/strategy/{strategyId}/performance-history
  const strategyPerformanceData = React.useMemo(() => {
    const data = [];
    const today = new Date();
    let cumulativeReturn = 0; // Start at 0%
    
    // Generate 30 days of strategy performance data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add random daily variance (±2% per day)
      const dailyVariance = (Math.random() - 0.5) * 4; // -2% to +2%
      cumulativeReturn += dailyVariance;
      
      // Add some trending behavior based on strategy type
      const trendMultiplier = strategyName === 'Aggressive' ? 1.1 : 
                             strategyName === 'Defensive' ? 0.8 : 1.0;
      cumulativeReturn *= trendMultiplier;
      
      // Keep returns realistic (don't exceed ±50%)
      cumulativeReturn = Math.max(-50, Math.min(50, cumulativeReturn));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        return: Number(cumulativeReturn.toFixed(2))
      });
    }
    
    return data;
  }, [strategyName]);

  const latestReturn = strategyPerformanceData[strategyPerformanceData.length - 1]?.return || 0;
  const isPositive = latestReturn >= 0;

  return (
    <Card className="rounded-2xl p-4 mb-4 shadow-md">
      <CardHeader>
        <CardTitle>📊 Strategy Performance</CardTitle>
        <CardDescription>Your selected strategy's return over time</CardDescription>
        <p className="text-xs text-orange-600 mt-1">Mock Data for UI Testing</p>
        <p className="text-xs text-muted-foreground">Live data will populate when real trades are executed.</p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={strategyPerformanceData}>
              <defs>
                <linearGradient id="strategyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Strategy Return']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="return" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fill="url(#strategyGradient)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2, fill: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            📈 <em>Strategy: {strategyName} - 30-day performance trend</em>
          </div>
          <div className="text-sm text-muted-foreground">
            {isPositive ? '📈' : '📉'} 
            <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
              {latestReturn > 0 ? '+' : ''}{latestReturn.toFixed(2)}% Total Return
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 