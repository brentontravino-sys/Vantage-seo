/**
 * Schema.org JSON-LD generator
 * Ported from search-solved-public-seo schema-markup-generator (Python/Streamlit)
 * Supports: FAQPage, HowTo, Article, Product, LocalBusiness, BreadcrumbList, VideoObject
 */

/**
 * @type {import('../lib/schema-generator').SchemaType}
 */
export const SCHEMA_TYPES = [
  'FAQPage',
  'HowTo',
  'Article',
  'NewsArticle',
  'BlogPosting',
  'Product',
  'LocalBusiness',
  'BreadcrumbList',
  'VideoObject',
];


/** Generate FAQPage schema */
export function generateFAQSchema(faqs) {
  const mainEntity = [];
  for (const faq of faqs) {
    if (faq.question && faq.answer) {
      mainEntity.push({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      });
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}

/** Generate HowTo schema */
export function generateHowToSchema(data) {
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

/** Generate Article / NewsArticle / BlogPosting schema */
export function generateArticleSchema(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': data.articleType || 'Article',
    headline: data.headline,
    description: data.description,
    author: {
      '@type': data.authorType || 'Person',
      name: data.authorName,
    },
    datePublished: data.datePublished,
    publisher: {
      '@type': 'Organization',
      name: data.publisherName,
    },
  };
  if (data.dateModified) schema.dateModified = data.dateModified;
  if (data.image) schema.image = data.image;
  if (data.authorUrl) schema.author.url = data.authorUrl;
  if (data.publisherLogo) {
    schema.publisher.logo = {
      '@type': 'ImageObject',
      url: data.publisherLogo,
    };
  }
  return schema;
}

/** Generate Product schema */
export function generateProductSchema(data) {
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

/** Generate LocalBusiness schema */
export function generateLocalBusinessSchema(data) {
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
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.latitude,
      longitude: data.longitude,
    };
  }
  if (data.openingHours && data.openingHours.length) {
    schema.openingHoursSpecification = data.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.open,
      closes: h.close,
    }));
  }
  return schema;
}

/** Generate BreadcrumbList schema */
export function generateBreadcrumbSchema(breadcrumbs) {
  const itemListElement = [];
  breadcrumbs.forEach((crumb, i) => {
    if (!crumb.name) return;
    const item = {
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
    };
    if (crumb.url) item.item = crumb.url;
    itemListElement.push(item);
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/** Generate VideoObject schema */
export function generateVideoSchema(data) {
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

/** Format a schema object as a JSON-LD <script> tag string */
export function formatJsonLD(schema) {
  const jsonStr = JSON.stringify(schema, null, 2);
  return `<script type="application/ld+json">\n${jsonStr}\n</script>`;
}

/** Validate a schema object has the minimum required fields */
export function validateSchema(schema) {
  if (!schema || typeof schema !== 'object') return { valid: false, error: 'Schema must be an object' };
  if (!schema['@context']) return { valid: false, error: 'Missing @context' };
  if (!schema['@type']) return { valid: false, error: 'Missing @type' };
  return { valid: true };
}
