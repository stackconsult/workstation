# Workstation Chrome Extension v2.0.0

## 🚀 Enterprise Browser Automation with 25+ AI Agents

**Production-ready Chrome extension with dynamic agent discovery, MCP sync, and performance monitoring.**

---

## ✨ New in v2.0.0

### 🤖 **Dynamic Agent Registry (25+ Agents)**
- Automatic agent discovery from `/agents/` directory
- Real-time agent health monitoring
- Multi-agent orchestration and routing
- Agent search and filtering by capabilities

### 🔄 **Enhanced MCP Sync**
- Browser-local state synchronization
- Conflict detection and resolution
- Offline support with automatic recovery
- State persistence and history tracking

### ⚡ **Performance Monitoring**
- Real-time metrics collection
- Health scoring and insights
- Alert system for performance issues
- Memory usage tracking

### 🔌 **Connection Pooling**
- Efficient resource management
- Connection reuse and lifecycle
- Automatic timeout and cleanup
- Health checks and statistics

### 📦 **One-Click Deployment**
- Automated build and packaging
- Pre-deployment validation
- Health checks and rollback support
- Deployment reporting

---

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- Chrome/Chromium browser
- Workstation backend running on `http://localhost:3000`

### Installation (3 Steps)

```bash
# 1. Deploy the extension
npm run deploy:chrome

# 2. Load in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select: build/chrome-extension/

# 3. Verify
# - Extension icon appears in toolbar
# - Click icon to open popup
# - Check that agents are discovered
```

**That's it!** The extension auto-connects to the backend and discovers all agents.

---

## 🏗️ Architecture

### Core Components

```
chrome-extension/
├── manifest.json                  # Extension manifest (v3)
├── background.js                  # Service worker with all integrations
├── content.js                     # Content script for page interaction
├── api-bridge.js                  # Backend API client
├── agent-registry.js              # Dynamic agent discovery & routing ⭐ NEW
├── mcp-client.js                  # MCP protocol implementation
├── mcp-sync-manager.js            # State sync with conflict resolution ⭐ NEW
├── popup/                         # User interface
│   ├── index.html
│   └── script.js
├── playwright/                    # Automation modules
│   ├── auto-wait.js
│   ├── network.js
│   ├── retry.js
│   ├── execution.js
│   ├── self-healing.js
│   ├── form-filling.js
│   ├── trace-recorder.js
│   ├── agentic-network.js
│   ├── context-learning.js
│   ├── connection-pool.js        # ⭐ NEW
│   └── performance-monitor.js    # ⭐ NEW
└── icons/                         # Extension icons
```

### Agent Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ Popup UI     │ Agent        │ MCP Sync            │    │
│  │              │ Registry     │ Manager             │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │ chrome.runtime.sendMessage()
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Background Service Worker                       │
│  ┌────────────┬─────────────┬──────────────┬─────────────┐ │
│  │ API Bridge │ Performance │ Connection   │ Agent       │ │
│  │            │ Monitor     │ Pool         │ Handlers    │ │
│  └────────────┴─────────────┴──────────────┴─────────────┘ │
└───┬────────────────┬───────────────┬────────────────────────┘
    │                │               │
    │ HTTP/REST      │ WebSocket     │ MCP Protocol
    ↓                ↓               ↓
┌─────────────┐  ┌─────────────┐  ┌──────────────────┐
│ Backend API │  │ WebSocket   │  │ MCP Server       │
│ :3000       │  │ Server      │  │ :7042            │
└─────────────┘  └─────────────┘  └──────────────────┘
                                   
                     ↓
          ┌──────────────────────────┐
          │ 25+ AI Agents            │
          │ - agent1-21              │
          │ - mainpage/codepage      │
          │ - repo-agent/curriculum  │
          │ - designer/edugit        │
          │ - wiki-artist/brarian    │
          └──────────────────────────┘
```

---

## 🤖 Agent Integration

### All 25+ Agents Supported

The extension dynamically discovers and integrates all agents:

**Build Setup Agents (1-6):**
- agent1: TypeScript API Architect
- agent2: Go Backend & Browser Automation
- agent3: Navigation Helper
- agent4: Branding & Visualization
- agent5: DevOps & Deployment
- agent6: Documentation & Training

**Weekly Cycle Agents (7-12):**
- agent7: Memory Refresh
- agent8: GitHub Metrics Collector
- agent9: Dependency & Security Auditor
- agent10: Guard Rails Agent
- agent11: Progress Tracker
- agent12: Communication & Reporting

**Extended Agents (13-21):**
- agent13: Testing & QA
- agent14: Performance Optimizer
- agent15: Code Review
- agent16: Integration Specialist
- agent17: Data Pipeline
- agent18: Monitoring & Alerts
- agent19: Backup & Recovery
- agent20: Compliance
- agent21: Innovation

**Special Agents:**
- mainpage: Navigation automation
- codepage: Code editing
- repo-agent: Repository management
- curriculum: Learning tasks
- designer: UI design
- edugit-codeagent: Education & Git
- repo-update-agent: Updates & maintenance
- wiki-artist: Documentation design
- wikibrarian: Documentation organization

### Using Agents from Extension

```javascript
// Get all agents
chrome.runtime.sendMessage({
  action: 'getAgentRegistry'
}, (response) => {
  console.log(`${response.stats.totalAgents} agents available`);
  console.log('Agents:', response.agents);
});

// Search agents by capability
chrome.runtime.sendMessage({
  action: 'searchAgents',
  query: 'documentation'
}, (response) => {
  console.log('Documentation agents:', response.agents);
});

// Get agent health
chrome.runtime.sendMessage({
  action: 'getSystemHealth'
}, (response) => {
  console.log(`System health: ${response.health.healthPercentage}%`);
});

// Trigger specific agent
chrome.runtime.sendMessage({
  action: 'triggerAgent',
  agentType: 'mainpage',
  params: {
    url: 'https://example.com',
    screenshot: true
  }
}, (response) => {
  console.log('Agent triggered:', response);
});
```

---

## 🔄 MCP Sync

### State Synchronization

The MCP Sync Manager ensures seamless state synchronization between browser and local MCP:

```javascript
// Update state (auto-syncs)
chrome.runtime.sendMessage({
  action: 'mcpSync',
  operation: 'update',
  key: 'workflow_state',
  value: { status: 'running', progress: 50 },
  source: 'browser'
});

// Get sync stats
chrome.runtime.sendMessage({
  action: 'getMCPSyncStats'
}, (response) => {
  console.log('Sync stats:', response.stats);
  console.log('Pending:', response.stats.pendingSync);
  console.log('Conflicts:', response.stats.unresolvedConflicts);
});

// Resolve conflict
chrome.runtime.sendMessage({
  action: 'resolveMCPConflict',
  conflictId: 'conflict_123',
  resolution: 'local'  // or 'remote'
});
```

### Features

- **Automatic Sync**: Syncs every 5 seconds when online
- **Offline Support**: Queues updates when offline, syncs when back online
- **Conflict Detection**: Detects timestamp conflicts automatically
- **Persistence**: Saves state to Chrome storage for recovery
- **History**: Tracks last 1000 sync operations

---

## ⚡ Performance Monitoring

### Real-Time Metrics

```javascript
// Get performance stats
chrome.runtime.sendMessage({
  action: 'getPerformanceStats'
}, (response) => {
  console.log('Success rate:', response.summary.successRate);
  console.log('Avg duration:', response.summary.averageDuration);
  console.log('Health score:', response.health.score);
  console.log('Insights:', response.insights);
});

// Get alerts
chrome.runtime.sendMessage({
  action: 'getPerformanceAlerts',
  count: 10
}, (response) => {
  response.alerts.forEach(alert => {
    console.log(`[${alert.level}] ${alert.message}`);
  });
});
```

### Monitored Metrics

- **Success Rate**: Percentage of successful operations
- **Average Duration**: Mean operation execution time
- **Memory Usage**: JS heap size tracking
- **Error Rate**: Failed operations percentage
- **Response Time**: API call latencies

### Health Scoring

- **100-80**: 🟢 Healthy - System operating optimally
- **79-50**: 🟡 Degraded - Minor issues detected
- **49-0**: 🔴 Unhealthy - Immediate attention required

---

## 🔌 Connection Pooling

### Efficient Resource Management

```javascript
// Get connection pool stats
chrome.runtime.sendMessage({
  action: 'getConnectionPoolStats'
}, (response) => {
  console.log('Total connections:', response.stats.totalConnections);
  console.log('In use:', response.stats.inUseConnections);
  console.log('Available:', response.stats.availableConnections);
  console.log('Utilization:', response.stats.utilizationRate + '%');
  console.log('Health:', response.health.score);
});
```

### Configuration

- **Max Connections**: 5 (configurable)
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 60 seconds
- **Auto Cleanup**: Destroys idle connections

---

## 📦 One-Click Deployment

### Using the Deployment Script

```bash
# Deploy extension
./scripts/deploy-chrome-extension.sh

# Or via npm
npm run deploy:chrome
```

### What It Does

1. ✅ **Prerequisites Check**: Validates Node.js, npm, extension files
2. ✅ **Manifest Validation**: Checks manifest.json syntax and fields
3. ✅ **Build Structure**: Creates clean build directory
4. ✅ **File Copy**: Copies all extension files
5. ✅ **Build Validation**: Ensures all required files present
6. ✅ **Health Checks**: Scans for issues (console.logs, TODOs, etc.)
7. ✅ **Package Creation**: Creates .zip file for distribution
8. ✅ **Deployment Report**: Generates comprehensive report

### Output

```
build/
├── chrome-extension/           # Unpacked extension
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── ... (all files)
│
workstation-extension-v2.0.0.zip  # Packaged extension
deployment-report-YYYYMMDD-HHMMSS.md  # Detailed report
deploy-YYYYMMDD-HHMMSS.log       # Deployment log
```

---

## 🧪 Testing

### Manual Testing Checklist

After deployment, verify:

- [ ] Extension loads without errors
- [ ] Background service worker initializes
- [ ] Popup UI displays correctly
- [ ] Agent registry discovers all agents
- [ ] MCP sync manager starts
- [ ] Performance monitor active
- [ ] Connection pool initialized
- [ ] Backend connection successful
- [ ] WebSocket connection established
- [ ] All tabs functional (Execute, Builder, Templates, History, Settings)

### Automated Validation

```bash
# Run extension tests
npm run test:chrome

# Check manifest validity
node -e "JSON.parse(require('fs').readFileSync('chrome-extension/manifest.json'))"

# Verify file sizes
du -h build/chrome-extension
```

---

## 🔧 Configuration

### Settings UI

Access via **Settings** tab in extension popup:

- **Backend URL**: API server endpoint (default: `http://localhost:3000`)
- **Poll Interval**: Status polling frequency (default: 2000ms)
- **Auto Retry**: Enable/disable automatic retries (default: enabled)
- **WebSocket**: Real-time updates connection (default: enabled)
- **MCP URL**: MCP server endpoint (default: `ws://localhost:7042/mcp`)

### Environment Variables

Set in backend `.env`:

```bash
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
PORT=3000
MCP_PORT=7042
```

---

## 🐛 Troubleshooting

### Extension Not Loading

**Symptoms**: Extension doesn't appear after loading
**Solution**:
1. Check Chrome console for errors
2. Verify manifest.json is valid JSON
3. Ensure all files are in build directory
4. Try reloading extension

### Agent Discovery Failed

**Symptoms**: "Using fallback agent list" message
**Solution**:
1. Ensure backend is running
2. Check backend endpoint: `http://localhost:3000/api/agents/discover`
3. Verify network connectivity
4. Check backend logs for errors

### MCP Sync Not Working

**Symptoms**: Pending syncs not clearing
**Solution**:
1. Check MCP server is running on port 7042
2. Verify WebSocket connection in DevTools
3. Check for network blocks
4. Force sync: `action: 'mcpSyncNow'`

### Performance Issues

**Symptoms**: Slow operations, high memory
**Solution**:
1. Check performance stats: `action: 'getPerformanceStats'`
2. Review alerts: `action: 'getPerformanceAlerts'`
3. Check insights for recommendations
4. Restart extension if health < 50

### Connection Pool Exhausted

**Symptoms**: "Connection pool timeout" errors
**Solution**:
1. Check pool stats: `action: 'getConnectionPoolStats'`
2. Verify connections are being released
3. Increase max connections if needed
4. Check for connection leaks

---

## 📊 Monitoring & Observability

### System Stats Logging

Background worker logs stats every minute:

```
📊 System Stats: {
  performance: "95.2% success, 124 ops",
  connections: "2/5 in use",
  agents: "28 total, 27 healthy",
  sync: "45/47 synced, 2 pending"
}
```

### Health Dashboard

Access via popup UI or programmatically:

```javascript
// Get comprehensive health status
Promise.all([
  sendMessage({ action: 'getSystemHealth' }),
  sendMessage({ action: 'getMCPSyncStats' }),
  sendMessage({ action: 'getPerformanceStats' }),
  sendMessage({ action: 'getConnectionPoolStats' })
]).then(([agents, sync, perf, pool]) => {
  const overallHealth = Math.min(
    agents.health.healthPercentage,
    sync.stats.syncHealth.score,
    perf.health.score,
    pool.health.score
  );
  
  console.log(`Overall System Health: ${overallHealth}%`);
});
```

---

## 🔒 Security

### Best Practices

- **Token Storage**: JWT tokens stored in Chrome's isolated storage
- **CORS**: Backend must allow extension origins
- **CSP**: Manifest v3 with strict content security policy
- **Permissions**: Minimal required permissions only
- **Secrets**: Never commit tokens or secrets

### Security Checklist

- [ ] JWT tokens not logged
- [ ] Secrets in environment variables
- [ ] HTTPS in production
- [ ] Input validation on all API calls
- [ ] Rate limiting respected
- [ ] Error messages don't leak sensitive info

---

## 🚀 Production Deployment

### Preparation

1. **Backend Setup**: Ensure production backend is ready
2. **Environment**: Set production URLs in settings
3. **Testing**: Complete full testing checklist
4. **Security**: Run security audit
5. **Documentation**: Update user guides

### Deployment Steps

```bash
# 1. Build for production
NODE_ENV=production ./scripts/deploy-chrome-extension.sh

# 2. Update manifest for production
# - Change backend URL if hardcoded
# - Update version number
# - Add production icons

# 3. Package for Chrome Web Store
# - Create promotional images
# - Write store description
# - Set privacy policy

# 4. Submit to Chrome Web Store
# - Upload .zip file
# - Complete store listing
# - Wait for review (~2-3 days)
```

### Chrome Web Store

- **Name**: Workstation AI Agent
- **Category**: Productivity / Developer Tools
- **Description**: Enterprise browser automation with 25+ AI agents
- **Version**: 2.0.0
- **Privacy**: Links to your privacy policy
- **Support**: Email or GitHub Issues

---

## 📚 API Reference

See [EXTENSION_API.md](./EXTENSION_API.md) for complete API documentation.

### Quick Reference

```javascript
// Agent Registry
{ action: 'getAgentRegistry' }
{ action: 'getAgentsByType', agentType: 'build-setup' }
{ action: 'searchAgents', query: 'keyword' }
{ action: 'getAgentHealth', agentId: 'agent1' }
{ action: 'getSystemHealth' }

// MCP Sync
{ action: 'mcpSync', operation: 'update', key, value, source }
{ action: 'mcpSyncNow' }
{ action: 'getMCPSyncStats' }
{ action: 'getMCPConflicts' }
{ action: 'resolveMCPConflict', conflictId, resolution }

// Performance
{ action: 'getPerformanceStats' }
{ action: 'getPerformanceAlerts', count: 10 }

// Connection Pool
{ action: 'getConnectionPoolStats' }
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Install dependencies
npm install

# Make changes to chrome-extension/

# Test changes
./scripts/deploy-chrome-extension.sh
# Load build/chrome-extension in Chrome

# Run tests
npm run test:chrome
```

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.

---

## 🙏 Acknowledgments

- **Playwright Team**: Browser automation framework
- **Chrome Extensions Team**: Extension platform
- **Contributors**: All Workstation contributors

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)
- **Documentation**: [docs/](../docs/)

---

**Version**: 2.0.0  
**Last Updated**: 2025-11-24  
**Status**: ✅ Production Ready - Enterprise Grade

**Next Release (v2.1)**: AI-powered workflow suggestions, collaborative sharing, advanced analytics
