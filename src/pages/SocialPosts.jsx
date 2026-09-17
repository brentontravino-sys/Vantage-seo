import React from 'react';
import PageHeader from '@/ui/PageHeader';
import EmptyState from '@/ui/EmptyState';
import { Activity } from 'lucide-react';

export default function SocialPosts() {
  return (
    <div>
      <PageHeader eyebrow="Social" title="Social Posts" description="Create, schedule, and manage social media content." />
      <EmptyState icon={Activity} title="No posts yet" description="Create your first social post to engage your audience." />
    </div>
  );
}
