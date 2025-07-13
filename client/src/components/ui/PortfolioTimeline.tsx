import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts';

export interface TimelineEvent {
  date: string;
  type: 'rebalance' | 'overlay' | 'signal';
  label: string;
  color?: string;
}

export interface PortfolioTimelineProps {
  navHistory: { date: string; value: number }[];
  events: TimelineEvent[];
  assetFilter?: string;
  strategyFilter?: string;
  onZoom?: (from: string, to: string) => void;
}

// Block 47: Portfolio Timeline Visualiser
export const PortfolioTimeline: React.FC<PortfolioTimelineProps> = ({ navHistory, events, assetFilter, strategyFilter, onZoom }) => {
  // Filtered data (if asset/strategy filter applied)
  const data = useMemo(() => navHistory, [navHistory]);
  const eventMarkers = useMemo(() => events, [events]);

  return (
    <section className="rounded-xl bg-card dark:bg-card/80 p-4 shadow-lg border border-border max-w-3xl mx-auto my-6 transition-colors" aria-labelledby="portfolio-timeline-title">
      <h2 id="portfolio-timeline-title" className="text-lg font-semibold mb-2">Portfolio Timeline</h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 24, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} minTickGap={16} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} domain={['auto', 'auto']} tickFormatter={v => `$${v.toFixed(0)}`} />
          <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} labelStyle={{ color: '#374151', fontWeight: 500 }} formatter={(value: number) => [`$${value.toFixed(2)}`]} />
          <Line type="monotone" dataKey="value" name="Portfolio NAV" stroke="#2563eb" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          {eventMarkers.map(ev => (
            <ReferenceDot key={ev.date + ev.type + ev.label} x={ev.date} y={data.find(d => d.date === ev.date)?.value} r={7} fill={ev.color || (ev.type === 'rebalance' ? '#eab308' : ev.type === 'overlay' ? '#f59e42' : '#e11d48')} stroke="#fff" strokeWidth={2} label={{ value: ev.label, position: 'top', fontSize: 11, fill: '#374151' }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {/* TODO: Add asset/strategy filter and zoom controls if needed */}
    </section>
  );
}; 