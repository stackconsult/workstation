/**
 * Workflow WebSocket Service
 * 
 * Real-time workflow execution updates via WebSocket
 * Provides live status updates for workflow executions
 * Production implementation with ws library
 */

import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';

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
  public initialize(server: HttpServer): void {
    if (this.wss) {
      logger.warn('[WorkflowWebSocket] Server already initialized');
      return;
    }

    this.wss = new WebSocket.Server({
      server,
      path: '/ws/workflows',
      perMessageDeflate: false
    });

    this.setupEventHandlers();
    this.startHeartbeat();

    logger.info('[WorkflowWebSocket] Server initialized on path /ws/workflows');
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.info('[WorkflowWebSocket] Client connected', { clientId });

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('[WorkflowWebSocket] Error parsing message', { error });
          this.sendMessage(ws, {
            type: 'error',
            message: 'Invalid message format'
          });
        }
      });

      ws.on('close', () => {
        logger.info('[WorkflowWebSocket] Client disconnected', { clientId });
        this.removeClient(ws);
      });

      ws.on('error', (error: Error) => {
        logger.error('[WorkflowWebSocket] WebSocket error', { error, clientId });
      });

      // Send welcome message
      this.sendMessage(ws, {
        type: 'connected',
        message: 'Connected to workflow updates',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: WebSocket, message: any): void {
    const { type, executionId } = message;

    switch (type) {
      case 'subscribe':
        if (executionId) {
          this.subscribeToExecution(ws, executionId);
        } else {
          this.sendMessage(ws, {
            type: 'error',
            message: 'Missing executionId for subscription'
          });
        }
        break;

      case 'unsubscribe':
        if (executionId) {
          this.unsubscribeFromExecution(ws, executionId);
        }
        break;

      case 'ping':
        this.sendMessage(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        this.sendMessage(ws, {
          type: 'error',
          message: `Unknown message type: ${type}`
        });
    }
  }

  /**
   * Subscribe client to execution updates
   */
  private subscribeToExecution(ws: WebSocket, executionId: string): void {
    if (!this.clients.has(executionId)) {
      this.clients.set(executionId, []);
    }

    const clients = this.clients.get(executionId)!;
    
    // Check if already subscribed
    if (clients.some(c => c.ws === ws)) {
      this.sendMessage(ws, {
        type: 'already_subscribed',
        executionId
      });
      return;
    }

    clients.push({
      ws,
      executionId,
      subscribed: true
    });

    this.sendMessage(ws, {
      type: 'subscribed',
      executionId,
      timestamp: new Date().toISOString()
    });

    logger.info('[WorkflowWebSocket] Client subscribed to execution', { executionId });
  }

  /**
   * Unsubscribe client from execution updates
   */
  private unsubscribeFromExecution(ws: WebSocket, executionId: string): void {
    const clients = this.clients.get(executionId);
    if (!clients) return;

    const index = clients.findIndex(c => c.ws === ws);
    if (index !== -1) {
      clients.splice(index, 1);
      
      if (clients.length === 0) {
        this.clients.delete(executionId);
      }

      this.sendMessage(ws, {
        type: 'unsubscribed',
        executionId,
        timestamp: new Date().toISOString()
      });

      logger.info('[WorkflowWebSocket] Client unsubscribed from execution', { executionId });
    }
  }

  /**
   * Remove client from all subscriptions
   */
  private removeClient(ws: WebSocket): void {
    this.clients.forEach((clients, executionId) => {
      const index = clients.findIndex(c => c.ws === ws);
      if (index !== -1) {
        clients.splice(index, 1);
        if (clients.length === 0) {
          this.clients.delete(executionId);
        }
      }
    });
  }

  /**
   * Broadcast execution started event
   */
  broadcastExecutionStarted(executionId: string, data: any): void {
    this.broadcast(executionId, {
      type: 'execution.started',
      executionId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast execution progress update
   */
  broadcastExecutionProgress(executionId: string, data: any): void {
    this.broadcast(executionId, {
      type: 'execution.progress',
      executionId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast execution completed event
   */
  broadcastExecutionCompleted(executionId: string, data: any): void {
    this.broadcast(executionId, {
      type: 'execution.completed',
      executionId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast execution failed event
   */
  broadcastExecutionFailed(executionId: string, data: any): void {
    this.broadcast(executionId, {
      type: 'execution.failed',
      executionId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast task update to subscribed clients
   */
  broadcastTaskUpdate(executionId: string, taskUpdate: any): void {
    this.broadcast(executionId, {
      type: 'task_update',
      executionId,
      data: taskUpdate,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast message to all clients subscribed to an execution
   */
  private broadcast(executionId: string, message: any): void {
    const clients = this.clients.get(executionId);
    if (!clients || clients.length === 0) {
      return;
    }

    clients.forEach(client => {
      if (client.subscribed && client.ws.readyState === WebSocket.OPEN) {
        this.sendMessage(client.ws, message);
      }
    });

    logger.debug('[WorkflowWebSocket] Broadcasted to clients', {
      executionId,
      type: message.type,
      clientCount: clients.length
    });
  }

  /**
   * Send message to a specific WebSocket client
   */
  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: WebSocket) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeExecutions: number;
    clientsByExecution: Record<string, number>;
  } {
    const clientsByExecution: Record<string, number> = {};
    
    this.clients.forEach((clients, executionId) => {
      clientsByExecution[executionId] = clients.length;
    });

    return {
      totalConnections: this.wss?.clients.size || 0,
      activeExecutions: this.clients.size,
      clientsByExecution
    };
  }

  /**
   * Shutdown the WebSocket server
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

    logger.info('[WorkflowWebSocket] Server shut down');
  }
}

// Export singleton instance
export const workflowWebSocketServer = new WorkflowWebSocketServer();
