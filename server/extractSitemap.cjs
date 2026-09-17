/**
 * Sitemap extractor — fetches sitemap.xml (or sitemap index) and returns all URLs.
 * Ported from seo-audits-toolkit / crawlseo pattern.
 *
 * Usage:
 *   const { urls, total, SitemapParseError } = require('./extractSitemap');
 *   const result = await extractSitemap('https://example.com/sitemap.xml');
 */

const DEFAULT_SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap index.xml',
  '/sitemap.php',
  '/sitemaps.xml',
  '/sitemapindex.xml',
];

const SITEMAP_TIMEOUT_MS = 15000;

/** Try common sitemap paths, return the first that returns XML */
async function discoverSitemapUrl(rootUrl, customPath) {
  const candidates = customPath
    ? [customPath, ...DEFAULT_SITEMAP_PATHS]
    : DEFAULT_SITEMAP_PATHS;

  for (const path of candidates) {
    let url;
    try {
      url = new URL(path, rootUrl);
    } catch {
      continue;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SITEMAP_TIMEOUT_MS);
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'VizionSEO/1.0 (+https://vizion.ai)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('xml') && !ct.includes('application/xml') && !ct.includes('text/xml') && !ct.includes('application/sitemap+xml')) {
        // Some servers don't set content-type correctly; try parsing anyway
      }
      const text = await res.text();
      if (!text.trim()) continue;
      // Basic XML detection
      if (/<\?xml/i.test(text) || /<sitemap/i.test(text) || /<urlset/i.test(text)) {
        return { url: url.toString(), xml: text };
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

/** Parse a single <url> entry from a sitemap */
function parseUrlEntry($) {
  const loc = $('loc').text().trim();
  if (!loc) return null;
  return {
    url: loc,
    lastmod: $('lastmod').text().trim() || null,
    changefreq: $('changefreq').text().trim() || null,
    priority: $('priority').text().trim() || null,
  };
}

/** Parse a sitemap index (<sitemap> entries pointing to sub-sitemaps) */
function parseSitemapIndex($) {
  const sitemaps = [];
  $('sitemap').each((_, el) => {
    const $s = $(el);
    const loc = $s.find('loc').text().trim();
    const lastmod = $s.find('lastmod').text().trim() || null;
    if (loc) sitemaps.push({ url: loc, lastmod });
  });
  return sitemaps;
}

/** Parse a URL set (<url> entries with loc/lastmod/changefreq/priority) */
function parseUrlSet($) {
  const urls = [];
  $('url').each((_, el) => {
    const entry = parseUrlEntry($(el));
    if (entry) urls.push(entry);
  });
  return urls;
}

/**
 * Main export — extract all URLs from a site's sitemap(s).
 *
 * @param {string} rootUrl  — the site's base URL (e.g. https://example.com)
 * @param {object} opts
 * @param {string} opts.sitemapPath  — optional explicit sitemap URL
 * @param {number} opts.maxUrls      — cap total URLs returned (default 10000)
 * @returns {Promise<object>}
 *   { ok: true, urls: [...], total: N, sitemapsFound: [...], sourceUrl: '...' }
 *   or { ok: false, error: '...' }
 */
async function extractSitemap(rootUrl, opts = {}) {
  const maxUrls = opts.maxUrls ? Math.min(opts.maxUrls, 50000) : 10000;

  // Normalise root
  let base;
  try {
    base = new URL(rootUrl);
    if (!/^https?:$/.test(base.protocol)) throw new Error('http only');
  } catch {
    return { ok: false, error: `Invalid root URL: ${rootUrl}` };
  }

  const sitemapPath = opts.sitemapPath || null;
  const found = await discoverSitemapUrl(base.toString(), sitemapPath);
  if (!found) {
    return { ok: false, error: 'No sitemap found at common paths. Try passing opts.sitemapPath.' };
  }

  const { url: sitemapUrl, xml } = found;
  const $= require('cheerio').load(xml, { decodeEntities: true });

  // Detect sitemap index vs urlset
  const hasSitemapIndex = $('sitemap').length > 0;
  const hasUrlset = $('urlset').length > 0 || $('url').length > 0;

  if (hasSitemapIndex && !hasUrlset) {
    // Sitemap index — recurse into sub-sitemaps
    const indexEntries = parseSitemapIndex($);
    const allUrls = [];
    const sitemapsFound = [{ url: sitemapUrl, entries: indexEntries.length }];

    for (const sub of indexEntries) {
      if (allUrls.length >= maxUrls) break;
      try {
        const subFound = await discoverSitemapUrl(sub.url, null);
        if (!subFound) {
          sitemapsFound.push({ url: sub.url, entries: 0, error: 'not reachable' });
          continue;
        }
        const subXml = subFound.xml;
        const sub$ = require('cheerio').load(subXml, { decodeEntities: true });
        const subUrls = parseUrlSet(sub$);
        allUrls.push(...subUrls);
        sitemapsFound.push({ url: sub.url, entries: subUrls.length });
      } catch (e) {
        sitemapsFound.push({ url: sub.url, entries: 0, error: e.message });
      }
    }

    return {
      ok: true,
      urls: allUrls.slice(0, maxUrls),
      total: allUrls.length,
      sitemapsFound,
      sourceUrl: sitemapUrl,
    };
  }

  // Single urlset
  const urls = parseUrlSet($);
  return {
    ok: true,
    urls: urls.slice(0, maxUrls),
    total: urls.length,
    sitemapsFound: [{ url: sitemapUrl, entries: urls.length }],
    sourceUrl: sitemapUrl,
  };
}

module.exports = { extractSitemap, discoverSitemapUrl, DEFAULT_SITEMAP_PATHS };
