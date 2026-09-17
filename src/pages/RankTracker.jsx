import React, { useEffect, useState } from 'react';
import { vizion } from '@/api/vizionClient';
import useProjects from '@/hooks/useProjects';
import PageHeader from '@/ui/PageHeader';
import ProjectSelect from '@/ui/ProjectSelect';
import EmptyState from '@/ui/EmptyState';
import { Button } from '@/ui/button';
import { Loader2, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';

function Delta({ current, previous }) {
  if (current == null || previous == null) return <span className="text-neutral-600"><Minus className="w-3.5 h-3.5" /></span>;
  const diff = previous - current;
  if (diff === 0) return <span className="text-neutral-500 inline-flex items-center text-xs"><Minus className="w-3.5 h-3.5" /></span>;
  const up = diff > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${up ? 'text-lime-300' : 'text-rose-400'}`}>
      {up ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}{Math.abs(diff)}
    </span>
  );
}

export default function RankTracker() {
  const { projects, activeId, select, active } = useProjects();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (activeId) vizion.entities.Keyword.filter({ project_id: activeId, tracked: true }, '-volume').then(setRows);
  }, [activeId]);

  const refresh = async () => {
    setBusy(true);
    const res = await vizion.integrations.Core.InvokeLLM({
      prompt: `For the website ${active.domain}, estimate its current Google ranking position (1-100, or null if not ranking) and the ranking page URL for each of these keywords: ${rows.map((r) => r.keyword).join(', ')}. Return an array of {keyword, position, url}.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          rankings: { type: 'array', items: { type: 'object', properties: { keyword: { type: 'string' }, position: { type: 'number' }, url: { type: 'string' } } } },
        },
      },
    });
    const map = Object.fromEntries((res.rankings || []).map((r) => [r.keyword, r]));
    const updates = rows.filter((r) => map[r.keyword]).map((r) => ({
      id: r.id,
      previous_position: r.current_position ?? map[r.keyword].position,
      current_position: map[r.keyword].position,
      ranking_url: map[r.keyword].url,
    }));
    if (updates.length) await vizion.entities.Keyword.bulkUpdate(updates);
    setRows(await vizion.entities.Keyword.filter({ project_id: activeId, tracked: true }, '-volume'));
    setBusy(false);
  };

  return (
    <div>
      <PageHeader eyebrow="Monitoring" title="Rank Tracker" description="Positions and movement for every keyword you've added to tracking.">
        <ProjectSelect projects={projects} activeId={activeId} onSelect={select} />
        {!!rows.length && (
          <Button onClick={refresh} disabled={busy} className="bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl">
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking…</> : 'Refresh positions'}
          </Button>
        )}
      </PageHeader>

      {!rows.length ? (
        <EmptyState icon={TrendingUp} title="Nothing tracked yet" description="Add keywords from Keyword Explorer to start watching their positions." />
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.15em] text-neutral-500 bg-white/[0.03]">
                <th className="text-left font-normal px-5 py-3">Keyword</th>
                <th className="text-right font-normal px-4 py-3">Position</th>
                <th className="text-right font-normal px-4 py-3">Change</th>
                <th className="text-right font-normal px-4 py-3 hidden sm:table-cell">Volume</th>
                <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">Ranking URL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3.5 text-neutral-100">{r.keyword}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-white">{r.current_position ?? '—'}</td>
                  <td className="px-4 py-3.5 text-right"><Delta current={r.current_position} previous={r.previous_position} /></td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-neutral-400 hidden sm:table-cell">{r.volume?.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-neutral-500 truncate max-w-[240px] hidden lg:table-cell">{r.ranking_url || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}