/**
 * Workstation Chrome Extension - Background Service Worker
 * v2.0.0 - Enhanced with 25+ Agent Integration, MCP Sync, and Performance Monitoring
 * Handles JWT authentication and API communication with Workstation backend
 * Enterprise-grade browser automation with connection pooling and health monitoring
 */

// Import API Bridge
import { getAPIBridge } from './api-bridge.js';

// Import Agent Registry
import agentRegistry from './agent-registry.js';

// Import MCP Sync Manager
import { mcpSyncManager } from './mcp-sync-manager.js';

// Import Playwright execution engine
import { PlaywrightExecution } from './playwright/execution.js';
import { PlaywrightRetryManager } from './playwright/retry.js';
import { PlaywrightNetworkMonitor } from './playwright/network.js';
import { SelfHealingSelectors } from './playwright/self-healing.js';
import { AgenticContextLearner } from './playwright/context-learning.js';
import { AgenticNetworkMonitor } from './playwright/agentic-network.js';
import { connectionPool } from './playwright/connection-pool.js';
import { performanceMonitor } from './playwright/performance-monitor.js';

let workstationToken = '';
let backendUrl = 'http://localhost:3000';
let settings = {
  backendUrl: 'http://localhost:3000',
  pollInterval: 2000,
  autoRetry: true,
  enableWebSocket: true
};

// Initialize API Bridge
let apiBridge = null;

// Initialize Playwright execution engine
const playwrightExecution = new PlaywrightExecution();
const retryManager = new PlaywrightRetryManager();

// Initialize agentic components
const agenticContextLearner = new AgenticContextLearner();

// Initialize context learner
agenticContextLearner.initialize().then(() => {
  console.log('🧠 Agentic context learner initialized in background');
}).catch((error) => {
  console.error('❌ Failed to initialize context learner:', error);
});

// Initialize Agent Registry
agentRegistry.initialize(backendUrl).then((result) => {
  console.log(`🤖 Agent Registry initialized: ${result.count} agents (${result.mode} mode)`);
  if (result.mode === 'discovered') {
    console.log('✅ Agents:', result.agents.join(', '));
  }
}).catch((error) => {
  console.error('❌ Failed to initialize agent registry:', error);
});

// Initialize MCP Sync Manager
mcpSyncManager.initialize().then(() => {
  console.log('🔄 MCP Sync Manager initialized');
}).catch((error) => {
  console.error('❌ Failed to initialize MCP sync:', error);
});

// Log performance and connection pool stats
setInterval(() => {
  const perfStats = performanceMonitor.getSummary();
  const poolStats = connectionPool.getStats();
  const agentStats = agentRegistry.getStats();
  const syncStats = mcpSyncManager.getStats();
  
  console.log('📊 System Stats:', {
    performance: `${perfStats.successRate.toFixed(1)}% success, ${perfStats.completedOperations} ops`,
    connections: `${poolStats.inUseConnections}/${poolStats.totalConnections} in use`,
    agents: `${agentStats.totalAgents} total, ${agentStats.systemHealth.healthyAgents} healthy`,
    sync: `${syncStats.syncedEntries}/${syncStats.totalEntries} synced, ${syncStats.pendingSync} pending`
  });
}, 60000); // Log every minute

console.log('🚀 Workstation extension v2.0.0 with 25+ agents and MCP sync initialized');

// Auto-connect functionality
async function autoConnectToBackend() {
  const urlsToTry = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ];
  
  for (const url of urlsToTry) {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        console.log(`✓ Found backend at ${url}`);
        backendUrl = url;
        settings.backendUrl = url;
        
        // Save to storage
        await chrome.storage.local.set({ settings });
        
        // Try to get token
        const tokenResponse = await fetch(`${url}/auth/demo-token`);
        if (tokenResponse.ok) {
          const data = await tokenResponse.json();
          workstationToken = data.token;
          await chrome.storage.local.set({ workstationToken, authToken: data.token });
          console.log('✅ Auto-connect successful with token');
          
          // Update badge
          chrome.action.setBadgeText({ text: '✓' });
          chrome.action.setBadgeBackgroundColor({ color: '#00AA00' });
          
          return true;
        }
      }
    } catch (error) {
      // Try next URL
      continue;
    }
  }
  
  // No backend found
  console.log('✗ No backend server detected. Run: npm start');
  chrome.action.setBadgeText({ text: '✗' });
  chrome.action.setBadgeBackgroundColor({ color: '#AA0000' });
  return false;
}

// Initialize on extension install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log('🚀 Workstation extension installed, auto-connecting...');
    
    // Load settings
    const stored = await chrome.storage.local.get(['settings']);
    if (stored.settings) {
      settings = { ...settings, ...stored.settings };
      backendUrl = settings.backendUrl;
    }
    
    // Try auto-connect
    await autoConnectToBackend();
  } catch (error) {
    console.error('❌ Failed to auto-connect:', error);
  }
});

// Also try auto-connect on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🔄 Extension started, attempting auto-connect...');
  await autoConnectToBackend();
});

// Monitor connection periodically - only start after initial setup
let connectionMonitoringStarted = false;

async function startConnectionMonitoring() {
  if (connectionMonitoringStarted) return;
  connectionMonitoringStarted = true;
  
  setInterval(async () => {
    // Only monitor if we have a backend URL
    if (!backendUrl) return;
    
    try {
      const response = await fetch(`${backendUrl}/health`, {
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#00AA00' });
      } else {
        chrome.action.setBadgeText({ text: '✗' });
        chrome.action.setBadgeBackgroundColor({ color: '#AA0000' });
      }
    } catch (error) {
      chrome.action.setBadgeText({ text: '✗' });
      chrome.action.setBadgeBackgroundColor({ color: '#AA0000' });
    }
  }, 10000); // Check every 10 seconds
}

// Start monitoring after successful initialization
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log('🚀 Workstation extension installed, auto-connecting...');
    
    // Load settings
    const stored = await chrome.storage.local.get(['settings']);
    if (stored.settings) {
      settings = { ...settings, ...stored.settings };
      backendUrl = settings.backendUrl;
    }
    
    // Try auto-connect
    await autoConnectToBackend();
    
    // Start connection monitoring
    startConnectionMonitoring();
  } catch (error) {
    console.error('❌ Failed to auto-connect:', error);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('🔄 Extension started, attempting auto-connect...');
  await autoConnectToBackend();
  
  // Start connection monitoring
  startConnectionMonitoring();
});
    // Initialize API Bridge
    const response = await fetch(`${backendUrl}/auth/demo-token`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    workstationToken = data.token;
    await chrome.storage.local.set({ workstationToken });
    
    // Setup API Bridge with token
    apiBridge = getAPIBridge(backendUrl, workstationToken);
    
    // Connect WebSocket if enabled
    if (settings.enableWebSocket) {
      apiBridge.connectWebSocket();
      setupWebSocketListeners();
    }
    
    console.log('✅ Workstation token stored and API bridge initialized');
  } catch (error) {
    console.error('❌ Failed to initialize:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Extension Initialization Failed',
      message: 'Could not connect to backend. Please check settings.'
    });
  }
});

/**
 * Setup WebSocket event listeners
 */
function setupWebSocketListeners() {
  if (!apiBridge) return;

  apiBridge.on('execution:started', (data) => {
    console.log('🚀 Execution started:', data.executionId);
    notifyPopup('execution:started', data);
  });

  apiBridge.on('execution:progress', (data) => {
    console.log('⚙️ Execution progress:', data.executionId, data.progress);
    notifyPopup('execution:progress', data);
  });

  apiBridge.on('execution:completed', (data) => {
    console.log('✅ Execution completed:', data.executionId);
    notifyPopup('execution:completed', data);
  });

  apiBridge.on('execution:failed', (data) => {
    console.error('❌ Execution failed:', data.executionId, data.error);
    notifyPopup('execution:failed', data);
  });

  apiBridge.on('agent:status', (data) => {
    console.log('🤖 Agent status update:', data.agentId, data.status);
    notifyPopup('agent:status', data);
  });
}

/**
 * Notify popup of events
 */
function notifyPopup(event, data) {
  chrome.runtime.sendMessage({
    type: 'background:event',
    event,
    data
  }).catch((error) => {
    // Only ignore if popup is not open
    if (!error || error.message !== 'Could not establish connection. Receiving end does not exist.') {
      console.error('Failed to notify popup:', error);
    }
  });
}


// Message handler for popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ensure API bridge is initialized
  if (!apiBridge && request.action !== 'updateSettings') {
    sendResponse({ success: false, error: 'API bridge not initialized' });
    return true;
  }

  // ========== Workflow Execution ==========
  if (request.action === 'executeWorkflow') {
    executeWorkflowHandler(request, sender, sendResponse);
    return true;
  }
  
  // ========== Backend Agent Integration ==========
  if (request.action === 'triggerAgent') {
    triggerAgentHandler(request, sendResponse);
    return true;
  }

  if (request.action === 'getAgentStatus') {
    getAgentStatusHandler(request, sendResponse);
    return true;
  }

  if (request.action === 'getAllAgents') {
    apiBridge.getAllAgents().then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'getSystemOverview') {
    apiBridge.getSystemOverview().then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  // ========== Workflow Management ==========
  if (request.action === 'getWorkflows') {
    apiBridge.getWorkflows(request.params || {}).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'createWorkflow') {
    apiBridge.createWorkflow(request.workflow).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'deleteWorkflow') {
    apiBridge.deleteWorkflow(request.workflowId).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  // ========== Execution Management ==========
  if (request.action === 'getExecutionStatus') {
    getExecutionStatusHandler(request, sendResponse);
    return true;
  }

  if (request.action === 'getExecutionLogs') {
    apiBridge.getExecutionLogs(request.executionId, request.params || {}).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'cancelExecution') {
    cancelExecutionHandler(request, sendResponse);
    return true;
  }

  if (request.action === 'retryExecution') {
    apiBridge.retryExecution(request.executionId).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // ========== Recording ==========
  if (request.action === 'recordAction') {
    recordAction(request.actionData).then(sendResponse);
    return true;
  }
  
  if (request.action === 'getRecordedActions') {
    getRecordedActions().then(sendResponse);
    return true;
  }
  
  if (request.action === 'clearRecordedActions') {
    clearRecordedActions().then(sendResponse);
    return true;
  }
  
  // ========== Settings ==========
  if (request.action === 'updateSettings') {
    updateSettings(request.settings).then(sendResponse);
    return true;
  }

  // ========== WebSocket Management ==========
  if (request.action === 'subscribeExecution') {
    if (apiBridge) {
      apiBridge.subscribeToExecution(request.executionId);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'API bridge not initialized' });
    }
    return true;
  }

  if (request.action === 'unsubscribeExecution') {
    if (apiBridge) {
      apiBridge.unsubscribeFromExecution(request.executionId);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'API bridge not initialized' });
    }
    return true;
  }

  // ========== Agent Registry ==========
  if (request.action === 'getAgentRegistry') {
    sendResponse({
      success: true,
      agents: agentRegistry.getAllAgents(),
      stats: agentRegistry.getStats()
    });
    return true;
  }

  if (request.action === 'getAgentsByType') {
    sendResponse({
      success: true,
      agents: agentRegistry.getAgentsByType(request.agentType)
    });
    return true;
  }

  if (request.action === 'searchAgents') {
    sendResponse({
      success: true,
      agents: agentRegistry.searchAgents(request.query)
    });
    return true;
  }

  if (request.action === 'getAgentHealth') {
    sendResponse({
      success: true,
      health: agentRegistry.getAgentHealth(request.agentId)
    });
    return true;
  }

  if (request.action === 'getSystemHealth') {
    sendResponse({
      success: true,
      health: agentRegistry.getSystemHealth()
    });
    return true;
  }

  // ========== MCP Sync ==========
  if (request.action === 'mcpSync') {
    mcpSyncManager.handleIncomingSync(
      request.key,
      request.value,
      request.timestamp,
      request.source
    ).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'mcpSyncNow') {
    mcpSyncManager.syncNow().then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'getMCPSyncStats') {
    sendResponse({
      success: true,
      stats: mcpSyncManager.getStats()
    });
    return true;
  }

  if (request.action === 'getMCPConflicts') {
    sendResponse({
      success: true,
      conflicts: mcpSyncManager.getConflicts()
    });
    return true;
  }

  if (request.action === 'resolveMCPConflict') {
    mcpSyncManager.resolveConflict(request.conflictId, request.resolution).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  // ========== Performance Monitoring ==========
  if (request.action === 'getPerformanceStats') {
    sendResponse({
      success: true,
      summary: performanceMonitor.getSummary(),
      insights: performanceMonitor.getInsights(),
      health: performanceMonitor.getHealthStatus()
    });
    return true;
  }

  if (request.action === 'getPerformanceAlerts') {
    sendResponse({
      success: true,
      alerts: performanceMonitor.getAlerts(request.count || 10)
    });
    return true;
  }

  // ========== Connection Pool ==========
  if (request.action === 'getConnectionPoolStats') {
    sendResponse({
      success: true,
      stats: connectionPool.getStats(),
      health: connectionPool.healthCheck()
    });
    return true;
  }
});

/**
 * Handle workflow execution (local or remote)
 */
async function executeWorkflowHandler(request, sender, sendResponse) {
  try {
    // Use Playwright execution engine for local execution
    if (request.useLocal) {
      const tabId = sender.tab?.id || request.tabId;
      if (tabId) {
        await playwrightExecution.executeWorkflow(request.workflow, tabId, sendResponse);
      } else {
        sendResponse({ success: false, error: 'No tab ID provided' });
      }
    } else {
      // Use backend API for server-side execution
      const result = await apiBridge.executeWorkflow(request.workflow.id || request.workflowId, request.variables);
      sendResponse({ success: true, ...result, isLocal: false });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle agent triggering
 */
async function triggerAgentHandler(request, sendResponse) {
  try {
    const { agentType, params } = request;
    
    let result;
    switch (agentType) {
      case 'mainpage':
        result = await apiBridge.triggerMainpageAgent(params);
        break;
      case 'codepage':
        result = await apiBridge.triggerCodepageAgent(params);
        break;
      case 'repo-agent':
        result = await apiBridge.triggerRepoAgent(params);
        break;
      case 'curriculum':
        result = await apiBridge.triggerCurriculumAgent(params);
        break;
      case 'designer':
        result = await apiBridge.triggerDesignerAgent(params);
        break;
      default:
        // Generic agent task creation
        result = await apiBridge.createAgentTask(agentType, params.type, params.payload, params.priority);
    }
    
    sendResponse({ success: true, ...result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle agent status retrieval
 */
async function getAgentStatusHandler(request, sendResponse) {
  try {
    const result = await apiBridge.getAgent(request.agentId);
    sendResponse({ success: true, ...result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get execution status from backend or local execution
 */
async function getExecutionStatusHandler(request, sendResponse) {
  try {
    // First check local Playwright execution
    const localStatus = playwrightExecution.getExecutionStatus(request.executionId);
    if (localStatus) {
      sendResponse({ success: true, ...localStatus, isLocal: true });
      return;
    }
    
    // Otherwise query backend
    const result = await apiBridge.getExecution(request.executionId);
    sendResponse({ success: true, ...result, isLocal: false });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Cancel execution (local or remote)
 */
async function cancelExecutionHandler(request, sendResponse) {
  try {
    // Try local cancellation first
    const cancelled = playwrightExecution.cancelExecution(request.executionId);
    
    if (cancelled) {
      sendResponse({ success: true, isLocal: true });
    } else {
      // Try backend cancellation
      const result = await apiBridge.cancelExecution(request.executionId);
      sendResponse({ success: true, ...result, isLocal: false });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Update settings
 * @param {Object} newSettings - New settings
 * @returns {Promise<Object>} Success status
 */
async function updateSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  backendUrl = settings.backendUrl;
  await chrome.storage.local.set({ settings });
  
  // Reinitialize API bridge with new settings
  if (apiBridge) {
    apiBridge.setBaseUrl(backendUrl);
    
    // Reconnect WebSocket if enabled
    if (settings.enableWebSocket) {
      apiBridge.connectWebSocket();
      setupWebSocketListeners();
    } else {
      apiBridge.disconnectWebSocket();
    }
  }
  
  return { success: true };
}

/**
 * Record a user action for workflow building
 * @param {Object} actionData - Action details (type, selector, value)
 * @returns {Promise<Object>} Success status
 */
async function recordAction(actionData) {
  const result = await chrome.storage.local.get('recordedActions');
  const recorded = result.recordedActions || [];
  recorded.push(actionData);
  await chrome.storage.local.set({ recordedActions: recorded });
  return { success: true, count: recorded.length };
}

/**
 * Get all recorded actions
 * @returns {Promise<Array>} Recorded actions
 */
async function getRecordedActions() {
  const result = await chrome.storage.local.get('recordedActions');
  return result.recordedActions || [];
}

/**
 * Clear all recorded actions
 * @returns {Promise<Object>} Success status
 */
async function clearRecordedActions() {
  await chrome.storage.local.set({ recordedActions: [] });
  return { success: true };
}
