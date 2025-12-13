# Workstation Chrome Extension

## ⚠️ DO NOT LOAD THIS FOLDER DIRECTLY INTO CHROME

This folder contains **SOURCE CODE** that must be built first.

**Loading this folder directly will result in errors and broken functionality.**

---

## 🚀 Quick Start

**See: [🚀_START_HERE.md](../🚀_START_HERE.md) for complete setup instructions**

### Quick Version:

```bash
# From repository root:
bash ./scripts/build-enterprise-chrome-extension.sh

# Then:
# 1. Go to the dist/ directory
# 2. Extract the generated workstation-ai-agent-*.zip file to a folder of your choice
# 3. In Chrome, go to chrome://extensions/
# 4. Enable "Developer mode"
# 5. Click "Load unpacked" and select the extracted folder
```

**⚡ SHORTCUT:** Pre-built ZIP files already exist in `../dist/`!

---

## Alternative: Use Pre-Built Extension

**Production ZIPs are already built!** No build required:

1. Go to `../dist/` directory
2. Extract any `workstation-ai-agent-*.zip` file
3. Load the extracted folder in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extracted folder

---

## Overview

The Workstation Chrome Extension is a comprehensive browser automation tool that integrates **Playwright agentic modules** with the **Workstation backend API** to provide enterprise-grade workflow automation with real-time updates, self-healing capabilities, and multi-agent orchestration.

## ✨ Key Features

### Core Capabilities
- **🤖 Natural Language Automation**: Describe workflows in plain English
- **📹 Visual Action Recording**: Record user interactions for workflow creation
- **🔐 JWT Authentication**: Secure communication with backend
- **⚡ Real-time Execution**: Execute workflows with live progress updates
- **🔄 Self-Healing Workflows**: Automatic retry with selector healing
- **🌐 Network Monitoring**: Track and wait for API calls
- **📊 Multi-Agent Integration**: Connect to all backend agents

### Playwright Agentic Modules (All 9 Integrated)
1. **Auto-Wait** - Intelligent element waiting with multi-strategy selectors
2. **Network Monitor** - Request/response tracking and interception
3. **Retry Manager** - Exponential backoff with error classification
4. **Execution Engine** - Workflow orchestration and queue management
5. **Self-Healing Selectors** - Automatic selector recovery
6. **Form Filling Agent** - Smart form completion
7. **Trace Recorder** - Detailed execution tracing
8. **Agentic Network** - ML-powered request analysis
9. **Context Learning** - Learn from execution patterns

### Backend Integration
- **Workflow Management** - Create, save, execute workflows
- **Agent Orchestration** - Trigger mainpage, codepage, repo-agent, curriculum, designer agents
- **Real-Time Updates** - WebSocket connection for live status
- **Execution Monitoring** - Track progress, logs, and results
- **History & Templates** - Workflow library and reusable templates

## Installation

### Prerequisites

1. **Workstation Backend Running**: The backend must be running (default: `http://localhost:7042`)
   ```bash
   npm run dev
   ```

2. **Chrome Browser**: Chrome or any Chromium-based browser (Edge, Brave, etc.)

### Steps

1. **Build the Extension**:
   ```bash
   npm run build:chrome
   ```

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right corner)
   - Click "Load unpacked"
   - Select the directory: `build/chrome-extension/`

3. **Verify Installation**:
   - The Workstation icon should appear in your extensions toolbar
   - Click the icon to open the popup
   - The extension will automatically fetch a JWT token from the backend
   - WebSocket connection will be established for real-time updates

## Usage

### Execute Tab - Basic Workflow Execution

1. Click the Workstation extension icon
2. Enter a description in the textarea, for example:
   ```
   Navigate to https://example.com and take a screenshot
   ```
3. Click "🚀 Execute Workflow"
4. View real-time progress and results in the popup

### Builder Tab - Visual Workflow Builder

1. Switch to the **Builder** tab
2. Click "🎨 Open Builder" to launch the visual workflow editor
3. Drag and drop nodes to create complex workflows
4. View system overview: running agents, pending tasks
5. Monitor agent health and status in real-time

### Templates Tab - Reusable Workflows

1. Browse available workflow templates
2. Click a template to load it into the Execute tab
3. Customize parameters as needed
4. Execute or save as your own workflow

### History Tab - Execution History

1. View all past workflow executions
2. Click any history item to reload that workflow
3. See execution status (success, error, running)
4. Clear history with the "Clear All" button

### Settings Tab - Configuration

Configure the extension behavior:
- **Backend URL**: Change the API server endpoint (default: `http://localhost:7042`)
  - For local development: `http://localhost:7042`
  - For Railway deployment: `https://your-app.railway.app`
  - For custom deployment: Your backend server URL
- **Poll Interval**: Adjust status polling frequency (default: 2000ms)
- **Auto Retry**: Enable/disable automatic retry on failures
- **WebSocket**: Real-time updates connection (enabled by default)

#### Configuring for Production Deployment

If you've deployed the backend to Railway or another platform:

1. Open the Chrome extension popup
2. Click on the "Settings" tab
3. Update "Backend URL" to your deployed backend URL (e.g., `https://your-app.railway.app`)
4. Click "Save Settings"
5. The extension will automatically reconnect to the new backend

### Recording Actions

1. Click the "⏺️ Record" button
2. Interact with the web page (click, type, navigate)
3. All actions are captured with Playwright-quality selectors
4. Click "⏹️ Stop" to finish recording
5. The recorded actions include self-healing selector strategies

### Agent Integration

Trigger backend agents directly from the extension:

```javascript
// Mainpage Agent - Navigate pages
triggerAgent('mainpage', { url: 'https://example.com', waitFor: 'load' });

// Codepage Agent - Edit code
triggerAgent('codepage', { file: 'index.js', changes: [...] });

// Repo Agent - Manage repositories
triggerAgent('repo-agent', { action: 'clone', repo: 'user/repo' });

// Curriculum Agent - Learning tasks
triggerAgent('curriculum', { topic: 'TypeScript', difficulty: 'intermediate' });

// Designer Agent - UI design
triggerAgent('designer', { component: 'button', style: 'modern' });
```

## Architecture

### Files

```
chrome-extension/
├── manifest.json              # Chrome Extension manifest (v3)
├── background.js              # Service worker with API bridge
├── api-bridge.js              # Backend API client with WebSocket
├── content.js                 # Content script for page interaction
├── mcp-client.js              # MCP protocol implementation
├── popup/
│   ├── index.html            # Popup UI with 5 tabs
│   └── script.js             # Popup logic with real-time updates
├── playwright/               # Agentic automation modules
│   ├── auto-wait.js         # Multi-strategy element waiting
│   ├── network.js           # Network monitoring
│   ├── retry.js             # Retry with exponential backoff
│   ├── execution.js         # Workflow execution engine
│   ├── self-healing.js      # Selector self-healing
│   ├── form-filling.js      # Intelligent form automation
│   ├── trace-recorder.js    # Execution tracing
│   ├── agentic-network.js   # ML-powered network analysis
│   └── context-learning.js  # Pattern learning system
├── icons/
│   ├── icon16.png           # Extension icon (16x16)
│   ├── icon48.png           # Extension icon (48x48)
│   └── icon128.png          # Extension icon (128x128)
└── README.md                # This file
```

### Communication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     Chrome Extension Popup                        │
│  ┌────────┬─────────┬───────────┬──────────┬──────────┐          │
│  │Execute │ Builder │ Templates │ History  │ Settings │          │
│  └────────┴─────────┴───────────┴──────────┴──────────┘          │
└─────────────────────────┬────────────────────────────────────────┘
                          │ chrome.runtime.sendMessage()
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│               Background Service Worker                           │
│  ┌──────────────┬─────────────────┬────────────────────┐        │
│  │ API Bridge   │ Playwright      │ Event Handlers     │        │
│  │ (api-bridge) │ Execution       │ (WebSocket)        │        │
│  └──────────────┴─────────────────┴────────────────────┘        │
└───┬──────────────────┬──────────────────┬────────────────────────┘
    │                  │                  │
    │ HTTP/REST        │ chrome.tabs API  │ WebSocket (ws://)
    ↓                  ↓                  ↓
┌────────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Workstation    │  │ Content      │  │ Real-Time        │
│ Backend API    │  │ Script       │  │ Updates Server   │
│ (:3000)        │  │ (content.js) │  │ (WebSocket)      │
└────┬───────────┘  └──────┬───────┘  └──────────────────┘
     │                     │
     │  ┌──────────────────┴────────────────────┐
     │  │ Playwright Agentic Modules:           │
     └──┤ • Auto-Wait        • Network Monitor  │
        │ • Retry Manager    • Self-Healing     │
        │ • Form Filling     • Trace Recorder   │
        │ • Agentic Network  • Context Learning │
        └───────────────────────────────────────┘
```

### Backend API Integration

The extension integrates with comprehensive backend endpoints:

#### Authentication
- **GET /auth/demo-token**: Fetch JWT authentication token

#### Agent Management
- **GET /api/agents**: List all agents
- **GET /api/agents/:id**: Get agent details
- **POST /api/agents/:id/start**: Start an agent
- **POST /api/agents/:id/stop**: Stop an agent
- **POST /api/agents/tasks**: Create agent task
- **GET /api/agents/tasks/:id**: Get task status
- **GET /api/agents/system/overview**: System overview

#### Workflow Management
- **GET /api/workflows**: List user workflows
- **GET /api/workflows/:id**: Get workflow details
- **POST /api/workflows**: Create new workflow
- **PUT /api/workflows/:id**: Update workflow
- **DELETE /api/workflows/:id**: Delete workflow
- **POST /api/v2/workflows/:id/execute**: Execute workflow

#### Execution Management
- **GET /api/v2/executions/:id**: Get execution details
- **GET /api/v2/executions/:id/tasks**: Get execution tasks
- **GET /api/v2/executions/:id/logs**: Get execution logs
- **POST /api/v2/executions/:id/cancel**: Cancel execution
- **POST /api/v2/executions/:id/retry**: Retry execution

#### Example: Execute Workflow with Backend Agent

```javascript
// Using the API Bridge
const response = await chrome.runtime.sendMessage({
  action: 'executeWorkflow',
  workflowId: 'wf_12345',
  variables: {
    url: 'https://example.com',
    selector: '#main-content'
  },
  useLocal: false  // Use backend execution
});

// Response
{
  success: true,
  executionId: 'exec_67890',
  status: 'running',
  isLocal: false
}
```

#### Example: Trigger Specific Agent

```javascript
// Trigger mainpage agent for navigation
const response = await chrome.runtime.sendMessage({
  action: 'triggerAgent',
  agentType: 'mainpage',
  params: {
    url: 'https://github.com',
    waitFor: 'networkidle',
    screenshot: true
  }
});

// Response
{
  success: true,
  data: {
    taskId: 'task_abc123',
    agentId: 'mainpage',
    status: 'queued'
  }
}
```

### WebSocket Real-Time Updates

The extension maintains a WebSocket connection for real-time status updates:

```javascript
// Events received from backend
{
  type: 'execution:started',
  data: { executionId: 'exec_123', timestamp: 1234567890 }
}

{
  type: 'execution:progress',
  data: { executionId: 'exec_123', progress: 45, currentTask: 'Navigate' }
}

{
  type: 'execution:completed',
  data: { executionId: 'exec_123', result: { ... }, duration: 5420 }
}

{
  type: 'agent:status',
  data: { agentId: 'mainpage', status: 'running', health: 'healthy' }
}
```

```json
{
  "success": true,
  "data": {
    "workflow": {
      "id": "wf_abc123",
      "name": "Navigate to https://example.com and take a screenshot",
      "status": "active"
    },
    "execution": {
      "id": "exec_xyz789",
      "workflow_id": "wf_abc123",
      "status": "running"
    }
  },
  "message": "Workflow created and execution started"
}
```

## Development

### Building

Build the extension after making changes:

```bash
npm run build:chrome
```

### Testing

Validate the build:

```bash
npm run test:chrome
```

This checks:
- All required files exist
- manifest.json is valid
- File sizes are reasonable

### Debugging

1. **Background Service Worker**:
   - Open `chrome://extensions/`
   - Find "Workstation AI Agent"
   - Click "Inspect views: background page"
   - View console logs

2. **Popup**:
   - Right-click the extension icon
   - Select "Inspect"
   - View console logs

3. **Content Script**:
   - Open Developer Tools on any webpage (F12)
   - View console logs
   - Content script logs are prefixed with ⏺️ or ⏹️

### Common Issues

#### "Token fetch failed"

**Cause**: Backend is not running or not accessible.

**Solution**: Start the backend with `npm run dev` and ensure it's running on port 3000.

#### "Workflow execution failed"

**Cause**: Invalid workflow description or API error.

**Solution**: Check the error message in the popup. Common issues:
- Backend database not initialized
- Invalid JWT token
- Malformed request

#### "Extension not loading"

**Cause**: Invalid manifest or missing files.

**Solution**: 
1. Run `npm run build:chrome` again
2. Run `npm run test:chrome` to validate
3. Check console for specific errors

## Security

### Token Storage

JWT tokens are stored in Chrome's local storage using `chrome.storage.local`. This is isolated per-extension and not accessible by web pages.

### CORS Configuration

The backend must allow requests from the Chrome extension. The extension uses:
- `host_permissions: ["<all_urls>", "http://localhost:3000/*"]`

Ensure your backend CORS configuration allows these origins in development.

### Content Security Policy

The extension uses:
- `manifest_version: 3` (latest and most secure)
- Service worker for background tasks
- Content scripts run in isolated context

## Roadmap

### v2.0 Features ✅ IMPLEMENTED (Current Release)
- [x] **Full Playwright Integration** - All 9 agentic modules integrated
- [x] **Backend Agent Integration** - Connect to mainpage, codepage, repo-agent, curriculum, designer
- [x] **Real-Time WebSocket Updates** - Live execution progress and agent status
- [x] **API Bridge** - Comprehensive backend communication layer
- [x] **Workflow Management** - Create, save, execute, delete workflows via backend
- [x] **Multi-Agent Orchestration** - Trigger and monitor backend agents
- [x] **Self-Healing Workflows** - Automatic retry with selector healing
- [x] **Network Monitoring** - Track and analyze API requests
- [x] **Context Learning** - ML-powered pattern recognition
- [x] **Visual Builder Integration** - Connect to workflow builder (PR #156)
- [x] **Execution Logs** - Detailed logging and trace recording
- [x] **System Overview** - Monitor all agents and pending tasks

### v1.2 Features ✅ COMPLETED
- [x] Workflow templates library - Pre-built automation examples (5 templates)
- [x] Template categories (search, forms, capture, extraction, authentication)
- [x] Click-to-load templates

### v1.1 Features ✅ COMPLETED
- [x] Workflow history in popup - View past workflows with status
- [x] Save and reuse workflows - Persistent workflow storage
- [x] Execution status polling - Real-time status updates
- [x] Error retry mechanism - Integrated into UI with automatic retries
- [x] Settings page for backend URL configuration
- [x] Configurable poll interval for status updates

### v2.1 Features (Planned)
- [ ] AI-powered workflow suggestions based on context learning
- [ ] Browser action automation preview before execution
- [ ] Collaborative workflow sharing across team members
- [ ] Advanced analytics dashboard
- [ ] Workflow marketplace
- [ ] Custom agent creation from extension
- [ ] Multi-workspace support
- [ ] Export/Import workflows (JSON/YAML)
- [ ] Scheduled workflow execution
- [ ] Workflow versioning and rollback

## Performance

### Metrics
- **Extension Size**: ~250KB (uncompressed)
- **Memory Usage**: ~30MB average
- **Startup Time**: <100ms
- **WebSocket Latency**: <50ms for real-time updates
- **API Response Time**: <200ms for most operations

### Optimization
- Lazy loading of Playwright modules
- Efficient message passing with chrome.runtime
- Minimal DOM manipulation in content scripts
- Debounced network monitoring
- Cached selector strategies

## Compatibility

### Browsers
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave 1.20+
- ✅ Opera 74+
- ⚠️ Firefox (requires manifest v2 conversion)

### Backend Requirements
- Node.js 18+
- TypeScript 5.3+
- PostgreSQL or SQLite database
- WebSocket support
- [ ] Chrome Web Store publication

## v1.1 & v1.2 Features Overview

### Workflow History
- **View Past Executions**: See all previously executed workflows
- **Status Tracking**: Each workflow shows its status (success, error, running, saved)
- **Quick Reload**: Click any history item to load it into the execute tab
- **Timestamps**: Human-readable timestamps (e.g., "5 minutes ago", "2 hours ago")
- **Clear History**: Option to clear all history

### Save & Load Workflows  
- **Save for Later**: Save workflow descriptions without executing them
- **Reuse Workflows**: Reload saved workflows with a single click
- **Persistent Storage**: Workflows stored in Chrome's local storage

### Real-Time Status Polling
- **Live Updates**: Automatically polls backend for execution status
- **Progress Tracking**: Shows execution progress percentage when available
- **Configurable Interval**: Adjust polling frequency in settings (500ms - 10s)
- **Auto-Stop**: Polling stops when workflow completes or fails

### Settings Page
- **Backend URL**: Configure custom backend URL (default: http://localhost:3000)
- **Poll Interval**: Adjust how often to check execution status (default: 2000ms)
- **Auto-Retry**: Enable/disable automatic retry on failure (default: enabled)
- **Persistent Settings**: Settings saved to Chrome storage

### Workflow Templates (NEW!)
- **5 Pre-Built Templates**: Ready-to-use automation workflows
- **Categories**: search, forms, capture, extraction, authentication
- **Click-to-Load**: Load template into execute tab with one click
- **Customizable Variables**: Each template includes configurable variables
- **Backend Integration**: Templates fetched from `/api/v2/templates` endpoint

**Available Templates:**
1. **Google Search** - Search Google and take a screenshot
2. **Form Filler** - Navigate and fill out forms automatically
3. **Screenshot Capture** - Navigate to URL and capture full-page screenshot
4. **Data Extractor** - Extract text content from webpages
5. **Login Flow** - Automated login workflow with credentials

## Updated Usage

### Using Templates

1. Click "Templates" tab
2. Browse available templates by category
3. Click any template to load it
4. Template description loads into Execute tab
5. Customize variables if needed
6. Click "Execute Workflow"

### Using the History Tab

1. Click "History" tab to view all workflows
2. Each item shows:
   - Workflow description
   - Status badge (success, error, running, saved)
   - Timestamp
3. Click any item to load it into the execute tab
4. Use "Clear All" to remove all history

### Saving Workflows

1. Enter workflow description in the Execute tab
2. Click "💾 Save" button (no execution)
3. Workflow saved to history with "saved" status
4. Access later from History tab

### Configuring Settings

1. Click "Settings" tab
2. Modify:
   - Backend URL (e.g., for production deployment)
   - Status Poll Interval (in milliseconds)
   - Auto-Retry toggle
3. Click "💾 Save Settings"
4. Settings applied immediately

### Real-Time Execution Monitoring

When you execute a workflow:
1. Workflow immediately added to history with "running" status
2. Extension polls backend every N milliseconds (configurable)
3. Status updates shown in real-time:
   - "⏳ Running... (25%)"
   - "⏳ Running... (50%)"
   - "✅ Workflow completed successfully!"
4. Final status saved to history

## Troubleshooting

### Extension Not Loading
1. Ensure `npm run build:chrome` completed successfully
2. Check `chrome://extensions/` for error messages
3. Verify manifest.json is valid JSON
4. Clear cache and reload extension

### WebSocket Connection Failed
1. Verify backend server is running
2. Check backend supports WebSocket connections
3. Review CORS settings in backend
4. Check browser console for WebSocket errors

### Real-Time Updates Not Working
1. Enable WebSocket in Settings tab
2. Check network tab for WebSocket connection
3. Verify backend WebSocket endpoint is accessible
4. Review background service worker console for errors

### Agent Trigger Failures
1. Ensure backend agents are registered and running
2. Check agent health via GET /api/agents/system/overview
3. Verify JWT token is valid
4. Review execution logs for specific error messages

## Contributing

We welcome contributions! Here's how to get started:

1. **Setup Development Environment**:
   ```bash
   git clone https://github.com/creditXcredit/workstation.git
   cd workstation
   npm install
   ```

2. **Make Changes**:
   - Edit files in `chrome-extension/`
   - Follow existing code style and patterns
   - Add comments for complex logic

3. **Build and Test**:
   ```bash
   npm run build:chrome
   npm run test:chrome
   ```

4. **Test in Browser**:
   - Reload extension in `chrome://extensions/`
   - Test all tabs (Execute, Builder, Templates, History, Settings)
   - Verify no console errors

5. **Submit Pull Request**:
   - Create feature branch
   - Write descriptive commit messages
   - Update documentation if needed
   - Submit PR with clear description

### Development Tips
- Use `console.log()` liberally for debugging
- Test with both local and backend execution modes
- Verify WebSocket connection stability
- Check memory usage in Task Manager

## Additional Resources

- **Playwright Documentation**: [https://playwright.dev/](https://playwright.dev/)
- **Chrome Extension API**: [https://developer.chrome.com/docs/extensions/](https://developer.chrome.com/docs/extensions/)
- **MCP Protocol**: See `.mcp/` directory for specifications
- **Workstation Backend API**: See `API.md` in repository root
- **Visual Workflow Builder**: See `public/workflow-builder.html`

## Support

- **Issues**: [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)
- **Documentation**: See `docs/` directory

## License

MIT License - See [LICENSE](../LICENSE) file in repository root.

## Acknowledgments

- **Playwright Team**: For the excellent browser automation framework
- **Chrome Extensions Team**: For the powerful extension platform
- **Workstation Contributors**: For building the comprehensive backend system

---

**Version**: 2.0.0  
**Last Updated**: 2025-11-21  
**Status**: ✅ Production Ready with Full Backend Integration
