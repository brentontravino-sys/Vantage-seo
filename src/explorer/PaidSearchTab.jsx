import React, { useEffect, useState } from 'react';
import { fetchPaidSearch, fmt } from '@/lib/explorer';
import MetricCard from '@/ui/MetricCard';
import { Loader2 } from 'lucide-react';

export default function PaidSearchTab({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetchPaidSearch(domain).then((d) => { setData(d); setLoading(false); });
  }, [domain]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard index={0} label="Paid traffic" value={fmt(data.paid_traffic)} sub="monthly" />
        <MetricCard index={1} label="Paid keywords" value={fmt(data.paid_keywords_count)} />
        <MetricCard index={2} label="Avg CPC" value={`$${(data.avg_cpc ?? 0).toFixed(2)}`} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">Paid keywords</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-neutral-600">
                <th className="text-left font-normal px-5 py-2">Keyword</th>
                <th className="text-right font-normal px-3 py-2">Pos</th>
                <th className="text-right font-normal px-3 py-2">Vol</th>
                <th className="text-right font-normal px-3 py-2">CPC</th>
              </tr>
            </thead>
            <tbody>
              {(data.paid_keywords || []).map((k, i) => (
                <tr key={i} className="border-t border-white/[0.06]">
                  <td className="px-5 py-3 text-neutral-100 truncate max-w-[180px]">{k.keyword}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-lime-300">#{k.position}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-neutral-400">{k.volume?.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-neutral-400">${(k.cpc ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 px-1">Ad copies</p>
          {(data.ads || []).map((ad, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] text-lime-300/70 truncate">{ad.url}</p>
              <p className="text-white font-medium mt-1 text-sm">{ad.title}</p>
              <p className="text-neutral-400 text-sm mt-1.5 leading-relaxed">{ad.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}