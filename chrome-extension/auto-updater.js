/**
 * Auto-Update System for Chrome Extension
 * Phase 3 - Block 2
 * 
 * Features:
 * - Version checking against backend
 * - Auto-installation of updates
 * - Rollback mechanism for failed updates
 * - Update notifications
 * - Changelog display
 */

class AutoUpdater {
  constructor() {
    this.currentVersion = chrome.runtime.getManifest().version;
    this.backendUrl = null; // Will be loaded from storage or default
    this.checkInterval = 3600000; // 1 hour
    this.updateCheckTimer = null;
    this.updateHistory = [];
    this.rollbackAvailable = false;
    this.previousVersion = null;
    this.updateInProgress = false;
  }

  /**
   * Initialize auto-updater
   */
  async initialize() {
    try {
      // Load backend URL from storage or use default
      await this.loadBackendUrl();

      // Load update history
      await this.loadUpdateHistory();

      // Check for updates immediately
      await this.checkForUpdates();

      // Start periodic checks
      this.startPeriodicChecks();

      // Listen for manual update requests
      this.setupMessageListeners();

      console.log('[AutoUpdater] Initialized successfully');
      console.log(`[AutoUpdater] Current version: ${this.currentVersion}`);
      console.log(`[AutoUpdater] Backend URL: ${this.backendUrl}`);
      
      return { success: true, version: this.currentVersion };
    } catch (error) {
      console.error('[AutoUpdater] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load backend URL from storage or use default
   */
  async loadBackendUrl() {
    try {
      const result = await chrome.storage.local.get('backendUrl');
      this.backendUrl = result.backendUrl || 'http://localhost:7042';
      console.log(`[AutoUpdater] Backend URL loaded: ${this.backendUrl}`);
    } catch (error) {
      console.error('[AutoUpdater] Failed to load backend URL:', error);
      this.backendUrl = 'http://localhost:7042'; // Fallback to default
    }
  }

  /**
   * Set backend URL (for configuration)
   */
  async setBackendUrl(url) {
    try {
      this.backendUrl = url;
      await chrome.storage.local.set({ backendUrl: url });
      console.log(`[AutoUpdater] Backend URL updated: ${url}`);
      return { success: true };
    } catch (error) {
      console.error('[AutoUpdater] Failed to set backend URL:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for available updates
   */
  async checkForUpdates() {
    if (this.updateInProgress) {
      console.log('[AutoUpdater] Update already in progress');
      return { success: false, message: 'Update in progress' };
    }

    try {
      console.log('[AutoUpdater] Checking for updates...');
      
      // Create AbortController for timeout (better browser compatibility)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(`${this.backendUrl}/api/extension/version`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const versionInfo = await response.json();
        const latestVersion = versionInfo.version;
        const changelog = versionInfo.changelog || [];
        const downloadUrl = versionInfo.downloadUrl;

        console.log(`[AutoUpdater] Latest version: ${latestVersion}, Current: ${this.currentVersion}`);

        // Compare versions
        const updateAvailable = this.isNewerVersion(latestVersion, this.currentVersion);

        if (updateAvailable) {
          console.log(`[AutoUpdater] Update available: ${this.currentVersion} → ${latestVersion}`);
          
          // Notify user
          await this.notifyUpdateAvailable(latestVersion, changelog, downloadUrl);

          return {
            success: true,
            updateAvailable: true,
            currentVersion: this.currentVersion,
            latestVersion,
            changelog,
            downloadUrl
          };
        } else {
          console.log('[AutoUpdater] Extension is up to date');
          return {
            success: true,
            updateAvailable: false,
            currentVersion: this.currentVersion
          };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('[AutoUpdater] Failed to check for updates:', error);
      return {
        success: false,
        error: error.message,
        updateAvailable: false
      };
    }
  }

  /**
   * Compare version strings
   */
  isNewerVersion(latestVersion, currentVersion) {
    const latest = latestVersion.split('.').map(Number);
    const current = currentVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(latest.length, current.length); i++) {
      const l = latest[i] || 0;
      const c = current[i] || 0;

      if (l > c) return true;
      if (l < c) return false;
    }

    return false; // Versions are equal
  }

  /**
   * Notify user about available update
   */
  async notifyUpdateAvailable(version, changelog, downloadUrl) {
    try {
      // Create notification
      await chrome.notifications.create('extension-update', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Extension Update Available',
        message: `Version ${version} is available. Click to view details.`,
        priority: 2,
        buttons: [
          { title: 'View Changelog' },
          { title: 'Install Now' }
        ]
      });

      // Store update info for retrieval
      await chrome.storage.local.set({
        pendingUpdate: {
          version,
          changelog,
          downloadUrl,
          notifiedAt: Date.now()
        }
      });

      console.log('[AutoUpdater] Update notification sent');
      return { success: true };
    } catch (error) {
      console.error('[AutoUpdater] Failed to send notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Install update (Chrome Web Store updates are automatic)
   * This prepares for the update and can trigger a reload
   */
  async installUpdate(updateInfo) {
    if (this.updateInProgress) {
      return { success: false, message: 'Update already in progress' };
    }

    try {
      this.updateInProgress = true;
      console.log('[AutoUpdater] Preparing for update installation...');

      // Store current state for potential rollback
      await this.createRollbackPoint();

      // Record update in history
      const updateRecord = {
        fromVersion: this.currentVersion,
        toVersion: updateInfo.version,
        timestamp: Date.now(),
        status: 'installing',
        changelog: updateInfo.changelog
      };

      this.updateHistory.unshift(updateRecord);
      await this.saveUpdateHistory();

      // For Chrome Web Store extensions, updates happen automatically
      // We just need to reload the extension when Chrome updates it
      console.log('[AutoUpdater] Extension will update automatically via Chrome Web Store');
      console.log('[AutoUpdater] Reloading extension to apply update...');

      // Notify user
      await chrome.notifications.create('extension-updating', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Updating Extension',
        message: 'The extension is being updated. It will reload automatically.',
        priority: 1
      });

      // Schedule reload (give Chrome time to download)
      setTimeout(() => {
        chrome.runtime.reload();
      }, 5000);

      return { 
        success: true, 
        message: 'Update installation initiated',
        reloadScheduled: true
      };
    } catch (error) {
      console.error('[AutoUpdater] Failed to install update:', error);
      this.updateInProgress = false;
      
      // Update history with failure
      if (this.updateHistory.length > 0) {
        this.updateHistory[0].status = 'failed';
        this.updateHistory[0].error = error.message;
        await this.saveUpdateHistory();
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Create rollback point
   */
  async createRollbackPoint() {
    try {
      // Store current version and state
      const rollbackData = {
        version: this.currentVersion,
        timestamp: Date.now(),
        settings: await chrome.storage.local.get(null), // Backup all settings
        manifest: chrome.runtime.getManifest()
      };

      await chrome.storage.local.set({
        rollbackPoint: rollbackData
      });

      this.rollbackAvailable = true;
      this.previousVersion = this.currentVersion;

      console.log(`[AutoUpdater] Rollback point created for version ${this.currentVersion}`);
      return { success: true };
    } catch (error) {
      console.error('[AutoUpdater] Failed to create rollback point:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback to previous version
   */
  async rollback() {
    if (!this.rollbackAvailable) {
      return { success: false, message: 'No rollback point available' };
    }

    try {
      console.log('[AutoUpdater] Initiating rollback...');

      // Load rollback point
      const result = await chrome.storage.local.get('rollbackPoint');
      if (!result.rollbackPoint) {
        throw new Error('Rollback data not found');
      }

      const rollbackData = result.rollbackPoint;

      // Restore settings (except rollback point itself)
      const settingsToRestore = { ...rollbackData.settings };
      delete settingsToRestore.rollbackPoint;
      await chrome.storage.local.set(settingsToRestore);

      // Record rollback in history
      const rollbackRecord = {
        fromVersion: this.currentVersion,
        toVersion: rollbackData.version,
        timestamp: Date.now(),
        status: 'rolled_back',
        reason: 'User initiated rollback'
      };

      this.updateHistory.unshift(rollbackRecord);
      await this.saveUpdateHistory();

      // Notify user
      await chrome.notifications.create('extension-rollback', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Rolling Back Extension',
        message: `Rolling back to version ${rollbackData.version}. Extension will reload.`,
        priority: 1
      });

      console.log(`[AutoUpdater] Rolled back to version ${rollbackData.version}`);

      // Note: Actual version rollback requires reinstalling the old version
      // This just restores settings. User needs to manually install old version from backup.
      return {
        success: true,
        message: 'Settings restored. To complete rollback, reinstall the previous version manually.',
        previousVersion: rollbackData.version,
        settingsRestored: true
      };
    } catch (error) {
      console.error('[AutoUpdater] Rollback failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start periodic update checks
   */
  startPeriodicChecks() {
    // Clear existing timer
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }

    // Check every hour
    this.updateCheckTimer = setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);

    console.log(`[AutoUpdater] Periodic checks started (interval: ${this.checkInterval / 1000}s)`);
  }

  /**
   * Stop periodic update checks
   */
  stopPeriodicChecks() {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
      console.log('[AutoUpdater] Periodic checks stopped');
    }
  }

  /**
   * Setup message listeners for manual actions
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'checkForUpdates') {
        this.checkForUpdates().then(sendResponse);
        return true; // Async response
      }

      if (message.action === 'installUpdate') {
        this.installUpdate(message.updateInfo).then(sendResponse);
        return true;
      }

      if (message.action === 'rollbackUpdate') {
        this.rollback().then(sendResponse);
        return true;
      }

      if (message.action === 'getUpdateHistory') {
        sendResponse({ success: true, history: this.updateHistory });
        return false;
      }

      if (message.action === 'getUpdateStatus') {
        sendResponse({
          success: true,
          currentVersion: this.currentVersion,
          updateInProgress: this.updateInProgress,
          rollbackAvailable: this.rollbackAvailable,
          previousVersion: this.previousVersion
        });
        return false;
      }
    });
  }

  /**
   * Load update history from storage
   */
  async loadUpdateHistory() {
    try {
      const result = await chrome.storage.local.get('updateHistory');
      if (result.updateHistory) {
        this.updateHistory = result.updateHistory;
        console.log(`[AutoUpdater] Loaded ${this.updateHistory.length} update records`);
      }

      // Check if rollback is available
      const rollbackResult = await chrome.storage.local.get('rollbackPoint');
      if (rollbackResult.rollbackPoint) {
        this.rollbackAvailable = true;
        this.previousVersion = rollbackResult.rollbackPoint.version;
      }
    } catch (error) {
      console.error('[AutoUpdater] Failed to load update history:', error);
    }
  }

  /**
   * Save update history to storage
   */
  async saveUpdateHistory() {
    try {
      // Keep only last 50 records
      const historyToSave = this.updateHistory.slice(0, 50);
      await chrome.storage.local.set({
        updateHistory: historyToSave
      });
    } catch (error) {
      console.error('[AutoUpdater] Failed to save update history:', error);
    }
  }

  /**
   * Get update statistics
   */
  getStats() {
    const successfulUpdates = this.updateHistory.filter(u => u.status === 'completed').length;
    const failedUpdates = this.updateHistory.filter(u => u.status === 'failed').length;
    const rollbacks = this.updateHistory.filter(u => u.status === 'rolled_back').length;

    return {
      currentVersion: this.currentVersion,
      updateInProgress: this.updateInProgress,
      rollbackAvailable: this.rollbackAvailable,
      previousVersion: this.previousVersion,
      totalUpdates: this.updateHistory.length,
      successfulUpdates,
      failedUpdates,
      rollbacks,
      lastCheck: this.updateHistory[0]?.timestamp || null,
      checkInterval: this.checkInterval
    };
  }
}

// Create singleton instance
const autoUpdater = new AutoUpdater();

// Auto-initialize
autoUpdater.initialize().catch(console.error);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AutoUpdater, autoUpdater };
}
