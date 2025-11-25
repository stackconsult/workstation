/**
 * Enhanced MCP Sync Manager
 * Synchronizes state between browser and local MCP
 * Prevents agentic flow disruption with persistence and recovery
 */

class MCPSyncManager {
  constructor() {
    this.syncState = new Map();
    this.pendingSync = new Map();
    this.conflictQueue = [];
    this.syncHistory = [];
    this.maxHistorySize = 1000;
    this.syncInterval = 5000; // 5 seconds
    this.offlineMode = false;
    this.lastSync = null;
  }

  /**
   * Initialize sync manager
   */
  async initialize() {
    try {
      // Load persisted state
      await this.loadPersistedState();

      // Start periodic sync
      this.startPeriodicSync();

      // Monitor online/offline status
      this.monitorConnectivity();

      console.log('[MCPSyncManager] Initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('[MCPSyncManager] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load persisted state from storage
   */
  async loadPersistedState() {
    try {
      const result = await chrome.storage.local.get(['mcpSyncState', 'mcpSyncHistory']);
      
      if (result.mcpSyncState) {
        const stateArray = result.mcpSyncState;
        for (const [key, value] of stateArray) {
          this.syncState.set(key, value);
        }
        console.log(`[MCPSyncManager] Loaded ${this.syncState.size} state entries`);
      }

      if (result.mcpSyncHistory) {
        this.syncHistory = result.mcpSyncHistory;
        console.log(`[MCPSyncManager] Loaded ${this.syncHistory.length} history entries`);
      }
    } catch (error) {
      console.error('[MCPSyncManager] Failed to load persisted state:', error);
    }
  }

  /**
   * Persist state to storage
   */
  async persistState() {
    try {
      const stateArray = Array.from(this.syncState.entries());
      const historySlice = this.syncHistory.slice(0, this.maxHistorySize);

      await chrome.storage.local.set({
        mcpSyncState: stateArray,
        mcpSyncHistory: historySlice
      });

      return { success: true };
    } catch (error) {
      console.error('[MCPSyncManager] Failed to persist state:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update state and sync
   */
  async updateState(key, value, source = 'browser') {
    const previousValue = this.syncState.get(key);
    const timestamp = Date.now();

    const stateEntry = {
      key,
      value,
      source,
      timestamp,
      previousValue,
      synced: false
    };

    this.syncState.set(key, stateEntry);

    // Add to sync queue
    this.pendingSync.set(key, stateEntry);

    // Record history
    this.addToHistory({
      action: 'update',
      key,
      value,
      source,
      timestamp
    });

    // Trigger immediate sync if online
    if (!this.offlineMode) {
      await this.syncNow();
    }

    return { success: true, stateEntry };
  }

  /**
   * Get state value
   */
  getState(key) {
    const entry = this.syncState.get(key);
    return entry ? entry.value : null;
  }

  /**
   * Get all state
   */
  getAllState() {
    const state = {};
    for (const [key, entry] of this.syncState.entries()) {
      state[key] = entry.value;
    }
    return state;
  }

  /**
   * Sync now (immediate sync)
   */
  async syncNow() {
    if (this.offlineMode || this.pendingSync.size === 0) {
      return { success: true, synced: 0 };
    }

    const syncItems = Array.from(this.pendingSync.entries());
    let synced = 0;
    const errors = [];

    for (const [key, entry] of syncItems) {
      try {
        const result = await this.syncToMCP(key, entry);
        
        if (result.success) {
          entry.synced = true;
          entry.syncedAt = Date.now();
          this.syncState.set(key, entry);
          this.pendingSync.delete(key);
          synced++;
        } else {
          errors.push({ key, error: result.error });
        }
      } catch (error) {
        errors.push({ key, error: error.message });
        console.error(`[MCPSyncManager] Failed to sync ${key}:`, error);
      }
    }

    this.lastSync = Date.now();

    // Persist state after sync
    await this.persistState();

    return {
      success: errors.length === 0,
      synced,
      pending: this.pendingSync.size,
      errors
    };
  }

  /**
   * Sync state to MCP backend
   */
  async syncToMCP(key, entry) {
    try {
      // Send to MCP via message passing
      const response = await chrome.runtime.sendMessage({
        action: 'mcpSync',
        operation: 'update',
        key,
        value: entry.value,
        source: entry.source,
        timestamp: entry.timestamp
      });

      if (response && response.success) {
        return { success: true };
      } else {
        return { success: false, error: response?.error || 'Unknown error' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle incoming sync from MCP
   */
  async handleIncomingSync(key, value, timestamp, source = 'mcp') {
    const currentEntry = this.syncState.get(key);

    // Check for conflicts
    if (currentEntry && currentEntry.timestamp > timestamp) {
      // Local state is newer - conflict detected
      this.detectConflict(key, currentEntry, { value, timestamp, source });
      return { success: false, conflict: true };
    }

    // Update local state
    const stateEntry = {
      key,
      value,
      source,
      timestamp,
      synced: true,
      syncedAt: Date.now()
    };

    this.syncState.set(key, stateEntry);

    // Record history
    this.addToHistory({
      action: 'sync_receive',
      key,
      value,
      source,
      timestamp
    });

    // Persist
    await this.persistState();

    return { success: true };
  }

  /**
   * Detect and handle conflict
   */
  detectConflict(key, localEntry, remoteEntry) {
    const conflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key,
      localEntry,
      remoteEntry,
      detectedAt: Date.now(),
      resolved: false
    };

    this.conflictQueue.push(conflict);

    console.warn(`[MCPSyncManager] Conflict detected for key: ${key}`);

    // Emit conflict event
    this.emitEvent('conflict', conflict);

    return conflict;
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(conflictId, resolution = 'local') {
    const conflict = this.conflictQueue.find(c => c.id === conflictId);
    
    if (!conflict) {
      return { success: false, error: 'Conflict not found' };
    }

    const entry = resolution === 'local' 
      ? conflict.localEntry 
      : conflict.remoteEntry;

    // Update state with resolved value
    this.syncState.set(conflict.key, {
      ...entry,
      resolvedAt: Date.now(),
      resolution
    });

    // Mark as resolved
    conflict.resolved = true;
    conflict.resolution = resolution;

    // Add to pending sync if resolved to local
    if (resolution === 'local') {
      this.pendingSync.set(conflict.key, entry);
    }

    // Record history
    this.addToHistory({
      action: 'conflict_resolved',
      conflictId,
      resolution,
      timestamp: Date.now()
    });

    // Persist
    await this.persistState();

    return { success: true, resolution };
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    setInterval(async () => {
      if (!this.offlineMode && this.pendingSync.size > 0) {
        await this.syncNow();
      }
    }, this.syncInterval);

    console.log(`[MCPSyncManager] Periodic sync started (interval: ${this.syncInterval}ms)`);
  }

  /**
   * Monitor connectivity
   */
  monitorConnectivity() {
    if (typeof navigator !== 'undefined') {
      // Check initial status
      this.offlineMode = !navigator.onLine;

      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('[MCPSyncManager] Connection restored, resuming sync');
        this.offlineMode = false;
        this.syncNow();
      });

      window.addEventListener('offline', () => {
        console.warn('[MCPSyncManager] Connection lost, entering offline mode');
        this.offlineMode = true;
      });
    }
  }

  /**
   * Add entry to history
   */
  addToHistory(entry) {
    this.syncHistory.unshift(entry);

    // Keep only recent history
    if (this.syncHistory.length > this.maxHistorySize) {
      this.syncHistory = this.syncHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get sync history
   */
  getHistory(limit = 50) {
    return this.syncHistory.slice(0, limit);
  }

  /**
   * Get unresolved conflicts
   */
  getConflicts() {
    return this.conflictQueue.filter(c => !c.resolved);
  }

  /**
   * Clear resolved conflicts
   */
  clearResolvedConflicts() {
    this.conflictQueue = this.conflictQueue.filter(c => !c.resolved);
    return { success: true, remaining: this.conflictQueue.length };
  }

  /**
   * Get sync statistics
   */
  getStats() {
    const unresolvedConflicts = this.getConflicts().length;
    const syncedEntries = Array.from(this.syncState.values()).filter(e => e.synced).length;

    return {
      totalEntries: this.syncState.size,
      syncedEntries,
      pendingSync: this.pendingSync.size,
      unresolvedConflicts,
      offlineMode: this.offlineMode,
      lastSync: this.lastSync,
      historySize: this.syncHistory.length,
      syncHealth: this.getSyncHealth()
    };
  }

  /**
   * Get sync health status
   */
  getSyncHealth() {
    const stats = this.getStats();
    let healthScore = 100;

    // Deduct for pending syncs
    if (stats.pendingSync > 10) {
      healthScore -= Math.min(30, stats.pendingSync * 2);
    }

    // Deduct for conflicts
    healthScore -= stats.unresolvedConflicts * 10;

    // Deduct for offline mode
    if (stats.offlineMode) {
      healthScore -= 20;
    }

    // Deduct if last sync was too long ago
    if (stats.lastSync && Date.now() - stats.lastSync > 60000) {
      healthScore -= 15;
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      score: healthScore,
      status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy'
    };
  }

  /**
   * Emit event
   */
  emitEvent(eventName, data) {
    // Use chrome.runtime to send messages
    chrome.runtime.sendMessage({
      type: 'mcpSync:event',
      event: eventName,
      data
    }).catch(() => {
      // Ignore if no listeners
    });
  }

  /**
   * Recovery: Force sync all state
   */
  async forceSyncAll() {
    console.log('[MCPSyncManager] Force syncing all state...');

    // Clear pending sync
    this.pendingSync.clear();

    // Add all entries to pending sync
    for (const [key, entry] of this.syncState.entries()) {
      this.pendingSync.set(key, entry);
    }

    // Sync now
    const result = await this.syncNow();

    return {
      ...result,
      totalEntries: this.syncState.size
    };
  }

  /**
   * Clear all state (use with caution)
   */
  async clearAll() {
    this.syncState.clear();
    this.pendingSync.clear();
    this.conflictQueue = [];
    this.syncHistory = [];

    await chrome.storage.local.remove(['mcpSyncState', 'mcpSyncHistory']);

    console.log('[MCPSyncManager] All state cleared');
    return { success: true };
  }
}

// Create singleton instance
const mcpSyncManager = new MCPSyncManager();

// Auto-initialize
mcpSyncManager.initialize().catch(console.error);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MCPSyncManager, mcpSyncManager };
}
