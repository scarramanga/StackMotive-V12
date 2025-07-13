import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Types for technical indicators
interface IndicatorProps {
  symbol: string;
  accountId: number;
  timeframe?: string;
}

interface IndicatorData {
  time: string;
  value: number;
}

interface MovingAverageData {
  time: string;
  price: number;
  ma20: number;
  ma50: number | null;
  ma200: number | null;
}

interface MACDData {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * Generate mock OHLC data for technical analysis when API fails
 * Creates 200 dummy candles for sufficient indicator calculation
 */
const generateMockData = () => {
  const mockData = [];
  const basePrice = 150; // Starting price
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = 199; i >= 0; i--) {
    // Calculate date for each candle (going back in time)
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic price movements
    const volatility = 0.015; // 1.5% daily volatility
    const priceChange = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    
    const open = currentPrice;
    const close = open + priceChange;
    
    // Ensure high is above both open and close
    const high = Math.max(open, close) + (Math.random() * 0.008 * currentPrice);
    
    // Ensure low is below both open and close
    const low = Math.min(open, close) - (Math.random() * 0.008 * currentPrice);

    mockData.push({
      time: date.toISOString().split('T')[0], // YYYY-MM-DD format
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000, // Random volume
    });

    // Update current price for next iteration
    currentPrice = close;
  }

  return mockData;
};

/**
 * Technical indicators component
 * Shows RSI, MACD, and Moving Averages
 */
export const TechnicalIndicators: React.FC<IndicatorProps> = ({
  symbol,
  accountId,
  timeframe = '1d',
}) => {
  const [rsiData, setRsiData] = useState<IndicatorData[]>([]);
  const [macdData, setMacdData] = useState<any[]>([]);
  const [movingAverages, setMovingAverages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('rsi');

  // Calculate indicators
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        try {
          const response = await apiRequest('GET', `/api/broker/historical/${accountId}/${symbol}?interval=1d`);
          
          // Handle the API response structure: { symbol, interval, data: [...] }
          if (response && response.data && Array.isArray(response.data)) {
            // Process the data to calculate indicators
            calculateIndicators(response.data);
            setError(null);
          } else {
            throw new Error('No historical data available');
          }
        } catch (apiError) {
          // Use mock data if API fails
          const mockData = generateMockData();
          calculateIndicators(mockData);
          setError('Using mock data - historical endpoint not available');
        }
      } catch (error) {
        console.error('Error fetching technical indicators:', error);
        setError('Failed to load technical indicators');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [symbol, accountId]);

  // Calculate all indicators from historical data
  const calculateIndicators = (data: any[]) => {
    if (data && data.length > 0) {
      calculateRSI(data);
      calculateMACD(data);
      calculateMovingAverages(data);
    }
  };
  
  // Calculate RSI - Simple 14-period implementation
  const calculateRSI = (data: any[]) => {
    const period = 14;
    const closePrices = data.map(item => item.close);
    
    if (closePrices.length < period + 1) {
      setRsiData([]);
      return;
    }
    
    const rsiValues: IndicatorData[] = [];
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = closePrices[i] - closePrices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate first RSI
    let rs = avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    
    rsiValues.push({
      time: new Date(data[period].time).toLocaleDateString(),
      value: parseFloat(rsi.toFixed(2))
    });
    
    // Calculate remaining RSI values
    for (let i = period + 1; i < closePrices.length; i++) {
      const change = closePrices[i] - closePrices[i - 1];
      let currentGain = 0;
      let currentLoss = 0;
      
      if (change >= 0) {
        currentGain = change;
      } else {
        currentLoss = Math.abs(change);
      }
      
      // Smoothed averages
      avgGain = ((period - 1) * avgGain + currentGain) / period;
      avgLoss = ((period - 1) * avgLoss + currentLoss) / period;
      
      rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
      
      rsiValues.push({
        time: new Date(data[i].time).toLocaleDateString(),
        value: parseFloat(rsi.toFixed(2))
      });
    }
    
    setRsiData(rsiValues.slice(-50)); // Show last 50 values
  };
  
  // Calculate MACD - 12,26,9 standard parameters
  const calculateMACD = (data: any[]) => {
    const fastPeriod = 12;
    const slowPeriod = 26;
    const signalPeriod = 9;
    const closePrices = data.map(item => item.close);
    
    if (closePrices.length < slowPeriod + signalPeriod) {
      setMacdData([]);
      return;
    }
    
    // Calculate EMAs
    const fastEMA = calculateEMA(closePrices, fastPeriod);
    const slowEMA = calculateEMA(closePrices, slowPeriod);
    
    // Calculate MACD line
    const macdLine = [];
    for (let i = 0; i < fastEMA.length; i++) {
      const slowIndex = i - (fastPeriod - slowPeriod);
      if (slowIndex >= 0) {
        macdLine.push(fastEMA[i] - slowEMA[slowIndex]);
      }
    }
    
    // Calculate signal line (9-day EMA of MACD line)
    const signalLine = calculateEMA(macdLine, signalPeriod);
    
    // Calculate histogram (MACD line - signal line)
    const histogram = [];
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i + macdLine.length - signalLine.length] - signalLine[i]);
    }
    
    // Format data for chart
    const macdData = [];
    const startIdx = data.length - signalLine.length;
    
    for (let i = 0; i < signalLine.length; i++) {
      const dataIndex = startIdx + i;
      if (dataIndex < data.length) {
        macdData.push({
          time: new Date(data[dataIndex].time).toLocaleDateString(),
          macd: parseFloat(macdLine[i + macdLine.length - signalLine.length].toFixed(2)),
          signal: parseFloat(signalLine[i].toFixed(2)),
          histogram: parseFloat(histogram[i].toFixed(2))
        });
      }
    }
    
    setMacdData(macdData.slice(-50)); // Show last 50 values
  };
  
  // Calculate Moving Averages - 20, 50, 200 periods
  const calculateMovingAverages = (data: any[]) => {
    const closePrices = data.map(item => item.close);
    const ma20 = calculateSMA(closePrices, 20);
    const ma50 = calculateSMA(closePrices, 50);
    const ma200 = calculateSMA(closePrices, 200);
    
    // Format data for chart
    const maData = [];
    const startIdx = data.length - ma20.length;
    
    for (let i = 0; i < ma20.length; i++) {
      const dataIndex = startIdx + i;
      if (dataIndex < data.length) {
        maData.push({
          time: new Date(data[dataIndex].time).toLocaleDateString(),
          price: parseFloat(closePrices[dataIndex].toFixed(2)),
          ma20: parseFloat(ma20[i].toFixed(2)),
          ma50: i < ma50.length ? parseFloat(ma50[i + (ma20.length - ma50.length)].toFixed(2)) : null,
          ma200: i < ma200.length ? parseFloat(ma200[i + (ma20.length - ma200.length)].toFixed(2)) : null
        });
      }
    }
    
    setMovingAverages(maData.slice(-50)); // Show last 50 values
  };
  
  // Helper function to calculate EMA (Exponential Moving Average)
  const calculateEMA = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const emaData: number[] = [];
    
    // Initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    
    let ema = sum / period;
    emaData.push(ema);
    
    // Calculate EMA for remaining data
    for (let i = period; i < data.length; i++) {
      ema = (data[i] * k) + (ema * (1 - k));
      emaData.push(ema);
    }
    
    return emaData;
  };
  
  // Helper function to calculate SMA (Simple Moving Average)
  const calculateSMA = (data: number[], period: number): number[] => {
    const smaData: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      smaData.push(sum / period);
    }
    
    return smaData;
  };
  
  // Get RSI signal (overbought/oversold)
  const getRSISignal = () => {
    if (!rsiData.length) return null;
    
    const currentRSI = rsiData[rsiData.length - 1].value;
    
    if (currentRSI >= 70) {
      return { signal: 'Overbought', color: 'bg-red-500' };
    } else if (currentRSI <= 30) {
      return { signal: 'Oversold', color: 'bg-green-500' };
    } else {
      return { signal: 'Neutral', color: 'bg-gray-500' };
    }
  };
  
  // Get MACD signal (bullish/bearish)
  const getMACDSignal = () => {
    if (!macdData.length) return null;
    
    const current = macdData[macdData.length - 1];
    const previous = macdData[macdData.length - 2];
    
    if (current.macd > current.signal && previous.macd <= previous.signal) {
      return { signal: 'Bullish Crossover', color: 'bg-green-500' };
    } else if (current.macd < current.signal && previous.macd >= previous.signal) {
      return { signal: 'Bearish Crossover', color: 'bg-red-500' };
    } else if (current.macd > current.signal) {
      return { signal: 'Bullish', color: 'bg-green-300' };
    } else if (current.macd < current.signal) {
      return { signal: 'Bearish', color: 'bg-red-300' };
    } else {
      return { signal: 'Neutral', color: 'bg-gray-500' };
    }
  };
  
  // Get Moving Average signal
  const getMASignal = () => {
    if (!movingAverages.length) return null;
    
    const current = movingAverages[movingAverages.length - 1];
    
    if (!current.ma50 || !current.ma200) {
      return { signal: 'Insufficient Data', color: 'bg-gray-500' };
    }
    
    if (current.ma50 > current.ma200) {
      return { signal: 'Golden Cross (Bullish)', color: 'bg-green-500' };
    } else if (current.ma50 < current.ma200) {
      return { signal: 'Death Cross (Bearish)', color: 'bg-red-500' };
    } else {
      return { signal: 'Neutral', color: 'bg-gray-500' };
    }
  };

  const rsiSignal = getRSISignal();
  const macdSignal = getMACDSignal();
  const maSignal = getMASignal();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{symbol} Technical Indicators</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-60">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rsi">
                  RSI
                  {rsiSignal && (
                    <Badge variant="outline" className={`ml-2 ${rsiSignal.color} text-white`}>
                      {rsiSignal.signal}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="macd">
                  MACD
                  {macdSignal && (
                    <Badge variant="outline" className={`ml-2 ${macdSignal.color} text-white`}>
                      {macdSignal.signal}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ma">
                  Moving Averages
                  {maSignal && (
                    <Badge variant="outline" className={`ml-2 ${maSignal.color} text-white`}>
                      {maSignal.signal}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="rsi" className="mt-4">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={rsiData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
                      {/* Overbought reference line */}
                      <CartesianGrid y={70} strokeDasharray="3 3" stroke="red" />
                      {/* Oversold reference line */}
                      <CartesianGrid y={30} strokeDasharray="3 3" stroke="green" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-2 text-sm">
                    <p>RSI (Relative Strength Index) measures the magnitude of recent price changes to evaluate overbought or oversold conditions.</p>
                    <p>Values over 70 indicate overbought conditions, while values under 30 indicate oversold conditions.</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="macd" className="mt-4">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={macdData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="macd" stroke="#8884d8" dot={false} name="MACD Line" />
                      <Line type="monotone" dataKey="signal" stroke="#82ca9d" dot={false} name="Signal Line" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-2 text-sm">
                    <p>MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator.</p>
                    <p>When the MACD line crosses above the signal line, it's a bullish signal. When it crosses below, it's bearish.</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ma" className="mt-4">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={movingAverages}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="price" stroke="#333" dot={false} name="Price" />
                      <Line type="monotone" dataKey="ma20" stroke="#8884d8" dot={false} name="20-Day MA" />
                      <Line type="monotone" dataKey="ma50" stroke="#82ca9d" dot={false} name="50-Day MA" />
                      <Line type="monotone" dataKey="ma200" stroke="#ff7300" dot={false} name="200-Day MA" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-2 text-sm">
                    <p>Moving Averages smooth out price data to identify trends.</p>
                    <p>A "Golden Cross" (50-day MA crosses above 200-day MA) is bullish, while a "Death Cross" (50-day MA crosses below 200-day MA) is bearish.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TechnicalIndicators;