/**
 * Backend API client with retry logic and error handling
 */

export interface BackendConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface TaskRequest {
  type: string;
  description: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  input_data?: Record<string, any>;
}

export interface TaskResponse {
  id: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  output_data?: Record<string, any>;
  error?: string;
}

export interface WorkflowExecutionRequest {
  workflow_id: string;
  parameters: Record<string, any>;
  user_id?: number;
}

export interface WorkflowExecutionResponse {
  execution_id: string;
  workflow_id: string;
  status: string;
  step_results?: Record<string, any>;
  started_at: string;
  completed_at?: string;
}

export interface IntentRequest {
  command: string;
  context?: Record<string, any>;
}

export interface IntentResponse {
  intent: string;
  entities: Record<string, any>;
  parameters: Record<string, any>;
  confidence: number;
  rag_context: any[];
  suggested_tasks: any[];
}

export class BackendAPIClient {
  private config: BackendConfig;

  constructor(config: Partial<BackendConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:8000',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  /**
   * Update backend configuration
   */
  updateConfig(config: Partial<BackendConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (attempt < this.config.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.config.retryDelay * attempt);
        return this.request<T>(endpoint, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Check if error should trigger retry
   */
  private shouldRetry(error: any): boolean {
    return (
      error.name === 'AbortError' ||
      error.message.includes('fetch') ||
      error.message.includes('network')
    );
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; app_name: string; version: string }> {
    return this.request('/health');
  }

  /**
   * Get system status and statistics
   */
  async getStatus(): Promise<{ status: string; stats: any }> {
    return this.request('/api/status');
  }

  /**
   * Create a new task
   */
  async createTask(taskData: TaskRequest): Promise<{ task_id: string }> {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  /**
   * Get task status by ID
   */
  async getTask(taskId: string): Promise<TaskResponse> {
    return this.request(`/api/tasks/${taskId}`);
  }

  /**
   * List all tasks with optional filters
   */
  async listTasks(filters?: {
    status?: string;
    type?: string;
    limit?: number;
  }): Promise<{ tasks: TaskResponse[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return this.request(`/api/tasks${query ? `?${query}` : ''}`);
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<{ message: string }> {
    return this.request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    request: WorkflowExecutionRequest
  ): Promise<WorkflowExecutionResponse> {
    return this.request('/api/workflows/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowExecution(executionId: string): Promise<WorkflowExecutionResponse> {
    return this.request(`/api/workflows/executions/${executionId}`);
  }

  /**
   * List workflow templates
   */
  async listWorkflowTemplates(): Promise<{
    templates: Array<{ id: string; name: string; description: string }>;
    count: number;
  }> {
    return this.request('/api/workflows/templates/list');
  }

  /**
   * Parse intent from natural language command
   */
  async parseIntent(request: IntentRequest): Promise<IntentResponse> {
    return this.request('/api/rag/parse-intent', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Search RAG context
   */
  async searchContext(query: string, topK: number = 5): Promise<{
    results: Array<{ content: string; score: number; metadata: any }>;
  }> {
    return this.request('/api/rag/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK }),
    });
  }

  /**
   * Add context to RAG
   */
  async addContext(
    content: string,
    contentType: string,
    metadata?: Record<string, any>
  ): Promise<{ id: string }> {
    return this.request('/api/rag/context', {
      method: 'POST',
      body: JSON.stringify({
        content,
        content_type: contentType,
        metadata,
      }),
    });
  }
}

// Singleton instance
let apiClient: BackendAPIClient | null = null;

/**
 * Get or create API client instance
 */
export function getAPIClient(config?: Partial<BackendConfig>): BackendAPIClient {
  if (!apiClient) {
    apiClient = new BackendAPIClient(config);
  } else if (config) {
    apiClient.updateConfig(config);
  }
  return apiClient;
}
