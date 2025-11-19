# Browser Extension Wiring - Module 3

## Overview

Learn how to connect browser automation capabilities to browser extensions, create interactive UI controls, and build production-ready extension integrations with the Workstation platform.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│      Browser Extension (UI)             │
│  - Popup interface                      │
│  - Content scripts                      │
│  - Background service worker            │
└──────────────┬──────────────────────────┘
               │ Message Passing
┌──────────────▼──────────────────────────┐
│   Workstation REST API (Backend)        │
│  - JWT Authentication                   │
│  - Workflow Management                  │
│  - Browser Agent Execution              │
└──────────────┬──────────────────────────┘
               │ Playwright
┌──────────────▼──────────────────────────┐
│       Chromium Browser                  │
│  - Automation                           │
│  - Page Interaction                     │
│  - Data Extraction                      │
└─────────────────────────────────────────┘
```

## Extension Components

### 1. Manifest File (manifest.json)

```json
{
  "manifest_version": 3,
  "name": "Workstation Browser Automation",
  "version": "1.0.0",
  "description": "Automate browser tasks with Workstation platform",
  "permissions": [
    "activeTab",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "http://localhost:3000/*",
    "https://api.workstation.io/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ]
}
```

### 2. Popup UI (popup.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Workstation Automation</title>
  <style>
    body {
      width: 350px;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .workflow-item {
      padding: 12px;
      margin: 8px 0;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .workflow-item:hover {
      background: #f5f5f5;
      border-color: #4285f4;
    }
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .status.success { background: #d4edda; color: #155724; }
    .status.running { background: #fff3cd; color: #856404; }
    .status.error { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h2>🤖 Workstation</h2>
  
  <div id="auth-section">
    <input type="text" id="api-token" placeholder="Enter API Token" />
    <button id="save-token">Save Token</button>
  </div>
  
  <div id="workflows-section" style="display:none;">
    <h3>Quick Actions</h3>
    <div id="workflows-list"></div>
    
    <h3>Current Page</h3>
    <div id="page-actions">
      <button id="capture-screenshot">📸 Screenshot</button>
      <button id="extract-text">📝 Extract Text</button>
      <button id="get-links">🔗 Get Links</button>
    </div>
  </div>
  
  <div id="status-section">
    <div id="status-message"></div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

### 3. Popup Logic (popup.js)

```javascript
// Workstation API Client
class WorkstationAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL || 'http://localhost:3000';
    this.token = token;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
    
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async getWorkflows() {
    return this.request('/api/v2/workflows');
  }
  
  async executeWorkflow(workflowId, parameters = {}) {
    return this.request(`/api/v2/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ parameters })
    });
  }
  
  async executeTask(task) {
    return this.request('/api/v2/tasks/execute', {
      method: 'POST',
      body: JSON.stringify(task)
    });
  }
}

// UI Controller
class PopupController {
  constructor() {
    this.api = null;
    this.init();
  }
  
  async init() {
    // Load saved token
    const { apiToken } = await chrome.storage.local.get('apiToken');
    if (apiToken) {
      this.api = new WorkstationAPI('http://localhost:3000', apiToken);
      this.showWorkflowsSection();
      await this.loadWorkflows();
    } else {
      this.showAuthSection();
    }
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.getElementById('save-token').addEventListener('click', () => {
      this.saveToken();
    });
    
    document.getElementById('capture-screenshot').addEventListener('click', () => {
      this.captureScreenshot();
    });
    
    document.getElementById('extract-text').addEventListener('click', () => {
      this.extractText();
    });
    
    document.getElementById('get-links').addEventListener('click', () => {
      this.getLinks();
    });
  }
  
  async saveToken() {
    const token = document.getElementById('api-token').value;
    await chrome.storage.local.set({ apiToken: token });
    this.api = new WorkstationAPI('http://localhost:3000', token);
    this.showWorkflowsSection();
    await this.loadWorkflows();
  }
  
  showAuthSection() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('workflows-section').style.display = 'none';
  }
  
  showWorkflowsSection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('workflows-section').style.display = 'block';
  }
  
  async loadWorkflows() {
    try {
      const data = await this.api.getWorkflows();
      this.renderWorkflows(data.workflows);
    } catch (error) {
      this.showStatus('Failed to load workflows', 'error');
    }
  }
  
  renderWorkflows(workflows) {
    const list = document.getElementById('workflows-list');
    list.innerHTML = workflows.map(wf => `
      <div class="workflow-item" data-id="${wf.id}">
        <strong>${wf.name}</strong>
        <span class="status ${wf.status}">${wf.status}</span>
        <p style="font-size: 12px; color: #666;">${wf.description}</p>
      </div>
    `).join('');
    
    // Add click listeners
    list.querySelectorAll('.workflow-item').forEach(item => {
      item.addEventListener('click', () => {
        this.executeWorkflowById(item.dataset.id);
      });
    });
  }
  
  async executeWorkflowById(workflowId) {
    try {
      this.showStatus('Executing workflow...', 'running');
      await this.api.executeWorkflow(workflowId);
      this.showStatus('Workflow started successfully!', 'success');
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }
  
  async captureScreenshot() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      const result = await this.api.executeTask({
        agent_type: 'browser',
        action: 'screenshot',
        parameters: {
          url: tab.url,
          fullPage: true
        }
      });
      
      this.showStatus('Screenshot captured!', 'success');
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }
  
  async extractText() {
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'extract-text' }, (response) => {
      if (response && response.text) {
        // Send to Workstation API
        this.api.executeTask({
          agent_type: 'data',
          action: 'save',
          parameters: {
            data: response.text,
            source: tab.url
          }
        });
        this.showStatus('Text extracted!', 'success');
      }
    });
  }
  
  async getLinks() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'get-links' }, (response) => {
      if (response && response.links) {
        console.log('Links found:', response.links);
        this.showStatus(`Found ${response.links.length} links`, 'success');
      }
    });
  }
  
  showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    statusEl.innerHTML = `<span class="status ${type}">${message}</span>`;
    
    setTimeout(() => {
      statusEl.innerHTML = '';
    }, 3000);
  }
}

// Initialize
new PopupController();
```

### 4. Content Script (content.js)

```javascript
// Content script runs in the context of web pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract-text') {
    const text = document.body.innerText;
    sendResponse({ text });
  }
  
  if (request.action === 'get-links') {
    const links = Array.from(document.querySelectorAll('a'))
      .map(a => ({
        href: a.href,
        text: a.textContent.trim()
      }));
    sendResponse({ links });
  }
  
  if (request.action === 'highlight-element') {
    const element = document.querySelector(request.selector);
    if (element) {
      element.style.outline = '3px solid #4285f4';
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open
});

// Inject UI overlay for element selection
function injectSelectorTool() {
  const overlay = document.createElement('div');
  overlay.id = 'workstation-selector-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999999;
    cursor: crosshair;
  `;
  
  overlay.addEventListener('mousemove', (e) => {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element && element !== overlay) {
      // Highlight element
      element.style.outline = '2px solid #4285f4';
    }
  });
  
  overlay.addEventListener('click', (e) => {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element) {
      const selector = generateSelector(element);
      chrome.runtime.sendMessage({
        action: 'selector-selected',
        selector: selector
      });
    }
    overlay.remove();
  });
  
  document.body.appendChild(overlay);
}

function generateSelector(element) {
  // Generate unique CSS selector
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c).join('.');
    return `.${classes}`;
  }
  
  // Fallback to nth-child
  const parent = element.parentElement;
  const index = Array.from(parent.children).indexOf(element) + 1;
  return `${element.tagName.toLowerCase()}:nth-child(${index})`;
}
```

### 5. Background Service Worker (background.js)

```javascript
// Handle extension lifecycle and API communication

chrome.runtime.onInstalled.addListener(() => {
  console.log('Workstation Extension installed');
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'workstation-screenshot',
    title: 'Capture Screenshot',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'workstation-extract',
    title: 'Extract Page Data',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { apiToken } = await chrome.storage.local.get('apiToken');
  
  if (!apiToken) {
    chrome.action.openPopup();
    return;
  }
  
  const api = new WorkstationAPI('http://localhost:3000', apiToken);
  
  if (info.menuItemId === 'workstation-screenshot') {
    await api.executeTask({
      agent_type: 'browser',
      action: 'screenshot',
      parameters: {
        url: tab.url,
        fullPage: true
      }
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Screenshot Captured',
      message: 'Page screenshot has been saved'
    });
  }
  
  if (info.menuItemId === 'workstation-extract') {
    chrome.tabs.sendMessage(tab.id, { action: 'extract-text' }, async (response) => {
      if (response) {
        await api.executeTask({
          agent_type: 'data',
          action: 'save',
          parameters: {
            data: response.text,
            source: tab.url,
            timestamp: new Date().toISOString()
          }
        });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Data Extracted',
          message: 'Page data has been saved'
        });
      }
    });
  }
});

// API Client class
class WorkstationAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }
  
  async executeTask(task) {
    const response = await fetch(`${this.baseURL}/api/v2/tasks/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(task)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
```

## Building the Extension

### Development Setup

```bash
# 1. Create extension directory
mkdir -p browser-extension
cd browser-extension

# 2. Copy files
# manifest.json
# popup.html
# popup.js
# content.js
# background.js
# icons/

# 3. Load in Chrome
# chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select browser-extension directory
```

### Production Build

```bash
# 1. Minify JavaScript
npm install -g terser

terser popup.js -o popup.min.js -c -m
terser content.js -o content.min.js -c -m
terser background.js -o background.min.js -c -m

# 2. Package extension
zip -r workstation-extension-v1.0.0.zip \
  manifest.json \
  popup.html \
  popup.min.js \
  content.min.js \
  background.min.js \
  icons/

# 3. Publish to Chrome Web Store
# https://chrome.google.com/webstore/devconsole
```

## Integration Patterns

### Pattern 1: One-Click Workflows

```javascript
// Quick action buttons in popup
async function quickExtract() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  await api.executeWorkflow('quick-extract', {
    url: tab.url,
    selectors: {
      title: 'h1',
      content: '.main-content',
      author: '.author-name'
    }
  });
}
```

### Pattern 2: Scheduled Monitoring

```javascript
// Background monitoring
chrome.alarms.create('monitor-prices', {
  periodInMinutes: 60
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'monitor-prices') {
    api.executeWorkflow('price-monitor');
  }
});
```

### Pattern 3: Context-Aware Actions

```javascript
// Show different actions based on page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const url = new URL(tab.url);
    
    if (url.hostname.includes('linkedin.com')) {
      chrome.action.setBadgeText({ text: 'LinkedIn', tabId });
      // Load LinkedIn-specific workflows
    }
    
    if (url.hostname.includes('github.com')) {
      chrome.action.setBadgeText({ text: 'GitHub', tabId });
      // Load GitHub-specific workflows
    }
  }
});
```

## Business Applications

### For Agencies

**Client-Branded Extensions**
- White-label browser extension per client
- Custom workflows for client needs
- Branded UI and icons

**Value Delivery:**
- Clients see immediate automation value
- Easy onboarding (install extension)
- Recurring revenue from automation services

### For Founders

**SaaS Extension Product**
- Freemium model (basic features free)
- Pro features require subscription
- Chrome Web Store distribution

**Monetization:**
- Monthly/annual subscriptions
- Usage-based pricing
- Enterprise licensing

### For Platform Engineers

**Internal Tool Extensions**
- Company-wide productivity tools
- Standardized workflows
- Compliance and audit trails

**Benefits:**
- Consistent automation across teams
- Centralized control and monitoring
- Scalable deployment

### For Senior Developers

**Development Tools**
- Automated testing workflows
- Page inspection tools
- Performance monitoring

**Developer Experience:**
- Faster debugging
- Automated repetitive tasks
- Better tooling ecosystem

## Security Considerations

### 1. Token Storage

```javascript
// Secure storage
await chrome.storage.local.set({
  apiToken: encryptToken(token)
});

// Never store in localStorage or cookies
// Never hardcode tokens in extension code
```

### 2. Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 3. Permission Minimization

```json
{
  "permissions": [
    "activeTab",  // Only active tab
    "storage"     // Only local storage
  ],
  "optional_permissions": [
    "tabs",       // Request when needed
    "downloads"   // Request when needed
  ]
}
```

### 4. API Security

```javascript
// Always use HTTPS in production
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.workstation.io'
  : 'http://localhost:3000';

// Validate API responses
function validateResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response');
  }
  return data;
}
```

## Testing the Extension

### Manual Testing

```bash
# 1. Load extension in Chrome
# 2. Open popup
# 3. Enter API token
# 4. Test each button
# 5. Check console for errors
```

### Automated Testing

```javascript
// tests/extension.test.js
const puppeteer = require('puppeteer');

test('Extension loads and authenticates', async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=./browser-extension`,
      `--load-extension=./browser-extension`
    ]
  });
  
  const page = await browser.newPage();
  await page.goto('chrome://extensions');
  
  // Verify extension is loaded
  const extensions = await page.$$('.extension-name');
  expect(extensions.length).toBeGreaterThan(0);
  
  await browser.close();
});
```

## Next Steps

✅ **Browser extension integration complete**

→ Proceed to [Module 4: Customization](../module-4-customization/README.md)

## Business Impact

**For Agencies:**
- Deliver branded automation tools to clients
- Recurring revenue from extension subscriptions
- Differentiate with custom UI/UX

**For Founders:**
- Chrome Web Store distribution = instant reach
- Freemium model for growth
- Extension ecosystem for lock-in

**For Platform Engineers:**
- Company-wide standard tools
- Centralized control and updates
- Compliance and security enforcement

**For Senior Developers:**
- Better developer experience
- Automated workflows at fingertips
- Extensible architecture for custom tools
