# Schema generation endpoint — accepts form data per schema type, returns JSON-LD
app.post('/api/seo/schema', (req, res) => {
  const { type, data } = req.body || {};
  if (!type || !data) {
    return res.status(400).json({ error: 'type and data are required' });
  }

  const generate = () => {
    switch (type) {
      case 'FAQPage':
        return generateFAQSchema(data.faqs);
      case 'HowTo':
        return generateHowToSchema({
          name: data.name || '',
          description: data.description || '',
          totalTime: data.totalTime || '',
          currency: data.currency || 'USD',
          estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
          steps: data.steps || [],
          image: data.image || '',
        });
      case 'Article':
      case 'NewsArticle':
      case 'BlogPosting':
        return generateArticleSchema({
          articleType: type,
          headline: data.headline || '',
          description: data.description || '',
          authorName: data.authorName || '',
          authorType: data.authorType || 'Person',
          authorUrl: data.authorUrl || '',
          publisherName: data.publisherName || '',
          publisherLogo: data.publisherLogo || '',
          datePublished: data.datePublished || '',
          dateModified: data.dateModified || undefined,
          image: data.image || undefined,
        });
      case 'Product':
        return generateProductSchema({
          name: data.name || '',
          description: data.description || '',
          brand: data.brand || undefined,
          sku: data.sku || undefined,
          mpn: data.mpn || undefined,
          gtin: data.gtin || undefined,
          image: data.image || undefined,
          price: data.price != null ? parseFloat(data.price) : null,
          currency: data.currency || 'USD',
          availability: data.availability || 'InStock',
          url: data.url || undefined,
          priceValidUntil: data.priceValidUntil || undefined,
          ratingValue: data.ratingValue != null ? parseFloat(data.ratingValue) : null,
          reviewCount: data.reviewCount != null ? parseInt(data.reviewCount, 10) : null,
        });
      case 'LocalBusiness':
        return generateLocalBusinessSchema({
          businessType: data.businessType || 'LocalBusiness',
          name: data.name || '',
          description: data.description || undefined,
          telephone: data.telephone || undefined,
          url: data.url || undefined,
          image: data.image || undefined,
          priceRange: data.priceRange || undefined,
          streetAddress: data.streetAddress || '',
          addressLocality: data.addressLocality || '',
          addressRegion: data.addressRegion || '',
          postalCode: data.postalCode || '',
          addressCountry: data.addressCountry || 'US',
          latitude: data.latitude != null ? parseFloat(data.latitude) : null,
          longitude: data.longitude != null ? parseFloat(data.longitude) : null,
          openingHours: data.openingHours || [],
        });
      case 'BreadcrumbList':
        return generateBreadcrumbSchema(data.breadcrumbs || []);
      case 'VideoObject':
        return generateVideoSchema({
          name: data.name || '',
          description: data.description || '',
          thumbnailUrl: data.thumbnailUrl || '',
          uploadDate: data.uploadDate || '',
          duration: data.duration || undefined,
          contentUrl: data.contentUrl || undefined,
          embedUrl: data.embedUrl || undefined,
        });
      default:
        return null;
    }
  };

  const schema = generate();
  if (!schema) {
    return res.status(400).json({ error: 'Unsupported schema type: ' + type });
  }

  const validation = validateSchema(schema);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  res.json({
    success: true,
    type: type,
    schema: schema,
    jsonLD: formatJsonLD(schema),
  });
});

# ---- Helper functions (same logic as src/lib/schema-generator.js) ----
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
  for (let i = 0; i < data.steps.length; i++) {
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
  if (data.publisherLogo) {
    schema.publisher.logo = { '@type': 'ImageObject', url: data.publisherLogo };
  }
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
  const itemListElement = breadcrumbs.map((crumb, i) => {
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
