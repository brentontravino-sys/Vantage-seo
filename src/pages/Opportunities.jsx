import React, { useState, useEffect } from 'react';
import { vizion } from '@/api/vizionClient';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Progress } from '@/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { Separator } from '@/ui/separator';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  Loader2, Search, TrendingUp, TrendingDown, AlertTriangle, Target,
  Link2, RefreshCw, Sparkles, ChevronUp, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/ui/use-toast';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7', '#ec4899'];
const TYPE_COLORS = {
  striking_distance: '#22c55e',
  low_ctr: '#eab308',
  content_decay: '#ef4444',
  cannibalization: '#3b82f6',
};
const TYPE_LABELS = {
  striking_distance: 'Striking Distance',
  low_ctr: 'Low CTR',
  content_decay: 'Content Decay',
  cannibalization: 'Cannibalization',
};
const TYPE_ICONS = {
  striking_distance: Target,
  low_ctr: TrendingUp,
  content_decay: TrendingDown,
  cannibalization: Link2,
};

export default function OpportunitiesPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const fetchOpportunities = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const apiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/opportunities?url=${encodeURIComponent(url)}`, {
        method: 'GET',
      });
      const json = await apiRes.json();
      if (!apiRes.ok) throw new Error(json.error || 'Failed to fetch opportunities');
      setResult(json);
      toast({ title: 'Opportunities loaded', description: `${json.summary.total_opportunities} opportunities found across ${json.summary.pages_affected} pages.` });
    } catch (e) {
      setError(e.message);
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const opportunities = result?.opportunities || [];
  const filtered = activeTab === 'all' ? opportunities : opportunities.filter(o => o.type === activeTab);

  const trendData = result?.summary
    ? [
        { name: 'Striking\nDistance', value: result.summary.striking_distance_count, color: TYPE_COLORS.striking_distance },
        { name: 'Low\nCTR', value: result.summary.low_ctr_count, color: TYPE_COLORS.low_ctr },
        { name: 'Content\nDecay', value: result.summary.content_decay_count, color: TYPE_COLORS.content_decay },
        { name: 'Cannibal-\nization', value: result.summary.cannibalization_count, color: TYPE_COLORS.cannibalization },
      ]
    : [];

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">SEO Opportunities</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Surface-level SEO wins: keywords near position 1, low-CTR pages, content decay, and cannibalization.
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Combines crawl data + GSC search analytics. Adapted from crawlseo patterns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/5 text-neutral-400">
              {result ? `${result.summary.total_opportunities} opportunities` : 'No data'}
            </Badge>
            {result && (
              <Badge variant="secondary" className={cn(
                'bg-white/5 text-neutral-400',
                result.summary.total_opportunities > 10 && 'bg-emerald-500/10 text-emerald-400'
              )}>
                {result.summary.striking_distance_estimated_clicks} est. additional clicks
              </Badge>
            )}
          </div>
        </div>

        {/* Input */}
        <Card className="bg-white/[0.02] border-white/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-neutral-600 font-mono text-sm"
                />
              </div>
              <Button onClick={fetchOpportunities} disabled={loading || !url} className="gap-1" size="lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Analyzing...' : 'Find Opportunities'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && result.success && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Striking Distance', value: result.summary.striking_distance_count, color: 'text-emerald-400', icon: Target },
                { label: 'Low CTR Pages', value: result.summary.low_ctr_count, color: 'text-amber-400', icon: TrendingUp },
                { label: 'Content Decay', value: result.summary.content_decay_count, color: 'text-red-400', icon: TrendingDown },
                { label: 'Cannibalization', value: result.summary.cannibalization_count, color: 'text-blue-400', icon: Link2 },
              ].map(({ label, value, color, icon: Icon }) => (
                <Card key={label} className="bg-white/[0.02] border-white/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-xs font-medium">{label}</CardTitle>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {value === 0 ? 'No issues' : value === 1 ? '1 page affected' : `${value} opportunities`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart: opportunity distribution */}
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Opportunity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={60} tick={{ fill: '#737373', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #292524', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#e5e5e5' }}
                        formatter={(value, name, props) => [`${value} opportunity${value !== 1 ? 'ies' : 'y'}`, props.payload.name.replace('\n', ' ')]}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {trendData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed opportunities tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="all" className="text-neutral-300 data-[state=active]:bg-white/10 data-[state=active]:text-white text-sm">
                  All ({opportunities.length})
                </TabsTrigger>
                {(['striking_distance', 'low_ctr', 'content_decay', 'cannibalization']).map(type => (
                  <TabsTrigger key={type} value={type} className="text-neutral-300 data-[state=active]:bg-white/10 data-[state=active]:text-white text-sm">
                    {TYPE_LABELS[type]} ({opportunities.filter(o => o.type === type).length})
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* All tab */}
              <TabsContent value="all" className="mt-4 space-y-2">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-8 text-center text-neutral-500 text-sm">
                    No opportunities found. Run a crawl + GSC analysis to surface opportunities.
                  </div>
                ) : (
                  filtered.map((opp, i) => {
                    const Icon = TYPE_ICONS[opp.type] || AlertTriangle;
                    const color = TYPE_COLORS[opp.type] || '#737373';
                    return (
                      <OpportunityCard key={i} opp={opp} color={color} Icon={Icon} />
                    );
                  })
                )}
              </TabsContent>

              {/* Striking distance */}
              <TabsContent value="striking_distance" className="mt-4 space-y-2">
                {filtered.map((opp, i) => (
                  <OpportunityCard key={i} opp={opp} color={TYPE_COLORS.striking_distance} Icon={Target} />
                ))}
              </TabsContent>

              {/* Low CTR */}
              <TabsContent value="low_ctr" className="mt-4 space-y-2">
                {filtered.map((opp, i) => (
                  <OpportunityCard key={i} opp={opp} color={TYPE_COLORS.low_ctr} Icon={TrendingUp} />
                ))}
              </TabsContent>

              {/* Content decay */}
              <TabsContent value="content_decay" className="mt-4 space-y-2">
                {filtered.map((opp, i) => (
                  <OpportunityCard key={i} opp={opp} color={TYPE_COLORS.content_decay} Icon={TrendingDown} />
                ))}
              </TabsContent>

              {/* Cannibalization */}
              <TabsContent value="cannibalization" className="mt-4 space-y-2">
                {filtered.map((opp, i) => (
                  <OpportunityCard key={i} opp={opp} color={TYPE_COLORS.cannibalization} Icon={Link2} />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty state */}
        {!result && !error && (
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-neutral-400">Enter a site URL to find SEO opportunities.</p>
            <p className="text-xs text-neutral-600 mt-1">
              Striking distance keywords, low-CTR pages, content decay, and cannibalization detection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ opp, color, Icon }) {
  const severityColor = opp.severity === 'high' ? 'text-red-400 bg-red-500/10' : opp.severity === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-500 bg-white/5';

  return (
    <Card className="bg-white/[0.02] border-white/10 hover:bg-white/[0.04] transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon + type badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <Badge variant="secondary" className={cn('text-[10px] flex-1', severityColor)}>
              {opp.severity.toUpperCase()}
            </Badge>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-medium text-sm">
                {opp.type === 'striking_distance' && `Position #${opp.current_position} — "${opp.keyword}"`}
                {opp.type === 'low_ctr' && opp.page ? (
                  <a href={opp.page} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate text-sm font-medium">
                    {opp.page}
                  </a>
                ) : opp.page}
                {opp.type === 'content_decay' && opp.page ? (
                  <a href={opp.page} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate text-sm font-medium">
                    {opp.page}
                  </a>
                ) : opp.page}
                {opp.type === 'cannibalization' && `"${opp.keyword}"`}
              </span>
              <Badge variant="secondary" className="text-[10px] bg-white/5 text-neutral-500 gap-1">
                <span className="flex items-center gap-1">
                  {opp.type === 'striking_distance' && `${opp.monthly_impressions.toLocaleString()} imp/mo`}
                  {opp.type === 'low_ctr' && `${Math.round(opp.current_ctr * 100)}% CTR`}
                  {opp.type === 'content_decay' && `${opp.change_pct}%`}
                  {opp.type === 'cannibalization' && `${opp.competing_pages.length} pages`}
                </span>
              </Badge>
            </div>

            {/* Extra details */}
            {opp.type === 'striking_distance' && (
              <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <ChevronUp className="w-3 h-3 text-emerald-400" />
                  ~{opp.estimated_additional_clicks} est. clicks/mo
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Opp score: {opp.opportunity_score}
                </span>
              </div>
            )}
            {opp.type === 'low_ctr' && opp.ctr_change_pct != null && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={cn('flex items-center gap-1', opp.ctr_change_pct < 0 ? 'text-red-400' : 'text-emerald-400')}>
                  {opp.ctr_change_pct < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {Math.abs(opp.ctr_change_pct)}% vs last period
                </span>
                {opp.previous_ctr && (
                  <span className="text-neutral-600">(was {Math.round(opp.previous_ctr * 100)}%)</span>
                )}
              </div>
            )}
            {opp.type === 'content_decay' && (
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-neutral-500">
                  {opp.current_impressions.toLocaleString()} → {opp.previous_impressions.toLocaleString()} imp
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {Math.abs(opp.change_pct)}% drop
                </span>
              </div>
            )}
            {opp.type === 'cannibalization' && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {opp.competing_pages.map((cp, i) => (
                  <span key={i} className="text-[10px] bg-white/5 text-neutral-400 px-1.5 py-0.5 rounded-md font-mono truncate max-w-[160px]">
                    pos #{cp.position} · {cp.clicks} clicks
                  </span>
                ))}
              </div>
            )}

            {/* Recommendation */}
            <Separator className="my-2 bg-white/5" />
            <p className="text-xs text-neutral-400 leading-relaxed">
              {opp.recommendation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
