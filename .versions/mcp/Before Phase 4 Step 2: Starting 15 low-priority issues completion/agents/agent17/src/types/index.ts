// Type definitions for Agent #17
// All interfaces and types used across the agent

import { SearchResult } from '../browser/manager.js';

// Tool Input Types
export interface ClickElementInput {
  url: string;
  selector: string;
  waitAfterClick?: number;
}

export interface FillFormInput {
  url: string;
  fields: Record<string, string | boolean>;
  submitSelector?: string;
  waitAfterSubmit?: number;
}

export interface SearchInput {
  query: string;
  searchEngine?: 'google' | 'bing' | 'duckduckgo';
  maxResults?: number;
}

export interface ExtractDataInput {
  url: string;
  selectors: Record<string, string>;
  extractMultiple?: Record<string, boolean>;
  takeScreenshot?: boolean;
  fullPageScreenshot?: boolean;
}

export interface NavigateInput {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
}

export interface WaitForSelectorInput {
  selector: string;
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

// Tool Result Types
export interface ToolResult<T = any> {
  success: boolean;
  data: T;
  metadata: {
    timestamp: string;
    duration: number;
    url?: string;
    [key: string]: any;
  };
  error?: string;
}

export interface ClickResult {
  clicked: string;
  finalUrl: string;
  pageTitle: string;
}

export interface FillFormResult {
  fieldsFilledCount: number;
  submitted: boolean;
  finalUrl: string;
  pageTitle: string;
}

export interface SearchResultData {
  query: string;
  searchEngine: string;
  results: SearchResult[];
  totalResults: number;
}

export interface ExtractedData {
  url: string;
  extracted: Record<string, any>;
  screenshotSize?: number;
}

// Project Generation Types
export interface ProjectTemplate {
  name: string;
  description: string;
  techStack: {
    free: string[];
    byokOptional: string[];
  };
  features: {
    core: string[];
    optionalByok: string[];
  };
}

export interface PromptGenerationConfig {
  templateType: 'competitor-tracker' | 'web-scraper' | 'api-wrapper' | 'automation-suite';
  projectName: string;
  includeBYOK: boolean;
  byokServices?: string[];
  testCoverage: number;
  includeCI: boolean;
}

// Browser Configuration Types
export interface BrowserConfig {
  headless?: boolean;
  maxPages?: number;
  timeout?: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

// Error Types
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class BrowserError extends AgentError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'BROWSER_ERROR', metadata);
    this.name = 'BrowserError';
  }
}

export class SelectorError extends AgentError {
  constructor(message: string, selector: string) {
    super(message, 'SELECTOR_ERROR', { selector });
    this.name = 'SelectorError';
  }
}

export class RetryExhaustedError extends AgentError {
  constructor(attempts: number, lastError: Error) {
    super(
      `All ${attempts} retry attempts failed`,
      'RETRY_EXHAUSTED',
      { attempts, lastError: lastError.message }
    );
    this.name = 'RetryExhaustedError';
  }
}
