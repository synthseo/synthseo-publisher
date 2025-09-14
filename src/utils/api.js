/**
 * API utility functions for external API calls
 */

class ApiClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = 30000; // 30 seconds default
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Set configuration
   */
  configure(config) {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.timeout) this.timeout = config.timeout * 1000;
    if (config.retryAttempts) this.retryAttempts = config.retryAttempts;
  }

  /**
   * Make API request with retry logic
   */
  async request(endpoint, options = {}, attempt = 1) {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('API URL and Key are required');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Retry on 5xx errors
        if (response.status >= 500 && attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
          return this.request(endpoint, options, attempt + 1);
        }

        const error = await response.text();
        throw new Error(`API Error (${response.status}): ${error}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (attempt < this.retryAttempts && !error.message.includes('API Error')) {
        await this.delay(this.retryDelay * attempt);
        return this.request(endpoint, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Delay helper for retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(fullEndpoint, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      const response = await this.get('/status');
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Batch request
   */
  async batch(requests) {
    const results = [];

    for (const request of requests) {
      try {
        const response = await this[request.method.toLowerCase()](
          request.endpoint,
          request.data
        );
        results.push({
          success: true,
          data: response,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export functions
export const configureApi = (config) => apiClient.configure(config);
export const testApiConnection = () => apiClient.testConnection();
export const apiGet = (endpoint, params) => apiClient.get(endpoint, params);
export const apiPost = (endpoint, data) => apiClient.post(endpoint, data);
export const apiPut = (endpoint, data) => apiClient.put(endpoint, data);
export const apiDelete = (endpoint) => apiClient.delete(endpoint);
export const apiBatch = (requests) => apiClient.batch(requests);

export default apiClient;