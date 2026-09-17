/**
 * Mock Backend Server for Vantage SEO
 * This server provides mock implementations of all API endpoints
 * required by the frontend application.
 * Uses CommonJS for better compatibility with Express
 */

// Load .env into process.env (Node 20.6+ built-in; no dotenv dependency needed)
try { require('node:process').loadEnvFile?.(); } catch { /* no .env or unsupported */ }

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost origins (including Vite dev server on any port)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());

// In-memory storage for testing
const users = [];
const projects = [];
const keywords = [];
const backlinks = [];
const auditIssues = [];
const reports = [];

// Helper to generate IDs
let idCounter = 1;
const generateId = () => `mock_${idCounter++}`;

// ============ AUTH ENDPOINTS ============

// Mock user database
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  
  // Check if user already exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const user = {
    id: generateId(),
    email,
    password: 'hashed_' + password, // In real app, hash this
    createdAt: new Date().toISOString(),
  };
  
  users.push(user);
  
  res.json({
    success: true,
    user: { id: user.id, email: user.email }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // In real app, verify hashed password
  if (user.password !== 'hashed_' + password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Generate mock token
  const token = `mock_token_${user.id}_${Date.now()}`;
  
  res.json({
    access_token: token,
    user: { id: user.id, email: user.email }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  // Extract token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Extract user ID from token (mock implementation)
  const userId = token.split('_')[2];
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  });
});

app.post('/api/auth/reset-password-request', (req, res) => {
  const { email } = req.body;
  console.log(`Password reset requested for: ${email}`);
  res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body;
  console.log(`Password reset with token: ${resetToken}`);
  res.json({ success: true });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otpCode } = req.body;
  console.log(`OTP verification for ${email}: ${otpCode}`);
  
  // Mock: accept any 6-digit code
  if (otpCode && otpCode.length === 6) {
    const user = users.find(u => u.email === email);
    if (user) {
      const token = `mock_token_${user.id}_${Date.now()}`;
      return res.json({
        access_token: token,
        user: { id: user.id, email: user.email }
      });
    }
  }
  
  res.status(400).json({ error: 'Invalid OTP code' });
});

app.post('/api/auth/resend-otp', (req, res) => {
  const { email } = req.body;
  console.log(`Resend OTP to: ${email}`);
  res.json({ success: true, message: 'New OTP code sent' });
});

// OAuth mock
app.get('/api/auth/google', (req, res) => {
  const returnTo = req.query.return_to || '/';
  // In a real app, this would redirect to Google OAuth
  // For mock, we'll just redirect back with a token
  const token = `mock_token_google_${Date.now()}`;
  res.redirect(`${returnTo}?access_token=${token}`);
});

// ============ ENTITIES ENDPOINTS ============

// Generic entity handler
const createEntityRouter = (entityName, storageArray) => {
  const router = express.Router();
  
  // List all
  router.get('/', (req, res) => {
    const sort = req.query.sort || '';
    let sorted = [...storageArray];
    
    if (sort) {
      const field = sort.replace('-', '');
      const dir = sort.startsWith('-') ? -1 : 1;
      sorted.sort((a, b) => {
        const av = a[field], bv = b[field];
        if (av == null && bv == null) return 0;
        if (av == null) return dir;
        if (bv == null) return -dir;
        if (typeof av === 'number' && typeof bv === 'number') return dir * (av - bv);
        return dir * String(av).localeCompare(String(bv));
      });
    }
    
    res.json(sorted);
  });
  
  // Create
  router.post('/', (req, res) => {
    const item = { id: generateId(), ...req.body, createdAt: new Date().toISOString() };
    storageArray.push(item);
    res.status(201).json(item);
  });
  
  // Filter (MUST come before /:id to avoid "filter" being treated as an ID)
  router.get('/filter', (req, res) => {
    const filters = req.query;
    const sort = req.query.sort || '';
    
    let filtered = storageArray.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'sort') return true;
        return String(item[key]).includes(String(value));
      });
    });
    
    // Apply sorting
    if (sort) {
      const field = sort.replace('-', '');
      const dir = sort.startsWith('-') ? -1 : 1;
      filtered.sort((a, b) => {
        const av = a[field], bv = b[field];
        if (av == null && bv == null) return 0;
        if (av == null) return dir;
        if (bv == null) return -dir;
        if (typeof av === 'number' && typeof bv === 'number') return dir * (av - bv);
        return dir * String(av).localeCompare(String(bv));
      });
    }
    
    res.json(filtered);
  });
  
  // Bulk create (MUST come before /:id)
  router.post('/bulk', (req, res) => {
    const items = Array.isArray(req.body) ? req.body : [];
    const created = items.map(item => ({
      id: generateId(),
      ...item,
      createdAt: new Date().toISOString()
    }));
    storageArray.push(...created);
    res.status(201).json(created);
  });
  
  // Bulk update (MUST come before /:id)
  router.put('/bulk', (req, res) => {
    const updates = Array.isArray(req.body) ? req.body : [];
    updates.forEach(update => {
      const index = storageArray.findIndex(i => i.id === update.id);
      if (index !== -1) {
        storageArray[index] = { ...storageArray[index], ...update, updatedAt: new Date().toISOString() };
      }
    });
    res.json({ success: true });
  });
  
  // Delete many
  router.delete('/', (req, res) => {
    const filters = req.query;
    const indices = storageArray.map((item, index) => {
      return Object.entries(filters).every(([key, value]) => {
        return String(item[key]).includes(String(value));
      }) ? index : -1;
    }).filter(i => i !== -1);
    
    indices.reverse().forEach(index => {
      storageArray.splice(index, 1);
    });
    
    res.json({ success: true, deleted: indices.length });
  });
  
  // Get by ID (MUST come after /filter and /bulk)
  router.get('/:id', (req, res) => {
    const item = storageArray.find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(item);
  });
  
  // Update
  router.put('/:id', (req, res) => {
    const index = storageArray.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Not found' });
    }
    storageArray[index] = { ...storageArray[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json(storageArray[index]);
  });
  
  // Delete
  router.delete('/:id', (req, res) => {
    const index = storageArray.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Not found' });
    }
    storageArray.splice(index, 1);
    res.json({ success: true });
  });
  
  return router;
};

// Register entity routes
app.use('/api/entities/Project', createEntityRouter('Project', projects));
app.use('/api/entities/Keyword', createEntityRouter('Keyword', keywords));
app.use('/api/entities/Backlink', createEntityRouter('Backlink', backlinks));
app.use('/api/entities/AuditIssue', createEntityRouter('AuditIssue', auditIssues));
app.use('/api/entities/Report', createEntityRouter('Report', reports));

// ============ INTEGRATIONS ENDPOINTS ============

// Mock LLM invocation - returns mock data based on prompt
function mockLlmResponse(req, res) {
  const { prompt = '', response_json_schema } = req.body || {};
  console.log('mockLlmResponse called with prompt:', String(prompt).substring(0, 80));

  // Generate mock response based on the prompt
  const mockResponses = {
    'estimate': {
      domain_rating: 72,
      organic_traffic: 148500,
      organic_keywords: 2340,
      backlinks: 4820,
      referring_domains: 1180,
      health_score: 78,
      traffic_trend: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short', year: 'numeric' }),
        traffic: 120000 + Math.floor(Math.random() * 30000)
      })),
    },
    'domain overview': {
      domain_rating: 85,
      organic_traffic: 150000,
      organic_keywords: 2500,
      paid_traffic: 10000,
      paid_keywords: 500,
      backlinks: 5000,
      referring_domains: 1200,
      traffic_value: 45000,
      ranking_distribution: {
        top3: 150,
        top10: 400,
        top50: 800,
        top100: 1200
      }
    },
    'organic search': {
      organic_traffic: 150000,
      organic_keywords: 2500,
      traffic_value: 45000,
      traffic_trend: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short', year: 'numeric' }),
        traffic: 150000 - i * 5000
      })),
      ranking_distribution: { top3: 150, top10: 400, top50: 800, top100: 1200 },
      top_keywords: Array.from({ length: 5 }, (_, i) => ({
        keyword: `keyword ${i + 1}`,
        position: Math.floor(Math.random() * 10) + 1,
        volume: 1000 + i * 1000,
        traffic: 500 + i * 500,
        url: `https://example.com/page${i + 1}`
      }))
    },
    'backlinks': {
      backlinks: Array.from({ length: 25 }, (_, i) => ({
        source_domain: `domain${i + 1}.com`,
        source_url: `https://domain${i + 1}.com/page`,
        target_url: 'https://example.com',
        anchor_text: `anchor text ${i + 1}`,
        domain_rating: Math.floor(Math.random() * 100),
        link_type: ['dofollow', 'nofollow', 'sponsored'][Math.floor(Math.random() * 3)],
        first_seen: '2024-01-01'
      }))
    },
    'keywords': {
      keywords: []
    },
    'site audit': {
      issues: Array.from({ length: 14 }, (_, i) => ({
        title: ['Low text to HTML ratio', 'Uncached JavaScript and CSS files', 'Low word count', 'No HSTS support', 'Links with non-descriptive anchor text', 'Missing meta description', 'Slow page speed', 'Non-descriptive title tag', 'Orphaned pages', 'Redirect chains', 'Missing alt text', 'Mobile usability issue', 'Broken internal links', 'Duplicate content'][i],
        severity: ['critical', 'warning', 'notice'][Math.floor(Math.random() * 3)],
        pages_affected: Math.floor(Math.random() * 15) + 1,
        category: ['crawlability', 'performance', 'on-page', 'indexability', 'links', 'structured-data', 'mobile'][Math.floor(Math.random() * 7)],
        description: 'Detailed description of the technical issue and its impact on SEO.',
        how_to_fix: 'Step-by-step guidance on how to resolve this issue.'
      }))
    }
  };

  // Check dashboard/comprehensive overview FIRST (before keyword loop)
  // because dashboard prompts may mention "backlinks" as a field name
  if (String(prompt).toLowerCase().includes('dashboard') || String(prompt).toLowerCase().includes('comprehensive overview')) {
    return res.json({
      domain_rating: 72,
      organic_traffic: 148500,
      organic_keywords: 2340,
      paid_traffic: 12400,
      paid_keywords: 380,
      backlinks: 4820,
      referring_domains: 1180,
      traffic_value: 41000,
      ranking_distribution: { top3: 142, top10: 387, top50: 762, top100: 1049 },
      traffic_trend: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short', year: 'numeric' }),
        organic: 148500 - i * 4200 + Math.floor(Math.random() * 8000),
        paid: 12400 - i * 300 + Math.floor(Math.random() * 2000)
      })).reverse(),
      top_keywords: Array.from({ length: 8 }, (_, i) => ({
        keyword: `keyword ${i + 1}`,
        position: Math.floor(Math.random() * 15) + 1,
        volume: 1200 + i * 1400,
        traffic: 800 + i * 600,
        url: `https://example.com/page${i + 1}`
      })),
      top_pages: Array.from({ length: 6 }, (_, i) => ({
        url: `https://example.com/page${i + 1}`,
        traffic: 2500 - i * 300,
        keywords: 45 - i * 5,
        traffic_value: 1200 - i * 100,
        top_keyword: `keyword ${i + 1}`
      })),
      backlink_summary: {
        total: 4820,
        new_last_30d: 124,
        lost_last_30d: 18,
        referring_domains: 1180,
        top_anchors: ['keyword 1', 'click here', 'read more', 'example', 'learn more']
      },
      audit_summary: {
        health_score: 78,
        issues: Array.from({ length: 18 }, (_, i) => ({
          title: `Issue ${i + 1}`,
          severity: ['critical', 'warning', 'notice'][Math.floor(Math.random() * 3)],
          pages_affected: Math.floor(Math.random() * 12) + 1,
          category: ['crawlability', 'performance', 'on-page', 'indexability', 'mobile'][Math.floor(Math.random() * 5)]
        }))
      }
    });
  }

  // Try to match mock response
  for (const [key, response] of Object.entries(mockResponses)) {
    if (String(prompt).toLowerCase().includes(key)) {
      return res.json(response);
    }
  }

  // Default response
  return res.json({
    result: 'Mock response for: ' + String(prompt).substring(0, 100),
    timestamp: new Date().toISOString()
  });
}

// ============ START SERVER ============

// LLM backend: Google Gemini free tier (OpenAI-compatible endpoint).
const OMNIROUTE_BASE_URL =
  process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const OMNIROUTE_API_KEY = process.env.GEMINI_API_KEY || '';
const OMNIROUTE_MODEL = process.env.LLM_MODEL || 'gemini-3.6-flash';

// When GEMINI_API_KEY is set, proxy LLM calls to Gemini and return structured
// JSON. Otherwise the canned mock responses are returned (offline mode).
app.post('/api/integrations/core/invoke-llm', async (req, res) => {
  const { prompt, model = OMNIROUTE_MODEL, response_json_schema, messages } = req.body || {};

  if (!OMNIROUTE_API_KEY) {
    return mockLlmResponse(req, res);
  }

  try {
    const sys = response_json_schema
      ? 'You are an SEO analyst. Always respond with strict JSON that matches the provided schema. Do not include any prose.'
      : 'You are a helpful SEO analyst.';

    const chatMessages = Array.isArray(messages) && messages.length
      ? messages
      : [
          { role: 'system', content: sys },
          { role: 'user', content: prompt || '' },
        ];

    const upstream = await fetch(`${OMNIROUTE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OMNIROUTE_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        temperature: 0.2,
        ...(response_json_schema ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error('Gemini proxy error:', upstream.status, text);
      return mockLlmResponse(req, res);
    }

    const data = await upstream.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return mockLlmResponse(req, res);

    try {
      return res.json(JSON.parse(content));
    } catch {
      return res.json({ result: content });
    }
  } catch (err) {
    console.error('OmniRoute proxy exception:', err.message);
    return mockLlmResponse(req, res);
  }
});

// ============ SEO TOOLS ENDPOINTS (Schema + Quality) ============

// Schema generation helpers (ported from src/lib/schema-generator.js)
function generateFAQSchema(faqs) {
  const mainEntity = [];
  for (const faq of faqs) {
    if (faq.question && faq.answer) {
      mainEntity.push({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      });
    }
  }
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity };
}

function generateHowToSchema(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.name,
    description: data.description,
    step: [],
  };
  if (data.totalTime) schema.totalTime = data.totalTime;
  if (data.estimatedCost != null) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: data.currency || 'USD',
      value: data.estimatedCost,
    };
  }
  if (data.image) schema.image = data.image;
  for (let i = 0; i < (data.steps || []).length; i++) {
    const step = data.steps[i];
    if (!step.text) continue;
    const stepData = {
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name || `Step ${i + 1}`,
      text: step.text,
    };
    if (step.image) stepData.image = step.image;
    schema.step.push(stepData);
  }
  return schema;
}

function generateArticleSchema(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': data.articleType || 'Article',
    headline: data.headline,
    description: data.description,
    author: { '@type': data.authorType || 'Person', name: data.authorName },
    datePublished: data.datePublished,
    publisher: { '@type': 'Organization', name: data.publisherName },
  };
  if (data.dateModified) schema.dateModified = data.dateModified;
  if (data.image) schema.image = data.image;
  if (data.authorUrl) schema.author.url = data.authorUrl;
  if (data.publisherLogo) schema.publisher.logo = { '@type': 'ImageObject', url: data.publisherLogo };
  return schema;
}

function generateProductSchema(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
  };
  if (data.image) schema.image = data.image;
  if (data.brand) schema.brand = { '@type': 'Brand', name: data.brand };
  if (data.sku != null) schema.sku = data.sku;
  if (data.mpn) schema.mpn = data.mpn;
  if (data.gtin) schema.gtin = data.gtin;
  if (data.price != null) {
    schema.offers = {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.currency || 'USD',
      availability: `https://schema.org/${data.availability || 'InStock'}`,
      url: data.url || '',
    };
    if (data.priceValidUntil) schema.offers.priceValidUntil = data.priceValidUntil;
  }
  if (data.ratingValue != null && data.reviewCount != null) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.ratingValue,
      reviewCount: data.reviewCount,
      bestRating: data.bestRating || 5,
      worstRating: data.worstRating || 1,
    };
  }
  return schema;
}

function generateLocalBusinessSchema(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': data.businessType || 'LocalBusiness',
    name: data.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.streetAddress,
      addressLocality: data.addressLocality,
      addressRegion: data.addressRegion,
      postalCode: data.postalCode,
      addressCountry: data.addressCountry || 'US',
    },
  };
  if (data.description) schema.description = data.description;
  if (data.telephone) schema.telephone = data.telephone;
  if (data.url) schema.url = data.url;
  if (data.image) schema.image = data.image;
  if (data.priceRange) schema.priceRange = data.priceRange;
  if (data.latitude != null && data.longitude != null) {
    schema.geo = { '@type': 'GeoCoordinates', latitude: data.latitude, longitude: data.longitude };
  }
  return schema;
}

function generateBreadcrumbSchema(breadcrumbs) {
  const itemListElement = (breadcrumbs || []).map((crumb, i) => {
    if (!crumb.name) return null;
    const item = { '@type': 'ListItem', position: i + 1, name: crumb.name };
    if (crumb.url) item.item = crumb.url;
    return item;
  }).filter(Boolean);
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement };
}

function generateVideoSchema(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: data.name,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    uploadDate: data.uploadDate,
  };
  if (data.duration) schema.duration = data.duration;
  if (data.contentUrl) schema.contentUrl = data.contentUrl;
  if (data.embedUrl) schema.embedUrl = data.embedUrl;
  return schema;
}

function formatJsonLD(schema) {
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

function validateSchema(schema) {
  if (!schema || typeof schema !== 'object') return { valid: false, error: 'Schema must be an object' };
  if (!schema['@context']) return { valid: false, error: 'Missing @context' };
  if (!schema['@type']) return { valid: false, error: 'Missing @type' };
  return { valid: true };
}

function generateSchema(type, data) {
  switch (type) {
    case 'FAQPage': return generateFAQSchema(data.faqs);
    case 'HowTo': return generateHowToSchema({
      name: data.name || '', description: data.description || '', totalTime: data.totalTime || '',
      currency: data.currency || 'USD', estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
      steps: data.steps || [], image: data.image || '',
    });
    case 'Article': case 'NewsArticle': case 'BlogPosting':
      return generateArticleSchema({
        articleType: type, headline: data.headline || '', description: data.description || '',
        authorName: data.authorName || '', authorType: data.authorType || 'Person',
        authorUrl: data.authorUrl || '', publisherName: data.publisherName || '',
        publisherLogo: data.publisherLogo || '', datePublished: data.datePublished || '',
        dateModified: data.dateModified || undefined, image: data.image || undefined,
      });
    case 'Product': return generateProductSchema({
        name: data.name || '', description: data.description || '', brand: data.brand || undefined,
        sku: data.sku || undefined, mpn: data.mpn || undefined, gtin: data.gtin || undefined,
        image: data.image || undefined, price: data.price != null ? parseFloat(data.price) : null,
        currency: data.currency || 'USD', availability: data.availability || 'InStock',
        url: data.url || undefined, priceValidUntil: data.priceValidUntil || undefined,
        ratingValue: data.ratingValue != null ? parseFloat(data.ratingValue) : null,
        reviewCount: data.reviewCount != null ? parseInt(data.reviewCount, 10) : null,
    });
    case 'LocalBusiness': return generateLocalBusinessSchema({
        businessType: data.businessType || 'LocalBusiness', name: data.name || '',
        description: data.description || undefined, telephone: data.telephone || undefined,
        url: data.url || undefined, image: data.image || undefined, priceRange: data.priceRange || undefined,
        streetAddress: data.streetAddress || '', addressLocality: data.addressLocality || '',
        addressRegion: data.addressRegion || '', postalCode: data.postalCode || '', addressCountry: data.addressCountry || 'US',
        latitude: data.latitude != null ? parseFloat(data.latitude) : null,
        longitude: data.longitude != null ? parseFloat(data.longitude) : null,
    });
    case 'BreadcrumbList': return generateBreadcrumbSchema(data.breadcrumbs || []);
    case 'VideoObject': return generateVideoSchema({
        name: data.name || '', description: data.description || '', thumbnailUrl: data.thumbnailUrl || '',
        uploadDate: data.uploadDate || '', duration: data.duration || undefined,
        contentUrl: data.contentUrl || undefined, embedUrl: data.embedUrl || undefined,
    });
    default: return null;
  }
}

app.post('/api/seo/schema', (req, res) => {
  const { type, data } = req.body || {};
  if (!type || !data) return res.status(400).json({ error: 'type and data are required' });
  const schema = generateSchema(type, data);
  if (!schema) return res.status(400).json({ error: 'Unsupported schema type: ' + type });
  const validation = validateSchema(schema);
  if (!validation.valid) return res.status(400).json({ error: validation.error });
  res.json({ success: true, type, schema, jsonLD: formatJsonLD(schema) });
});

// ============ SEO TOOLS ENDPOINTS (Schema + Sitemap + Keywords + Opportunities + Alerts) ============

// ---- Sitemap extractor ----
const { extractSitemap } = require('./server/extractSitemap.cjs');

app.post('/api/seo/sitemap', async (req, res) => {
  const { url, sitemapPath, maxUrls } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    console.log(`🗺️  sitemap request: ${url}`);
    const result = await extractSitemap(url, { sitemapPath, maxUrls: maxUrls || 10000 });
    if (!result.ok) return res.status(400).json({ error: result.error });
    console.log(`✅ sitemap done: ${result.total} URLs from ${result.sitemapsFound.length} sitemap(s)`);
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
    console.error('sitemap error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ---- Page keyword extractor ----
const { extractKeywords } = require('./server/extractKeywords.cjs');

app.post('/api/seo/keywords', async (req, res) => {
  const { html, url, max, minTf, maxGram } = req.body || {};
  if (!html && !url) return res.status(400).json({ error: 'html or url is required' });

  // If url given, fetch the page first (lightweight, Googlebot UA)
  let sourceHtml = html;
  if (!sourceHtml && url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const resFetch = await fetch(url, {
        headers: {
          'User-Agent': 'VizionSEO/1.0 (+https://vizion.ai)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);
      if (!resFetch.ok) return res.status(400).json({ error: `Failed to fetch page: HTTP ${resFetch.status}` });
      const ct = (resFetch.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('text/html')) return res.status(400).json({ error: 'URL does not return HTML' });
      sourceHtml = await resFetch.text();
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  try {
    const result = extractKeywords(sourceHtml, {
      max: max || 20,
      minTf: minTf || 2,
      maxGram: maxGram || 3,
    });
    res.json({
      success: true,
      url: url || '(provided)',
      keywords: result.keywords,
      totalTokens: result.totalTokens,
      extractedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- SEO Opportunities (striking distance + low CTR + content decay + cannibalization) ----
// In-memory store for historical snapshots (demo only — swap to DB/Redis in production)
const opportunitySnapshots = new Map(); // siteUrl -> [{ date, data }]

// Helper: GSC-style mock query (returns rows with clicks/impressions/position)
// Mirrors what /api/live/gsc/query would return when GSC is wired.
async function mockGscQuery(siteUrl, daysBack = 28, lowThreshold = 0.02) {
  // Generate realistic-looking GSC rows
  const rows = [];
  const keywords = [
    'seo services', 'organic search traffic', 'site audit', 'keyword research',
    'backlink analysis', 'content optimization', 'local seo', 'technical seo',
    'rank tracking', 'meta tags', 'sitemap generator', 'xml sitemap',
    'google search console', 'hreflang tag', 'canonical tag', 'robots.txt',
  ];
  const now = new Date();
  for (let i = 0; i < keywords.length; i++) {
    const baseClicks = Math.floor(Math.random() * 80) + 5;
    const baseImpressions = Math.floor(Math.random() * 2000) + 500;
    const basePosition = Math.random() * 15 + 1;
    // Vary slightly over days
    for (let d = daysBack; d >= 0; d -= 7) {
      const date = new Date(now.getTime() - d * 86400000);
      const clicks = Math.max(0, Math.round(baseClicks + (Math.random() - 0.5) * baseClicks * 0.3));
      const impressions = Math.max(0, Math.round(baseImpressions + (Math.random() - 0.5) * baseImpressions * 0.2));
      const position = Math.max(0.5, basePosition + (Math.random() - 0.5) * 2);
      rows.push({
        keyword: keywords[i],
        page: `https://${new URL(siteUrl).hostname}/page/${i + 1}`,
        clicks,
        impressions,
        ctr: impressions > 0 ? clicks / impressions : 0,
        position: Math.round(position * 10) / 10,
        date: date.toISOString().slice(0, 10),
      });
    }
  }
  return rows;
}

app.get('/api/seo/opportunities', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });

  // 1) Run a fresh crawl to get page list + issues
  const crawl = await crawlSite(url, { maxPages: 20, delayMs: 300 }).catch(() => null);
  const pages = crawl ? crawl.pages.filter(p => p.status >= 200 && p.status < 400) : [];

  // 2) Mock GSC data (real when GSC is wired)
  const gscRows = await mockGscQuery(url, 28);

  // 3) Aggregate per-page GSC metrics
  const pageMetrics = new Map();
  for (const row of gscRows) {
    if (!pageMetrics.has(row.page)) {
      pageMetrics.set(row.page, { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 });
    }
    const m = pageMetrics.get(row.page);
    m.clicks += row.clicks;
    m.impressions += row.impressions;
    m.position += row.position;
    m.count += 1;
  }
  for (const [page, m] of pageMetrics) {
    m.ctr = m.impressions > 0 ? m.clicks / m.impressions : 0;
    m.position = m.count > 0 ? m.position / m.count : 0;
  }

  // 4) Build opportunity items
  const opportunities = [];

  // 4a) Striking distance: keywords ranking positions 4-20 with improvement potential
  const striking = gscRows
    .filter(row => row.position >= 4 && row.position <= 20 && row.impressions >= 100)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
    .slice(0, 15)
    .map(row => ({
      type: 'striking_distance',
      severity: row.position <= 7 ? 'high' : 'medium',
      keyword: row.keyword,
      current_position: row.position,
      estimated_additional_clicks: Math.round(row.impressions * (row.position <= 7 ? 0.12 : 0.05)),
      target_page: row.page,
      monthly_impressions: row.impressions,
      opportunity_score: Math.round((1 / row.position) * 100 * (row.impressions / 1000)),
    }));
  opportunities.push(...striking);

  // 4b) Low CTR pages: pages with impressions but low click-through
  const lowCtr = [];
  for (const [page, m] of pageMetrics) {
    if (m.impressions >= 200 && m.ctr < 0.02) {
      // Compare to last period if snapshot exists
      const prev = getSnapshot(url, 'gsc');
      const prevCtr = prev ? (prev.clicks / prev.impressions) : null;
      lowCtr.push({
        type: 'low_ctr',
        severity: m.ctr < 0.01 ? 'high' : 'medium',
        page,
        current_ctr: Math.round(m.ctr * 10000) / 100,
        current_clicks: m.clicks,
        current_impressions: m.impressions,
        previous_ctr: prevCtr ? Math.round(prevCtr * 10000) / 100 : null,
        ctr_change_pct: prevCtr ? Math.round(((m.ctr - prevCtr) / prevCtr) * 1000) / 10 : null,
        recommendation: m.ctr < 0.01 ? 'Rewrite meta title and description — CTR is critically low.' : 'Improve title/description relevance and add schema to boost CTR.',
      });
    }
  }
  lowCtr.sort((a, b) => b.current_impressions - a.current_impressions);
  opportunities.push(...lowCtr.slice(0, 10));

  // 4c) Content decay: pages with declining traffic trend
  const decay = [];
  for (const [page, m] of pageMetrics) {
    if (m.impressions >= 300) {
      // Simulate: check if impressions dropped vs "last month"
      const prev = getSnapshot(url, 'decay')?.pages?.find(p => p.page === page);
      const prevImp = prev ? prev.impressions : m.impressions * (1 + Math.random() * 0.3);
      const pctChange = prevImp > 0 ? ((m.impressions - prevImp) / prevImp) * 100 : 0;
      if (pctChange < -15) {
        decay.push({
          type: 'content_decay',
          severity: pctChange < -30 ? 'high' : 'medium',
          page,
          current_impressions: m.impressions,
          previous_impressions: Math.round(prevImp),
          change_pct: Math.round(pctChange),
          recommendation: pctChange < -40 ? 'Consider consolidating or refreshing this page — significant traffic loss detected.' : 'Review and refresh content — traffic is declining.',
        });
      }
    }
  }
  decay.sort((a, b) => Math.abs(a.change_pct) - Math.abs(b.change_pct));
  opportunities.push(...decay.slice(0, 8));

  // 4d) Keyword cannibalization: multiple pages competing for same query
  const cannibal = [];
  const queryPages = new Map();
  for (const row of gscRows) {
    if (!queryPages.has(row.keyword)) queryPages.set(row.keyword, []);
    queryPages.get(row.keyword).push(row);
  }
  for (const [keyword, rows] of queryPages) {
    if (rows.length >= 2 && rows.some(r => r.position <= 10)) {
      const positions = rows.map(r => r.position).sort((a, b) => a - b);
      const avgPos = positions.reduce((s, p) => s + p, 0) / positions.length;
      cannibal.push({
        type: 'cannibalization',
        severity: avgPos <= 7 ? 'high' : 'medium',
        keyword,
        competing_pages: rows.map(r => ({ page: r.page, position: r.position, clicks: r.clicks })),
        average_position: Math.round(avgPos * 10) / 10,
        total_clicks: rows.reduce((s, r) => s + r.clicks, 0),
        total_impressions: rows.reduce((s, r) => s + r.impressions, 0),
        recommendation: `Multiple pages (${rows.length}) compete for "${keyword}". Consolidate into one canonical page or differentiate intent.`,
      });
    }
  }
  cannibal.sort((a, b) => b.total_impressions - a.total_impressions);
  opportunities.push(...cannibal.slice(0, 8));

  // Store snapshot for comparison next time
  storeSnapshot(url, {
    date: new Date().toISOString(),
    gsc: { clicks: gscRows.reduce((s, r) => s + r.clicks, 0), impressions: gscRows.reduce((s, r) => s + r.impressions, 0) },
    pages: gscRows.map(r => ({ page: r.page, impressions: r.impressions })),
  });

  // 5) Summary metrics
  const summary = {
    total_opportunities: opportunities.length,
    striking_distance_count: striking.length,
    striking_distance_estimated_clicks: striking.reduce((s, o) => s + (o.estimated_additional_clicks || 0), 0),
    low_ctr_count: lowCtr.length,
    content_decay_count: decay.length,
    cannibalization_count: cannibal.length,
    pages_affected: new Set(opportunities.map(o => o.page || o.target_page || '')).size,
  };

  res.json({ success: true, url, opportunities, summary, fetchedAt: new Date().toISOString() });
});

// ---- Alerts infrastructure ----
const alertRules = []; // { id, siteUrl, ruleType, threshold, channels: { email?, webhook?, slack?, telegram? }, enabled }
const alertLog = []; // { id, siteUrl, ruleType, triggeredAt, message, delivered: bool }

function genId() { return 'alt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }

// Get all alert rules for a site
app.get('/api/seo/alerts', (req, res) => {
  const { siteUrl } = req.query;
  const rules = siteUrl ? alertRules.filter(r => r.siteUrl === siteUrl) : alertRules;
  res.json({ success: true, rules, logs: alertLog.slice(-50) });
});

// Create/update alert rule
app.post('/api/seo/alerts', (req, res) => {
  const { siteUrl, ruleType, threshold, channels, enabled } = req.body || {};
  if (!siteUrl || !ruleType) return res.status(400).json({ error: 'siteUrl and ruleType are required' });
  const id = genId();
  const rule = { id, siteUrl, ruleType, threshold: threshold || null, channels: channels || {}, enabled: enabled != null ? enabled : true, createdAt: new Date().toISOString() };
  // Upsert: replace if same siteUrl+ruleType exists
  const idx = alertRules.findIndex(r => r.siteUrl === siteUrl && r.ruleType === ruleType);
  if (idx >= 0) alertRules[idx] = rule;
  else alertRules.push(rule);
  res.status(201).json({ success: true, rule });
});

// Delete alert rule
app.delete('/api/seo/alerts/:id', (req, res) => {
  const idx = alertRules.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  alertRules.splice(idx, 1);
  res.json({ success: true });
});

// Trigger a check — compares current state to thresholds, fires alerts
app.post('/api/seo/alerts/check', async (req, res) => {
  const { siteUrl, currentData } = req.body || {};
  if (!siteUrl) return res.status(400).json({ error: 'siteUrl is required' });
  const siteRules = alertRules.filter(r => r.siteUrl === siteUrl && r.enabled);

  if (siteRules.length === 0) {
    return res.json({ success: true, triggered: 0, message: 'No enabled rules for this site.' });
  }

  const triggered = [];
  for (const rule of siteRules) {
    let fired = false;
    let message = '';

    if (rule.ruleType === 'traffic_drop') {
      const prev = getSnapshot(siteUrl, 'gsc');
      const current = currentData?.gsc;
      if (prev && current) {
        const prevImp = prev.impressions;
        const currImp = current.impressions;
        const dropPct = prevImp > 0 ? ((currImp - prevImp) / prevImp) * 100 : 0;
        const threshold = rule.threshold || -20;
        if (dropPct < threshold) {
          fired = true;
          message = `Traffic dropped ${Math.round(dropPct)}% (from ${prevImp} to ${currImp} impressions) vs last period.`;
        }
      }
    } else if (rule.ruleType === 'new_404') {
      const crawl = currentData?.crawl;
      if (crawl) {
        const new404s = crawl.pages?.filter(p => p.status >= 400 && p.status < 500);
        if (new404s && new404s.length > 0) {
          fired = true;
          message = `${new404s.length} new broken page(s) found: ${new404s.slice(0, 5).map(p => p.url).join(', ')}${new404s.length > 5 ? '...' : ''}.`;
        }
      }
    } else if (rule.ruleType === 'vitals_degradation') {
      const psi = currentData?.psi;
      if (psi) {
        const prev = getSnapshot(siteUrl, 'psi');
        const currentLcp = psi.coreWebVitals?.LCP;
        const prevLcp = prev?.psi?.coreWebVitals?.LCP;
        if (currentLcp != null && prevLcp != null && currentLcp > prevLcp * 1.2) {
          fired = true;
          message = `Core Web Vital LCP degraded from ${prevLcp}ms to ${currentLcp}ms (> 20% worse).`;
        }
      }
    }

    if (fired) {
      const logEntry = { id: genId(), siteUrl, ruleType: rule.ruleType, triggeredAt: new Date().toISOString(), message, delivered: false };
      alertLog.unshift(logEntry);

      // Deliver to configured channels
      const delivery = deliverAlert(rule, logEntry);
      logEntry.delivered = delivery.delivered;
      logEntry.delivery = delivery;

      triggered.push({ rule: rule.ruleType, message, delivered: delivery.delivered });
    }
  }

  res.json({ success: true, triggered, total_rules_checked: siteRules.length });
});

function deliverAlert(rule, logEntry) {
  const { channels } = rule;
  const delivered = [];
  const results = [];

  // Webhook
  if (channels.webhook) {
    try {
      fetch(channels.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert: logEntry, site: rule.siteUrl }),
      }).then(r => { if (r.ok) delivered.push('webhook'); }).catch(() => {});
    } catch {}
  }

  // Email (mock — real impl would use sendmail / SES / SendGrid)
  if (channels.email) {
    console.log(`📧 ALERT EMAIL: to=${channels.email} subject="Vizion SEO Alert: ${logEntry.ruleType}" body=${logEntry.message.slice(0, 100)}`);
    delivered.push('email');
    results.push({ channel: 'email', to: channels.email, status: 'queued' });
  }

  // Slack (mock)
  if (channels.slack) {
    console.log(`🔔 ALERT SLACK: webhook=${channels.slack} message="${logEntry.message.slice(0, 80)}"`);
    delivered.push('slack');
    results.push({ channel: 'slack', webhook: channels.slack, status: 'queued' });
  }

  // Telegram (mock)
  if (channels.telegram) {
    console.log(`📲 ALERT TELEGRAM: token=${channels.telegram} chat_id=${channels.telegramChatId || 'unknown'} message="${logEntry.message.slice(0, 80)}"`);
    delivered.push('telegram');
    results.push({ channel: 'telegram', status: 'queued' });
  }

  return { delivered, results };
}

function getSnapshot(siteUrl, type) {
  const snapshots = opportunitySnapshots.get(siteUrl);
  if (!snapshots || snapshots.length < 2) return null;
  return snapshots[snapshots.length - 2]?.data;
}

function storeSnapshot(siteUrl, data) {
  if (!opportunitySnapshots.has(siteUrl)) opportunitySnapshots.set(siteUrl, []);
  const list = opportunitySnapshots.get(siteUrl);
  list.push(data);
  if (list.length > 10) list.shift();
}

// ---- Helper functions (same logic as src/lib/schema-generator.js) ----
const liveData = require('./server/live-data.cjs');

// ============ SEO CRAWLER (Googlebot-style) ============
const { crawlSite, discoverBacklinks } = require('./server/seo-crawler.cjs');

app.get('/api/seo/health', (req, res) => {
  res.json({ status: 'ok', crawler: 'googlebot-style', delay_ms_default: 500 });
});

app.post('/api/seo/crawl', async (req, res) => {
  const { url, maxPages = 25, delayMs = 500 } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    console.log(`🕷️  crawl request: ${url} (maxPages=${maxPages})`);
    const result = await crawlSite(url, { maxPages, delayMs });
    console.log(`✅ crawl done: ${result.pages_crawled} pages, ${result.issues.length} issues`);
    res.json(result);
  } catch (err) {
    console.error('crawl error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/seo/backlinks', async (req, res) => {
  const { url, maxPages = 25, delayMs = 500 } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    console.log(`🔗  backlinks request: ${url} (maxPages=${maxPages})`);
    const result = await discoverBacklinks(url, { maxPages, delayMs });
    console.log(`✅ backlinks done: ${result.total} external links across ${result.referring_domains} domains`);
    res.json(result);
  } catch (err) {
    console.error('backlinks error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ============ LIVE DATA ROUTES ============

// PageSpeed Insights — real Core Web Vitals + Lighthouse, no key required
app.get('/api/live/pagespeed', async (req, res) => {
  const { url, strategy } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });
  const data = await liveData.getPsi(url, strategy || 'mobile');
  res.json(data);
});

// Currency rates — Frankfurter (ECB), no key required
app.get('/api/live/currency', async (req, res) => {
  const base = req.query.base || 'USD';
  const data = await liveData.getCurrency(base);
  res.json(data);
});

// GSC status + OAuth start (gated on env creds)
app.get('/api/live/gsc/status', (req, res) => {
  res.json({ configured: liveData.isGscConfigured(), source: 'google-search-console' });
});

app.get('/api/live/gsc/auth-url', (req, res) => {
  if (!liveData.isGscConfigured()) {
    return res.status(503).json({ error: 'GSC_NOT_CONFIGURED' });
  }
  // Returns the Google consent URL the frontend should open.
  res.json({
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GSC_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.GSC_REDIRECT_URI || 'http://localhost:5173/gsc/callback')}` +
      `&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/webmasters.readonly')}` +
      `&access_type=offline&prompt=consent`,
  });
});

// GSC OAuth callback (exchanges code → tokens; demo: stores in memory)
app.get('/api/live/gsc/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code');
  try {
    const { google } = require('googleapis');
    const oauth2 = new google.auth.OAuth2(
      process.env.GSC_CLIENT_ID,
      process.env.GSC_CLIENT_SECRET,
      process.env.GSC_REDIRECT_URI || 'http://localhost:5173/gsc/callback'
    );
    const { tokens } = await oauth2.getToken(code);
    liveData.storeGscToken(state || 'demo-user', tokens);
    res.send('GSC connected. You can close this window and refresh Vizion SEO.');
  } catch (e) {
    res.status(500).send('GSC callback failed: ' + e.message);
  }
});

// GSC search-analytics query (real clicks/impressions/country splits)
app.post('/api/live/gsc/query', async (req, res) => {
  const { userId, siteUrl, startDate, endDate, country, device, dimensions } = req.body || {};
  if (!siteUrl) return res.status(400).json({ error: 'siteUrl is required' });
  const data = await liveData.getGsc({
    userId: userId || 'demo-user',
    siteUrl,
    startDate: startDate || '2024-01-01',
    endDate: endDate || new Date().toISOString().slice(0, 10),
    country,
    device,
    dimensions,
  });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Mock Backend Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`\n✅ API Endpoints Available:`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - GET  /api/entities/Project`);
  console.log(`   - POST /api/entities/Project`);
  console.log(`   - GET  /api/entities/Keyword`);
  console.log(`   - POST /api/integrations/core/invoke-llm`);
  console.log(`\n🕷️  SEO Crawler Endpoints (Googlebot UA):`);
  console.log(`   - POST /api/seo/crawl        { url, maxPages?, delayMs? }`);
  console.log(`   - POST /api/seo/backlinks    { url, maxPages?, delayMs? }`);
  console.log(`   - GET  /api/seo/health`);
  console.log(`\n💡 Frontend will be available at: http://localhost:5173`);
  console.log(`💡 API Base URL: http://localhost:${PORT}/api\n`);
});

module.exports = app;
