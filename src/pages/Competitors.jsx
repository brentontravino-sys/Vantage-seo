import React from 'react';
import PageHeader from '@/ui/PageHeader';
import EmptyState from '@/ui/EmptyState';
import { GitCompare } from 'lucide-react';

export default function Competitors() {
  return (
    <div>
      <PageHeader eyebrow="Marketing" title="Competitors" description="Analyze your competitors' SEO performance and findcompetitive gaps." />
      <EmptyState icon={GitCompare} title="No competitors tracked" description="Add competitor domains to start comparing performance." />
    </div>
  );
}
