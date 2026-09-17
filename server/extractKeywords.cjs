/**
 * Page keyword extractor — extracts candidate keywords from crawled page content.
 * Ported from seo-audits-toolkit keyword-finder pattern.
 *
 * Heuristic: tokenise body text, filter stopwords, count frequency,
 * extract n-grams (1-3 words), rank by TF (term frequency).
 *
 * Usage:
 *   const { extractKeywords } = require('./extractKeywords');
 *   const kw = await extractKeywords(html, { max: 20 });
 */

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','up','about','into','over','after','is','it','its','be','are','was',
  'were','has','have','had','do','does','did','will','would','can','could',
  'shall','should','may','might','must','this','that','these','those','i','you',
  'he','she','we','they','what','which','who','whom','when','where','why','how',
  'all','each','every','both','few','more','most','other','some','such','no',
  'nor','not','only','own','same','so','than','too','very','just','as','if',
  'then','else','also','because','while','although','though','until','unless',
  'since','before','after','between','under','again','further','once','here',
  'there','when','where','why','how','all','any','both','each','few','more',
  'most','other','some','such','no','nor','not','only','own','same','so',
  'than','too','very','just','as','if','when','where','why','how',
  'html','http','www','com','php','page','site','web','click','here','read',
  'more','learn','about','contact','menu','blog','home','about','services',
  'service','products','product','shop','store','buy','order','cart','checkout',
  'search','login','sign','up','account','register','faq','terms','privacy',
  'cookie','policy','sitemap','rss','feed','atom','follow','share','twitter',
  'facebook','linkedin','instagram','youtube','pinterest','tiktok',
]);

/**
 * Extract candidate keywords from HTML body text.
 * @param {string} html  — page HTML
 * @param {object} opts
 * @param {number} opts.max      — max keywords to return (default 20)
 * @param {number} opts.minTf    — minimum term frequency to include (default 2)
 * @param {number} opts.maxGram  — max n-gram size (default 3)
 * @returns {{ keywords: [{ term, count, tf }], totalTokens: number }}
 */
function extractKeywords(html, opts = {}) {
  const max = opts.max || 20;
  const minTf = opts.minTf || 2;
  const maxGram = opts.maxGram || 3;

  // Strip tags, decode entities, normalize whitespace
  const text = (html || '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, ' ')
    .replace(/[^a-zA-Z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const tokens = text.split(/\s+/).filter(t => t.length >= 2 && t.length <= 30 && !STOPWORDS.has(t));
  const totalTokens = tokens.length;
  if (totalTokens === 0) return { keywords: [], totalTokens: 0 };

  // Count unigrams
  const unigramCounts = new Map();
  for (const t of tokens) {
    unigramCounts.set(t, (unigramCounts.get(t) || 0) + 1);
  }

  // Count n-grams up to maxGram
  const ngramCounts = new Map();
  for (let n = 1; n <= maxGram; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n).join(' ');
      if (n === 1) continue; // handled above
      const key = gram;
      ngramCounts.set(key, (ngramCounts.get(key) || 0) + 1);
    }
  }

  // Merge: unigrams + n-grams, compute TF
  const combined = new Map();
  for (const [term, count] of unigramCounts) {
    combined.set(term, { term, count, tf: count / totalTokens });
  }
  for (const [term, count] of ngramCounts) {
    // Only add n-gram if its unigram constituents are not stopwords
    const words = term.split(' ');
    const allMeaningful = words.every(w => !STOPWORDS.has(w) && w.length >= 2);
    if (!allMeaningful) continue;
    if (count < minTf) continue;
    combined.set(term, { term, count, tf: count / totalTokens });
  }

  // Rank: higher count first, then higher TF
  const ranked = Array.from(combined.values())
    .filter(item => item.count >= minTf)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.tf - a.tf;
    })
    .slice(0, max);

  return { keywords: ranked, totalTokens };
}

module.exports = { extractKeywords, STOPWORDS };
