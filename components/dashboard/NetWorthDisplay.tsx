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
    <div className="glass-card" style={{ padding: '16px sm:px-8 sm:py-10' }}>
      {/* Total Net Worth */}
      <div className="mb-3 sm:mb-6">
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-tertiary mb-1 sm:mb-2">
          Net Worth
        </p>
        <h2 className="text-[28px] sm:text-[52px] font-bold tracking-[-0.03em] tabular-nums leading-tight">
          <CountUp value={summary.netWorth} />
        </h2>
      </div>

      {/* Today's Gain */}
      {summary.unrealizedPL !== 0 && (
        <div className="flex items-center gap-2 mb-3 sm:mb-6 flex-wrap">
          <span className={`text-[12px] sm:text-[15px] flex items-center gap-1 ${summary.unrealizedPL >= 0 ? 'text-positive' : 'text-negative'}`}>
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

      {/* Stat Row - Stacked on mobile, flex row on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-4 sm:mb-8 py-3 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex justify-between items-center sm:flex-1 sm:block mb-2 sm:mb-0">
          <p className="text-[11px] sm:text-[14px] text-secondary mb-1">Holdings</p>
          <p className="text-[14px] sm:text-[17px] font-bold tabular-nums text-right sm:text-left">{formatIDR(summary.totalHoldingsValue)}</p>
        </div>
        <div className="hidden sm:block w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex justify-between items-center sm:flex-1 sm:text-right mb-2 sm:mb-0">
          <p className="text-[11px] sm:text-[14px] text-secondary mb-1">Cash</p>
          <p className="text-[14px] sm:text-[17px] font-bold tabular-nums">{formatIDR(summary.totalCashValue)}</p>
        </div>
        <div className="hidden sm:block w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex justify-between items-center sm:flex-1 sm:text-right">
          <p className="text-[11px] sm:text-[14px] text-secondary mb-1">Assets</p>
          <p className="text-[14px] sm:text-[17px] font-bold tabular-nums">{formatIDR(assetsTotal)}</p>
        </div>
      </div>

      {/* Net Worth Goal Progress Bar */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-[10px] sm:text-xs text-secondary mb-1">Net Worth Goal</p>
            <p className="text-xs sm:text-sm text-secondary">{formatIDR(goal)}</p>
          </div>
          <p className="text-[10px] sm:text-xs text-tertiary">
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
