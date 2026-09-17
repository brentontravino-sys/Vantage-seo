import React from 'react';

const RANGES = [
  { key: 'top3', label: '1-3', color: 'bg-lime-300' },
  { key: 'top10', label: '4-10', color: 'bg-lime-400/70' },
  { key: 'top50', label: '11-50', color: 'bg-lime-500/40' },
  { key: 'top100', label: '51-100', color: 'bg-neutral-600' },
];

export default function RankingDistribution({ data }) {
  if (!data) return null;
  const max = Math.max(...RANGES.map((r) => data[r.key] || 0), 1);
  return (
    <div className="space-y-3">
      {RANGES.map((r) => {
        const val = data[r.key] || 0;
        return (
          <div key={r.key} className="flex items-center gap-4">
            <span className="text-xs text-neutral-500 w-12 tabular-nums">{r.label}</span>
            <div className="flex-1 h-7 rounded-md bg-white/5 overflow-hidden">
              <div className={`${r.color} h-full rounded-md transition-all duration-500`} style={{ width: `${(val / max) * 100}%` }} />
            </div>
            <span className="text-xs text-neutral-300 w-16 text-right tabular-nums">{val.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}