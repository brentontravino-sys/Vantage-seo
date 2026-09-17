import axios from 'axios';

/**
 * Vizion SEO API Client
 *
 * Replaces the old Base44 client. Talks directly to the local backend
 * (mock-server.cjs during dev, or the real backend in production) for
 * auth + entities, and proxies LLM calls to OmniRoute for AI features.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Google Gemini (free tier) — OpenAI-compatible endpoint. No local gateway needed.
const OMNIROUTE_BASE_URL =
  import.meta.env.VITE_LLM_BASE_URL ||
  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const OMNIROUTE_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || '';
// Free-tier Gemini model (OpenAI-compatible). Override via VITE_LLM_MODEL if needed.
const OMNIROUTE_MODEL = import.meta.env.VITE_LLM_MODEL || 'gemini-3.6-flash';

// ---- Core axios instance (auth + entities) --------------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token on every request when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → clear token and force login redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Avoid infinite loops on the login page itself
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Unwrap { data, status, ... } → data so call sites stay simple
api.interceptors.response.use((response) => {
  if (response && response.data !== undefined) {
    return response.data;
  }
  return response;
}, (error) => error);

// ---- Auth ------------------------------------------------------------------
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  loginViaEmailPassword: (email, password) =>
    api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  resetPasswordRequest: (email) =>
    api.post('/auth/reset-password-request', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
  setToken: (token) => localStorage.setItem('access_token', token),
  clearToken: () => localStorage.removeItem('access_token'),
  // OAuth (Google). Backend redirects to this URL; the auth-token lands
  // in the URL hash and the consuming page can store it.
  loginWithProvider: (provider, returnTo) => {
    const target = `${API_BASE_URL}/auth/${provider}?return_to=${encodeURIComponent(
      returnTo || '/'
    )}`;
    window.location.href = target;
  },
};

// ---- Entities --------------------------------------------------------------
// Generic CRUD wrapper around /api/entities/{Entity}
const makeEntity = (name) => ({
  list: (sort = '') =>
    api.get(`/entities/${name}${sort ? `?sort=${sort}` : ''}`),
  get: (id) => api.get(`/entities/${name}/${id}`),
  filter: (filters = {}, sort = '') =>
    api.get(`/entities/${name}/filter${sort ? `?sort=${sort}` : ''}`, {
      params: filters,
    }),
  create: (data) => api.post(`/entities/${name}`, data),
  bulkCreate: (data) => api.post(`/entities/${name}/bulk`, data),
  update: (id, data) => api.put(`/entities/${name}/${id}`, data),
  bulkUpdate: (data) => api.put(`/entities/${name}/bulk`, data),
  delete: (id) => api.delete(`/entities/${name}/${id}`),
  deleteMany: (filters = {}) =>
    api.delete(`/entities/${name}`, { params: filters }),
});

export const entitiesApi = {
  Project: makeEntity('Project'),
  Keyword: makeEntity('Keyword'),
  Backlink: makeEntity('Backlink'),
  AuditIssue: makeEntity('AuditIssue'),
  Report: makeEntity('Report'),
};

// ---- Integrations -----------------------------------------------------------
// AI / LLM integration via Google Gemini (free tier, OpenAI-compatible).
// When VITE_GEMINI_API_KEY is set the client calls Gemini directly; otherwise
// it falls through to the backend, which proxies to Gemini when GEMINI_API_KEY
// is set, or returns offline mock data.
export const integrationsApi = {
  Core: {
    /**
     * Call the LLM.
     *
     * @param {object} params
     * @param {string} params.prompt
     * @param {boolean} [params.add_context_from_internet]
     * @param {string}  [params.model]        OmniRoute model id (e.g. "oc/hy3-free")
     * @param {object}  [params.response_json_schema] JSON schema for the response
     * @returns {Promise<any>}
     */
    InvokeLLM: async (params = {}) => {
      // Direct OmniRoute call when an API key is configured and the schema
      // is provided. The mock-server ignores these headers and returns
      // canned data, so this is a no-op there.
      if (OMNIROUTE_API_KEY && params.response_json_schema) {
        try {
          return await callOmniRoute(params);
        } catch (err) {
          console.warn('OmniRoute call failed, falling back to backend:', err.message);
          // Fall through to backend call below
        }
      }
      // Default: ask the backend, which may proxy to OmniRoute itself
      // or return mock data while the dev server is running.
      // The axios response interceptor already unwraps response.data → data,
      // so 'res' here is the actual JSON payload (not an axios Response).
      return await api.post('/integrations/core/invoke-llm', params);
    },
  },
};

async function callOmniRoute({ prompt, model = OMNIROUTE_MODEL, response_json_schema }) {
  const sys = response_json_schema
    ? 'You are an SEO analyst. Always respond with strict JSON that matches the provided schema. Do not include any prose.'
    : 'You are a helpful SEO analyst.';

  const res = await fetch(`${OMNIROUTE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OMNIROUTE_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    throw new Error(`OmniRoute error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

// ---- SEO (Googlebot-style crawler + extended tools) --------------------------------
// Calls the backend crawler + tools routes. Both methods are long-running (1+ second
// per page) so callers should set loading state. URLs are normalized to include a
// protocol before sending to the backend.
const normalizeSeoUrl = (url) => {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

export const seoApi = {
  crawl: (url, opts = {}) =>
    api.post('/seo/crawl', { url: normalizeSeoUrl(url), maxPages: 25, delayMs: 500, ...opts }),
  backlinks: (url, opts = {}) =>
    api.post('/seo/backlinks', { url: normalizeSeoUrl(url), maxPages: 25, delayMs: 500, ...opts }),
  // New extended SEO tools
  sitemap: (data) => api.post('/seo/sitemap', data),
  keywords: (data) => api.post('/seo/keywords', data),
  opportunities: (url) => api.get('/seo/opportunities', { params: { url } }),
  alerts: {
    list: (params) => api.get('/seo/alerts', { params }),
    create: (data) => api.post('/seo/alerts', data),
    delete: (id) => api.delete(`/seo/alerts/${id}`),
    check: (data) => api.post('/seo/alerts/check', data),
  },
};

// ---- Live data (real, free sources) ---------------------------------------
// PSI = PageSpeed Insights (Core Web Vitals + Lighthouse). Currency = Frankfurter
// (ECB rates). GSC = Google Search Console (gated on OAuth creds). All return
// a normalized { live, source, ... } shape; the UI falls back to mock data
// whenever `live` is false.
export const liveApi = {
  pageSpeed: (url, strategy = 'mobile') =>
    api.get('/live/pagespeed', { params: { url, strategy } }),
  currency: (base = 'USD') =>
    api.get('/live/currency', { params: { base } }),
  gscStatus: () => api.get('/live/gsc/status'),
  gscAuthUrl: () => api.get('/live/gsc/auth-url'),
  gscQuery: (body = {}) => api.post('/live/gsc/query', body),
};

// ---- Default export (drop-in replacement for `base44`) -------------------
export const vizion = {
  auth: authApi,
  entities: entitiesApi,
  integrations: integrationsApi,
  seo: seoApi,
  live: liveApi,
};

export default vizion;
export { api };
