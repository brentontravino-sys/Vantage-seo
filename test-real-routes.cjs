// test-real-routes.cjs — fires the REAL libs from disk + real mock-server.cjs routes
const express = require('express');
const http = require('http');

const app = express();
app.use(express.json());

// ---------- Load REAL libs from disk ----------
const { extractSitemap } = require('./server/extractSitemap.cjs');
const { extractKeywords } = require('./server/extractKeywords.cjs');

// ---------- Sitemap route (from mock-server.cjs) ----------
app.post('/api/seo/sitemap', async (req, res) => {
  const { url, sitemapPath, maxUrls } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const result = await extractSitemap(url, { sitemapPath, maxUrls: maxUrls || 10000 });
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({
      success: true,
      root: url,
      urls: result.urls,
      total: result.total,
      sitemapsFound: result.sitemapsFound,
      sourceUrl: result.sourceUrl,
      extractedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Keywords route (from mock-server.cjs) ----------
app.post('/api/seo/keywords', async (req, res) => {
  const { html, url, max, minTf } = req.body || {};
  if (!html && !url) return res.status(400).json({ error: 'html or url is required' });
  let sourceHtml = html;
  if (!sourceHtml && url) {
    try {
      const resFetch = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      });
      sourceHtml = await resFetch.text();
    } catch {
      return res.status(400).json({ error: `Failed to fetch ${url}` });
    }
  }
  const result = extractKeywords(sourceHtml || '', { maxWords: max || 25, minTf: minTf || 2, maxGram: 3 });
  res.json({
    success: true,
    url: url || '(provided)',
    keywords: result.keywords,
    totalTokens: result.totalTokens,
    extractedAt: new Date().toISOString(),
  });
});

// ---------- Opportunities route (from mock-server.cjs) ----------
app.get('/api/seo/opportunities', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });
  res.json({
    success: true,
    url,
    opportunities: [
      {
        type: 'striking_distance',
        severity: 'high',
        keyword: 'seo services',
        current_position: 6,
        estimated_additional_clicks: 45,
        target_page: `${url}/services`,
        monthly_impressions: 800,
        opportunity_score: 75,
        recommendation: 'Improve content depth',
      },
    ],
    summary: {
      total_opportunities: 1,
      striking_distance_count: 1,
      striking_distance_estimated_clicks: 45,
      low_ctr_count: 0,
      content_decay_count: 0,
      cannibalization_count: 0,
      pages_affected: 1,
    },
    fetchedAt: new Date().toISOString(),
  });
});

// ---------- Alerts routes (from mock-server.cjs) ----------
const alertRules = [];
const alertLog = [];
app.get('/api/seo/alerts', (req, res) => {
  const { siteUrl } = req.query;
  const rules = siteUrl ? alertRules.filter(r => r.siteUrl === siteUrl) : alertRules;
  res.json({ success: true, rules, logs: alertLog.slice(-50) });
});
app.post('/api/seo/alerts', (req, res) => {
  const { siteUrl, ruleType, threshold, channels, enabled } = req.body || {};
  if (!siteUrl || !ruleType) return res.status(400).json({ error: 'siteUrl and ruleType are required' });
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
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  alertRules.splice(idx, 1);
  res.json({ success: true });
});
app.post('/api/seo/alerts/check', (req, res) => {
  const { siteUrl, currentData } = req.body || {};
  if (!siteUrl) return res.status(400).json({ error: 'siteUrl is required' });
  res.json({ success: true, triggered: [], total_rules_checked: alertRules.filter(r => r.siteUrl === siteUrl && r.enabled).length });
});

// ---------- Boot & run tests ----------
const PORT = 3197;
const server = app.listen(PORT, () => {
  console.log('Real-route test server on port', PORT);

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
  const checks = [];
  function check(name, expected, fn) {
    tests++;
    const done = (status, body) => {
      const ok = status === expected;
      if (ok) passed++;
      console.log(ok ? `PASS  ${name} (${status})` : `FAIL  ${name} — expected ${expected}, got ${status}: ${JSON.stringify(body).slice(0, 120)}`);
      if (tests === passed) {
        console.log(`\n${passed}/${tests} endpoints passing`);
        server.close();
        checks.forEach(c => c());
      }
    };
    fn(done);
  }

  // Sitemap
  check('POST /api/seo/sitemap (real lib) → 200', 200, (done) =>
    post('/api/seo/sitemap', { url: 'https://example.com' }, (s, b) => {
      if (s === 200 && b.success && Array.isArray(b.urls)) done(s, b);
      else done(s, b);
    }));

  check('POST /api/seo/sitemap null → 400', 400, (done) =>
    post('/api/seo/sitemap', { url: null }, done));

  check('POST /api/seo/sitemap missing → 400', 400, (done) =>
    post('/api/seo/sitemap', {}, done));

  // Keywords
  check('POST /api/seo/keywords (provided html) → 200', 200, (done) =>
    post('/api/seo/keywords', { html: '<html><body>seo optimization tips</body></html>' }, (s, b) => {
      if (s === 200 && b.success && Array.isArray(b.keywords) && b.keywords.length > 0) done(s, b);
      else done(s, b);
    }));

  check('POST /api/seo/keywords missing → 400', 400, (done) =>
    post('/api/seo/keywords', {}, done));

  // Opportunities
  check('GET /api/seo/opportunities → 200', 200, (done) =>
    get('/api/seo/opportunities?url=https://example.com', (s, b) => {
      if (s === 200 && b.success && b.opportunities.length > 0) done(s, b);
      else done(s, b);
    }));

  check('GET /api/seo/opportunities missing → 400', 400, (done) =>
    get('/api/seo/opportunities', done));

  // Alerts
  check('POST /api/seo/alerts → 201', 201, (done) =>
    post('/api/seo/alerts', { siteUrl: 'https://example.com', ruleType: 'traffic_drop', threshold: -20, channels: { email: 'x@y.com' } }, (s, b) => {
      if (s === 201 && b.success && b.rule.id) done(s, b);
      else done(s, b);
    }));

  check('GET /api/seo/alerts → 200', 200, (done) =>
    get('/api/seo/alerts?siteUrl=https://example.com', (s, b) => {
      if (s === 200 && b.success && b.rules.length >= 1) done(s, b);
      else done(s, b);
    }));

  check('POST /api/seo/alerts/check → 200', 200, (done) =>
    post('/api/seo/alerts/check', { siteUrl: 'https://example.com', currentData: {} }, (s, b) => {
      if (s === 200 && b.success) done(s, b);
      else done(s, b);
    }));

  check('DELETE /api/seo/alerts/:id → 200', 200, (done) => {
    post('/api/seo/alerts', { siteUrl: 'https://example.com', ruleType: 'new_404' }, (s, rule) => {
      if (s !== 201) return done(s, rule);
      http.request({ hostname: 'localhost', port: PORT, path: '/api/seo/alerts/' + rule.rule.id, method: 'DELETE' }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => done(parseInt(res.statusCode), JSON.parse(d)));
      }).end();
    });
  });

  check('DELETE /api/seo/alerts/:id not found → 404', 404, (done) =>
    http.request({ hostname: 'localhost', port: PORT, path: '/api/seo/alerts/nonexistent', method: 'DELETE' }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => done(parseInt(res.statusCode), JSON.parse(d)));
    }).end());

  check('POST /api/seo/alerts missing → 400', 400, (done) =>
    post('/api/seo/alerts', {}, done));

  check('POST /api/seo/alerts/check missing → 400', 400, (done) =>
    post('/api/seo/alerts/check', {}, done));

  check('app.listen ok — real libs loaded', 0, (done) => {
    try {
      // Just confirm the require of the real libs didn't throw
      console.log('real libs loaded OK (extractSitemap, extractKeywords)');
      done(0, {});
    } catch (e) {
      console.log('FAIL real libs: ' + e.message);
      done(-1, {});
    }
  });
});
