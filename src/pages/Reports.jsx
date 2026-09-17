import React, { useEffect, useState } from 'react';
import { vizion } from '@/api/vizionClient';
import useProjects from '@/hooks/useProjects';
import PageHeader from '@/ui/PageHeader';
import ProjectSelect from '@/ui/ProjectSelect';
import EmptyState from '@/ui/EmptyState';
import ReportBuilder from '@/ui/ReportBuilder';
import { buildReportPdf } from '@/lib/reportPdf';
import { Button } from '@/ui/button';
import { FileText, Download, Trash2, Loader2 } from 'lucide-react';

export default function Reports() {
  const { projects, activeId, select, active } = useProjects();
  const [reports, setReports] = useState([]);
  const [downloading, setDownloading] = useState('');

  const load = (id) => vizion.entities.Report.filter({ project_id: id }, '-created_date').then(setReports);
  useEffect(() => { if (activeId) load(activeId); }, [activeId]);

  const download = async (report) => {
    setDownloading(report.id);
    const [keywords, issues, backlinks] = await Promise.all([
      vizion.entities.Keyword.filter({ project_id: activeId, tracked: true }, '-volume'),
      vizion.entities.AuditIssue.filter({ project_id: activeId }, '-pages_affected'),
      vizion.entities.Backlink.filter({ project_id: activeId }, '-domain_rating'),
    ]);
    const doc = buildReportPdf({ report, project: active, keywords, issues, backlinks });
    doc.save(`${report.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    setDownloading('');
  };

  const remove = async (id) => {
    await vizion.entities.Report.delete(id);
    await load(activeId);
  };

  return (
    <div>
      <PageHeader eyebrow="Reporting" title="Custom reports" description="Assemble a branded, client-ready PDF from any combination of your live SEO data.">
        <ProjectSelect projects={projects} activeId={activeId} onSelect={select} />
      </PageHeader>

      {!active ? (
        <EmptyState icon={FileText} title="Add a project first" description="Reports are built from a tracked site's data." />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <ReportBuilder project={active} onSaved={() => load(activeId)} />

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 px-1">Saved reports</p>
            {!reports.length && <p className="text-sm text-neutral-600 px-1">Nothing saved yet.</p>}
            {reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {[r.client_name, r.date_range, `${r.sections?.length || 0} sections`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => download(r)} disabled={downloading === r.id} className="text-neutral-400 hover:text-lime-300">
                    {downloading === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-neutral-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}