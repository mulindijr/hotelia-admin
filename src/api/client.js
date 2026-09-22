import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotelia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hotelia_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to build Spatie QueryBuilder URLs
 * @param {string} endpoint - The API endpoint (e.g. '/hotels')
 * @param {object} options - Contains filters, sort, page, perPage, includes
 * @returns {string} - The formatted URL
 */
export const buildUrl = (endpoint, options = {}) => {
  const params = new URLSearchParams();

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(`filter[${key}]`, value);
      }
    });
  }

  if (options.sort) {
    params.append('sort', options.sort);
  }

  if (options.page) {
    params.append('page', options.page);
  }

  if (options.perPage) {
    params.append('per_page', options.perPage);
  }

  if (options.include) {
    params.append('include', options.include);
  }

  const queryString = params.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

export default api;
