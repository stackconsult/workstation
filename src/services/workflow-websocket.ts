/**
 * Real-time Workflow Execution Updates via WebSocket
 * Provides live status updates for workflow executions
 */

import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { orchestrationEngine } from '../automation/orchestrator/engine';

interface ExecutionClient {
  ws: WebSocket;
  executionId: string;
  subscribed: boolean;
}

class WorkflowWebSocketServer {
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, ExecutionClient[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(server: HttpServer): void {
    this.wss = new WebSocket.Server({ 
      server, 
      path: '/ws/executions',
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      logger.info('WebSocket client connected', { 
        ip: req.socket.remoteAddress 
      });

      // Send welcome message
      this.sendMessage(ws, {
        type: 'connected',
        message: 'Connected to Workstation execution updates',
        timestamp: new Date().toISOString()
      });

      // Handle messages from client
      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { error });
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.removeClient(ws);
        logger.info('WebSocket client disconnected');
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', { error });
      });
    });

    // Start ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // Ping every 30 seconds

    logger.info('WebSocket server initialized on /ws/executions');
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.subscribeToExecution(ws, message.executionId);
        break;

      case 'unsubscribe':
        this.unsubscribeFromExecution(ws, message.executionId);
        break;

      case 'ping':
        this.sendMessage(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Subscribe client to execution updates
   */
  private subscribeToExecution(ws: WebSocket, executionId: string): void {
    if (!executionId) {
      this.sendError(ws, 'Execution ID is required');
      return;
    }

    const client: ExecutionClient = {
      ws,
      executionId,
      subscribed: true
    };

    // Add to clients map
    const clients = this.clients.get(executionId) || [];
    clients.push(client);
    this.clients.set(executionId, clients);

    this.sendMessage(ws, {
      type: 'subscribed',
      executionId,
      message: `Subscribed to execution ${executionId}`,
      timestamp: new Date().toISOString()
    });

    logger.info('Client subscribed to execution', { executionId });

    // Send current status immediately
    this.sendExecutionStatus(executionId);
  }

  /**
   * Unsubscribe client from execution updates
   */
  private unsubscribeFromExecution(ws: WebSocket, executionId: string): void {
    const clients = this.clients.get(executionId);
    if (clients) {
      const filtered = clients.filter(c => c.ws !== ws);
      if (filtered.length === 0) {
        this.clients.delete(executionId);
      } else {
        this.clients.set(executionId, filtered);
      }
    }

    this.sendMessage(ws, {
      type: 'unsubscribed',
      executionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Remove client from all subscriptions
   */
  private removeClient(ws: WebSocket): void {
    this.clients.forEach((clients, executionId) => {
      const filtered = clients.filter(c => c.ws !== ws);
      if (filtered.length === 0) {
        this.clients.delete(executionId);
      } else {
        this.clients.set(executionId, filtered);
      }
    });
  }

  /**
   * Broadcast execution status to all subscribed clients
   */
  async sendExecutionStatus(executionId: string): Promise<void> {
    const clients = this.clients.get(executionId);
    if (!clients || clients.length === 0) {
      return;
    }

    try {
      // Get current execution status from orchestration engine
      const execution = await orchestrationEngine.getExecution(executionId);
      
      if (!execution) {
        return;
      }

      // Calculate progress from tasks if available
      let progress = 0;
      try {
        const tasks = await orchestrationEngine.getExecutionTasks(executionId);
        if (tasks && Array.isArray(tasks)) {
          const completed = tasks.filter((t: any) => t.status === 'completed').length;
          progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
        }
      } catch (error) {
        // If tasks query fails, leave progress at 0
        logger.warn('Failed to calculate progress from tasks', { executionId, error });
      }

      const status = {
        type: 'execution_update',
        executionId,
        data: {
          status: execution.status,
          progress,
          startedAt: execution.started_at,
          completedAt: execution.completed_at,
          error: execution.error_message,
          duration: execution.duration_ms
        },
        timestamp: new Date().toISOString()
      };

      // Send to all subscribed clients
      clients.forEach(client => {
        if (client.subscribed && client.ws.readyState === WebSocket.OPEN) {
          this.sendMessage(client.ws, status);
        }
      });
    } catch (error) {
      logger.error('Failed to send execution status', { executionId, error });
    }
  }

  /**
   * Broadcast task update to subscribed clients
   */
  broadcastTaskUpdate(executionId: string, taskUpdate: any): void {
    const clients = this.clients.get(executionId);
    if (!clients || clients.length === 0) {
      return;
    }

    const message = {
      type: 'task_update',
      executionId,
      data: taskUpdate,
      timestamp: new Date().toISOString()
    };

    clients.forEach(client => {
      if (client.subscribed && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client.ws, message);
      }
    });
  }

  /**
   * Broadcast execution completion
   */
  broadcastExecutionComplete(executionId: string, result: any): void {
    const clients = this.clients.get(executionId);
    if (!clients || clients.length === 0) {
      return;
    }

    const message = {
      type: 'execution_complete',
      executionId,
      data: result,
      timestamp: new Date().toISOString()
    };

    clients.forEach(client => {
      if (client.subscribed && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client.ws, message);
      }
    });

    // Clean up clients after a delay
    setTimeout(() => {
      this.clients.delete(executionId);
    }, 60000); // Remove after 1 minute
  }

  /**
   * Send message to client
   */
  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected clients count
   */
  getConnectionsCount(): number {
    return this.wss?.clients.size || 0;
  }

  /**
   * Get active subscriptions count
   */
  getSubscriptionsCount(): number {
    let count = 0;
    this.clients.forEach(clients => {
      count += clients.length;
    });
    return count;
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.wss?.clients.forEach((ws) => {
      ws.close(1001, 'Server shutting down');
    });

    this.wss?.close();
    this.clients.clear();

    logger.info('WebSocket server shut down');
  }
}

// Export singleton instance
export const workflowWebSocketServer = new WorkflowWebSocketServer();
