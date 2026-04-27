'use client';

import { formatIDR } from '@/lib/calculations';

type Props = {
  currentNetWorth: number;
};

const GOAL = 15000000000; // 15 Billion IDR

export default function NetWorthGoalProgress({ currentNetWorth }: Props) {
  const percentage = Math.min((currentNetWorth / GOAL) * 100, 100);

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[17px] font-semibold">Net Worth Goal</h3>
        <span className="text-sm text-secondary">
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--positive))'
            }}
          />
        </div>

        {/* Amount Display */}
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Current</span>
          <span className="font-semibold text-primary">{formatIDR(currentNetWorth)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Goal</span>
          <span className="font-semibold text-positive">{formatIDR(GOAL)}</span>
        </div>
      </div>
    </div>
  );
}
