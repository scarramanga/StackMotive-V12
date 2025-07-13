import React, { useState } from 'react';
// Placeholder for real data hooks (to be implemented)
// import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const BENCHMARKS = [
  { id: 'btc', label: 'BTC' },
  { id: 'sp500', label: 'S&P 500' },
  { id: 'gold', label: 'Gold' },
];

const TIMEFRAMES = [
  { id: 'ytd', label: 'YTD' },
  { id: '1y', label: '1 Year' },
  { id: '3y', label: '3 Years' },
];

export const BenchmarkComparisonModule: React.FC = () => {
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['btc', 'sp500']);
  const [timeframe, setTimeframe] = useState<string>('ytd');

  // TODO: Replace with real data hook
  // const { data, isLoading, error } = useBenchmarkData({ benchmarks: selectedBenchmarks, timeframe });
  const data = null; // No mock data
  const isLoading = false;
  const error = false;

  const handleBenchmarkToggle = (id: string) => {
    setSelectedBenchmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Benchmark Comparison</CardTitle>
        <CardDescription>
          Compare your portfolio performance against selected benchmarks. Select timeframes and benchmarks below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div>
            <span className="font-semibold text-sm">Benchmarks:</span>
            <div className="flex gap-2 mt-2">
              {BENCHMARKS.map((b) => (
                <Button
                  key={b.id}
                  variant={selectedBenchmarks.includes(b.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBenchmarkToggle(b.id)}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <span className="font-semibold text-sm">Timeframe:</span>
            <Tabs value={timeframe} onValueChange={setTimeframe} className="mt-2">
              <TabsList>
                {TIMEFRAMES.map((t) => (
                  <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        {/* Chart Area */}
        <div className="h-64 w-full flex items-center justify-center bg-muted/20 rounded mb-6">
          {/* TODO: Integrate real chart with data */}
          {isLoading ? (
            <span>Loading...</span>
          ) : error ? (
            <span className="text-red-500">Error loading data</span>
          ) : !data ? (
            <span className="text-muted-foreground">Connect data source to view benchmark comparison</span>
          ) : (
            <span>Chart goes here</span>
          )}
        </div>
        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3">Metric</th>
                <th className="text-left py-2 px-3">Portfolio</th>
                {selectedBenchmarks.map((b) => (
                  <th key={b} className="text-left py-2 px-3">{BENCHMARKS.find(x => x.id === b)?.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* TODO: Populate with real metrics */}
              <tr>
                <td className="py-2 px-3">CAGR</td>
                <td className="py-2 px-3">–</td>
                {selectedBenchmarks.map((b) => (
                  <td key={b} className="py-2 px-3">–</td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3">Max Drawdown</td>
                <td className="py-2 px-3">–</td>
                {selectedBenchmarks.map((b) => (
                  <td key={b} className="py-2 px-3">–</td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3">Volatility</td>
                <td className="py-2 px-3">–</td>
                {selectedBenchmarks.map((b) => (
                  <td key={b} className="py-2 px-3">–</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BenchmarkComparisonModule; 