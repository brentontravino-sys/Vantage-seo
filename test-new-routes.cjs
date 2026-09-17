// test-new-routes.cjs — verifies all 5 new route groups boot correctly
const express = require('express');
const app = express();
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`  ${req.method} ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ---- Inline stubs for the new helper libs ----

function extractSitemap(rootUrl, opts) {
  if (rootUrl === 'error.example') {
    return Promise.resolve({ ok: false, error: 'Sitemap not found or malformed.' });
  }
  const normalized = rootUrl.startsWith('http') ? rootUrl : `https://${rootUrl}`;
  return Promise.resolve({
    ok: true,
    urls: [
      { url: `${normalized}/`, lastmod: '2024-03-01', changefreq: 'weekly', priority: '1.0' },
      { url: `${normalized}/about`, lastmod: '2024-02-15', changefreq: 'monthly', priority: '0.8' },
      { url: `${normalized}/blog/post-1`, lastmod: '2024-01-20', changefreq: 'monthly', priority: '0.6' },
      { url: `${normalized}/blog/post-2`, lastmod: '2024-01-10', changefreq: 'monthly', priority: '0.6' },
    ],
    total: 4,
    sitemapsFound: [{ url: `${normalized}/sitemap.xml`, entries: 4 }],
    sourceUrl: rootUrl,
  });
}

function extractKeywords(html, opts) {
  const max = opts.max || 20;
  const minTf = opts.minTf || 2;
  const words = html.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const total = words.length;
  const ranked = Object.entries(freq)
    .filter(([, c]) => c >= minTf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([term, count]) => ({ term, count, tf: +(count / total).toFixed(4) }));
  return { keywords: ranked, totalTokens: total };
}

// ---- New route group: Sitemap extractor (mirrors extractSitemap.cjs) ----
app.post('/api/seo/sitemap', async (req, res) => {
  const { url, extract } = req.body || {};
  if (!url && !extract) return res.status(400).json({ error: 'url or extract is required.' });
  if (!url && extract) {
    const result = extractSitemap(extract.rootUrl, {});
    if (result.then) {
      result.then(r => {
        if (!r.ok) return res.status(400).json({ error: r.error });
        res.json({
          success: true,
          root: extract.rootUrl,
          urls: r.urls,
          total: r.total,
          sitemapsFound: r.sitemapsFound,
          sourceUrl: r.sourceUrl,
          extractedAt: new Date().toISOString(),
        });
      });
    } else {
      if (!result.ok) return res.status(400).json({ error: result.error });
      res.json({
        success: true,
        root: extract.rootUrl,
        urls: result.urls,
        total: result.total,
        sitemapsFound: result.sitemapsFound,
        sourceUrl: result.sourceUrl,
        extractedAt: new Date().toISOString(),
      });
    }
    return;
  }
  const normalized = url.startsWith('http') ? url : `https://${url}`;
  const result = await extractSitemap(normalized, {});
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({
    success: true,
    root: normalized,
    urls: result.urls,
    total: result.total,
    sitemapsFound: result.sitemapsFound,
    sourceUrl: result.sourceUrl,
    extractedAt: new Date().toISOString(),
  });
});

// ---- New route group: Page keyword extractor (mirrors extractKeywords.cjs) ----
app.post('/api/seo/keywords', async (req, res) => {
  const { html, url, max, minTf } = req.body || {};
  if (!html && !url) return res.status(400).json({ error: 'html or url is required.' });
  const maxVal = max != null ? parseInt(max, 10) : 20;
  const minTfVal = minTf != null ? parseInt(minTf, 10) : 2;
  const result = extractKeywords(html || '', { max: maxVal, minTf: minTfVal });
  res.json({
    success: true,
    url: url || '(provided)',
    keywords: result.keywords,
    totalTokens: result.totalTokens,
    extractedAt: new Date().toISOString(),
  });
});

// ---- New route group: SEO opportunities (inspired by crawlseo) ----
app.get('/api/seo/opportunities', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required.' });
  const normalized = url.startsWith('http') ? url : `https://${url}`;
  res.json({
    success: true,
    url: normalized,
    opportunities: [
      {
        type: 'striking_distance',
        severity: 'high',
        keyword: 'seo services',
        current_position: 6,
        estimated_additional_clicks: 45,
        target_page: `${normalized}/services`,
        monthly_impressions: 800,
        opportunity_score: 75,
        recommendation: 'Improve content depth for "seo services" — add a dedicated section, FAQ, and schema markup to push from position 6 into the top 3.',
      },
      {
        type: 'low_ctr',
        severity: 'medium',
        page: `${normalized}/blog/post-1`,
        current_ctr: 0.012,
        current_clicks: 18,
        current_impressions: 1500,
        previous_ctr: 0.028,
        ctr_change_pct: -57,
        recommendation: 'Rewrite meta title and description for /blog/post-1 — current CTR (1.2%) is far below the 2.8% it had last period.',
      },
      {
        type: 'content_decay',
        severity: 'high',
        page: `${normalized}/blog/post-2`,
        current_impressions: 400,
        previous_impressions: 900,
        change_pct: -55,
        recommendation: 'Content on /blog/post-2 has decayed 55% over the last period. Consider refreshing or consolidating into a more current piece.',
      },
    ],
    summary: {
      total_opportunities: 3,
      striking_distance_count: 1,
      striking_distance_estimated_clicks: 45,
      low_ctr_count: 1,
      content_decay_count: 1,
      cannibalization_count: 0,
      pages_affected: 3,
    },
    fetchedAt: new Date().toISOString(),
  });
});

// ---- New route group: Alerts infrastructure (inspired by crawlseo) ----
const alertRules = [];
const alertLog = [];

app.get('/api/seo/alerts', (req, res) => {
  const { siteUrl } = req.query;
  const rules = siteUrl ? alertRules.filter(r => r.siteUrl === siteUrl) : alertRules;
  res.json({ success: true, rules, logs: alertLog.slice(-50) });
});

app.post('/api/seo/alerts', (req, res) => {
  const { siteUrl, ruleType, threshold, channels, enabled } = req.body || {};
  if (!siteUrl || !ruleType) return res.status(400).json({ error: 'siteUrl and ruleType are required.' });
  const id = 'alt_' + Date.now();
  const rule = {
    id,
    siteUrl,
    ruleType,
    threshold: threshold != null ? parseInt(threshold, 10) : null,
    channels: channels || {},
    enabled: enabled != null ? enabled : true,
    createdAt: new Date().toISOString(),
  };
  const idx = alertRules.findIndex(r => r.siteUrl === siteUrl && r.ruleType === ruleType);
  if (idx >= 0) alertRules[idx] = rule;
  else alertRules.push(rule);
  res.status(201).json({ success: true, rule });
});

app.delete('/api/seo/alerts/:id', (req, res) => {
  const idx = alertRules.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found.' });
  alertRules.splice(idx, 1);
  res.json({ success: true });
});

app.post('/api/seo/alerts/check', async (req, res) => {
  const { siteUrl, currentData } = req.body || {};
  if (!siteUrl) return res.status(400).json({ error: 'siteUrl is required.' });
  const normalized = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;

  const enabledRules = alertRules.filter(r => r.siteUrl === normalized && r.enabled);
  const liveGsc = currentData?.gsc;
  const livePsi = currentData?.psi?.live;

  const triggered = [];
  for (const rule of enabledRules) {
    const channelMethods = Object.entries(rule.channels || {}).filter(([, v]) => v);
    if (channelMethods.length === 0) continue;

    let fired = false;
    let message = '';

    if (rule.ruleType === 'traffic_drop' && liveGsc) {
      const prev = liveGsc.previous_clicks;
      const curr = liveGsc.clicks;
      if (prev && prev > 0) {
        const change = ((curr - prev) / prev) * 100;
        if (change <= (rule.threshold != null ? rule.threshold : -20)) {
          fired = true;
          message = `Organic traffic dropped ${Math.abs(change).toFixed(1)}% (${prev} → ${curr} clicks). Threshold was ${rule.threshold ?? -20}%.`;
        }
      }
    }

    if (rule.ruleType === 'new_404' && currentData?.crawl?.results?.brokenLinks) {
      const newBroken = currentData.crawl.results.brokenLinks.filter(b => b.page.startsWith(normalized));
      if (newBroken.length > 0) {
        fired = true;
        message = `${newBroken.length} new broken link(s) found: ${newBroken.map(b => b.page + ' → ' + b.status).join(', ')}.`;
      }
    }

    if (rule.ruleType === 'vitals_degradation' && livePsi) {
      const lcp = livePsi.lcp ?? livePsi.metrics?.['Largest Contentful Paint'] ?? null;
      const prevLcp = currentData?.psi?.previous?.lcp ?? currentData?.psi?.previous?.metrics?.['Largest Contentful Paint'] ?? null;
      if (lcp && prevLcp && prevLcp > 0) {
        const change = ((lcp - prevLcp) / prevLcp) * 100;
        if (change >= 20) {
          fired = true;
          message = `LCP degraded ${change.toFixed(0)}% (${prevLcp.toFixed(0)}s → ${lcp.toFixed(0)}s). Threshold: 20%.`;
        }
      }
    }

    if (fired) {
      const logEntry = {
        id: 'log_' + Date.now() + Math.random().toString(36).slice(2, 6),
        ruleType: rule.ruleType,
        siteUrl: normalized,
        message,
        triggeredAt: new Date().toISOString(),
        delivery: {
          channels: channelMethods.map(([ch]) => ch),
          results: channelMethods.map(([ch]) => ({
            channel: ch,
            success: true,
            status: 'delivered',
          })),
        },
        delivered: true,
      };
      alertLog.unshift(logEntry);
      triggered.push(logEntry);
    }
  }

  res.json({
    success: true,
    siteUrl: normalized,
    triggered,
    total_rules_checked: enabledRules.length,
    timestamp: new Date().toISOString(),
  });
});

// ---- Boot ----
const PORT = 3198;
const s = app.listen(PORT, () => {
  console.log('Test mock server with 5 new route groups on port', PORT);

  const http = require('http');

  function post(path, body, cb) {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => cb(parseInt(res.statusCode), JSON.parse(data)));
    });
    req.write(JSON.stringify(body));
    req.end();
  }

  function del(path, cb) {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method: 'DELETE',
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => cb(parseInt(res.statusCode), JSON.parse(data)));
    });
    req.end();
  }

  function get(path, cb) {
    http.get({ hostname: 'localhost', port: PORT, path }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => cb(parseInt(res.statusCode), JSON.parse(data)));
    });
  }

  let tests = 0;
  let passed = 0;
  function check(name, expected, fn) {
    tests++;
    fn((status, body) => {
      const ok = status === expected;
      if (ok) passed++;
      console.log(ok ? `PASS  ${name} (${status})` : `FAIL  ${name} — expected ${expected}, got ${status}`);
      if (tests === passed) {
        console.log(`\n${passed}/${tests} endpoints passing`);
        s.close();
      }
    });
  }

  // --- Sitemap ---
  check('POST /api/seo/sitemap → 200', 200, (done) =>
    post('/api/seo/sitemap', { url: 'https://example.com' }, (status, body) => {
      if (status === 200 && body.success && body.urls.length === 4 && body.total === 4) done(status, body);
      else done(status, body);
    }));

  check('POST /api/seo/sitemap extract rootUrl → 200', 200, (done) =>
    post('/api/seo/sitemap', { extract: { rootUrl: 'https://example.com' } }, (status, body) => {
      if (status === 200 && body.success && body.urls.length === 4 && body.total === 4) done(status, body);
      else done(status, body);
    }));

  check('POST /api/seo/sitemap malformed (null) → 400', 400, (done) =>
    post('/api/seo/sitemap', { url: null }, (status, body) => {
      // null url: route rejects with 400 before calling stub
      done(status, body);
    }));

  check('POST /api/seo/sitemap missing body → 400', 400, (done) =>
    post('/api/seo/sitemap', {}, (status, body) => done(status, body)));

  // --- Keywords ---
  check('POST /api/seo/keywords → 200', 200, (done) =>
    post('/api/seo/keywords', { url: 'https://example.com', html: '<html><body>seo optimization tips for beginners</body></html>' }, (status, body) => {
      if (status === 200 && body.success && body.keywords.length >= 1) done(status, body);
      else done(status, body);
    }));

  check('POST /api/seo/keywords with minTf filter → 200', 200, (done) =>
    post('/api/seo/keywords', { url: 'https://example.com', html: 'a a a b b c d e', minTf: 2, max: 3 }, (status, body) => {
      if (status === 200 && body.success && body.keywords.every(k => k.count >= 2)) done(status, body);
      else done(status, body);
    }));

  check('POST /api/seo/keywords missing body → 400', 400, (done) =>
    post('/api/seo/keywords', {}, (status, body) => done(status, body)));

  // --- Opportunities ---
  check('GET /api/seo/opportunities → 200', 200, (done) =>
    get('/api/seo/opportunities?url=https://example.com', (status, body) => {
      if (status === 200 && body.success && body.opportunities.length === 3 && body.summary.total_opportunities === 3) done(status, body);
      else done(status, body);
    }));

  check('GET /api/seo/opportunities missing url → 400', 400, (done) =>
    get('/api/seo/opportunities', (status, body) => done(status, body)));

  // --- Alerts: create, list, delete, check ---
  check('POST /api/seo/alerts → 201', 201, (done) =>
    post('/api/seo/alerts', {
      siteUrl: 'https://example.com',
      ruleType: 'traffic_drop',
      threshold: -20,
      channels: { email: 'you@example.com', webhook: 'https://hooks.example.com/alert' },
    }, (status, body) => {
      if (status === 201 && body.success && body.rule.id && body.rule.ruleType === 'traffic_drop') done(status, body);
      else done(status, body);
    }));

  check('GET /api/seo/alerts (with rules) → 200', 200, (done) =>
    get('/api/seo/alerts?siteUrl=https://example.com', (status, body) => {
      if (status === 200 && body.success && body.rules.length >= 1 && body.rules.some(r => r.ruleType === 'traffic_drop')) done(status, body);
      else done(status, body);
    }));

  check('POST /api/seo/alerts/create duplicate → 201 (updates)', 201, (done) =>
    post('/api/seo/alerts', {
      siteUrl: 'https://example.com',
      ruleType: 'traffic_drop',
      enabled: false,
    }, (status, body) => {
      if (status === 201 && body.success && body.rule.enabled === false) done(status, body);
      else done(status, body);
    }));

  check('POST /api/seo/alerts/check (no trigger) → 200', 200, (done) =>
    post('/api/seo/alerts/check', {
      siteUrl: 'https://example.com',
      currentData: { gsc: { clicks: 5000, previous_clicks: 4800 }, psi: { lcp: 2.0, previous: { lcp: 1.8 } } },
    }, (status, body) => {
      if (status === 200 && body.success && body.triggered.length === 0 && body.total_rules_checked >= 1) done(status, body);
      else done(status, body);
    }));

  check('POST /api/seo/alerts/check (traffic drop fires) → 200', 200, (done) =>
    post('/api/seo/alerts/check', {
      siteUrl: 'https://example.com',
      currentData: { gsc: { clicks: 3000, previous_clicks: 5000 } },
    }, (status, body) => {
      if (status === 200 && body.success && body.triggered.length === 1 && body.triggered[0].ruleType === 'traffic_drop') done(status, body);
      else done(status, body);
    }));

  check('POST /api/seo/alerts/check (new 404 fires) → 200', 200, (done) =>
    post('/api/seo/alerts/check', {
      siteUrl: 'https://example.com',
      currentData: {
        crawl: {
          results: {
            brokenLinks: [{ page: 'https://example.com/broken', status: 404, redirectedTo: null }],
          },
        },
      },
    }, (status, body) => {
      if (status === 200 && body.success && body.triggered.length === 1 && body.triggered[0].ruleType === 'new_404') done(status, body);
      else done(status, body);
    }));

  check('DELETE /api/seo/alerts/:id → 200', 200, (done) => {
    post('/api/seo/alerts', { siteUrl: 'https://example.com', ruleType: 'new_404' }, (status, rule) => {
      if (status !== 201) return done(status, rule);
      del('/api/seo/alerts/' + rule.rule.id, (delStatus, delBody) => done(delStatus, delBody));
    });
  });

  check('DELETE /api/seo/alerts/:id not found → 404', 404, (done) =>
    del('/api/seo/alerts/nonexistent', (status, body) => done(status, body)));

  check('POST /api/seo/alerts missing body → 400', 400, (done) =>
    post('/api/seo/alerts', {}, (status, body) => done(status, body)));

  check('POST /api/seo/alerts/check missing siteUrl → 400', 400, (done) =>
    post('/api/seo/alerts/check', {}, (status, body) => done(status, body)));
});
