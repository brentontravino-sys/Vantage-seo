import React, { useEffect, useState } from 'react';
import { fetchTopPages, fmt } from '@/lib/explorer';
import { Loader2 } from 'lucide-react';

export default function TopPagesTab({ domain }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    fetchTopPages(domain).then((d) => { setRows(d.pages || []); setLoading(false); });
  }, [domain]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>;

  return (
    <div className="rounded-2xl border border-white/10 overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">
            <th className="text-left font-normal px-5 py-3">Page</th>
            <th className="text-right font-normal px-4 py-3">Traffic</th>
            <th className="text-right font-normal px-4 py-3 hidden sm:table-cell">Keywords</th>
            <th className="text-right font-normal px-4 py-3">Traffic value</th>
            <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">Top keyword</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
              <td className="px-5 py-3.5 text-neutral-100 truncate max-w-[280px]">{r.url}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-white">{fmt(r.traffic)}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-neutral-400 hidden sm:table-cell">{r.keywords?.toLocaleString()}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-neutral-400">${fmt(r.traffic_value)}</td>
              <td className="px-4 py-3.5 text-neutral-500 truncate max-w-[180px] hidden lg:table-cell">{r.top_keyword}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}