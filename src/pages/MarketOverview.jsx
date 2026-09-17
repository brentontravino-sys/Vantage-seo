import React, { useEffect, useState } from 'react';
import { fetchMarketOverview, fmt } from '@/lib/explorer';
import useProjects from '@/hooks/useProjects';
import PageHeader from '@/ui/PageHeader';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import MetricCard from '@/ui/MetricCard';
import { Loader2, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function MarketOverview() {
  const { active } = useProjects();
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (active?.domain && !input) setInput(active.domain); }, [active]);

  const run = async (e) => {
    e.preventDefault();
    const clean = input.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!clean) return;
    setLoading(true); setData(null);
    const res = await fetchMarketOverview(clean);
    setData(res); setLoading(false);
  };

  const shareData = data?.market_share?.map((m) => ({ domain: m.domain, share: m.share })) || [];

  return (
    <div>
      <PageHeader eyebrow="Research" title="Market Overview" description="Industry size, growth and the competitive landscape at a glance." />
      <form onSubmit={run} className="flex gap-3 mb-8">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter a domain…" className="bg-white/5 border-white/10 h-12 rounded-xl text-base" />
        <Button className="h-12 px-6 bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl"><Search className="w-4 h-4 mr-1.5" /> Analyze</Button>
      </form>

      {loading && <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard index={0} label="Industry" value={data.industry || '—'} />
            <MetricCard index={1} label="Market size" value={data.market_size ? `$${fmt(data.market_size)}` : '—'} sub="annual" />
            <MetricCard index={2} label="Growth rate" value={data.growth_rate != null ? `${data.growth_rate}%` : '—'} sub="year over year" />
            <MetricCard index={3} label="Industry traffic" value={fmt(data.total_industry_traffic)} sub="monthly" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Market share by domain</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shareData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                    <YAxis type="category" dataKey="domain" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} width={120} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                    <Bar dataKey="share" fill="#00a6fb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Industry traffic · 12 months</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.industry_trend || []}>
                    <defs><linearGradient id="ind" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00a6fb" stopOpacity={0.35} /><stop offset="100%" stopColor="#00a6fb" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="month" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} width={44} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="traffic" stroke="#00a6fb" strokeWidth={2} fill="url(#ind)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-x-auto">
            <div className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">Top competitors</div>
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-neutral-600">
                  <th className="text-left font-normal px-5 py-2">Domain</th>
                  <th className="text-right font-normal px-4 py-2">Traffic</th>
                  <th className="text-right font-normal px-4 py-2">Keywords</th>
                </tr>
              </thead>
              <tbody>
                {(data.top_competitors || []).map((c, i) => (
                  <tr key={i} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5 text-neutral-100">{c.domain}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-neutral-300">{c.traffic?.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-neutral-400">{c.keywords?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}