/**
 * Workstation API Client for Chrome Extension
 * 
 * Production-grade HTTP client for communicating with the Workstation backend API.
 * Includes automatic retry, error handling, and token management.
 * 
 * @module chrome-extension/lib/api-client
 * @version 2.0.0
 */

import { StorageManager } from './storage-manager.js';
import { EventEmitter } from './event-emitter.js';

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: any[];
  metadata?: Record<string, any>;
}

/**
 * API Client for Workstation Backend
 */
export class ApiClient {
  private config: ApiClientConfig;
  private storage: StorageManager;
  private events: EventEmitter;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
    this.storage = new StorageManager();
    this.events = new EventEmitter();
  }

  /**
   * Initialize API client and load stored token
   */
  async initialize(): Promise<void> {
    try {
      const settings = await this.storage.get('settings');
      if (settings?.backendUrl) {
        this.config.baseUrl = settings.backendUrl;
      }

      const token = await this.storage.get('authToken');
      if (token) {
        this.authToken = token;
      }

      this.events.emit('client.initialized', { baseUrl: this.config.baseUrl });
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      throw error;
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    this.storage.set('authToken', token).catch(console.error);
    this.events.emit('auth.token.updated', { token });
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
    this.storage.remove('authToken').catch(console.error);
    this.events.emit('auth.token.cleared', {});
  }

  /**
   * Update base URL
   */
  setBaseUrl(url: string): void {
    this.config.baseUrl = url;
    this.storage.set('settings', { backendUrl: url }).catch(console.error);
    this.events.emit('baseurl.updated', { url });
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        // Add auth token if available
        if (this.authToken) {
          headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout || 30000
        );

        const response = await fetch(url, {
          method,
          headers,
          signal: controller.signal,
          ...options,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        this.events.emit('request.success', { method, endpoint, status: response.status });

        return {
          success: true,
          data: data.data || data,
          message: data.message,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error as Error;
        
        this.events.emit('request.error', {
          method,
          endpoint,
          attempt: attempt + 1,
          error: lastError.message,
        });

        // Don't retry on auth errors
        if (lastError.message.includes('401') || lastError.message.includes('403')) {
          break;
        }

        // Wait before retrying
        if (attempt < (this.config.maxRetries || 3) - 1) {
          await this.sleep((this.config.retryDelay || 1000) * Math.pow(2, attempt));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, {
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, {
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Fetch all agents from backend
   */
  async fetchAgents(): Promise<ApiResponse<AgentInfo[]>> {
    return this.get<AgentInfo[]>('/api/agents');
  }

  /**
   * Fetch specific agent details
   */
  async fetchAgent(agentId: string): Promise<ApiResponse<AgentInfo>> {
    return this.get<AgentInfo>(`/api/agents/${agentId}`);
  }

  /**
   * Execute agent task
   */
  async executeAgentTask(agentId: string, payload: any): Promise<ApiResponse<any>> {
    return this.post(`/api/agents/${agentId}/execute`, payload);
  }

  /**
   * Fetch workflow templates
   */
  async fetchWorkflowTemplates(): Promise<ApiResponse<WorkflowTemplate[]>> {
    return this.get<WorkflowTemplate[]>('/api/workflows/templates');
  }

  /**
   * Fetch specific workflow template
   */
  async fetchWorkflowTemplate(templateId: string): Promise<ApiResponse<WorkflowTemplate>> {
    return this.get<WorkflowTemplate>(`/api/workflows/templates/${templateId}`);
  }

  /**
   * Create workflow from template
   */
  async createWorkflowFromTemplate(
    templateId: string,
    params: any
  ): Promise<ApiResponse<any>> {
    return this.post(`/api/workflows/templates/${templateId}/create`, params);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId: string, params?: any): Promise<ApiResponse<any>> {
    return this.post(`/api/workflows/${workflowId}/execute`, params);
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowStatus(executionId: string): Promise<ApiResponse<any>> {
    return this.get(`/api/workflows/executions/${executionId}`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; uptime: number }>> {
    return this.get('/health');
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: any) => void): void {
    this.events.on(event, callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (data: any) => void): void {
    this.events.off(event, callback);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance
 */
let apiClientInstance: ApiClient | null = null;

/**
 * Get or create API client instance
 */
export function getApiClient(config?: ApiClientConfig): ApiClient {
  if (!apiClientInstance) {
    if (!config) {
      throw new Error('ApiClient not initialized. Provide config on first call.');
    }
    apiClientInstance = new ApiClient(config);
  }
  return apiClientInstance;
}

/**
 * Reset API client instance (for testing)
 */
export function resetApiClient(): void {
  apiClientInstance = null;
}
