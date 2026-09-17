import { vizion } from '@/api/vizionClient';

// Helper to call LLM with the new API structure
const invokeLLM = async (params) => {
  try {
    return await vizion.integrations.Core.InvokeLLM(params);
  } catch (error) {
    console.error('LLM invocation failed:', error);
    throw error;
  }
};

export const fmt = (n) => (n == null ? '—' : n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n));

export async function fetchOverview(domain) {
  return invokeLLM({
    prompt: `Provide a comprehensive SEO domain overview for "${domain}". Return: domain_rating (0-100), monthly organic_traffic, organic_keywords count, paid_traffic (monthly PPC visits), paid_keywords count, backlinks count, referring_domains count, traffic_value (estimated monthly value of organic traffic in USD), and ranking_distribution with keyword counts in positions 1-3 (top3), 4-10 (top10), 11-50 (top50), and 51-100 (top100). Base figures on what you can find about this site.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        domain_rating: { type: 'number' },
        organic_traffic: { type: 'number' },
        organic_keywords: { type: 'number' },
        paid_traffic: { type: 'number' },
        paid_keywords: { type: 'number' },
        backlinks: { type: 'number' },
        referring_domains: { type: 'number' },
        traffic_value: { type: 'number' },
        ranking_distribution: {
          type: 'object',
          properties: {
            top3: { type: 'number' },
            top10: { type: 'number' },
            top50: { type: 'number' },
            top100: { type: 'number' },
          },
        },
      },
    },
  });
}

export async function fetchOrganicSearch(domain) {
  return invokeLLM({
    prompt: `Analyze the organic search performance of "${domain}". Return: organic_traffic (monthly), organic_keywords count, traffic_value (USD/month), a 12-month traffic_trend array of {month, traffic}, ranking_distribution with counts for positions 1-3, 4-10, 11-50, 51-100, and top_keywords (5 entries) with {keyword, position, volume, traffic, url}. Base on what you can find about this site.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        organic_traffic: { type: 'number' },
        organic_keywords: { type: 'number' },
        traffic_value: { type: 'number' },
        traffic_trend: {
          type: 'array',
          items: { type: 'object', properties: { month: { type: 'string' }, traffic: { type: 'number' } } },
        },
        ranking_distribution: {
          type: 'object',
          properties: {
            top3: { type: 'number' },
            top10: { type: 'number' },
            top50: { type: 'number' },
            top100: { type: 'number' },
          },
        },
        top_keywords: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keyword: { type: 'string' }, position: { type: 'number' },
              volume: { type: 'number' }, traffic: { type: 'number' }, url: { type: 'string' },
            },
          },
        },
      },
    },
  });
}

export async function fetchOrganicRankings(domain) {
  return invokeLLM({
    prompt: `List the top organic keyword rankings for "${domain}". Return 30 keywords the site ranks for, each with: keyword, position (1-100), volume (monthly searches), traffic (estimated monthly visits from this keyword), and url (ranking page). Sort by traffic descending. Base on what you can find about this site.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keyword: { type: 'string' }, position: { type: 'number' },
              volume: { type: 'number' }, traffic: { type: 'number' }, url: { type: 'string' },
            },
          },
        },
      },
    },
  });
}

export async function fetchTopPages(domain) {
  return invokeLLM({
    prompt: `List the top pages of "${domain}" by organic search traffic. Return 25 pages each with: url, traffic (monthly organic visits), keywords (number of keywords this page ranks for), traffic_value (estimated USD/month), and top_keyword. Sort by traffic descending. Base on what you can find about this site.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' }, traffic: { type: 'number' },
              keywords: { type: 'number' }, traffic_value: { type: 'number' }, top_keyword: { type: 'string' },
            },
          },
        },
      },
    },
  });
}

export async function fetchPaidSearch(domain) {
  return invokeLLM({
    prompt: `Analyze the paid search (Google Ads) activity of "${domain}". Return: paid_traffic (monthly), paid_keywords_count, avg_cpc (USD), paid_keywords array (25 entries) with {keyword, position, volume, cpc, traffic, url}, and ads array (5 sample ad copies) with {title, description, url}. Base on what you can find about this site's advertising.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        paid_traffic: { type: 'number' },
        paid_keywords_count: { type: 'number' },
        avg_cpc: { type: 'number' },
        paid_keywords: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keyword: { type: 'string' }, position: { type: 'number' },
              volume: { type: 'number' }, cpc: { type: 'number' }, traffic: { type: 'number' }, url: { type: 'string' },
            },
          },
        },
        ads: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' }, description: { type: 'string' }, url: { type: 'string' },
            },
          },
        },
      },
    },
  });
}

export async function fetchCompare(domains) {
  return invokeLLM({
    prompt: `Compare these domains side by side: ${domains.join(', ')}. For each, return: domain, domain_rating (0-100), organic_traffic (monthly), organic_keywords count, backlinks count, referring_domains count, paid_traffic (monthly), paid_keywords count. Also return common_keywords (keywords all domains rank for) and a unique_keywords array with {domain, count} for each domain's unique keywords. Base on what you can find about these sites.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        domains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              domain: { type: 'string' }, domain_rating: { type: 'number' },
              organic_traffic: { type: 'number' }, organic_keywords: { type: 'number' },
              backlinks: { type: 'number' }, referring_domains: { type: 'number' },
              paid_traffic: { type: 'number' }, paid_keywords: { type: 'number' },
            },
          },
        },
        common_keywords: { type: 'number' },
        unique_keywords: {
          type: 'array',
          items: { type: 'object', properties: { domain: { type: 'string' }, count: { type: 'number' } } },
        },
      },
    },
  });
}

export async function fetchTrafficAnalytics(domain) {
  return invokeLLM({
    prompt: `Analyze the traffic analytics for "${domain}". Return: total_visits (monthly), traffic_by_source with visits for organic, paid, referral, social, and direct channels, a 12-month visits_trend array of {month, visits}, top_countries (5) with {country, visits, share} (share as percentage 0-100), devices with {desktop, mobile, tablet} percentages, bounce_rate (percentage), pages_per_visit, avg_visit_duration (seconds), and top_referral_sites (10) with {domain, visits}. Base on what you can find about this site.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        total_visits: { type: 'number' },
        traffic_by_source: {
          type: 'object',
          properties: {
            organic: { type: 'number' }, paid: { type: 'number' },
            referral: { type: 'number' }, social: { type: 'number' }, direct: { type: 'number' },
          },
        },
        visits_trend: {
          type: 'array',
          items: { type: 'object', properties: { month: { type: 'string' }, visits: { type: 'number' } } },
        },
        top_countries: {
          type: 'array',
          items: { type: 'object', properties: { country: { type: 'string' }, visits: { type: 'number' }, share: { type: 'number' } } },
        },
        devices: {
          type: 'object',
          properties: { desktop: { type: 'number' }, mobile: { type: 'number' }, tablet: { type: 'number' } },
        },
        bounce_rate: { type: 'number' },
        pages_per_visit: { type: 'number' },
        avg_visit_duration: { type: 'number' },
        top_referral_sites: {
          type: 'array',
          items: { type: 'object', properties: { domain: { type: 'string' }, visits: { type: 'number' } } },
        },
      },
    },
  });
}

export async function fetchMarketOverview(domain) {
  return invokeLLM({
    prompt: `Provide a market overview for the industry of "${domain}". Return: industry name, market_size (estimated annual USD), growth_rate (percentage), total_industry_traffic (monthly), market_share array (top 8 players) with {domain, share} (share as percentage), top_competitors (8) with {domain, traffic, keywords}, and industry_trend (12 months) with {month, traffic}. Base on what you can find about this site and its industry.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        industry: { type: 'string' },
        market_size: { type: 'number' },
        growth_rate: { type: 'number' },
        total_industry_traffic: { type: 'number' },
        market_share: {
          type: 'array',
          items: { type: 'object', properties: { domain: { type: 'string' }, share: { type: 'number' } } },
        },
        top_competitors: {
          type: 'array',
          items: { type: 'object', properties: { domain: { type: 'string' }, traffic: { type: 'number' }, keywords: { type: 'number' } } },
        },
        industry_trend: {
          type: 'array',
          items: { type: 'object', properties: { month: { type: 'string' }, traffic: { type: 'number' } } },
        },
      },
    },
  });
}

export async function fetchSocial(domain) {
  return invokeLLM({
    prompt: `Analyze the social media presence of "${domain}". Return: social_traffic (monthly visits from social), social_sources array with {platform, visits, share} (share as percentage), social_ads array with {platform, ad_count, est_spend_usd}, and top_posts (5) with {platform, content, engagement}. Base on what you can find about this site's social media activity.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        social_traffic: { type: 'number' },
        social_sources: {
          type: 'array',
          items: { type: 'object', properties: { platform: { type: 'string' }, visits: { type: 'number' }, share: { type: 'number' } } },
        },
        social_ads: {
          type: 'array',
          items: { type: 'object', properties: { platform: { type: 'string' }, ad_count: { type: 'number' }, est_spend_usd: { type: 'number' } } },
        },
        top_posts: {
          type: 'array',
          items: { type: 'object', properties: { platform: { type: 'string' }, content: { type: 'string' }, engagement: { type: 'number' } } },
        },
      },
    },
  });
}