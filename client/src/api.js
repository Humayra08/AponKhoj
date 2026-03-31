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

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user: Object, access_token: string, token_type: string, expires_in: number}>}
   */
  async login(email, password) {
    try {
      const response = await this.client.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Register new user
   * @param {Object} userData - {name, email, password, password_confirmation, phone?, district?}
   * @returns {Promise<{user: Object, authorization: {token: string, type: string}}>}
   */
  async register(userData) {
    try {
      const response = await this.client.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Logout current user
   * @returns {Promise<{message: string}>}
   */
  async logout() {
    try {
      const response = await this.client.post('/auth/logout');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    try {
      const response = await this.client.get('/auth/me');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Refresh JWT token
   * @returns {Promise<{access_token: string, token_type: string, expires_in: number, user: Object}>}
   */
  async refreshToken() {
    try {
      const response = await this.client.post('/auth/refresh');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Verify email with OTP code
   * @param {string} email
   * @param {string} code - 4-digit verification code
   * @returns {Promise<{message: string, user: Object, authorization: {token: string, type: string}}>}
   */
  async verifyEmail(email, code) {
    try {
      const response = await this.client.post('/auth/verify-email', { email, code });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Resend verification code
   * @param {string} email
   * @returns {Promise<{message: string}>}
   */
  async resendCode(email) {
    try {
      const response = await this.client.post('/auth/resend-code', { email });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Handle common errors
  handleError(error) {
    if (error.response) {
      const errorData = error.response.data;
      console.error(`API Error: ${error.response.status}`, errorData);
      
      // Handle validation errors (422)
      if (error.response.status === 422 && errorData) {
        // Laravel returns validation errors as an object with field names as keys
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

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
