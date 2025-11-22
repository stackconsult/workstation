# 📊 Dashboard Auto-Update System Guide

**Version**: 1.1.0  
**Status**: ✅ Active  
**Last Updated**: 2025-11-22

---

## 🎯 Overview

The Workstation dashboard now features a **self-updating system** with comprehensive error handling, automatic recovery, real-time statistics, and **automated deployment buttons** for production environments. This guide explains the new features and how to use them.

---

## ✨ New Features

### 1. Automated Deployment Buttons (NEW!)

The dashboard now includes a dedicated **Automated Deployment** section with three one-click deployment options:

#### 📊 Dashboard UI Deployment
- **Purpose**: Build and deploy the dashboard interface
- **Action**: Runs `npm run build` to compile TypeScript and prepare assets
- **Use Case**: Quick dashboard updates without full system restart
- **Status Indicator**: Shows build progress and completion

#### 🔌 Chrome Extension Deployment  
- **Purpose**: Build Chrome extension for production
- **Action**: Runs `npm run build:chrome` to create extension package
- **Output**: Extension built to `build/chrome-extension/`
- **Use Case**: Update Chrome extension without redeploying full stack
- **Load**: Ready to load from chrome://extensions/

#### ⚡ Full Stack Deployment
- **Purpose**: Complete system deployment (Production Ready)
- **Action**: Executes `one-click-deploy.sh` script
- **Features**:
  - Installs dependencies
  - Builds TypeScript code
  - Builds Chrome extension
  - Starts backend server
  - Configures environment
- **Use Case**: Fresh deployment or major updates
- **Log Output**: Check `/tmp/deployment.log` for details

**Benefits:**
- One-click deployment from UI (no CLI needed)
- Real-time status feedback
- Post-production environment support
- Automated build verification
- Error reporting and recovery

### 2. Auto-Updating Dashboard

The dashboard automatically refreshes data at configurable intervals:

- **User Statistics**: Refreshes every 30 seconds
- **Repository Stats**: Refreshes every 60 seconds
- **Agent Status**: Refreshes with user statistics
- **Visual Feedback**: Pulse animations and last update timestamps

**Benefits:**
- Always see current data without manual refresh
- Reduced page load times with smart caching
- Automatic pause when browser tab is inactive (saves resources)

### 3. Self-Healing Auto-Update Bot

The repo-update-agent workflow now includes:

- **Error Recovery**: Automatic rollback on failure
- **Retry Logic**: 3 attempts for git push operations
- **Health Checks**: Validates critical files before proceeding
- **Manual Rollback**: Trigger rollback via workflow dispatch
- **Comprehensive Logging**: Detailed status in workflow summaries

**Benefits:**
- No more stuck workflows or failed updates
- Automatic recovery from transient errors
- Clear visibility into update status
- Easy manual intervention when needed

### 3. Real-Time Repository Statistics

New public API endpoint provides:

- Total files tracked in repository
- Lines of production code
- Number of active agents
- MCP container count
- Recent commit activity (24h)
- Last auto-update timestamp

**Benefits:**
- Organization-wide visibility
- No authentication required for public stats
- 5-minute caching for performance
- Fallback data on errors

---

## 🚀 Quick Start

### Access the Enhanced Dashboard

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000/dashboard.html
   ```

3. **Features available immediately:**
   - Organization statistics banner at the top
   - Real-time auto-refresh indicators
   - Health status with pulse animation
   - Manual refresh button

### Using the Auto-Update Bot

#### Automatic Updates

The bot runs automatically **daily at 9:00 PM UTC**. No action needed!

#### Manual Trigger

```bash
# Trigger update now
gh workflow run repo-update-agent.yml

# Dry run (preview changes)
gh workflow run repo-update-agent.yml -f dry_run=true

# Force rollback to yesterday
gh workflow run repo-update-agent.yml -f force_rollback=true
```

#### Monitor Status

```bash
# View latest workflow runs
gh run list --workflow=repo-update-agent.yml

# View specific run details
gh run view <run-id>
```

### GET /api/dashboard/deploy/status

Returns current deployment system status.

**Authentication**: None required  
**Rate Limit**: No limit

**Response:**
```json
{
  "success": true,
  "data": {
    "isDeploying": false,
    "lastDeployment": {
      "timestamp": "2025-11-22T09:00:00.000Z",
      "logPath": "/tmp/deployment.log"
    },
    "environment": "production",
    "ready": true
  }
}
```

### POST /api/dashboard/deploy

Trigger automated deployment.

**Authentication**: None required (consider adding for production)  
**Rate Limit**: Recommended to add

**Request Body:**
```json
{
  "target": "dashboard|chrome|full",
  "environment": "production"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "target": "chrome",
    "environment": "production",
    "status": "started",
    "message": "Building Chrome extension started",
    "command": "npm run build:chrome"
  }
}
```

**Targets:**
- `dashboard`: Builds dashboard UI only
- `chrome`: Builds Chrome extension only
- `full`: Runs complete one-click deployment

---

## 📖 API Documentation (continued)

### GET /api/dashboard/repo-stats

Returns cached repository statistics.

**Authentication**: None required  
**Rate Limit**: No limit (cached)

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-11-21T23:00:00.000Z",
    "repository": {
      "name": "creditXcredit/workstation",
      "description": "Privacy-First Browser Automation Platform"
    },
    "files": {
      "total": 753,
      "typescript": 116,
      "tests": 59,
      "documentation": 321
    },
    "codeMetrics": {
      "productionLoc": 8681,
      "testLoc": 2742
    },
    "infrastructure": {
      "agents": 21,
      "mcpContainers": 22,
      "workflows": 35
    },
    "activity": {
      "commitsLast24h": 5
    },
    "lastAutoUpdate": "2025-11-21 21:00 UTC",
    "agentSystem": {
      "totalAgents": 21,
      "activeAgents": 21,
      "status": "operational"
    }
  },
  "cached": true,
  "cacheAge": 120,
  "nextUpdate": 180
}
```

**Fields:**
- `cached`: Whether data is from cache
- `cacheAge`: Seconds since cache was updated
- `nextUpdate`: Seconds until cache refresh

### GET /api/dashboard/agent-status

Returns detailed agent system status.

**Authentication**: None required

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent1",
        "name": "TypeScript API Architect",
        "status": "active",
        "lastActive": "2025-11-21T23:00:00.000Z"
      }
    ],
    "totalAgents": 21,
    "activeAgents": 21,
    "systemStatus": "operational"
  }
}
```

---

## 🛠️ Configuration

### Auto-Refresh Intervals

Edit `public/js/dashboard.js`:

```javascript
// Change refresh intervals
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds for user data
const REPO_STATS_INTERVAL = 60000;   // 60 seconds for repo stats
```

### Cache TTL

Edit `src/routes/dashboard.ts`:

```typescript
let repoStatsCache: RepoStatsCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes (change this value)
};
```

### Workflow Schedule

Edit `.github/workflows/repo-update-agent.yml`:

```yaml
on:
  schedule:
    - cron: '0 21 * * *'  # 9:00 PM UTC (change this)
```

**Cron Format**: `minute hour day month weekday`

**Examples:**
- `0 0 * * *` - Midnight UTC daily
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1` - 9 AM UTC every Monday

---

## 🔧 Troubleshooting

### Auto-Update Bot Issues

#### Workflow Failed

**Symptoms:**
- Failed status in GitHub Actions
- No recent updates in REPO_UPDATE_TASKS.md

**Solution:**
```bash
# Check workflow status
gh run list --workflow=repo-update-agent.yml --limit 5

# View error logs
gh run view <run-id> --log-failed

# Trigger manual rollback
gh workflow run repo-update-agent.yml -f force_rollback=true
```

#### Statistics Incorrect

**Symptoms:**
- Zero values in statistics
- Missing data fields

**Solution:**
1. Check if git commands work in workflow
2. Verify file paths are correct
3. Review workflow logs for script errors
4. Trigger dry run to preview:
   ```bash
   gh workflow run repo-update-agent.yml -f dry_run=true
   ```

### Dashboard Issues

#### Stats Not Updating

**Symptoms:**
- Last refresh time frozen
- Data appears stale

**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify API endpoints are accessible:
   ```bash
   curl http://localhost:3000/api/dashboard/repo-stats
   ```
4. Check server logs for errors
5. Try manual refresh button

#### Auto-Refresh Not Working

**Symptoms:**
- No refresh happening automatically
- Manual refresh works

**Solution:**
1. Check browser console for errors
2. Verify `startAutoRefresh()` is called
3. Check if page visibility API is pausing refresh
4. Reload the page

#### Cache Issues

**Symptoms:**
- Very old data displayed
- Cache age very high

**Solution:**
1. Wait for TTL expiration (5 minutes)
2. Restart the server to clear cache
3. Or manually clear in code:
   ```javascript
   // In browser console
   fetch('/api/dashboard/repo-stats', { cache: 'reload' })
   ```

---

## 📈 Monitoring & Alerts

### Workflow Monitoring

**GitHub Actions UI:**
1. Go to repository → Actions tab
2. Filter by "Repo Update Agent"
3. Check recent runs for failures

**Workflow Artifacts:**
- Each run uploads `update-summary-<run-id>.md`
- Contains detailed statistics and status
- Retained for 30 days

**Email Notifications:**
GitHub will email on workflow failures if enabled in settings.

### Dashboard Health

**Visual Indicators:**
- 🟢 Green pulse: System healthy
- 🟡 Yellow: System degraded
- 🔴 Red: System error

**System Health Criteria:**
- `Healthy`: Agents > 0 && Workflows > 0
- `Degraded`: Missing data or low counts
- `Error`: API endpoint failures

---

## 🔐 Security Considerations

### Public Endpoints

The following endpoints are public (no auth):
- `/api/dashboard/repo-stats`
- `/api/dashboard/agent-status`

**Data Exposed:**
- Repository statistics (file counts, LOC)
- Agent names and status
- Workflow counts
- Commit activity

**NOT Exposed:**
- User data
- Workflow definitions
- Execution logs
- Authentication tokens

**Mitigation:**
- All data is read-only
- No sensitive information included
- Rate limiting via cache (5min TTL)
- Can be disabled by removing endpoints

### Workflow Security

**Secrets Used:**
- `GITHUB_TOKEN` - Automatically provided, scoped to repo

**Permissions Required:**
```yaml
permissions:
  contents: write      # For committing updates
  pull-requests: read  # For reading PR data
  issues: read         # For reading issue data
```

**Best Practices:**
- Never commit sensitive data
- Rollback files are in `.gitignore` (no sensitive data anyway)
- Workflow runs are public (repository public)

---

## 🎨 Customization

### Dashboard Styling

The new dashboard includes enhanced CSS. Edit `public/dashboard.html` inline styles or create custom CSS file.

**Current Features:**
- Gradient background for org stats
- Pulse animations
- Responsive grid layout
- Status indicators with colors

**Customization Examples:**

```css
/* Change gradient colors */
.repo-stats-section {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

/* Change pulse animation speed */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
  /* Adjust timing in animation property */
}

/* Change health indicator colors */
.health-indicator.healthy {
  background-color: #your-success-color;
}
```

### Add Custom Statistics

1. **Collect data in workflow:**
   ```yaml
   - name: Get custom stat
     run: |
       CUSTOM_STAT=$(your-command-here)
       echo "custom_stat=$CUSTOM_STAT" >> $GITHUB_OUTPUT
   ```

2. **Add to API response in `src/routes/dashboard.ts`:**
   ```typescript
   stats.customMetric = {
     value: parseInt(customStat.trim()) || 0
   };
   ```

3. **Display in HTML:**
   ```html
   <div class="repo-stat-item">
     <span id="custom-stat" class="repo-stat-value">-</span>
     <span class="repo-stat-label">Custom Stat</span>
   </div>
   ```

4. **Update in JavaScript:**
   ```javascript
   function displayRepoStats(stats) {
     if (stats.customMetric) {
       document.getElementById('custom-stat').textContent = stats.customMetric.value;
     }
   }
   ```

---

## 📚 Related Documentation

- [Repo Update Agent README](../agents/repo-update-agent/README.md) - Agent details
- [GitHub Actions Workflows](../.github/workflows/README.md) - Workflow documentation
- [API Documentation](./api/API.md) - Complete API reference
- [Dashboard Routes](../src/routes/dashboard.ts) - Backend implementation
- [Rollback Procedures](../ROLLBACK_PROCEDURES.md) - Rollback guide

---

## 🆘 Support

### Getting Help

- **Documentation**: Check this guide first
- **Issues**: [GitHub Issues](https://github.com/creditXcredit/workstation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)
- **Logs**: Check GitHub Actions logs for workflow issues

### Reporting Bugs

Include:
1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Browser console errors (for dashboard)
5. Workflow logs (for auto-update bot)
6. Screenshots if helpful

---

## 🚀 Future Enhancements

Planned improvements:

- [ ] WebSocket support for real-time updates (eliminate polling)
- [ ] Configurable alert thresholds
- [ ] Email notifications for critical events
- [ ] Dashboard customization UI
- [ ] Historical trend charts
- [ ] Export statistics as CSV/JSON
- [ ] Mobile-optimized dashboard view
- [ ] Dark mode support

---

## 📝 Changelog

### Version 1.1.0 (2025-11-21)
- ✅ Added comprehensive error handling to repo-update-agent
- ✅ Implemented self-healing rollback mechanism
- ✅ Created auto-refreshing dashboard
- ✅ Added public statistics API endpoints
- ✅ Enhanced visual design with gradients and animations
- ✅ Implemented intelligent caching with TTL
- ✅ Added health indicators and status monitoring
- ✅ Created manual refresh functionality
- ✅ Added page visibility API integration

### Version 1.0.0 (Previous)
- Basic dashboard with user statistics
- Manual repo-update-agent workflow
- Simple API endpoints

---

**Built with ❤️ for the creditXcredit organization**
