import jsPDF from 'jspdf';

const hexToRgb = (hex) => {
  const h = (hex || '#00a6fb').replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export function buildReportPdf({ report, project, keywords = [], issues = [], backlinks = [] }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const accent = hexToRgb(report.accent_color);
  let y = 0;

  // Cover band
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, W, 200, 'F');
  doc.setFillColor(...accent);
  doc.rect(0, 196, W, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(report.title, 48, 96, { maxWidth: W - 96 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(190, 190, 190);
  doc.text(`${project?.domain || ''}${report.client_name ? `  ·  ${report.client_name}` : ''}${report.date_range ? `  ·  ${report.date_range}` : ''}`, 48, 126);
  y = 248;

  const ensure = (need = 60) => {
    if (y + need > H - 60) { doc.addPage(); y = 64; }
  };

  const heading = (text) => {
    ensure(70);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(text, 48, y);
    doc.setDrawColor(...accent);
    doc.setLineWidth(2);
    doc.line(48, y + 8, 96, y + 8);
    y += 32;
  };

  const body = (text) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const lines = doc.splitTextToSize(text, W - 96);
    lines.forEach((l) => { ensure(20); doc.text(l, 48, y); y += 15; });
    y += 12;
  };

  const rows = (cols, data) => {
    doc.setFontSize(9);
    ensure(40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 120, 120);
    cols.forEach((c, i) => doc.text(c.label, 48 + i * ((W - 96) / cols.length), y));
    y += 6;
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.5);
    doc.line(48, y, W - 48, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    data.forEach((r) => {
      ensure(24);
      cols.forEach((c, i) => {
        const v = String(c.get(r) ?? '—');
        doc.text(doc.splitTextToSize(v, (W - 96) / cols.length - 10)[0] || '—', 48 + i * ((W - 96) / cols.length), y);
      });
      y += 16;
    });
    y += 16;
  };

  if (report.summary) { heading('Executive summary'); body(report.summary); }

  if (report.sections?.includes('overview') && project) {
    heading('Performance overview');
    rows(
      [{ label: 'Metric', get: (r) => r.k }, { label: 'Value', get: (r) => r.v }],
      [
        { k: 'Domain rating', v: project.domain_rating },
        { k: 'Monthly organic traffic', v: project.organic_traffic?.toLocaleString() },
        { k: 'Organic keywords', v: project.organic_keywords?.toLocaleString() },
        { k: 'Referring domains', v: project.referring_domains?.toLocaleString() },
        { k: 'Technical health', v: project.health_score != null ? `${project.health_score}%` : '—' },
      ]
    );
  }

  if (report.sections?.includes('rankings')) {
    heading('Keyword rankings');
    rows(
      [
        { label: 'Keyword', get: (r) => r.keyword },
        { label: 'Position', get: (r) => r.current_position },
        { label: 'Change', get: (r) => (r.previous_position != null && r.current_position != null ? r.previous_position - r.current_position : '—') },
        { label: 'Volume', get: (r) => r.volume?.toLocaleString() },
      ],
      keywords.slice(0, 30)
    );
  }

  if (report.sections?.includes('audit')) {
    heading('Technical issues');
    rows(
      [
        { label: 'Issue', get: (r) => r.title },
        { label: 'Severity', get: (r) => r.severity },
        { label: 'Pages', get: (r) => r.pages_affected },
      ],
      issues.slice(0, 30)
    );
  }

  if (report.sections?.includes('backlinks')) {
    heading('Backlink highlights');
    rows(
      [
        { label: 'Domain', get: (r) => r.source_domain },
        { label: 'DR', get: (r) => r.domain_rating },
        { label: 'Type', get: (r) => r.link_type },
      ],
      backlinks.slice(0, 30)
    );
  }

  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`${project?.domain || ''} · page ${p} of ${pages}`, 48, H - 32);
  }

  return doc;
}