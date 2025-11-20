/**
 * Agentic Network Monitor with Recovery
 * Intelligent network monitoring and automatic error recovery
 */

export class AgenticNetworkMonitor {
  constructor() {
    this.requestHistory = new Map();
    this.responseHistory = new Map();
    this.listeners = [];
    this.retryCount = new Map();
    this.maxRetries = 3;
    this.isSetup = false;
  }

  /**
   * Setup network interception
   */
  setupInterception() {
    if (this.isSetup) return;

    this.patchFetch();
    this.patchXHR();
    this.isSetup = true;

    console.log('🌐 Agentic Network Monitor initialized');
  }

  /**
   * Patch fetch with recovery logic
   */
  patchFetch() {
    const self = this;
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      const [resource, init] = args;
      const requestId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const request = {
        id: requestId,
        url: resource instanceof Request ? resource.url : resource,
        method: init?.method || 'GET',
        headers: init?.headers || {},
        timestamp: Date.now(),
        type: 'fetch'
      };

      self.requestHistory.set(requestId, request);
      self.notifyListeners('request', request);

      try {
        const response = await originalFetch(...args);
        
        const responseObj = {
          id: requestId,
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: Date.now(),
          duration: Date.now() - request.timestamp
        };

        self.responseHistory.set(requestId, responseObj);
        self.notifyListeners('response', responseObj);

        // Handle network errors
        if (response.status >= 400) {
          await self.handleNetworkError(requestId, request, responseObj, args);
        }

        return response;
      } catch (error) {
        const errorObj = {
          id: requestId,
          error: error.message,
          timestamp: Date.now(),
          duration: Date.now() - request.timestamp
        };

        self.responseHistory.set(requestId, errorObj);
        self.notifyListeners('error', errorObj);

        // Attempt recovery
        return self.attemptRecovery(requestId, request, error, args, originalFetch);
      }
    };
  }

  /**
   * Patch XHR with recovery logic
   */
  patchXHR() {
    const self = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url;
      this._method = method;
      this._startTime = Date.now();
      return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const requestId = `xhr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this._requestId = requestId;

      const request = {
        id: requestId,
        url: this._url,
        method: this._method,
        timestamp: this._startTime || Date.now(),
        type: 'xhr'
      };

      self.requestHistory.set(requestId, request);
      self.notifyListeners('request', request);

      const originalOnLoad = this.onload;
      this.onload = function(...loadArgs) {
        const response = {
          id: requestId,
          status: this.status,
          statusText: this.statusText,
          url: this.responseURL,
          timestamp: Date.now(),
          duration: Date.now() - request.timestamp
        };

        self.responseHistory.set(requestId, response);
        self.notifyListeners('response', response);

        // Handle errors
        if (this.status >= 400) {
          self.handleNetworkError(requestId, request, response, null);
        }

        if (originalOnLoad) {
          originalOnLoad.apply(this, loadArgs);
        }
      };

      const originalOnError = this.onerror;
      this.onerror = function(...errorArgs) {
        const error = {
          id: requestId,
          error: 'Network error',
          timestamp: Date.now(),
          duration: Date.now() - request.timestamp
        };

        self.responseHistory.set(requestId, error);
        self.notifyListeners('error', error);

        if (originalOnError) {
          originalOnError.apply(this, errorArgs);
        }
      };

      return originalSend.apply(this, args);
    };
  }

  /**
   * Handle network errors with intelligent recovery
   */
  async handleNetworkError(requestId, request, response, fetchArgs) {
    const status = response.status;

    console.warn(`⚠️ Network error ${status} for ${request.url}`);

    switch (status) {
      case 429: // Too many requests
        await this.handleRateLimiting(requestId, request, response, fetchArgs);
        break;
      case 500:
      case 502:
      case 503:
      case 504: // Server errors
        await this.handleServerError(requestId, request, response, fetchArgs);
        break;
      case 404: // Not found
        await this.handleNotFound(requestId, request, response, fetchArgs);
        break;
      default:
        await this.handleGenericError(requestId, request, response, fetchArgs);
    }
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  async handleRateLimiting(requestId, request, response, fetchArgs) {
    const retryCount = this.retryCount.get(requestId) || 0;
    
    if (retryCount >= this.maxRetries) {
      console.error(`❌ Max retries exceeded for ${request.url}`);
      return;
    }

    // Get retry-after header or use exponential backoff
    const retryAfter = response.headers?.['retry-after'] || Math.pow(2, retryCount);
    const delay = Math.min(60, retryAfter) * 1000;

    this.notifyListeners('info', {
      message: `Rate limited. Retrying in ${delay/1000} seconds`,
      timestamp: Date.now(),
      requestId
    });

    this.retryCount.set(requestId, retryCount + 1);

    await this.sleep(delay);
    
    // Retry request if fetchArgs provided
    if (fetchArgs) {
      return window.fetch(...fetchArgs);
    }
  }

  /**
   * Handle server errors
   */
  async handleServerError(requestId, request, response, fetchArgs) {
    const retryCount = this.retryCount.get(requestId) || 0;
    
    if (retryCount >= this.maxRetries) {
      console.error(`❌ Max retries exceeded for ${request.url}`);
      return;
    }

    const delay = 5000; // 5 seconds for server errors

    this.notifyListeners('info', {
      message: `Server error ${response.status}. Retrying in ${delay/1000} seconds`,
      timestamp: Date.now(),
      requestId
    });

    this.retryCount.set(requestId, retryCount + 1);

    await this.sleep(delay);
    
    if (fetchArgs) {
      return window.fetch(...fetchArgs);
    }
  }

  /**
   * Handle 404 errors with alternative paths
   */
  async handleNotFound(requestId, request, response, fetchArgs) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Try alternative paths
    const alternativePaths = [
      path.replace(/\/$/, ''), // Remove trailing slash
      path + '/', // Add trailing slash
      path.replace(/index\.html$/, ''), // Remove index.html
      path + 'index.html' // Add index.html
    ];

    this.notifyListeners('info', {
      message: `404 Not Found. Trying alternative paths`,
      timestamp: Date.now(),
      requestId
    });

    for (const altPath of alternativePaths) {
      if (altPath !== path) {
        const altUrl = new URL(url.origin + altPath);
        
        try {
          const altResponse = await fetch(altUrl.toString());
          if (altResponse.ok) {
            this.notifyListeners('info', {
              message: `✅ Alternative path successful: ${altPath}`,
              timestamp: Date.now(),
              requestId
            });
            return altResponse;
          }
        } catch (error) {
          continue;
        }
      }
    }

    console.error(`❌ No alternative paths worked for ${request.url}`);
  }

  /**
   * Handle generic errors
   */
  async handleGenericError(requestId, request, response, fetchArgs) {
    const retryCount = this.retryCount.get(requestId) || 0;
    
    if (retryCount >= this.maxRetries) {
      console.error(`❌ Max retries exceeded for ${request.url}`);
      return;
    }

    const delay = Math.min(10000, Math.pow(2, retryCount) * 1000);

    this.notifyListeners('info', {
      message: `Generic error. Retrying in ${delay/1000} seconds`,
      timestamp: Date.now(),
      requestId
    });

    this.retryCount.set(requestId, retryCount + 1);

    await this.sleep(delay);
    
    if (fetchArgs) {
      return window.fetch(...fetchArgs);
    }
  }

  /**
   * Attempt recovery for failed requests
   */
  async attemptRecovery(requestId, request, error, fetchArgs, originalFetch) {
    const retryCount = this.retryCount.get(requestId) || 0;
    
    if (retryCount >= this.maxRetries) {
      throw error;
    }

    const delay = Math.pow(2, retryCount) * 1000;

    this.notifyListeners('info', {
      message: `Network error. Attempting recovery in ${delay/1000} seconds`,
      timestamp: Date.now(),
      requestId
    });

    this.retryCount.set(requestId, retryCount + 1);

    await this.sleep(delay);
    
    // Retry the request
    return originalFetch(...fetchArgs);
  }

  /**
   * Add listener for network events
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach(cb => {
      try {
        cb(eventType, data);
      } catch (error) {
        console.error('Error in network monitor listener:', error);
      }
    });
  }

  /**
   * Get network statistics
   */
  getStatistics() {
    const requests = Array.from(this.requestHistory.values());
    const responses = Array.from(this.responseHistory.values());

    const successfulResponses = responses.filter(r => r.status && r.status >= 200 && r.status < 300);
    const failedResponses = responses.filter(r => r.error || (r.status && r.status >= 400));
    const retryableErrors = responses.filter(r => r.status === 429 || r.status >= 500);

    const durations = responses.filter(r => r.duration).map(r => r.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      totalRequests: requests.length,
      totalResponses: responses.length,
      successfulResponses: successfulResponses.length,
      failedResponses: failedResponses.length,
      retryableErrors: retryableErrors.length,
      averageDuration: Math.round(avgDuration),
      requestsByMethod: this.groupBy(requests, 'method'),
      responsesByStatus: this.groupBy(responses, 'status')
    };
  }

  /**
   * Group array by property
   */
  groupBy(array, property) {
    return array.reduce((acc, item) => {
      const key = item[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Clear all data
   */
  clear() {
    this.requestHistory.clear();
    this.responseHistory.clear();
    this.retryCount.clear();
    console.log('🧹 Agentic network monitor data cleared');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new AgenticNetworkMonitor();
    }
    return this.instance;
  }
}
