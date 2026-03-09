/**
 * WebSocket Server for MCP Communication
 * Handles real-time bidirectional communication between Chrome extension and MCP containers
 */

import WebSocket from "ws";
import { Server as HTTPServer } from "http";
import { getMCPProtocol, MCPRequest, MCPResponse } from "./mcp-protocol";
import { getMessageBroker } from "./message-broker";
import {
  authenticateWebSocket,
  wsRateLimiter,
} from "../middleware/websocket-auth";
import { activeWebsocketConnections } from "./monitoring";
import { logger } from "../utils/logger";

export interface MCPWebSocketMessage {
  type: "request" | "response" | "notification" | "subscribe" | "unsubscribe";
  id?: string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

export class MCPWebSocketServer {
  private wss: WebSocket.Server;
  private mcpProtocol = getMCPProtocol();
  private messageBroker = getMessageBroker();
  private clients: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // clientId -> Set<channel>

  constructor(server: HTTPServer) {
    this.wss = new WebSocket.Server({
      server,
      path: "/mcp",
    });

    this.setupServer();
    this.setupProtocolBridge();
  }

  private setupServer(): void {
    this.wss.on("connection", async (ws: WebSocket, req: any) => {
      // Authenticate WebSocket connection
      const authResult = await authenticateWebSocket(req);

      if (!authResult.authenticated) {
        logger.warn("[MCPWebSocket] Authentication failed", {
          error: authResult.error,
        });
        ws.close(1008, authResult.error); // Policy Violation
        return;
      }

      const userId = authResult.user?.userId || "anonymous";

      // Check rate limiting
      if (!wsRateLimiter.canConnect(userId)) {
        logger.warn("[MCPWebSocket] Connection rate limit exceeded", {
          userId,
        });
        ws.close(1008, "Too many connections");
        return;
      }

      // Track connection for rate limiting
      wsRateLimiter.trackConnection(userId);

      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.clients.set(clientId, ws);
      this.subscriptions.set(clientId, new Set());

      // Update metrics
      activeWebsocketConnections.inc();

      logger.info("[MCPWebSocket] Client connected", { clientId, userId });

      // Send welcome message
      this.send(ws, {
        type: "notification",
        method: "connected",
        params: {
          clientId,
          userId,
          timestamp: new Date().toISOString(),
          config: this.mcpProtocol.getChromeExtensionConfig(),
        },
      });

      ws.on("message", async (data: WebSocket.Data) => {
        try {
          // Rate limit messages
          if (!wsRateLimiter.canSendMessage(userId)) {
            this.send(ws, {
              type: "response",
              id: "rate-limit",
              error: {
                code: 429,
                message: "Message rate limit exceeded",
              },
            });
            return;
          }

          const message: MCPWebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(clientId, ws, message);
        } catch (error) {
          logger.error("[MCPWebSocket] Error handling message", { error });
          this.send(ws, {
            type: "response",
            id: "error",
            error: {
              code: -32700,
              message: "Parse error",
            },
          });
        }
      });

      ws.on("close", () => {
        logger.info("[MCPWebSocket] Client disconnected", { clientId });
        this.unsubscribeAll(clientId);
        this.clients.delete(clientId);
        this.subscriptions.delete(clientId);

        // Update tracking
        wsRateLimiter.untrackConnection(userId);
        activeWebsocketConnections.dec();
      });

      ws.on("error", (error) => {
        logger.error("[MCPWebSocket] Client error", { clientId, error });
      });
    });

    logger.info(
      "[MCPWebSocket] WebSocket server initialized on path /mcp with authentication",
    );
  }

  private async handleMessage(
    clientId: string,
    ws: WebSocket,
    message: MCPWebSocketMessage,
  ): Promise<void> {
    switch (message.type) {
      case "request":
        await this.handleRequest(ws, message);
        break;

      case "subscribe":
        await this.handleSubscribe(clientId, ws, message);
        break;

      case "unsubscribe":
        await this.handleUnsubscribe(clientId, ws, message);
        break;

      case "notification":
        await this.handleNotification(message);
        break;

      default:
        this.send(ws, {
          type: "response",
          id: message.id,
          error: {
            code: -32600,
            message: "Invalid request type",
          },
        });
    }
  }

  private async handleRequest(
    ws: WebSocket,
    message: MCPWebSocketMessage,
  ): Promise<void> {
    if (!message.method || !message.id) {
      this.send(ws, {
        type: "response",
        id: message.id || "unknown",
        error: {
          code: -32600,
          message: "Invalid request: missing method or id",
        },
      });
      return;
    }

    const request: MCPRequest = {
      id: message.id,
      method: message.method,
      params: message.params,
    };

    const response: MCPResponse = await this.mcpProtocol.handleRequest(request);

    this.send(ws, {
      type: "response",
      id: response.id,
      result: response.result,
      error: response.error,
    });
  }

  private async handleSubscribe(
    clientId: string,
    ws: WebSocket,
    message: MCPWebSocketMessage,
  ): Promise<void> {
    const { channel } = message.params || {};

    if (!channel) {
      this.send(ws, {
        type: "response",
        id: message.id,
        error: {
          code: -32602,
          message: "Invalid params: channel required",
        },
      });
      return;
    }

    const clientSubscriptions = this.subscriptions.get(clientId);
    if (clientSubscriptions) {
      clientSubscriptions.add(channel);
    }

    // Subscribe to message broker channel
    await this.messageBroker.subscribe(channel, (mcpMessage) => {
      if (this.clients.has(clientId)) {
        this.send(ws, {
          type: "notification",
          method: "message",
          params: {
            channel,
            message: mcpMessage,
          },
        });
      }
    });

    this.send(ws, {
      type: "response",
      id: message.id,
      result: {
        subscribed: true,
        channel,
      },
    });

    logger.info("[MCPWebSocket] Client subscribed to channel", {
      clientId,
      channel,
    });
  }

  private async handleUnsubscribe(
    clientId: string,
    ws: WebSocket,
    message: MCPWebSocketMessage,
  ): Promise<void> {
    const { channel } = message.params || {};

    if (!channel) {
      this.send(ws, {
        type: "response",
        id: message.id,
        error: {
          code: -32602,
          message: "Invalid params: channel required",
        },
      });
      return;
    }

    const clientSubscriptions = this.subscriptions.get(clientId);
    if (clientSubscriptions) {
      clientSubscriptions.delete(channel);
    }

    await this.messageBroker.unsubscribe(channel);

    this.send(ws, {
      type: "response",
      id: message.id,
      result: {
        unsubscribed: true,
        channel,
      },
    });

    logger.info("[MCPWebSocket] Client unsubscribed from channel", {
      clientId,
      channel,
    });
  }

  private async handleNotification(
    message: MCPWebSocketMessage,
  ): Promise<void> {
    // Handle notifications from Chrome extension (e.g., user actions, events)
    if (message.method) {
      logger.info("[MCPWebSocket] Notification received", {
        method: message.method,
      });

      // Forward to appropriate handler or broadcast to agents
      if (message.params?.agentId) {
        await this.mcpProtocol.sendNotification(
          message.params.agentId,
          message.method,
          message.params,
        );
      }
    }
  }

  private unsubscribeAll(clientId: string): void {
    const clientSubscriptions = this.subscriptions.get(clientId);
    if (clientSubscriptions) {
      clientSubscriptions.forEach(async (channel) => {
        await this.messageBroker.unsubscribe(channel);
      });
    }
  }

  /**
   * Setup bridge between message broker and WebSocket clients
   */
  private setupProtocolBridge(): void {
    // Listen for status updates and forward to all connected clients
    this.mcpProtocol.registerNotificationHandler(
      "task_status_update",
      (params) => {
        this.broadcast({
          type: "notification",
          method: "task_status_update",
          params,
        });
      },
    );

    // Listen for task completions
    this.mcpProtocol.registerNotificationHandler("task_completed", (params) => {
      this.broadcast({
        type: "notification",
        method: "task_completed",
        params,
      });
    });

    // Listen for agent heartbeats
    this.mcpProtocol.registerNotificationHandler(
      "agent_heartbeat",
      (params) => {
        this.broadcast({
          type: "notification",
          method: "agent_heartbeat",
          params,
        });
      },
    );
  }

  /**
   * Send message to a specific client
   */
  private send(ws: WebSocket, message: MCPWebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: MCPWebSocketMessage): void {
    this.clients.forEach((ws) => {
      this.send(ws, message);
    });
  }

  /**
   * Get server statistics
   */
  getStats(): { clients: number; subscriptions: number } {
    let totalSubscriptions = 0;
    this.subscriptions.forEach((subs) => {
      totalSubscriptions += subs.size;
    });

    return {
      clients: this.clients.size,
      subscriptions: totalSubscriptions,
    };
  }

  /**
   * Close the WebSocket server
   */
  close(): void {
    this.wss.close(() => {
      logger.info("[MCPWebSocket] Server closed");
    });
  }
}

export default MCPWebSocketServer;
