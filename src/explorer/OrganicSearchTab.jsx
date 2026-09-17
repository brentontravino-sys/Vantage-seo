import React, { useEffect, useState } from 'react';
import { fetchOrganicSearch, fmt } from '@/lib/explorer';
import MetricCard from '@/ui/MetricCard';
import TrafficChart from '@/ui/TrafficChart';
import RankingDistribution from './RankingDistribution';
import { Loader2 } from 'lucide-react';

export default function OrganicSearchTab({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetchOrganicSearch(domain).then((d) => { setData(d); setLoading(false); });
  }, [domain]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard index={0} label="Organic traffic" value={fmt(data.organic_traffic)} sub="monthly" />
        <MetricCard index={1} label="Organic keywords" value={fmt(data.organic_keywords)} />
        <MetricCard index={2} label="Traffic value" value={`$${fmt(data.traffic_value)}`} sub="monthly" />
      </div>
      <TrafficChart data={data.traffic_trend || []} />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Ranking distribution</p>
          <RankingDistribution data={data.ranking_distribution} />
        </div>
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">Top organic keywords</div>
          <table className="w-full text-sm">
            <tbody>
              {(data.top_keywords || []).map((k, i) => (
                <tr key={i} className="border-t border-white/[0.06]">
                  <td className="px-5 py-3 text-neutral-100">{k.keyword}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-lime-300">#{k.position}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-400">{k.volume?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}