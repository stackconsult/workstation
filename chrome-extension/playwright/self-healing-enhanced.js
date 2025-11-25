/**
 * Enhanced Self-Healing Selectors for Playwright
 * Automatically tries alternative selectors when the primary selector fails
 * Learns from successful selectors to improve future selections
 */

class SelfHealingSelectors {
  constructor() {
    this.selectorHistory = new Map(); // element -> successful selectors
    this.failureCount = new Map(); // selector -> failure count
    this.maxAttempts = 5;
    this.timeout = 30000;
  }

  /**
   * Generate alternative selectors for an element
   * Priority order: data-testid > aria-label > id > class > text > xpath
   */
  generateSelectors(element, hint = '') {
    const selectors = [];

    // Priority 1: data-testid (most stable)
    if (element.dataset && element.dataset.testid) {
      selectors.push(`[data-testid="${element.dataset.testid}"]`);
    }

    // Priority 2: aria-label (accessible and stable)
    if (element.getAttribute('aria-label')) {
      selectors.push(`[aria-label="${element.getAttribute('aria-label')}"]`);
    }

    // Priority 3: ID (unique and fast)
    if (element.id) {
      selectors.push(`#${element.id}`);
    }

    // Priority 4: Name attribute (for form elements)
    if (element.name) {
      selectors.push(`[name="${element.name}"]`);
    }

    // Priority 5: Combination of tag + class
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selectors.push(`${element.tagName.toLowerCase()}.${classes.join('.')}`);
      }
    }

    // Priority 6: Text content (visible text)
    if (element.textContent && element.textContent.trim()) {
      const text = element.textContent.trim().substring(0, 50);
      selectors.push(`text=${text}`);
      selectors.push(`text="${text}"`); // Playwright text selector
    }

    // Priority 7: role + name (accessibility)
    const role = element.getAttribute('role');
    if (role) {
      selectors.push(`[role="${role}"]`);
      if (element.textContent) {
        const name = element.textContent.trim().substring(0, 30);
        selectors.push(`role=${role}[name="${name}"]`);
      }
    }

    // Priority 8: Partial text match
    if (hint) {
      selectors.push(`text~="${hint}"`);
      selectors.push(`[title*="${hint}"]`);
      selectors.push(`[placeholder*="${hint}"]`);
    }

    // Priority 9: XPath (last resort, fragile)
    const xpath = this.generateXPath(element);
    if (xpath) {
      selectors.push(`xpath=${xpath}`);
    }

    return selectors;
  }

  /**
   * Generate XPath for element
   */
  generateXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;

      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = current.tagName.toLowerCase();
      const position = index > 0 ? `[${index + 1}]` : '';
      path.unshift(`${tagName}${position}`);

      current = current.parentElement;
    }

    return path.length ? `/${path.join('/')}` : null;
  }

  /**
   * Try to locate element with self-healing
   * Attempts multiple selectors until one succeeds
   */
  async locate(page, primarySelector, options = {}) {
    const hint = options.hint || '';
    const description = options.description || 'element';
    const maxAttempts = options.maxAttempts || this.maxAttempts;

    // Try primary selector first
    try {
      console.log(`Attempting primary selector: ${primarySelector}`);
      const element = await page.waitForSelector(primarySelector, { 
        timeout: 5000,
        state: 'visible'
      });
      
      if (element) {
        this.recordSuccess(description, primarySelector);
        return { element, selector: primarySelector, attempts: 1 };
      }
    } catch (error) {
      console.warn(`Primary selector failed: ${primarySelector}`);
      this.recordFailure(primarySelector);
    }

    // Try alternative selectors
    const alternatives = this.getAlternativeSelectors(description, hint);
    
    for (let i = 0; i < alternatives.length && i < maxAttempts; i++) {
      const selector = alternatives[i];
      
      try {
        console.log(`Attempting alternative ${i + 1}: ${selector}`);
        const element = await page.waitForSelector(selector, { 
          timeout: 3000,
          state: 'visible'
        });
        
        if (element) {
          this.recordSuccess(description, selector);
          console.log(`✅ Self-healed with selector: ${selector}`);
          return { element, selector, attempts: i + 2, healed: true };
        }
      } catch (error) {
        console.warn(`Alternative selector failed: ${selector}`);
        this.recordFailure(selector);
      }
    }

    // Last resort: try to find by visible text or similar
    if (hint) {
      try {
        console.log(`Last resort: searching by hint "${hint}"`);
        const element = await page.locator(`text=${hint}`).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const foundSelector = `text=${hint}`;
          this.recordSuccess(description, foundSelector);
          return { element, selector: foundSelector, attempts: maxAttempts + 1, healed: true };
        }
      } catch (error) {
        // Ignore
      }
    }

    throw new Error(`Failed to locate ${description} after ${maxAttempts} attempts with self-healing`);
  }

  /**
   * Get alternative selectors for an element type
   */
  getAlternativeSelectors(elementDescription, hint) {
    const selectors = [];

    // Check if we have successful selectors from history
    const history = this.selectorHistory.get(elementDescription);
    if (history && history.length > 0) {
      // Add previously successful selectors first
      selectors.push(...history);
    }

    // Add common patterns based on element type
    const patterns = this.getCommonPatterns(elementDescription, hint);
    selectors.push(...patterns);

    // Remove duplicates and failed selectors
    return [...new Set(selectors)].filter(s => {
      const failures = this.failureCount.get(s) || 0;
      return failures < 3; // Skip selectors that failed 3+ times
    });
  }

  /**
   * Get common selector patterns based on element type
   */
  getCommonPatterns(elementDescription, hint) {
    const patterns = [];
    const lower = elementDescription.toLowerCase();

    if (lower.includes('button') || lower.includes('btn')) {
      patterns.push('button', '[role="button"]', 'a.btn', '.button');
      if (hint) {
        patterns.push(`button:has-text("${hint}")`);
        patterns.push(`[role="button"]:has-text("${hint}")`);
      }
    }

    if (lower.includes('input') || lower.includes('field')) {
      patterns.push('input', '[role="textbox"]', 'textarea');
      if (hint) {
        patterns.push(`input[placeholder*="${hint}"]`);
        patterns.push(`input[name*="${hint}"]`);
      }
    }

    if (lower.includes('link')) {
      patterns.push('a', '[role="link"]');
      if (hint) {
        patterns.push(`a:has-text("${hint}")`);
      }
    }

    if (lower.includes('checkbox')) {
      patterns.push('input[type="checkbox"]', '[role="checkbox"]');
    }

    if (lower.includes('select') || lower.includes('dropdown')) {
      patterns.push('select', '[role="combobox"]', '[role="listbox"]');
    }

    return patterns;
  }

  /**
   * Record successful selector
   */
  recordSuccess(elementDescription, selector) {
    const history = this.selectorHistory.get(elementDescription) || [];
    
    // Add to front of history (most recent first)
    if (!history.includes(selector)) {
      history.unshift(selector);
      
      // Keep only last 5 successful selectors
      if (history.length > 5) {
        history.pop();
      }
      
      this.selectorHistory.set(elementDescription, history);
    }

    // Reset failure count on success
    this.failureCount.delete(selector);

    // Log learning
    console.log(`📚 Learned selector for "${elementDescription}": ${selector}`);
  }

  /**
   * Record selector failure
   */
  recordFailure(selector) {
    const count = this.failureCount.get(selector) || 0;
    this.failureCount.set(selector, count + 1);
  }

  /**
   * Get selector history stats
   */
  getStats() {
    return {
      learnedElements: this.selectorHistory.size,
      failedSelectors: this.failureCount.size,
      history: Array.from(this.selectorHistory.entries()).map(([element, selectors]) => ({
        element,
        selectors,
        count: selectors.length
      }))
    };
  }

  /**
   * Clear learning history
   */
  clearHistory() {
    this.selectorHistory.clear();
    this.failureCount.clear();
  }

  /**
   * Export learned selectors
   */
  export() {
    return {
      selectorHistory: Array.from(this.selectorHistory.entries()),
      failureCount: Array.from(this.failureCount.entries()),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import learned selectors
   */
  import(data) {
    if (data.selectorHistory) {
      this.selectorHistory = new Map(data.selectorHistory);
    }
    if (data.failureCount) {
      this.failureCount = new Map(data.failureCount);
    }
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelfHealingSelectors;
}
if (typeof window !== 'undefined') {
  window.SelfHealingSelectors = SelfHealingSelectors;
}
