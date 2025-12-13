/**
 * Workstation Chrome Extension - Configuration
 * 
 * Centralized configuration for backend URL and other settings.
 * This file provides environment-aware defaults and allows runtime configuration.
 * 
 * @version 2.1.0
 */

/**
 * Default backend URLs to try during auto-discovery
 * Ordered by priority (most likely first)
 */
export const BACKEND_DISCOVERY_URLS = [
  'http://localhost:7042',    // Default Workstation port
  'http://127.0.0.1:7042',
  'http://localhost:3000',    // Alternative port
  'http://127.0.0.1:3000',
  'http://localhost:8080',    // Common alternative
  'http://127.0.0.1:8080'
];

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  // Backend URL - defaults to localhost:7042 for local development
  // Can be overridden through extension settings
  backendUrl: 'http://localhost:7042',
  
  // WebSocket configuration
  enableWebSocket: true,
  wsReconnectDelay: 5000,
  
  // Polling configuration
  pollInterval: 2000,
  
  // Retry configuration
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  
  // Timeout configuration
  requestTimeout: 30000,
  
  // Feature flags
  features: {
    autoUpdate: true,
    errorReporting: true,
    mcpSync: true,
    performanceMonitoring: true,
    contextLearning: true
  }
};

/**
 * Configuration manager for the Chrome extension
 */
export class ConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.listeners = new Set();
  }

  /**
   * Initialize configuration from Chrome storage
   */
  async initialize() {
    try {
      const stored = await chrome.storage.local.get('workstationConfig');
      if (stored.workstationConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...stored.workstationConfig
        };
      }
      console.log('[Config] Initialized with backend URL:', this.config.backendUrl);
      return this.config;
    } catch (error) {
      console.error('[Config] Failed to load from storage:', error);
      return this.config;
    }
  }

  /**
   * Get configuration value
   */
  get(key) {
    return key ? this.config[key] : this.config;
  }

  /**
   * Set configuration value(s)
   */
  async set(updates) {
    this.config = {
      ...this.config,
      ...updates
    };

    try {
      await chrome.storage.local.set({ workstationConfig: this.config });
      this.notifyListeners(updates);
      console.log('[Config] Updated:', updates);
      return this.config;
    } catch (error) {
      console.error('[Config] Failed to save to storage:', error);
      throw error;
    }
  }

  /**
   * Set backend URL
   */
  async setBackendUrl(url) {
    // Validate and normalize URL
    try {
      const urlObj = new URL(url);
      const normalizedUrl = urlObj.origin;
      await this.set({ backendUrl: normalizedUrl });
      return normalizedUrl;
    } catch (error) {
      throw new Error(`Invalid backend URL: ${url}`);
    }
  }

  /**
   * Get backend URL
   */
  getBackendUrl() {
    return this.config.backendUrl;
  }

  /**
   * Reset to default configuration
   */
  async reset() {
    this.config = { ...DEFAULT_CONFIG };
    await chrome.storage.local.set({ workstationConfig: this.config });
    this.notifyListeners(this.config);
    console.log('[Config] Reset to defaults');
    return this.config;
  }

  /**
   * Add configuration change listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of configuration changes
   */
  notifyListeners(updates) {
    this.listeners.forEach(listener => {
      try {
        listener(updates, this.config);
      } catch (error) {
        console.error('[Config] Listener error:', error);
      }
    });
  }

  /**
   * Export configuration for debugging
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration (for restoration or migration)
   */
  async import(configJson) {
    try {
      const imported = typeof configJson === 'string' 
        ? JSON.parse(configJson) 
        : configJson;
      
      await this.set(imported);
      return this.config;
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error.message}`);
    }
  }
}

/**
 * Singleton instance
 */
let configManagerInstance = null;

/**
 * Get or create configuration manager instance
 */
export function getConfigManager() {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager();
  }
  return configManagerInstance;
}

/**
 * Quick access to backend URL (for backward compatibility)
 */
export async function getBackendUrl() {
  const config = getConfigManager();
  await config.initialize();
  return config.getBackendUrl();
}

/**
 * Quick access to set backend URL (for backward compatibility)
 */
export async function setBackendUrl(url) {
  const config = getConfigManager();
  return await config.setBackendUrl(url);
}
