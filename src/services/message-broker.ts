import Redis from "ioredis";
import { EventEmitter } from "events";

/**
 * Message Broker Service
 * Handles bidirectional communication between backend and MCP containers
 * Uses Redis pub/sub for real-time messaging
 */

export interface MCPMessage {
  id: string;
  type: "task" | "status" | "result" | "heartbeat" | "command" | "response";
  agentId: string;
  taskId?: string;
  payload: any;
  timestamp: Date;
  priority?: number;
}

export interface TaskMessage extends MCPMessage {
  type: "task";
  taskId: string;
  payload: {
    workflowId?: string;
    action: string;
    params: any;
  };
}

export interface StatusMessage extends MCPMessage {
  type: "status";
  taskId: string;
  payload: {
    status: "pending" | "running" | "completed" | "failed" | "retry";
    progress?: number;
    message?: string;
  };
}

export interface ResultMessage extends MCPMessage {
  type: "result";
  taskId: string;
  payload: {
    success: boolean;
    data?: any;
    error?: string;
    duration?: number;
  };
}

class MessageBroker extends EventEmitter {
  private redisPublisher: Redis | null = null;
  private redisSubscriber: Redis | null = null;
  private isConnected: boolean = false;
  private isRedisEnabled: boolean = false;
  private channels: Map<string, Set<(...args: any[]) => void>> = new Map();
  private messageQueue: Map<string, MCPMessage[]> = new Map(); // In-memory fallback

  constructor() {
    super();

    // Only initialize Redis if explicitly enabled
    this.isRedisEnabled = process.env.REDIS_ENABLED === "true";

    if (this.isRedisEnabled) {
      const redisConfig = {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn(
              "[MessageBroker] Redis connection failed, switching to in-memory mode",
            );
            this.isRedisEnabled = false;
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Don't connect immediately
      };

      try {
        this.redisPublisher = new Redis(redisConfig);
        this.redisSubscriber = new Redis(redisConfig);
        this.setupConnectionHandlers();
        this.setupMessageHandlers();

        // Attempt to connect
        this.connect().catch((error) => {
          console.warn(
            "[MessageBroker] Failed to connect to Redis, using in-memory fallback:",
            error.message,
          );
          this.isRedisEnabled = false;
        });
      } catch (error) {
        console.warn(
          "[MessageBroker] Redis initialization failed, using in-memory fallback:",
          (error as Error).message,
        );
        this.isRedisEnabled = false;
      }
    } else {
      console.log(
        "[MessageBroker] Redis disabled, using in-memory message queue",
      );
      this.isConnected = true; // Mark as "connected" for in-memory mode
    }
  }

  private async connect(): Promise<void> {
    if (this.redisPublisher && this.redisSubscriber) {
      await Promise.all([
        this.redisPublisher.connect(),
        this.redisSubscriber.connect(),
      ]);
    }
  }

  private setupConnectionHandlers(): void {
    if (!this.redisPublisher || !this.redisSubscriber) return;

    this.redisPublisher.on("connect", () => {
      console.log("[MessageBroker] Publisher connected to Redis");
    });

    this.redisSubscriber.on("connect", () => {
      console.log("[MessageBroker] Subscriber connected to Redis");
      this.isConnected = true;
    });

    this.redisPublisher.on("error", (err) => {
      console.error("[MessageBroker] Publisher error:", err.message);
      // Don't emit error to prevent uncaught exceptions in tests
      if (this.listenerCount("error") > 0) {
        this.emit("error", err);
      }
    });

    this.redisSubscriber.on("error", (err) => {
      console.error("[MessageBroker] Subscriber error:", err.message);
      // Don't emit error to prevent uncaught exceptions in tests
      if (this.listenerCount("error") > 0) {
        this.emit("error", err);
      }
    });

    this.redisSubscriber.on("close", () => {
      console.log("[MessageBroker] Subscriber connection closed");
      this.isConnected = false;
    });
  }

  private setupMessageHandlers(): void {
    if (!this.redisSubscriber) return;

    this.redisSubscriber.on("message", (channel: string, message: string) => {
      try {
        const parsedMessage: MCPMessage = JSON.parse(message);
        this.handleMessage(channel, parsedMessage);
      } catch (error) {
        console.error("[MessageBroker] Error parsing message:", error);
      }
    });

    this.redisSubscriber.on(
      "pmessage",
      (pattern: string, channel: string, message: string) => {
        try {
          const parsedMessage: MCPMessage = JSON.parse(message);
          this.handleMessage(channel, parsedMessage);
        } catch (error) {
          console.error(
            "[MessageBroker] Error parsing pattern message:",
            error,
          );
        }
      },
    );
  }

  private handleMessage(channel: string, message: MCPMessage): void {
    const handlers = this.channels.get(channel);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }

    // Emit to generic event listeners
    this.emit("message", channel, message);
    this.emit(`message:${message.type}`, message);
    this.emit(`agent:${message.agentId}`, message);
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: MCPMessage): Promise<void> {
    try {
      const messageStr = JSON.stringify(message);

      if (this.isRedisEnabled && this.redisPublisher) {
        await this.redisPublisher.publish(channel, messageStr);
        console.log(
          "[MessageBroker] Published to Redis %s:",
          channel,
          message.type,
        );
      } else {
        // In-memory fallback
        if (!this.messageQueue.has(channel)) {
          this.messageQueue.set(channel, []);
        }
        this.messageQueue.get(channel)!.push(message);
        console.log(
          `[MessageBroker] Queued in-memory ${channel}:`,
          message.type,
        );

        // Immediately deliver to subscribers
        this.handleMessage(channel, message);
      }
    } catch (error) {
      console.error("[MessageBroker] Error publishing message:", error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(
    channel: string,
    handler: (message: MCPMessage) => void,
  ): Promise<void> {
    try {
      if (!this.channels.has(channel)) {
        this.channels.set(channel, new Set());

        if (this.isRedisEnabled && this.redisSubscriber) {
          await this.redisSubscriber.subscribe(channel);
          console.log(
            `[MessageBroker] Subscribed to Redis channel: ${channel}`,
          );
        } else {
          console.log(
            `[MessageBroker] Subscribed to in-memory channel: ${channel}`,
          );
        }
      }

      this.channels.get(channel)?.add(handler);
    } catch (error) {
      console.error("[MessageBroker] Error subscribing:", error);
      // Don't throw - allow in-memory fallback
      if (!this.channels.has(channel)) {
        this.channels.set(channel, new Set());
      }
      this.channels.get(channel)?.add(handler);
    }
  }

  /**
   * Subscribe to a pattern
   */
  async psubscribe(
    pattern: string,
    handler: (message: MCPMessage) => void,
  ): Promise<void> {
    try {
      if (this.isRedisEnabled && this.redisSubscriber) {
        await this.redisSubscriber.psubscribe(pattern);
        console.log(`[MessageBroker] Subscribed to Redis pattern: ${pattern}`);
      } else {
        console.log(
          `[MessageBroker] Pattern subscription not available in in-memory mode: ${pattern}`,
        );
      }

      this.channels.set(pattern, this.channels.get(pattern) || new Set());
      this.channels.get(pattern)?.add(handler);
    } catch (error) {
      console.error("[MessageBroker] Error pattern subscribing:", error);
      // Allow in-memory fallback
      this.channels.set(pattern, this.channels.get(pattern) || new Set());
      this.channels.get(pattern)?.add(handler);
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(
    channel: string,
    handler?: (message: MCPMessage) => void,
  ): Promise<void> {
    try {
      if (handler) {
        this.channels.get(channel)?.delete(handler);
        if (this.channels.get(channel)?.size === 0) {
          if (this.isRedisEnabled && this.redisSubscriber) {
            await this.redisSubscriber.unsubscribe(channel);
          }
          this.channels.delete(channel);
          console.log(`[MessageBroker] Unsubscribed from channel: ${channel}`);
        }
      } else {
        if (this.isRedisEnabled && this.redisSubscriber) {
          await this.redisSubscriber.unsubscribe(channel);
        }
        this.channels.delete(channel);
        console.log(
          `[MessageBroker] Unsubscribed all from channel: ${channel}`,
        );
      }
    } catch (error) {
      console.error("[MessageBroker] Error unsubscribing:", error);
      // Clean up locally even if Redis fails
      if (handler) {
        this.channels.get(channel)?.delete(handler);
      } else {
        this.channels.delete(channel);
      }
    }
  }

  /**
   * Send a task to an agent
   */
  async sendTask(agentId: string, task: TaskMessage): Promise<void> {
    const channel = `agent:${agentId}:tasks`;
    await this.publish(channel, task);
  }

  /**
   * Send a command to an agent
   */
  async sendCommand(
    agentId: string,
    command: string,
    params: any = {},
  ): Promise<void> {
    const message: MCPMessage = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "command",
      agentId,
      payload: { command, params },
      timestamp: new Date(),
    };

    const channel = `agent:${agentId}:commands`;
    await this.publish(channel, message);
  }

  /**
   * Listen for status updates from agents
   */
  async listenForStatus(
    callback: (message: StatusMessage) => void,
  ): Promise<void> {
    await this.psubscribe("agent:*:status", callback as any);
  }

  /**
   * Listen for results from agents
   */
  async listenForResults(
    callback: (message: ResultMessage) => void,
  ): Promise<void> {
    await this.psubscribe("agent:*:results", callback as any);
  }

  /**
   * Listen for heartbeats from all agents
   */
  async listenForHeartbeats(
    callback: (message: MCPMessage) => void,
  ): Promise<void> {
    await this.psubscribe("agent:*:heartbeat", callback as any);
  }

  /**
   * Request/response pattern for synchronous communication
   */
  async request(
    agentId: string,
    payload: any,
    timeout: number = 30000,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const responseChannel = `agent:${agentId}:response:${requestId}`;

      const timeoutHandle = setTimeout(() => {
        this.unsubscribe(responseChannel);
        reject(new Error("Request timeout"));
      }, timeout);

      const handler = (message: MCPMessage) => {
        if (message.type === "response") {
          clearTimeout(timeoutHandle);
          this.unsubscribe(responseChannel, handler);
          resolve(message.payload);
        }
      };

      this.subscribe(responseChannel, handler)
        .then(() => {
          const message: MCPMessage = {
            id: requestId,
            type: "command",
            agentId,
            payload: { ...payload, responseChannel },
            timestamp: new Date(),
          };

          return this.publish(`agent:${agentId}:commands`, message);
        })
        .catch(reject);
    });
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcast(message: MCPMessage): Promise<void> {
    await this.publish("agents:broadcast", message);
  }

  /**
   * Get Redis connection status
   */
  isHealthy(): boolean {
    if (this.isRedisEnabled) {
      return (
        this.isConnected &&
        this.redisPublisher?.status === "ready" &&
        this.redisSubscriber?.status === "ready"
      );
    }
    // In-memory mode is always healthy when connected
    return this.isConnected;
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    if (this.redisPublisher) {
      await this.redisPublisher.quit();
    }
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }
    this.isConnected = false;
    console.log("[MessageBroker] Connections closed");
  }

  /**
   * Get statistics
   */
  getStats(): { channels: number; connected: boolean } {
    return {
      channels: this.channels.size,
      connected: this.isConnected,
    };
  }

  /**
   * Get broker status including Redis availability
   */
  getStatus(): { connected: boolean; redisEnabled: boolean; channels: number } {
    return {
      connected: this.isConnected,
      redisEnabled: this.isRedisEnabled,
      channels: this.channels.size,
    };
  }
}

// Singleton instance
let messageBrokerInstance: MessageBroker | null = null;

export function getMessageBroker(): MessageBroker {
  if (!messageBrokerInstance) {
    messageBrokerInstance = new MessageBroker();
  }
  return messageBrokerInstance;
}

export default MessageBroker;
