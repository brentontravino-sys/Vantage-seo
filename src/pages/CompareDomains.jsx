import React, { useState } from 'react';
import { fetchCompare } from '@/lib/explorer';
import PageHeader from '@/ui/PageHeader';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Loader2, GitCompare, Plus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CompareDomains() {
  const [domains, setDomains] = useState(['', '']);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const setDomain = (i, v) => setDomains((d) => d.map((x, j) => (j === i ? v : x)));
  const addDomain = () => domains.length < 3 && setDomains([...domains, '']);
  const removeDomain = (i) => setDomains((d) => d.filter((_, j) => j !== i));

  const compare = async (e) => {
    e.preventDefault();
    const clean = domains.map((d) => d.replace(/^https?:\/\//, '').replace(/\/$/, '')).filter(Boolean);
    if (clean.length < 2) return;
    setLoading(true);
    setData(null);
    const res = await fetchCompare(clean);
    setData(res);
    setLoading(false);
  };

  const chartData = data?.domains?.map((d) => ({ domain: d.domain, 'Organic traffic': d.organic_traffic, 'Paid traffic': d.paid_traffic })) || [];

  return (
    <div>
      <PageHeader eyebrow="Research" title="Compare Domains" description="Stack up to three domains side by side across organic and paid search metrics." />
      <form onSubmit={compare} className="space-y-3 mb-8">
        {domains.map((d, i) => (
          <div key={i} className="flex gap-3">
            <Input required value={d} onChange={(e) => setDomain(i, e.target.value)} placeholder={`Domain ${i + 1}`} className="bg-white/5 border-white/10 h-12 rounded-xl" />
            {domains.length > 2 && <Button type="button" variant="ghost" onClick={() => removeDomain(i)} className="text-neutral-500 hover:text-rose-400"><X className="w-4 h-4" /></Button>}
          </div>
        ))}
        <div className="flex gap-3">
          {domains.length < 3 && <Button type="button" variant="ghost" onClick={addDomain} className="text-lime-300 hover:text-lime-200"><Plus className="w-4 h-4 mr-1" /> Add domain</Button>}
          <Button type="submit" disabled={loading} className="bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl ml-auto">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><GitCompare className="w-4 h-4 mr-1.5" /> Compare</>}
          </Button>
        </div>
      </form>

      {loading && <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>}

      {data && !loading && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">
                  <th className="text-left font-normal px-5 py-3">Metric</th>
                  {data.domains.map((d) => <th key={d.domain} className="text-right font-normal px-5 py-3">{d.domain}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Domain rating', get: (d) => d.domain_rating },
                  { label: 'Organic traffic', get: (d) => d.organic_traffic?.toLocaleString() },
                  { label: 'Organic keywords', get: (d) => d.organic_keywords?.toLocaleString() },
                  { label: 'Backlinks', get: (d) => d.backlinks?.toLocaleString() },
                  { label: 'Referring domains', get: (d) => d.referring_domains?.toLocaleString() },
                  { label: 'Paid traffic', get: (d) => d.paid_traffic?.toLocaleString() },
                  { label: 'Paid keywords', get: (d) => d.paid_keywords?.toLocaleString() },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-white/[0.06]">
                    <td className="px-5 py-3.5 text-neutral-400">{row.label}</td>
                    {data.domains.map((d) => <td key={d.domain} className="px-5 py-3.5 text-right tabular-nums text-white">{row.get(d) ?? '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Traffic comparison</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="domain" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} width={44} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Organic traffic" fill="#00a6fb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Paid traffic" fill="#525252" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Keyword overlap</p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-400">Common keywords (all domains)</p>
                  <p className="text-3xl font-semibold text-lime-300 mt-1 tabular-nums">{data.common_keywords?.toLocaleString() ?? '—'}</p>
                </div>
                {data.unique_keywords?.map((u) => (
                  <div key={u.domain} className="flex justify-between items-center py-2 border-t border-white/[0.06]">
                    <span className="text-sm text-neutral-300">{u.domain}</span>
                    <span className="text-sm text-neutral-500 tabular-nums">{u.count?.toLocaleString()} unique</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}