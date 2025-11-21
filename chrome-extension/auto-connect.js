/**
 * Auto-Connect Module for Workstation Chrome Extension
 * Automatically detects and connects to local backend server
 */

const AUTO_CONNECT = {
  // Default backend URL
  DEFAULT_BACKEND: 'http://localhost:3000',
  
  // Connection check interval (ms)
  CHECK_INTERVAL: 10000,
  
  // Current status
  status: {
    connected: false,
    lastCheck: null,
    backendUrl: null,
    serverVersion: null
  }
};

/**
 * Check if backend server is available
 * @param {string} url - Backend URL to check
 * @returns {Promise<Object>} Connection status
 */
async function checkBackendConnection(url = AUTO_CONNECT.DEFAULT_BACKEND) {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        url: url,
        serverVersion: data.version || 'unknown',
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.log(`Backend connection check failed: ${error.message}`);
  }
  
  return {
    connected: false,
    url: url,
    timestamp: Date.now()
  };
}

/**
 * Try multiple backend URLs to find available server
 * @returns {Promise<Object>} First available backend or null
 */
async function findAvailableBackend() {
  const urlsToTry = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ];
  
  for (const url of urlsToTry) {
    const result = await checkBackendConnection(url);
    if (result.connected) {
      console.log(`✓ Found backend at ${url}`);
      return result;
    }
  }
  
  return null;
}

/**
 * Get authentication token (try to auto-generate if not exists)
 * @param {string} backendUrl - Backend URL
 * @returns {Promise<string|null>} JWT token or null
 */
async function getOrCreateToken(backendUrl) {
  // Check if we have a stored token
  const stored = await chrome.storage.local.get(['authToken']);
  if (stored.authToken) {
    // Validate token is not expired
    try {
      const payload = JSON.parse(atob(stored.authToken.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        return stored.authToken;
      }
    } catch (error) {
      console.log('Invalid stored token, will request new one');
    }
  }
  
  // Try to get demo token from backend
  try {
    const response = await fetch(`${backendUrl}/auth/demo-token`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        // Store the token
        await chrome.storage.local.set({ authToken: data.token });
        console.log('✓ Obtained and stored authentication token');
        return data.token;
      }
    }
  } catch (error) {
    console.error('Failed to get token:', error);
  }
  
  return null;
}

/**
 * Initialize auto-connect functionality
 * Called when extension loads
 */
async function initializeAutoConnect() {
  console.log('🔄 Initializing auto-connect...');
  
  // Find available backend
  const backend = await findAvailableBackend();
  
  if (backend && backend.connected) {
    AUTO_CONNECT.status = {
      connected: true,
      lastCheck: backend.timestamp,
      backendUrl: backend.url,
      serverVersion: backend.serverVersion
    };
    
    // Update stored settings
    const settings = await chrome.storage.local.get(['settings']);
    const currentSettings = settings.settings || {};
    currentSettings.backendUrl = backend.url;
    await chrome.storage.local.set({ settings: currentSettings });
    
    // Get or create authentication token
    const token = await getOrCreateToken(backend.url);
    
    // Update status badge
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#00AA00' });
    
    console.log(`✓ Auto-connect successful: ${backend.url}`);
    console.log(`  Server version: ${backend.serverVersion}`);
    console.log(`  Token obtained: ${token ? 'yes' : 'no'}`);
    
    // Notify popup if it's open
    chrome.runtime.sendMessage({
      action: 'connectionStatus',
      status: AUTO_CONNECT.status,
      hasToken: !!token
    }).catch(() => {
      // Popup not open, that's fine
    });
    
    return true;
  } else {
    AUTO_CONNECT.status = {
      connected: false,
      lastCheck: Date.now(),
      backendUrl: null,
      serverVersion: null
    };
    
    // Update status badge
    chrome.action.setBadgeText({ text: '✗' });
    chrome.action.setBadgeBackgroundColor({ color: '#AA0000' });
    
    console.log('✗ No backend server found');
    console.log('  Please start the server with: npm start');
    
    return false;
  }
}

/**
 * Monitor connection status periodically
 */
function startConnectionMonitoring() {
  setInterval(async () => {
    if (AUTO_CONNECT.status.backendUrl) {
      const result = await checkBackendConnection(AUTO_CONNECT.status.backendUrl);
      
      if (result.connected !== AUTO_CONNECT.status.connected) {
        // Connection status changed
        AUTO_CONNECT.status.connected = result.connected;
        AUTO_CONNECT.status.lastCheck = result.timestamp;
        
        if (result.connected) {
          chrome.action.setBadgeText({ text: '✓' });
          chrome.action.setBadgeBackgroundColor({ color: '#00AA00' });
          console.log('✓ Backend connection restored');
        } else {
          chrome.action.setBadgeText({ text: '✗' });
          chrome.action.setBadgeBackgroundColor({ color: '#AA0000' });
          console.log('✗ Backend connection lost');
        }
        
        // Notify popup
        chrome.runtime.sendMessage({
          action: 'connectionStatus',
          status: AUTO_CONNECT.status
        }).catch(() => {});
      }
    }
  }, AUTO_CONNECT.CHECK_INTERVAL);
}

/**
 * Open workflow builder in new tab
 * @param {boolean} newWorkflow - Whether to open blank workflow
 */
async function openWorkflowBuilder(newWorkflow = false) {
  const backend = AUTO_CONNECT.status.backendUrl || AUTO_CONNECT.DEFAULT_BACKEND;
  const url = `${backend}/workflow-builder.html${newWorkflow ? '?new=true' : ''}`;
  
  // Check if tab already exists
  const tabs = await chrome.tabs.query({ url: `${backend}/workflow-builder.html*` });
  
  if (tabs.length > 0) {
    // Activate existing tab
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    // Open new tab
    await chrome.tabs.create({ url });
  }
}

/**
 * Get connection status for UI
 * @returns {Object} Connection status
 */
function getConnectionStatus() {
  return {
    ...AUTO_CONNECT.status,
    message: AUTO_CONNECT.status.connected
      ? `Connected to ${AUTO_CONNECT.status.backendUrl}`
      : 'Backend server not detected. Please run: npm start'
  };
}

// Export functions for use in background script and popup
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeAutoConnect,
    startConnectionMonitoring,
    checkBackendConnection,
    getOrCreateToken,
    openWorkflowBuilder,
    getConnectionStatus
  };
}
