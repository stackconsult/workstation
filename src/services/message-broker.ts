import Redis from 'ioredis';
import { EventEmitter } from 'events';

/**
 * Message Broker Service
 * Handles bidirectional communication between backend and MCP containers
 * Uses Redis pub/sub for real-time messaging
 */

export interface MCPMessage {
  id: string;
  type: 'task' | 'status' | 'result' | 'heartbeat' | 'command' | 'response';
  agentId: string;
  taskId?: string;
  payload: any;
  timestamp: Date;
  priority?: number;
}

export interface TaskMessage extends MCPMessage {
  type: 'task';
  taskId: string;
  payload: {
    workflowId?: string;
    action: string;
    params: any;
  };
}

export interface StatusMessage extends MCPMessage {
  type: 'status';
  taskId: string;
  payload: {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'retry';
    progress?: number;
    message?: string;
  };
}

export interface ResultMessage extends MCPMessage {
  type: 'result';
  taskId: string;
  payload: {
    success: boolean;
    data?: any;
    error?: string;
    duration?: number;
  };
}

class MessageBroker extends EventEmitter {
  private redisPublisher: Redis;
  private redisSubscriber: Redis;
  private isConnected: boolean = false;
  private channels: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor() {
    super();
    
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    this.redisPublisher = new Redis(redisConfig);
    this.redisSubscriber = new Redis(redisConfig);

    this.setupConnectionHandlers();
    this.setupMessageHandlers();
  }

  private setupConnectionHandlers(): void {
    this.redisPublisher.on('connect', () => {
      console.log('[MessageBroker] Publisher connected to Redis');
    });

    this.redisSubscriber.on('connect', () => {
      console.log('[MessageBroker] Subscriber connected to Redis');
      this.isConnected = true;
    });

    this.redisPublisher.on('error', (err) => {
      console.error('[MessageBroker] Publisher error:', err);
      this.emit('error', err);
    });

    this.redisSubscriber.on('error', (err) => {
      console.error('[MessageBroker] Subscriber error:', err);
      this.emit('error', err);
    });

    this.redisSubscriber.on('close', () => {
      console.log('[MessageBroker] Subscriber connection closed');
      this.isConnected = false;
    });
  }

  private setupMessageHandlers(): void {
    this.redisSubscriber.on('message', (channel: string, message: string) => {
      try {
        const parsedMessage: MCPMessage = JSON.parse(message);
        this.handleMessage(channel, parsedMessage);
      } catch (error) {
        console.error('[MessageBroker] Error parsing message:', error);
      }
    });

    this.redisSubscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
      try {
        const parsedMessage: MCPMessage = JSON.parse(message);
        this.handleMessage(channel, parsedMessage);
      } catch (error) {
        console.error('[MessageBroker] Error parsing pattern message:', error);
      }
    });
  }

  private handleMessage(channel: string, message: MCPMessage): void {
    const handlers = this.channels.get(channel);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }

    // Emit to generic event listeners
    this.emit('message', channel, message);
    this.emit(`message:${message.type}`, message);
    this.emit(`agent:${message.agentId}`, message);
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: MCPMessage): Promise<void> {
    try {
      const messageStr = JSON.stringify(message);
      await this.redisPublisher.publish(channel, messageStr);
      console.log(`[MessageBroker] Published to ${channel}:`, message.type);
    } catch (error) {
      console.error('[MessageBroker] Error publishing message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, handler: (message: MCPMessage) => void): Promise<void> {
    try {
      if (!this.channels.has(channel)) {
        this.channels.set(channel, new Set());
        await this.redisSubscriber.subscribe(channel);
        console.log(`[MessageBroker] Subscribed to channel: ${channel}`);
      }
      
      this.channels.get(channel)?.add(handler);
    } catch (error) {
      console.error('[MessageBroker] Error subscribing:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a pattern
   */
  async psubscribe(pattern: string, handler: (message: MCPMessage) => void): Promise<void> {
    try {
      await this.redisSubscriber.psubscribe(pattern);
      this.channels.set(pattern, this.channels.get(pattern) || new Set());
      this.channels.get(pattern)?.add(handler);
      console.log(`[MessageBroker] Subscribed to pattern: ${pattern}`);
    } catch (error) {
      console.error('[MessageBroker] Error pattern subscribing:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string, handler?: (message: MCPMessage) => void): Promise<void> {
    try {
      if (handler) {
        this.channels.get(channel)?.delete(handler);
        if (this.channels.get(channel)?.size === 0) {
          await this.redisSubscriber.unsubscribe(channel);
          this.channels.delete(channel);
          console.log(`[MessageBroker] Unsubscribed from channel: ${channel}`);
        }
      } else {
        await this.redisSubscriber.unsubscribe(channel);
        this.channels.delete(channel);
        console.log(`[MessageBroker] Unsubscribed all from channel: ${channel}`);
      }
    } catch (error) {
      console.error('[MessageBroker] Error unsubscribing:', error);
      throw error;
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
  async sendCommand(agentId: string, command: string, params: any = {}): Promise<void> {
    const message: MCPMessage = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'command',
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
  async listenForStatus(callback: (message: StatusMessage) => void): Promise<void> {
    await this.psubscribe('agent:*:status', callback as any);
  }

  /**
   * Listen for results from agents
   */
  async listenForResults(callback: (message: ResultMessage) => void): Promise<void> {
    await this.psubscribe('agent:*:results', callback as any);
  }

  /**
   * Listen for heartbeats from all agents
   */
  async listenForHeartbeats(callback: (message: MCPMessage) => void): Promise<void> {
    await this.psubscribe('agent:*:heartbeat', callback as any);
  }

  /**
   * Request/response pattern for synchronous communication
   */
  async request(agentId: string, payload: any, timeout: number = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const responseChannel = `agent:${agentId}:response:${requestId}`;

      const timeoutHandle = setTimeout(() => {
        this.unsubscribe(responseChannel);
        reject(new Error('Request timeout'));
      }, timeout);

      const handler = (message: MCPMessage) => {
        if (message.type === 'response') {
          clearTimeout(timeoutHandle);
          this.unsubscribe(responseChannel, handler);
          resolve(message.payload);
        }
      };

      this.subscribe(responseChannel, handler).then(() => {
        const message: MCPMessage = {
          id: requestId,
          type: 'command',
          agentId,
          payload: { ...payload, responseChannel },
          timestamp: new Date(),
        };
        
        return this.publish(`agent:${agentId}:commands`, message);
      }).catch(reject);
    });
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcast(message: MCPMessage): Promise<void> {
    await this.publish('agents:broadcast', message);
  }

  /**
   * Get Redis connection status
   */
  isHealthy(): boolean {
    return this.isConnected && 
           this.redisPublisher.status === 'ready' && 
           this.redisSubscriber.status === 'ready';
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.redisPublisher.quit();
    await this.redisSubscriber.quit();
    this.isConnected = false;
    console.log('[MessageBroker] Connections closed');
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
