import { Snapshot } from '@/lib/types';
import { formatIDR, formatPercent } from '@/lib/calculations';

interface SnapshotComparisonProps {
  currentNetWorth: number;
  previousSnapshot?: Snapshot | null;
}

export default function SnapshotComparison({ currentNetWorth, previousSnapshot }: SnapshotComparisonProps) {
  if (!previousSnapshot) {
    return null;
  }

  const previousValue = previousSnapshot.total_value_idr;
  const change = currentNetWorth - previousValue;
  const percentChange = previousValue > 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  const previousDate = new Date(previousSnapshot.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div className="section-header">
        <span className="section-label">SNAPSHOT COMPARISON</span>
      </div>

      <div className="space-y-4">
        {/* Previous Value */}
        <div className="flex justify-between items-center">
          <span className="text-[14px] text-secondary">Previous ({previousDate})</span>
          <span className="text-[17px] font-bold tabular-nums">{formatIDR(previousValue)}</span>
        </div>

        {/* Current Value */}
        <div className="flex justify-between items-center">
          <span className="text-[14px] text-secondary">Current (Today)</span>
          <span className="text-[17px] font-bold tabular-nums">{formatIDR(currentNetWorth)}</span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

        {/* Change */}
        <div className="flex justify-between items-center">
          <span className="text-[14px] text-secondary">Change</span>
          <span className={`text-[17px] font-bold tabular-nums ${isPositive ? 'text-positive' : 'text-negative'}`}>
            {isPositive ? '+' : ''}{formatIDR(change)}
          </span>
        </div>

        {/* Percent Change with Pill Badge */}
        <div className="flex justify-between items-center">
          <span className="text-[14px] text-secondary">Percent</span>
          <span className={`pill-badge ${isPositive ? 'pill-positive' : 'pill-negative'}`}>
            {isPositive ? '+' : ''}{formatPercent(percentChange)}
          </span>
        </div>
      </div>
    </div>
  );
}
