# 🔗 Complete Integration Flow

## Overview

This document explains how all components work together in the one-click deployment system, from user action to fully operational workflow builder.

---

## The One-Click Journey

```
User Types:
./one-click-deploy.sh
        │
        ▼
    [MAGIC HAPPENS]
        │
        ▼
Workflow Builder Opens
Extension Connected
Ready to Automate!
```

---

## Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ACTION                                   │
│                ./one-click-deploy.sh                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                STEP 1: PREREQUISITES CHECK                       │
│  ├─► Check Node.js 18+ installed                                │
│  ├─► Check npm installed                                        │
│  ├─► Detect Chrome/Chromium                                     │
│  └─► Validate or exit with helpful error                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                STEP 2: ENVIRONMENT SETUP                         │
│  ├─► Check for .env file                                        │
│  ├─► If not exists:                                             │
│  │   ├─► Copy .env.example → .env                               │
│  │   ├─► Generate crypto-random 32-byte JWT secret              │
│  │   └─► Replace placeholder in .env                            │
│  └─► Source .env to load variables                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               STEP 3: DEPENDENCY INSTALLATION                    │
│  ├─► Check if node_modules exists                               │
│  ├─► If exists: npm ci (faster, exact versions)                 │
│  └─► If not: npm install (install all)                          │
│      └─► ~120 packages installed (~30 seconds)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STEP 4: BUILD TYPESCRIPT                        │
│  ├─► Run: npm run build                                         │
│  │   ├─► tsc compiles src/ → dist/                              │
│  │   └─► Copy assets (SQL schemas, etc.)                        │
│  └─► Result: dist/ directory with compiled JS                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 5: BUILD CHROME EXTENSION                      │
│  ├─► Run: npm run build:chrome                                  │
│  │   ├─► rm -rf build/chrome-extension                          │
│  │   ├─► mkdir -p build/chrome-extension                        │
│  │   └─► cp -r chrome-extension/* build/chrome-extension/       │
│  ├─► Extension files copied:                                    │
│  │   ├─► manifest.json                                          │
│  │   ├─► background.js (with auto-connect)                      │
│  │   ├─► popup/ (HTML + JS + CSS)                               │
│  │   ├─► auto-connect.js (NEW!)                                 │
│  │   └─► icons/, playwright/, etc.                              │
│  └─► Validate manifest.json exists                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                STEP 6: START BACKEND SERVER                      │
│  ├─► Check if port 3000 in use                                  │
│  │   └─► If yes: kill process on port 3000                      │
│  ├─► Start server: npm start &                                  │
│  │   ├─► Output to: /tmp/workstation-server.log                 │
│  │   └─► PID saved to: /tmp/workstation-server.pid              │
│  ├─► Wait for server ready (max 30 seconds):                    │
│  │   └─► Poll: curl http://localhost:3000/health                │
│  └─► Server ready! ✓                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 7: LAUNCH CHROME                            │
│  ├─► Create temp profile: /tmp/workstation-chrome-profile       │
│  ├─► Launch Chrome with:                                        │
│  │   ├─► --user-data-dir=/tmp/workstation-chrome-profile        │
│  │   ├─► --load-extension=build/chrome-extension                │
│  │   ├─► --no-first-run                                         │
│  │   └─► Open: http://localhost:3000/workflow-builder.html      │
│  ├─► PID saved to: /tmp/workstation-chrome.pid                  │
│  └─► Chrome opens with extension loaded! ✓                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              CHROME EXTENSION AUTO-CONNECT                       │
│  (Runs automatically when extension loads)                       │
│                                                                  │
│  background.js: autoConnectToBackend()                           │
│  ├─► Try backend URLs in order:                                 │
│  │   ├─► http://localhost:3000                                  │
│  │   ├─► http://127.0.0.1:3000                                  │
│  │   ├─► http://localhost:8080                                  │
│  │   └─► http://127.0.0.1:8080                                  │
│  │                                                               │
│  ├─► For each URL:                                              │
│  │   ├─► fetch(`${url}/health`, { timeout: 3s })                │
│  │   └─► If 200 OK → Backend found!                             │
│  │                                                               │
│  ├─► When backend found:                                        │
│  │   ├─► Update settings.backendUrl                             │
│  │   ├─► Get JWT token:                                         │
│  │   │   └─► fetch(`${url}/auth/demo-token`)                    │
│  │   ├─► Store token in chrome.storage.local                    │
│  │   ├─► Update badge: ✓ (green)                                │
│  │   └─► Log: "Auto-connect successful"                         │
│  │                                                               │
│  └─► If no backend found:                                       │
│      ├─► Update badge: ✗ (red)                                  │
│      └─► Log: "No backend detected"                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            EXTENSION CONNECTION MONITORING                       │
│  (Runs continuously every 10 seconds)                            │
│                                                                  │
│  setInterval(() => {                                            │
│    ├─► Check: fetch(`${backendUrl}/health`)                     │
│    ├─► If success:                                              │
│    │   └─► Update badge: ✓ (green)                              │
│    └─► If fail:                                                 │
│        └─► Update badge: ✗ (red)                                │
│  }, 10000)                                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              POPUP UI UPDATES (When User Opens)                  │
│                                                                  │
│  popup/script.js: DOMContentLoaded                              │
│  ├─► checkConnectionStatus()                                    │
│  │   ├─► fetch(`${backendUrl}/health`)                          │
│  │   └─► updateConnectionStatus(connected, message)             │
│  │       ├─► If connected: Green indicator                      │
│  │       └─► If offline: Red indicator                          │
│  │                                                               │
│  ├─► loadSettings() → Get backendUrl from storage               │
│  ├─► loadHistory() → Get workflow history                       │
│  └─► loadTemplates() → Get templates from backend               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                USER OPENS WORKFLOW BUILDER                       │
│  (Via extension Builder tab or direct URL)                       │
│                                                                  │
│  User clicks: "Open Builder" button                             │
│  ├─► Check: isConnected                                         │
│  ├─► If offline: Show error                                     │
│  └─► If online:                                                 │
│      ├─► chrome.tabs.create()                                   │
│      └─► URL: http://localhost:3000/workflow-builder.html       │
│                                                                  │
│  Workflow Builder Page Loads:                                   │
│  ├─► Check localStorage.authToken                               │
│  ├─► If no token: Show login prompt                             │
│  └─► If token exists:                                           │
│      ├─► Initialize D3.js canvas                                │
│      ├─► Load node library (39 node types)                      │
│      ├─► Setup drag-and-drop                                    │
│      ├─► Connect to backend APIs                                │
│      └─► Ready to build workflows! ✓                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER CREATES WORKFLOW                         │
│                                                                  │
│  1. Drag nodes onto canvas                                      │
│  2. Connect nodes (output → input)                              │
│  3. Configure node parameters                                   │
│  4. Click "Execute Workflow"                                    │
│     ↓                                                            │
│  Workflow Builder JS:                                           │
│  ├─► Convert visual nodes → backend tasks                       │
│  ├─► POST /api/v2/execute with JWT token                        │
│  ├─► Get executionId from response                              │
│  ├─► Start polling: GET /api/v2/executions/:id/status           │
│  │   └─► Every 1 second until complete                          │
│  └─► Display real-time progress                                 │
│                                                                  │
│  Backend Orchestration Engine:                                  │
│  ├─► Parse workflow definition                                  │
│  ├─► Build dependency graph                                     │
│  ├─► Execute tasks in parallel (where possible)                 │
│  ├─► Update execution status in database                        │
│  └─► Return results                                             │
│                                                                  │
│  Results Displayed:                                             │
│  ├─► ✅ Success (green)                                         │
│  ├─► ❌ Failed (red with error)                                │
│  ├─► 🏃 Running (blue with progress %)                         │
│  └─► Logs expandable for debugging                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Communication

### 1. Chrome Extension ↔ Backend Server

**Initial Connection:**
```javascript
// Extension background.js
fetch('http://localhost:3000/health')
  .then(response => {
    if (response.ok) {
      // Connected!
      fetch('http://localhost:3000/auth/demo-token')
        .then(data => {
          token = data.token;
          chrome.storage.local.set({ authToken: token });
        });
    }
  });
```

**Ongoing Communication:**
```javascript
// Every 10 seconds
setInterval(checkHealth, 10000);
```

### 2. Workflow Builder ↔ Backend Server

**Execute Workflow:**
```javascript
// workflow-builder.html
const workflow = convertNodesToTasks(visualNodes);

fetch('/api/v2/execute', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ definition: workflow })
})
.then(response => response.json())
.then(data => {
  const executionId = data.data.id;
  pollExecutionStatus(executionId);
});
```

**Poll Status:**
```javascript
function pollExecutionStatus(id) {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/v2/executions/${id}/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    updateProgressBar(data.data.progress);
    
    if (data.data.status === 'completed' || data.data.status === 'failed') {
      clearInterval(interval);
      showResults(data.data);
    }
  }, 1000);
}
```

### 3. Extension Popup ↔ Extension Background

**Get Connection Status:**
```javascript
// popup/script.js
chrome.runtime.sendMessage({ action: 'getConnectionStatus' }, (response) => {
  updateConnectionUI(response.connected, response.message);
});
```

**Execute Workflow:**
```javascript
// popup/script.js
chrome.runtime.sendMessage({
  action: 'executeWorkflow',
  workflow: workflowDefinition
}, (response) => {
  if (response.success) {
    showStatus('Workflow executing...', 'info');
  }
});
```

---

## Security Flow

### JWT Token Lifecycle

```
1. Server Starts
   └─► Reads JWT_SECRET from .env

2. Extension Auto-Connects
   └─► GET /auth/demo-token
       └─► Server generates JWT with:
           - Payload: { userId: 'demo', exp: 24h }
           - Secret: JWT_SECRET
           - Algorithm: HS256
       └─► Returns: { token: "eyJhbGc..." }

3. Extension Stores Token
   └─► chrome.storage.local.set({ authToken: token })

4. All Subsequent Requests
   └─► Headers: { Authorization: "Bearer eyJhbGc..." }

5. Server Validates Token
   └─► Middleware: authenticateToken()
       ├─► Extract token from header
       ├─► Verify with JWT_SECRET
       ├─► Check expiration
       └─► If valid: Continue
           If invalid: Return 401 Unauthorized

6. Token Expiration (24h)
   └─► Extension detects 401 response
       └─► Auto-requests new token
           └─► Stores new token
```

---

## Error Handling & Recovery

### Scenario 1: Backend Offline When Extension Loads

```
Extension loads
  ↓
autoConnectToBackend()
  ↓
Try all URLs → All fail
  ↓
Set status: Not Connected
  ↓
Badge: ✗ (red)
  ↓
Keep monitoring (10s interval)
  ↓
User starts backend
  ↓
Next health check succeeds
  ↓
Auto-reconnect!
  ↓
Badge: ✓ (green)
```

### Scenario 2: Connection Lost During Use

```
User executing workflow
  ↓
Network error / Server crash
  ↓
Workflow execution fails
  ↓
Health check fails
  ↓
Badge: ✗ (red)
  ↓
Popup shows: "Backend offline"
  ↓
User restarts server
  ↓
Auto-reconnect within 10s
  ↓
User can resume
```

### Scenario 3: Invalid Token

```
Request with expired token
  ↓
Backend returns 401
  ↓
Extension detects 401
  ↓
Request new token
  ↓
Retry original request
  ↓
Success!
```

---

## Deployment Checklist

After running `./one-click-deploy.sh`, verify:

- [ ] Chrome opened automatically
- [ ] Extension icon visible in toolbar
- [ ] Click extension → See green connection status
- [ ] Workflow builder tab loaded
- [ ] Can create nodes in builder
- [ ] Can execute test workflow
- [ ] History shows execution
- [ ] Logs are accessible
- [ ] `curl http://localhost:3000/health` returns OK

---

## Cleanup Process

Running `/tmp/stop-workstation.sh`:

```bash
1. Read /tmp/workstation-server.pid
   └─► kill <server_pid>
   
2. Read /tmp/workstation-chrome.pid
   └─► kill <chrome_pid>
   
3. Remove temp files
   └─► rm -rf /tmp/workstation-chrome-profile
   └─► rm /tmp/workstation-*.pid
   
4. Server logs remain at /tmp/workstation-server.log
   (For debugging if needed)
```

---

## Performance Metrics

**Deployment Time Breakdown:**
- Prerequisites check: 2s
- Environment setup: 1s
- npm install: 20-40s (first time) or 5s (subsequent)
- TypeScript build: 10-15s
- Extension build: 1s
- Server startup: 5s
- Chrome launch: 3s
- **Total: ~2-3 minutes**

**Runtime Performance:**
- Connection check interval: 10s
- Status poll interval: 1s (during execution)
- Health check timeout: 3s
- Token validity: 24 hours

---

## Architecture Benefits

✅ **Zero Configuration** - User doesn't edit any files
✅ **Automatic Discovery** - Extension finds backend automatically
✅ **Self-Healing** - Auto-reconnects when connection restored
✅ **Visual Feedback** - Clear connection status at all times
✅ **Fail-Safe** - Graceful degradation if components missing
✅ **Easy Cleanup** - One command to stop everything
✅ **Developer-Friendly** - Clear logs and error messages

---

This integration flow ensures a seamless experience from deployment to active workflow automation, with minimal user intervention and maximum reliability.
