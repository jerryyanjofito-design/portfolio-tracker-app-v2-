'use client';

import { useState, useEffect } from 'react';
import { PortfolioSummary } from '@/lib/types';
import { formatIDR, formatPercent } from '@/lib/calculations';

interface NetWorthDisplayProps {
  summary: PortfolioSummary;
  assetsTotal?: number;
}

function CountUp({ value, duration = 600 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(value * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{formatIDR(displayValue)}</>;
}

export default function NetWorthDisplay({ summary, assetsTotal = 0 }: NetWorthDisplayProps) {
  const goal = 15000000000; // 15B IDR
  const progress = Math.min((summary.netWorth / goal) * 100, 100);
  const toGoal = Math.max(0, goal - summary.netWorth);
  const progressPercent = progress.toFixed(1);

  return (
    <div className="glass-card" style={{ padding: '40px' }}>
      {/* Total Net Worth */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-tertiary mb-2">
          Total Net Worth
        </p>
        <h2 className="text-[52px] font-bold tracking-[-0.03em] tabular-nums">
          <CountUp value={summary.netWorth} />
        </h2>
      </div>

      {/* Today's Gain */}
      {summary.unrealizedPL !== 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className={`text-[15px] flex items-center gap-1 ${summary.unrealizedPL >= 0 ? 'text-positive' : 'text-negative'}`}>
            {summary.unrealizedPL >= 0 ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {summary.unrealizedPL >= 0 ? '+' : ''}{formatIDR(Math.abs(summary.unrealizedPL))}{' '}
            ({formatPercent(summary.unrealizedPLPercent)})
          </span>

          {/* Unrealized P&L Pill Badge */}
          <span className={`pill-badge ${summary.unrealizedPL >= 0 ? 'pill-positive' : 'pill-negative'}`}>
            Unrealized P&L
          </span>
        </div>
      )}

      {/* 2-column Stat Row */}
      <div className="flex items-center gap-4 mb-8 py-4 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex-1">
          <p className="text-[14px] text-secondary mb-1">Holdings</p>
          <p className="text-[17px] font-bold tabular-nums">{formatIDR(summary.totalHoldingsValue)}</p>
        </div>
        <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex-1 text-right">
          <p className="text-[14px] text-secondary mb-1">Cash</p>
          <p className="text-[17px] font-bold tabular-nums">{formatIDR(summary.totalCashValue)}</p>
        </div>
        <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex-1 text-right">
          <p className="text-[14px] text-secondary mb-1">Assets</p>
          <p className="text-[17px] font-bold tabular-nums">{formatIDR(assetsTotal)}</p>
        </div>
      </div>

      {/* Net Worth Goal Progress Bar */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-xs text-secondary mb-1">Net Worth Goal</p>
            <p className="text-sm text-secondary">{formatIDR(goal)}</p>
          </div>
          <p className="text-xs text-tertiary">
            {progressPercent}% to goal
          </p>
        </div>
        <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--positive))',
            }}
          />
        </div>
      </div>
    </div>
  );
}
