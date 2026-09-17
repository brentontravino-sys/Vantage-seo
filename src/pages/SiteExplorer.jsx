import React, { useEffect, useState } from 'react';
import useProjects from '@/hooks/useProjects';
import PageHeader from '@/ui/PageHeader';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';
import { Search } from 'lucide-react';
import OverviewTab from '@/explorer/OverviewTab';
import OrganicSearchTab from '@/explorer/OrganicSearchTab';
import OrganicRankingsTab from '@/explorer/OrganicRankingsTab';
import TopPagesTab from '@/explorer/TopPagesTab';
import PaidSearchTab from '@/explorer/PaidSearchTab';
import SocialTab from '@/explorer/SocialTab';

export default function SiteExplorer() {
  const { active } = useProjects();
  const [input, setInput] = useState('');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (active?.domain && !input) setInput(active.domain);
  }, [active]);

  const analyze = (e) => {
    e.preventDefault();
    const clean = input.replace(/^https?:\/\//, '').replace(/\/$/, '');
    setDomain(clean);
  };

  return (
    <div>
      <PageHeader eyebrow="Research" title="Site Explorer" description="Look up any domain's organic and paid search footprint, top pages and rankings." />
      <form onSubmit={analyze} className="flex gap-3 mb-8">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter a domain…" className="bg-white/5 border-white/10 h-12 rounded-xl text-base" />
        <Button className="h-12 px-6 bg-lime-300 text-neutral-950 hover:bg-lime-200 rounded-xl">
          <Search className="w-4 h-4 mr-1.5" /> Analyze
        </Button>
      </form>
      {domain && (
        <Tabs defaultValue="overview">
          <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-lime-300/10 data-[state=active]:text-lime-200">Overview</TabsTrigger>
            <TabsTrigger value="organic-search" className="data-[state=active]:bg-lime-300/10 data-[state=active]:text-lime-200">Organic Search</TabsTrigger>
            <TabsTrigger value="organic-rankings" className="data-[state=active]:bg-lime-300/10 data-[state=active]:text-lime-200">Organic Rankings</TabsTrigger>
            <TabsTrigger value="top-pages" className="data-[state=active]:bg-lime-300/10 data-[state=active]:text-lime-200">Top Pages</TabsTrigger>
            <TabsTrigger value="paid-search" className="data-[state=active]:bg-lime-300/10 data-[state=active]:text-lime-200">Paid Search</TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-lime-300/10 data-[state=active]:text-lime-200">Social</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewTab domain={domain} /></TabsContent>
          <TabsContent value="organic-search"><OrganicSearchTab domain={domain} /></TabsContent>
          <TabsContent value="organic-rankings"><OrganicRankingsTab domain={domain} /></TabsContent>
          <TabsContent value="top-pages"><TopPagesTab domain={domain} /></TabsContent>
          <TabsContent value="paid-search"><PaidSearchTab domain={domain} /></TabsContent>
          <TabsContent value="social"><SocialTab domain={domain} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}