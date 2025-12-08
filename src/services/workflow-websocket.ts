/**
 * Workflow WebSocket Service
 *
 * Provides real-time updates for workflow execution progress.
 *
 * @module services/workflow-websocket
 * @version 2.0.0
 */

import WebSocket from "ws";
import { Server } from "http";
import { logger } from "../utils/logger";

interface ExecutionClient {
  ws: WebSocket;
  executionId: string;
  subscribed: boolean;
}

export interface ExecutionStatus {
  state: "pending" | "running" | "completed" | "failed";
  progress?: number;
  message?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * WebSocket server for real-time workflow execution updates
 */
class WorkflowWebSocketServer {
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, ExecutionClient[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocket.Server({
      server,
      path: "/ws/executions",
      clientTracking: true,
    });

    this.wss.on("connection", (ws: WebSocket, req) => {
      logger.info("WebSocket client connected", {
        path: req.url,
        origin: req.headers.origin,
        ip: req.socket.remoteAddress,
      });

      // Handle messages from client
      ws.on("message", (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          logger.error("Failed to parse WebSocket message", { error });
          this.sendError(ws, "Invalid message format");
        }
      });

      // Handle client disconnect
      ws.on("close", () => {
        this.removeClient(ws);
        logger.info("WebSocket client disconnected");
      });

      // Handle errors
      ws.on("error", (error) => {
        logger.error("WebSocket error", { error: error.message });
      });

      // Send initial connection success message
      ws.send(
        JSON.stringify({
          type: "connected",
          message: "Workflow WebSocket connected",
          timestamp: new Date().toISOString(),
        }),
      );
    });

    // Start ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // Ping every 30 seconds

    logger.info("WebSocket server initialized on /ws/executions");
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(ws: WebSocket, message: any): void {
    try {
      switch (message.type) {
        case "subscribe":
          this.subscribeToExecution(ws, message.executionId);
          break;

        case "unsubscribe":
          this.unsubscribeFromExecution(ws, message.executionId);
          break;

        case "ping":
          this.sendMessage(ws, {
            type: "pong",
            timestamp: new Date().toISOString(),
          });
          break;

        default:
          this.sendError(ws, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error("Error handling client message", { error, message });
      this.sendError(ws, "Internal server error");
    }
  }

  /**
   * Subscribe to execution updates
   */
  private subscribeToExecution(ws: WebSocket, executionId: string): void {
    try {
      if (!executionId) {
        this.sendError(ws, "Execution ID required");
        return;
      }

      if (!this.clients.has(executionId)) {
        this.clients.set(executionId, []);
      }

      const client: ExecutionClient = {
        ws,
        executionId,
        subscribed: true,
      };

      this.clients.get(executionId)!.push(client);

      this.sendMessage(ws, {
        type: "subscribed",
        executionId,
        timestamp: new Date().toISOString(),
      });

      logger.info("Client subscribed to execution", { executionId });
    } catch (error) {
      logger.error("Error subscribing to execution", { error, executionId });
      this.sendError(ws, "Failed to subscribe");
    }
  }

  /**
   * Unsubscribe from execution updates
   */
  private unsubscribeFromExecution(ws: WebSocket, executionId: string): void {
    try {
      const clients = this.clients.get(executionId);
      if (clients) {
        const index = clients.findIndex((c) => c.ws === ws);
        if (index !== -1) {
          clients.splice(index, 1);
          if (clients.length === 0) {
            this.clients.delete(executionId);
          }
        }
      }

      this.sendMessage(ws, {
        type: "unsubscribed",
        executionId,
        timestamp: new Date().toISOString(),
      });

      logger.info("Client unsubscribed from execution", { executionId });
    } catch (error) {
      logger.error("Error unsubscribing from execution", {
        error,
        executionId,
      });
    }
  }

  /**
   * Remove client from all subscriptions
   */
  private removeClient(ws: WebSocket): void {
    try {
      this.clients.forEach((clients, executionId) => {
        const index = clients.findIndex((c) => c.ws === ws);
        if (index !== -1) {
          clients.splice(index, 1);
          if (clients.length === 0) {
            this.clients.delete(executionId);
          }
        }
      });
    } catch (error) {
      logger.error("Error removing client", { error });
    }
  }

  /**
   * Broadcast execution status to subscribed clients
   */
  broadcastExecutionStatus(executionId: string, status: ExecutionStatus): void {
    try {
      const clients = this.clients.get(executionId);
      if (!clients || clients.length === 0) {
        return;
      }

      const message = {
        type: "execution_status",
        executionId,
        data: status,
        timestamp: new Date().toISOString(),
      };

      clients.forEach((client) => {
        if (client.subscribed && client.ws.readyState === WebSocket.OPEN) {
          this.sendMessage(client.ws, message);
        }
      });
    } catch (error) {
      logger.error("Failed to send execution status", { executionId, error });
    }
  }

  /**
   * Broadcast execution update to subscribed clients
   */
  broadcastExecutionUpdate(executionId: string, data: any): void {
    try {
      const clients = this.clients.get(executionId);
      if (!clients || clients.length === 0) {
        return;
      }

      const message = {
        type: "execution_update",
        executionId,
        data,
        timestamp: new Date().toISOString(),
      };

      clients.forEach((client) => {
        if (client.subscribed && client.ws.readyState === WebSocket.OPEN) {
          this.sendMessage(client.ws, message);
        }
      });
    } catch (error) {
      logger.error("Failed to broadcast execution update", {
        executionId,
        error,
      });
    }
  }

  /**
   * Broadcast task update to subscribed clients
   */
  broadcastTaskUpdate(executionId: string, taskUpdate: any): void {
    try {
      const clients = this.clients.get(executionId);
      if (!clients || clients.length === 0) {
        return;
      }

      const message = {
        type: "task_update",
        executionId,
        data: taskUpdate,
        timestamp: new Date().toISOString(),
      };

      clients.forEach((client) => {
        if (client.subscribed && client.ws.readyState === WebSocket.OPEN) {
          this.sendMessage(client.ws, message);
        }
      });
    } catch (error) {
      logger.error("Failed to broadcast task update", { executionId, error });
    }
  }

  /**
   * Broadcast execution completion
   */
  broadcastExecutionComplete(executionId: string, result: any): void {
    try {
      const clients = this.clients.get(executionId);
      if (!clients || clients.length === 0) {
        return;
      }

      const message = {
        type: "execution_complete",
        executionId,
        data: result,
        timestamp: new Date().toISOString(),
      };

      clients.forEach((client) => {
        if (client.subscribed && client.ws.readyState === WebSocket.OPEN) {
          this.sendMessage(client.ws, message);
        }
      });

      // Clean up clients after a delay
      setTimeout(() => {
        this.clients.delete(executionId);
      }, 60000); // Remove after 1 minute
    } catch (error) {
      logger.error("Failed to broadcast execution complete", {
        executionId,
        error,
      });
    }
  }

  /**
   * Send message to client
   */
  private sendMessage(ws: WebSocket, message: any): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      logger.error("Failed to send message", { error });
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: "error",
      error,
      timestamp: new Date().toISOString(),
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
    this.clients.forEach((clients) => {
      count += clients.length;
    });
    return count;
  }

  /**
   * Get connection statistics
   */
  getStats(): { totalClients: number; subscriptions: number } {
    let totalClients = 0;
    this.clients.forEach((clients) => {
      totalClients += clients.length;
    });

    return {
      totalClients,
      subscriptions: this.clients.size,
    };
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    try {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      this.wss?.clients.forEach((ws) => {
        ws.close(1001, "Server shutting down");
      });

      this.wss?.close();
      this.clients.clear();

      logger.info("WebSocket server shut down");
    } catch (error) {
      logger.error("Error during WebSocket shutdown", { error });
    }
  }
}

// Export singleton instance
export const workflowWebSocketServer = new WorkflowWebSocketServer();
