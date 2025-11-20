/**
 * Self-Healing Selectors System
 * Production-grade selector strategies with automatic fallback and learning
 */

export class SelfHealingSelectors {
  constructor() {
    // Selector strategy priority order
    this.strategies = [
      this.byTestId.bind(this),
      this.byRole.bind(this),
      this.byText.bind(this),
      this.byLabel.bind(this),
      this.byPlaceholder.bind(this),
      this.byCss.bind(this),
      this.byXPath.bind(this),
      this.byAlternativePaths.bind(this)
    ];

    // Track successful selectors for learning
    this.selectorHistory = new Map();
    this.successfulAlternatives = new Map();
  }

  /**
   * Find element with self-healing capabilities
   * @param {string} selector - Primary selector to try
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Element and working selector
   */
  async findElement(selector, options = {}) {
    const {
      timeout = 30000,
      retryCount = 0,
      context = 'page'
    } = options;

    const startTime = Date.now();

    // Try primary selector first
    try {
      const element = document.querySelector(selector);
      if (element && this.isElementActionable(element)) {
        this.recordSuccess(selector, 'primary');
        return { selector, element, strategy: 'primary' };
      }
    } catch (e) {
      console.warn(`Primary selector failed: ${selector}`, e);
    }

    // Check if we have a known successful alternative
    const knownAlternative = this.successfulAlternatives.get(selector);
    if (knownAlternative) {
      try {
        const element = document.querySelector(knownAlternative);
        if (element && this.isElementActionable(element)) {
          this.recordSuccess(knownAlternative, 'known-alternative');
          return { selector: knownAlternative, element, strategy: 'known-alternative' };
        }
      } catch (e) {
        // Known alternative failed, continue to other strategies
      }
    }

    // Try alternative strategies
    while (Date.now() - startTime < timeout) {
      for (const strategy of this.strategies) {
        try {
          const result = await strategy(selector, options);
          if (result && result.element && this.isElementActionable(result.element)) {
            // Record this successful alternative
            this.recordSuccessfulAlternative(selector, result.selector, result.strategy);
            return result;
          }
        } catch (e) {
          // Strategy failed, try next
          continue;
        }
      }

      // Wait briefly before retrying
      await this.sleep(100);
    }

    throw new Error(`Element not found with any strategy within ${timeout}ms: ${selector}`);
  }

  /**
   * Strategy 1: Find by data-testid
   */
  async byTestId(originalSelector, options) {
    // Extract testid from original selector if present
    const testIdMatch = originalSelector.match(/\[data-testid=['"]([^'"]+)['"]\]/);
    if (testIdMatch) {
      const testId = testIdMatch[1];
      const selector = `[data-testid="${testId}"]`;
      const element = document.querySelector(selector);
      if (element) {
        return { selector, element, strategy: 'testid' };
      }
    }

    // Try finding elements with data-testid
    const elements = document.querySelectorAll('[data-testid]');
    for (const element of elements) {
      const testId = element.getAttribute('data-testid');
      if (originalSelector.includes(testId)) {
        return { selector: `[data-testid="${testId}"]`, element, strategy: 'testid' };
      }
    }

    return null;
  }

  /**
   * Strategy 2: Find by ARIA role
   */
  async byRole(originalSelector, options) {
    // Extract role from original selector
    const roleMatch = originalSelector.match(/\[role=['"]([^'"]+)['"]\]/);
    if (roleMatch) {
      const role = roleMatch[1];
      const elements = document.querySelectorAll(`[role="${role}"]`);
      
      // Try to find the most specific match
      for (const element of elements) {
        if (this.matchesContext(element, originalSelector)) {
          return { selector: `[role="${role}"]`, element, strategy: 'role' };
        }
      }
    }

    // Try common interactive roles
    const commonRoles = ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox'];
    for (const role of commonRoles) {
      const elements = document.querySelectorAll(`[role="${role}"]`);
      for (const element of elements) {
        if (this.matchesContext(element, originalSelector)) {
          return { selector: `[role="${role}"]`, element, strategy: 'role' };
        }
      }
    }

    return null;
  }

  /**
   * Strategy 3: Find by text content
   */
  async byText(originalSelector, options) {
    // Extract text from original selector
    const textMatch = originalSelector.match(/:has-text\("([^"]+)"\)/);
    const text = textMatch ? textMatch[1] : null;

    if (text) {
      const elements = document.querySelectorAll('*');
      for (const element of elements) {
        if (element.textContent && element.textContent.trim().includes(text)) {
          // Prefer elements with exact match
          if (element.textContent.trim() === text) {
            const selector = this.generateTextSelector(element, text);
            return { selector, element, strategy: 'text-exact' };
          }
        }
      }

      // Partial match
      for (const element of elements) {
        if (element.textContent && element.textContent.includes(text)) {
          const selector = this.generateTextSelector(element, text);
          return { selector, element, strategy: 'text-partial' };
        }
      }
    }

    return null;
  }

  /**
   * Strategy 4: Find by label
   */
  async byLabel(originalSelector, options) {
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      const forAttr = label.getAttribute('for');
      if (forAttr) {
        const element = document.getElementById(forAttr);
        if (element && this.matchesContext(element, originalSelector)) {
          return { selector: `#${forAttr}`, element, strategy: 'label' };
        }
      }

      // Check nested inputs
      const input = label.querySelector('input, textarea, select');
      if (input && this.matchesContext(input, originalSelector)) {
        const selector = this.generateSelector(input);
        return { selector, element: input, strategy: 'label-nested' };
      }
    }

    return null;
  }

  /**
   * Strategy 5: Find by placeholder
   */
  async byPlaceholder(originalSelector, options) {
    const placeholderMatch = originalSelector.match(/\[placeholder=['"]([^'"]+)['"]\]/);
    if (placeholderMatch) {
      const placeholder = placeholderMatch[1];
      const element = document.querySelector(`[placeholder="${placeholder}"]`);
      if (element) {
        return { selector: `[placeholder="${placeholder}"]`, element, strategy: 'placeholder' };
      }
    }

    return null;
  }

  /**
   * Strategy 6: Find by CSS selector variations
   */
  async byCss(originalSelector, options) {
    // Try variations of the CSS selector
    const variations = this.generateCssVariations(originalSelector);
    
    for (const variation of variations) {
      try {
        const element = document.querySelector(variation);
        if (element) {
          return { selector: variation, element, strategy: 'css-variation' };
        }
      } catch (e) {
        // Invalid selector, skip
        continue;
      }
    }

    return null;
  }

  /**
   * Strategy 7: Find by XPath
   */
  async byXPath(originalSelector, options) {
    // Convert CSS selector to XPath
    const xpath = this.cssToXPath(originalSelector);
    
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      
      if (result.singleNodeValue) {
        return {
          selector: xpath,
          element: result.singleNodeValue,
          strategy: 'xpath'
        };
      }
    } catch (e) {
      // XPath evaluation failed
    }

    return null;
  }

  /**
   * Strategy 8: Find by alternative paths (siblings, parents, children)
   */
  async byAlternativePaths(originalSelector, options) {
    // Try to find nearby elements and navigate to target
    const elements = document.querySelectorAll('*');
    
    for (const element of elements) {
      // Check if element has attributes that match original selector
      if (this.hasMatchingAttributes(element, originalSelector)) {
        const selector = this.generateSelector(element);
        return { selector, element, strategy: 'alternative-path' };
      }
    }

    return null;
  }

  /**
   * Check if element is actionable (visible and enabled)
   */
  isElementActionable(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility === 'visible' &&
      style.display !== 'none' &&
      !element.disabled
    );
  }

  /**
   * Check if element matches context from original selector
   */
  matchesContext(element, originalSelector) {
    // Extract tag name from original selector
    const tagMatch = originalSelector.match(/^([a-z]+)/i);
    if (tagMatch) {
      const expectedTag = tagMatch[1].toLowerCase();
      if (element.tagName.toLowerCase() !== expectedTag) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate text-based selector
   */
  generateTextSelector(element, text) {
    const tagName = element.tagName.toLowerCase();
    return `${tagName}:has-text("${text}")`;
  }

  /**
   * Generate CSS selector for element
   */
  generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.getAttribute('data-testid')) {
      return `[data-testid="${element.getAttribute('data-testid')}"]`;
    }

    if (element.name) {
      return `[name="${element.name}"]`;
    }

    // Generate path-based selector
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }

      const siblings = Array.from(current.parentElement?.children || []);
      const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
      
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Generate CSS selector variations
   */
  generateCssVariations(selector) {
    const variations = [selector];

    // Remove :nth-child variations
    variations.push(selector.replace(/:nth-child\(\d+\)/g, ''));
    
    // Remove :nth-of-type variations
    variations.push(selector.replace(/:nth-of-type\(\d+\)/g, ''));
    
    // Try without class combinations
    const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/g);
    if (classMatch && classMatch.length > 1) {
      variations.push(classMatch[0]); // First class only
    }

    // Try with just the last part of the path
    const parts = selector.split('>');
    if (parts.length > 1) {
      variations.push(parts[parts.length - 1].trim());
    }

    return [...new Set(variations)]; // Remove duplicates
  }

  /**
   * Convert CSS selector to XPath (basic conversion)
   */
  cssToXPath(selector) {
    let xpath = selector;

    // Simple conversions
    xpath = xpath.replace(/#([a-zA-Z0-9_-]+)/g, "[@id='$1']");
    xpath = xpath.replace(/\.([a-zA-Z0-9_-]+)/g, "[contains(@class,'$1')]");
    xpath = xpath.replace(/\[([a-zA-Z0-9_-]+)='([^']+)'\]/g, "[@$1='$2']");

    // Prepend // if not present
    if (!xpath.startsWith('/')) {
      xpath = '//' + xpath;
    }

    return xpath;
  }

  /**
   * Check if element has attributes matching original selector
   */
  hasMatchingAttributes(element, originalSelector) {
    // Check for id match
    const idMatch = originalSelector.match(/#([a-zA-Z0-9_-]+)/);
    if (idMatch && element.id === idMatch[1]) {
      return true;
    }

    // Check for class match
    const classMatch = originalSelector.match(/\.([a-zA-Z0-9_-]+)/);
    if (classMatch && element.classList.contains(classMatch[1])) {
      return true;
    }

    // Check for attribute match
    const attrMatch = originalSelector.match(/\[([a-zA-Z0-9_-]+)=['"]([^'"]+)['"]\]/);
    if (attrMatch && element.getAttribute(attrMatch[1]) === attrMatch[2]) {
      return true;
    }

    return false;
  }

  /**
   * Record successful selector usage
   */
  recordSuccess(selector, strategy) {
    const key = `${selector}:${strategy}`;
    const history = this.selectorHistory.get(key) || { count: 0, lastUsed: 0 };
    history.count++;
    history.lastUsed = Date.now();
    this.selectorHistory.set(key, history);
  }

  /**
   * Record successful alternative selector
   */
  recordSuccessfulAlternative(originalSelector, alternativeSelector, strategy) {
    this.successfulAlternatives.set(originalSelector, alternativeSelector);
    console.log(`✅ Self-healing: Found alternative for "${originalSelector}" using ${strategy}: "${alternativeSelector}"`);
  }

  /**
   * Get selector statistics
   */
  getStatistics() {
    return {
      totalSelectors: this.selectorHistory.size,
      alternatives: this.successfulAlternatives.size,
      history: Array.from(this.selectorHistory.entries()).map(([key, data]) => ({
        selector: key,
        count: data.count,
        lastUsed: new Date(data.lastUsed).toISOString()
      }))
    };
  }

  /**
   * Clear learning history
   */
  clearHistory() {
    this.selectorHistory.clear();
    this.successfulAlternatives.clear();
    console.log('🧹 Self-healing selector history cleared');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
