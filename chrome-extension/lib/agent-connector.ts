/**
 * Agent Connector for Chrome Extension
 * 
 * Handles agent discovery, connection, and task execution.
 * Connects to backend API to fetch and interact with 28 agents.
 * 
 * @module chrome-extension/lib/agent-connector
 * @version 2.0.0
 */

import { ApiClient, AgentInfo, ApiResponse } from './api-client.js';
import { EventEmitter } from './event-emitter.js';
import { StorageManager } from './storage-manager.js';

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  payload: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AgentExecutionOptions {
  timeout?: number;
  retryCount?: number;
  priority?: number;
}

/**
 * Agent Connector Class
 */
export class AgentConnector {
  private apiClient: ApiClient;
  private storage: StorageManager;
  private events: EventEmitter;
  private cachedAgents: Map<string, AgentInfo> = new Map();
  private activeTasks: Map<string, AgentTask> = new Map();
  private refreshInterval: number = 30000; // 30 seconds
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.storage = new StorageManager();
    this.events = new EventEmitter();
  }

  /**
   * Initialize agent connector
   */
  async initialize(): Promise<void> {
    try {
      // Load cached agents from storage
      const cached = await this.storage.get<AgentInfo[]>('cachedAgents');
      if (cached && Array.isArray(cached)) {
        cached.forEach(agent => this.cachedAgents.set(agent.id, agent));
      }

      // Fetch latest agents
      await this.refreshAgents();

      // Setup auto-refresh
      this.startAutoRefresh();

      this.events.emit('connector.initialized', {
        agentCount: this.cachedAgents.size,
      });
    } catch (error) {
      console.error('Failed to initialize agent connector:', error);
      throw error;
    }
  }

  /**
   * Refresh agents from backend
   */
  async refreshAgents(): Promise<AgentInfo[]> {
    try {
      const response = await this.apiClient.fetchAgents();
      
      if (response.success && response.data) {
        this.cachedAgents.clear();
        response.data.forEach(agent => this.cachedAgents.set(agent.id, agent));

        // Save to storage
        await this.storage.set('cachedAgents', response.data);
        await this.storage.set('lastAgentRefresh', new Date().toISOString());

        this.events.emit('agents.refreshed', {
          count: response.data.length,
        });

        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch agents');
    } catch (error) {
      console.error('Failed to refresh agents:', error);
      this.events.emit('agents.refresh.error', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get all agents
   */
  getAgents(): AgentInfo[] {
    return Array.from(this.cachedAgents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentInfo | null {
    return this.cachedAgents.get(agentId) || null;
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): AgentInfo[] {
    return this.getAgents().filter(agent => agent.type === type);
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: string): AgentInfo[] {
    return this.getAgents().filter(agent =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Search agents
   */
  searchAgents(query: string): AgentInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.getAgents().filter(agent =>
      agent.name.toLowerCase().includes(lowerQuery) ||
      agent.id.toLowerCase().includes(lowerQuery) ||
      agent.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Execute agent task
   */
  async executeTask(
    agentId: string,
    taskType: string,
    payload: any,
    options: AgentExecutionOptions = {}
  ): Promise<AgentTask> {
    const taskId = this.generateTaskId();
    const task: AgentTask = {
      id: taskId,
      agentId,
      type: taskType,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      // Store task
      this.activeTasks.set(taskId, task);
      task.status = 'running';
      this.events.emit('task.started', task);

      // Execute via API
      const response = await this.apiClient.executeAgentTask(agentId, {
        type: taskType,
        payload,
        options,
      });

      if (response.success) {
        task.status = 'completed';
        task.result = response.data;
        task.completedAt = new Date().toISOString();
        this.events.emit('task.completed', task);
      } else {
        task.status = 'failed';
        task.error = response.error;
        task.completedAt = new Date().toISOString();
        this.events.emit('task.failed', task);
      }

      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = (error as Error).message;
      task.completedAt = new Date().toISOString();
      this.events.emit('task.failed', task);
      throw error;
    } finally {
      // Remove from active tasks after some time
      setTimeout(() => this.activeTasks.delete(taskId), 60000); // 1 minute
    }
  }

  /**
   * Get task status
   */
  getTask(taskId: string): AgentTask | null {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): AgentTask[] {
    return Array.from(this.activeTasks.values()).filter(
      task => task.status === 'running' || task.status === 'pending'
    );
  }

  /**
   * Cancel task (if supported)
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return false;
    }

    // Mark as failed
    task.status = 'failed';
    task.error = 'Cancelled by user';
    task.completedAt = new Date().toISOString();
    
    this.events.emit('task.cancelled', task);
    return true;
  }

  /**
   * Start auto-refresh of agents
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.refreshAgents().catch(console.error);
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
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.activeTasks.clear();
    this.events.removeAllListeners();
  }
}

/**
 * Singleton instance
 */
let agentConnectorInstance: AgentConnector | null = null;

/**
 * Get or create agent connector instance
 */
export function getAgentConnector(apiClient: ApiClient): AgentConnector {
  if (!agentConnectorInstance) {
    agentConnectorInstance = new AgentConnector(apiClient);
  }
  return agentConnectorInstance;
}
