const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { crawlSite, discoverBacklinks } = require('./server/seo-crawler.cjs');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());

app.get('/api/seo/health', (req, res) => {
  res.json({ status: 'ok', crawler: 'googlebot-style', delay_ms_default: 500 });
});

app.post('/api/seo/crawl', async (req, res) => {
  const { url, maxPages = 25, delayMs = 500 } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const result = await crawlSite(url, { maxPages, delayMs });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/seo/backlinks', async (req, res) => {
  const { url, maxPages = 25, delayMs = 500 } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    const result = await discoverBacklinks(url, { maxPages, delayMs });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('Mock backend listening on http://localhost:3001');
  console.log('SEO endpoints: /api/seo/health, /api/seo/crawl, /api/seo/backlinks');
});
