import axios from 'axios';
import { secrets } from './secrets';
import toast from 'react-hot-toast';

// AponKhoj API Client
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: secrets.backendEndpoint,
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

  // Handle common errors
  handleError(error) {
    if (error.response) {
      const message = error.response.data.message || error.response.data.error || 'Something went wrong';
      console.error(`API Error: ${error.response.status}`, error.response.data);
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
