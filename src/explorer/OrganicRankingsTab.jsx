import React, { useEffect, useState } from 'react';
import { fetchOrganicRankings } from '@/lib/explorer';
import { Loader2 } from 'lucide-react';

export default function OrganicRankingsTab({ domain }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetchOrganicRankings(domain).then((d) => { setRows(d.keywords || []); setLoading(false); });
  }, [domain]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>;

  return (
    <div className="rounded-2xl border border-white/10 overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">
            <th className="text-left font-normal px-5 py-3">Keyword</th>
            <th className="text-right font-normal px-4 py-3">Position</th>
            <th className="text-right font-normal px-4 py-3">Volume</th>
            <th className="text-right font-normal px-4 py-3">Traffic</th>
            <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">URL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
              <td className="px-5 py-3.5 text-neutral-100">{r.keyword}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-white">#{r.position}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-neutral-400">{r.volume?.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-neutral-400">{r.traffic?.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-neutral-500 truncate max-w-[240px] hidden lg:table-cell">{r.url}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}