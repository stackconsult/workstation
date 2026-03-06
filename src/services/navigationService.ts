/**
 * Navigation Service - TypeScript Integration Layer for Agent 2
 *
 * This service communicates with the Go backend (Agent 2) running on port 11434
 * to perform browser automation tasks including navigation, data extraction,
 * and element interaction.
 *
 * @module navigationService
 */

import axios from "axios";

/**
 * Configuration for the Go backend connection
 */
interface NavigationServiceConfig {
  baseURL?: string;
  timeout?: number;
}

/**
 * Request structure for navigation operations
 */
export interface NavigationRequest {
  url: string;
  selectors?: string[];
  timeout?: number;
}

/**
 * Request structure for data extraction
 */
export interface ExtractionRequest {
  url: string;
  selectors: Record<string, string>;
  timeout?: number;
}

/**
 * Request structure for click operations
 */
export interface ClickRequest {
  url: string;
  selector: string;
  fallbackSelectors?: string[];
  timeout?: number;
}

/**
 * Request structure for screenshot capture
 */
export interface ScreenshotRequest {
  url: string;
  selector?: string;
  fullPage?: boolean;
  timeout?: number;
}

/**
 * Response from navigation operations
 */
interface NavigationResponse {
  success: boolean;
  message: string;
  url: string;
}

/**
 * Response from data extraction
 */
interface ExtractionResponse {
  success: boolean;
  data: Record<string, string>;
}

/**
 * Response from click operations
 */
interface ClickResponse {
  success: boolean;
  message: string;
}

/**
 * Response from screenshot operations
 */
interface ScreenshotResponse {
  success: boolean;
  image: string; // Base64 encoded
}

/**
 * Health check response
 */
interface HealthResponse {
  status: string;
  service: string;
  agent: number;
  port: string;
}

/**
 * NavigationService - Interface to Agent 2 Go Backend
 *
 * Provides TypeScript methods to interact with the Go-based browser automation
 * service, including intelligent navigation, data extraction, and element interaction.
 *
 * @example
 * ```typescript
 * const navService = new NavigationService();
 *
 * // Check if backend is healthy
 * const isHealthy = await navService.healthCheck();
 *
 * // Navigate to a URL
 * await navService.navigate({
 *   url: 'https://example.com',
 *   selectors: ['h1', 'body'],
 *   timeout: 30
 * });
 *
 * // Extract data
 * const data = await navService.extractData({
 *   url: 'https://example.com',
 *   selectors: {
 *     title: 'h1',
 *     description: 'meta[name="description"]'
 *   }
 * });
 * ```
 */
export class NavigationService {
  private client: ReturnType<typeof axios.create>;
  private readonly defaultTimeout: number = 30000; // 30 seconds

  /**
   * Creates a new NavigationService instance
   *
   * @param config - Optional configuration for backend connection
   */
  constructor(config: NavigationServiceConfig = {}) {
    const baseURL =
      config.baseURL || process.env.GO_BACKEND_URL || "http://localhost:11434";
    const timeout = config.timeout || this.defaultTimeout;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Check if the Go backend (Agent 2) is healthy and reachable
   *
   * @returns Promise<boolean> - True if backend is healthy
   *
   * @example
   * ```typescript
   * const isHealthy = await navService.healthCheck();
   * if (!isHealthy) {
   *   console.error('Agent 2 backend is not responding');
   * }
   * ```
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get<HealthResponse>("/health");
      return response.data.status === "healthy" && response.data.agent === 2;
    } catch (error) {
      console.error(
        "Health check failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return false;
    }
  }

  /**
   * Navigate to a URL with intelligent fallback selectors
   *
   * The backend will try each selector in order until one succeeds,
   * implementing exponential backoff between retries.
   *
   * @param request - Navigation request configuration
   * @returns Promise<NavigationResponse> - Navigation result
   * @throws Error if navigation fails after all retries
   *
   * @example
   * ```typescript
   * await navService.navigate({
   *   url: 'https://example.com',
   *   selectors: ['[data-testid="main"]', '#content', 'body'],
   *   timeout: 30
   * });
   * ```
   */
  async navigate(request: NavigationRequest): Promise<NavigationResponse> {
    try {
      const response = await this.client.post<NavigationResponse>(
        "/api/browser/navigate",
        {
          url: request.url,
          selectors: request.selectors || ["body"],
          timeout: request.timeout || 30,
        },
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Navigation failed: ${message}`);
    }
  }

  /**
   * Extract structured data from a web page using CSS selectors
   *
   * Each selector in the map will be used to extract text content from the page.
   * Missing elements will be skipped without throwing errors.
   *
   * @param request - Extraction request with URL and selector mappings
   * @returns Promise<Record<string, string>> - Extracted data
   * @throws Error if extraction request fails
   *
   * @example
   * ```typescript
   * const data = await navService.extractData({
   *   url: 'https://example.com',
   *   selectors: {
   *     title: 'h1',
   *     description: 'meta[name="description"]',
   *     author: '.author-name'
   *   }
   * });
   * console.log(data.title); // "Example Domain"
   * ```
   */
  async extractData(
    request: ExtractionRequest,
  ): Promise<Record<string, string>> {
    try {
      const response = await this.client.post<ExtractionResponse>(
        "/api/browser/extract",
        {
          url: request.url,
          selectors: request.selectors,
          timeout: request.timeout || 30,
        },
      );
      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Data extraction failed: ${message}`);
    }
  }

  /**
   * Click an element on a web page with fallback selectors
   *
   * The backend will attempt each selector in order, implementing retry logic
   * with exponential backoff if clicks fail.
   *
   * @param request - Click request with URL and selector(s)
   * @returns Promise<ClickResponse> - Click operation result
   * @throws Error if click fails on all selectors
   *
   * @example
   * ```typescript
   * await navService.click({
   *   url: 'https://example.com',
   *   selector: '[data-testid="submit"]',
   *   fallbackSelectors: ['#submit-button', 'button.primary'],
   *   timeout: 10
   * });
   * ```
   */
  async click(request: ClickRequest): Promise<ClickResponse> {
    try {
      const response = await this.client.post<ClickResponse>(
        "/api/browser/click",
        {
          url: request.url,
          selector: request.selector,
          fallbackSelectors: request.fallbackSelectors || [],
          timeout: request.timeout || 10,
        },
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Click operation failed: ${message}`);
    }
  }

  /**
   * Capture a screenshot of a web page or specific element
   *
   * Can capture either the full page or a specific element identified by selector.
   * Returns a base64-encoded PNG image.
   *
   * @param request - Screenshot request configuration
   * @returns Promise<string> - Base64-encoded PNG image
   * @throws Error if screenshot capture fails
   *
   * @example
   * ```typescript
   * // Full page screenshot
   * const fullImage = await navService.screenshot({
   *   url: 'https://example.com',
   *   fullPage: true
   * });
   *
   * // Element screenshot
   * const elementImage = await navService.screenshot({
   *   url: 'https://example.com',
   *   selector: '#main-content'
   * });
   *
   * // Save to file
   * const buffer = Buffer.from(fullImage, 'base64');
   * fs.writeFileSync('screenshot.png', buffer);
   * ```
   */
  async screenshot(request: ScreenshotRequest): Promise<string> {
    try {
      const response = await this.client.post<ScreenshotResponse>(
        "/api/browser/screenshot",
        {
          url: request.url,
          selector: request.selector,
          fullPage: request.fullPage || false,
          timeout: request.timeout || 30,
        },
      );
      return response.data.image;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Screenshot capture failed: ${message}`);
    }
  }

  /**
   * Get detailed information about Agent 2 backend status
   *
   * @returns Promise<HealthResponse> - Backend status details
   * @throws Error if backend is unreachable
   */
  async getStatus(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>("/health");
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get backend status: ${message}`);
    }
  }
}

/**
 * Create a singleton instance of NavigationService
 *
 * @example
 * ```typescript
 * import { navigationService } from './services/navigationService';
 *
 * // Use the singleton instance
 * const isHealthy = await navigationService.healthCheck();
 * ```
 */
export const navigationService = new NavigationService();
