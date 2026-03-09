/**
 * Browser Automation Agent - Phase 1
 * Provides browser control capabilities using Playwright
 */

import { chromium, Browser, Page, BrowserContext } from "playwright";
import { logger } from "../../../utils/logger";

export interface BrowserAgentConfig {
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
  viewport?: { width: number; height: number };
}

export interface NavigateParams {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
}

export interface ClickParams {
  selector: string;
  timeout?: number;
}

export interface TypeParams {
  selector: string;
  text: string;
  delay?: number;
}

export interface ScreenshotParams {
  path?: string;
  fullPage?: boolean;
}

export class BrowserAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BrowserAgentConfig;

  constructor(config: BrowserAgentConfig = {}) {
    this.config = {
      headless: config.headless !== false,
      timeout: config.timeout || 30000,
      viewport: config.viewport || { width: 1280, height: 720 },
      ...config,
    };
  }

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });

      this.context = await this.browser.newContext({
        viewport: this.config.viewport,
        userAgent: this.config.userAgent,
      });

      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(this.config.timeout!);

      logger.info("Browser agent initialized", {
        headless: this.config.headless,
        viewport: this.config.viewport,
      });
    } catch (error) {
      logger.error("Failed to initialize browser agent", { error });
      throw error;
    }
  }

  /**
   * Navigate to URL
   */
  async navigate(params: NavigateParams): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      await this.page.goto(params.url, {
        waitUntil: params.waitUntil || "load",
      });
      logger.info("Navigated to URL", { url: params.url });
    } catch (error) {
      logger.error("Navigation failed", { url: params.url, error });
      throw error;
    }
  }

  /**
   * Click element
   */
  async click(params: ClickParams): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      await this.page.click(params.selector, {
        timeout: params.timeout || this.config.timeout,
      });
      logger.info("Clicked element", { selector: params.selector });
    } catch (error) {
      logger.error("Click failed", { selector: params.selector, error });
      throw error;
    }
  }

  /**
   * Type text into element
   */
  async type(params: TypeParams): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      await this.page.fill(params.selector, params.text);
      logger.info("Typed text", { selector: params.selector });
    } catch (error) {
      logger.error("Type failed", { selector: params.selector, error });
      throw error;
    }
  }

  /**
   * Get page content
   */
  async getContent(): Promise<string> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    return await this.page.content();
  }

  /**
   * Extract text from element
   */
  async getText(selector: string): Promise<string | null> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      const element = await this.page.$(selector);
      if (element) {
        return await element.textContent();
      }
      return null;
    } catch (error) {
      logger.error("Get text failed", { selector, error });
      return null;
    }
  }

  /**
   * Take screenshot
   */
  async screenshot(params: ScreenshotParams = {}): Promise<Buffer> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    return await this.page.screenshot({
      path: params.path,
      fullPage: params.fullPage || false,
    });
  }

  /**
   * Wait for selector
   */
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    await this.page.waitForSelector(selector, {
      timeout: timeout || this.config.timeout,
    });
  }

  /**
   * Evaluate JavaScript in page context
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    return await this.page.evaluate(fn);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    return this.page.url();
  }

  /**
   * Close browser
   */
  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      logger.info("Browser agent cleaned up");
    } catch (error) {
      logger.error("Cleanup failed", { error });
      throw error;
    }
  }
}
