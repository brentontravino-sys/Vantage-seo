import React from 'react';
import PageHeader from '@/ui/PageHeader';
import EmptyState from '@/ui/EmptyState';
import { Search } from 'lucide-react';

export default function ContentIdeas() {
  return (
    <div>
      <PageHeader eyebrow="Marketing" title="Content Ideas" description="Discover content opportunities based on keywords and trends." />
      <EmptyState icon={Search} title="No content ideas yet" description="Get content suggestions based on your keyword research." />
    </div>
  );
}
