import React from 'react';
import { usePageSpeed } from '@/hooks/useLiveData';
import { Loader2, Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function ScorePill({ label, score }) {
  if (score == null) return null;
  const tone =
    score >= 90 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
  return (
    <div className="flex flex-col items-center rounded-lg bg-white/5 px-3 py-2">
      <span className={cn('text-lg font-semibold', tone)}>{score}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

function Vital({ label, value, unit, good }) {
  if (value == null) return null;
  const Icon = good ? CheckCircle2 : AlertTriangle;
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1 text-sm font-medium', good ? 'text-emerald-400' : 'text-amber-400')}>
        <Icon className="h-3.5 w-3.5" />
        {value}
        {unit}
      </span>
    </div>
  );
}

/**
 * Live Core Web Vitals + Lighthouse panel powered by Google PageSpeed Insights.
 * Shows a clear "live"/"quota" badge so users know when data is real vs unavailable.
 */
export default function LivePageSpeedCard({ url, strategy = 'mobile' }) {
  const { data, loading, live, error } = usePageSpeed(url, strategy);

  return (
    <div className="rounded-xl border border-white/10 bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-lime-300" />
          <h3 className="text-sm font-semibold tracking-tight">Core Web Vitals &amp; Speed</h3>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium',
            live ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          )}
        >
          {live ? 'LIVE · PageSpeed' : error?.includes('429') ? 'GSC quota / no key' : 'unavailable'}
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Fetching real PageSpeed data…
        </div>
      )}

      {!loading && !live && (
        <p className="py-4 text-sm text-muted-foreground">
          Live Core Web Vitals need a Google PageSpeed API key (free). Add{' '}
          <code className="rounded bg-white/10 px-1">PSI_API_KEY</code> to enable. The crawler-based
          speed issues still surface under Site Audit.
        </p>
      )}

      {!loading && live && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <ScorePill label="Perf" score={data.scores?.performance} />
            <ScorePill label="SEO" score={data.scores?.seo} />
            <ScorePill label="A11y" score={data.scores?.accessibility} />
            <ScorePill label="Best Prac." score={data.scores?.bestPractices} />
          </div>
          <div className="space-y-2">
            <Vital label="LCP" value={data.coreWebVitals?.LCP} unit="ms" good={(data.coreWebVitals?.LCP ?? 9999) <= 2500} />
            <Vital label="INP" value={data.coreWebVitals?.INP} unit="ms" good={(data.coreWebVitals?.INP ?? 9999) <= 200} />
            <Vital label="CLS" value={data.coreWebVitals?.CLS} unit="" good={(data.coreWebVitals?.CLS ?? 99) <= 0.1} />
          </div>
          {data.opportunities?.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">On-page opportunities</p>
              <ul className="space-y-1">
                {data.opportunities.slice(0, 4).map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                    {o.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
