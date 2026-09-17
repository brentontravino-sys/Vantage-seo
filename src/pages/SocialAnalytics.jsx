import React from 'react';
import PageHeader from '@/ui/PageHeader';
import EmptyState from '@/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

export default function SocialAnalytics() {
  return (
    <div>
      <PageHeader eyebrow="Social" title="Social Analytics" description="Track social media performance and engagement metrics." />
      <EmptyState icon={BarChart3} title="No social data yet" description="Connect your social accounts to start tracking analytics." />
    </div>
  );
}
