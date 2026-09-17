import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const tone = {
  error: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  warning: 'bg-amber-300/10 text-amber-200 border-amber-300/20',
  notice: 'bg-sky-300/10 text-sky-200 border-sky-300/20',
};

export default function IssueCard({ issue }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors">
        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border ${tone[issue.severity] || tone.notice}`}>
          {issue.severity}
        </span>
        <span className="text-neutral-100 flex-1 text-sm">{issue.title}</span>
        <span className="text-xs text-neutral-500 tabular-nums hidden sm:block">{issue.pages_affected} pages</span>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 text-sm">
          <p className="text-neutral-400 leading-relaxed">{issue.description}</p>

          {/* Security headers detail (present when the crawler captures headers) */}
          {issue.headers && (
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Response headers</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'strict-transport-security', label: 'HSTS', present: !!issue.headers['strict-transport-security'] },
                  { key: 'content-security-policy', label: 'CSP', present: !!issue.headers['content-security-policy'] },
                  { key: 'x-frame-options', label: 'X-Frame-Options', present: !!issue.headers['x-frame-options'] },
                  { key: 'x-content-type-options', label: 'X-Content-Type-Options', present: !!issue.headers['x-content-type-options'] },
                  { key: 'referrer-policy', label: 'Referrer-Policy', present: !!issue.headers['referrer-policy'] },
                  { key: 'permissions-policy', label: 'Permissions-Policy', present: !!issue.headers['permissions-policy'] },
                ].map(({ label, present }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-neutral-400">{label}</span>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      present
                        ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'
                        : 'bg-rose-400/10 text-rose-300 border-rose-400/20'
                    }`}>
                      {present ? 'Present' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
              {/* Show raw values for present headers */}
              {Object.entries(issue.headers).length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-2">Raw values</p>
                  <div className="space-y-1 font-mono text-[11px]">
                    {Object.entries(issue.headers).slice(0, 8).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2">
                        <span className="text-neutral-500 shrink-0">{k}:</span>
                        <span className="text-neutral-300 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl bg-lime-300/[0.06] border border-lime-300/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-lime-300/80 mb-2">How to fix</p>
            <p className="text-neutral-300 leading-relaxed">{issue.how_to_fix}</p>
          </div>
          <p className="text-xs text-neutral-600 capitalize">{issue.category?.replace('-', ' ')}</p>
        </div>
      )}
    </div>
  );
}