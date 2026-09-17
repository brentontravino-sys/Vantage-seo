import React, { useState } from 'react';
import { vizion } from '@/api/vizionClient';
import { Input } from '@/ui/input';
import { Textarea } from '@/ui/textarea';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Separator } from '@/ui/separator';
import { Loader2, RefreshCw, Sparkles, TrendingUp, Copy, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/ui/use-toast';

export default function KeywordExtractorPage() {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [max, setMax] = useState(20);
  const [minTf, setMinTf] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const extract = async () => {
    if (!url && !html) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = { html, url, max, minTf };
      const apiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await apiRes.json();
      if (!apiRes.ok) throw new Error(json.error || 'Keyword extraction failed');
      setResult(json);
      toast({ title: 'Keywords extracted', description: `${json.keywords.length} keywords from ${json.totalTokens.toLocaleString()} tokens.` });
    } catch (e) {
      setError(e.message);
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyKeywords = async () => {
    if (!result) return;
    const text = result.keywords.map(k => `${k.term} (${k.count})`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Page Keyword Extractor</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Extract candidate keywords from page content — TF-ranked unigrams and n-grams (1-3 words).
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Stopwords filtered. From seo-audits-toolkit patterns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/5 text-neutral-400">
              {result ? `${result.keywords.length} keywords` : 'No data'}
            </Badge>
          </div>
        </div>

        {/* Input */}
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500">Page URL <span className="text-neutral-600">(fetch live)</span></label>
                  <Input
                    placeholder="https://example.com/blog/post"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-neutral-600 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500">Max keywords</label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={max}
                    onChange={(e) => setMax(Math.min(100, Math.max(5, parseInt(e.target.value, 10) || 20)))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500">
                  Min term frequency <span className="text-neutral-600">(default 2)</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={minTf}
                  onChange={(e) => setMinTf(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 2)))}
                  className="bg-white/5 border-white/10 text-white w-24"
                />
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-500">
                  Or paste HTML directly <span className="text-neutral-600">(optional)</span>
                </label>
                <Textarea
                  placeholder="Paste full HTML of a page here..."
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={6}
                  className="bg-white/5 border-white/10 text-white placeholder-neutral-600 font-mono text-xs resize-y"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={extract} disabled={loading || (!url && !html)} className="gap-1" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Extracting...' : 'Extract Keywords'}
                </Button>
                {result && (
                  <>
                    <Button variant="outline" onClick={() => setResult(null)} className="gap-1">
                      Clear
                    </Button>
                    <div className="w-px h-6 bg-white/10" />
                    <Button variant="outline" onClick={copyKeywords} disabled={copied} className="gap-1" size="sm">
                      {copied ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Copied
                        </span>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy List
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && result.success && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-white/[0.02] border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-xs font-medium">Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{result.keywords.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/[0.02] border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-xs font-medium">Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{result.totalTokens.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-xs font-medium">Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-400 truncate">{result.url}</p>
                </CardContent>
              </Card>
            </div>

            {/* Keyword table */}
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Top Keywords (by frequency)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {result.keywords.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">
                    No keywords found above the minimum term frequency threshold.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {result.keywords.map((kw, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                        <span className="text-[10px] text-neutral-600 w-6 flex-shrink-0">{i + 1}</span>
                        <span className="text-sm text-neutral-200 font-medium flex-1">{kw.term}</span>
                        <Badge variant="secondary" className="text-[10px] bg-white/5 text-neutral-400 flex-shrink-0">
                          {kw.count}x
                        </Badge>
                        <span className="text-[10px] text-neutral-600 w-16 text-right flex-shrink-0 tabular-nums">
                          {kw.tf.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All keywords textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">All {result.keywords.length} keywords</span>
                <Badge variant="secondary" className="text-[10px] bg-white/5 text-neutral-500">
                  TF-ranked
                </Badge>
              </div>
              <textarea
                readOnly
                value={result.keywords.map(k => `${k.term} — ${k.count}x (TF: ${k.tf.toFixed(4)})`).join('\n')}
                rows={8}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 font-mono text-xs text-neutral-300 resize-y"
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !error && (
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-neutral-400">Enter a URL (to fetch live) or paste HTML to extract ranked keywords.</p>
            <p className="text-xs text-neutral-600 mt-1">Common SEO words and stopwords are filtered automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
