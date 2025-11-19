/**
 * Workstation Chrome Extension - Popup Script
 * Handles UI interactions and communication with background script
 */

// DOM elements
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const executeBtn = document.getElementById('executeBtn');
const promptTextarea = document.getElementById('prompt');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
const recordingIndicator = document.getElementById('recordingIndicator');

let isRecording = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadRecordedActions();
});

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

// Execute button click
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
      (response) => {
        executeBtn.disabled = false;
        executeBtn.textContent = '🚀 Execute Workflow';
        
        if (response && response.success) {
          showStatus('✅ Workflow executed successfully!', 'success');
          displayResult(response.data);
        } else {
          const errorMsg = response?.error || 'Unknown error occurred';
          showStatus(`❌ Execution failed: ${errorMsg}`, 'error');
          displayResult({ error: errorMsg });
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
