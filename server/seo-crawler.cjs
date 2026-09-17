/**
 * SEO Crawler — Googlebot-style HTTP crawler
 *
 * - Uses Googlebot/2.1 User-Agent (so servers respond with what Google sees)
 * - Respects robots.txt (Disallow rules)
 * - Polite rate limiting (configurable, default 500ms between requests)
 * - Captures: status, title, meta description, h1, canonical, OG tags,
 *   response time, word count, internal links, external links, images
 *   without alt, structured-data presence, mobile viewport, lang attr
 * - Derives an "issue list" with severity (critical/warning/notice)
 *   and category (crawlability, performance, on-page, indexability, links,
 *   structured-data, mobile)
 *
 * Uses raw fetch + cheerio instead of Playwright — 10-50× faster and
 * works reliably inside Express handlers. We trade JS-rendering for
 * raw-HTML fidelity, which is what every real SEO audit actually needs.
 *
 * Public API:
 *   crawlSite(rootUrl, { maxPages = 25, delayMs = 500 })
 *     → { root, pages: [PageResult], issues: [Issue], stats: {...} }
 *
 *   discoverBacklinks(rootUrl, { maxPages = 25, delayMs = 500 })
 *     → { root, total, by_source_domain: [...], external_links: [...] }
 */

const cheerio = require('cheerio');

const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const DEFAULT_MAX_PAGES = 25;
const DEFAULT_DELAY_MS = 500;
const PAGE_TIMEOUT_MS = 15000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeUrl(input) {
  // Auto-prepend https:// if no protocol is present
  // (e.g. "btvizion.co.za" → "https://btvizion.co.za")
  if (!/^https?:\/\//i.test(input)) {
    input = 'https://' + input;
  }
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error(`URL must be http(s): ${input}`);
  }
  return url;
}

function normalizePath(href) {
  try {
    return new URL(href, 'http://x').toString().replace(/\/+$/, '') || '/';
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- robots.txt
async function fetchRobots(origin) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': GOOGLEBOT_UA, Accept: '*/*' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { disallowed: new Set() };
    const text = await res.text();
    const disallowed = new Set();
    let active = false;
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.replace(/#.*$/, '').trim();
      if (!line) continue;
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const key = line.slice(0, colon).trim().toLowerCase();
      const value = line.slice(colon + 1).trim();
      if (key === 'user-agent') {
        active = value === '*' || value.toLowerCase().includes('googlebot');
      } else if (key === 'disallow' && active && value) {
        disallowed.add(value);
      }
    }
    return { disallowed };
  } catch {
    return { disallowed: new Set() };
  }
}

function isAllowedByRobots(urlStr, disallowedPrefixes) {
  const path = new URL(urlStr).pathname;
  for (const p of disallowedPrefixes) {
    if (p === '/') return false;
    if (path === p || path.startsWith(p + '/') || path.startsWith(p)) {
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------- per-page
async function fetchOne(rootUrl, url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
  const start = Date.now();

  const result = {
    url,
    fetched_at: new Date().toISOString(),
    status: null,
    response_time_ms: null,
    redirect_url: null,
    content_type: null,
    title: null,
    title_length: 0,
    meta_description: null,
    meta_description_length: 0,
    canonical: null,
    h1: [],
    images_total: 0,
    images_missing_alt: 0,
    internal_links: [],
    external_links: [],
    has_og_tags: false,
    has_structured_data: false,
    has_viewport: false,
    lang: null,
    word_count: 0,
  };

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': GOOGLEBOT_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    // Headers (for security audit)
    result.headers = {};
    res.headers.forEach((value, key) => {
      result.headers[key.toLowerCase()] = value;
    });

    result.response_time_ms = Date.now() - start;
    result.status = res.status;
    result.content_type = res.headers.get('content-type') || '';
    const finalUrl = res.url;
    if (finalUrl && finalUrl !== url) result.redirect_url = finalUrl;

    if (!res.ok) return result;
    if (!result.content_type.includes('text/html')) return result;

    const html = await res.text();
    result._html = html; // kept for mixed-content detection (not serialised to output)
    const $ = cheerio.load(html, { decodeEntities: true });

    // Title
    result.title = ($('title').first().text() || '').trim() || null;
    if (result.title) result.title_length = result.title.length;

    // Meta description
    const meta = $('meta[name="description"]').attr('content');
    result.meta_description = meta ? meta.trim() : null;
    if (meta) result.meta_description_length = meta.trim().length;

    // Canonical
    const canonical = $('link[rel="canonical"]').first().attr('href');
    result.canonical = canonical || null;

    // H1s
    result.h1 = $('h1')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    // Lang attribute
    result.lang = $('html').attr('lang') || null;

    // Viewport
    result.has_viewport = $('meta[name="viewport"]').length > 0;

    // Open Graph
    result.has_og_tags = $('meta[property^="og:"]').length > 0;

    // Structured data
    result.has_structured_data = $('script[type="application/ld+json"]').length > 0;

    // Images
    const imgs = $('img')
      .map((_, el) => ({
        alt: $(el).attr('alt'),
      }))
      .get();
    result.images_total = imgs.length;
    result.images_missing_alt = imgs.filter(
      (i) => i.alt == null || String(i.alt).trim() === ''
    ).length;

    // Word count (strip tags, count whitespace-delimited tokens)
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    result.word_count = text ? text.split(' ').length : 0;

    // Links
    const origin = new URL(rootUrl).origin;
    const internalSet = new Set();
    const externalList = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      let abs;
      try {
        abs = new URL(href, url).toString();
      } catch {
        return;
      }
      if (!/^https?:$/.test(new URL(abs).protocol)) return;
      const rel = ($(el).attr('rel') || '').toLowerCase();
      const anchor = ($(el).text() || '').trim().slice(0, 80);
      let linkType = 'dofollow';
      if (rel.includes('nofollow')) linkType = 'nofollow';
      else if (rel.includes('sponsored')) linkType = 'sponsored';
      else if (rel.includes('ugc')) linkType = 'ugc';

      if (abs.startsWith(origin)) {
        if (!internalSet.has(abs)) internalSet.add(abs);
      } else {
        externalList.push({
          source_url: url,
          source_domain: new URL(abs).hostname,
          target_url: abs,
          anchor_text: anchor,
          link_type: linkType,
        });
      }
    });
    result.internal_links = Array.from(internalSet);
    result.external_links = externalList;
  } catch (err) {
    if (err.name === 'AbortError') {
      result.status = 0;
      result.error = 'timeout';
    } else {
      result.error = err.message;
    }
  } finally {
    clearTimeout(timeout);
  }
  return result;
}

// ---------------------------------------------------------------- issues
function deriveIssues(pages) {
  const issues = [];
  const add = (page, severity, category, title, how_to_fix) => {
    issues.push({
      title,
      severity,
      category,
      pages_affected: 1,
      description: title,
      how_to_fix,
      page_url: page.url,
      // Attach response headers so the UI can show HSTS / CSP / XFO details
      ...(page.headers ? { headers: page.headers } : {}),
    });
  };

  for (const p of pages) {
    if (p.status === 0 || p.status >= 500) {
      add(p, 'critical', 'crawlability',
        `Page returned HTTP ${p.status || 'no-response'}`,
        'Check server logs and uptime; fix or remove the broken page.');
    } else if (p.status >= 400) {
      add(p, 'critical', 'crawlability',
        `Page returned HTTP ${p.status}`,
        'Fix or remove the broken page; update internal links that point to it.');
    } else if (p.status >= 300 && p.status < 400 && !p.redirect_url) {
      add(p, 'warning', 'crawlability',
        `Page is a ${p.status} redirect without a final URL`,
        'Ensure the redirect chain has a final destination.');
    }

    if (p.blocked_by_robots) continue;
    if (!p.content_type || !p.content_type.includes('text/html')) continue;

    if (!p.title) {
      add(p, 'critical', 'on-page', 'Missing <title> tag',
        'Add a unique, descriptive <title> tag (50–60 chars).');
    } else if (p.title_length < 30) {
      add(p, 'warning', 'on-page', `Title is too short (${p.title_length} chars)`,
        'Write a longer, keyword-rich title (50–60 chars).');
    } else if (p.title_length > 65) {
      add(p, 'warning', 'on-page', `Title is too long (${p.title_length} chars)`,
        'Shorten the title to under 60 chars to avoid truncation in SERPs.');
    }

    if (!p.meta_description) {
      add(p, 'warning', 'on-page', 'Missing meta description',
        'Add a 120–155 char meta description that summarises the page.');
    } else if (p.meta_description_length < 70) {
      add(p, 'notice', 'on-page',
        `Meta description is short (${p.meta_description_length} chars)`,
        'Expand the meta description to 120–155 chars.');
    } else if (p.meta_description_length > 160) {
      add(p, 'warning', 'on-page',
        `Meta description is too long (${p.meta_description_length} chars)`,
        'Trim to under 155 chars.');
    }

    if (p.h1.length === 0) {
      add(p, 'critical', 'on-page', 'Missing <h1> tag',
        'Add exactly one <h1> describing the page topic.');
    } else if (p.h1.length > 1) {
      add(p, 'warning', 'on-page', `Multiple <h1> tags (${p.h1.length})`,
        'Use a single <h1>; demote extras to <h2>/<h3>.');
    }

    if (!p.canonical) {
      add(p, 'warning', 'indexability', 'Missing canonical link',
        'Add <link rel="canonical" href="..."> to disambiguate duplicate-content URLs.');
    }

    if (p.images_missing_alt > 0) {
      add(p, 'warning', 'accessibility',
        `${p.images_missing_alt} of ${p.images_total} images missing alt text`,
        'Add descriptive alt text to every <img> for SEO and accessibility.');
    }

    if (!p.has_viewport) {
      add(p, 'critical', 'mobile', 'Missing mobile viewport meta tag',
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">.');
    }

    if (!p.lang) {
      add(p, 'warning', 'indexability', 'Missing <html lang="..."> attribute',
        'Set the lang attribute on <html> for accessibility and SEO.');
    }

    if (p.word_count < 300) {
      add(p, 'notice', 'on-page', `Thin content (${p.word_count} words)`,
        'Expand the page to 300+ words of unique, helpful content.');
    }

    if (p.response_time_ms && p.response_time_ms > 3000) {
      add(p, 'warning', 'performance', `Slow page (${(p.response_time_ms / 1000).toFixed(1)}s)`,
        'Optimise images, defer scripts, and enable caching to load under 3s.');
    }

    // ---- Security header audit (from seo-audits-toolkit) ----
    if (p.headers) {
      const h = p.headers;

      // HSTS
      if (p.status === 200 && !h['strict-transport-security']) {
        add(p, 'warning', 'security',
          'Missing Strict-Transport-Security (HSTS) header',
          'Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to enforce HTTPS.');
      } else if (h['strict-transport-security']) {
        const hsts = h['strict-transport-security'];
        if (!hsts.includes('max-age') || !hsts.match(/max-age=\d+/)) {
          add(p, 'warning', 'security',
            'HSTS header missing max-age directive',
            'Set `max-age=31536000` (1 year) minimum in the HSTS header.');
        } else if (!hsts.includes('includeSubDomains') && p.url === p.url) {
          // Only flag on root / critical pages; avoid over-flagging subdomains
        }
      }

      // X-Content-Type-Options
      if (!h['x-content-type-options'] || h['x-content-type-options'] !== 'nosniff') {
        add(p, 'warning', 'security',
          h['x-content-type-options'] ? `Weak X-Content-Type-Options: ${h['x-content-type-options']}` : 'Missing X-Content-Type-Options header',
          'Add `X-Content-Type-Options: nosniff` to prevent MIME-type sniffing.');
      }

      // X-Frame-Options
      if (!h['x-frame-options'] && !h['content-security-policy']?.includes('frame-ancestors')) {
        add(p, 'notice', 'security',
          'Missing X-Frame-Options / frame-ancestors (clickjacking risk)',
          'Add `X-Frame-Options: DENY` or `SAMEORIGIN`, or a CSP frame-ancestors directive.');
      }

      // Referrer-Policy
      if (!h['referrer-policy']) {
        add(p, 'notice', 'security',
          'Missing Referrer-Policy header',
          'Add `Referrer-Policy: strict-origin-when-cross-origin` to control referrer leakage.');
      }

      // Content-Security-Policy
      if (!h['content-security-policy']) {
        add(p, 'notice', 'security',
          'Missing Content-Security-Policy header',
          'Add a CSP to restrict script/style origins and mitigate XSS. Start with a report-only policy.');
      }

      // Mixed content (HTTPS page loading HTTP resources)
      if (p.url.startsWith('https://')) {
        const html = p._html || '';
        const httpResources = (html.match(/src=["']https?:\/\/[^"']*?http:\/\/[^"']*?["']/gi) || [])
          .concat((html.match(/href=["']https?:\/\/[^"']*?http:\/\/[^"']*?["']/gi) || []));
        if (httpResources.length > 0) {
          add(p, 'warning', 'security',
            `${httpResources.length} mixed-content resource(s) on HTTPS page`,
            'Update all resource URLs to HTTPS to avoid mixed-content warnings and ranking penalties.');
        }
      }
    }
  }
  return issues;
}

// ---------------------------------------------------------------- public API
async function crawlSite(rootInput, opts = {}) {
  const maxPages = Math.max(1, Math.min(opts.maxPages || DEFAULT_MAX_PAGES, 200));
  const delayMs = Math.max(0, opts.delayMs ?? DEFAULT_DELAY_MS);
  const root = normalizeUrl(rootInput);

  const { disallowed } = await fetchRobots(root.origin);

  const queue = [root.toString()];
  const visited = new Set();
  const pages = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    if (!isAllowedByRobots(url, disallowed)) {
      pages.push({
        url,
        fetched_at: new Date().toISOString(),
        status: 0,
        blocked_by_robots: true,
      });
      continue;
    }

    const result = await fetchOne(root.toString(), url);
    pages.push(result);

    if (delayMs > 0) await sleep(delayMs);

    // Enqueue internal links for BFS
    if (result.internal_links && result.status >= 200 && result.status < 400) {
      for (const link of result.internal_links) {
        const norm = normalizePath(link);
        if (!norm) continue;
        if (visited.has(norm)) continue;
        if (queue.length + pages.length >= maxPages * 3) break;
        queue.push(norm);
      }
    }
  }

  const issues = deriveIssues(pages);
  const okPages = pages.filter((p) => p.status >= 200 && p.status < 400);
  const blockedCount = pages.filter((p) => p.blocked_by_robots).length;
  const avgResponse = okPages.length
    ? Math.round(
        okPages.reduce((s, p) => s + (p.response_time_ms || 0), 0) / okPages.length
      )
    : null;

  return {
    root: root.toString(),
    pages_crawled: pages.length,
    pages_indexable: okPages.length,
    pages_blocked_by_robots: blockedCount,
    avg_response_time_ms: avgResponse,
    pages,
    issues,
    crawled_at: new Date().toISOString(),
  };
}

async function discoverBacklinks(rootInput, opts = {}) {
  const maxPages = Math.max(1, Math.min(opts.maxPages || DEFAULT_MAX_PAGES, 100));
  const delayMs = Math.max(0, opts.delayMs ?? DEFAULT_DELAY_MS);
  const root = normalizeUrl(rootInput);

  const crawl = await crawlSite(root, { maxPages, delayMs });
  const bySourceDomain = new Map();
  const all = [];

  for (const p of crawl.pages) {
    for (const link of p.external_links || []) {
      all.push(link);
      const d = link.source_domain;
      if (!bySourceDomain.has(d)) {
        bySourceDomain.set(d, {
          source_domain: d,
          backlinks_count: 0,
          dofollow_count: 0,
          nofollow_count: 0,
          first_seen: p.fetched_at,
          sample_anchor: link.anchor_text,
          sample_url: link.source_url,
        });
      }
      const e = bySourceDomain.get(d);
      e.backlinks_count += 1;
      if (link.link_type === 'dofollow') e.dofollow_count += 1;
      else e.nofollow_count += 1;
    }
  }

  return {
    root: crawl.root,
    pages_crawled: crawl.pages_crawled,
    total: all.length,
    referring_domains: bySourceDomain.size,
    by_source_domain: Array.from(bySourceDomain.values())
      .sort((a, b) => b.backlinks_count - a.backlinks_count),
    external_links: all.slice(0, 500),
    crawled_at: crawl.crawled_at,
  };
}

module.exports = {
  crawlSite,
  discoverBacklinks,
  GOOGLEBOT_UA,
};
