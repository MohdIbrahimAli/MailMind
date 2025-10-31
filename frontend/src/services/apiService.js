import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
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

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.detail || error.message;
      console.error('API Error:', message);
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Redirect to login or refresh token
        authService.signOut();
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const emailAPI = {
  /**
   * Summarize a single email
   */
  summarize: async (emailBody, emailSubject, summaryLength = 'Medium') => {
    try {
      const response = await apiClient.post('/api/summarize', {
        email_body: emailBody,
        email_subject: emailSubject,
        summary_length: summaryLength
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Authorize Gmail access
   */
  authorizeGmail: async (userId) => {
    try {
      const response = await apiClient.post('/api/gmail/authorize', {
        user_id: userId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch emails from Gmail
   */
  fetchEmails: async (userId, maxResults = 10) => {
    try {
      const response = await apiClient.post('/api/gmail/fetch', {
        user_id: userId,
        max_results: maxResults
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user summaries
   */
  getSummaries: async (userId, limit = 50) => {
    try {
      const response = await apiClient.get(`/api/summaries/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user analytics
   */
  getAnalytics: async (userId) => {
    try {
      const response = await apiClient.get(`/api/analytics/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (preferences) => {
    try {
      const response = await apiClient.post('/api/user/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Clear all summaries
   */
  clearSummaries: async (userId) => {
    try {
      const response = await apiClient.delete(`/api/summaries/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;