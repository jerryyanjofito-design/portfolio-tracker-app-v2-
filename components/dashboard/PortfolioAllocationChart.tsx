'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatIDR } from '@/lib/calculations';

type Props = {
  data: { name: string; value: number }[];
};

const COLORS = ['#0A84FF', '#30D158', '#FF453A', '#FF9F0A', '#BF5AF2', '#64D2FF', '#FFD60A'];

export default function PortfolioAllocationChart({ data }: Props) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="flex justify-between items-center mb-4">
          <span className="section-label">PORTFOLIO ALLOCATION</span>
        </div>
        <p className="text-secondary text-center py-8">
          No investment data available
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div className="flex justify-between items-center mb-4">
        <span className="section-label">PORTFOLIO ALLOCATION</span>
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
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          {/* Center Text */}
          <foreignObject x="0" y="0" width="100%" height="100%">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[22px] font-bold text-primary tabular-nums">
                  {data.length}
                </p>
                <p className="text-[12px] text-secondary">Holdings</p>
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
            formatter={(value: any) => typeof value === 'number' ? formatIDR(value) : formatIDR(0)}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item, index) => {
          const percent = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-secondary flex-1 truncate">{item.name}</span>
              <span className="text-primary font-medium tabular-nums">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
