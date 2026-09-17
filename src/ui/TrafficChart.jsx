import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TrafficChart({ data = [], showPaid = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Traffic · 12 months</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trafficOrganic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00a6fb" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00a6fb" stopOpacity={0} />
              </linearGradient>
              {showPaid && (
                <linearGradient id="trafficPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#525252" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#525252" stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <XAxis dataKey="month" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} width={44} />
            <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))' }} />
            <Legend wrapperStyle={{ fontSize: 11, textTransform: 'capitalize' }} />
            <Area type="monotone" dataKey="organic" stroke="#00a6fb" strokeWidth={2} fill="url(#trafficOrganic)" name="Organic" />
            {showPaid && <Area type="monotone" dataKey="paid" stroke="#737373" strokeWidth={2} fill="url(#trafficPaid)" name="Paid" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}