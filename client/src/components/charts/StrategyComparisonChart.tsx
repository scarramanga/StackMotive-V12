import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface Props {
  data: {
    date: string;
    user: number;
    strategyA: number;
    strategyB?: number;
  }[];
}

// Colorblind-safe palette
const COLORS = {
  user: '#0072B2', // Blue
  strategyA: '#D55E00', // Vermillion
  strategyB: '#009E73', // Green
};

export const StrategyComparisonChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-72 md:h-96 bg-white dark:bg-gray-900 rounded-lg shadow p-2 md:p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={false}
            domain={[(dataMin: number) => Math.floor(dataMin), (dataMax: number) => Math.ceil(dataMax)]}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
            labelStyle={{ color: '#374151', fontWeight: 500 }}
            formatter={(value: number, name: string) => [`${value}%`, name]}
          />
          <Legend
            verticalAlign="top"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 8, fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="user"
            name="Your Portfolio"
            stroke={COLORS.user}
            strokeWidth={2.5}
            dot={{ r: 2.5 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="strategyA"
            name="Strategy A"
            stroke={COLORS.strategyA}
            strokeWidth={2.5}
            dot={{ r: 2.5 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          {data.some(d => typeof d.strategyB === 'number') && (
            <Line
              type="monotone"
              dataKey="strategyB"
              name="Strategy B"
              stroke={COLORS.strategyB}
              strokeWidth={2.5}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 