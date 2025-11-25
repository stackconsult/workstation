/**
 * Workflow Connector for Chrome Extension
 * 
 * Handles workflow template discovery, execution, and monitoring.
 * Connects to backend API to manage 32 workflow templates.
 * 
 * @module chrome-extension/lib/workflow-connector
 * @version 2.0.0
 */

import { ApiClient, WorkflowTemplate, ApiResponse } from './api-client.js';
import { EventEmitter } from './event-emitter.js';
import { StorageManager } from './storage-manager.js';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  templateId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  progress: number;
  result?: any;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowExecutionOptions {
  timeout?: number;
  maxRetries?: number;
  variables?: Record<string, any>;
  priority?: number;
}

/**
 * Workflow Connector Class
 */
export class WorkflowConnector {
  private apiClient: ApiClient;
  private storage: StorageManager;
  private events: EventEmitter;
  private cachedTemplates: Map<string, WorkflowTemplate> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private refreshInterval: number = 60000; // 60 seconds
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private pollingTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.storage = new StorageManager();
    this.events = new EventEmitter();
  }

  /**
   * Initialize workflow connector
   */
  async initialize(): Promise<void> {
    try {
      // Load cached templates from storage
      const cached = await this.storage.get<WorkflowTemplate[]>('cachedTemplates');
      if (cached && Array.isArray(cached)) {
        cached.forEach(template => this.cachedTemplates.set(template.id, template));
      }

      // Fetch latest templates
      await this.refreshTemplates();

      // Setup auto-refresh
      this.startAutoRefresh();

      this.events.emit('connector.initialized', {
        templateCount: this.cachedTemplates.size,
      });
    } catch (error) {
      console.error('Failed to initialize workflow connector:', error);
      throw error;
    }
  }

  /**
   * Refresh workflow templates from backend
   */
  async refreshTemplates(): Promise<WorkflowTemplate[]> {
    try {
      const response = await this.apiClient.fetchWorkflowTemplates();
      
      if (response.success && response.data) {
        this.cachedTemplates.clear();
        response.data.forEach(template => this.cachedTemplates.set(template.id, template));

        // Save to storage
        await this.storage.set('cachedTemplates', response.data);
        await this.storage.set('lastTemplateRefresh', new Date().toISOString());

        this.events.emit('templates.refreshed', {
          count: response.data.length,
        });

        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch workflow templates');
    } catch (error) {
      console.error('Failed to refresh templates:', error);
      this.events.emit('templates.refresh.error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get all workflow templates
   */
  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.cachedTemplates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): WorkflowTemplate | null {
    return this.cachedTemplates.get(templateId) || null;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return this.getTemplates().filter(template => template.category === category);
  }

  /**
   * Get unique categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.getTemplates().forEach(template => {
      if (template.category) {
        categories.add(template.category);
      }
    });
    return Array.from(categories).sort();
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): WorkflowTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getTemplates().filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery) ||
      template.category?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create workflow from template
   */
  async createFromTemplate(
    templateId: string,
    name: string,
    variables?: Record<string, any>
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiClient.createWorkflowFromTemplate(templateId, {
        name,
        variables,
      });

      if (response.success) {
        this.events.emit('workflow.created', {
          templateId,
          workflowId: response.data?.id,
        });
      }

      return response;
    } catch (error) {
      console.error('Failed to create workflow from template:', error);
      throw error;
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      // Store execution
      this.activeExecutions.set(executionId, execution);
      
      // Start execution
      execution.status = 'running';
      execution.startedAt = new Date().toISOString();
      this.events.emit('execution.started', execution);

      const response = await this.apiClient.executeWorkflow(workflowId, options.variables);

      if (response.success && response.data) {
        // Start polling for status
        this.startStatusPolling(executionId, response.data.executionId || executionId);

        return execution;
      } else {
        execution.status = 'failed';
        execution.error = response.error;
        execution.completedAt = new Date().toISOString();
        this.events.emit('execution.failed', execution);
        throw new Error(response.error || 'Failed to execute workflow');
      }
    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      execution.completedAt = new Date().toISOString();
      this.events.emit('execution.failed', execution);
      throw error;
    }
  }

  /**
   * Execute workflow from template directly
   */
  async executeTemplate(
    templateId: string,
    variables?: Record<string, any>,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecution> {
    try {
      // Create workflow from template
      const createResponse = await this.createFromTemplate(
        templateId,
        `Template ${templateId} - ${new Date().toISOString()}`,
        variables
      );

      if (!createResponse.success || !createResponse.data?.id) {
        throw new Error('Failed to create workflow from template');
      }

      // Execute the created workflow
      const execution = await this.executeWorkflow(createResponse.data.id, options);
      execution.templateId = templateId;

      return execution;
    } catch (error) {
      console.error('Failed to execute template:', error);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): WorkflowExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values()).filter(
      exec => exec.status === 'running' || exec.status === 'pending'
    );
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    // Stop polling
    this.stopStatusPolling(executionId);

    // Mark as cancelled
    execution.status = 'cancelled';
    execution.completedAt = new Date().toISOString();
    
    this.events.emit('execution.cancelled', execution);
    return true;
  }

  /**
   * Start polling for execution status
   */
  private startStatusPolling(executionId: string, backendExecutionId: string): void {
    const pollInterval = 2000; // 2 seconds

    const timer = setInterval(async () => {
      try {
        const response = await this.apiClient.getWorkflowStatus(backendExecutionId);
        const execution = this.activeExecutions.get(executionId);
        
        if (!execution) {
          this.stopStatusPolling(executionId);
          return;
        }

        if (response.success && response.data) {
          const { status, progress, currentStep, result, error } = response.data;

          execution.status = status;
          execution.progress = progress || 0;
          execution.currentStep = currentStep;
          execution.result = result;
          execution.error = error;

          this.events.emit('execution.updated', execution);

          // Stop polling if completed/failed
          if (status === 'completed' || status === 'failed') {
            execution.completedAt = new Date().toISOString();
            this.stopStatusPolling(executionId);
            
            if (status === 'completed') {
              this.events.emit('execution.completed', execution);
            } else {
              this.events.emit('execution.failed', execution);
            }
          }
        }
      } catch (error) {
        console.error('Error polling execution status:', error);
      }
    }, pollInterval);

    this.pollingTimers.set(executionId, timer);
  }

  /**
   * Stop polling for execution status
   */
  private stopStatusPolling(executionId: string): void {
    const timer = this.pollingTimers.get(executionId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(executionId);
    }
  }

  /**
   * Start auto-refresh of templates
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.refreshTemplates().catch(console.error);
    }, this.refreshInterval);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Set refresh interval
   */
  setRefreshInterval(ms: number): void {
    this.refreshInterval = ms;
    if (this.refreshTimer) {
      this.startAutoRefresh();
    }
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
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoRefresh();
    
    // Stop all polling timers
    this.pollingTimers.forEach(timer => clearInterval(timer));
    this.pollingTimers.clear();
    
    this.activeExecutions.clear();
    this.events.removeAllListeners();
  }
}

/**
 * Singleton instance
 */
let workflowConnectorInstance: WorkflowConnector | null = null;

/**
 * Get or create workflow connector instance
 */
export function getWorkflowConnector(apiClient: ApiClient): WorkflowConnector {
  if (!workflowConnectorInstance) {
    workflowConnectorInstance = new WorkflowConnector(apiClient);
  }
  return workflowConnectorInstance;
}
