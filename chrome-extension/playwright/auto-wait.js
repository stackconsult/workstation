/**
 * Playwright Auto-Waiting System
 * Enhanced element waiting using Playwright's auto-waiting concepts for Chrome Extension
 */

export class PlaywrightAutoWait {
  /**
   * Wait for an element to be in the specified state
   * @param {string} selector - CSS selector for the element
   * @param {Object} options - Waiting options
   * @param {string} options.state - Element state: 'visible', 'enabled', 'attached'
   * @param {number} options.timeout - Maximum wait time in milliseconds
   * @param {number} options.pollingInterval - Polling interval in milliseconds
   * @returns {Promise<HTMLElement>} The element when ready
   */
  static async waitForElement(selector, options = {}) {
    const {
      state = 'visible',
      timeout = 30000,
      pollingInterval = 100
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const element = document.querySelector(selector);

        if (!element) {
          await this.sleep(pollingInterval);
          continue;
        }

        // Check for different states
        if (state === 'attached') {
          return element;
        }

        if (state === 'visible') {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility === 'visible' &&
            style.display !== 'none' &&
            style.opacity !== '0'
          ) {
            return element;
          }
        }

        if (state === 'enabled') {
          if (!element.disabled && !element.hasAttribute('aria-disabled')) {
            return element;
          }
        }

        await this.sleep(pollingInterval);
      } catch (e) {
        await this.sleep(pollingInterval);
      }
    }

    throw new Error(`Element "${selector}" not found within ${timeout}ms in state "${state}"`);
  }

  /**
   * Get multiple selector strategies for robust element identification
   * Returns strategies in priority order (most reliable first)
   * @param {HTMLElement} element - The element to generate selectors for
   * @returns {string[]} Array of selector strings
   */
  static getSelectorStrategies(element) {
    const strategies = [];

    // 1. ARIA role (highest priority for accessibility)
    const role = element.getAttribute('role') || element.getAttribute('aria-role');
    if (role) {
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        strategies.push(`[role="${role}"][aria-label="${ariaLabel}"]`);
      }
      strategies.push(`[role="${role}"]`);
    }

    // 2. Data-test-id (preferred for automation)
    if (element.dataset.testid) {
      strategies.push(`[data-testid="${element.dataset.testid}"]`);
    }

    if (element.dataset.test) {
      strategies.push(`[data-test="${element.dataset.test}"]`);
    }

    // 3. ID (highly specific but may change)
    if (element.id) {
      strategies.push(`#${element.id}`);
    }

    // 4. Name attribute (common for form elements)
    if (element.name) {
      strategies.push(`[name="${element.name}"]`);
    }

    // 5. Placeholder text (for input fields)
    if (element.placeholder) {
      strategies.push(`[placeholder="${element.placeholder}"]`);
    }

    // 6. Text content (for buttons, links, labels)
    if (element.textContent && element.textContent.trim().length > 0 && element.textContent.trim().length < 50) {
      const text = element.textContent.trim().replace(/"/g, '\\"');
      const tagName = element.tagName.toLowerCase();
      // Use standard CSS selector instead of Playwright-specific :has-text
      strategies.push(`${tagName}[textContent*="${text}"]`);
    }

    // 7. Class-based selector (if unique)
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c && !c.startsWith('css-'));
      if (classes.length > 0) {
        const classSelector = `.${classes.join('.')}`;
        const matches = document.querySelectorAll(classSelector);
        if (matches.length === 1) {
          strategies.push(classSelector);
        }
      }
    }

    // 8. Full path with nth-child (fallback)
    const path = this.getElementPath(element);
    if (path) {
      strategies.push(path);
    }

    return strategies;
  }

  /**
   * Get the full path to an element using nth-child
   * @param {HTMLElement} element - The element
   * @returns {string} CSS selector path
   */
  static getElementPath(element) {
    const path = [];
    let current = element;

    while (current && current !== document.body && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      } else {
        const siblings = Array.from(current.parentElement?.children || []);
        const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
        
        if (sameTagSiblings.length > 1) {
          const index = sameTagSiblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Test all selector strategies and return the first working one
   * @param {string[]} strategies - Array of selector strategies
   * @param {Object} options - Waiting options
   * @returns {Promise<{element: HTMLElement, selector: string}>} Element and working selector
   */
  static async findElementWithStrategies(strategies, options = {}) {
    const errors = [];

    for (const selector of strategies) {
      try {
        const element = await this.waitForElement(selector, { ...options, timeout: 3000 });
        return { element, selector };
      } catch (error) {
        errors.push({ selector, error: error.message });
      }
    }

    throw new Error(`Failed to find element with any strategy. Attempts: ${JSON.stringify(errors)}`);
  }

  /**
   * Wait for element to be actionable (visible and enabled)
   * @param {string} selector - CSS selector
   * @param {Object} options - Waiting options
   * @returns {Promise<HTMLElement>} The actionable element
   */
  static async waitForActionable(selector, options = {}) {
    const element = await this.waitForElement(selector, { ...options, state: 'visible' });
    
    // Additional check for actionability
    if (element.disabled || element.hasAttribute('aria-disabled')) {
      throw new Error(`Element "${selector}" is not actionable (disabled)`);
    }

    // Check if element is not covered by another element
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);

    if (topElement && !element.contains(topElement) && topElement !== element) {
      // Element is covered, but we'll still return it and let the caller decide
      console.warn(`Element "${selector}" may be covered by another element`);
    }

    return element;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for navigation to complete
   * @param {Object} options - Waiting options
   * @returns {Promise<void>}
   */
  static async waitForNavigation(options = {}) {
    const { timeout = 30000 } = options;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (document.readyState === 'complete') {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`Navigation did not complete within ${timeout}ms`));
        }
      }, 100);
    });
  }

  /**
   * Wait for network to be idle
   * @param {Object} options - Waiting options
   * @param {number} options.timeout - Maximum wait time
   * @param {number} options.idleTime - Time without network activity to consider idle
   * @returns {Promise<void>}
   */
  static async waitForNetworkIdle(options = {}) {
    const { timeout = 30000, idleTime = 500 } = options;
    const startTime = Date.now();
    let lastActivityTime = Date.now();

    // Monitor network activity
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;

    let activeRequests = 0;

    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // Patch fetch
    window.fetch = async (...args) => {
      activeRequests++;
      updateActivity();
      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        activeRequests--;
        updateActivity();
      }
    };

    // Patch XHR
    XMLHttpRequest.prototype.open = function(...args) {
      activeRequests++;
      updateActivity();
      this.addEventListener('loadend', () => {
        activeRequests--;
        updateActivity();
      });
      return originalXHROpen.apply(this, args);
    };

    // Wait for idle
    try {
      while (Date.now() - startTime < timeout) {
        if (activeRequests === 0 && Date.now() - lastActivityTime > idleTime) {
          return;
        }
        await this.sleep(100);
      }
      throw new Error(`Network did not become idle within ${timeout}ms`);
    } finally {
      // Restore original functions
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
    }
  }
}
