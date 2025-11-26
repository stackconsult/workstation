/**
 * Workflow WebSocket Service
 *
 * Provides real-time updates for workflow execution progress.
 *
 * @module services/workflow-websocket
 * @version 2.0.0
 */

import { Server as WebSocketServer, WebSocket, RawData } from "ws";
import { Server } from "http";
import { logger } from "../utils/logger";

interface ExecutionClient {
  ws: WebSocket;
  executionId: string;
  subscribed: boolean;
}

class WorkflowWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ExecutionClient[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({
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
      ws.on("message", (data: RawData) => {
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
  }

  /**
   * Subscribe client to execution updates
   */
  private subscribeToExecution(ws: WebSocket, executionId: string): void {
    if (!executionId) {
      this.sendError(ws, "Execution ID is required");
      return;
    }

    if (!this.clients.has(executionId)) {
      this.clients.set(executionId, []);
    }

    const clients = this.clients.get(executionId)!;

    // Remove existing client entry if present (to avoid duplicates)
    const existingIndex = clients.findIndex((c) => c.ws === ws);
    if (existingIndex !== -1) {
      clients.splice(existingIndex, 1);
    }

    // Add fresh client subscription
    clients.push({ ws, executionId, subscribed: true });

    this.sendMessage(ws, {
      type: "subscribed",
      executionId,
      timestamp: new Date().toISOString(),
    });

    logger.info("Client subscribed to execution", { executionId });
  }

  /**
   * Remove client from specific execution subscription
   */
  private removeClientFromExecution(ws: WebSocket, executionId: string): void {
    const clients = this.clients.get(executionId);
    if (clients) {
      const index = clients.findIndex((c) => c.ws === ws);
      if (index !== -1) {
        clients.splice(index, 1);
        // Clean up empty execution arrays
        if (clients.length === 0) {
          this.clients.delete(executionId);
        }
      }
    }
  }

  /**
   * Unsubscribe client from execution updates
   */
  private unsubscribeFromExecution(ws: WebSocket, executionId: string): void {
    if (!executionId) {
      this.sendError(ws, "Execution ID is required");
      return;
    }

    this.removeClientFromExecution(ws, executionId);

    this.sendMessage(ws, {
      type: "unsubscribed",
      executionId,
      timestamp: new Date().toISOString(),
    });

    logger.info("Client unsubscribed from execution", { executionId });
  }

  /**
   * Remove client from all subscriptions
   */
  private removeClient(ws: WebSocket): void {
    this.clients.forEach((clients, executionId) => {
      this.removeClientFromExecution(ws, executionId);
    });
  }

  /**
   * Send message to WebSocket client
   */
  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error to WebSocket client
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: "error",
      error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast execution update to subscribed clients
   */
  broadcastExecutionUpdate(executionId: string, data: any): void {
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

    // Delay cleanup to allow clients to process the completion message
    setTimeout(() => {
      this.clients.delete(executionId);
    }, 1000); // 1 second delay
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
      ws.close(1001, "Server shutting down");
    });

    this.wss?.close();
    this.clients.clear();

    logger.info("WebSocket server shut down");
  }
}

// Export singleton instance
export const workflowWebSocketServer = new WorkflowWebSocketServer();
