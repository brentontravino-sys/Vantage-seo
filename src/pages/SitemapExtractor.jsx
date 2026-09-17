import React, { useState, useEffect } from 'react';
import { vizion } from '@/api/vizionClient';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Separator } from '@/ui/separator';
import { Loader2, Download, RefreshCw, AlertCircle, Check, TrendingDown, TrendingUp, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/ui/use-toast';

const PAGE_SIZE = 100;

export default function SitemapPage() {
  const [url, setUrl] = useState('');
  const [sitemapPath, setSitemapPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const fetchSitemap = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPage(1);
    try {
      const res = await vizion.entities.Report.create({
        url,
        sitemapPath: sitemapPath || undefined,
        maxUrls: 10000,
      });
      // The entity route won't handle this — use fetch directly
      const apiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/sitemap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, sitemapPath: sitemapPath || undefined, maxUrls: 10000 }),
      });
      const json = await apiRes.json();
      if (!apiRes.ok) throw new Error(json.error || 'Sitemap extraction failed');
      setResult(json);
      toast({ title: 'Sitemap extracted', description: `${json.total} URLs found across ${json.sitemapsFound.length} sitemap(s).` });
    } catch (e) {
      setError(e.message);
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyUrls = async () => {
    if (!result) return;
    const text = result.urls.map(u => u.url).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCsv = () => {
    if (!result) return;
    const header = 'url,lastmod,changefreq,priority\n';
    const rows = result.urls.map(u =>
      `"${u.url}","${u.lastmod || ''}","${u.changefreq || ''}","${u.priority || ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sitemap-urls-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const displayedUrls = result ? result.urls.slice(0, PAGE_SIZE * page) : [];
  const hasMore = result && result.urls.length > PAGE_SIZE * page;

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Sitemap Extractor</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Extract all URLs from a site's XML sitemap(s) — supports sitemap indexes with sub-sitemap recursion.
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              From seo-audits-toolkit & crawlseo patterns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/5 text-neutral-400">
              {result ? `${result.total.toLocaleString()} URLs` : 'No data'}
            </Badge>
          </div>
        </div>

        {/* Input */}
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Extract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500">Site URL</label>
                  <Input
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-neutral-600 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-500">
                    Sitemap path <span className="text-neutral-600">(optional)</span>
                  </label>
                  <Input
                    placeholder="/sitemap.xml"
                    value={sitemapPath}
                    onChange={(e) => setSitemapPath(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-neutral-600 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={fetchSitemap} disabled={loading || !url} className="gap-1" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {loading ? 'Extracting...' : 'Extract Sitemap'}
                </Button>
                {result && (
                  <>
                    <Button variant="outline" onClick={() => setResult(null)} className="gap-1">
                      Clear
                    </Button>
                    <div className="w-px h-6 bg-white/10" />
                    <Button variant="outline" onClick={copyUrls} disabled={copied} className="gap-1" size="sm">
                      {copied ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Copied
                        </span>
                      ) : (
                        <>
                          <CornerDownLeft className="w-4 h-4" /> Copy URLs
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={downloadCsv} className="gap-1" size="sm">
                      <Download className="w-4 h-4" /> CSV
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
        {result && result.ok && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {result.sitemapsFound.map((s, i) => (
                <Card key={i} className="bg-white/[0.02] border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-xs font-medium">
                      {s.entries > 0 ? `${s.entries} URLs` : 'Not reachable'}{' '}
                      <span className="text-neutral-500 font-normal">from {s.url}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {s.error && <p className="text-xs text-red-400">{s.error}</p>}
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-xs font-medium">
                    Total <span className="text-neutral-500 font-normal">({result.total.toLocaleString()})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-neutral-500">
                    Source: {result.sourceUrl}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* URL table */}
            <Card className="bg-white/[0.02] border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">URLs ({displayedUrls.length} of {result.total})</CardTitle>
                  {hasMore && (
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} className="text-neutral-400 hover:text-white">
                      Load more ({result.urls.length - displayedUrls.length} remaining)
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {displayedUrls.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">
                    No URLs found in sitemap.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {displayedUrls.map((u, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                        <span className="text-[10px] text-neutral-600 w-6 flex-shrink-0">{i + 1 + (page - 1) * PAGE_SIZE}</span>
                        <span className="text-sm text-neutral-300 truncate font-mono flex-1">{u.url}</span>
                        {u.lastmod && (
                          <Badge variant="secondary" className="text-[10px] bg-white/5 text-neutral-500 flex-shrink-0">
                            {new Date(u.lastmod).toLocaleDateString()}
                          </Badge>
                        )}
                        {u.priority && (
                          <span className="text-[10px] text-neutral-600 flex-shrink-0">p={u.priority}</span>
                        )}
                        {u.changefreq && (
                          <span className="text-[10px] text-neutral-600 flex-shrink-0">{u.changefreq}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Full URL list textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">All {result.total} URLs</span>
                <span className="text-neutral-600">{result.urls.map(u => u.url).join('\n').length.toLocaleString()} chars</span>
              </div>
              <textarea
                readOnly
                value={result.urls.map(u => u.url).join('\n')}
                rows={10}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 font-mono text-xs text-neutral-300 resize-y placeholder-neutral-600"
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !error && (
          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-neutral-400">Enter a site URL and click Extract to pull all URLs from its XML sitemap.</p>
          </div>
        )}
      </div>
    </div>
  );
}
