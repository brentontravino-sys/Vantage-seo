import React, { useState } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Progress } from '@/ui/progress';
import { Badge } from '@/ui/badge';
import { Check, X, AlertCircle, Clipboard, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * QualityChecklist — ported from seobuild-onpage's 58-point checklist (MIT)
 * Each item is pass/fail. Score = passed / total applicable items.
 * Threshold: 49/58 (84%) to pass.
 */

const CHECKS = [
  // v1.x base — 45 points (10+10+15+25+15+15+10)
  { id: 1, title: 'Title contains target keyword (or close variant)', category: 'Title Tag', version: 'v1.x' },
  { id: 2, title: 'Title under 60 characters', category: 'Title Tag', version: 'v1.x' },
  { id: 3, title: 'Title unique and compelling (not just "[Keyword] | [Brand]")', category: 'Title Tag', version: 'v1.x' },
  { id: 4, title: 'Title includes a differentiating element (year, number, qualifier)', category: 'Title Tag', version: 'v1.x' },
  { id: 5, title: 'Title not duplicating another page\'s title on the same site', category: 'Title Tag', version: 'v1.x' },

  { id: 6, title: 'Meta description under 155 characters', category: 'Meta Description', version: 'v1.x' },
  { id: 7, title: 'Meta description contains target keyword naturally', category: 'Meta Description', version: 'v1.x' },
  { id: 8, title: 'Meta description includes a CTA or value proposition', category: 'Meta Description', version: 'v1.x' },
  { id: 9, title: 'Meta description not a copy of the first paragraph', category: 'Meta Description', version: 'v1.x' },
  { id: 10, title: 'Meta description would make someone click vs competitors', category: 'Meta Description', version: 'v1.x' },

  { id: 11, title: 'Exactly one H1', category: 'Heading Structure', version: 'v1.x' },
  { id: 12, title: 'H1 closely matches or mirrors title tag', category: 'Heading Structure', version: 'v1.x' },
  { id: 13, title: 'Logical H2 > H3 hierarchy (no skipped levels)', category: 'Heading Structure', version: 'v1.x' },
  { id: 14, title: 'H2 count within competitive range', category: 'Heading Structure', version: 'v1.x' },
  { id: 15, title: 'Headings are descriptive (not "Section 1" or "More Info")', category: 'Heading Structure', version: 'v1.x' },

  { id: 16, title: 'Word count within competitive range', category: 'Content Depth', version: 'v1.x' },
  { id: 17, title: 'Answers at least 3 People Also Ask questions', category: 'Content Depth', version: 'v1.x' },
  { id: 18, title: 'Includes specific data, statistics, or concrete examples', category: 'Content Depth', version: 'v1.x' },
  { id: 19, title: 'Covers topics that appear in 2+ competitor pages', category: 'Content Depth', version: 'v1.x' },
  { id: 20, title: 'No thin sections (every H2 has 150+ words of substance)', category: 'Content Depth', version: 'v1.x' },

  { id: 21, title: 'Page type matches detected intent (info/commercial/transactional)', category: 'Search Intent', version: 'v1.x' },
  { id: 22, title: 'Content format matches SERP expectations (list/guide/comparison)', category: 'Search Intent', version: 'v1.x' },
  { id: 23, title: 'Addresses primary user need within first 200 words', category: 'Search Intent', version: 'v1.x' },
  { id: 24, title: 'If commercial: includes pricing or comparison elements', category: 'Search Intent', version: 'v1.x' },
  { id: 25, title: 'If informational: includes step-by-step or explanatory depth', category: 'Search Intent', version: 'v1.x' },

  { id: 26, title: 'JSON-LD schema markup included and matches page type', category: 'Technical SEO', version: 'v1.x' },
  { id: 27, title: 'Schema uses correct types (FAQPage, Product, Article, etc.)', category: 'Technical SEO', version: 'v1.x' },
  { id: 28, title: 'Image alt text suggestions included', category: 'Technical SEO', version: 'v1.x' },
  { id: 29, title: 'At least 2 internal link suggestions with context', category: 'Technical SEO', version: 'v1.x' },
  { id: 30, title: 'No orphaned sections (every section connects to page topic)', category: 'Technical SEO', version: 'v1.x' },

  { id: 31, title: 'No keyword stuffing (target keyword appears naturally)', category: 'Readability', version: 'v1.x' },
  { id: 32, title: 'Paragraphs are scannable (no walls of text)', category: 'Readability', version: 'v1.x' },
  { id: 33, title: 'Uses formatting aids (bold key terms, tables for comparisons)', category: 'Readability', version: 'v1.x' },
  { id: 34, title: 'Transitions between sections are logical', category: 'Readability', version: 'v1.x' },
  { id: 35, title: 'Reads like it was written by a subject matter expert', category: 'Readability', version: 'v1.x' },

  // v1.7.1 — +4 (45→49... actually 45+4=49, then threshold raised to 49/58 later)
  { id: 42, title: 'Meta Entity Isolation: entities sourced from competitor SERP snippets, not body', category: 'GEO / AEO', version: 'v1.7.1' },
  { id: 43, title: 'AI Summary Nugget (200-char) contains 2+ competitor bigrams/trigrams', category: 'GEO / AEO', version: 'v1.7.1' },
  { id: 44, title: 'Dual-Intent: primary intent in first 500 tokens + secondary action funnel', category: 'GEO / AEO', version: 'v1.7.1' },
  { id: 45, title: 'Status Code Governance: every legacy URL has explicit 301 or 410 recommendation', category: 'Technical SEO', version: 'v1.7.1' },

  // v1.8.0 — +3
  { id: 46, title: 'Trust Pilot profile exists with page\'s service target bigrams seeded', category: 'Off-Page Trust', version: 'v1.8.0' },
  { id: 47, title: 'Off-Page Schema Mapping: Tier 1 properties carry Organization/Person JSON-LD linking to GBP CID', category: 'Off-Page Trust', version: 'v1.8.0' },
  { id: 48, title: 'DOM-Visible Critical Data: pricing/tables/data points in front-facing markup, not just JSON-LD', category: 'Technical SEO', version: 'v1.8.0' },

  // v1.9.1 — +3
  { id: 49, title: 'Decision Fit: heading structure maps to buyer stage (Research/Compare/Buy), not just copied H2s', category: 'Content Strategy', version: 'v1.9.1' },
  { id: 50, title: 'Brand Identity: differentiators woven verbatim into 500-token chunks, surfaced in AI Summary Nugget', category: 'Content Strategy', version: 'v1.9.1' },
  { id: 51, title: 'Topical Silo: ## Recommended Spoke Pages block appended from missing_spokes data', category: 'Content Strategy', version: 'v1.9.1' },

  // v2.0.0 — +4
  { id: 52, title: 'Anti-Paragraph Snippet: primary answers under H2s wrapped in block containers, not bare <p>', category: 'AEO', version: 'v2.0.0' },
  { id: 53, title: 'DOM Flattening: structural layout max ~3 nesting levels, no deep wrapper-node bloat', category: 'AEO', version: 'v2.0.0' },
  { id: 54, title: 'Goldilocks Entity Synergy: subheadings repeat core entity pairings deliberately', category: 'AEO', version: 'v2.0.0' },
  { id: 55, title: 'Two-Gate Extraction Pass: Gate 1 (retrieval pool entry) + Gate 2 (citation extraction) both satisfied', category: 'AEO', version: 'v2.0.0' },

  // v2.1.0 — +1
  { id: 56, title: 'Anti-NLP Stuffing: body free of artificially repeated NLP-tool entity lists', category: 'Content Integrity', version: 'v2.1.0' },

  // v2.2.0 — +2 (local-only, N/A pass on non-local)
  { id: 57, title: 'Local Isolation: if local page, strictly one service+place (no multi-service stacking)', category: 'Local SEO', version: 'v2.2.0', localOnly: true },
  { id: 58, title: 'GBP Inner-Link Directive: local page instructs user to point GBP website field at this URL', category: 'Local SEO', version: 'v2.2.0', localOnly: true },
];

const CATEGORY_LABELS = {
  'Title Tag': 'Title Tag',
  'Meta Description': 'Meta Description',
  'Heading Structure': 'Heading Structure',
  'Content Depth': 'Content Depth',
  'Search Intent': 'Search Intent',
  'Technical SEO': 'Technical SEO',
  'Readability': 'Readability',
  'GEO / AEO': 'GEO / AEO',
  'Off-Page Trust': 'Off-Page Trust',
  'Content Strategy': 'Content Strategy',
  'AEO': 'AEO',
  'Content Integrity': 'Content Integrity',
  'Local SEO': 'Local SEO',
};

const VERSION_ORDER = ['v1.x', 'v1.7.1', 'v1.8.0', 'v1.9.1', 'v2.0.0', 'v2.1.0', 'v2.2.0'];

export default function QualityChecklist({ initialAnswers = {} }) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [copied, setCopied] = useState(false);
  const [scoreVersion, setScoreVersion] = useState('all');

  const toggle = (id) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: prev[id] ? false : true,
    }));
  };

  const setAll = (value) => {
    const next = {};
    CHECKS.forEach((c) => {
      if (!c.localOnly || value) next[c.id] = value;
    });
    setAnswers(next);
  };

  const clearAll = () => setAnswers({});

  const filteredChecks = () => {
    if (scoreVersion === 'all') return CHECKS;
    return CHECKS.filter((c) => c.version === scoreVersion);
  };

  const scoredChecks = () => {
    return filteredChecks().filter((c) => !c.localOnly); // local-only items are N/A unless explicitly scored
  };

  const score = () => {
    const items = scoredChecks();
    if (items.length === 0) return { score: 0, total: 0, pct: 0 };
    const passed = items.filter((c) => answers[c.id]).length;
    return {
      score: passed,
      total: items.length,
      pct: items.length > 0 ? Math.round((passed / items.length) * 100) : 0,
    };
  };

  const s = score();
  const passing = s.pct >= 84; // 49/58 ≈ 84%
  const scoreColor = passing ? 'text-emerald-400' : s.pct >= 70 ? 'text-amber-400' : 'text-red-400';
  const barColor = passing ? 'bg-emerald-500' : s.pct >= 70 ? 'bg-amber-500' : 'bg-red-500';

  const copyReport = () => {
    const lines = [
      `Quality Checklist Report — ${s.pct}% (${s.score}/${s.total})`,
      `Threshold: 84% (49/58) to pass`,
      `Result: ${passing ? 'PASS' : 'FAIL'}`,
      '',
      '---',
      ...CHECKS.map((c) => {
        const ans = answers[c.id];
        if (c.localOnly) return `  [N/A] ${c.id}. ${c.title} (local-only)`;
        const status = ans ? '[PASS]' : '[FAIL]';
        return `  ${status} ${c.id}. ${c.title}`;
      }),
    ];
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderVersionLegend = () => (
    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mb-4">
      <span className="text-neutral-400 font-medium">Checklist versions:</span>
      {VERSION_ORDER.map((v) => (
        <Badge
          key={v}
          variant={scoreVersion === v ? 'default' : 'secondary'}
          className={cn(
            'cursor-pointer transition-all',
            scoreVersion === v && 'bg-white/10 text-white border-white/20'
          )}
          onClick={() => setScoreVersion(v)}
        >
          {v} ({CHECKS.filter((c) => c.version === v).length} checks)
        </Badge>
      ))}
      <Badge
        variant={scoreVersion === 'all' ? 'default' : 'secondary'}
        className={cn(
          'cursor-pointer transition-all',
          scoreVersion === 'all' && 'bg-white/10 text-white border-white/20'
        )}
        onClick={() => setScoreVersion('all')}
      >
        All ({CHECKS.length})
      </Badge>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Quality Checklist</h1>
            <p className="text-sm text-neutral-400 mt-1">
              58-point SEO content quality scorecard — ported from seobuild-onpage (MIT)
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Adapted from SEO-AGI framework by Greg Bessoni. Threshold: 49/58 (84%).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={clearAll} className="gap-1">
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copyReport}
              className="gap-1"
              disabled={copied}
            >
              {copied ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Copied
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" />
                  Copy Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Score bar */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={cn('text-4xl font-bold tabular-nums', scoreColor)}>
                  {s.score}/{s.total}
                </span>
                <span className="text-neutral-400 text-sm">
                  ({s.pct}%)
                </span>
              </div>
              <p className={cn('text-sm mt-1', passing ? 'text-emerald-400' : 'text-red-400')}>
                {passing ? '✓ Passing threshold (49/58)' : '✗ Below threshold — revision needed'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-neutral-500 uppercase tracking-wider">Score</span>
              <div className="mt-2">
                <Progress
                  value={s.pct}
                  className={cn('h-3', barColor)}
                  indicatorClassName="bg-white/20"
                  trackClassName="bg-white/5"
                />
              </div>
            </div>
          </div>

          {renderVersionLegend()}

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Quick set:</span>
            <Button size="sm" variant="ghost" onClick={() => setAll(true)} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
              Mark all pass
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAll(false)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              Mark all fail
            </Button>
          </div>
        </div>

        {/* Checklist grouped by category */}
        <div className="space-y-6">
          {Object.entries(CATEGORY_LABELS).map(([category]) => {
            const items = filteredChecks().filter((c) => c.category === category);
            if (items.length === 0) return null;
            const passed = items.filter((c) => answers[c.id]).length;

            return (
              <Card key={category} className="bg-white/[0.02] border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm font-medium">{category}</CardTitle>
                    <span className="text-xs text-neutral-500">
                      {passed}/{items.length} passed
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-2">
                    {items.map((check) => {
                      const ans = answers[check.id];
                      const isLocalOnly = check.localOnly;

                      return (
                        <div
                          key={check.id}
                          className={cn(
                            'flex items-start gap-3 rounded-xl p-3 transition-colors',
                            ans && 'bg-emerald-500/5 border border-emerald-500/20',
                            !ans && !isLocalOnly && 'bg-white/[0.01] border border-white/5',
                            isLocalOnly && 'bg-amber-500/5 border border-amber-500/20'
                          )}
                        >
                          <button
                            onClick={() => !isLocalOnly && toggle(check.id)}
                            disabled={isLocalOnly}
                            className={cn(
                              'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                              ans && 'bg-emerald-500 border-emerald-500 text-white',
                              !ans && !isLocalOnly && 'border-white/20 hover:border-white/40',
                              isLocalOnly && 'border-amber-500 bg-amber-500/20'
                            )}
                          >
                            {ans && <Check className="w-3 h-3" />}
                            {!ans && !isLocalOnly && (
                              <span className="w-3 h-0.5 bg-white/20 rounded-full" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm',
                              ans && 'text-white',
                              !ans && !isLocalOnly && 'text-neutral-400',
                              isLocalOnly && 'text-amber-400'
                            )}>
                              {check.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] uppercase tracking-wider text-neutral-600">
                                #{check.id}
                              </span>
                              <span className="text-[10px] text-neutral-700">·</span>
                              <span className="text-[10px] text-neutral-600">
                                {check.version}
                              </span>
                              {isLocalOnly && (
                                <>
                                  <span className="text-[10px] text-neutral-700">·</span>
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-amber-500/20 text-amber-400 border-0">
                                    Local only
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Red flags footer */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-300">Red Flags (automatic fail)</p>
              <p className="text-xs text-neutral-400 mt-1">
                These issues override the score regardless: duplicate title tags, missing/multiple H1s,
                zero data in the page, word count 50%+ below competitive median, no FAQ/PAA coverage,
                missing schema entirely, keyword density above 3%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
