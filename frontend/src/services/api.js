import axios from 'axios';
import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // Increase to 120 seconds (2 minutes)
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting ID token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - backend is processing');
    } else if (error.response) {
      const message = error.response.data?.detail || error.message;
      console.error('API Error:', message);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const emailAPI = {
  healthCheck: async () => {
    const response = await apiClient.get('/');
    return response.data;
  },

  summarize: async (emailBody, emailSubject, summaryLength = 'Medium') => {
    const response = await apiClient.post('/api/summarize', {
      email_body: emailBody,
      email_subject: emailSubject,
      summary_length: summaryLength
    }, {
      timeout: 60000 // 60 seconds for single email
    });
    return response.data;
  },

  authorizeGmail: async (userId) => {
    const response = await apiClient.post('/api/gmail/authorize', {
      user_id: userId
    });
    return response.data;
  },

  fetchEmails: async (userId, maxResults = 10) => {
    const response = await apiClient.post('/api/gmail/fetch', {
      user_id: userId,
      max_results: maxResults
    }, {
      timeout: 180000 // 3 minutes for fetching multiple emails
    });
    return response.data;
  },

  getSummaries: async (userId, limit = 50) => {
    const response = await apiClient.get(`/api/summaries/${userId}`, {
      params: { limit }
    });
    return response.data;
  },

  getAnalytics: async (userId) => {
    const response = await apiClient.get(`/api/analytics/${userId}`);
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await apiClient.post('/api/user/preferences', preferences);
    return response.data;
  },

  clearSummaries: async (userId) => {
    const response = await apiClient.delete(`/api/summaries/${userId}`);
    return response.data;
  }
};

export default apiClient;