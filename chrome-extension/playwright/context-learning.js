/**
 * Agentic Context Learning System
 * Learn from workflow executions to improve selector reliability
 */

export class AgenticContextLearner {
  constructor() {
    this.contextPatterns = new Map();
    this.selectorSuccess = new Map();
    this.selectorFailures = new Map();
    this.pageStructures = new Map();
  }

  /**
   * Initialize from storage
   */
  async initialize() {
    await this.loadFromStorage();
    this.setupListeners();
    return this;
  }

  /**
   * Setup message listeners
   */
  setupListeners() {
    // Listen for workflow results
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'WORKFLOW_SUCCESS') {
          this.learnFromSuccess(request.workflow, request.tabId, request.result);
          sendResponse({ success: true });
        }
        
        if (request.type === 'WORKFLOW_FAILURE') {
          this.learnFromFailure(request.workflow, request.error, request.tabId);
          sendResponse({ success: true });
        }
        
        if (request.type === 'GET_BEST_SELECTOR') {
          const bestSelector = this.getBestSelector(request.task, request.pageContext);
          sendResponse({ selector: bestSelector });
        }
        
        if (request.type === 'GET_ALTERNATIVE_SELECTORS') {
          const alternatives = this.getAlternativeSelectors(request.task, request.pageContext);
          sendResponse({ selectors: alternatives });
        }
      });
    }
  }

  /**
   * Learn from successful workflow execution
   */
  async learnFromSuccess(workflow, tabId, result) {
    try {
      const pageContext = await this.getPageContext();

      workflow.definition?.tasks?.forEach((task, index) => {
        const patternKey = this.getPatternKey(task, pageContext);
        let pattern = this.contextPatterns.get(patternKey);

        if (!pattern) {
          pattern = {
            task: {
              action: task.action,
              selector: task.parameters?.selector
            },
            pageContext: {
              domain: pageContext.domain,
              pathPattern: pageContext.pathPattern
            },
            successCount: 1,
            failureCount: 0,
            lastSuccess: Date.now(),
            selectors: new Map()
          };
        } else {
          pattern.successCount++;
          pattern.lastSuccess = Date.now();
        }

        // Record selector success
        if (task.parameters?.selector) {
          const selector = task.parameters.selector;
          const selectorStats = pattern.selectors.get(selector) || {
            count: 0,
            successCount: 0,
            failureCount: 0,
            lastSuccess: 0,
            lastFailure: 0
          };

          selectorStats.successCount++;
          selectorStats.count++;
          selectorStats.lastSuccess = Date.now();
          pattern.selectors.set(selector, selectorStats);

          // Global selector tracking
          const globalKey = `${pageContext.domain}:${selector}`;
          this.selectorSuccess.set(globalKey, (this.selectorSuccess.get(globalKey) || 0) + 1);
        }

        this.contextPatterns.set(patternKey, pattern);
      });

      // Save to storage periodically
      await this.saveToStorage();

      console.log(`✅ Learned from successful workflow on ${pageContext.domain}`);
    } catch (error) {
      console.error('Failed to learn from success:', error);
    }
  }

  /**
   * Learn from failed workflow execution
   */
  async learnFromFailure(workflow, error, tabId) {
    try {
      const pageContext = await this.getPageContext();

      workflow.definition?.tasks?.forEach((task, index) => {
        const patternKey = this.getPatternKey(task, pageContext);
        let pattern = this.contextPatterns.get(patternKey);

        if (!pattern) {
          pattern = {
            task: {
              action: task.action,
              selector: task.parameters?.selector
            },
            pageContext: {
              domain: pageContext.domain,
              pathPattern: pageContext.pathPattern
            },
            successCount: 0,
            failureCount: 1,
            lastFailure: Date.now(),
            selectors: new Map()
          };
        } else {
          pattern.failureCount++;
          pattern.lastFailure = Date.now();
        }

        // Record selector failure
        if (task.parameters?.selector) {
          const selector = task.parameters.selector;
          const selectorStats = pattern.selectors.get(selector) || {
            count: 0,
            successCount: 0,
            failureCount: 0,
            lastSuccess: 0,
            lastFailure: 0
          };

          selectorStats.failureCount++;
          selectorStats.count++;
          selectorStats.lastFailure = Date.now();
          pattern.selectors.set(selector, selectorStats);

          // Global selector tracking
          const globalKey = `${pageContext.domain}:${selector}`;
          this.selectorFailures.set(globalKey, (this.selectorFailures.get(globalKey) || 0) + 1);
        }

        this.contextPatterns.set(patternKey, pattern);
      });

      // Save to storage
      await this.saveToStorage();

      console.log(`📊 Learned from failed workflow on ${pageContext.domain}`);
    } catch (error) {
      console.error('Failed to learn from failure:', error);
    }
  }

  /**
   * Get pattern key for task and context
   */
  getPatternKey(task, pageContext) {
    return `${task.action}:${pageContext.domain}:${pageContext.pathPattern}`;
  }

  /**
   * Get current page context
   */
  async getPageContext() {
    const url = window.location;
    
    // Extract path pattern (replace IDs with placeholders)
    const pathPattern = url.pathname
      .replace(/\d+/g, '{id}')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');

    // Get page structure
    const structure = {
      buttonCount: document.querySelectorAll('button').length,
      inputCount: document.querySelectorAll('input').length,
      formCount: document.querySelectorAll('form').length,
      linkCount: document.querySelectorAll('a').length
    };

    const context = {
      url: url.href,
      domain: url.hostname,
      path: url.pathname,
      pathPattern,
      structure,
      timestamp: Date.now()
    };

    // Cache page structure
    this.pageStructures.set(url.href, context);

    return context;
  }

  /**
   * Get best selector for task based on learning
   */
  getBestSelector(task, pageContext) {
    const patternKey = this.getPatternKey(task, pageContext);
    const pattern = this.contextPatterns.get(patternKey);

    if (!pattern || pattern.selectors.size === 0) {
      return task.parameters?.selector || null;
    }

    // Find selector with highest success rate
    let bestSelector = null;
    let bestSuccessRate = -1;

    for (const [selector, stats] of pattern.selectors.entries()) {
      if (stats.count === 0) continue;
      
      const successRate = stats.successCount / stats.count;
      
      // Prefer recent successes
      const recencyBonus = (Date.now() - stats.lastSuccess) < 86400000 ? 0.1 : 0; // 24 hours
      const adjustedRate = successRate + recencyBonus;

      if (adjustedRate > bestSuccessRate) {
        bestSuccessRate = adjustedRate;
        bestSelector = selector;
      }
    }

    return bestSelector || task.parameters?.selector || null;
  }

  /**
   * Get alternative selectors sorted by success rate
   */
  getAlternativeSelectors(task, pageContext) {
    const patternKey = this.getPatternKey(task, pageContext);
    const pattern = this.contextPatterns.get(patternKey);

    if (!pattern || pattern.selectors.size === 0) {
      return [];
    }

    // Sort selectors by success rate
    return Array.from(pattern.selectors.entries())
      .filter(([_, stats]) => stats.count > 0)
      .sort((a, b) => {
        const successRateA = a[1].successCount / a[1].count;
        const successRateB = b[1].successCount / b[1].count;
        
        // Apply recency bonus
        const recencyBonusA = (Date.now() - a[1].lastSuccess) < 86400000 ? 0.1 : 0;
        const recencyBonusB = (Date.now() - b[1].lastSuccess) < 86400000 ? 0.1 : 0;
        
        return (successRateB + recencyBonusB) - (successRateA + recencyBonusA);
      })
      .map(([selector]) => selector);
  }

  /**
   * Get selector statistics
   */
  getSelectorStatistics(selector, pageContext) {
    const globalKey = `${pageContext.domain}:${selector}`;
    
    return {
      selector,
      domain: pageContext.domain,
      successCount: this.selectorSuccess.get(globalKey) || 0,
      failureCount: this.selectorFailures.get(globalKey) || 0,
      successRate: this.calculateSuccessRate(globalKey)
    };
  }

  /**
   * Calculate success rate for selector
   */
  calculateSuccessRate(globalKey) {
    const successCount = this.selectorSuccess.get(globalKey) || 0;
    const failureCount = this.selectorFailures.get(globalKey) || 0;
    const totalCount = successCount + failureCount;

    if (totalCount === 0) return 0;
    return successCount / totalCount;
  }

  /**
   * Get learning statistics
   */
  getStatistics() {
    const patterns = Array.from(this.contextPatterns.values());
    
    const totalSuccesses = patterns.reduce((sum, p) => sum + p.successCount, 0);
    const totalFailures = patterns.reduce((sum, p) => sum + p.failureCount, 0);
    
    const domainStats = new Map();
    for (const pattern of patterns) {
      const domain = pattern.pageContext.domain;
      const stats = domainStats.get(domain) || {
        domain,
        patterns: 0,
        successes: 0,
        failures: 0
      };
      
      stats.patterns++;
      stats.successes += pattern.successCount;
      stats.failures += pattern.failureCount;
      domainStats.set(domain, stats);
    }

    return {
      totalPatterns: this.contextPatterns.size,
      totalSuccesses,
      totalFailures,
      overallSuccessRate: totalSuccesses / (totalSuccesses + totalFailures) || 0,
      domainStats: Array.from(domainStats.values()),
      uniqueSelectors: this.selectorSuccess.size
    };
  }

  /**
   * Save to Chrome storage
   */
  async saveToStorage() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return; // Not in Chrome extension context
    }

    const patternsObj = {};
    
    for (const [key, value] of this.contextPatterns) {
      const pattern = { ...value };
      
      // Convert Maps to objects
      if (pattern.selectors instanceof Map) {
        pattern.selectors = Object.fromEntries(pattern.selectors);
      }
      
      patternsObj[key] = pattern;
    }

    const data = {
      contextPatterns: patternsObj,
      selectorSuccess: Object.fromEntries(this.selectorSuccess),
      selectorFailures: Object.fromEntries(this.selectorFailures),
      lastSaved: Date.now()
    };

    return new Promise((resolve) => {
      chrome.storage.local.set({ agenticContextLearning: data }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to save context learning:', chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }

  /**
   * Load from Chrome storage
   */
  async loadFromStorage() {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return; // Not in Chrome extension context
    }

    return new Promise((resolve) => {
      chrome.storage.local.get('agenticContextLearning', (result) => {
        if (result.agenticContextLearning) {
          const data = result.agenticContextLearning;
          
          // Restore context patterns
          this.contextPatterns = new Map();
          for (const [key, value] of Object.entries(data.contextPatterns || {})) {
            const pattern = { ...value };
            
            // Convert objects back to Maps
            if (pattern.selectors && typeof pattern.selectors === 'object') {
              pattern.selectors = new Map(Object.entries(pattern.selectors));
            }
            
            this.contextPatterns.set(key, pattern);
          }
          
          // Restore selector stats
          this.selectorSuccess = new Map(Object.entries(data.selectorSuccess || {}));
          this.selectorFailures = new Map(Object.entries(data.selectorFailures || {}));
          
          console.log(`📚 Loaded ${this.contextPatterns.size} learned patterns`);
        }
        
        resolve();
      });
    });
  }

  /**
   * Clear all learning data
   */
  clearLearning() {
    this.contextPatterns.clear();
    this.selectorSuccess.clear();
    this.selectorFailures.clear();
    this.pageStructures.clear();
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove('agenticContextLearning');
    }
    
    console.log('🧹 All learning data cleared');
  }

  /**
   * Export learning data
   */
  exportData() {
    const data = {
      contextPatterns: Object.fromEntries(
        Array.from(this.contextPatterns.entries()).map(([key, value]) => {
          const pattern = { ...value };
          if (pattern.selectors instanceof Map) {
            pattern.selectors = Object.fromEntries(pattern.selectors);
          }
          return [key, pattern];
        })
      ),
      selectorSuccess: Object.fromEntries(this.selectorSuccess),
      selectorFailures: Object.fromEntries(this.selectorFailures),
      exportedAt: Date.now()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import learning data
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      // Import context patterns
      this.contextPatterns = new Map();
      for (const [key, value] of Object.entries(data.contextPatterns || {})) {
        const pattern = { ...value };
        if (pattern.selectors && typeof pattern.selectors === 'object') {
          pattern.selectors = new Map(Object.entries(pattern.selectors));
        }
        this.contextPatterns.set(key, pattern);
      }
      
      // Import selector stats
      this.selectorSuccess = new Map(Object.entries(data.selectorSuccess || {}));
      this.selectorFailures = new Map(Object.entries(data.selectorFailures || {}));
      
      // Save to storage
      this.saveToStorage();
      
      console.log('📥 Learning data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import learning data:', error);
      return false;
    }
  }
}
