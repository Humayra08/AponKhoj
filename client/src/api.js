import axios from 'axios';
import { secrets } from './secrets';
import toast from 'react-hot-toast';

// AponKhoj API Client
// Add your API methods here
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: secrets.backendEndpoint,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Example method
  // async getExample() {
  //   try {
  //     const response = await this.client.get('/api/example');
  //     return response.data;
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  // Handle common errors
  handleError(error) {
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.data.message}`);
    } else if (error.request) {
      console.error('API Error: No response received', error.request);
    } else {
      console.error('API Error:', error.message);
    }

    toast.error(error.message || 'Something went wrong');
  }
}

export default ApiClient;
