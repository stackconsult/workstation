/**
 * Workflow Builder WebSocket Client
 * Connects to backend WebSocket server for real-time execution updates
 */

class WorkflowWebSocketClient {
  constructor(options = {}) {
    this.url = options.url || 'ws://localhost:3000/ws/executions';
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 3000;
    this.subscriptions = new Map(); // executionId -> callback
    this.isConnected = false;
    this.isConnecting = false;

    // Callbacks
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onError = options.onError || console.error;
    this.onMessage = options.onMessage || (() => {});
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        console.log('WebSocket connected');
        this.onConnect();

        // Resubscribe to all previous subscriptions
        this.resubscribeAll();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isConnecting = false;
        console.log('WebSocket disconnected');
        this.onDisconnect();

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
          console.error('Max reconnection attempts reached');
          this.onError(new Error('WebSocket connection failed'));
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError(error);
      };
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to create WebSocket:', error);
      this.onError(error);
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    console.log('WebSocket message received:', message.type);

    switch (message.type) {
      case 'connected':
        console.log('Server connection confirmed');
        break;

      case 'subscribed':
        console.log(`Subscribed to execution: ${message.executionId}`);
        break;

      case 'execution_update':
        this.handleExecutionUpdate(message);
        break;

      case 'task_update':
        this.handleTaskUpdate(message);
        break;

      case 'execution_complete':
        this.handleExecutionComplete(message);
        break;

      case 'error':
        console.error('Server error:', message.error);
        this.onError(new Error(message.error));
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }

    // Call general message handler
    this.onMessage(message);
  }

  /**
   * Handle execution update
   */
  handleExecutionUpdate(message) {
    const callback = this.subscriptions.get(message.executionId);
    if (callback) {
      callback({
        type: 'status',
        data: message.data
      });
    }
  }

  /**
   * Handle task update
   */
  handleTaskUpdate(message) {
    const callback = this.subscriptions.get(message.executionId);
    if (callback) {
      callback({
        type: 'task',
        data: message.data
      });
    }
  }

  /**
   * Handle execution completion
   */
  handleExecutionComplete(message) {
    const callback = this.subscriptions.get(message.executionId);
    if (callback) {
      callback({
        type: 'complete',
        data: message.data
      });
    }
  }

  /**
   * Subscribe to execution updates
   */
  subscribe(executionId, callback) {
    this.subscriptions.set(executionId, callback);

    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        executionId
      });
    }
  }

  /**
   * Unsubscribe from execution updates
   */
  unsubscribe(executionId) {
    this.subscriptions.delete(executionId);

    if (this.isConnected) {
      this.send({
        type: 'unsubscribe',
        executionId
      });
    }
  }

  /**
   * Resubscribe to all active subscriptions (after reconnect)
   */
  resubscribeAll() {
    this.subscriptions.forEach((callback, executionId) => {
      this.send({
        type: 'subscribe',
        executionId
      });
    });
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    this.send({ type: 'ping' });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.isConnected = false;
    this.isConnecting = false;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      subscriptions: this.subscriptions.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkflowWebSocketClient;
}
if (typeof window !== 'undefined') {
  window.WorkflowWebSocketClient = WorkflowWebSocketClient;
}
