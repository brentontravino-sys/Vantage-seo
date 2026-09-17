import React, { useState } from 'react';
import { vizion } from '@/api/vizionClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Loader2, Plus } from 'lucide-react';

export default function AddProjectDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const res = await vizion.integrations.Core.InvokeLLM({
      prompt: `Estimate current SEO metrics for the website "${clean}". Provide domain_rating (0-100), monthly organic_traffic, organic_keywords count, backlinks_count, referring_domains, an overall technical health_score (0-100), and a 12-month traffic_trend array of {month: short month name, traffic: number}. Use realistic figures based on what you can find about this site.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          domain_rating: { type: 'number' },
          organic_traffic: { type: 'number' },
          organic_keywords: { type: 'number' },
          backlinks_count: { type: 'number' },
          referring_domains: { type: 'number' },
          health_score: { type: 'number' },
          traffic_trend: {
            type: 'array',
            items: { type: 'object', properties: { month: { type: 'string' }, traffic: { type: 'number' } } },
          },
        },
      },
    });
    const created = await vizion.entities.Project.create({ name: name || clean, domain: clean, industry, ...res });
    setBusy(false);
    setOpen(false);
    setDomain(''); setName(''); setIndustry('');
    onCreated?.(created);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl">
          <Plus className="w-4 h-4 mr-1.5" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-neutral-900 border-white/10 text-neutral-100">
        <DialogHeader><DialogTitle>Track a new site</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div>
            <Label className="text-neutral-400 text-xs">Domain</Label>
            <Input required value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="bg-white/5 border-white/10 mt-1.5" />
          </div>
          <div>
            <Label className="text-neutral-400 text-xs">Project name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" className="bg-white/5 border-white/10 mt-1.5" />
          </div>
          <div>
            <Label className="text-neutral-400 text-xs">Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS" className="bg-white/5 border-white/10 mt-1.5" />
          </div>
          <Button disabled={busy} className="w-full bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl">
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analysing site…</> : 'Add project'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}