/**
 * Event Emitter for Cross-Context Messaging
 * 
 * Lightweight event emitter for communication between background, content scripts,
 * and popup. Provides type-safe event handling with Chrome message passing.
 * 
 * @module chrome-extension/lib/event-emitter
 * @version 2.0.0
 */

export type EventCallback<T = any> = (data: T) => void;

export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Event Emitter Class
 */
export class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();
  private maxListeners = 10;

  /**
   * Register event listener
   */
  on<T = any>(event: string, callback: EventCallback<T>): EventSubscription {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const listeners = this.events.get(event)!;
    
    // Warn if too many listeners
    if (listeners.size >= this.maxListeners) {
      console.warn(
        `Possible EventEmitter memory leak detected. ${listeners.size + 1} listeners added for event "${event}". ` +
        `Use setMaxListeners() to increase limit.`
      );
    }

    listeners.add(callback);

    return {
      unsubscribe: () => this.off(event, callback),
    };
  }

  /**
   * Register one-time event listener
   */
  once<T = any>(event: string, callback: EventCallback<T>): EventSubscription {
    const wrappedCallback = (data: T) => {
      callback(data);
      this.off(event, wrappedCallback);
    };
    return this.on(event, wrappedCallback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: EventCallback): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Emit event to all listeners
   */
  emit<T = any>(event: string, data: T): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Emit event asynchronously
   */
  async emitAsync<T = any>(event: string, data: T): Promise<void> {
    const listeners = this.events.get(event);
    if (listeners) {
      const promises = Array.from(listeners).map(callback =>
        Promise.resolve().then(() => callback(data))
      );
      await Promise.all(promises).catch(error => {
        console.error(`Error in async event listener for "${event}":`, error);
      });
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * Get all event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Set maximum listeners per event
   */
  setMaxListeners(max: number): void {
    this.maxListeners = max;
  }

  /**
   * Get maximum listeners
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }
}

/**
 * Chrome Message Emitter
 * Extends EventEmitter with Chrome message passing capabilities
 */
export class ChromeMessageEmitter extends EventEmitter {
  private messageHandlerSetup = false;

  constructor() {
    super();
    this.setupMessageHandler();
  }

  /**
   * Setup Chrome runtime message handler
   */
  private setupMessageHandler(): void {
    if (this.messageHandlerSetup || typeof chrome === 'undefined' || !chrome.runtime) {
      return;
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type && message.type.startsWith('event:')) {
        const eventName = message.type.substring(6); // Remove 'event:' prefix
        this.emit(eventName, {
          data: message.data,
          sender,
        });

        // Send acknowledgment
        sendResponse({ received: true });
      }
      return true; // Keep message channel open for async responses
    });

    this.messageHandlerSetup = true;
  }

  /**
   * Send message to other contexts (background, content, popup)
   */
  async sendMessage<T = any>(
    event: string,
    data: T,
    options?: {
      tabId?: number;
      frameId?: number;
    }
  ): Promise<any> {
    const message = {
      type: `event:${event}`,
      data,
      timestamp: Date.now(),
    };

    try {
      if (options?.tabId !== undefined) {
        // Send to specific tab
        return await chrome.tabs.sendMessage(
          options.tabId,
          message,
          options.frameId !== undefined ? { frameId: options.frameId } : undefined
        );
      } else {
        // Send to background/extension
        return await chrome.runtime.sendMessage(message);
      }
    } catch (error) {
      console.error(`Failed to send message for event "${event}":`, error);
      throw error;
    }
  }

  /**
   * Broadcast message to all tabs
   */
  async broadcast<T = any>(event: string, data: T): Promise<void> {
    const message = {
      type: `event:${event}`,
      data,
      timestamp: Date.now(),
    };

    try {
      const tabs = await chrome.tabs.query({});
      await Promise.all(
        tabs.map(tab =>
          tab.id ? chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Ignore errors for tabs that can't receive messages
          }) : Promise.resolve()
        )
      );
    } catch (error) {
      console.error(`Failed to broadcast event "${event}":`, error);
      throw error;
    }
  }

  /**
   * Send message to active tab
   */
  async sendToActiveTab<T = any>(event: string, data: T): Promise<any> {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id) {
        throw new Error('No active tab found');
      }
      return this.sendMessage(event, data, { tabId: activeTab.id });
    } catch (error) {
      console.error(`Failed to send message to active tab for event "${event}":`, error);
      throw error;
    }
  }
}

/**
 * Global event bus for cross-context communication
 */
let globalEventBus: ChromeMessageEmitter | null = null;

/**
 * Get global event bus instance
 */
export function getEventBus(): ChromeMessageEmitter {
  if (!globalEventBus) {
    globalEventBus = new ChromeMessageEmitter();
  }
  return globalEventBus;
}

/**
 * Create a namespaced event emitter
 */
export function createNamespacedEmitter(namespace: string): {
  on: <T = any>(event: string, callback: EventCallback<T>) => EventSubscription;
  once: <T = any>(event: string, callback: EventCallback<T>) => EventSubscription;
  emit: <T = any>(event: string, data: T) => void;
  off: (event: string, callback: EventCallback) => void;
} {
  const emitter = new EventEmitter();
  const prefix = `${namespace}:`;

  return {
    on: <T = any>(event: string, callback: EventCallback<T>) =>
      emitter.on(`${prefix}${event}`, callback),
    once: <T = any>(event: string, callback: EventCallback<T>) =>
      emitter.once(`${prefix}${event}`, callback),
    emit: <T = any>(event: string, data: T) =>
      emitter.emit(`${prefix}${event}`, data),
    off: (event: string, callback: EventCallback) =>
      emitter.off(`${prefix}${event}`, callback),
  };
}
