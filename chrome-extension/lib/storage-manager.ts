/**
 * Chrome Storage Manager
 * 
 * Wrapper around Chrome Storage API with type safety and error handling.
 * Provides both sync and local storage with automatic serialization.
 * 
 * @module chrome-extension/lib/storage-manager
 * @version 2.0.0
 */

export type StorageArea = 'sync' | 'local' | 'session';

export interface StorageData {
  [key: string]: any;
}

export interface StorageChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  area: StorageArea;
}

/**
 * Storage Manager for Chrome Extension
 */
export class StorageManager {
  private defaultArea: StorageArea = 'local';
  private listeners: Map<string, Set<(change: StorageChangeEvent) => void>> = new Map();

  constructor(defaultArea: StorageArea = 'local') {
    this.defaultArea = defaultArea;
    this.setupChangeListener();
  }

  /**
   * Setup storage change listener
   */
  private setupChangeListener(): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        Object.keys(changes).forEach(key => {
          const change = changes[key];
          const event: StorageChangeEvent = {
            key,
            oldValue: change.oldValue,
            newValue: change.newValue,
            area: areaName as StorageArea,
          };

          const keyListeners = this.listeners.get(key);
          if (keyListeners) {
            keyListeners.forEach(callback => callback(event));
          }

          const allListeners = this.listeners.get('*');
          if (allListeners) {
            allListeners.forEach(callback => callback(event));
          }
        });
      });
    }
  }

  /**
   * Get storage area
   */
  private getStorageArea(area?: StorageArea): chrome.storage.StorageArea {
    const areaName = area || this.defaultArea;
    
    if (typeof chrome === 'undefined' || !chrome.storage) {
      throw new Error('Chrome storage API not available');
    }

    switch (areaName) {
      case 'sync':
        return chrome.storage.sync;
      case 'session':
        return (chrome.storage as any).session || chrome.storage.local;
      case 'local':
      default:
        return chrome.storage.local;
    }
  }

  /**
   * Get item from storage
   */
  async get<T = any>(key: string, area?: StorageArea): Promise<T | null> {
    try {
      const storage = this.getStorageArea(area);
      const result = await storage.get(key);
      return result[key] !== undefined ? result[key] : null;
    } catch (error) {
      console.error(`Failed to get storage key "${key}":`, error);
      return null;
    }
  }

  /**
   * Get multiple items from storage
   */
  async getMultiple(keys: string[], area?: StorageArea): Promise<StorageData> {
    try {
      const storage = this.getStorageArea(area);
      const result = await storage.get(keys);
      return result;
    } catch (error) {
      console.error('Failed to get multiple storage keys:', error);
      return {};
    }
  }

  /**
   * Get all items from storage
   */
  async getAll(area?: StorageArea): Promise<StorageData> {
    try {
      const storage = this.getStorageArea(area);
      const result = await storage.get(null);
      return result;
    } catch (error) {
      console.error('Failed to get all storage items:', error);
      return {};
    }
  }

  /**
   * Set item in storage
   */
  async set(key: string, value: any, area?: StorageArea): Promise<void> {
    try {
      const storage = this.getStorageArea(area);
      await storage.set({ [key]: value });
    } catch (error) {
      console.error(`Failed to set storage key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Set multiple items in storage
   */
  async setMultiple(items: StorageData, area?: StorageArea): Promise<void> {
    try {
      const storage = this.getStorageArea(area);
      await storage.set(items);
    } catch (error) {
      console.error('Failed to set multiple storage items:', error);
      throw error;
    }
  }

  /**
   * Remove item from storage
   */
  async remove(key: string, area?: StorageArea): Promise<void> {
    try {
      const storage = this.getStorageArea(area);
      await storage.remove(key);
    } catch (error) {
      console.error(`Failed to remove storage key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Remove multiple items from storage
   */
  async removeMultiple(keys: string[], area?: StorageArea): Promise<void> {
    try {
      const storage = this.getStorageArea(area);
      await storage.remove(keys);
    } catch (error) {
      console.error('Failed to remove multiple storage keys:', error);
      throw error;
    }
  }

  /**
   * Clear all items from storage
   */
  async clear(area?: StorageArea): Promise<void> {
    try {
      const storage = this.getStorageArea(area);
      await storage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Check if key exists in storage
   */
  async has(key: string, area?: StorageArea): Promise<boolean> {
    const value = await this.get(key, area);
    return value !== null;
  }

  /**
   * Get storage usage (bytes)
   */
  async getBytesInUse(keys?: string | string[], area?: StorageArea): Promise<number> {
    try {
      const storage = this.getStorageArea(area);
      if (!storage.getBytesInUse) {
        return 0;
      }
      return await storage.getBytesInUse(keys);
    } catch (error) {
      console.error('Failed to get storage bytes in use:', error);
      return 0;
    }
  }

  /**
   * Watch for changes to a specific key
   */
  watch(key: string, callback: (change: StorageChangeEvent) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unwatch function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Watch for all storage changes
   */
  watchAll(callback: (change: StorageChangeEvent) => void): () => void {
    return this.watch('*', callback);
  }

  /**
   * Get or set with default value
   */
  async getOrSet<T = any>(
    key: string,
    defaultValue: T,
    area?: StorageArea
  ): Promise<T> {
    let value = await this.get<T>(key, area);
    if (value === null) {
      await this.set(key, defaultValue, area);
      value = defaultValue;
    }
    return value;
  }

  /**
   * Update existing value
   */
  async update<T = any>(
    key: string,
    updater: (current: T | null) => T,
    area?: StorageArea
  ): Promise<T> {
    const current = await this.get<T>(key, area);
    const updated = updater(current);
    await this.set(key, updated, area);
    return updated;
  }

  /**
   * Increment numeric value
   */
  async increment(key: string, amount = 1, area?: StorageArea): Promise<number> {
    return this.update<number>(
      key,
      (current) => (current || 0) + amount,
      area
    );
  }

  /**
   * Decrement numeric value
   */
  async decrement(key: string, amount = 1, area?: StorageArea): Promise<number> {
    return this.increment(key, -amount, area);
  }

  /**
   * Toggle boolean value
   */
  async toggle(key: string, area?: StorageArea): Promise<boolean> {
    return this.update<boolean>(
      key,
      (current) => !current,
      area
    );
  }

  /**
   * Add to array
   */
  async push<T = any>(key: string, item: T, area?: StorageArea): Promise<T[]> {
    return this.update<T[]>(
      key,
      (current) => [...(current || []), item],
      area
    );
  }

  /**
   * Remove from array
   */
  async pull<T = any>(
    key: string,
    predicate: (item: T) => boolean,
    area?: StorageArea
  ): Promise<T[]> {
    return this.update<T[]>(
      key,
      (current) => (current || []).filter((item) => !predicate(item)),
      area
    );
  }

  /**
   * Merge object
   */
  async merge(key: string, value: Record<string, any>, area?: StorageArea): Promise<Record<string, any>> {
    return this.update<Record<string, any>>(
      key,
      (current) => ({ ...(current || {}), ...value }),
      area
    );
  }
}

/**
 * Singleton instance
 */
let storageInstance: StorageManager | null = null;

/**
 * Get storage manager instance
 */
export function getStorageManager(): StorageManager {
  if (!storageInstance) {
    storageInstance = new StorageManager();
  }
  return storageInstance;
}
