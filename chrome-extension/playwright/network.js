/**
 * Playwright Network Monitoring
 * Network interception and monitoring using Playwright concepts for Chrome Extension
 */

export class PlaywrightNetworkMonitor {
  constructor() {
    this.requests = new Map();
    this.responses = new Map();
    this.listeners = [];
    this.isSetup = false;
  }

  /**
   * Initialize network monitoring
   */
  setupInterception() {
    if (this.isSetup) {
      return;
    }

    this.patchFetch();
    this.patchXHR();
    this.isSetup = true;

    console.log('🌐 Playwright Network Monitor initialized');
  }

  /**
   * Patch the global fetch function to monitor requests
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

      self.requests.set(requestId, request);
      self.notifyListeners('request', request);

      try {
        const response = await originalFetch(...args);
        const clonedResponse = response.clone();

        const responseObj = {
          id: requestId,
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: Date.now(),
          duration: Date.now() - request.timestamp
        };

        self.responses.set(requestId, responseObj);
        self.notifyListeners('response', responseObj);

        return response;
      } catch (error) {
        const errorObj = {
          id: requestId,
          error: error.message,
          timestamp: Date.now(),
          duration: Date.now() - request.timestamp
        };

        self.responses.set(requestId, errorObj);
        self.notifyListeners('error', errorObj);

        throw error;
      }
    };
  }

  /**
   * Patch XMLHttpRequest to monitor requests
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

      self.requests.set(requestId, request);
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

        self.responses.set(requestId, response);
        self.notifyListeners('response', response);

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

        self.responses.set(requestId, error);
        self.notifyListeners('error', error);

        if (originalOnError) {
          originalOnError.apply(this, errorArgs);
        }
      };

      const originalOnTimeout = this.ontimeout;
      this.ontimeout = function(...timeoutArgs) {
        const error = {
          id: requestId,
          error: 'Request timeout',
          timestamp: Date.now(),
          duration: Date.now() - request.timestamp
        };

        self.responses.set(requestId, error);
        self.notifyListeners('error', error);

        if (originalOnTimeout) {
          originalOnTimeout.apply(this, timeoutArgs);
        }
      };

      return originalSend.apply(this, args);
    };
  }

  /**
   * Add a listener for network events
   * @param {Function} callback - Callback function (eventType, data)
   * @returns {Function} Unsubscribe function
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of a network event
   * @param {string} eventType - Event type: 'request', 'response', 'error'
   * @param {Object} data - Event data
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
   * Get all recorded requests
   * @returns {Array} Array of request objects
   */
  getRequests() {
    return Array.from(this.requests.values());
  }

  /**
   * Get all recorded responses
   * @returns {Array} Array of response objects
   */
  getResponses() {
    return Array.from(this.responses.values());
  }

  /**
   * Get network activity statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const requests = this.getRequests();
    const responses = this.getResponses();

    const successfulResponses = responses.filter(r => r.status && r.status >= 200 && r.status < 300);
    const failedResponses = responses.filter(r => r.error || (r.status && r.status >= 400));

    const durations = responses.filter(r => r.duration).map(r => r.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      totalRequests: requests.length,
      totalResponses: responses.length,
      successfulResponses: successfulResponses.length,
      failedResponses: failedResponses.length,
      averageDuration: Math.round(avgDuration),
      requestsByMethod: this.groupBy(requests, 'method'),
      responsesByStatus: this.groupBy(responses, 'status')
    };
  }

  /**
   * Group array items by a property
   * @param {Array} array - Array to group
   * @param {string} property - Property to group by
   * @returns {Object} Grouped object
   */
  groupBy(array, property) {
    return array.reduce((acc, item) => {
      const key = item[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Clear all recorded network data
   */
  clear() {
    this.requests.clear();
    this.responses.clear();
    console.log('🧹 Network monitor data cleared');
  }

  /**
   * Wait for a specific network request to complete
   * @param {string|RegExp} urlPattern - URL pattern to match
   * @param {Object} options - Waiting options
   * @returns {Promise<Object>} Response object
   */
  async waitForRequest(urlPattern, options = {}) {
    const { timeout = 30000 } = options;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const requests = this.getRequests();
        const matchingRequest = requests.find(req => {
          if (typeof urlPattern === 'string') {
            return req.url.includes(urlPattern);
          } else if (urlPattern instanceof RegExp) {
            return urlPattern.test(req.url);
          }
          return false;
        });

        if (matchingRequest) {
          const response = this.responses.get(matchingRequest.id);
          if (response) {
            clearInterval(checkInterval);
            resolve(response);
          }
        }

        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Request matching "${urlPattern}" did not complete within ${timeout}ms`));
        }
      }, 100);
    });
  }

  /**
   * Get singleton instance
   * @returns {PlaywrightNetworkMonitor}
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new PlaywrightNetworkMonitor();
    }
    return this.instance;
  }
}
