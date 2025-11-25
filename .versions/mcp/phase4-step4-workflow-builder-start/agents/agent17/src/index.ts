// Main entry point for Agent #17
// AI-Powered Project Builder with Browser Automation Capabilities

import { BrowserManager } from './browser/manager.js';
import { clickElement } from './tools/click-element.js';
import { fillForm } from './tools/fill-form.js';
import { search, multiSearch } from './tools/search.js';
import { extractData, extractWithFallback } from './tools/extract-data.js';
import { log, setLogLevel } from './utils/logger.js';
import type { 
  ClickElementInput, 
  FillFormInput, 
  SearchInput, 
  ExtractDataInput,
  ToolResult 
} from './types/index.js';

export class Agent17 {
  private browserManager: BrowserManager;
  private initialized: boolean = false;

  constructor(config?: { headless?: boolean; logLevel?: 'info' | 'warn' | 'error' | 'debug' }) {
    this.browserManager = new BrowserManager({
      headless: config?.headless ?? true,
    });
    
    if (config?.logLevel) {
      setLogLevel(config.logLevel);
    }
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      log('info', 'Agent already initialized');
      return;
    }

    log('info', 'Initializing Agent #17');
    await this.browserManager.initialize();
    this.initialized = true;
    log('info', 'Agent #17 ready');
  }

  /**
   * Perform a web search
   */
  async search(input: SearchInput): Promise<ToolResult> {
    await this.ensureInitialized();
    return await search(this.browserManager, input);
  }

  /**
   * Search across multiple engines
   */
  async multiSearch(query: string, engines?: Array<'google' | 'bing' | 'duckduckgo'>): Promise<ToolResult> {
    await this.ensureInitialized();
    return await multiSearch(this.browserManager, query, engines);
  }

  /**
   * Click an element on a web page
   */
  async clickElement(input: ClickElementInput): Promise<ToolResult> {
    await this.ensureInitialized();
    return await clickElement(this.browserManager, input);
  }

  /**
   * Fill out a form on a web page
   */
  async fillForm(input: FillFormInput): Promise<ToolResult> {
    await this.ensureInitialized();
    return await fillForm(this.browserManager, input);
  }

  /**
   * Extract data from a web page
   */
  async extractData(input: ExtractDataInput): Promise<ToolResult> {
    await this.ensureInitialized();
    return await extractData(this.browserManager, input);
  }

  /**
   * Extract data with fallback selectors
   */
  async extractWithFallback(url: string, selectorStrategies: Record<string, string[]>): Promise<ToolResult> {
    await this.ensureInitialized();
    return await extractWithFallback(this.browserManager, url, selectorStrategies);
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<{ success: boolean; url: string; title: string }> {
    await this.ensureInitialized();
    const page = await this.browserManager.navigate(url);
    const title = await page.title();
    await this.browserManager.releasePage(page);
    
    return {
      success: true,
      url: page.url(),
      title,
    };
  }

  /**
   * Take a screenshot
   */
  async screenshot(url: string, options?: { fullPage?: boolean; path?: string }): Promise<Buffer> {
    await this.ensureInitialized();
    const page = await this.browserManager.navigate(url);
    const screenshot = await this.browserManager.screenshot(page, options);
    await this.browserManager.releasePage(page);
    return screenshot;
  }

  /**
   * Close the agent and cleanup resources
   */
  async close(): Promise<void> {
    log('info', 'Closing Agent #17');
    await this.browserManager.close();
    this.initialized = false;
    log('info', 'Agent #17 closed');
  }

  /**
   * Ensure agent is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Export all types and utilities
export * from './types/index.js';
export { log, setLogLevel, createLogger } from './utils/logger.js';
export { withRetry, retryUntil } from './utils/retry.js';

// Default export
export default Agent17;
