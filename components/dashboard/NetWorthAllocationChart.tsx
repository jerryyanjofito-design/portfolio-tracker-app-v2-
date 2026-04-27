'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatIDR } from '@/lib/calculations';

type Props = {
  investmentsTotal: number;
  cashTotal: number;
  assetsTotal: number;
};

const COLORS = ['#0A84FF', '#30D158', '#BF5AF2'];

export default function NetWorthAllocationChart({
  investmentsTotal,
  cashTotal,
  assetsTotal
}: Props) {
  const total = investmentsTotal + cashTotal + assetsTotal;

  if (total === 0) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="mb-4">
          <span className="section-label">NET WORTH ALLOCATION</span>
        </div>
        <p className="text-secondary text-center py-8">
          No data available
        </p>
      </div>
    );
  }

  const data = [
    { name: 'Investments', value: investmentsTotal },
    { name: 'Cash', value: cashTotal },
    { name: 'Assets', value: assetsTotal }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div className="mb-4">
        <span className="section-label">NET WORTH ALLOCATION</span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={65}
            paddingAngle={3}
            strokeLinecap="round"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>

          {/* Center Text */}
          <foreignObject x="0" y="0" width="100%" height="100%">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[22px] font-bold text-primary tabular-nums">
                  {formatIDR(total)}
                </p>
                <p className="text-[12px] text-secondary">Total</p>
              </div>
            </div>
          </foreignObject>

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
            formatter={(v: any) => typeof v === 'number' ? formatIDR(v) : formatIDR(0)}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-2 mt-4">
        {data.map((item, index) => {
          const percent = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-secondary">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-primary tabular-nums">
                {percent}% ({formatIDR(item.value)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
