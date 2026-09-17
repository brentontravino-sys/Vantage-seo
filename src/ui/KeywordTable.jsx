import React from 'react';
import { Button } from '@/ui/button';
import { Check, Plus } from 'lucide-react';

const diffColor = (d) => (d >= 70 ? 'text-rose-400' : d >= 40 ? 'text-amber-300' : 'text-lime-300');

export default function KeywordTable({ rows, onTrack }) {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">
            <th className="text-left font-normal px-5 py-3">Keyword</th>
            <th className="text-right font-normal px-4 py-3">Volume</th>
            <th className="text-right font-normal px-4 py-3">KD</th>
            <th className="text-right font-normal px-4 py-3 hidden sm:table-cell">CPC</th>
            <th className="text-left font-normal px-4 py-3 hidden md:table-cell">Intent</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.keyword + i} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors">
              <td className="px-5 py-3.5 text-neutral-100">{r.keyword}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-neutral-300">{r.volume?.toLocaleString() ?? '—'}</td>
              <td className={`px-4 py-3.5 text-right tabular-nums font-medium ${diffColor(r.difficulty)}`}>{r.difficulty ?? '—'}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-neutral-400 hidden sm:table-cell">${(r.cpc ?? 0).toFixed(2)}</td>
              <td className="px-4 py-3.5 text-neutral-500 capitalize hidden md:table-cell">{r.intent}</td>
              <td className="px-4 py-3.5 text-right">
                {onTrack && (
                  r._added ? (
                    <span className="text-lime-300 inline-flex items-center gap-1 text-xs"><Check className="w-3.5 h-3.5" /> Tracking</span>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => onTrack(r)} className="text-neutral-400 hover:text-lime-300 h-7">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Track
                    </Button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}