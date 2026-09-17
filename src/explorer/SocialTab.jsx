import React, { useEffect, useState } from 'react';
import { fetchSocial, fmt } from '@/lib/explorer';
import MetricCard from '@/ui/MetricCard';
import { Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PLATFORM_COLORS = ['#00a6fb', '#33b8fc', '#0095e2', '#0078bf', '#005c8a', '#404040'];

export default function SocialTab({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetchSocial(domain).then((d) => { setData(d); setLoading(false); });
  }, [domain]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>;
  if (!data) return null;

  const sourceData = (data.social_sources || []).map((s) => ({ name: s.platform, value: s.visits }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard index={0} label="Social traffic" value={fmt(data.social_traffic)} sub="monthly" />
        <MetricCard index={1} label="Social platforms" value={data.social_sources?.length ?? '—'} />
        <MetricCard index={2} label="Social ads" value={data.social_ads?.reduce((a, b) => a + (b.ad_count || 0), 0) || '—'} sub="estimated" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Traffic by platform</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {sourceData.map((_, i) => <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">Social ads</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-neutral-600">
                  <th className="text-left font-normal px-5 py-2">Platform</th>
                  <th className="text-right font-normal px-4 py-2">Ads</th>
                  <th className="text-right font-normal px-4 py-2">Est. spend</th>
                </tr>
              </thead>
              <tbody>
                {(data.social_ads || []).map((a, i) => (
                  <tr key={i} className="border-t border-white/[0.06]">
                    <td className="px-5 py-3 text-neutral-100 capitalize">{a.platform}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-300">{a.ad_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-400">${(a.est_spend_usd || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] uppercase tracking-[0.15em] text-neutral-500 mb-3">Top posts</p>
            <div className="space-y-3">
              {(data.top_posts || []).map((p, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xs text-lime-300/70 capitalize w-20 shrink-0 pt-0.5">{p.platform}</span>
                  <p className="text-sm text-neutral-300 flex-1">{p.content}</p>
                  <span className="text-xs text-neutral-500 tabular-nums shrink-0">{p.engagement?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}