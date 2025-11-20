/**
 * MCP (Model Context Protocol) Implementation
 * Handles protocol-level communication between backend and MCP containers
 */

import { getMessageBroker, MCPMessage, TaskMessage, StatusMessage, ResultMessage } from './message-broker';
import { agentOrchestrator } from './agent-orchestrator';

export interface MCPRequest {
  id: string;
  method: string;
  params?: any;
  context?: {
    userId?: string;
    workflowId?: string;
    sessionId?: string;
  };
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPNotification {
  method: string;
  params: any;
}

export class MCPProtocol {
  private messageBroker = getMessageBroker();
  private orchestrator = agentOrchestrator;
  private requestHandlers: Map<string, (params: any, context: any) => Promise<any>> = new Map();
  private notificationHandlers: Map<string, (params: any) => void> = new Map();

  constructor() {
    this.setupDefaultHandlers();
    this.setupMessageListeners();
  }

  /**
   * Setup default MCP protocol handlers
   */
  private setupDefaultHandlers(): void {
    // Workflow execution handler
    this.registerRequestHandler('execute_workflow', async (params, context) => {
      const { workflowId, actions } = params;
      
      // Create task via agent orchestrator
      const taskId = await this.orchestrator.createTask(
        params.agentId || '1', // Default to agent 1
        'execute-workflow',
        { workflowId, actions },
        context.userId || 'system',
        params.priority || 5
      );

      return {
        taskId,
        status: 'queued',
        message: 'Workflow execution started',
      };
    });

    // Get task status handler
    this.registerRequestHandler('get_task_status', async (params) => {
      const { taskId } = params;
      const status = await this.orchestrator.getTaskStatus(taskId);
      return status;
    });

    // Browser automation handlers
    this.registerRequestHandler('navigate', async (params) => {
      return { method: 'navigate', params };
    });

    this.registerRequestHandler('click', async (params) => {
      return { method: 'click', params };
    });

    this.registerRequestHandler('fill', async (params) => {
      return { method: 'fill', params };
    });

    this.registerRequestHandler('screenshot', async (params) => {
      return { method: 'screenshot', params };
    });

    // Agent health check
    this.registerRequestHandler('health_check', async (params) => {
      const { agentId } = params;
      const stats = await this.orchestrator.getAgentStatistics(agentId);
      return {
        healthy: stats.healthStatus === 'healthy',
        stats,
      };
    });

    // Context management
    this.registerRequestHandler('save_context', async (params, context) => {
      // Save context for task recall
      return { success: true, contextId: params.contextId };
    });

    this.registerRequestHandler('get_context', async (params) => {
      // Retrieve saved context
      return { context: {} };
    });
  }

  /**
   * Setup message listeners for bidirectional communication
   */
  private setupMessageListeners(): void {
    // Listen for status updates from agents
    this.messageBroker.listenForStatus((message: StatusMessage) => {
      console.log(`[MCPProtocol] Status update from agent ${message.agentId}:`, message.payload.status);
      this.handleNotification('task_status_update', {
        taskId: message.taskId,
        agentId: message.agentId,
        status: message.payload.status,
        progress: message.payload.progress,
        message: message.payload.message,
      });
    });

    // Listen for results from agents
    this.messageBroker.listenForResults((message: ResultMessage) => {
      console.log(`[MCPProtocol] Result from agent ${message.agentId}:`, message.payload.success);
      this.handleNotification('task_completed', {
        taskId: message.taskId,
        agentId: message.agentId,
        success: message.payload.success,
        data: message.payload.data,
        error: message.payload.error,
        duration: message.payload.duration,
      });
    });

    // Listen for heartbeats
    this.messageBroker.listenForHeartbeats((message: MCPMessage) => {
      this.handleNotification('agent_heartbeat', {
        agentId: message.agentId,
        timestamp: message.timestamp,
      });
    });
  }

  /**
   * Register a request handler
   */
  registerRequestHandler(method: string, handler: (params: any, context: any) => Promise<any>): void {
    this.requestHandlers.set(method, handler);
  }

  /**
   * Register a notification handler
   */
  registerNotificationHandler(method: string, handler: (params: any) => void): void {
    this.notificationHandlers.set(method, handler);
  }

  /**
   * Handle an MCP request
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const handler = this.requestHandlers.get(request.method);
      
      if (!handler) {
        return {
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
      }

      const result = await handler(request.params || {}, request.context || {});
      
      return {
        id: request.id,
        result,
      };
    } catch (error: any) {
      console.error(`[MCPProtocol] Error handling request ${request.method}:`, error);
      return {
        id: request.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error',
          data: error.stack,
        },
      };
    }
  }

  /**
   * Handle an MCP notification
   */
  private handleNotification(method: string, params: any): void {
    const handler = this.notificationHandlers.get(method);
    if (handler) {
      try {
        handler(params);
      } catch (error) {
        console.error(`[MCPProtocol] Error handling notification ${method}:`, error);
      }
    }
  }

  /**
   * Send a request to an agent
   */
  async sendRequest(agentId: string, method: string, params: any = {}): Promise<any> {
    const request: MCPRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method,
      params,
    };

    return await this.messageBroker.request(agentId, request);
  }

  /**
   * Send a notification to an agent
   */
  async sendNotification(agentId: string, method: string, params: any = {}): Promise<void> {
    const notification: MCPNotification = {
      method,
      params,
    };

    await this.messageBroker.sendCommand(agentId, method, params);
  }

  /**
   * Broadcast a notification to all agents
   */
  async broadcastNotification(method: string, params: any = {}): Promise<void> {
    const notification: MCPNotification = {
      method,
      params,
    };

    const message: MCPMessage = {
      id: `broadcast_${Date.now()}`,
      type: 'command',
      agentId: 'all',
      payload: notification,
      timestamp: new Date(),
    };

    await this.messageBroker.broadcast(message);
  }

  /**
   * Execute a workflow via MCP protocol
   */
  async executeWorkflow(agentId: string, workflowId: string, actions: any[], userId?: string): Promise<any> {
    const request: MCPRequest = {
      id: `workflow_${Date.now()}`,
      method: 'execute_workflow',
      params: {
        agentId,
        workflowId,
        actions,
      },
      context: {
        userId,
        workflowId,
        sessionId: `session_${Date.now()}`,
      },
    };

    return await this.handleRequest(request);
  }

  /**
   * Get Chrome extension wiring configuration
   */
  getChromeExtensionConfig(): any {
    return {
      mcpEndpoint: process.env.MCP_ENDPOINT || 'ws://localhost:7042/mcp',
      supportedMethods: Array.from(this.requestHandlers.keys()),
      supportedNotifications: Array.from(this.notificationHandlers.keys()),
      agents: {
        total: 21,
        available: Array.from({ length: 21 }, (_, i) => ({
          id: String(i + 1),
          name: `Agent ${i + 1}`,
          status: 'available',
        })),
      },
    };
  }
}

// Singleton instance
let mcpProtocolInstance: MCPProtocol | null = null;

export function getMCPProtocol(): MCPProtocol {
  if (!mcpProtocolInstance) {
    mcpProtocolInstance = new MCPProtocol();
  }
  return mcpProtocolInstance;
}

export default MCPProtocol;
