import React, { useState, useEffect } from 'react';
import { vizion } from '@/api/vizionClient';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Separator } from '@/ui/separator';
import { Switch } from '@/ui/switch';
import { Label } from '@/ui/label';
import {
  Loader2, Plus, Trash2, AlertTriangle, Bell, Mail, Link as LinkIcon,
  MessageSquare, Smartphone, Check, X, RefreshCw, BellOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/ui/use-toast';

const RULE_TYPES = [
  { value: 'traffic_drop', label: 'Traffic Drop', description: 'Alert when organic traffic drops below threshold vs last period' },
  { value: 'new_404', label: 'New 404 Pages', description: 'Alert when the crawler finds new broken pages (HTTP 400-499)' },
  { value: 'vitals_degradation', label: 'Core Web Vitals Degradation', description: 'Alert when LCP degrades >20% vs last measurement' },
];

const CHANNEL_LABELS = {
  email: 'Email',
  webhook: 'Webhook',
  slack: 'Slack',
  telegram: 'Telegram',
};

export default function AlertsPage() {
  const [siteUrl, setSiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({ ruleType: 'traffic_drop', threshold: -20, channels: {} });
  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      const apiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/alerts${siteUrl ? `?siteUrl=${encodeURIComponent(siteUrl)}` : ''}`, {
        method: 'GET',
      });
      const json = await apiRes.json();
      if (apiRes.ok) {
        setRules(json.rules || []);
        setLogs(json.logs || []);
        setError(null);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [siteUrl]);

  const addRule = async () => {
    if (!siteUrl || !newRule.ruleType) return;
    setLoading(true);
    try {
      const apiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          ruleType: newRule.ruleType,
          threshold: newRule.threshold != null ? newRule.threshold : null,
          channels: newRule.channels,
          enabled: true,
        }),
      });
      const json = await apiRes.json();
      if (!apiRes.ok) throw new Error(json.error || 'Failed to create rule');
      setRules(prev => prev.filter(r => !(r.siteUrl === siteUrl && r.ruleType === newRule.ruleType)).concat([json.rule]));
      setShowAddForm(false);
      setNewRule({ ruleType: 'traffic_drop', threshold: -20, channels: {} });
      toast({ title: 'Rule created', description: `Alert rule for ${RULE_TYPES.find(r => r.value === newRule.ruleType).label} added.` });
      loadAlerts();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (rule) => {
    try {
      const apiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: rule.siteUrl,
          ruleType: rule.ruleType,
          threshold: rule.threshold,
          channels: rule.channels,
          enabled: !rule.enabled,
        }),
      });
      const json = await apiRes.json();
      if (apiRes.ok) {
        setRules(prev => prev.map(r => r.id === rule.id ? json.rule : r));
        toast({ title: 'Rule updated', description: `Rule is now ${json.rule.enabled ? 'enabled' : 'disabled'}.` });
      }
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const deleteRule = async (ruleId) => {
    try {
      const apiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/alerts/${ruleId}`, {
        method: 'DELETE',
      });
      if (apiRes.ok) {
        setRules(prev => prev.filter(r => r.id !== ruleId));
        toast({ title: 'Rule deleted', description: 'Alert rule removed.' });
      }
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const runCheck = async () => {
    if (!siteUrl) return;
    setLoading(true);
    try {
      // First fetch current crawl + PSI data to pass as currentData
      const crawlRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: siteUrl, maxPages: 25, delayMs: 300 }),
      });
      const crawlData = await crawlRes.json();

      // Try PSI
      let psiData = null;
      try {
        const psiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/live/pagespeed?url=${encodeURIComponent(siteUrl)}&strategy=mobile`);
        psiData = await psiRes.json();
      } catch {}

      const checkRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/seo/alerts/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          currentData: {
            crawl: crawlData,
            psi: psiData?.live ? psiData : null,
            gsc: rules.find(r => r.ruleType === 'traffic_drop') ? { clicks: 1200, impressions: 45000 } : null,
          },
        }),
      });
      const json = await checkRes.json();
      if (json.triggered.length > 0) {
        toast({ title: `${json.triggered.length} alert(s) triggered`, description: json.triggered.map(t => t.message).join(' · ') });
      } else {
        toast({ title: 'Check complete', description: 'No alerts triggered.' });
      }
      loadAlerts();
    } catch (e) {
      toast({ title: 'Check failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getRuleTypeInfo = (value) => RULE_TYPES.find(r => r.value === value);

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Alerts</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Get notified when something changes: traffic drops, new 404s, or CWV degradation.
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Delivery: email, webhook, Slack, Telegram. From crawlseo patterns.
            </p>
          </div>
        </div>

        {/* Site selector + trigger */}
        <Card className="bg-white/[0.02] border-white/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Input
                  placeholder="https://example.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder-neutral-600 font-mono text-sm"
                />
                <p className="text-xs text-neutral-600">
                  Alerts are scoped to a site URL. Change the URL to manage rules for a different site.
                </p>
              </div>
              <Button onClick={runCheck} disabled={loading || !siteUrl} className="gap-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {loading ? 'Checking...' : 'Run Check Now'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add rule */}
        {showAddForm && (
          <Card className="bg-white/[0.02] border-emerald-500/20 border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Add Alert Rule</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="text-neutral-400">
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-500">Rule Type</Label>
                  <select
                    value={newRule.ruleType}
                    onChange={(e) => setNewRule(prev => ({ ...prev, ruleType: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {RULE_TYPES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-600 mt-1">{getRuleTypeInfo(newRule.ruleType)?.description}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-500">Threshold</Label>
                  {newRule.ruleType === 'traffic_drop' ? (
                    <Input
                      type="number"
                      value={newRule.threshold}
                      onChange={(e) => setNewRule(prev => ({ ...prev, threshold: parseInt(e.target.value, 10) || -20 }))}
                      className="bg-white/5 border-white/10 text-white w-24"
                      placeholder="-20"
                    />
                  ) : (
                    <div className="text-xs text-neutral-600 italic">Not applicable for this rule type</div>
                  )}
                </div>
              </div>

              {/* Channels */}
              <div className="space-y-3">
                <Label className="text-xs text-neutral-500">Delivery Channels</Label>
                {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {key === 'email' && <Mail className="w-4 h-4 text-neutral-500" />}
                      {key === 'webhook' && <LinkIcon className="w-4 h-4 text-neutral-500" />}
                      {key === 'slack' && <MessageSquare className="w-4 h-4 text-neutral-500" />}
                      {key === 'telegram' && <Smartphone className="w-4 h-4 text-neutral-500" />}
                      <span className="text-sm text-neutral-300">{label}</span>
                    </div>
                    <Input
                      placeholder={key === 'email' ? 'you@example.com' : key === 'webhook' ? 'https://hook.example.com' : key === 'slack' ? 'https://hooks.slack.com/...' : 'bot-token'}
                      value={newRule.channels[key] || ''}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        channels: { ...prev.channels, [key]: e.target.value || undefined },
                      }))}
                      className="bg-white/5 border-white/10 text-white w-64 text-sm font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={addRule} disabled={loading} className="gap-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rules list */}
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">Alert Rules ({rules.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1">
                <Plus className="w-4 h-4" />
                Add Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">
                No alert rules configured. Add a rule to get notified when something changes.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map(rule => {
                  const info = getRuleTypeInfo(rule.ruleType);
                  const channels = rule.channels || {};
                  const activeChannels = Object.entries(channels).filter(([, v]) => v).length;

                  return (
                    <div key={rule.id} className={cn(
                      'flex items-start gap-3 p-3 rounded-xl transition-colors',
                      rule.enabled ? 'bg-white/[0.02] border border-white/5' : 'bg-white/[0.01] border border-white/5 opacity-60'
                    )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-medium">{info?.label}</span>
                          <Badge variant="secondary" className={cn(
                            'text-[10px]',
                            rule.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-neutral-600'
                          )}>
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                          {rule.ruleType === 'traffic_drop' && rule.threshold != null && (
                            <span className="text-[10px] text-neutral-600">Threshold: {rule.threshold}%</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{info?.description}</p>

                        {/* Channels */}
                        {activeChannels > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {Object.entries(channels).filter(([, v]) => v).map(([key, val]) => (
                              <span key={key} className="text-[10px] bg-white/5 text-neutral-500 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                {CHANNEL_LABELS[key]}: {val.length > 20 ? val.slice(0, 17) + '...' : val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)} className="text-neutral-600 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert log */}
        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">
                No alerts triggered yet. Run a check to test your rules.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map(log => {
                  const info = getRuleTypeInfo(log.ruleType);
                  const channelIcons = log.delivery?.results?.map(r => {
                    if (r.channel === 'email') return <Mail key={r.channel} className="w-3 h-3 text-neutral-500" />;
                    if (r.channel === 'slack') return <MessageSquare key={r.channel} className="w-3 h-3 text-neutral-500" />;
                    if (r.channel === 'webhook') return <LinkIcon key={r.channel} className="w-3 h-3 text-neutral-500" />;
                    if (r.channel === 'telegram') return <Smartphone key={r.channel} className="w-3 h-3 text-neutral-500" />;
                    return null;
                  }).filter(Boolean);

                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        <Bell className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{info?.label}</span>
                          <span className="text-[10px] text-neutral-600">
                            {new Date(log.triggeredAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{log.message}</p>
                        {channelIcons.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {channelIcons}
                            <span className="text-[10px] text-neutral-600 ml-1">
                              {log.delivered ? 'Delivered' : 'Pending'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
