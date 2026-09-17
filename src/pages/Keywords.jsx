import React, { useState } from 'react';
import { vizion } from '@/api/vizionClient';
import useProjects from '@/hooks/useProjects';
import PageHeader from '@/ui/PageHeader';
import ProjectSelect from '@/ui/ProjectSelect';
import EmptyState from '@/ui/EmptyState';
import KeywordTable from '@/ui/KeywordTable';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Loader2, Search } from 'lucide-react';

export default function Keywords() {
  const { projects, activeId, select, active } = useProjects();
  const [seed, setSeed] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);

  const run = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResults([]);
    const res = await vizion.integrations.Core.InvokeLLM({
      prompt: `Act as a keyword research engine. For the seed keyword "${seed}"${active ? ` in the context of the website ${active.domain} (${active.industry || 'general'})` : ''}, return 25 related keyword ideas. For each: keyword, monthly search volume, difficulty (0-100), cpc in USD, and intent (informational, commercial, transactional or navigational). Mix head terms and long-tail questions. Use realistic figures.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          keywords: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                volume: { type: 'number' },
                difficulty: { type: 'number' },
                cpc: { type: 'number' },
                intent: { type: 'string' },
              },
            },
          },
        },
      },
    });
    setResults(res.keywords || []);
    setBusy(false);
  };

  const track = async (kw) => {
    await vizion.entities.Keyword.create({ ...kw, project_id: activeId, tracked: true });
    setResults((r) => r.map((x) => (x.keyword === kw.keyword ? { ...x, _added: true } : x)));
  };

  return (
    <div>
      <PageHeader eyebrow="Research" title="Keyword Explorer" description="Discover the terms your market is searching for, with volume, difficulty, cost and intent.">
        <ProjectSelect projects={projects} activeId={activeId} onSelect={select} />
      </PageHeader>

      <form onSubmit={run} className="flex gap-3 mb-8">
        <Input required value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Enter a seed keyword…" className="bg-white/5 border-white/10 h-12 rounded-xl text-base" />
        <Button disabled={busy} className="h-12 px-6 bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      {busy && <div className="text-sm text-neutral-500">Analysing search demand…</div>}
      {!busy && !results.length && <EmptyState icon={Search} title="Start with a seed keyword" description="We'll expand it into a full opportunity list." />}
      {!!results.length && <KeywordTable rows={results} onTrack={track} />}
    </div>
  );
}