import React, { useState } from 'react';
import { vizion } from '@/api/vizionClient';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { Checkbox } from '@/ui/checkbox';
import { Button } from '@/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'Performance overview' },
  { id: 'rankings', label: 'Keyword rankings' },
  { id: 'audit', label: 'Technical issues' },
  { id: 'backlinks', label: 'Backlink highlights' },
];

export default function ReportBuilder({ project, onSaved }) {
  const [title, setTitle] = useState('Monthly SEO Performance Report');
  const [client, setClient] = useState('');
  const [range, setRange] = useState('');
  const [accent, setAccent] = useState('#00a6fb');
  const [sections, setSections] = useState(['overview', 'rankings', 'audit', 'backlinks']);
  const [summary, setSummary] = useState('');
  const [writing, setWriting] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSections((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const writeSummary = async () => {
    setWriting(true);
    const [kw, issues] = await Promise.all([
      vizion.entities.Keyword.filter({ project_id: project.id, tracked: true }),
      vizion.entities.AuditIssue.filter({ project_id: project.id }),
    ]);
    const text = await vizion.integrations.Core.InvokeLLM({
      prompt: `Write a concise, client-ready executive summary (about 120 words) for an SEO report on ${project.domain}. Domain rating ${project.domain_rating}, monthly organic traffic ${project.organic_traffic}, technical health ${project.health_score}%. Tracked keywords: ${kw.map((k) => `${k.keyword} (pos ${k.current_position ?? 'n/a'})`).slice(0, 15).join(', ') || 'none yet'}. Top technical issues: ${issues.map((i) => i.title).slice(0, 6).join(', ') || 'none recorded'}. Confident, plain business language, no headings.`,
    });
    setSummary(typeof text === 'string' ? text : '');
    setWriting(false);
  };

  const save = async () => {
    setSaving(true);
    await vizion.entities.Report.create({
      project_id: project.id, title, client_name: client, date_range: range, sections, summary, accent_color: accent,
    });
    setSaving(false);
    onSaved?.();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Build a report</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-neutral-400 text-xs">Report title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/5 border-white/10 mt-1.5" />
        </div>
        <div>
          <Label className="text-neutral-400 text-xs">Client / company</Label>
          <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Acme Ltd" className="bg-white/5 border-white/10 mt-1.5" />
        </div>
        <div>
          <Label className="text-neutral-400 text-xs">Date range</Label>
          <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder="Aug 2026" className="bg-white/5 border-white/10 mt-1.5" />
        </div>
        <div>
          <Label className="text-neutral-400 text-xs">Accent colour</Label>
          <Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="bg-white/5 border-white/10 mt-1.5 h-10 p-1" />
        </div>
      </div>

      <div>
        <Label className="text-neutral-400 text-xs">Sections</Label>
        <div className="grid sm:grid-cols-2 gap-3 mt-2.5">
          {SECTIONS.map((s) => (
            <label key={s.id} className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer">
              <Checkbox checked={sections.includes(s.id)} onCheckedChange={() => toggle(s.id)} className="border-white/20 data-[state=checked]:bg-lime-300 data-[state=checked]:text-neutral-950" />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-neutral-400 text-xs">Executive summary</Label>
          <Button size="sm" variant="ghost" onClick={writeSummary} disabled={writing} className="text-lime-300 hover:text-lime-200 h-7 text-xs">
            {writing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Write for me</>}
          </Button>
        </div>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} className="bg-white/5 border-white/10" placeholder="Summarise the month's performance…" />
      </div>

      <Button onClick={save} disabled={saving} className="bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save report'}
      </Button>
    </div>
  );
}