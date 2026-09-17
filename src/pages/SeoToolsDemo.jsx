import React, { useState } from 'react';
import { vizion } from '@/api/vizionClient';
import {
  generateFAQSchema,
  generateHowToSchema,
  generateArticleSchema,
  generateProductSchema,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  generateVideoSchema,
  formatJsonLD,
  validateSchema,
  SCHEMA_TYPES,
} from '@/lib/schema-generator';
import QualityChecklist from '@/ui/QualityChecklist';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_EXAMPLES = [
  { question: 'What is SEO and why does it matter?', answer: 'SEO (Search Engine Optimization) is the practice of improving your website to increase its visibility in search engines like Google. It matters because higher visibility drives more organic traffic.' },
  { question: 'How long does SEO take to show results?', answer: 'SEO typically takes 3-6 months to show meaningful results, though this varies based on competition, industry, and the current state of your website.' },
];

const BUSINESS_TYPES = [
  'LocalBusiness', 'Restaurant', 'Dentist', 'MedicalClinic', 'Lawyer',
  'HomeAndConstructionBusiness', 'Store', 'AutoRepair', 'RealEstateAgent', 'HealthAndBeautyBusiness',
];
const ARTICLE_TYPES = ['Article', 'NewsArticle', 'BlogPosting'];
const PRODUCT_AVAILABILITY = ['InStock', 'OutOfStock', 'PreOrder', 'BackOrder'];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD'];

export default function SeoToolsDemo() {
  const [loading, setLoading] = useState(false);
  const [serverResult, setServerResult] = useState(null);
  const [error, setError] = useState(null);

  const [schemaType, setSchemaType] = useState('FAQPage');
  const [faqs, setFaqs] = useState(FAQ_EXAMPLES);
  const [schemaData, setSchemaData] = useState({});

  const generateServer = async () => {
    setLoading(true);
    setError(null);
    setServerResult(null);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const res = await fetch(`${base}/seo/schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: schemaType, data: schemaData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Schema generation failed');
      setServerResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">SEO Tools Demo</h1>
          <p className="text-neutral-400 mt-2">
            Two new tools wired into Vizion SEO:{' '}
            <span className="text-neutral-300">Schema Markup Generator</span> (from search-solved-public-seo)
            and{' '}
            <span className="text-neutral-300">Quality Checklist</span> (from seobuild-onpage).
          </p>
        </div>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Schema Markup Generator</CardTitle>
              <span className="text-xs text-neutral-500">Source: search-solved-public-seo (MIT)</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={schemaType} onValueChange={setSchemaType}>
              <TabsList className="bg-white/5 border border-white/10">
                {SCHEMA_TYPES.map((t) => (
                  <TabsTrigger key={t} value={t} className="text-neutral-300 data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs">
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="FAQPage" className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-neutral-300">Pre-filled FAQ examples:</Label>
                  <Button size="sm" variant="ghost" onClick={() => setFaqs(FAQ_EXAMPLES)} className="text-xs">
                    Reset examples
                  </Button>
                </div>
                {faqs.map((faq, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                    <Input
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[i].question = e.target.value;
                        setFaqs(next);
                      }}
                      className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
                    />
                    <Textarea
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[i].answer = e.target.value;
                        setFaqs(next);
                      }}
                      rows={2}
                      className="bg-white/5 border-white/10 text-white placeholder-neutral-600"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button onClick={generateServer} disabled={loading} className="gap-1">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Generate Schema
                  </Button>
                </div>
              </TabsContent>

              {SCHEMA_TYPES.filter((t) => t !== 'FAQPage').map((t) => (
                <TabsContent key={t} value={t} className="mt-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400">
                      <span className="text-white font-medium">{t}</span> form is available in the{' '}
                      <a href="/seo-tools" className="text-emerald-400 hover:underline">
                        full Schema Generator
                      </a>.
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      The full component supports HowTo, Article, Product, LocalBusiness, BreadcrumbList, and VideoObject.
                    </p>
                    <Button onClick={generateServer} disabled={loading} variant="outline" className="mt-4">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Generate {t} Schema
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {serverResult && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Schema generated successfully ({serverResult.type})</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                  <Textarea
                    value={serverResult.jsonLD}
                    readOnly
                    rows={8}
                    className="font-mono text-xs bg-transparent text-emerald-300 resize-y"
                    style={{ tabSize: 2 }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(serverResult.jsonLD)}
                    className="gap-1"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copy JSON-LD
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(serverResult.schema, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${schemaType.toLowerCase()}-schema.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="gap-1"
                  >
                    Download JSON
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
                <span className="text-neutral-500">Or generate client-side (no server call):</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const schema = schemaType === 'FAQPage'
                      ? generateFAQSchema(faqs)
                      : generateSchema(schemaType, schemaData);
                    if (schema) {
                      const valid = validateSchema(schema);
                      if (valid.valid) {
                        setServerResult({ type: schemaType, schema, jsonLD: formatJsonLD(schema) });
                      }
                    }
                  }}
                  className="gap-1"
                >
                  Generate Client-Side
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Content Quality Checklist</CardTitle>
              <span className="text-xs text-neutral-500">Source: seobuild-onpage (MIT)</span>
            </div>
            <p className="text-xs text-neutral-500">
              58-point SEO content quality scorecard. Threshold: 49/58 (84%) to pass.
              Adapted from the SEO-AGI framework by Greg Bessoni.
            </p>
          </CardHeader>
          <CardContent>
            <QualityChecklist />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
