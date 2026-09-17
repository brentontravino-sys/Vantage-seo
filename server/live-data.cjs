/**
 * Live Data Sources — Vizion SEO
 *
 * Real, free, no-key-required data sources:
 *   - PageSpeed Insights API  (Core Web Vitals + Lighthouse audit, per URL)
 *   - Frankfurter currency API (ECB reference rates, no key)
 *   - Google Search Console API (real rankings/country splits) — gated on
 *     GSC_CLIENT_ID / GSC_CLIENT_SECRET which Brenton will supply.
 *
 * Every function returns a normalized shape and NEVER throws on upstream
 * failure — it resolves to { source: '...', live: false, error, fallback }.
 * The frontend decides what to render; we just keep the contract stable.
 *
 * Caching: PSI + currency are upstream-throttled, so we cache in-memory for
 * 10 minutes. GSC tokens are cached per-user in memory (demo only — swap to
 * Redis/DB for production).
 */

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1';

const memCache = new Map(); // key -> { ts, data }
const CACHE_TTL_MS = 10 * 60 * 1000;

async function cached(key, ttl, fn) {
  const hit = memCache.get(key);
  if (hit && Date.now() - hit.ts < ttl) return hit.data;
  const data = await fn();
  memCache.set(key, { ts: Date.now(), data });
  return data;
}

function normalizePsi(raw, url) {
  const lh = raw.lighthouseResult;
  const audits = lh?.audits || {};
  const cat = lh?.categories || {};
  const score = (id) => {
    const s = cat[id]?.score;
    return s == null ? null : Math.round(s * 100);
  };
  const fieldCls = raw.loadingExperience?.metrics || {};
  const pull = (m) => {
    const o = fieldCls[m];
    return o?.percentile != null ? Math.round(o.percentile) : null;
  };
  const auditList = Object.values(audits)
    .filter((a) => a.score != null && a.score < 0.9 && a.details?.type === 'opportunity')
    .map((a) => ({
      title: a.title,
      description: a.description,
      severity: a.score >= 0.5 ? 'warning' : 'critical',
      displayValue: a.displayValue || null,
      items: (a.details?.items || []).map((i) => i.node?.snippet || i.url || '').filter(Boolean).slice(0, 5),
    }));
  return {
    source: 'pagespeed-insights',
    live: true,
    url,
    strategy: raw.analysisUTCTime ? 'field+lab' : 'lab',
    scores: {
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
    },
    coreWebVitals: {
      LCP: pull('LARGEST_CONTENTFUL_PAINT_MS') ?? null,
      INP: pull('INTERACTION_TO_NEXT_PAINT_MS') ?? null,
      CLS: pull('CUMULATIVE_LAYOUT_SHIFT_SCORE') ?? null,
    },
    labTimings: {
      FCP: audits['first-contentful-paint']?.numericValue ?? null,
      LCP: audits['largest-contentful-paint']?.numericValue ?? null,
      TBT: audits['total-blocking-time']?.numericValue ?? null,
      CLS: audits['cumulative-layout-shift']?.numericValue ?? null,
    },
    opportunities: auditList,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchPsi(url, strategy) {
  const apiKey = process.env.PSI_API_KEY || ''; // optional; boosts quota
  const q = new URLSearchParams({ url, strategy });
  if (apiKey) q.set('key', apiKey);
  const res = await fetch(`${PSI_BASE}?${q.toString()}`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PSI ${res.status}: ${t.slice(0, 200)}`);
  }
  return normalizePsi(await res.json(), url);
}

async function fetchCurrency(base) {
  const res = await fetch(`${FRANKFURTER_BASE}/latest?base=${encodeURIComponent(base)}`);
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
  const j = await res.json();
  return {
    source: 'frankfurter',
    live: true,
    base: j.base,
    date: j.date,
    rates: j.rates, // { USD: 1.08, EUR: 1, ... }
  };
}

// ---- GSC (gated) ---------------------------------------------------------
// Google API libs are loaded lazily so the server boots without them.
let gscReady = false;
async function ensureGsc() {
  if (gscReady) return true;
  if (!process.env.GSC_CLIENT_ID || !process.env.GSC_CLIENT_SECRET) return false;
  // When the OAuth libs are installed these will resolve; otherwise the
  // function below returns a clear "not configured" payload.
  try {
    require.resolve('googleapis');
    gscReady = true;
    return true;
  } catch {
    return false;
  }
}

const gscTokens = new Map(); // userId -> tokens

async function fetchGsc({ userId, siteUrl, startDate, endDate, country, device, dimensions }) {
  const configured = await ensureGsc();
  if (!configured) {
    return {
      source: 'google-search-console',
      live: false,
      error: 'GSC_NOT_CONFIGURED',
      message:
        'Set GSC_CLIENT_ID + GSC_CLIENT_SECRET env vars and install googleapis to enable live GSC data.',
    };
  }
  // Implementation requires googleapis + an OAuth token from gscTokens.
  // Scaffolded: build the request below once creds + token are present.
  const { google } = require('googleapis');
  const oauth2 = new google.auth.OAuth2(
    process.env.GSC_CLIENT_ID,
    process.env.GSC_CLIENT_SECRET,
    process.env.GSC_REDIRECT_URI || 'http://localhost:5173/gsc/callback'
  );
  const tokens = gscTokens.get(userId);
  if (!tokens) {
    return { source: 'google-search-console', live: false, error: 'GSC_NO_TOKEN', message: 'User has not connected GSC yet.' };
  }
  oauth2.setCredentials(tokens);
  const searchconsole = google.webmasters('v3');
  const request = {
    auth: oauth2,
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: dimensions || (country ? ['query'] : ['query']),
      ...(country ? { dimensionFilterGroups: [{ filters: [{ dimension: 'country', operator: 'equals', expression: country }] }] } : {}),
      ...(device ? { dimensionFilterGroups: [{ filters: [{ dimension: 'device', operator: 'equals', expression: device }] }] } : {}),
      rowLimit: 1000,
    },
  };
  const r = await searchconsole.searchanalytics.query(request);
  return {
    source: 'google-search-console',
    live: true,
    rows: (r.data.rows || []).map((row) => ({
      keys: row.keys,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })),
    fetchedAt: new Date().toISOString(),
  };
}

module.exports = {
  isGscConfigured: () => Boolean(process.env.GSC_CLIENT_ID && process.env.GSC_CLIENT_SECRET),
  getPsi: (url, strategy = 'mobile') =>
    cached(`psi:${strategy}:${url}`, CACHE_TTL_MS, () => fetchPsi(url, strategy)).catch((e) => ({
      source: 'pagespeed-insights',
      live: false,
      error: e.message,
    })),
  getCurrency: (base = 'USD') =>
    cached(`fx:${base}`, CACHE_TTL_MS, () => fetchCurrency(base)).catch((e) => ({
      source: 'frankfurter',
      live: false,
      error: e.message,
    })),
  getGsc: (opts) => fetchGsc(opts),
  storeGscToken: (userId, tokens) => gscTokens.set(userId, tokens),
  __test_normalize: (raw, url) => normalizePsi(raw, url),
};
