import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AllocationItem {
  label: string;
  value: number;
}

interface AllocationChartProps {
  title: string;
  items: AllocationItem[];
  'data-testid'?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function AllocationChart({ title, items, 'data-testid': testId }: AllocationChartProps) {
  // Filter out zero values and sort by value descending
  const sortedItems = items
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // If no items, show empty state
  if (sortedItems.length === 0) {
    return (
      <Card data-testid={testId} className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No allocation data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for recharts
  const chartData = sortedItems.map(item => ({
    name: item.label,
    value: item.value,
    displayValue: `${item.value.toFixed(1)}%`,
  }));

  return (
    <Card data-testid={testId} className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

