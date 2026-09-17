import React, { useEffect, useState } from 'react';
import { fetchOverview, fmt } from '@/lib/explorer';
import MetricCard from '@/ui/MetricCard';
import RankingDistribution from './RankingDistribution';
import { Loader2 } from 'lucide-react';

export default function OverviewTab({ domain }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetchOverview(domain).then((d) => { setData(d); setLoading(false); });
  }, [domain]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard index={0} label="Domain rating" value={data.domain_rating ?? '—'} />
        <MetricCard index={1} label="Organic traffic" value={fmt(data.organic_traffic)} sub="monthly" />
        <MetricCard index={2} label="Organic keywords" value={fmt(data.organic_keywords)} />
        <MetricCard index={3} label="Traffic value" value={`$${fmt(data.traffic_value)}`} sub="monthly" />
        <MetricCard index={4} label="Backlinks" value={fmt(data.backlinks)} />
        <MetricCard index={5} label="Referring domains" value={fmt(data.referring_domains)} />
        <MetricCard index={6} label="Paid traffic" value={fmt(data.paid_traffic)} sub="monthly" />
        <MetricCard index={7} label="Paid keywords" value={fmt(data.paid_keywords)} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">Ranking distribution</p>
        <RankingDistribution data={data.ranking_distribution} />
      </div>
    </div>
  );
}