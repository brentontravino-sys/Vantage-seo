import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BUCKETS = [
  { key: 'top3', label: '1–3', color: '#00a6fb' },
  { key: 'top10', label: '4–10', color: '#33b8fc' },
  { key: 'top50', label: '11–50', color: '#737373' },
  { key: 'top100', label: '51–100', color: '#a3a3a3' },
];

export default function PositionDistributionChart({ data = {} }) {
  const chartData = BUCKETS.map((b) => ({
    label: b.label,
    value: data[b.key] ?? 0,
    color: b.color,
  }));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Position distribution</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="label" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
