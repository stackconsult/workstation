/**
 * WebSocket Client for Real-Time Workflow Preview
 *
 * Provides WebSocket connection for real-time workflow execution updates
 * and live preview of workflow changes.
 *
 * @module ui/workflow-builder/websocket-client
 * @version 2.0.0
 */

import { logger } from "../../shared/utils/logger.js";

export type WebSocketMessageType =
  | "execution.started"
  | "execution.updated"
  | "execution.completed"
  | "execution.failed"
  | "step.started"
  | "step.completed"
  | "step.failed";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  executionId: string;
  data: any;
  timestamp: string;
}

export type MessageCallback = (message: WebSocketMessage) => void;

/**
 * WebSocket Client Class
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(url?: string) {
    this.url = url || this.getWebSocketUrl();
  }

  /**
   * Get WebSocket URL from current location
   */
  private getWebSocketUrl(): string {
    if (typeof window === "undefined") {
      return "ws://localhost:3000/ws";
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        logger.info("Connecting to WebSocket", { url: this.url });

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          logger.info("WebSocket connected");
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyConnectionCallbacks(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error("Failed to parse WebSocket message", {
              error: (error as Error).message,
            });
          }
        };

        this.ws.onerror = (error) => {
          logger.error("WebSocket error", { error });
          reject(error);
        };

        this.ws.onclose = () => {
          logger.info("WebSocket disconnected");
          this.stopHeartbeat();
          this.notifyConnectionCallbacks(false);
          this.attemptReconnect();
        };
      } catch (error) {
        logger.error("Failed to create WebSocket connection", {
          error: (error as Error).message,
        });
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
      logger.info("WebSocket disconnected manually");
    }
  }

  /**
   * Subscribe to execution updates
   */
  subscribeToExecution(executionId: string): void {
    this.send({
      type: "subscribe",
      executionId,
    });
  }

  /**
   * Unsubscribe from execution updates
   */
  unsubscribeFromExecution(executionId: string): void {
    this.send({
      type: "unsubscribe",
      executionId,
    });
  }

  /**
   * Send message to server
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      logger.warn("WebSocket not connected, cannot send message");
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    logger.debug("WebSocket message received", {
      type: message.type,
      executionId: message.executionId,
    });

    this.messageCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        logger.error("Error in message callback", {
          error: (error as Error).message,
        });
      }
    });
  }

  /**
   * Add message listener
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  /**
   * Add connection status listener
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * Notify connection callbacks
   */
  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        logger.error("Error in connection callback", {
          error: (error as Error).message,
        });
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info("Attempting to reconnect", {
      attempt: this.reconnectAttempts,
      delay,
    });

    setTimeout(() => {
      this.connect().catch((error) => {
        logger.error("Reconnection failed", { error });
      });
    }, delay);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: "ping" });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(): "connecting" | "open" | "closing" | "closed" {
    if (!this.ws) {
      return "closed";
    }

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "open";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
      default:
        return "closed";
    }
  }
}

/**
 * Singleton instance
 */
let wsClientInstance: WebSocketClient | null = null;

/**
 * Get WebSocket client instance
 */
export function getWebSocketClient(url?: string): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient(url);
  }
  return wsClientInstance;
}

/**
 * React hook for WebSocket connection
 */
export function useWebSocket(url?: string) {
  const client = getWebSocketClient(url);

  return {
    connect: () => client.connect(),
    disconnect: () => client.disconnect(),
    subscribeToExecution: (executionId: string) =>
      client.subscribeToExecution(executionId),
    unsubscribeFromExecution: (executionId: string) =>
      client.unsubscribeFromExecution(executionId),
    onMessage: (callback: MessageCallback) => client.onMessage(callback),
    onConnectionChange: (callback: (connected: boolean) => void) =>
      client.onConnectionChange(callback),
    isConnected: () => client.isConnected(),
    getConnectionState: () => client.getConnectionState(),
  };
}
