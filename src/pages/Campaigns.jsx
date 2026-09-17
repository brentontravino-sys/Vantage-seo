import React from 'react';
import PageHeader from '@/ui/PageHeader';
import EmptyState from '@/ui/EmptyState';
import { Search } from 'lucide-react';

export default function Campaigns() {
  return (
    <div>
      <PageHeader eyebrow="Marketing" title="Campaigns" description="Manage and track your SEO marketing campaigns.">
        <div />
      </PageHeader>
      <EmptyState icon={Search} title="No campaigns yet" description="Create your first campaign to start tracking performance." />
    </div>
  );
}
