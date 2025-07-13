import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

// Colors for the pie chart segments
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

// Mock data - this would typically come from props or a data hook
const mockAllocationData = [
  { name: 'Equities', value: 65, color: '#3b82f6' },
  { name: 'Crypto', value: 20, color: '#10b981' },
  { name: 'Bonds', value: 10, color: '#f59e0b' },
  { name: 'Cash', value: 5, color: '#6366f1' },
];

interface AssetAllocationChartProps {
  data?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  showLegend?: boolean;
  className?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.value}% of portfolio
        </p>
      </div>
    );
  }
  return null;
};

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  data = mockAllocationData,
  title = "Asset Allocation",
  showLegend = true,
  className = ""
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Allocation breakdown table */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <span className="text-sm font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 