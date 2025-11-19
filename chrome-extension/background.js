/**
 * Workstation Chrome Extension - Background Service Worker
 * Handles JWT authentication and API communication with Workstation backend
 */

let workstationToken = '';
const BACKEND_URL = 'http://localhost:3000';

// Initialize on extension install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log('🚀 Workstation extension installed, fetching JWT token...');
    const response = await fetch(`${BACKEND_URL}/auth/demo-token`);
    const data = await response.json();
    workstationToken = data.token;
    await chrome.storage.local.set({ workstationToken });
    console.log('✅ Workstation token stored successfully');
  } catch (error) {
    console.error('❌ Failed to get token:', error);
  }
});

// Message handler for popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeWorkflow') {
    executeWorkflow(request.workflow).then(sendResponse);
    return true; // Required for async response
  }
  
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
});

/**
 * Execute a workflow by sending it to the Workstation backend
 * @param {Object} workflow - Workflow configuration
 * @returns {Promise<Object>} Execution result
 */
async function executeWorkflow(workflow) {
  const { workstationToken } = await chrome.storage.local.get('workstationToken');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/v2/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${workstationToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflow)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Workflow execution failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to execute workflow'
    };
  }
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
