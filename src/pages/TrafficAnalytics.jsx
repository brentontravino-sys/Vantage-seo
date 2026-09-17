import React, { useEffect, useState } from 'react';
import { fetchTrafficAnalytics, fmt } from '@/lib/explorer';
import { vizion } from '@/api/vizionClient';
import useProjects from '@/hooks/useProjects';
import PageHeader from '@/ui/PageHeader';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import MetricCard from '@/ui/MetricCard';
import { Loader2, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const SOURCE_COLORS = { organic: '#00a6fb', paid: '#33b8fc', referral: '#0095e2', social: '#0078bf', direct: '#525252' };

export default function TrafficAnalytics() {
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
    const res = await fetchTrafficAnalytics(clean);
    setData(res); setLoading(false);
  };

  // ── GSC live search-performance ──────────────────────────────────────
  const [gsc, setGsc] = useState(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError] = useState(null);
  const [gscCountry, setGscCountry] = useState('');
  const [gscDevice, setGscDevice] = useState('');

  const runGsc = async () => {
    const site = (active?.domain || input || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!site) return;
    setGscLoading(true); setGscError(null); setGsc(null);
    try {
      const res = await vizion.live.gscQuery({
        siteUrl: site,
        country: gscCountry || undefined,
        device: gscDevice || undefined,
        startDate: '2024-01-01',
        endDate: new Date().toISOString().slice(0, 10),
      });
      if (!res?.live) {
        setGscError(res?.message || 'GSC not available — connect a verified Search Console property.');
      } else {
        setGsc(res);
      }
    } catch (e) {
      setGscError(e.message || 'GSC query failed.');
    } finally {
      setGscLoading(false);
    }
  };

  const sourceData = data?.traffic_by_source ? Object.entries(data.traffic_by_source).map(([k, v]) => ({ name: k, value: v })) : [];
  const deviceData = data?.devices ? Object.entries(data.devices).map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <div>
      <PageHeader eyebrow="Research" title="Traffic Analytics" description="Total visits broken down by source, geography, device and engagement." />
      <form onSubmit={run} className="flex gap-3 mb-8">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter a domain…" className="bg-white/5 border-white/10 h-12 rounded-xl text-base" />
        <Button className="h-12 px-6 bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl"><Search className="w-4 h-4 mr-1.5" /> Analyze</Button>
      </form>

      {loading && <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard index={0} label="Total visits" value={fmt(data.total_visits)} sub="monthly" />
            <MetricCard index={1} label="Bounce rate" value={data.bounce_rate != null ? `${data.bounce_rate}%` : '—'} />
            <MetricCard index={2} label="Pages per visit" value={data.pages_per_visit ?? '—'} />
            <MetricCard index={3} label="Avg duration" value={data.avg_visit_duration ? `${Math.floor(data.avg_visit_duration / 60)}m ${data.avg_visit_duration % 60}s` : '—'} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Traffic by source</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {sourceData.map((e) => <Cell key={e.name} fill={SOURCE_COLORS[e.name] || '#737373'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, textTransform: 'capitalize' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Visits · 12 months</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.visits_trend || []}>
                    <defs><linearGradient id="visits" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00a6fb" stopOpacity={0.35} /><stop offset="100%" stopColor="#00a6fb" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="month" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} width={44} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="visits" stroke="#00a6fb" strokeWidth={2} fill="url(#visits)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">Top referral sites</div>
              <table className="w-full text-sm">
                <tbody>
                  {(data.top_referral_sites || []).map((r, i) => (
                    <tr key={i} className="border-t border-white/[0.06]">
                      <td className="px-5 py-3 text-neutral-100">{r.domain}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-400">{r.visits?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Top countries</p>
                <div className="space-y-3">
                  {(data.top_countries || []).map((c, i) => {
                    const max = Math.max(...(data.top_countries || []).map((x) => x.visits || 0), 1);
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-xs text-neutral-300 w-32 truncate">{c.country}</span>
                        <div className="flex-1 h-6 rounded-md bg-white/5 overflow-hidden">
                          <div className="bg-lime-300/60 h-full rounded-md transition-all duration-500" style={{ width: `${(c.visits / max) * 100}%` }} />
                        </div>
                        <span className="text-xs text-neutral-400 w-12 text-right tabular-nums">{c.share}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-4">Devices</p>
                <div className="flex gap-1 h-8 rounded-md overflow-hidden">
                  {deviceData.map((d) => (
                    <div key={d.name} className={`${d.name === 'desktop' ? 'bg-lime-300' : d.name === 'mobile' ? 'bg-lime-500/60' : 'bg-neutral-600'} flex items-center justify-center text-xs text-neutral-950 font-medium`} style={{ width: `${d.value}%` }}>
                      {d.value > 10 && `${d.value}%`}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-neutral-500 capitalize">
                  {deviceData.map((d) => <span key={d.name}>{d.name}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GSC live search performance ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Google Search Console — live performance</p>
          <div className="flex items-center gap-2">
            <select value={gscCountry} onChange={(e) => setGscCountry(e.target.value)} className="h-9 rounded-lg bg-white/5 border border-white/10 px-2 text-sm text-white">
              <option value="">All countries</option>
              <option value="GBR">United Kingdom</option>
              <option value="USA">United States</option>
              <option value="ZAF">South Africa</option>
              <option value="AUS">Australia</option>
              <option value="CAN">Canada</option>
              <option value="IND">India</option>
              <option value="DEU">Germany</option>
            </select>
            <select value={gscDevice} onChange={(e) => setGscDevice(e.target.value)} className="h-9 rounded-lg bg-white/5 border border-white/10 px-2 text-sm text-white">
              <option value="">All devices</option>
              <option value="DESKTOP">Desktop</option>
              <option value="MOBILE">Mobile</option>
              <option value="TABLET">Tablet</option>
            </select>
            <Button onClick={runGsc} disabled={gscLoading} className="h-9 px-4 bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-lg text-sm">
              {gscLoading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Loading…</> : 'Run GSC query'}
            </Button>
          </div>
        </div>

        {gscError && (
          <p className="text-sm text-amber-400">{gscError}</p>
        )}

        {gsc?.rows?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                  <th className="px-3 py-2 text-left font-normal">Query</th>
                  <th className="px-3 py-2 text-right font-normal">Clicks</th>
                  <th className="px-3 py-2 text-right font-normal">Impr.</th>
                  <th className="px-3 py-2 text-right font-normal">CTR</th>
                  <th className="px-3 py-2 text-right font-normal">Position</th>
                </tr>
              </thead>
              <tbody>
                {gsc.rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-3 py-2 text-neutral-200">{(r.keys || []).join(' › ')}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{r.clicks ?? '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{r.impressions ?? '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{r.ctr != null ? `${(r.ctr * 100).toFixed(1)}%` : '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{r.position != null ? r.position.toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !gscLoading && !gscError && (
            <p className="text-sm text-neutral-500">Connect a verified Search Console property via the Dashboard's “Connect GSC” button, then run a query to see real clicks, impressions, CTR and average position.</p>
          )
        )}
      </div>
    </div>
  );
}