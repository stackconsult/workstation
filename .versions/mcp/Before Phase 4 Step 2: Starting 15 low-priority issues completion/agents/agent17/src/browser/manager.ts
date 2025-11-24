// Browser Manager for Agent #17
// Manages Playwright browser instances with pooling and lifecycle management

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { log } from '../utils/logger.js';

export interface BrowserConfig {
  headless?: boolean;
  maxPages?: number;
  timeout?: number;
  userAgent?: string;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Page[] = [];
  private config: BrowserConfig;

  constructor(config: BrowserConfig = {}) {
    this.config = {
      headless: true,
      maxPages: 5,
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      log('info', 'Browser already initialized');
      return;
    }

    try {
      log('info', 'Initializing browser', { headless: this.config.headless });
      
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      this.context = await this.browser.newContext({
        userAgent: this.config.userAgent || 
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
      });

      log('info', 'Browser initialized successfully');
    } catch (error) {
      log('error', 'Failed to initialize browser', { error });
      throw error;
    }
  }

  /**
   * Get a page from the pool or create a new one
   */
  async getPage(): Promise<Page> {
    if (!this.browser || !this.context) {
      await this.initialize();
    }

    // Reuse existing page if available
    if (this.pages.length > 0) {
      const page = this.pages.pop()!;
      log('info', 'Reusing existing page');
      return page;
    }

    // Create new page if under limit
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const page = await this.context.newPage();
    page.setDefaultTimeout(this.config.timeout!);
    
    log('info', 'Created new page');
    return page;
  }

  /**
   * Return a page to the pool
   */
  async releasePage(page: Page): Promise<void> {
    if (this.pages.length < this.config.maxPages!) {
      // Clear page state before returning to pool
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      this.pages.push(page);
      log('info', 'Page returned to pool');
    } else {
      await page.close();
      log('info', 'Page closed (pool full)');
    }
  }

  /**
   * Execute a search using the browser
   */
  async search(query: string, searchEngine: 'google' | 'bing' | 'duckduckgo' = 'google'): Promise<SearchResult[]> {
    const page = await this.getPage();
    
    try {
      log('info', 'Performing search', { query, searchEngine });
      
      const searchUrls = {
        google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
        duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      };

      await page.goto(searchUrls[searchEngine], { waitUntil: 'networkidle', timeout: 30000 });
      
      // Extract search results based on engine
      const results = await this.extractSearchResults(page, searchEngine);
      
      log('info', 'Search completed', { resultCount: results.length });
      return results;
    } finally {
      await this.releasePage(page);
    }
  }

  /**
   * Extract search results from the page
   */
  private async extractSearchResults(page: Page, searchEngine: string): Promise<SearchResult[]> {
    const selectors = {
      google: {
        container: 'div.g',
        title: 'h3',
        link: 'a',
        snippet: 'div.VwiC3b',
      },
      bing: {
        container: 'li.b_algo',
        title: 'h2',
        link: 'a',
        snippet: 'p',
      },
      duckduckgo: {
        container: 'article[data-testid="result"]',
        title: 'h2',
        link: 'a',
        snippet: 'div[data-result="snippet"]',
      },
    };

    const selector = selectors[searchEngine as keyof typeof selectors];
    
    return await page.evaluate((sel) => {
      const results: SearchResult[] = [];
      const containers = document.querySelectorAll(sel.container);
      
      containers.forEach((container, index) => {
        if (index >= 10) return; // Limit to top 10 results
        
        const titleEl = container.querySelector(sel.title);
        const linkEl = container.querySelector(sel.link);
        const snippetEl = container.querySelector(sel.snippet);
        
        if (titleEl && linkEl) {
          results.push({
            title: titleEl.textContent?.trim() || '',
            url: (linkEl as HTMLAnchorElement).href || '',
            snippet: snippetEl?.textContent?.trim() || '',
            position: index + 1,
          });
        }
      });
      
      return results;
    }, selector);
  }

  /**
   * Navigate to a URL and wait for page load
   */
  async navigate(url: string): Promise<Page> {
    const page = await this.getPage();
    
    try {
      log('info', 'Navigating to URL', { url });
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      return page;
    } catch (error) {
      await this.releasePage(page);
      throw error;
    }
  }

  /**
   * Take a screenshot of the current page
   */
  async screenshot(page: Page, options?: { fullPage?: boolean; path?: string }): Promise<Buffer> {
    log('info', 'Taking screenshot', options);
    return await page.screenshot({
      fullPage: options?.fullPage ?? false,
      path: options?.path,
    });
  }

  /**
   * Close all pages and browser
   */
  async close(): Promise<void> {
    log('info', 'Closing browser');
    
    // Close all pages in pool
    await Promise.all(this.pages.map(page => page.close()));
    this.pages = [];
    
    // Close context and browser
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    log('info', 'Browser closed successfully');
  }
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}
