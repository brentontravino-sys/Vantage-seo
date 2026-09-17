import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Globe } from 'lucide-react';

export default function ProjectSelect({ projects, activeId, onSelect }) {
  if (!projects.length) return null;
  return (
    <Select value={activeId} onValueChange={onSelect}>
      <SelectTrigger className="w-[240px] bg-white/5 border-white/10 text-neutral-100">
        <div className="flex items-center gap-2 truncate">
          <Globe className="w-4 h-4 text-lime-300 shrink-0" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-neutral-900 border-white/10 text-neutral-100">
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.domain}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}