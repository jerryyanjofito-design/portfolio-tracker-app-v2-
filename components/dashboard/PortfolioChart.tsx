'use client';

import { useState, useEffect } from 'react';
import { Snapshot } from '@/lib/types';
import { fetchSnapshots } from '@/lib/database';
import { formatIDR } from '@/lib/calculations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PortfolioChartProps {
  snapshots: Snapshot[];
}

type TimeFilter = '7D' | '30D';

export default function PortfolioChart({ snapshots }: PortfolioChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7D');

  // Format snapshot data for chart
  const chartData = snapshots.map(snapshot => ({
    date: new Date(snapshot.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    value: snapshot.total_value_idr
  }));

  // Sort by date
  const sortedData = [...chartData].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Filter by time period
  const filteredData = sortedData.filter(item => {
    const daysAgo = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24);
    return timeFilter === '7D' ? daysAgo <= 7 : daysAgo <= 30;
  });

  // Custom tooltip for better UX
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload) {
      const data = payload as any;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            {new Date(data.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-2xl font-bold">
            {formatIDR(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Chart colors (dark mode friendly)
  const lineColor = '#10b981';
  const gridColor = '#27272a';
  const tickColor = '#71717b';

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Portfolio Performance</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFilter('7D')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              timeFilter === '7D'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeFilter('30D')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              timeFilter === '30D'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {snapshots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No snapshot data available.</p>
          <p className="text-sm">Add some holdings and refresh to generate snapshots.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="date"
              stroke={tickColor}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickFormatter={(value) => {
                if (typeof value === 'string') {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                }
                return value;
              }}
            />
            <YAxis
              stroke={tickColor}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickFormatter={(value) => formatIDR(Number(value))}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: lineColor, r: 4, strokeWidth: 2 }}
              activeDot={{ fill: lineColor, r: 6, strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 text-sm text-muted-foreground text-center">
        Showing {filteredData.length} snapshot{filteredData.length !== 1 ? 's' : ''} over {timeFilter}
      </div>
    </div>
  );
}
