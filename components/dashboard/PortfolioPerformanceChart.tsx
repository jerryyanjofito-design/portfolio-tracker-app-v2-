'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatIDR } from '@/lib/calculations';
import { Snapshot } from '@/lib/types';

type Props = {
  snapshots: Snapshot[];
  currentNetWorth: number;
};

type TimeFilter = '1W' | '1M' | '3M' | 'ALL';

export default function PortfolioPerformanceChart({ snapshots, currentNetWorth }: Props) {
  const [filter, setFilter] = useState<TimeFilter>('ALL');

  // Debug: Log all input snapshots
  console.log('=== PortfolioPerformanceChart: Input Data ===');
  console.log('Total snapshots received:', snapshots.length);
  console.log('Current net worth:', currentNetWorth);
  snapshots.forEach((s, i) => {
    console.log(`  Snapshot ${i + 1}: ${s.created_at} -> Rp ${s.total_value_idr.toLocaleString()}`);
  });

  // Filter snapshots based on selected time period
  const filteredData = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const relevantSnapshots = snapshots.filter(snapshot => {
      const snapshotDate = new Date(snapshot.created_at);
      switch (filter) {
        case '1W':
          return snapshotDate >= oneWeekAgo;
        case '1M':
          return snapshotDate >= oneMonthAgo;
        case '3M':
          return snapshotDate >= threeMonthsAgo;
        case 'ALL':
        default:
          return true;
      }
    });

    // Sort by date ascending for chart
    const sorted = [...relevantSnapshots].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Add current data point
    if (currentNetWorth > 0) {
      sorted.push({
        id: 'current',
        total_value_idr: currentNetWorth,
        created_at: now.toISOString()
      });
    }

    return sorted;
  }, [snapshots, filter, currentNetWorth]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    const data = filteredData.map(snapshot => ({
      date: new Date(snapshot.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      netWorth: snapshot.total_value_idr
    }));

    // Debug: Log formatted chart data
    console.log('=== Chart Data Points ===');
    console.log('Total points:', data.length);
    data.forEach((point, i) => {
      console.log(`  Point ${i + 1}: ${point.date} -> Rp ${point.netWorth.toLocaleString()}`);
    });

    // Check if all values are the same
    const allValues = data.map(d => d.netWorth);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;

    console.log('Value Statistics:');
    console.log('  Min value:', minValue.toLocaleString());
    console.log('  Max value:', maxValue.toLocaleString());
    console.log('  Range:', range.toLocaleString());
    console.log('  Range %:', minValue > 0 ? ((range / minValue) * 100).toFixed(2) + '%' : 'N/A');
    console.log('  All values same?', range === 0 ? 'YES - THIS IS THE ISSUE!' : 'No');

    return data;
  }, [filteredData]);

  // Calculate Y-axis domain to show visible movement
  const yAxisDomain = useMemo(() => {
    const allValues = chartData.map(d => d.netWorth);
    if (allValues.length === 0) return [0, 0];

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    // Expand range by 5% each side to make small changes visible
    const range = maxValue - minValue;
    const expandedMin = range > 0 ? minValue - (range * 0.05) : minValue * 0.95;
    const expandedMax = range > 0 ? maxValue + (range * 0.05) : maxValue * 1.05;

    console.log('=== Y-Axis Domain ===');
    console.log('  Min:', expandedMin.toLocaleString());
    console.log('  Max:', expandedMax.toLocaleString());

    return [expandedMin, expandedMax];
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '12px sm:px-6 sm:py-6' }}>
        <div className="flex justify-between items-center mb-4">
          <span className="section-label">PERFORMANCE</span>
        </div>
        <p className="text-secondary text-center py-6 sm:py-8 text-sm">
          No performance data available yet
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '12px sm:px-6 sm:py-6' }}>
      {/* Section Header */}
      <div className="section-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <span className="section-label">PERFORMANCE</span>
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          {(['1W', '1M', '3M', 'ALL'] as TimeFilter[]).map(timeFilter => (
            <button
              key={timeFilter}
              onClick={() => setFilter(timeFilter)}
              className={`btn-glass text-[10px] sm:text-sm ${filter === timeFilter ? 'active' : ''}`}
              style={{ transition: 'all 120ms ease', padding: '4px 10px' }}
            >
              {timeFilter}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(10,132,255,0.15)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="rgba(10,132,255,0)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.3)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={yAxisDomain}
            tickFormatter={(value) => {
              if (value >= 1000000000) {
                return `${(value / 1000000000).toFixed(0)}B`;
              } else if (value >= 1000000) {
                return `${(value / 1000000).toFixed(0)}M`;
              } else if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}K`;
              }
              return value.toString();
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20,20,20,0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              color: 'rgba(255,255,255,0.95)',
              padding: '12px',
              fontSize: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
            wrapperStyle={{ opacity: 1, transition: 'opacity 150ms ease' }}
            formatter={(value: any) => typeof value === 'number' ? formatIDR(value) : formatIDR(0)}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#0A84FF"
            strokeWidth={2}
            fill="url(#colorGradient)"
            className="chart-glow"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
