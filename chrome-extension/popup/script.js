/**
 * Workstation Chrome Extension - Popup Script
 * Handles UI interactions and communication with background script
 * v1.2 Features: Auto-connect, Builder integration, Connection status
 */

// DOM elements - Connection Status
const connectionStatus = document.getElementById('connectionStatus');
const connectionIndicator = document.getElementById('connectionIndicator');
const connectionText = document.getElementById('connectionText');

// DOM elements - Execute Tab
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const executeBtn = document.getElementById('executeBtn');
const saveBtn = document.getElementById('saveBtn');
const promptTextarea = document.getElementById('prompt');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
const recordingIndicator = document.getElementById('recordingIndicator');

// DOM elements - Builder Tab
const openBuilderBtn = document.getElementById('openBuilderBtn');
const newWorkflowBtn = document.getElementById('newWorkflowBtn');
const loadWorkflowBtn = document.getElementById('loadWorkflowBtn');
const builderStatus = document.getElementById('builderStatus');

// DOM elements - History Tab
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// DOM elements - Templates Tab
const templatesList = document.getElementById('templatesList');

// DOM elements - Settings Tab
const backendUrlInput = document.getElementById('backendUrl');
const pollIntervalInput = document.getElementById('pollInterval');
const autoRetryCheckbox = document.getElementById('autoRetry');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// DOM elements - Tabs
const tabButtons = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// State
let isRecording = false;
let currentExecutionId = null;
let pollingInterval = null;
let settings = {
  backendUrl: 'http://localhost:3000',
  pollInterval: 2000,
  autoRetry: true
};
let isConnected = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkConnectionStatus();
  await loadSettings();
  await loadRecordedActions();
  await loadHistory();
  await loadTemplates();
  setupTabNavigation();
  setupBuilderButtons();
  
  // Check connection periodically
  setInterval(checkConnectionStatus, 10000);
});

/**
 * Check backend connection status
 */
async function checkConnectionStatus() {
  try {
    const response = await fetch(`${settings.backendUrl}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    
    if (response.ok) {
      updateConnectionStatus(true, `Connected to ${settings.backendUrl}`);
    } else {
      updateConnectionStatus(false, 'Backend server not responding');
    }
  } catch (error) {
    updateConnectionStatus(false, 'Backend server offline. Run: npm start');
  }
}

/**
 * Update connection status UI
 */
function updateConnectionStatus(connected, message) {
  isConnected = connected;
  
  if (connected) {
    connectionIndicator.style.background = '#00AA00';
    connectionStatus.style.background = '#e8f5e9';
    connectionStatus.style.borderLeft = '3px solid #00AA00';
  } else {
    connectionIndicator.style.background = '#AA0000';
    connectionStatus.style.background = '#ffebee';
    connectionStatus.style.borderLeft = '3px solid #AA0000';
  }
  
  connectionText.textContent = message;
}

/**
 * Setup Builder tab buttons
 */
function setupBuilderButtons() {
  // Open Builder button
  openBuilderBtn.addEventListener('click', async () => {
    if (!isConnected) {
      showStatus('Backend server not running. Please start the server first.', 'error');
      return;
    }
    
    const url = `${settings.backendUrl}/workflow-builder.html`;
    chrome.tabs.create({ url });
  });
  
  // New Workflow button
  newWorkflowBtn.addEventListener('click', async () => {
    if (!isConnected) {
      showStatus('Backend server not running. Please start the server first.', 'error');
      return;
    }
    
    const url = `${settings.backendUrl}/workflow-builder.html?new=true`;
    chrome.tabs.create({ url });
  });
  
  // Load Workflow button
  loadWorkflowBtn.addEventListener('click', async () => {
    if (!isConnected) {
      showStatus('Backend server not running. Please start the server first.', 'error');
      return;
    }
    
    try {
      const token = await getToken();
      const response = await fetch(`${settings.backendUrl}/api/v2/workflows`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const firstWorkflow = data.data[0];
          const url = `${settings.backendUrl}/workflow-builder.html?id=${firstWorkflow.id}`;
          chrome.tabs.create({ url });
        } else {
          showStatus('No saved workflows found', 'info');
        }
      }
    } catch (error) {
      showStatus('Failed to load workflows: ' + error.message, 'error');
    }
  });
}

/**
 * Tab Navigation
 */
function setupTabNavigation() {
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update active tab button
  tabButtons.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Update active tab content
  tabContents.forEach(content => content.classList.remove('active'));
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  // Refresh data if switching to history or templates
  if (tabName === 'history') {
    loadHistory();
  } else if (tabName === 'templates') {
    loadTemplates();
  }
}

/**
 * Settings Management
 */
async function loadSettings() {
  const stored = await chrome.storage.local.get(['settings']);
  if (stored.settings) {
    settings = { ...settings, ...stored.settings };
  }
  
  // Update UI
  backendUrlInput.value = settings.backendUrl;
  pollIntervalInput.value = settings.pollInterval;
  autoRetryCheckbox.checked = settings.autoRetry;
}

saveSettingsBtn.addEventListener('click', async () => {
  settings = {
    backendUrl: backendUrlInput.value.trim(),
    pollInterval: parseInt(pollIntervalInput.value),
    autoRetry: autoRetryCheckbox.checked
  };
  
  await chrome.storage.local.set({ settings });
  showStatus('✅ Settings saved successfully!', 'success');
  
  // Notify background script of settings change
  chrome.runtime.sendMessage({ action: 'updateSettings', settings });
});

/**
 * Workflow History Management
 */
async function loadHistory() {
  const stored = await chrome.storage.local.get(['workflowHistory']);
  const history = stored.workflowHistory || [];
  
  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No workflow history yet</div>';
    return;
  }
  
  // Sort by timestamp descending (newest first)
  history.sort((a, b) => b.timestamp - a.timestamp);
  
  historyList.innerHTML = history.map(item => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-item-header">
        <div class="history-item-title">${escapeHtml(item.description)}</div>
        <span class="history-item-status ${item.status}">${item.status}</span>
      </div>
      <div class="history-item-time">${formatTimestamp(item.timestamp)}</div>
    </div>
  `).join('');
  
  // Add click handlers
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      loadWorkflowFromHistory(id, history);
    });
  });
}

function loadWorkflowFromHistory(id, history) {
  const workflow = history.find(w => w.id === id);
  if (workflow) {
    promptTextarea.value = workflow.description;
    switchTab('execute');
    showStatus('Workflow loaded from history', 'info');
  }
}

clearHistoryBtn.addEventListener('click', async () => {
  if (confirm('Clear all workflow history?')) {
    await chrome.storage.local.set({ workflowHistory: [] });
    await loadHistory();
    showStatus('History cleared', 'info');
  }
});

/**
 * Save Workflow
 */
saveBtn.addEventListener('click', async () => {
  const description = promptTextarea.value.trim();
  if (!description) {
    showStatus('Please enter a workflow description first', 'error');
    return;
  }
  
  try {
    const token = await getToken();
    if (!token) {
      showStatus('Please ensure you are authenticated', 'error');
      return;
    }

    // Create workflow object in backend format
    const workflow = {
      name: description.substring(0, 50) || 'Untitled Workflow',
      description: description,
      definition: {
        tasks: [
          {
            name: 'Execute prompt',
            agent_type: 'browser',
            action: 'evaluate',
            parameters: { 
              expression: description
            }
          }
        ],
        variables: {},
        on_error: 'stop'
      }
    };

    // Save to backend
    const response = await fetch(`${settings.backendUrl}/api/v2/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(workflow)
    });

    if (response.ok) {
      const result = await response.json();
      
      // Also save to local history
      await addToHistory({
        id: result.data.id,
        description,
        timestamp: Date.now(),
        status: 'saved'
      });
      
      showStatus('✅ Workflow saved successfully!', 'success');
    } else {
      const error = await response.json();
      showStatus('Failed to save: ' + (error.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    showStatus('Error saving workflow: ' + error.message, 'error');
  }
});

/**
 * Record Actions
 */
// Record button click
recordBtn.addEventListener('click', async () => {
  isRecording = true;
  recordBtn.style.display = 'none';
  stopBtn.style.display = 'flex';
  recordingIndicator.classList.add('active');
  
  // Send message to content script to start recording
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'startRecording' });
  
  showStatus('Recording started. Interact with the page...', 'info');
});

// Stop button click
stopBtn.addEventListener('click', async () => {
  isRecording = false;
  stopBtn.style.display = 'none';
  recordBtn.style.display = 'flex';
  recordingIndicator.classList.remove('active');
  
  // Send message to content script to stop recording
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'stopRecording' });
  
  // Load and display recorded actions
  await loadRecordedActions();
  showStatus('Recording stopped. Actions captured.', 'success');
});

// Clear button click
clearBtn.addEventListener('click', async () => {
  chrome.runtime.sendMessage({ action: 'clearRecordedActions' }, (response) => {
    if (response && response.success) {
      promptTextarea.value = '';
      resultDiv.classList.remove('visible');
      showStatus('Recorded actions cleared.', 'info');
    }
  });
});

/**
 * Execute Workflow with Status Polling
 */
executeBtn.addEventListener('click', async () => {
  const prompt = promptTextarea.value.trim();
  
  if (!prompt) {
    showStatus('Please enter a workflow description.', 'error');
    return;
  }
  
  // Disable button during execution
  executeBtn.disabled = true;
  executeBtn.textContent = '⏳ Executing...';
  showStatus('Executing workflow...', 'info');
  
  try {
    // Send workflow to background script
    const workflow = {
      description: prompt,
      actions: [] // Could include recorded actions here
    };
    
    chrome.runtime.sendMessage(
      { action: 'executeWorkflow', workflow },
      async (response) => {
        if (response && response.success) {
          currentExecutionId = response.data.execution?.id;
          
          // Save to history with running status
          await addToHistory({
            id: currentExecutionId || generateId(),
            description: prompt,
            timestamp: Date.now(),
            status: 'running'
          });
          
          // Start polling for status
          if (currentExecutionId) {
            startStatusPolling(currentExecutionId);
          } else {
            // Execution completed immediately
            executeBtn.disabled = false;
            executeBtn.textContent = '🚀 Execute Workflow';
            showStatus('✅ Workflow executed successfully!', 'success');
            displayResult(response.data);
            
            // Update history with success
            await updateHistoryStatus(currentExecutionId || generateId(), 'success');
          }
        } else {
          executeBtn.disabled = false;
          executeBtn.textContent = '🚀 Execute Workflow';
          const errorMsg = response?.error || 'Unknown error occurred';
          showStatus(`❌ Execution failed: ${errorMsg}`, 'error');
          displayResult({ error: errorMsg });
          
          // Save to history with error status
          await addToHistory({
            id: generateId(),
            description: prompt,
            timestamp: Date.now(),
            status: 'error',
            error: errorMsg
          });
        }
      }
    );
  } catch (error) {
    executeBtn.disabled = false;
    executeBtn.textContent = '🚀 Execute Workflow';
    showStatus(`❌ Error: ${error.message}`, 'error');
    displayResult({ error: error.message });
  }
});

/**
 * Status Polling
 */
function startStatusPolling(executionId) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  pollingInterval = setInterval(async () => {
    chrome.runtime.sendMessage(
      { action: 'getExecutionStatus', executionId },
      async (response) => {
        if (!response || response.error) {
          stopStatusPolling();
          executeBtn.disabled = false;
          executeBtn.textContent = '🚀 Execute Workflow';
          return;
        }
        
        const status = response.status;
        
        if (status === 'completed') {
          stopStatusPolling();
          executeBtn.disabled = false;
          executeBtn.textContent = '🚀 Execute Workflow';
          showStatus('✅ Workflow completed successfully!', 'success');
          displayResult(response.result || {});
          await updateHistoryStatus(executionId, 'success');
        } else if (status === 'failed') {
          stopStatusPolling();
          executeBtn.disabled = false;
          executeBtn.textContent = '🚀 Execute Workflow';
          showStatus(`❌ Workflow failed: ${response.error}`, 'error');
          displayResult({ error: response.error });
          await updateHistoryStatus(executionId, 'error');
        } else if (status === 'running') {
          showStatus(`⏳ Running... (${response.progress || 0}%)`, 'info');
        }
      }
    );
  }, settings.pollInterval);
}

function stopStatusPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

/**
 * History Helpers
 */
async function addToHistory(workflow) {
  const stored = await chrome.storage.local.get(['workflowHistory']);
  const history = stored.workflowHistory || [];
  history.push(workflow);
  await chrome.storage.local.set({ workflowHistory: history });
}

async function updateHistoryStatus(id, status) {
  const stored = await chrome.storage.local.get(['workflowHistory']);
  const history = stored.workflowHistory || [];
  const item = history.find(w => w.id === id);
  if (item) {
    item.status = status;
    await chrome.storage.local.set({ workflowHistory: history });
  }
}

/**
 * Builder Tab Functions
 */
openBuilderBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('../index.html') || `${settings.backendUrl}/workflow-builder.html` });
});

newWorkflowBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${settings.backendUrl}/workflow-builder.html` });
});

loadWorkflowBtn.addEventListener('click', async () => {
  try {
    const response = await fetch(`${settings.backendUrl}/api/v2/workflows`, {
      headers: {
        'Authorization': `Bearer ${await getToken()}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      const workflows = result.data || [];
      
      if (workflows.length > 0) {
        // Open builder with first workflow
        chrome.tabs.create({ 
          url: `${settings.backendUrl}/workflow-builder.html?load=${workflows[0].id}`
        });
      } else {
        showBuilderStatus('No workflows found', 'info');
      }
    }
  } catch (error) {
    showBuilderStatus('Failed to load workflows: ' + error.message, 'error');
  }
});

function showBuilderStatus(message, type = 'info') {
  builderStatus.textContent = message;
  builderStatus.className = `status visible ${type}`;
  setTimeout(() => {
    builderStatus.classList.remove('visible');
  }, 3000);
}

/**
 * Templates Management
 */
async function loadTemplates() {
  try {
    const response = await fetch(`${settings.backendUrl}/api/workflow-templates`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    const templates = result.data?.templates || [];
    const categories = result.data?.categories || [];
    
    if (templates.length === 0) {
      templatesList.innerHTML = '<div class="templates-empty">No templates available</div>';
      return;
    }
    
    templatesList.innerHTML = `
      <div class="templates-container">
        ${templates.map(template => `
          <div class="template-card" data-id="${template.id}">
            <div class="template-card-icon">${template.icon || '📦'}</div>
            <div class="template-card-content">
              <div class="template-card-header">
                <div class="template-card-title">${escapeHtml(template.name)}</div>
                <span class="template-complexity template-complexity-${template.complexity}">${template.complexity}</span>
              </div>
              <div class="template-card-description">${escapeHtml(template.description)}</div>
              <div class="template-card-meta">
                <span>⏱️ ${template.estimatedDuration}</span>
                <span>📦 ${template.nodes.length} nodes</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add click handlers
    document.querySelectorAll('.template-card').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const template = templates.find(t => t.id === id);
        if (template) {
          loadTemplate(template);
        }
      });
    });
  } catch (error) {
    console.error('Failed to load templates:', error);
    templatesList.innerHTML = '<div class="templates-empty">Failed to load templates. Make sure the backend is running.</div>';
  }
}

async function loadTemplate(template) {
  try {
    // Clone the template via API to get a new workflow instance
    const response = await fetch(`${settings.backendUrl}/api/workflow-templates/${template.id}/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${template.name} (Copy)`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    const workflow = result.data;

    // Store the workflow in local storage
    chrome.storage.local.set({
      currentTemplate: workflow
    });

    showStatus(`Template "${template.name}" loaded! Opening workflow builder...`, 'success');
    
    // Open workflow builder in new tab with the template
    setTimeout(() => {
      chrome.tabs.create({
        url: `${settings.backendUrl}/workflow-builder.html?template=${template.id}`
      });
    }, 1000);
  } catch (error) {
    console.error('Failed to load template:', error);
    showStatus(`Failed to load template: ${error.message}`, 'error');
  }
}

async function getToken() {
  const { workstationToken } = await chrome.storage.local.get('workstationToken');
  return workstationToken || '';
}

/**
 * Load recorded actions from storage
 */
async function loadRecordedActions() {
  chrome.runtime.sendMessage({ action: 'getRecordedActions' }, (actions) => {
    if (actions && actions.length > 0) {
      // Display count of recorded actions
      showStatus(`${actions.length} actions recorded`, 'info');
    }
  });
}

/**
 * Show status message
 * @param {string} message - Status message
 * @param {string} type - Status type (success, error, info)
 */
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status visible ${type}`;
  
  // Auto-hide info messages after 3 seconds
  if (type === 'info') {
    setTimeout(() => {
      statusDiv.classList.remove('visible');
    }, 3000);
  }
}

/**
 * Display execution result
 * @param {Object} data - Result data
 */
function displayResult(data) {
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(data, null, 2);
  
  resultDiv.innerHTML = '';
  resultDiv.appendChild(pre);
  resultDiv.classList.add('visible');
}

/**
 * Utility Functions
 */
function generateId() {
  return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Real-Time Updates from Background Script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'background:event') {
    handleBackgroundEvent(request.event, request.data);
  }
  sendResponse({ received: true });
});

function handleBackgroundEvent(event, data) {
  console.log('📨 Background event:', event, data);
  
  switch (event) {
    case 'execution:started':
      showStatus(`⚙️ Execution started: ${data.executionId}`, 'info');
      if (currentExecutionId === data.executionId) {
        startPolling(data.executionId);
      }
      break;
      
    case 'execution:progress':
      showStatus(`⚙️ Progress: ${data.progress}%`, 'info');
      break;
      
    case 'execution:completed':
      showStatus(`✅ Execution completed: ${data.executionId}`, 'success');
      if (currentExecutionId === data.executionId) {
        stopPolling();
        displayResult(data.result || {});
      }
      loadHistory(); // Refresh history
      break;
      
    case 'execution:failed':
      showStatus(`❌ Execution failed: ${data.error}`, 'error');
      if (currentExecutionId === data.executionId) {
        stopPolling();
      }
      break;
      
    case 'agent:status':
      console.log(`🤖 Agent ${data.agentId} status: ${data.status}`);
      break;
  }
}

/**
 * Backend Agent Shortcuts
 * Add buttons to trigger specific agents
 */
function setupAgentShortcuts() {
  // This can be called when Builder tab is active
  const agentButtons = [
    { id: 'mainpage', name: 'Navigate Page', icon: '🏠' },
    { id: 'codepage', name: 'Edit Code', icon: '💻' },
    { id: 'repo-agent', name: 'Manage Repo', icon: '📦' },
    { id: 'curriculum', name: 'Learn', icon: '📚' },
    { id: 'designer', name: 'Design UI', icon: '🎨' }
  ];
  
  return agentButtons;
}

/**
 * Trigger a specific backend agent
 */
async function triggerAgent(agentType, params) {
  try {
    showStatus(`🚀 Triggering ${agentType} agent...`, 'info');
    
    const response = await chrome.runtime.sendMessage({
      action: 'triggerAgent',
      agentType,
      params
    });
    
    if (response.success) {
      showStatus(`✅ ${agentType} agent triggered successfully`, 'success');
      
      // Subscribe to updates if we have a task ID
      if (response.data && response.data.taskId) {
        subscribeToTaskUpdates(response.data.taskId);
      }
      
      return response;
    } else {
      throw new Error(response.error || 'Failed to trigger agent');
    }
  } catch (error) {
    showStatus(`❌ Failed to trigger agent: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Get system overview (all agents status)
 */
async function getSystemOverview() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getSystemOverview'
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to get system overview');
    }
  } catch (error) {
    console.error('Failed to get system overview:', error);
    return null;
  }
}

/**
 * Subscribe to execution/task updates via WebSocket
 */
function subscribeToTaskUpdates(taskId) {
  chrome.runtime.sendMessage({
    action: 'subscribeExecution',
    executionId: taskId
  });
}

/**
 * Enhanced workflow execution with backend integration
 */
async function executeWorkflowEnhanced(workflowId, variables = {}) {
  try {
    showStatus('🚀 Executing workflow...', 'info');
    executeBtn.disabled = true;
    
    const response = await chrome.runtime.sendMessage({
      action: 'executeWorkflow',
      workflowId,
      variables,
      useLocal: false // Use backend execution
    });
    
    if (response.success) {
      currentExecutionId = response.data?.executionId || response.executionId;
      
      showStatus(`⚙️ Execution started: ${currentExecutionId}`, 'info');
      
      // Subscribe to real-time updates
      subscribeToTaskUpdates(currentExecutionId);
      
      // Start polling for status
      startPolling(currentExecutionId);
      
      return response;
    } else {
      throw new Error(response.error || 'Execution failed');
    }
  } catch (error) {
    showStatus(`❌ Execution error: ${error.message}`, 'error');
    throw error;
  } finally {
    executeBtn.disabled = false;
  }
}

/**
 * Load workflows from backend
 */
async function loadBackendWorkflows() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getWorkflows',
      params: {
        limit: 50,
        sortBy: 'updated_at',
        order: 'DESC'
      }
    });
    
    if (response.success) {
      return response.data?.workflows || [];
    } else {
      console.error('Failed to load workflows:', response.error);
      return [];
    }
  } catch (error) {
    console.error('Error loading workflows:', error);
    return [];
  }
}

/**
 * Display agent status in Builder tab
 */
async function displayAgentStatus() {
  const overview = await getSystemOverview();
  
  if (overview && builderStatus) {
    builderStatus.textContent = `
      Agents: ${overview.runningAgents}/${overview.totalAgents} running
      | Pending Tasks: ${overview.pendingTasks}
    `;
    builderStatus.classList.add('visible', 'info');
  }
}

// Auto-refresh agent status when Builder tab is active
let agentStatusInterval = null;
function startAgentStatusMonitoring() {
  if (agentStatusInterval) clearInterval(agentStatusInterval);
  
  agentStatusInterval = setInterval(() => {
    const builderTab = document.querySelector('[data-tab="builder"]');
    if (builderTab && builderTab.classList.contains('active')) {
      displayAgentStatus();
    }
  }, 5000);
}

// Call when popup opens
setTimeout(() => {
  displayAgentStatus();
  startAgentStatusMonitoring();
}, 1000);

// Cleanup interval when popup is closed to prevent memory leaks
window.addEventListener('unload', () => {
  if (agentStatusInterval) {
    clearInterval(agentStatusInterval);
  }
});
