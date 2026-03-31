import axios from 'axios';
import { secrets } from './secrets';
import toast from 'react-hot-toast';

// AponKhoj API Client
class ApiClient {
  constructor() {
    const configuredBase = (secrets.backendEndpoint || 'http://localhost').replace(/\/+$/, '');
    const apiBaseURL = /\/api$/i.test(configuredBase)
      ? configuredBase
      : `${configuredBase}/api`;

    this.client = axios.create({
      baseURL: apiBaseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add JWT token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('aponkhoj_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(email, password) {
    try {
      const response = await this.client.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.client.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async logout() {
    try {
      const response = await this.client.post('/auth/logout');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.client.get('/auth/me');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await this.client.post('/auth/refresh');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async verifyEmail(email, code) {
    try {
      const response = await this.client.post('/auth/verify-email', { email, code });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async resendCode(email) {
    try {
      const response = await this.client.post('/auth/resend-code', { email });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ─── Profile endpoints ───────────────────────────────────────────

  /**
   * Get authenticated user's profile
   * GET /api/profile
   * @returns {Promise<Object>} profile data
   */
  async getProfile() {
    try {
      const response = await this.client.get('/profile');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Full update of profile (replaces all fields)
   * PUT /api/profile
   * @param {Object} profileData - { name, phone, location, ... }
   * @returns {Promise<Object>} updated profile
   */
  async updateProfile(profileData) {
    try {
      const response = await this.client.put('/profile', profileData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Partial update of profile (only sends changed fields)
   * PATCH /api/profile
   * @param {Object} profileData - partial fields to update
   * @returns {Promise<Object>} updated profile
   */
  async patchProfile(profileData) {
    try {
      const response = await this.client.patch('/profile', profileData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Upload avatar image
   * PATCH /api/profile — sends as multipart/form-data
   * @param {File} file - image file
   * @returns {Promise<Object>} updated profile with new avatarUrl
   */
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await this.client.patch('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────

  handleError(error) {
    if (error.response) {
      const errorData = error.response.data;
      console.error(`API Error: ${error.response.status}`, errorData);

      if (error.response.status === 422 && errorData) {
        const validationMessages = [];
        for (const field in errorData) {
          if (Array.isArray(errorData[field])) {
            validationMessages.push(...errorData[field]);
          }
        }
        if (validationMessages.length > 0) {
          validationMessages.forEach(msg => toast.error(msg));
          return;
        }
      }

      const message = errorData.message || errorData.error || 'Something went wrong';
      toast.error(message);
    } else if (error.request) {
      console.error('API Error: No response received', error.request);
      toast.error('Network error - unable to reach server');
    } else {
      console.error('API Error:', error.message);
      toast.error(error.message || 'Something went wrong');
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;