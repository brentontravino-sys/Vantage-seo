import axios from 'axios';

// Configuration for the API client
// Replace these with your actual backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  loginViaEmailPassword: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  resetPasswordRequest: (email) => api.post('/auth/reset-password-request', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
  setToken: (token) => {
    localStorage.setItem('access_token', token);
  },
  clearToken: () => {
    localStorage.removeItem('access_token');
  },
  loginWithProvider: (provider, returnTo) => {
    // For OAuth providers, redirect to the provider
    window.location.href = `/api/auth/${provider}?return_to=${encodeURIComponent(returnTo)}`;
  },
};

// Entities API methods (CRUD operations)
export const entitiesApi = {
  // Project entity
  Project: {
    list: (sort = '') => api.get(`/entities/Project${sort ? `?sort=${sort}` : ''}`),
    get: (id) => api.get(`/entities/Project/${id}`),
    create: (data) => api.post('/entities/Project', data),
    update: (id, data) => api.put(`/entities/Project/${id}`, data),
    delete: (id) => api.delete(`/entities/Project/${id}`),
  },
  
  // Keyword entity
  Keyword: {
    list: (params = {}) => api.get('/entities/Keyword', { params }),
    filter: (filters, sort = '') => api.get(`/entities/Keyword/filter${sort ? `?sort=${sort}` : ''}`, { params: filters }),
    get: (id) => api.get(`/entities/Keyword/${id}`),
    create: (data) => api.post('/entities/Keyword', data),
    bulkCreate: (data) => api.post('/entities/Keyword/bulk', data),
    update: (id, data) => api.put(`/entities/Keyword/${id}`, data),
    bulkUpdate: (data) => api.put('/entities/Keyword/bulk', data),
    delete: (id) => api.delete(`/entities/Keyword/${id}`),
    deleteMany: (filters) => api.delete('/entities/Keyword', { params: filters }),
  },
  
  // Backlink entity
  Backlink: {
    list: (params = {}) => api.get('/entities/Backlink', { params }),
    filter: (filters, sort = '') => api.get(`/entities/Backlink/filter${sort ? `?sort=${sort}` : ''}`, { params: filters }),
    get: (id) => api.get(`/entities/Backlink/${id}`),
    create: (data) => api.post('/entities/Backlink', data),
    bulkCreate: (data) => api.post('/entities/Backlink/bulk', data),
    update: (id, data) => api.put(`/entities/Backlink/${id}`, data),
    delete: (id) => api.delete(`/entities/Backlink/${id}`),
    deleteMany: (filters) => api.delete('/entities/Backlink', { params: filters }),
  },
  
  // AuditIssue entity
  AuditIssue: {
    list: (params = {}) => api.get('/entities/AuditIssue', { params }),
    filter: (filters, sort = '') => api.get(`/entities/AuditIssue/filter${sort ? `?sort=${sort}` : ''}`, { params: filters }),
    get: (id) => api.get(`/entities/AuditIssue/${id}`),
    create: (data) => api.post('/entities/AuditIssue', data),
    bulkCreate: (data) => api.post('/entities/AuditIssue/bulk', data),
    update: (id, data) => api.put(`/entities/AuditIssue/${id}`, data),
    delete: (id) => api.delete(`/entities/AuditIssue/${id}`),
    deleteMany: (filters) => api.delete('/entities/AuditIssue', { params: filters }),
  },
  
  // Report entity
  Report: {
    list: (params = {}) => api.get('/entities/Report', { params }),
    filter: (filters, sort = '') => api.get(`/entities/Report/filter${sort ? `?sort=${sort}` : ''}`, { params: filters }),
    get: (id) => api.get(`/entities/Report/${id}`),
    create: (data) => api.post('/entities/Report', data),
    update: (id, data) => api.put(`/entities/Report/${id}`, data),
    delete: (id) => api.delete(`/entities/Report/${id}`),
  },
};

// Integrations API methods (for LLM/AI calls)
// These would need to be implemented on your backend
export const integrationsApi = {
  Core: {
    InvokeLLM: async (params) => {
      // This is a placeholder for the LLM integration
      // On your backend, you would call your AI service (OpenAI, Gemini, etc.)
      console.warn('LLM integration not implemented. Configure your backend API.');
      
      // For development, you can return mock data or call a mock endpoint
      try {
        const response = await api.post('/integrations/core/invoke-llm', params);
        return response.data;
      } catch (error) {
        console.error('LLM invocation failed:', error);
        throw error;
      }
    },
  },
};

// Export a client object that mimics the Base44 SDK structure
export const client = {
  auth: authApi,
  entities: entitiesApi,
  integrations: integrationsApi,
};

export default client;
